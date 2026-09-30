"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, Clock3, Download, FileDown, Hourglass, PauseCircle, PlayCircle, SearchX, Users, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { BarButton, HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { Modal } from "@/components/ui/modal";
import { Field, Select, TextInput } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/office/office-ui";
import { formatDay } from "@/components/people/people-ui";
import { TierBadge } from "@/components/agents/agent-ui";
import { PayoutBadge } from "@/components/finance/finance-ui";
import { getAgents } from "@/lib/mock/agents";
import { financeToday, getClaims, last12Months, money, paid, saveClaims, toGbp, type Claim, type PayoutStatus } from "@/lib/mock/finance";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

type View = "agents" | "lines";
const payoutStatuses: PayoutStatus[] = ["Due", "On hold", "Awaiting university", "Paid"];
/** Total agent payout of some lines, in GBP. */
const sum = (list: Claim[]) => list.reduce((n, c) => n + toGbp(c.agentAmount, c.currency), 0);

export default function AgentCommissionPage() {
  const [claims, setClaims] = useState<Claim[]>(getClaims);
  const [view, setView] = useState<View>("agents");
  const [search, setSearch] = useState("");
  const [agent, setAgent] = useState("");
  const [status, setStatus] = useState("");
  const [intake, setIntake] = useState("");
  const [paying, setPaying] = useState<Claim[] | null>(null);
  const [toast, notify] = useToast();

  useEffect(() => saveClaims(claims), [claims]);

  const lines = useMemo(() => claims.filter((c) => c.channel === "Agent" && c.agent && c.status !== "Written off"), [claims]);
  const yearStart = `${last12Months()[0]}-01`;

  const byAgent = useMemo(() => {
    const agents = getAgents();
    const names = [...new Set(lines.map((c) => c.agent!))];
    return names
      .map((name) => {
        const mine = lines.filter((c) => c.agent === name);
        const info = agents.find((a) => a.name === name);
        return {
          name,
          info,
          share: info?.commissionShare ?? mine[0]?.agentShare ?? 50,
          students: mine.length,
          received: mine.reduce((n, c) => n + toGbp(paid(c), c.currency), 0),
          paidOut: sum(mine.filter((c) => c.payoutStatus === "Paid")),
          paidYear: sum(mine.filter((c) => c.payoutStatus === "Paid" && (c.payoutDate ?? "") >= yearStart)),
          due: mine.filter((c) => c.payoutStatus === "Due"),
          hold: mine.filter((c) => c.payoutStatus === "On hold"),
          waiting: sum(mine.filter((c) => c.payoutStatus === "Awaiting university")),
          lastPaid: mine.map((c) => c.payoutDate ?? "").sort().at(-1) ?? "",
        };
      })
      .sort((a, b) => sum(b.due) - sum(a.due) || b.paidOut - a.paidOut);
  }, [lines, yearStart]);

  const q = search.trim().toLowerCase();
  const agentRows = byAgent.filter((a) => (!agent || a.name === agent) && (!status || (status === "Due" ? a.due.length : status === "On hold" ? a.hold.length : status === "Awaiting university" ? a.waiting : a.paidOut)) && (!q || `${a.name} ${a.info?.contactName ?? ""} ${a.info?.country ?? ""}`.toLowerCase().includes(q)));
  const lineRows = lines
    .filter((c) => (!agent || c.agent === agent) && (!status || c.payoutStatus === status) && (!intake || c.intake === intake) && (!q || `${c.student} ${c.agent} ${c.university} ${c.invoiceNo ?? ""}`.toLowerCase().includes(q)))
    .sort((a, b) => payoutStatuses.indexOf(a.payoutStatus) - payoutStatuses.indexOf(b.payoutStatus) || (b.payments.at(-1)?.date ?? "").localeCompare(a.payments.at(-1)?.date ?? ""));

  const selection = useRowSelection(view === "lines" ? lineRows.map((c) => c.id) : []);
  const selected = lineRows.filter((c) => selection.isSelected(c.id));
  const hasFilters = !!(search || agent || status || intake);

  const update = (ids: string[], patch: (c: Claim) => Partial<Claim>) => {
    const set = new Set(ids);
    setClaims((prev) => prev.map((c) => (set.has(c.id) ? { ...c, ...patch(c) } : c)));
  };

  const statement = (name: string) => {
    const mine = lines.filter((c) => c.agent === name);
    downloadCsv(
      `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-statement.csv`,
      mine.map((c) => ({
        student: c.student, university: c.university, course: c.course, intake: c.intake, invoice: c.invoiceNo ?? "", currency: c.currency,
        commissionReceived: paid(c), agentShare: `${c.agentShare}%`, payout: c.agentAmount, status: c.payoutStatus, paidOn: c.payoutDate ?? "", reference: c.payoutRef ?? "",
      }))
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Agent Commission</h2>
          <p className="mt-1 text-sm text-muted-foreground">What BHE owes agents out of the commission universities pay. A payout becomes due once the university has paid in full.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => downloadCsv("agent-payouts.csv", lineRows.map((c) => ({ agent: c.agent ?? "", student: c.student, university: c.university, intake: c.intake, currency: c.currency, payout: c.agentAmount, status: c.payoutStatus, paidOn: c.payoutDate ?? "" })))} className={buttonSecondary}><Download className="size-4" /> Export</button>
          <Link href="/agent-management" className={buttonSecondary}><Users className="size-4" /> Agents</Link>
        </div>
      </header>

      <StatGrid>
        <StatCard icon={Banknote} tone="warning" label="Due to agents now" value={money(sum(lines.filter((c) => c.payoutStatus === "Due")), "GBP", true)} note={`${new Set(lines.filter((c) => c.payoutStatus === "Due").map((c) => c.agent)).size} agents`} onClick={() => { setView("lines"); setStatus("Due"); }} />
        <StatCard icon={Wallet} tone="success" label="Paid · 12 months" value={money(sum(lines.filter((c) => c.payoutStatus === "Paid" && (c.payoutDate ?? "") >= yearStart)), "GBP", true)} />
        <StatCard icon={Hourglass} label="Awaiting university" value={money(sum(lines.filter((c) => c.payoutStatus === "Awaiting university")), "GBP", true)} note="not due yet" onClick={() => { setView("lines"); setStatus("Awaiting university"); }} />
        <StatCard icon={PauseCircle} tone="danger" label="On hold" value={lines.filter((c) => c.payoutStatus === "On hold").length} note="payouts" onClick={() => { setView("lines"); setStatus("On hold"); }} />
      </StatGrid>

      <Tabs<View> label="View" value={view} onChange={(v) => { setView(v); selection.clear(); }} options={[{ value: "agents", label: "By agent", count: byAgent.length }, { value: "lines", label: "Payout lines", count: lines.length }]} />

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder={view === "agents" ? "Agent, contact, country…" : "Student, agent, university…"} label="Search agent commission" />
        <SelectFilter label="Agent" value={agent} onChange={setAgent} allLabel="All agents" searchable width="w-64" options={byAgent.map((a) => ({ value: a.name, label: a.name, hint: a.students }))} />
        <SelectFilter label="Payout status" value={status} onChange={setStatus} allLabel="Any status" options={payoutStatuses.map((s) => ({ value: s, label: s }))} />
        {view === "lines" && <SelectFilter label="Intake" value={intake} onChange={setIntake} allLabel="All intakes" options={[...new Set(lines.map((c) => c.intake))]} />}
        {hasFilters && <ResetFilters onClick={() => { setSearch(""); setAgent(""); setStatus(""); setIntake(""); }} />}
      </FilterBar>

      {view === "agents" ? (
        <Card className="overflow-hidden">
          <div className="px-5 pt-5">
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Agents</h3>
            <p className="text-xs text-muted-foreground">{agentRows.length} agents with enrolled students · most owed first · amounts in GBP</p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-xs">
              <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2.5 pl-5 pr-3">Agent</th>
                  <th className="px-3 py-2.5 text-right">Students</th>
                  <th className="px-3 py-2.5 text-right">Received by BHE</th>
                  <th className="px-3 py-2.5 text-right">Paid to agent</th>
                  <th className="px-3 py-2.5 text-right">Due now</th>
                  <th className="px-3 py-2.5 text-right">Awaiting uni</th>
                  <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agentRows.map((a) => {
                  const due = sum(a.due);
                  return (
                    <tr key={a.name} className="transition-colors hover:bg-surface-hover/60">
                      <td className="py-3 pl-5 pr-3">
                        <button type="button" onClick={() => { setView("lines"); setAgent(a.name); }} className="text-left">
                          <span className="block text-sm font-semibold text-foreground hover:text-primary">{a.name}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            {a.info && <TierBadge tier={a.info.tier} />}
                            {a.share}% share{a.info ? ` · ${a.info.country}` : ""}
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-foreground">{a.students}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-foreground">{money(a.received)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        <p className="tabular-nums text-foreground">{money(a.paidOut)}</p>
                        <p className="text-[11px] text-muted-foreground">{a.lastPaid ? `last ${formatDay(a.lastPaid)}` : "nothing yet"}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        <p className={cn("font-semibold tabular-nums", due ? "text-warning" : "text-muted-foreground")}>{due ? money(due) : "—"}</p>
                        {a.hold.length > 0 && <p className="text-[11px] text-danger">{a.hold.length} on hold</p>}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{a.waiting ? money(a.waiting) : "—"}</td>
                      <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {due > 0 && <button type="button" onClick={() => setPaying(a.due)} className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"><Banknote className="size-3.5" /> Pay {money(due, "GBP", true)}</button>}
                          <button type="button" onClick={() => statement(a.name)} aria-label={`Download statement for ${a.name}`} title="Download statement" className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground"><FileDown className="size-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {agentRows.length === 0 && <Empty />}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="px-5 pt-5">
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Payout lines</h3>
            <p className="text-xs text-muted-foreground">{lineRows.length} students · {money(sum(lineRows))} in agent commission</p>
          </div>
          <SelectionBar selection={selection} noun={["payout", "payouts"]} className="mx-5 mt-3">
            {selected.some((c) => c.payoutStatus === "Due") && <BarButton onClick={() => setPaying(selected.filter((c) => c.payoutStatus === "Due"))}><Banknote className="size-3.5" /> Pay</BarButton>}
            {selected.some((c) => c.payoutStatus === "Due") && <BarButton onClick={() => { update(selected.filter((c) => c.payoutStatus === "Due").map((c) => c.id), () => ({ payoutStatus: "On hold" })); notify("Payouts put on hold"); selection.clear(); }}>Hold</BarButton>}
            {selected.some((c) => c.payoutStatus === "On hold") && <BarButton onClick={() => { update(selected.filter((c) => c.payoutStatus === "On hold").map((c) => c.id), (c) => ({ payoutStatus: c.status === "Paid" ? "Due" : "Awaiting university" })); notify("Payouts released"); selection.clear(); }}>Release</BarButton>}
          </SelectionBar>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-xs">
              <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-10 py-2.5 pl-5 pr-0"><HeaderCheckbox selection={selection} /></th>
                  <th className="py-2.5 pl-3 pr-3">Student</th>
                  <th className="px-3 py-2.5">Agent</th>
                  <th className="px-3 py-2.5 text-right">University paid</th>
                  <th className="px-3 py-2.5 text-right">Payout</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lineRows.map((c) => (
                  <tr key={c.id} className={cn("transition-colors hover:bg-surface-hover/60", selectedRowClass(selection, c.id))}>
                    <td className="py-3 pl-5 pr-0 align-middle"><RowCheckbox selection={selection} id={c.id} label={`Select ${c.student}`} /></td>
                    <td className="max-w-[260px] py-3 pl-3 pr-3">
                      <p className="truncate font-medium text-foreground">{c.student}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{c.university} · {c.intake}</p>
                    </td>
                    <td className="px-3 py-3 text-foreground">{c.agent}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <p className="tabular-nums text-foreground">{paid(c) ? money(paid(c), c.currency) : "—"}</p>
                      <p className="text-[11px] text-muted-foreground">of {money(c.amount, c.currency)}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <p className="font-semibold tabular-nums text-foreground">{money(c.agentAmount, c.currency)}</p>
                      <p className="text-[11px] text-muted-foreground">{c.agentShare}% share</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <PayoutBadge status={c.payoutStatus} />
                      {c.payoutDate && <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDay(c.payoutDate)} · {c.payoutRef}</p>}
                    </td>
                    <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right">
                      {c.payoutStatus === "Due" ? (
                        <div className="inline-flex gap-1.5">
                          <button type="button" onClick={() => { update([c.id], () => ({ payoutStatus: "On hold" })); notify(`${c.student}'s payout on hold`); }} aria-label="Put on hold" title="Put on hold" className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground"><PauseCircle className="size-4" /></button>
                          <button type="button" onClick={() => setPaying([c])} className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"><Banknote className="size-3.5" /> Pay</button>
                        </div>
                      ) : c.payoutStatus === "On hold" ? (
                        <button type="button" onClick={() => { update([c.id], (x) => ({ payoutStatus: x.status === "Paid" ? "Due" : "Awaiting university" })); notify("Payout released"); }} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover"><PlayCircle className="size-3.5" /> Release</button>
                      ) : c.payoutStatus === "Awaiting university" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Clock3 className="size-3" /> {c.invoiceNo ?? "not invoiced"}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lineRows.length === 0 && <Empty />}
          </div>
        </Card>
      )}

      {paying && (
        <PayoutDialog
          lines={paying}
          onClose={() => setPaying(null)}
          onPay={(date, method, ref) => {
            update(paying.map((c) => c.id), () => ({ payoutStatus: "Paid", payoutDate: date, payoutRef: `${method} ${ref}` }));
            notify(`${paying.length === 1 ? "Payout" : `${paying.length} payouts`} to ${[...new Set(paying.map((c) => c.agent))].join(", ")} recorded`);
            setPaying(null);
            selection.clear();
          }}
        />
      )}
      {toast}
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-muted-foreground"><SearchX className="size-5" /></span>
      <p className="text-sm font-medium text-foreground">Nothing matches</p>
      <p className="text-xs text-muted-foreground">Try other filters.</p>
    </div>
  );
}

function PayoutDialog({ lines, onClose, onPay }: { lines: Claim[]; onClose: () => void; onPay: (date: string, method: string, ref: string) => void }) {
  const [date, setDate] = useState(financeToday);
  const [method, setMethod] = useState("Bank transfer");
  const [ref, setRef] = useState("");
  const byCurrency = lines.reduce<Record<string, number>>((m, c) => ({ ...m, [c.currency]: (m[c.currency] ?? 0) + c.agentAmount }), {});
  const agents = [...new Set(lines.map((c) => c.agent))];
  return (
    <Modal
      open
      onClose={onClose}
      icon={Banknote}
      size="sm"
      title={`Pay ${agents.length === 1 ? agents[0] : `${agents.length} agents`}`}
      subtitle={`${lines.length} student${lines.length === 1 ? "" : "s"} · ${Object.entries(byCurrency).map(([c, n]) => money(n, c as Claim["currency"])).join(" + ")}`}
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" disabled={ref.trim().length < 3 || !date} onClick={() => onPay(date, method, ref.trim())} className={buttonPrimary}>Record payout</button></div>}
    >
      <div className="flex flex-col gap-4">
        <ul className="max-h-40 overflow-y-auto rounded-xl border border-border text-xs">
          {lines.map((c) => (
            <li key={c.id} className="flex justify-between gap-2 border-b border-border px-3 py-2 last:border-0">
              <span className="truncate text-foreground">{c.student} <span className="text-muted-foreground">· {c.agent}</span></span>
              <span className="shrink-0 font-semibold tabular-nums text-foreground">{money(c.agentAmount, c.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Paid on">
            <TextInput type="date" max={financeToday} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Method">
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>Bank transfer</option>
              <option>Wise</option>
              <option>Cheque</option>
            </Select>
          </Field>
        </div>
        <Field label="Payment reference" hint="From the bank or Wise confirmation.">
          <TextInput value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. TRF-20260917-0042" />
        </Field>
      </div>
    </Modal>
  );
}
