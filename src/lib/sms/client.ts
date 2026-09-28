"use client";

import { useCallback, useEffect, useState } from "react";
import { eligibility, estimateCost, finalStatuses, segmentInfo, type ServiceTopic, type SmsCategory } from "@/lib/sms/rules";
import { nextSmsId, type SmsContact, type SmsMessage } from "@/lib/mock/sms";

export interface SmsConnection {
  configured: boolean;
  missing: string[];
  mode: "off" | "test" | "live";
  account: string;
  usingApiKey: boolean;
  serviceSid: string;
  marketingSid: string;
  allowlist: string[];
  webhooks: { signing: boolean; publicUrl: boolean };
  review?: AccountReview;
  reviewError?: string;
}

export interface AccountReview {
  account: { name: string; status: string; type: string; sid: string };
  balance: string | null;
  numbers: { number: string; name: string; sms: boolean }[];
  services: ({ role: string; sid: string; name: string; usecase: string; inboundWebhook: boolean; statusCallback: boolean; senders: { kind: string; value: string; country: string }[] } | { role: string; sid: string; error: string })[];
  pricing: { country: string; unit: string; carriers: { carrier: string; price: string }[] }[];
}

/** Reads /api/sms/status. `review` also asks the server to review the Twilio account. */
export function useSmsConnection() {
  const [conn, setConn] = useState<SmsConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (review = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sms/status${review ? "?review=1" : ""}`, { cache: "no-store" });
      setConn((await res.json()) as SmsConnection);
    } catch {
      setConn(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let live = true;
    fetch("/api/sms/status", { cache: "no-store" })
      .then((r) => r.json() as Promise<SmsConnection>)
      .then((d) => live && setConn(d))
      .catch(() => undefined)
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);
  return { conn, loading, reload: load };
}

/** Whether a send goes to Twilio (test or live) or is only simulated in the CRM. */
export const sendsForReal = (conn: SmsConnection | null) => !!conn?.configured && conn.mode !== "off";

/**
 * Sends one message: consent is checked first (blocked messages are still logged, so the
 * history shows the attempt), then the server sends it through Twilio — or, when Twilio
 * isn't connected, it's recorded as simulated.
 */
export async function deliver(opts: { contact: SmsContact; body: string; category: SmsCategory; topic: ServiceTopic | "Marketing"; by: string; conn: SmsConnection | null; campaignId?: string }): Promise<SmsMessage> {
  const { contact, body, category, topic, by, conn, campaignId } = opts;
  const seg = segmentInfo(body).segments;
  const base: SmsMessage = {
    id: nextSmsId(), contactId: contact.id, to: contact.phone, body, category, topic, campaignId, status: "queued",
    segments: seg, costGbp: estimateCost([contact.phone], seg).gbp, sentAt: new Date().toISOString(), sentBy: by, via: "simulated",
  };
  const ok = eligibility(contact.consent, category, contact.phone);
  if (!ok.ok) return { ...base, status: "blocked", blockedReason: ok.reason, costGbp: 0 };
  if (!sendsForReal(conn)) return { ...base, status: "simulated" };

  try {
    const res = await fetch("/api/sms/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: contact.phone, body, category }) });
    const data = (await res.json()) as { sid?: string; status?: SmsMessage["status"]; segments?: number; error?: string; code?: string; blocked?: boolean };
    if (!res.ok) return { ...base, via: "twilio", status: data.blocked ? "blocked" : "failed", blockedReason: data.error, errorCode: data.code, costGbp: 0 };
    return { ...base, via: "twilio", sid: data.sid, status: data.status ?? "queued", segments: data.segments ?? seg };
  } catch {
    return { ...base, via: "twilio", status: "failed", blockedReason: "Couldn't reach the CRM server", costGbp: 0 };
  }
}

/** Asks the server for the latest status of any real message that hasn't reached a final state. */
export async function refreshStatuses(list: SmsMessage[]): Promise<Map<string, Pick<SmsMessage, "status" | "errorCode">>> {
  const open = list.filter((m) => m.sid && m.via === "twilio" && !finalStatuses.includes(m.status)).map((m) => m.sid!);
  const out = new Map<string, Pick<SmsMessage, "status" | "errorCode">>();
  if (!open.length) return out;
  try {
    const res = await fetch(`/api/sms/messages?sids=${open.slice(0, 50).join(",")}`, { cache: "no-store" });
    const data = (await res.json()) as { messages: { sid: string; status?: SmsMessage["status"]; errorCode?: string }[] };
    data.messages.forEach((m) => m.status && out.set(m.sid, { status: m.status, errorCode: m.errorCode }));
  } catch {
    /* keep current statuses */
  }
  return out;
}

/** Numbers the server has seen reply STOP (via Twilio's inbound webhook). */
export async function fetchServerOptOuts(numbers: string[]) {
  try {
    const res = await fetch("/api/sms/opt-outs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ numbers }) });
    return ((await res.json()) as { optedOut: { number: string; at: string; via: string }[] }).optedOut;
  } catch {
    return [];
  }
}
