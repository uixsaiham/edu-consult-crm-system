import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { SmsCategory, SmsStatus } from "./rules";

// Twilio access for the /api/sms routes. Credentials come only from server environment
// variables (.env.local in development, the host's secret store in production) — never from
// code, never sent to the browser. See docs/sms-twilio.md for the variable list.

export type SmsMode = "off" | "test" | "live";

function env(name: string) {
  return process.env[name]?.trim() || "";
}

export function smsConfig() {
  const accountSid = env("TWILIO_ACCOUNT_SID");
  const keySid = env("TWILIO_API_KEY_SID");
  const keySecret = env("TWILIO_API_KEY_SECRET");
  const authToken = env("TWILIO_AUTH_TOKEN");
  const serviceSid = env("TWILIO_SERVICE_MESSAGING_SID");
  const marketingSid = env("TWILIO_MARKETING_MESSAGING_SID");
  const rawMode = env("SMS_MODE") as SmsMode;
  const allowlist = env("SMS_TEST_ALLOWLIST").split(",").map((n) => n.trim()).filter(Boolean);
  const publicBaseUrl = env("SMS_PUBLIC_BASE_URL").replace(/\/$/, "");

  const missing = [
    !accountSid && "TWILIO_ACCOUNT_SID",
    !(keySid && keySecret) && !authToken && "TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET",
    !serviceSid && "TWILIO_SERVICE_MESSAGING_SID",
  ].filter(Boolean) as string[];

  return {
    configured: missing.length === 0,
    missing,
    mode: (["off", "test", "live"].includes(rawMode) ? rawMode : "test") as SmsMode,
    accountSid,
    // Prefer a revocable API key; fall back to the auth token only if no key is set.
    auth: keySid && keySecret ? `${keySid}:${keySecret}` : `${accountSid}:${authToken}`,
    authToken,
    serviceSid,
    marketingSid,
    allowlist,
    publicBaseUrl,
  };
}

/** "AC1234…9f" — enough to recognise an ID without exposing it. */
export const mask = (sid: string) => (sid.length > 10 ? `${sid.slice(0, 6)}…${sid.slice(-4)}` : sid ? "••••" : "");
export const maskPhone = (n: string) => (n.length > 6 ? `${n.slice(0, 4)} ••• ${n.slice(-3)}` : n);

async function twilio<T>(url: string, init?: RequestInit): Promise<T> {
  const cfg = smsConfig();
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Basic ${Buffer.from(cfg.auth).toString("base64")}`, ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { code?: number; message?: string };
  if (!res.ok) throw new TwilioError(data.message ?? `Twilio returned ${res.status}`, data.code ? String(data.code) : undefined, res.status);
  return data;
}

export class TwilioError extends Error {
  constructor(message: string, public code?: string, public status?: number) {
    super(message);
  }
}

const api = (path: string) => `https://api.twilio.com/2010-04-01/Accounts/${smsConfig().accountSid}${path}`;

// --- Sending -------------------------------------------------------------------------------

export interface SentMessage {
  sid: string;
  status: SmsStatus;
  to: string;
  segments: number;
  price?: string;
  errorCode?: string;
}

interface TwilioMessage {
  sid: string;
  status: SmsStatus;
  to: string;
  num_segments: string;
  price: string | null;
  price_unit: string;
  error_code: number | null;
}

const toSent = (m: TwilioMessage): SentMessage => ({
  sid: m.sid,
  status: m.status,
  to: m.to,
  segments: Number(m.num_segments) || 1,
  price: m.price ? `${Math.abs(Number(m.price)).toFixed(4)} ${m.price_unit}` : undefined,
  errorCode: m.error_code ? String(m.error_code) : undefined,
});

/** Sends through the service or marketing Messaging Service, so each has its own sender and opt-out list. */
export async function sendSms(to: string, body: string, category: SmsCategory): Promise<SentMessage> {
  const cfg = smsConfig();
  const form = new URLSearchParams({
    To: to,
    Body: body,
    MessagingServiceSid: category === "marketing" && cfg.marketingSid ? cfg.marketingSid : cfg.serviceSid,
  });
  if (cfg.publicBaseUrl) form.set("StatusCallback", `${cfg.publicBaseUrl}/api/sms/webhooks/status`);
  const m = await twilio<TwilioMessage>(api("/Messages.json"), { method: "POST", body: form, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  return toSent(m);
}

export async function fetchMessage(sid: string): Promise<SentMessage> {
  if (!/^(SM|MM)[0-9a-f]{32}$/.test(sid)) throw new TwilioError("Not a message SID", undefined, 400);
  return toSent(await twilio<TwilioMessage>(api(`/Messages/${sid}.json`)));
}

// --- Account review (read-only) ------------------------------------------------------------------

/** Everything the Setup page needs to review the account — no secrets are returned. */
export async function reviewAccount() {
  const cfg = smsConfig();
  const account = await twilio<{ friendly_name: string; status: string; type: string }>(api(".json"));
  const balance = await twilio<{ balance: string; currency: string }>(api("/Balance.json")).catch(() => null);
  const numbers = await twilio<{ incoming_phone_numbers: { phone_number: string; friendly_name: string; capabilities: { sms: boolean; mms: boolean; voice: boolean } }[] }>(api("/IncomingPhoneNumbers.json?PageSize=50"));

  const services = await Promise.all(
    [
      { role: "Service messages", sid: cfg.serviceSid },
      { role: "Marketing", sid: cfg.marketingSid },
    ]
      .filter((s) => s.sid)
      .map(async (s) => {
        const base = `https://messaging.twilio.com/v1/Services/${s.sid}`;
        try {
          const svc = await twilio<{ friendly_name: string; use_inbound_webhook_on_number: boolean; inbound_request_url: string | null; status_callback: string | null; usecase: string }>(base);
          const [phones, alphas] = await Promise.all([
            twilio<{ phone_numbers?: { phone_number: string; country_code: string }[] }>(`${base}/PhoneNumbers?PageSize=50`).then((r) => r.phone_numbers ?? []),
            twilio<{ alpha_senders?: { alpha_sender: string }[] }>(`${base}/AlphaSenders?PageSize=20`).then((r) => r.alpha_senders ?? []),
          ]);
          return {
            role: s.role,
            sid: mask(s.sid),
            name: svc.friendly_name,
            usecase: svc.usecase,
            inboundWebhook: !!svc.inbound_request_url,
            statusCallback: !!svc.status_callback,
            senders: [...alphas.map((a) => ({ kind: "Alphanumeric sender ID", value: a.alpha_sender, country: "" })), ...phones.map((p) => ({ kind: "Phone number", value: p.phone_number, country: p.country_code }))],
          };
        } catch (e) {
          return { role: s.role, sid: mask(s.sid), error: (e as Error).message };
        }
      })
  );

  const pricing = await Promise.all(
    ["GB", "BD"].map((iso) =>
      twilio<{ country: string; price_unit: string; outbound_sms_prices: { carrier: string; prices: { number_type: string; current_price: string }[] }[] }>(`https://pricing.twilio.com/v1/Messaging/Countries/${iso}`)
        .then((p) => ({ country: p.country, unit: p.price_unit, carriers: p.outbound_sms_prices.slice(0, 6).map((c) => ({ carrier: c.carrier, price: c.prices[0]?.current_price })) }))
        .catch(() => null)
    )
  );

  return {
    account: { name: account.friendly_name, status: account.status, type: account.type, sid: mask(cfg.accountSid) },
    balance: balance ? `${Number(balance.balance).toFixed(2)} ${balance.currency}` : null,
    numbers: numbers.incoming_phone_numbers.map((n) => ({ number: n.phone_number, name: n.friendly_name, sms: n.capabilities.sms })),
    services,
    pricing: pricing.filter(Boolean),
  };
}

// --- Webhooks ------------------------------------------------------------------------------------

/**
 * Twilio signs each webhook: HMAC-SHA1 of the full URL plus the POST params sorted by name,
 * keyed with the account's auth token. Anything unsigned or mis-signed is rejected.
 */
export function validSignature(url: string, params: Record<string, string>, signature: string | null) {
  const { authToken } = smsConfig();
  if (!authToken || !signature) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", authToken).update(data, "utf8").digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

// --- Server-side record ----------------------------------------------------------------------------
// In-memory until the CRM has a database: delivery updates from webhooks and STOP/START replies.
// Kept on globalThis so it survives dev hot reloads.

interface SmsServerState {
  statuses: Map<string, { status: SmsStatus; errorCode?: string; at: string }>;
  optedOut: Map<string, { at: string; via: string }>;
  sentToday: { day: string; count: number };
}
const g = globalThis as typeof globalThis & { __bheSms?: SmsServerState };
export const smsState: SmsServerState = (g.__bheSms ??= { statuses: new Map(), optedOut: new Map(), sentToday: { day: "", count: 0 } });

/** Hard ceiling per day while testing, whatever the UI asks for. */
export const TEST_DAILY_LIMIT = 50;
