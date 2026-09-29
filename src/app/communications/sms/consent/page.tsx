"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CircleHelp, Download, ShieldOff, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { BarButton, HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { formatDay } from "@/components/people/people-ui";
import { applyConsent, ComposeDialog, ConnectionBanner, ConsentBadges, ContactPanel, SmsStatusBadge, type ConsentAction } from "@/components/sms/sms-ui";
import { fetchServerOptOuts, useSmsConnection } from "@/lib/sms/client";
import { getSmsContacts, getSmsMessages, saveSmsContacts, saveSmsMessages, smsContactTypes, smsToday, type SmsContact, type SmsMessage } from "@/lib/mock/sms";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const PAGE = 30;

export default function SmsConsentPage() {
  const { user } = useUser();
  const { conn, loading } = useSmsConnection();
  const [contacts, setContacts] = useState<SmsContact[]>(getSmsContacts);
  const [messages, setMessages] = useState<SmsMessage[]>(getSmsMessages);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [country, setCountry] = useState("");
  const [marketing, setMarketing] = useState("");
  const [service, setService] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [composing, setComposing] = useState<SmsContact[] | null>(null);
  const [toast, notify] = useToast();

  useEffect(() => saveSmsContacts(contacts), [contacts]);
  useEffect(() => saveSmsMessages(messages), [messages]);

  // Pick up STOP replies that reached the server through Twilio's inbound webhook.
  useEffect(() => {
    let live = true;
    fetchServerOptOuts(getSmsContacts().map((c) => c.phone)).then((outs) => {
      if (!live || !outs.length) return;
      const byNumber = new Map(outs.map((o) => [o.number, o]));
      setContacts((prev) => prev.map((c) => (byNumber.has(c.phone) && c.consent.service === "active" ? applyConsent(c, { kind: "stop" }, `Twilio (${byNumber.get(c.phone)!.via})`, byNumber.get(c.phone)!.at.slice(0, 10)) : c)));
    });
    return () => {
      live = false;
    };
  }, []);

  const lastMessage = useMemo(() => {
    const m = new Map<string, SmsMessage>();
    for (const x of messages) if (!m.has(x.contactId)) m.set(x.contactId, x);
    return m;
  }, [messages]);

  const q = search.trim().toLowerCase();
  const filtered = contacts.filter(
    (c) =>
      (!type || c.type === type) &&
      (!country || c.country === country) &&
      (!marketing || c.consent.marketing === marketing) &&
      (!service || c.consent.service === service) &&
      (!q || `${c.name} ${c.phone} ${c.ref} ${c.consent.marketingSource ?? ""}`.toLowerCase().includes(q))
  );
  const hasFilters = !!(search || type || country || marketing || service);
  const reset = () => { setSearch(""); setType(""); setCountry(""); setMarketing(""); setService(""); };
  const visible = filtered.slice(0, shown);
  const selection = useRowSelection(visible.map((c) => c.id));
  const selected = contacts.filter((c) => selection.isSelected(c.id));

  const granted = contacts.filter((c) => c.consent.marketing === "granted" && c.consent.service === "active").length;
  const notAsked = contacts.filter((c) => c.consent.marketing === "not-asked").length;
  const stopped = contacts.filter((c) => c.consent.service === "opted-out").length;

  const onConsent = (c: SmsContact, a: ConsentAction) => {
    setContacts((prev) => prev.map((x) => (x.id === c.id ? applyConsent(x, a, user.name, smsToday) : x)));
    notify(a.kind === "opt-in" ? "Marketing opt-in recorded" : a.kind === "withdraw" ? "Marketing consent withdrawn" : a.kind === "stop" ? "All SMS stopped for this contact" : "Service messages resumed");
  };
  const exportRegister = (rows: SmsContact[]) =>
    downloadCsv("sms-consent-register.csv", rows.map((c) => ({
      id: c.id, name: c.name, type: c.type, record: c.ref, phone: c.phone, country: c.country, serviceMessages: c.consent.service, marketing: c.consent.marketing,
      optInSource: c.consent.marketingSource ?? "", optInDate: c.consent.marketingAt ?? "", optOutDate: c.consent.optedOutAt ?? "", lastChange: c.consentLog[0]?.text ?? "", lastChangeBy: c.consentLog[0]?.by ?? "",
    })));

  const viewing = contacts.find((c) => c.id === viewingId);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">SMS Consent</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Who can receive which texts. Service messages and marketing consent are recorded separately; anyone who texts STOP is blocked from all SMS automatically.</p>
        </div>
        <button type="button" onClick={() => exportRegister(filtered)} className={buttonSecondary}><Download className="size-4" /> Export register</button>
      </header>

      <ConnectionBanner conn={conn} loading={loading} />

      <StatGrid>
        <StatCard icon={Users} label="Contacts with a mobile" value={contacts.length} onClick={reset} />
        <StatCard icon={BadgeCheck} tone="success" label="Can receive marketing" value={granted} note={`${Math.round((granted / contacts.length) * 100)}%`} onClick={() => { setMarketing("granted"); setService("active"); }} />
        <StatCard icon={CircleHelp} tone="neutral" label="Marketing not asked" value={notAsked} onClick={() => setMarketing("not-asked")} />
        <StatCard icon={ShieldOff} tone="danger" label="Texted STOP — no SMS" value={stopped} onClick={() => setService("opted-out")} />
      </StatGrid>

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Name, number, record ID…" label="Search consent register" />
        <SelectFilter label="Contact" value={type} onChange={setType} allLabel="All contacts" options={smsContactTypes.map((t) => ({ value: t, label: t, hint: contacts.filter((c) => c.type === t).length }))} />
        <SelectFilter label="Country" value={country} onChange={setCountry} allLabel="All countries" options={["United Kingdom", "Bangladesh", "Other"]} />
        <SelectFilter label="Marketing" value={marketing} onChange={setMarketing} allLabel="Any" options={[{ value: "granted", label: "Opted in", dot: "bg-primary" }, { value: "not-asked", label: "Not asked", dot: "bg-muted-foreground" }, { value: "withdrawn", label: "Withdrawn", dot: "bg-danger" }]} />
        <SelectFilter label="Service messages" value={service} onChange={setService} allLabel="Any" options={[{ value: "active", label: "Allowed", dot: "bg-success" }, { value: "opted-out", label: "Texted STOP", dot: "bg-danger" }]} />
        {hasFilters && <ResetFilters onClick={reset} />}
      </FilterBar>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Consent register</h3>
          <p className="text-xs text-muted-foreground">{filtered.length} contact{filtered.length === 1 ? "" : "s"} · click one for message history and consent log</p>
        </div>
        <SelectionBar selection={selection} noun={["contact", "contacts"]} onExport={() => exportRegister(selected)} className="mx-5 mt-3">
          <BarButton onClick={() => setComposing(selected)}>Send service message</BarButton>
        </SelectionBar>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 py-2.5 pl-5 pr-0"><HeaderCheckbox selection={selection} /></th>
                <th className="py-2.5 pl-3 pr-3">Contact</th>
                <th className="px-3 py-2.5">Consent</th>
                <th className="px-3 py-2.5">Opt-in source</th>
                <th className="px-3 py-2.5">Last change</th>
                <th className="py-2.5 pl-3 pr-5">Last message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((c) => {
                const last = lastMessage.get(c.id);
                return (
                  <tr key={c.id} className={cn("align-top transition-colors hover:bg-surface-hover/60", selectedRowClass(selection, c.id))}>
                    <td className="py-3 pl-5 pr-0"><RowCheckbox selection={selection} id={c.id} label={`Select ${c.name}`} /></td>
                    <td className="py-3 pl-3 pr-3">
                      <button type="button" onClick={() => setViewingId(c.id)} className="flex items-center gap-2.5 text-left">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-[11px] font-semibold text-muted-foreground">{c.initials}</span>
                        <span>
                          <span className="block whitespace-nowrap text-sm font-semibold text-foreground hover:text-primary">{c.name}</span>
                          <span className="block whitespace-nowrap text-[11px] text-muted-foreground">{c.type} · {c.phone}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3"><ConsentBadges contact={c} /></td>
                    <td className="max-w-52 px-3 py-3">
                      {c.consent.marketingSource ? <><p className="text-foreground">{c.consent.marketingSource}</p><p className="text-[11px] text-muted-foreground">{c.consent.marketingAt ? formatDay(c.consent.marketingAt) : ""}</p></> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="max-w-60 px-3 py-3">
                      <p className="line-clamp-2 text-foreground">{c.consentLog[0]?.text}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDay(c.consentLog[0]?.at ?? "")} · {c.consentLog[0]?.by}</p>
                    </td>
                    <td className="py-3 pl-3 pr-5">{last ? <><SmsStatusBadge message={last} /><p className="mt-1 text-[11px] text-muted-foreground">{last.topic} · {formatDay(last.sentAt)}</p></> : <span className="text-muted-foreground">None yet</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && <p className="px-6 py-14 text-center text-sm text-muted-foreground">No contacts match.</p>}
          {filtered.length > shown && (
            <div className="border-t border-border px-5 py-3 text-center">
              <button type="button" onClick={() => setShown(shown + PAGE)} className="text-xs font-semibold text-primary hover:underline">Show {Math.min(PAGE, filtered.length - shown)} more of {filtered.length - shown}</button>
            </div>
          )}
        </div>
      </Card>

      {viewing && <ContactPanel contact={viewing} messages={messages} onClose={() => setViewingId(null)} onCompose={() => { setComposing([viewing]); setViewingId(null); }} onConsent={(a) => onConsent(viewing, a)} />}
      {composing && (
        <ComposeDialog contacts={contacts} initial={composing} conn={conn} by={user.name} onClose={() => setComposing(null)}
          onSent={(out) => { setMessages((prev) => [...out, ...prev]); setComposing(null); selection.clear(); notify(`${out.filter((m) => m.status !== "blocked").length} message${out.length === 1 ? "" : "s"} ${out[0]?.status === "simulated" ? "simulated" : "sent"}`); }} />
      )}
      {toast}
    </div>
  );
}
