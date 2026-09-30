"use client";

export const dynamic = 'force-dynamic';

import { useState, type ReactNode } from "react";
import { CheckCircle2, Circle, CircleAlert, Clock3, FlaskConical, KeyRound, Loader2, RefreshCw, Send, ServerCog } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { ConnectionBanner, Notice, SmsStatusBadge } from "@/components/sms/sms-ui";
import { useSmsConnection } from "@/lib/sms/client";
import { FAILED_FEE_USD, formatGbp, segmentInfo, smsRatesUsd, toE164, USD_TO_GBP, type SmsStatus } from "@/lib/sms/rules";
import { cn } from "@/lib/utils";

const phases: { name: string; when: string; state: "now" | "next" | "later"; items: string[]; gate?: string }[] = [
  {
    name: "0 · Account review & sender setup",
    when: "Week 1 · 29 Sep – 3 Oct",
    state: "now",
    items: [
      "Create a restricted API key for the CRM; add it and the other variables to the server's secret store (never to code or documents)",
      "Create two Messaging Services: “BHE Uni – Service” and “BHE Uni – Marketing”",
      "Service: add alphanumeric sender “BHEUni” (UK, free, one-way) with a UK mobile number as fallback",
      "Marketing: buy a UK mobile number (two-way, so people can reply STOP); turn on Advanced Opt-Out",
      "Start Bangladesh sender ID registration now if SMS to BD contacts is wanted — it takes about 3 weeks",
      "Review the account below: upgrade from Trial if needed, set a low balance alert and auto-recharge cap",
    ],
  },
  {
    name: "1 · Internal test",
    when: "Weeks 2–3 · 6 – 17 Oct",
    state: "next",
    items: [
      "SMS_MODE=test with 3–5 staff numbers on the allowlist; the server refuses every other number",
      "Send each service template and one campaign to the internal group; check wording on real phones",
      "Reply STOP and START from a test phone; confirm the CRM records it and blocks the next send",
      "Expose the webhooks on a public URL (staging) and confirm delivery receipts arrive and are signed",
      "Reconcile the CRM's cost estimates with Twilio's usage report",
    ],
  },
  {
    name: "2 · Pilot: service messages, one branch",
    when: "Weeks 4–6 · 20 Oct – 7 Nov",
    state: "later",
    gate: "Needs CRM sign-in and a database first — the SMS API must only accept requests from signed-in staff, and consent/history must survive restarts.",
    items: [
      "Unlock live mode for service messages only; London branch applicants first",
      "Application status, document requests and appointment reminders",
      "Weekly check: delivery rate, failures by error code, cost vs estimate, complaints",
    ],
  },
  {
    name: "3 · All branches + first marketing campaign",
    when: "Weeks 7–9 · 10 – 28 Nov",
    state: "later",
    items: [
      "Add an unticked “Text me about courses and events” box to enquiry forms and the student portal, so opt-ins are captured with evidence",
      "First UK campaign to opted-in contacts only (January 2027 intake)",
      "Ambassador programme texts to ambassadors and opted-in applicants",
    ],
  },
  {
    name: "4 · Bangladesh",
    when: "From December, once the sender ID is registered",
    state: "later",
    items: ["Decide SMS vs WhatsApp per message type — SMS to Bangladesh costs ~10× the UK rate", "Pilot with Dhaka HQ and Sylhet service messages"],
  },
];

export default function SmsSetupPage() {
  const { conn, loading, reload } = useSmsConnection();
  const [reviewing, setReviewing] = useState(false);
  const review = async () => {
    setReviewing(true);
    await reload(true);
    setReviewing(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">SMS Setup</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Twilio connection, UK sender setup, sending costs and the rollout plan. Credentials live only in the server&apos;s environment — this page shows whether they&apos;re set, never their values.</p>
        </div>
        <button type="button" onClick={review} disabled={!conn?.configured || reviewing} className={cn(buttonPrimary, "disabled:opacity-50")}>
          {reviewing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Review Twilio account
        </button>
      </header>

      <ConnectionBanner conn={conn} loading={loading} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <SectionTitle icon={KeyRound} title="Connection" subtitle="Read from the server's environment variables" />
          <ul className="mt-4 flex flex-col divide-y divide-border text-xs">
            <Check ok={!!conn?.account} label="TWILIO_ACCOUNT_SID" value={conn?.account} />
            <Check ok={!!conn?.usingApiKey} warn={!!conn?.configured && !conn?.usingApiKey} label="TWILIO_API_KEY_SID + _SECRET" value={conn?.usingApiKey ? "API key in use" : conn?.configured ? "Using auth token — switch to an API key" : undefined} />
            <Check ok={!!conn?.serviceSid} label="TWILIO_SERVICE_MESSAGING_SID" value={conn?.serviceSid} />
            <Check ok={!!conn?.marketingSid} warn label="TWILIO_MARKETING_MESSAGING_SID" value={conn?.marketingSid || "Needed before any campaign"} />
            <Check ok={!!conn?.webhooks.signing} warn label="TWILIO_AUTH_TOKEN (webhook signatures)" value={conn?.webhooks.signing ? "Set" : "Needed to accept delivery receipts and STOP replies"} />
            <Check ok={!!conn?.webhooks.publicUrl} warn label="SMS_PUBLIC_BASE_URL" value={conn?.webhooks.publicUrl ? "Set" : "Needed for delivery receipts (status is polled until then)"} />
            <Check ok={conn?.mode === "test"} warn label="SMS_MODE" value={conn ? `${conn.mode}${conn.mode === "test" ? ` · ${conn.allowlist.length} allowlisted: ${conn.allowlist.join(", ") || "none"}` : ""}` : undefined} />
          </ul>
          {!conn?.configured && (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-foreground">To connect</p>
              <p className="text-xs text-muted-foreground">Whoever holds the Twilio login creates <code className="rounded bg-surface-muted px-1">.env.local</code> in the project root (already git-ignored) — or adds the same names to the hosting provider&apos;s secret settings — then restarts the server. Values stay on the server; don&apos;t paste them into chat, tickets or documents.</p>
              <pre className="overflow-x-auto rounded-xl bg-surface-muted p-3 font-mono text-[11px] leading-relaxed text-foreground">{`TWILIO_ACCOUNT_SID=AC…
TWILIO_API_KEY_SID=SK…
TWILIO_API_KEY_SECRET=…
TWILIO_AUTH_TOKEN=…
TWILIO_SERVICE_MESSAGING_SID=MG…
TWILIO_MARKETING_MESSAGING_SID=MG…
SMS_MODE=test
SMS_TEST_ALLOWLIST=+447…,+447…
SMS_PUBLIC_BASE_URL=https://crm-staging.example.com`}</pre>
              <p className="text-[11px] text-muted-foreground">Full steps: <code>docs/sms-twilio.md</code></p>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle icon={ServerCog} title="Account review" subtitle="Read-only — account type, balance, senders and your account's prices" />
          {!conn?.configured ? (
            <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">Connect Twilio to review the account.</p>
          ) : conn.reviewError ? (
            <div className="mt-4"><Notice tone="danger">{conn.reviewError}</Notice></div>
          ) : !conn.review ? (
            <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">Press “Review Twilio account” to check it.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-4 text-xs">
              <dl className="grid grid-cols-2 gap-3">
                <Kv label="Account">{conn.review.account.name} <span className="text-muted-foreground">({conn.review.account.sid})</span></Kv>
                <Kv label="Type · status"><span className={cn(conn.review.account.type === "Trial" && "font-semibold text-warning")}>{conn.review.account.type}</span> · {conn.review.account.status}</Kv>
                <Kv label="Balance">{conn.review.balance ?? "—"}</Kv>
                <Kv label="Phone numbers">{conn.review.numbers.length ? conn.review.numbers.map((n) => `${n.number}${n.sms ? "" : " (no SMS)"}`).join(", ") : "None"}</Kv>
              </dl>
              {conn.review.account.type === "Trial" && <Notice tone="warning">Trial accounts can only text verified numbers and add “Sent from your Twilio trial account”. Upgrade before phase 2.</Notice>}
              {conn.review.services.map((s) => (
                <div key={s.role} className="rounded-xl border border-border p-3">
                  <p className="font-semibold text-foreground">{s.role} <span className="font-normal text-muted-foreground">· {s.sid}</span></p>
                  {"error" in s ? <p className="mt-1 text-danger">{s.error}</p> : (
                    <>
                      <p className="mt-0.5 text-muted-foreground">{s.name} · use case {s.usecase} · status callback {s.statusCallback ? "set" : "not set"} · inbound webhook {s.inboundWebhook ? "set" : "not set"}</p>
                      <p className="mt-1 text-foreground">{s.senders.length ? s.senders.map((x) => `${x.value} (${x.kind === "Phone number" ? x.country || "number" : "alpha"})`).join(" · ") : <span className="text-warning">No senders in this service</span>}</p>
                    </>
                  )}
                </div>
              ))}
              {conn.review.pricing.map((p) => (
                <p key={p.country} className="text-muted-foreground">{p.country} outbound: {p.carriers.map((c) => `${c.carrier} ${c.price} ${p.unit}`).join(" · ")}</p>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle icon={Send} title="Recommended UK sender setup" subtitle="Service and marketing are separate Messaging Services, so a STOP to marketing never blocks application updates" />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr><th className="py-2 pr-3">Messages</th><th className="px-3 py-2">Sender</th><th className="px-3 py-2">Replies</th><th className="px-3 py-2">Consent</th><th className="py-2 pl-3">Cost</th></tr>
            </thead>
            <tbody className="divide-y divide-border align-top">
              <tr>
                <td className="py-3 pr-3 font-semibold text-foreground">Service — status, documents, reminders</td>
                <td className="px-3 py-3">Alphanumeric <b>BHEUni</b> (shows the brand; no UK registration needed) with a UK mobile number as fallback</td>
                <td className="px-3 py-3">One-way — messages point people to their counsellor, WhatsApp or phone</td>
                <td className="px-3 py-3">Allowed while they have a live enquiry or application (legitimate interest); stops if they text STOP or ask</td>
                <td className="py-3 pl-3">${smsRatesUsd["United Kingdom"]} per part; sender ID free</td>
              </tr>
              <tr>
                <td className="py-3 pr-3 font-semibold text-foreground">Marketing — courses, intakes, events, ambassadors</td>
                <td className="px-3 py-3">UK mobile number (+44 7…) with Twilio Advanced Opt-Out</td>
                <td className="px-3 py-3">Two-way, so STOP / START / HELP work and are recorded automatically</td>
                <td className="px-3 py-3">Prior opt-in only (PECR), recorded with source and evidence; every text says “Reply STOP to opt out”</td>
                <td className="py-3 pl-3">${smsRatesUsd["United Kingdom"]} per part + ~$2.50/month for the number</td>
              </tr>
              <tr>
                <td className="py-3 pr-3 font-semibold text-foreground">Bangladesh contacts</td>
                <td className="px-3 py-3">Registered alphanumeric sender ID — required by Grameenphone, Robi and Teletalk (~3 weeks)</td>
                <td className="px-3 py-3">One-way only</td>
                <td className="px-3 py-3">Same rules as UK</td>
                <td className="py-3 pl-3">${smsRatesUsd.Bangladesh} per part — WhatsApp is usually cheaper</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.2fr]">
        <CostEstimator />
        <TestSend allowlist={conn?.allowlist ?? []} ready={!!conn?.configured && conn.mode === "test"} />
      </div>

      <Card className="p-5">
        <SectionTitle icon={Clock3} title="Rollout plan" subtitle="Internal test first; nothing reaches students or leads until phase 2" />
        <ol className="mt-4 flex flex-col gap-3">
          {phases.map((p) => (
            <li key={p.name} className={cn("rounded-2xl border p-4", p.state === "now" ? "border-primary/40 bg-primary-soft/40" : "border-border")}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{p.name}</p>
                <span className={cn("text-xs font-medium", p.state === "now" ? "text-primary" : "text-muted-foreground")}>{p.when}{p.state === "now" ? " · current" : ""}</span>
              </div>
              {p.gate && <p className="mt-2 flex gap-1.5 text-xs font-medium text-warning"><CircleAlert className="mt-0.5 size-3.5 shrink-0" />{p.gate}</p>}
              <ul className="mt-2 flex flex-col gap-1">
                {p.items.map((it) => <li key={it} className="flex gap-2 text-xs text-muted-foreground"><Circle className="mt-1 size-2 shrink-0 fill-current" />{it}</li>)}
              </ul>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof Send; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon className="size-4" /></span>
      <div><h3 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h3><p className="text-xs text-muted-foreground">{subtitle}</p></div>
    </div>
  );
}

function Check({ ok, warn, label, value }: { ok: boolean; warn?: boolean; label: string; value?: string }) {
  return (
    <li className="flex items-start gap-2.5 py-2">
      {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <CircleAlert className={cn("mt-0.5 size-4 shrink-0", warn ? "text-warning" : "text-danger")} />}
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[11px] text-foreground">{label}</span>
        <span className="block break-words text-muted-foreground">{value || "Not set"}</span>
      </span>
    </li>
  );
}

function Kv({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt className="text-[11px] text-muted-foreground">{label}</dt><dd className="mt-0.5 text-foreground">{children}</dd></div>;
}

function CostEstimator() {
  const [ukService, setUkService] = useState(1200);
  const [ukMarketing, setUkMarketing] = useState(800);
  const [bd, setBd] = useState(0);
  const [parts, setParts] = useState(1);
  const uk = (ukService + ukMarketing) * parts * smsRatesUsd["United Kingdom"];
  const bdCost = bd * parts * smsRatesUsd.Bangladesh;
  const number = 2.5;
  const failures = (ukService + ukMarketing + bd) * 0.03 * FAILED_FEE_USD;
  const total = uk + bdCost + number + failures;
  const num = (v: number, set: (n: number) => void, label: string) => (
    <Field label={label}><TextInput type="number" min={0} value={v} onChange={(e) => set(Math.max(0, Number(e.target.value) || 0))} /></Field>
  );
  return (
    <Card className="p-5">
      <SectionTitle icon={FlaskConical} title="Monthly cost estimate" subtitle="Twilio list prices, Sept 2026 — your account's own rates show in the review above" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {num(ukService, setUkService, "UK service messages")}
        {num(ukMarketing, setUkMarketing, "UK marketing messages")}
        {num(bd, setBd, "Bangladesh messages")}
        <Field label="Parts per message"><TextInput type="number" min={1} max={6} value={parts} onChange={(e) => setParts(Math.min(6, Math.max(1, Number(e.target.value) || 1)))} /></Field>
      </div>
      <dl className="mt-4 flex flex-col gap-1.5 rounded-2xl bg-surface-muted p-4 text-xs">
        <Line label={`UK: ${(ukService + ukMarketing) * parts} parts × $${smsRatesUsd["United Kingdom"]}`} usd={uk} />
        {bd > 0 && <Line label={`Bangladesh: ${bd * parts} parts × $${smsRatesUsd.Bangladesh}`} usd={bdCost} />}
        <Line label="UK mobile number (marketing)" usd={number} />
        <Line label="Failed-message fees (~3% × $0.001)" usd={failures} />
        <div className="mt-1 flex justify-between border-t border-border pt-2 text-sm font-semibold text-foreground"><span>Total per month</span><span className="tabular-nums">${total.toFixed(2)} ≈ {formatGbp(total * USD_TO_GBP)}</span></div>
      </dl>
      <p className="mt-2 text-[11px] text-muted-foreground">One part = 160 plain characters, or 70 if the text has emoji or non-Latin characters. The internal test (phase 1) costs under £5.</p>
    </Card>
  );
}

function Line({ label, usd }: { label: string; usd: number }) {
  return <div className="flex justify-between text-muted-foreground"><span>{label}</span><span className="tabular-nums text-foreground">${usd.toFixed(2)}</span></div>;
}

function TestSend({ allowlist, ready }: { allowlist: string[]; ready: boolean }) {
  const [to, setTo] = useState("");
  const [body, setBody] = useState("BHE Uni CRM test: if you can read this, SMS from the CRM is working. No reply needed.");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; sid?: string; status?: SmsStatus; errorCode?: string } | null>(null);
  const seg = segmentInfo(body);

  const send = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/sms/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to, body, category: "service" }) });
      const data = (await res.json()) as { sid?: string; status?: SmsStatus; error?: string; code?: string };
      setResult(res.ok ? { ok: true, text: "Accepted by Twilio", sid: data.sid, status: data.status } : { ok: false, text: data.error ?? "Failed", errorCode: data.code });
    } catch {
      setResult({ ok: false, text: "Couldn't reach the CRM server" });
    }
    setBusy(false);
  };
  const check = async () => {
    if (!result?.sid) return;
    const res = await fetch(`/api/sms/messages?sids=${result.sid}`, { cache: "no-store" });
    const m = ((await res.json()) as { messages: { status?: SmsStatus; errorCode?: string }[] }).messages[0];
    if (m?.status) setResult({ ...result, status: m.status, errorCode: m.errorCode });
  };

  return (
    <Card className="p-5">
      <SectionTitle icon={Send} title="Internal test send" subtitle="Phase 1 — only numbers on the server's test allowlist can receive this" />
      <div className="mt-4 flex flex-col gap-3">
        <Field label="To" hint={allowlist.length ? `Allowlisted: ${allowlist.join(", ")}` : "No numbers allowlisted yet (SMS_TEST_ALLOWLIST)"}>
          <TextInput value={to} onChange={(e) => setTo(e.target.value)} placeholder="+447…" />
        </Field>
        <Field label="Message" hint={`${seg.units} characters · ${seg.segments} part${seg.segments === 1 ? "" : "s"}`}>
          <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={send} disabled={!ready || busy || !toE164(to) || !body.trim()} className={cn(buttonPrimary, "disabled:opacity-50")}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send test SMS</button>
          {result?.sid && <button type="button" onClick={check} className={buttonSecondary}><RefreshCw className="size-4" /> Check delivery</button>}
          {!ready && <span className="text-xs text-muted-foreground">Available once Twilio is connected in test mode.</span>}
        </div>
        {result && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-xs">
            {result.status ? <SmsStatusBadge message={{ status: result.status, errorCode: result.errorCode }} /> : null}
            <span className={result.ok ? "text-foreground" : "text-danger"}>{result.text}{result.errorCode ? ` (${result.errorCode})` : ""}</span>
            {result.sid && <span className="font-mono text-muted-foreground">{result.sid}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}
