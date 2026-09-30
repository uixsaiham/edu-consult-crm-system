"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Copy, FlaskConical, Megaphone, MoreHorizontal, PencilLine, Plus, Send, Trash2, UserX, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Modal } from "@/components/ui/modal";
import { Field, Textarea, TextInput } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { AnchoredMenu, MenuDivider, MenuItem } from "@/components/applications/list/anchored-menu";
import { formatDay } from "@/components/people/people-ui";
import { ConnectionBanner, Notice } from "@/components/sms/sms-ui";
import { deliver, sendsForReal, useSmsConnection, type SmsConnection } from "@/lib/sms/client";
import { eligibility, estimateCost, fillTemplate, formatGbp, hasOptOutText, MARKETING_OPT_OUT, segmentInfo, unfilledTokens, USD_TO_GBP, withinMarketingHours } from "@/lib/sms/rules";
import {
  contactValues, getCampaigns, getSmsContacts, getSmsMessages, intakesOffered, marketingTemplates, matchesAudience, nextCampaignId, saveCampaigns, saveSmsMessages, smsToday, subjects,
  type SmsAudience, type SmsCampaign, type SmsContact, type SmsContactType, type SmsMessage,
} from "@/lib/mock/sms";
import { cn } from "@/lib/utils";

const statusTone: Record<SmsCampaign["status"], string> = {
  Draft: "bg-surface-hover text-muted-foreground",
  "Test sent": "bg-warning-soft text-warning",
  Scheduled: "bg-primary-soft text-primary",
  Sent: "bg-success-soft text-success",
};

/** Splits an audience into who will get the campaign and why the rest won't. */
function audienceBreakdown(contacts: SmsContact[], audience: SmsAudience) {
  const matched = contacts.filter((c) => c.type !== "Internal test" && matchesAudience(c, audience));
  const eligible: SmsContact[] = [];
  const reasons: Record<string, number> = {};
  for (const c of matched) {
    const ok = eligibility(c.consent, "marketing", c.phone);
    if (ok.ok) eligible.push(c);
    else reasons[ok.reason] = (reasons[ok.reason] ?? 0) + 1;
  }
  return { matched, eligible, reasons };
}

export default function SmsCampaignsPage() {
  const { user } = useUser();
  const { conn, loading } = useSmsConnection();
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>(getCampaigns);
  const [messages, setMessages] = useState<SmsMessage[]>(getSmsMessages);
  const [contacts] = useState<SmsContact[]>(getSmsContacts);
  const [editing, setEditing] = useState<SmsCampaign | "new" | null>(null);
  const [deleting, setDeleting] = useState<SmsCampaign | null>(null);
  const [toast, notify] = useToast();

  useEffect(() => saveCampaigns(campaigns), [campaigns]);
  useEffect(() => saveSmsMessages(messages), [messages]);

  const statsFor = (c: SmsCampaign) => {
    const ms = messages.filter((m) => m.campaignId === c.id && !m.body.startsWith("[TEST]"));
    const ids = new Set(ms.map((m) => m.contactId));
    return {
      sent: ms.filter((m) => m.status !== "blocked").length,
      delivered: ms.filter((m) => m.status === "delivered" || m.status === "simulated").length,
      failed: ms.filter((m) => m.status === "failed" || m.status === "undelivered").length,
      optOuts: contacts.filter((x) => ids.has(x.id) && x.consent.marketing === "withdrawn" && (x.consent.optedOutAt ?? "") >= (c.sentAt ?? "9999")).length,
      cost: ms.reduce((n, m) => n + m.costGbp, 0),
    };
  };

  const sentCampaigns = campaigns.filter((c) => c.status === "Sent");
  const totals = sentCampaigns.map(statsFor).reduce((a, s) => ({ sent: a.sent + s.sent, delivered: a.delivered + s.delivered, optOuts: a.optOuts + s.optOuts, cost: a.cost + s.cost }), { sent: 0, delivered: 0, optOuts: 0, cost: 0 });
  const reachable = contacts.filter((c) => c.type !== "Internal test" && eligibility(c.consent, "marketing", c.phone).ok).length;

  const save = (c: SmsCampaign, message: string) => {
    setCampaigns((prev) => (prev.some((x) => x.id === c.id) ? prev.map((x) => (x.id === c.id ? c : x)) : [c, ...prev]));
    notify(message);
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">SMS Campaigns</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Targeted texts about courses, intakes, events and the ambassador programme. Only contacts with a recorded marketing opt-in are included, and every message carries a STOP opt-out.</p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className={buttonPrimary}><Plus className="size-4" /> New campaign</button>
      </header>

      <ConnectionBanner conn={conn} loading={loading} />

      <StatGrid>
        <StatCard icon={Users} label="Reachable for marketing" value={reachable} note={`of ${contacts.length - contacts.filter((c) => c.type === "Internal test").length}`} />
        <StatCard icon={Megaphone} tone="violet" label="Campaign texts sent" value={totals.sent} note={`${sentCampaigns.length} campaigns`} />
        <StatCard icon={Send} tone="success" label="Delivered" value={totals.sent ? `${Math.round((totals.delivered / totals.sent) * 100)}%` : "—"} note={formatGbp(totals.cost)} />
        <StatCard icon={UserX} tone={totals.optOuts ? "warning" : "success"} label="Opt-outs after campaigns" value={totals.optOuts} />
      </StatGrid>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Campaigns</h3>
          <p className="text-xs text-muted-foreground">{campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}</p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2.5 pl-5 pr-3">Campaign</th>
                <th className="px-3 py-2.5">Audience</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Sent</th>
                <th className="px-3 py-2.5 text-right">Delivered</th>
                <th className="px-3 py-2.5 text-right">Opt-outs</th>
                <th className="px-3 py-2.5 text-right">Cost</th>
                <th className="py-2.5 pl-3 pr-5 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((c) => {
                const s = statsFor(c);
                const aud = [c.audience.types.join(", ") || "Everyone", c.audience.countries.join(", "), c.audience.subjects.join(", "), c.audience.intakes.join(", ")].filter(Boolean).join(" · ");
                return (
                  <tr key={c.id} className="align-top transition-colors hover:bg-surface-hover/60">
                    <td className="py-3 pl-5 pr-3">
                      <button type="button" onClick={() => setEditing(c)} className="text-left">
                        <span className="block text-sm font-semibold text-foreground hover:text-primary">{c.name}</span>
                        <span className="block text-[11px] text-muted-foreground">{c.purpose} · by {c.createdBy}</span>
                      </button>
                    </td>
                    <td className="max-w-64 px-3 py-3 text-muted-foreground">{aud}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", statusTone[c.status])}>{c.status}</span>
                      <p className="mt-1 text-[11px] text-muted-foreground">{c.status === "Sent" && c.sentAt ? formatDay(c.sentAt) : c.status === "Scheduled" && c.scheduledFor ? `for ${formatDay(c.scheduledFor)} ${c.scheduledFor.slice(11, 16)}` : `created ${formatDay(c.createdAt)}`}</p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-foreground">{c.status === "Sent" ? s.sent : "—"}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-foreground">{c.status === "Sent" && s.sent ? `${Math.round((s.delivered / s.sent) * 100)}%` : "—"}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-foreground">{c.status === "Sent" ? s.optOuts : "—"}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-foreground">{c.status === "Sent" ? formatGbp(s.cost) : "—"}</td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      <AnchoredMenu label={`Actions for ${c.name}`} align="end" width={180} trigger={<MoreHorizontal className="size-4" />} triggerClassName="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground">
                        {(close) => (
                          <>
                            <MenuItem icon={PencilLine} onClick={() => { close(); setEditing(c); }}>{c.status === "Sent" ? "View" : "Edit"}</MenuItem>
                            <MenuItem icon={Copy} onClick={() => { close(); save({ ...c, id: nextCampaignId(), name: `${c.name} (copy)`, status: "Draft", createdAt: smsToday, createdBy: user.name, sentAt: undefined, scheduledFor: undefined, recipients: 0, excluded: 0 }, "Campaign duplicated"); }}>Duplicate</MenuItem>
                            {c.status !== "Sent" && (
                              <>
                                <MenuDivider />
                                <MenuItem icon={Trash2} tone="danger" onClick={() => { close(); setDeleting(c); }}>Delete</MenuItem>
                              </>
                            )}
                          </>
                        )}
                      </AnchoredMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <CampaignBuilder
          key={editing === "new" ? "new" : editing.id}
          campaign={editing === "new" ? undefined : editing}
          contacts={contacts}
          conn={conn}
          by={user.name}
          onClose={() => setEditing(null)}
          onSave={(c, message) => { save(c, message); setEditing(null); }}
          onMessages={(out) => setMessages((prev) => [...out, ...prev])}
          notify={notify}
        />
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} icon={Trash2} size="sm" title={`Delete ${deleting?.name}?`} subtitle="The draft is removed. Nothing has been sent."
        footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setDeleting(null)} className={buttonSecondary}>Cancel</button><button type="button" onClick={() => { setCampaigns((prev) => prev.filter((c) => c.id !== deleting!.id)); setDeleting(null); notify("Campaign deleted"); }} className={cn(buttonPrimary, "bg-danger hover:bg-danger/90")}>Delete</button></div>}
      >
        <p className="text-sm text-muted-foreground">This can&apos;t be undone.</p>
      </Modal>
      {toast}
    </div>
  );
}

function Toggle<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground hover:bg-surface-hover")}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

function CampaignBuilder({ campaign, contacts, conn, by, onClose, onSave, onMessages, notify }: {
  campaign?: SmsCampaign; contacts: SmsContact[]; conn: SmsConnection | null; by: string;
  onClose: () => void; onSave: (c: SmsCampaign, message: string) => void; onMessages: (m: SmsMessage[]) => void; notify: (text: string, tone?: "success" | "error") => void;
}) {
  const readOnly = campaign?.status === "Sent";
  const [name, setName] = useState(campaign?.name ?? "");
  const [purpose, setPurpose] = useState<SmsCampaign["purpose"]>(campaign?.purpose ?? "Courses & intakes");
  const [audience, setAudience] = useState<SmsAudience>(campaign?.audience ?? { types: ["Lead", "Applicant"], countries: ["United Kingdom"], subjects: [], intakes: [] });
  const [body, setBody] = useState(campaign?.body ?? marketingTemplates["Courses & intakes"]);
  const [when, setWhen] = useState(campaign?.scheduledFor ?? "");
  const [tested, setTested] = useState(campaign?.status === "Test sent" || campaign?.status === "Scheduled");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const { matched, eligible, reasons } = useMemo(() => audienceBreakdown(contacts, audience), [contacts, audience]);
  const sample = eligible[0];
  const preview = sample ? fillTemplate(body, contactValues(sample)) : body;
  const seg = segmentInfo(preview);
  const cost = estimateCost(eligible.map((c) => c.phone), seg.segments);
  const leftover = unfilledTokens(preview);
  const problems = [
    name.trim().length < 3 && "Give the campaign a name",
    !hasOptOutText(body) && "Add the opt-out text (Reply STOP to opt out)",
    leftover.length > 0 && `Replace ${leftover.map((t) => `{${t}}`).join(", ")} with real text`,
    !eligible.length && "Nobody in this audience can receive marketing",
  ].filter(Boolean) as string[];
  const testers = contacts.filter((c) => c.type === "Internal test");

  const draft = (status: SmsCampaign["status"], extra: Partial<SmsCampaign> = {}): SmsCampaign => ({
    id: campaign?.id ?? nextCampaignId(), name: name.trim(), purpose, audience, body, status, createdBy: campaign?.createdBy ?? by, createdAt: campaign?.createdAt ?? smsToday,
    scheduledFor: when || undefined, recipients: eligible.length, excluded: matched.length - eligible.length, ...extra,
  });

  const sendTo = async (list: SmsContact[], test: boolean) => {
    const out: SmsMessage[] = [];
    for (const [i, c] of list.entries()) {
      setBusy(`${test ? "Sending test" : "Sending"} ${i + 1} of ${list.length}…`);
      const text = fillTemplate(body, contactValues(c));
      out.push(await deliver({ contact: c, body: test ? `[TEST] ${text}` : text, category: "marketing", topic: "Marketing", by, conn, campaignId: campaign?.id ?? draft("Draft").id }));
    }
    setBusy(null);
    onMessages(out);
    return out;
  };

  const sendTest = async () => {
    const out = await sendTo(testers, true);
    setTested(true);
    const ok = out.filter((m) => m.status !== "blocked" && m.status !== "failed").length;
    notify(`Test ${sendsForReal(conn) ? "sent" : "simulated"} to ${ok} of ${testers.length} internal numbers`, ok ? "success" : "error");
  };
  const sendNow = async () => {
    setConfirm(false);
    const out = await sendTo(eligible, false);
    const bad = out.filter((m) => m.status === "blocked" || m.status === "failed").length;
    onSave(draft("Sent", { sentAt: smsToday, scheduledFor: undefined }), `${out.length - bad} ${sendsForReal(conn) ? "sent" : "simulated"}${bad ? ` · ${bad} not sent` : ""}`);
  };

  const outsideHours = when ? !withinMarketingHours(new Date(when)) : !withinMarketingHours(new Date());

  return (
    <Modal open onClose={busy ? () => undefined : onClose} icon={Megaphone} size="lg" title={campaign ? (readOnly ? campaign.name : "Edit campaign") : "New campaign"} subtitle={readOnly ? `Sent ${formatDay(campaign!.sentAt ?? "")} to ${campaign!.recipients} contacts` : "Marketing texts go only to contacts who opted in."}
      footer={
        readOnly ? (
          <div className="flex justify-end"><button type="button" onClick={onClose} className={buttonSecondary}>Close</button></div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{busy ?? (problems[0] ? <span className="font-medium text-danger">{problems[0]}</span> : `${eligible.length} recipients · ${seg.segments} part${seg.segments === 1 ? "" : "s"} · est. ${formatGbp(cost.gbp)}`)}</span>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={!!busy || name.trim().length < 3} onClick={() => onSave(draft(tested ? "Test sent" : "Draft"), "Draft saved")} className={cn(buttonSecondary, "disabled:opacity-50")}>Save draft</button>
              <button type="button" disabled={!!busy || problems.length > 0} onClick={sendTest} className={cn(buttonSecondary, "disabled:opacity-50")}><FlaskConical className="size-4" /> Send test</button>
              {when ? (
                <button type="button" disabled={!!busy || problems.length > 0 || !tested} title={!tested ? "Send a test to the internal group first" : undefined} onClick={() => onSave(draft("Scheduled"), `Scheduled for ${formatDay(when)} ${when.slice(11, 16)}`)} className={cn(buttonPrimary, "disabled:opacity-50")}><CalendarClock className="size-4" /> Schedule</button>
              ) : (
                <button type="button" disabled={!!busy || problems.length > 0 || !tested} title={!tested ? "Send a test to the internal group first" : undefined} onClick={() => setConfirm(true)} className={cn(buttonPrimary, "disabled:opacity-50")}><Send className="size-4" /> Send now</button>
              )}
            </div>
          </div>
        )
      }
    >
      <fieldset disabled={readOnly || !!busy} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Campaign name" required><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. January 2027 intake — UK leads" /></Field>
          <Field label="Purpose">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(marketingTemplates) as SmsCampaign["purpose"][]).map((p) => (
                <button key={p} type="button" aria-pressed={purpose === p} onClick={() => { setPurpose(p); setBody(marketingTemplates[p]); if (p === "Ambassador programme") setAudience({ ...audience, types: ["Ambassador", "Applicant"] }); }} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", purpose === p ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground hover:bg-surface-hover")}>{p}</button>
              ))}
            </div>
          </Field>
        </div>

        <section className="flex flex-col gap-3 rounded-2xl border border-border p-4">
          <h4 className="text-xs font-semibold text-foreground">Audience <span className="font-normal text-muted-foreground">— leave a row empty to include everyone</span></h4>
          <Field label="Contact type"><Toggle<SmsContactType> options={["Lead", "Applicant", "Ambassador"]} value={audience.types} onChange={(types) => setAudience({ ...audience, types })} /></Field>
          <Field label="Country"><Toggle options={["United Kingdom", "Bangladesh", "Other"] as const} value={audience.countries as ("United Kingdom" | "Bangladesh" | "Other")[]} onChange={(countries) => setAudience({ ...audience, countries })} /></Field>
          <Field label="Subject interest"><Toggle options={subjects} value={audience.subjects as (typeof subjects)[number][]} onChange={(s) => setAudience({ ...audience, subjects: s })} /></Field>
          <Field label="Intake"><Toggle options={intakesOffered} value={audience.intakes as (typeof intakesOffered)[number][]} onChange={(i) => setAudience({ ...audience, intakes: i })} /></Field>
          <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
            <div><p className="text-lg font-bold tabular-nums text-foreground">{matched.length}</p><p className="text-[11px] text-muted-foreground">match the audience</p></div>
            <div><p className="text-lg font-bold tabular-nums text-success">{eligible.length}</p><p className="text-[11px] text-muted-foreground">opted in — will receive</p></div>
            <div><p className="text-lg font-bold tabular-nums text-muted-foreground">{matched.length - eligible.length}</p><p className="text-[11px] text-muted-foreground">excluded</p></div>
          </div>
          {Object.keys(reasons).length > 0 && <p className="text-[11px] text-muted-foreground">Excluded: {Object.entries(reasons).map(([r, n]) => `${n} ${r.toLowerCase()}`).join(" · ")}</p>}
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px]">
          <Field label="Message" hint="{first_name}, {intake} and {subject} fill in for each person.">
            <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
            {!hasOptOutText(body) && !readOnly && <button type="button" onClick={() => setBody(`${body.trim()} ${MARKETING_OPT_OUT}`)} className="self-start text-xs font-semibold text-primary hover:underline">Add “{MARKETING_OPT_OUT}”</button>}
          </Field>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-foreground">Preview{sample ? ` — ${sample.name.split(" ")[0]}` : ""}</p>
            <p className="whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-surface-muted px-3 py-2 text-xs text-foreground">{preview}</p>
            <p className="text-[11px] text-muted-foreground">{seg.units} characters · {seg.segments} part{seg.segments === 1 ? "" : "s"} · {seg.encoding}</p>
          </div>
        </div>

        <section className="rounded-2xl bg-surface-muted p-4">
          <h4 className="mb-2 text-xs font-semibold text-foreground">Estimated cost</h4>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
            {Object.entries(cost.byCountry).map(([country, x]) => <span key={country} className="text-muted-foreground">{country}: <span className="font-semibold tabular-nums text-foreground">{x.count} × {seg.segments} part{seg.segments === 1 ? "" : "s"} = {formatGbp(x.usd * USD_TO_GBP)}</span></span>)}
            <span className="text-muted-foreground">Total: <span className="font-semibold tabular-nums text-foreground">{formatGbp(cost.gbp)}</span> (≈ ${cost.usd.toFixed(2)})</span>
          </div>
        </section>

        {cost.byCountry.Bangladesh && <Notice tone="warning">{cost.byCountry.Bangladesh.count} recipients are in Bangladesh — about $0.60 per part, over 10× the UK rate, and blocked on the main networks until the “BHEUni” sender ID is registered (about 3 weeks). Consider WhatsApp for them instead.</Notice>}
        {seg.encoding === "Unicode" && <Notice tone="warning">{seg.culprits.map((c) => `“${c}”`).join(" ")} switches the message to Unicode — 70 characters per part instead of 160.</Notice>}

        {!readOnly && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Send" hint="Leave empty to send straight after the test.">
              <TextInput type="datetime-local" value={when} min={`${smsToday}T09:00`} onChange={(e) => setWhen(e.target.value)} />
            </Field>
            <div className="flex flex-col gap-2 self-end">
              {outsideHours && <Notice tone="warning">Outside 9am–8pm Mon–Sat. Marketing texts at night or on Sundays get far more opt-outs.</Notice>}
              <Notice tone={tested ? "success" : "neutral"}>{tested ? "Test sent to the internal group — check how it looks on a real phone before sending." : `Send a test to the ${testers.length} internal numbers first. Sending to contacts unlocks after that.`}</Notice>
            </div>
          </div>
        )}
      </fieldset>

      <Modal open={confirm} onClose={() => setConfirm(false)} icon={Send} size="sm" title={`Send to ${eligible.length} contacts now?`} subtitle={`${seg.segments} part${seg.segments === 1 ? "" : "s"} each · estimated ${formatGbp(cost.gbp)}`}
        footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setConfirm(false)} className={buttonSecondary}>Cancel</button><button type="button" onClick={sendNow} className={buttonPrimary}><Send className="size-4" /> Send now</button></div>}
      >
        <p className="text-sm text-muted-foreground">
          {!sendsForReal(conn) ? "Twilio isn't connected, so this will be simulated — nothing leaves the CRM." : conn?.mode === "test" ? "Test mode is on: the server will only deliver to allowlisted internal numbers; the rest are logged as blocked." : "Messages go out immediately and can't be recalled."}
        </p>
      </Modal>
    </Modal>
  );
}
