"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCheck, Download, Megaphone, MessageSquareText, PoundSterling, Send, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { formatDay } from "@/components/people/people-ui";
import { applyConsent, ComposeDialog, ConnectionBanner, ContactPanel, SmsStatusBadge, smsStatusOptions, type ConsentAction } from "@/components/sms/sms-ui";
import { refreshStatuses, useSmsConnection } from "@/lib/sms/client";
import { formatGbp, serviceTopics } from "@/lib/sms/rules";
import { getSmsContacts, getSmsMessages, saveSmsContacts, saveSmsMessages, smsContactTypes, smsToday, type SmsContact, type SmsMessage } from "@/lib/mock/sms";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const PAGE = 25;

export default function SmsMessagesPage() {
  const { user } = useUser();
  const { conn, loading } = useSmsConnection();
  const [contacts, setContacts] = useState<SmsContact[]>(getSmsContacts);
  const [messages, setMessages] = useState<SmsMessage[]>(getSmsMessages);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [composing, setComposing] = useState<SmsContact[] | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [toast, notify] = useToast();

  useEffect(() => saveSmsMessages(messages), [messages]);
  useEffect(() => saveSmsContacts(contacts), [contacts]);

  // Poll Twilio for delivery updates while any real message is still in flight.
  const inFlight = messages.some((m) => m.via === "twilio" && m.sid && ["queued", "sending", "sent"].includes(m.status));
  useEffect(() => {
    if (!inFlight) return;
    const t = setInterval(async () => {
      const updates = await refreshStatuses(messages.slice(0, 100));
      if (updates.size) setMessages((prev) => prev.map((m) => (m.sid && updates.has(m.sid) ? { ...m, ...updates.get(m.sid) } : m)));
    }, 5000);
    return () => clearInterval(t);
  }, [inFlight, messages]);

  const byId = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
  const q = search.trim().toLowerCase();
  const filtered = messages.filter((m) => {
    const c = byId.get(m.contactId);
    return (!category || m.category === category) && (!topic || m.topic === topic) && (!status || m.status === status) && (!type || c?.type === type) && (!q || `${c?.name} ${m.to} ${m.body} ${c?.ref}`.toLowerCase().includes(q));
  });
  const hasFilters = !!(search || category || topic || status || type);
  const reset = () => { setSearch(""); setCategory(""); setTopic(""); setStatus(""); setType(""); };

  const last30 = messages.filter((m) => m.sentAt.slice(0, 10) >= new Date(Date.parse(smsToday) - 30 * 86_400_000).toISOString().slice(0, 10));
  const sent = last30.filter((m) => m.status !== "blocked");
  const delivered = sent.filter((m) => m.status === "delivered").length;
  const final = sent.filter((m) => ["delivered", "undelivered", "failed"].includes(m.status)).length;
  const failed = sent.filter((m) => m.status === "failed" || m.status === "undelivered").length;
  const blocked = last30.filter((m) => m.status === "blocked").length;
  const spend = sent.reduce((n, m) => n + m.costGbp, 0);

  const onSent = (out: SmsMessage[]) => {
    setMessages((prev) => [...out, ...prev]);
    setComposing(null);
    const ok = out.filter((m) => m.status !== "blocked" && m.status !== "failed").length;
    const bad = out.length - ok;
    notify(`${ok} ${out[0]?.status === "simulated" ? "simulated" : "sent"}${bad ? ` · ${bad} not sent — see the log` : ""}`, bad && !ok ? "error" : "success");
  };
  const onConsent = (c: SmsContact, a: ConsentAction) => {
    setContacts((prev) => prev.map((x) => (x.id === c.id ? applyConsent(x, a, user.name, smsToday) : x)));
    notify("Consent updated");
  };
  const exportRows = () =>
    downloadCsv("sms-message-log.csv", filtered.map((m) => {
      const c = byId.get(m.contactId);
      return { id: m.id, sid: m.sid ?? "", sent: m.sentAt, contact: c?.name ?? "", type: c?.type ?? "", to: m.to, category: m.category, topic: m.topic, status: m.status, error: m.errorCode ?? m.blockedReason ?? "", parts: m.segments, costGbp: m.costGbp.toFixed(3), sentBy: m.sentBy, body: m.body };
    }));

  const viewing = viewingId ? byId.get(viewingId) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">SMS Messages</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Every text sent to leads, applicants and ambassadors, with its delivery status. Service messages are sent from here; marketing goes through Campaigns.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={exportRows} className={buttonSecondary}><Download className="size-4" /> Export</button>
          <Link href="/communications/sms/campaigns" className={buttonSecondary}><Megaphone className="size-4" /> Campaigns</Link>
          <button type="button" onClick={() => setComposing([])} className={buttonPrimary}><Send className="size-4" /> Service message</button>
        </div>
      </header>

      <ConnectionBanner conn={conn} loading={loading} />

      <StatGrid>
        <StatCard icon={MessageSquareText} label="Sent (30 days)" value={sent.length} note={`${last30.filter((m) => m.category === "marketing").length} marketing`} onClick={reset} />
        <StatCard icon={CheckCheck} tone="success" label="Delivery rate" value={final ? `${Math.round((delivered / final) * 100)}%` : "—"} note={`${delivered} delivered`} onClick={() => setStatus("delivered")} />
        <StatCard icon={TriangleAlert} tone={failed ? "warning" : "success"} label="Failed or undelivered" value={failed} note={blocked ? `${blocked} blocked` : undefined} onClick={() => setStatus("undelivered")} />
        <StatCard icon={PoundSterling} tone="violet" label="Spend (30 days)" value={formatGbp(spend)} note={sent.length ? `${formatGbp(spend / sent.length)} avg` : undefined} />
      </StatGrid>

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Contact, number, message text…" label="Search messages" />
        <SelectFilter label="Type" value={category} onChange={setCategory} allLabel="Service & marketing" options={[{ value: "service", label: "Service" }, { value: "marketing", label: "Marketing" }]} />
        <SelectFilter label="Topic" value={topic} onChange={setTopic} allLabel="All topics" options={[...serviceTopics, "Marketing"]} />
        <SelectFilter label="Status" value={status} onChange={setStatus} allLabel="Any status" options={smsStatusOptions} />
        <SelectFilter label="Contact" value={type} onChange={setType} allLabel="All contacts" options={smsContactTypes} />
        {hasFilters && <ResetFilters onClick={reset} />}
      </FilterBar>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Message log</h3>
          <p className="text-xs text-muted-foreground">{filtered.length} message{filtered.length === 1 ? "" : "s"} · newest first · click a contact for their full history and consent</p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-xs">
            <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2.5 pl-5 pr-3">Contact</th>
                <th className="px-3 py-2.5">Message</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Sent</th>
                <th className="py-2.5 pl-3 pr-5 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.slice(0, shown).map((m) => {
                const c = byId.get(m.contactId);
                return (
                  <tr key={m.id} className="align-top transition-colors hover:bg-surface-hover/60">
                    <td className="py-3 pl-5 pr-3">
                      <button type="button" onClick={() => c && setViewingId(c.id)} className="text-left">
                        <span className="block whitespace-nowrap text-sm font-semibold text-foreground hover:text-primary">{c?.name ?? m.to}</span>
                        <span className="block whitespace-nowrap text-[11px] text-muted-foreground">{c?.type} · {m.to}</span>
                      </button>
                    </td>
                    <td className="max-w-[440px] px-3 py-3">
                      <span className={cn("mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", m.category === "marketing" ? "bg-primary-soft text-primary" : "bg-surface-hover text-muted-foreground")}>
                        {m.category === "marketing" ? <Megaphone className="size-3" /> : <MessageSquareText className="size-3" />}{m.topic}
                      </span>
                      <p className="line-clamp-2 text-foreground" title={m.body}>{m.body}</p>
                    </td>
                    <td className="px-3 py-3"><SmsStatusBadge message={m} /></td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="text-foreground">{formatDay(m.sentAt)} {m.sentAt.slice(11, 16)}</p>
                      <p className="text-[11px] text-muted-foreground">{m.sentBy}</p>
                    </td>
                    <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right tabular-nums">
                      <p className="text-foreground">{m.costGbp ? formatGbp(m.costGbp) : "—"}</p>
                      <p className="text-[11px] text-muted-foreground">{m.segments} part{m.segments === 1 ? "" : "s"}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && <p className="px-6 py-14 text-center text-sm text-muted-foreground">No messages match.</p>}
          {filtered.length > shown && (
            <div className="border-t border-border px-5 py-3 text-center">
              <button type="button" onClick={() => setShown(shown + PAGE)} className="text-xs font-semibold text-primary hover:underline">Show {Math.min(PAGE, filtered.length - shown)} more of {filtered.length - shown}</button>
            </div>
          )}
        </div>
      </Card>

      {composing && <ComposeDialog contacts={contacts} initial={composing} conn={conn} by={user.name} onClose={() => setComposing(null)} onSent={onSent} />}
      {viewing && (
        <ContactPanel contact={viewing} messages={messages} onClose={() => setViewingId(null)} onCompose={() => { setComposing([viewing]); setViewingId(null); }} onConsent={(a) => onConsent(viewing, a)} />
      )}
      {toast}
    </div>
  );
}
