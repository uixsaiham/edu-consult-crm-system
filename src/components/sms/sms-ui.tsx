"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ban, CheckCircle2, CircleAlert, Clock3, FlaskConical, Info, Lock, Megaphone, MessageSquareText, PlugZap, Search, Send, ShieldCheck, ShieldOff, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { SlideOver } from "@/components/ui/slide-over";
import { Field, Select, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { formatDay } from "@/components/people/people-ui";
import { eligibility, estimateCost, fillTemplate, formatGbp, segmentInfo, serviceTopics, twilioErrors, unfilledTokens, type ServiceTopic, type SmsStatus } from "@/lib/sms/rules";
import { deliver, sendsForReal, type SmsConnection } from "@/lib/sms/client";
import { contactValues, serviceTemplates, type SmsContact, type SmsMessage } from "@/lib/mock/sms";
import { cn } from "@/lib/utils";

// --- Badges -------------------------------------------------------------------------------------

const statusStyle: Record<SmsStatus, { label: string; cls: string; dot: string }> = {
  queued: { label: "Queued", cls: "bg-surface-hover text-muted-foreground", dot: "bg-muted-foreground" },
  sending: { label: "Sending", cls: "bg-primary-soft text-primary", dot: "bg-primary" },
  sent: { label: "Sent", cls: "bg-primary-soft text-primary", dot: "bg-primary" },
  delivered: { label: "Delivered", cls: "bg-success-soft text-success", dot: "bg-success" },
  undelivered: { label: "Undelivered", cls: "bg-warning-soft text-warning", dot: "bg-warning" },
  failed: { label: "Failed", cls: "bg-danger-soft text-danger", dot: "bg-danger" },
  blocked: { label: "Blocked", cls: "bg-danger-soft text-danger", dot: "bg-danger" },
  simulated: { label: "Simulated", cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400", dot: "bg-violet-500" },
};
export const smsStatusOptions = (Object.keys(statusStyle) as SmsStatus[]).map((s) => ({ value: s, label: statusStyle[s].label, dot: statusStyle[s].dot }));

export function SmsStatusBadge({ message }: { message: Pick<SmsMessage, "status" | "errorCode" | "blockedReason"> }) {
  const s = statusStyle[message.status];
  const why = message.blockedReason ?? (message.errorCode ? `${message.errorCode}: ${twilioErrors[message.errorCode] ?? "Twilio error"}` : undefined);
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold", s.cls)}><span className={cn("size-1.5 rounded-full", s.dot)} />{s.label}</span>
      {why && <span className="max-w-48 text-[10px] leading-tight text-muted-foreground">{why}</span>}
    </span>
  );
}

export function ConsentBadges({ contact, compact }: { contact: SmsContact; compact?: boolean }) {
  const { service, marketing } = contact.consent;
  return (
    <span className={cn("flex gap-1", compact ? "flex-row flex-wrap" : "flex-col items-start")}>
      <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold", service === "active" ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
        {service === "active" ? <ShieldCheck className="size-3" /> : <ShieldOff className="size-3" />} Service {service === "active" ? "on" : "— STOP"}
      </span>
      <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold", marketing === "granted" ? "bg-primary-soft text-primary" : marketing === "withdrawn" ? "bg-danger-soft text-danger" : "bg-surface-hover text-muted-foreground")}>
        <Megaphone className="size-3" /> Marketing {marketing === "granted" ? "opted in" : marketing === "withdrawn" ? "withdrawn" : "not asked"}
      </span>
    </span>
  );
}

// --- Connection banner ----------------------------------------------------------------------------

export function ConnectionBanner({ conn, loading }: { conn: SmsConnection | null; loading: boolean }) {
  const onSetup = usePathname() === "/communications/sms/setup";
  if (loading) return <div className="h-14 animate-pulse rounded-2xl bg-surface-muted" />;
  const real = sendsForReal(conn);
  const tone = !conn?.configured ? "violet" : conn.mode === "test" ? "warning" : conn.mode === "off" ? "neutral" : "danger";
  const Icon = !conn?.configured ? PlugZap : conn.mode === "test" ? FlaskConical : conn.mode === "off" ? Ban : Lock;
  const title = !conn?.configured ? "Twilio not connected — sends are simulated" : conn.mode === "test" ? "Internal test mode" : conn.mode === "off" ? "SMS sending is switched off" : "Live mode is locked";
  const body = !conn?.configured
    ? "Messages are checked against consent and logged, but nothing leaves the CRM. Add the Twilio credentials to the server's environment to connect."
    : conn.mode === "test"
      ? `Real SMS go out through Twilio, but only to the ${conn.allowlist.length} internal number${conn.allowlist.length === 1 ? "" : "s"} on the test allowlist. Anything else is refused by the server.`
      : conn.mode === "off"
        ? "SMS_MODE is set to off on the server."
        : "Live sending unlocks in rollout phase 3, once CRM sign-in is in place.";
  return (
    <div className={cn("flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3", tone === "violet" && "border-violet-500/25 bg-violet-500/5", tone === "warning" && "border-warning/30 bg-warning-soft", tone === "neutral" && "border-border bg-surface-muted", tone === "danger" && "border-danger/25 bg-danger-soft")}>
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface", tone === "violet" && "text-violet-600 dark:text-violet-400", tone === "warning" && "text-warning", tone === "danger" && "text-danger", tone === "neutral" && "text-muted-foreground")}><Icon className="size-4" /></span>
      <div className="min-w-0 flex-1 basis-52">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
      {!real && !onSetup && <Link href="/communications/sms/setup" className={cn(buttonSecondary, "h-9")}>Twilio setup</Link>}
    </div>
  );
}

// --- Compose (service messages) ---------------------------------------------------------------------

/** One-off or bulk service message. Marketing goes through Campaigns, never from here. */
export function ComposeDialog({ contacts, initial, conn, by, onClose, onSent }: { contacts: SmsContact[]; initial?: SmsContact[]; conn: SmsConnection | null; by: string; onClose: () => void; onSent: (messages: SmsMessage[]) => void }) {
  const [to, setTo] = useState<SmsContact[]>(initial ?? []);
  const [topic, setTopic] = useState<ServiceTopic>("Application status");
  const [body, setBody] = useState(serviceTemplates["Application status"]);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  const q = search.trim().toLowerCase();
  const matches = useMemo(() => (q ? contacts.filter((c) => !to.some((t) => t.id === c.id) && `${c.name} ${c.phone} ${c.ref}`.toLowerCase().includes(q)).slice(0, 6) : []), [contacts, to, q]);
  const rendered = to.map((c) => ({ c, text: fillTemplate(body, contactValues(c)), ok: eligibility(c.consent, "service", c.phone) }));
  const sendable = rendered.filter((r) => r.ok.ok);
  const skipped = rendered.filter((r) => !r.ok.ok);
  const missing = [...new Set(sendable.flatMap((r) => unfilledTokens(r.text)))];
  const preview = sendable[0]?.text ?? fillTemplate(body, {});
  const seg = segmentInfo(preview);
  const cost = estimateCost(sendable.map((r) => r.c.phone), seg.segments);

  const send = async () => {
    setSending(true);
    const out: SmsMessage[] = [];
    for (const r of rendered) out.push(await deliver({ contact: r.c, body: r.text, category: "service", topic, by, conn }));
    setSending(false);
    onSent(out);
  };

  return (
    <Modal open onClose={onClose} icon={MessageSquareText} size="lg" title="New service message" subtitle="Application updates, document requests and reminders. Marketing goes through Campaigns."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {sendable.length} to send{skipped.length ? ` · ${skipped.length} skipped` : ""} · {seg.segments} part{seg.segments === 1 ? "" : "s"} each · est. {formatGbp(cost.gbp)}
            {!sendsForReal(conn) && " · simulated"}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
            <button type="button" disabled={!sendable.length || missing.length > 0 || sending} onClick={send} className={cn(buttonPrimary, "disabled:opacity-50")}><Send className="size-4" /> {sending ? "Sending…" : `Send${sendable.length > 1 ? ` to ${sendable.length}` : ""}`}</button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="To" required>
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-surface p-2 focus-within:border-primary">
            {to.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-surface-hover py-1 pl-2.5 pr-1 text-xs font-medium text-foreground">
                {c.name}
                <button type="button" onClick={() => setTo(to.filter((t) => t.id !== c.id))} aria-label={`Remove ${c.name}`} className="flex size-5 items-center justify-center rounded-full hover:bg-surface"><X className="size-3" /></button>
              </span>
            ))}
            <span className="flex min-w-40 flex-1 items-center gap-1.5 px-1">
              <Search className="size-3.5 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts by name, phone or ID" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" aria-label="Search contacts" />
            </span>
          </div>
          {matches.length > 0 && (
            <ul className="mt-1 overflow-hidden rounded-xl border border-border">
              {matches.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => { setTo([...to, c]); setSearch(""); }} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-surface-hover">
                    <span className="min-w-0"><span className="block truncate text-sm text-foreground">{c.name}</span><span className="block text-[11px] text-muted-foreground">{c.type} · {c.phone} · {c.ref}</span></span>
                    <ConsentBadges contact={c} compact />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Field>

        <Field label="Message type">
          <Select value={topic} onChange={(e) => { const t = e.target.value as ServiceTopic; setTopic(t); setBody(serviceTemplates[t]); }}>
            {serviceTopics.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Field>

        <Field label="Message" hint="{first_name}, {course}, {university}, {stage}, {counsellor} and {branch} fill in for each person. Replace any other {placeholder} before sending.">
          <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <div className="rounded-2xl bg-surface-muted p-3">
            <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Preview{sendable[0] ? ` — ${sendable[0].c.name}` : ""}</p>
            <p className="whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-surface px-3 py-2 text-sm text-foreground shadow-xs">{preview || "…"}</p>
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center sm:grid-cols-1 sm:text-left">
            <Stat label="Characters">{seg.units}</Stat>
            <Stat label="SMS parts">{seg.segments} <span className="text-[10px] font-normal text-muted-foreground">({seg.encoding})</span></Stat>
            <Stat label="Est. cost">{formatGbp(cost.gbp)}</Stat>
          </dl>
        </div>

        {seg.encoding === "Unicode" && <Notice tone="warning">Contains {seg.culprits.map((c) => `“${c}”`).join(" ")} — this switches the message to Unicode, where each part holds 70 characters instead of 160.</Notice>}
        {missing.length > 0 && <Notice tone="danger">Fill in {missing.map((m) => `{${m}}`).join(", ")} before sending.</Notice>}
        {cost.byCountry.Bangladesh && <Notice tone="warning">{cost.byCountry.Bangladesh.count} recipient{cost.byCountry.Bangladesh.count === 1 ? " is" : "s are"} in Bangladesh, where SMS costs about 10× the UK rate. WhatsApp is usually cheaper for these contacts.</Notice>}
        {skipped.length > 0 && (
          <Notice tone="neutral">
            Won&apos;t be sent to: {skipped.map((r) => `${r.c.name} (${r.ok.ok ? "" : r.ok.reason.toLowerCase()})`).join(", ")}. The attempt is still logged against their record.
          </Notice>
        )}
      </div>
    </Modal>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border px-3 py-1.5">
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums text-foreground">{children}</dd>
    </div>
  );
}

export function Notice({ tone, children }: { tone: "warning" | "danger" | "neutral" | "success"; children: ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "neutral" ? Info : CircleAlert;
  return (
    <p className={cn("flex gap-2 rounded-xl px-3 py-2.5 text-xs text-foreground", tone === "warning" && "bg-warning-soft", tone === "danger" && "bg-danger-soft", tone === "neutral" && "bg-surface-muted", tone === "success" && "bg-success-soft")}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "warning" && "text-warning", tone === "danger" && "text-danger", tone === "neutral" && "text-muted-foreground", tone === "success" && "text-success")} />
      <span>{children}</span>
    </p>
  );
}

// --- Contact history & consent -------------------------------------------------------------------------

export type ConsentAction = { kind: "opt-in"; source: string; evidence: string } | { kind: "withdraw" } | { kind: "stop" } | { kind: "start" };

export const consentSources = ["Website enquiry form", "Education Expo sign-up sheet", "Facebook lead form", "Consultation — verbal, noted by counsellor", "Student portal preferences", "Ambassador sign-up agreement", "Email reply"];

export function ContactPanel({ contact, messages, onClose, onCompose, onConsent }: { contact: SmsContact; messages: SmsMessage[]; onClose: () => void; onCompose: () => void; onConsent: (a: ConsentAction) => void }) {
  const [optIn, setOptIn] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const mine = messages.filter((m) => m.contactId === contact.id);
  const delivered = mine.filter((m) => m.status === "delivered").length;
  const real = mine.filter((m) => m.status !== "blocked" && m.status !== "simulated").length;
  return (
    <SlideOver open onClose={onClose} icon={MessageSquareText} title={contact.name} subtitle={`${contact.type} · ${contact.phone} · ${contact.ref}`}
      footer={<div className="flex justify-end"><button type="button" onClick={onCompose} disabled={contact.consent.service !== "active"} className={cn(buttonPrimary, "disabled:opacity-50")}><Send className="size-4" /> Send service message</button></div>}
    >
      <div className="flex flex-col gap-5">
        <section className="rounded-2xl border border-border p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold text-foreground">SMS consent</h4>
            <ConsentBadges contact={contact} compact />
          </div>
          <dl className="mb-3 grid grid-cols-2 gap-3 text-xs">
            <div><dt className="text-muted-foreground">Service messages</dt><dd className="mt-0.5 text-foreground">{contact.consent.service === "active" ? "Allowed — live enquiry/application" : `Stopped ${contact.consent.optedOutAt ? formatDay(contact.consent.optedOutAt) : ""}`}</dd></div>
            <div><dt className="text-muted-foreground">Marketing</dt><dd className="mt-0.5 text-foreground">{contact.consent.marketing === "granted" ? `Opted in ${contact.consent.marketingAt ? formatDay(contact.consent.marketingAt) : ""}` : contact.consent.marketing === "withdrawn" ? `Withdrawn ${contact.consent.optedOutAt ? formatDay(contact.consent.optedOutAt) : ""}` : "No consent recorded"}</dd></div>
            {contact.consent.marketingSource && <div className="col-span-2"><dt className="text-muted-foreground">Opt-in source</dt><dd className="mt-0.5 text-foreground">{contact.consent.marketingSource}</dd></div>}
          </dl>
          <div className="flex flex-wrap gap-1.5">
            {contact.consent.service === "active" && contact.consent.marketing !== "granted" && <button type="button" onClick={() => setOptIn(true)} className={cn(buttonSecondary, "h-8 px-3 text-xs")}><Megaphone className="size-3.5" /> Record marketing opt-in</button>}
            {contact.consent.marketing === "granted" && <button type="button" onClick={() => onConsent({ kind: "withdraw" })} className={cn(buttonSecondary, "h-8 px-3 text-xs")}>Withdraw marketing</button>}
            {contact.consent.service === "active" ? (
              <button type="button" onClick={() => setConfirmStop(true)} className={cn(buttonSecondary, "h-8 px-3 text-xs text-danger hover:bg-danger-soft")}><ShieldOff className="size-3.5" /> Record STOP (all SMS)</button>
            ) : (
              <button type="button" onClick={() => onConsent({ kind: "start" })} className={cn(buttonSecondary, "h-8 px-3 text-xs")}>They texted START</button>
            )}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h4 className="text-xs font-semibold text-foreground">Message history</h4>
            <span className="text-[11px] text-muted-foreground">{mine.length} messages · {real ? Math.round((delivered / real) * 100) : 0}% delivered</span>
          </div>
          {mine.length ? (
            <ol className="flex flex-col gap-2">
              {mine.map((m) => (
                <li key={m.id} className="rounded-2xl border border-border p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">{m.category === "marketing" ? <Megaphone className="size-3" /> : <MessageSquareText className="size-3" />}{m.topic}</span>
                    <SmsStatusBadge message={m} />
                  </div>
                  <p className="whitespace-pre-wrap text-xs text-foreground">{m.body}</p>
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground"><Clock3 className="size-3" />{formatDay(m.sentAt)} {m.sentAt.slice(11, 16)} · {m.sentBy} · {m.segments} part{m.segments === 1 ? "" : "s"}{m.costGbp ? ` · ${formatGbp(m.costGbp)}` : ""}{m.sid ? ` · ${m.sid.slice(0, 10)}…` : ""}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">No SMS sent to this contact yet.</p>
          )}
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold text-foreground">Consent log</h4>
          <ol className="flex flex-col gap-2.5 border-l border-border pl-4">
            {contact.consentLog.map((e, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-surface bg-border-strong" />
                <p className="text-xs text-foreground">{e.text}</p>
                <p className="text-[10px] text-muted-foreground">{formatDay(e.at)} · {e.by}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {optIn && <OptInDialog name={contact.name} onClose={() => setOptIn(false)} onSave={(source, evidence) => { onConsent({ kind: "opt-in", source, evidence }); setOptIn(false); }} />}
      <Modal open={confirmStop} onClose={() => setConfirmStop(false)} icon={ShieldOff} size="sm" title={`Stop all SMS to ${contact.name}?`} subtitle="Use this when they ask by phone, email or in person. Texting STOP is recorded automatically."
        footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setConfirmStop(false)} className={buttonSecondary}>Cancel</button><button type="button" onClick={() => { onConsent({ kind: "stop" }); setConfirmStop(false); }} className={cn(buttonPrimary, "bg-danger hover:bg-danger/90")}>Stop all SMS</button></div>}
      >
        <p className="text-sm text-muted-foreground">No service or marketing texts will be sent until they opt back in. Their counsellor should use email or WhatsApp instead.</p>
      </Modal>
    </SlideOver>
  );
}

function OptInDialog({ name, onClose, onSave }: { name: string; onClose: () => void; onSave: (source: string, evidence: string) => void }) {
  const [source, setSource] = useState("");
  const [evidence, setEvidence] = useState("");
  const [tried, setTried] = useState(false);
  const ok = source && evidence.trim().length >= 5;
  return (
    <Modal open onClose={onClose} icon={Megaphone} title={`Record marketing opt-in for ${name}`} subtitle="Only record consent the person actually gave — it must be specific to SMS marketing."
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" onClick={() => { setTried(true); if (ok) onSave(source, evidence.trim()); }} className={buttonPrimary}>Record opt-in</button></div>}
    >
      <div className="flex flex-col gap-4">
        <Field label="How did they opt in?" required>
          <Select value={source} onChange={(e) => setSource(e.target.value)} placeholder="Choose a source">
            {consentSources.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Evidence" required hint="Where the proof is kept, e.g. form submission ID, sign-up sheet reference, or what they said and when.">
          <Textarea rows={3} value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="e.g. Ticked 'Text me about courses' on the Sylhet expo form, sheet 4 row 12" />
        </Field>
        {tried && !ok && <p className="text-[11px] font-medium text-danger">Choose a source and describe the evidence.</p>}
        <Notice tone="neutral">Under PECR, marketing texts need prior consent. Service messages about their own application don&apos;t, and aren&apos;t affected by this.</Notice>
      </div>
    </Modal>
  );
}

/** Applies a consent action to a contact and logs it. */
export function applyConsent(c: SmsContact, a: ConsentAction, by: string, at: string): SmsContact {
  const log = (text: string) => [{ at, text, by }, ...c.consentLog];
  switch (a.kind) {
    case "opt-in":
      return { ...c, consent: { ...c.consent, marketing: "granted", marketingSource: a.source, marketingAt: at }, consentLog: log(`Marketing opt-in recorded — ${a.source}. Evidence: ${a.evidence}`) };
    case "withdraw":
      return { ...c, consent: { ...c.consent, marketing: "withdrawn", optedOutAt: at }, consentLog: log("Marketing consent withdrawn") };
    case "stop":
      return { ...c, consent: { ...c.consent, service: "opted-out", marketing: c.consent.marketing === "granted" ? "withdrawn" : c.consent.marketing, optedOutAt: at }, consentLog: log("Opted out of all SMS (STOP recorded)") };
    case "start":
      return { ...c, consent: { ...c.consent, service: "active" }, consentLog: log("Texted START — service messages resumed (marketing stays off until they opt in again)") };
  }
}
