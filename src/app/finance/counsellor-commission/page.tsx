"use client";

import { Fragment, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Award, Banknote, CalendarClock, ChevronDown, Download, Hourglass, Settings2, Wallet } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { Modal } from "@/components/ui/modal";
import { Checkbox, Field, TextInput } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/office/office-ui";
import { Avatar, formatDay } from "@/components/people/people-ui";
import { CounsellorPayBadge } from "@/components/finance/finance-ui";
import {
  financeToday,
  getClaims,
  getPlan,
  last12Months,
  money,
  monthLabel,
  monthlyTargetOf,
  payrollDate,
  planAmount,
  saveClaims,
  savePlan,
  type Claim,
  type CounsellorPlan,
} from "@/lib/mock/finance";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const PENDING = "pending";

export default function CounsellorCommissionPage() {
  const [claims, setClaims] = useState<Claim[]>(getClaims);
  const [plan, setPlan] = useState<CounsellorPlan>(getPlan);
  const eligible = useMemo(() => claims.filter((c) => c.type === "Student commission" && c.status !== "Written off"), [claims]);
  const months = useMemo(() => [...new Set(eligible.map((c) => c.payrollMonth).filter(Boolean) as string[])].sort().reverse(), [eligible]);
  const nextRun = months.filter((m) => payrollDate(m) >= financeToday).at(-1) ?? months[0];
  const [month, setMonth] = useState(nextRun ?? PENDING);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState(false);
  const [confirmRun, setConfirmRun] = useState(false);
  const [toast, notify] = useToast();

  useEffect(() => saveClaims(claims), [claims]);
  useEffect(() => savePlan(plan), [plan]);

  const inMonth = month === PENDING ? eligible.filter((c) => c.counsellorStatus === "Pending") : eligible.filter((c) => c.payrollMonth === month);
  const q = search.trim().toLowerCase();

  const rows = [...new Set(inMonth.map((c) => c.counsellor))]
      .map((name) => {
        const lines = inMonth.filter((c) => c.counsellor === name);
        const base = lines.reduce((n, c) => n + c.counsellorAmount, 0);
        const target = monthlyTargetOf(name);
        const bonus = month !== PENDING && target > 0 && lines.length >= target ? plan.targetBonus : 0;
        const statusOf = lines.every((c) => c.counsellorStatus === "Paid") ? "Paid" : lines.some((c) => c.counsellorStatus === "Approved") ? "Approved" : "Pending";
        return {
          name,
          branch: lines[0]?.branch ?? "",
          lines,
          direct: lines.filter((c) => c.channel === "Direct").length,
          agent: lines.filter((c) => c.channel === "Agent").length,
          affiliate: lines.filter((c) => c.channel === "Affiliate").length,
          base,
          target,
          bonus,
          total: base + bonus,
          status: statusOf as Claim["counsellorStatus"],
        };
      })
      .filter((r) => (!branch || r.branch === branch) && (!status || r.status === status) && (!q || `${r.name} ${r.branch}`.toLowerCase().includes(q)))
      .sort((a, b) => b.total - a.total);

  const yearStart = last12Months()[0];
  const paidYear = eligible.filter((c) => c.counsellorStatus === "Paid" && (c.payrollMonth ?? "") >= yearStart).reduce((n, c) => n + c.counsellorAmount, 0);
  const nextLines = nextRun ? eligible.filter((c) => c.payrollMonth === nextRun && c.counsellorStatus === "Approved") : [];
  const pendingValue = eligible.filter((c) => c.counsellorStatus === "Pending").reduce((n, c) => n + c.counsellorAmount, 0);
  const monthTotal = rows.reduce((n, r) => n + r.total, 0);
  const approvedHere = rows.filter((r) => r.status === "Approved");
  const hasFilters = !!(search || branch || status);

  const payRows = (names: string[]) => {
    const set = new Set(names);
    setClaims((prev) => prev.map((c) => (c.payrollMonth === month && set.has(c.counsellor) && c.counsellorStatus === "Approved" ? { ...c, counsellorStatus: "Paid" } : c)));
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Counsellor Commission</h2>
          <p className="mt-1 text-sm text-muted-foreground">Commission earned on each enrolment, approved once the university pays and paid through the next payroll.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadCsv(`counsellor-commission-${month}.csv`, rows.flatMap((r) => r.lines.map((c) => ({ counsellor: r.name, branch: r.branch, student: c.student, university: c.university, intake: c.intake, source: String(c.channel), commission: c.counsellorAmount, status: c.counsellorStatus, payroll: c.payrollMonth ?? "" }))).concat(rows.filter((r) => r.bonus).map((r) => ({ counsellor: r.name, branch: r.branch, student: "Target bonus", university: "", intake: "", source: "", commission: r.bonus, status: r.status, payroll: month }))))}
            className={buttonSecondary}
          >
            <Download className="size-4" /> Export
          </button>
          <button type="button" onClick={() => setEditingPlan(true)} className={buttonSecondary}><Settings2 className="size-4" /> Commission plan</button>
        </div>
      </header>

      <StatGrid>
        <StatCard icon={CalendarClock} tone="primary" label={nextRun ? `Payroll ${formatDay(payrollDate(nextRun)).replace(/ \d{4}$/, "")}` : "Next payroll"} value={money(nextLines.reduce((n, c) => n + c.counsellorAmount, 0))} note={`${new Set(nextLines.map((c) => c.counsellor)).size} people`} onClick={() => nextRun && setMonth(nextRun)} />
        <StatCard icon={Wallet} tone="success" label="Paid · 12 months" value={money(paidYear, "GBP", true)} />
        <StatCard icon={Hourglass} label="Awaiting unis" value={money(pendingValue, "GBP", true)} onClick={() => setMonth(PENDING)} />
        <StatCard icon={Award} tone="violet" label="Target bonus" value={money(plan.targetBonus)} />
      </StatGrid>

      <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5 text-xs">
        <span className="font-semibold text-foreground">Current plan</span>
        <span className="text-muted-foreground">Direct student <span className="font-semibold text-foreground">{money(plan.direct)}</span></span>
        <span className="text-muted-foreground">Agent student <span className="font-semibold text-foreground">{money(plan.agent)}</span></span>
        <span className="text-muted-foreground">Ambassador referral <span className="font-semibold text-foreground">{money(plan.affiliate)}</span></span>
        <span className="text-muted-foreground">Bonus for hitting the monthly target <span className="font-semibold text-foreground">{money(plan.targetBonus)}</span></span>
        <span className="text-muted-foreground">Paid on the {plan.payrollDay}th</span>
        <button type="button" onClick={() => setEditingPlan(true)} className="ml-auto font-semibold text-primary hover:underline">Change</button>
      </Card>

      <Tabs
        label="Payroll month"
        value={month}
        onChange={(m) => { setMonth(m); setOpen(null); }}
        options={[
          { value: PENDING, label: "Waiting on university", count: eligible.filter((c) => c.counsellorStatus === "Pending").length, dot: "bg-muted-foreground" },
          ...months.slice(0, 8).map((m) => ({ value: m, label: `${monthLabel(m)} payroll`, dot: payrollDate(m) >= financeToday ? "bg-primary" : "bg-success" })),
        ]}
      />

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Counsellor or branch…" label="Search counsellors" />
        <SelectFilter label="Branch" value={branch} onChange={setBranch} allLabel="All branches" options={[...new Set(eligible.map((c) => c.branch))].sort()} />
        {month !== PENDING && <SelectFilter label="Status" value={status} onChange={setStatus} allLabel="Any status" options={["Approved", "Paid"]} />}
        {hasFilters && <ResetFilters onClick={() => { setSearch(""); setBranch(""); setStatus(""); }} />}
      </FilterBar>

      <Card className="overflow-hidden">
        <CardHeader
          title={month === PENDING ? "Waiting on university payment" : `${monthLabel(month)} payroll · ${formatDay(payrollDate(month))}`}
          subtitle={month === PENDING ? "Earned but not yet approved — the university hasn't paid BHE for these students" : `${rows.length} counsellors · ${money(monthTotal)} including bonuses`}
          action={month !== PENDING && approvedHere.length > 0 ? <button type="button" onClick={() => setConfirmRun(true)} className={buttonPrimary}><Banknote className="size-4" /> Run payroll</button> : undefined}
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2.5 pl-5 pr-3">Counsellor</th>
                <th className="px-3 py-2.5 text-right">Enrolments</th>
                <th className="px-3 py-2.5">By source</th>
                <th className="px-3 py-2.5 text-right">Commission</th>
                <th className="px-3 py-2.5 text-right">Target bonus</th>
                <th className="px-3 py-2.5 text-right">Total</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <Fragment key={r.name}>
                  <tr className="transition-colors hover:bg-surface-hover/60">
                    <td className="py-3 pl-5 pr-3">
                      <button type="button" onClick={() => setOpen(open === r.name ? null : r.name)} aria-expanded={open === r.name} className="flex items-center gap-2.5 text-left">
                        <Avatar name={r.name} size="sm" />
                        <span>
                          <span className="block text-sm font-semibold text-foreground">{r.name}</span>
                          <span className="block text-[11px] text-muted-foreground">{r.branch}</span>
                        </span>
                        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open === r.name && "rotate-180")} />
                      </button>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <p className="font-semibold tabular-nums text-foreground">{r.lines.length}</p>
                      {month !== PENDING && r.target > 0 && <p className={cn("text-[11px]", r.lines.length >= r.target ? "text-success" : "text-muted-foreground")}>target {r.target}</p>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{[r.direct && `${r.direct} direct`, r.agent && `${r.agent} agent`, r.affiliate && `${r.affiliate} ambassador`].filter(Boolean).join(" · ")}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-foreground">{money(r.base)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{r.bonus ? <span className="font-semibold text-success">+{money(r.bonus)}</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-foreground">{money(r.total)}</td>
                    <td className="px-3 py-3"><CounsellorPayBadge status={r.status} /></td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      {r.status === "Approved" && (
                        <button type="button" onClick={() => { payRows([r.name]); notify(`${r.name} marked paid — ${money(r.total)}`); }} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover"><Banknote className="size-3.5" /> Mark paid</button>
                      )}
                    </td>
                  </tr>
                  {open === r.name && (
                    <tr className="bg-surface-muted/60">
                      <td colSpan={8} className="px-5 py-3">
                        <ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                          {r.lines.map((c) => (
                            <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2">
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-foreground">{c.student}</span>
                                <span className="block truncate text-[11px] text-muted-foreground">{c.university} · {c.intake} · {c.channel}{c.payments.at(-1) ? ` · uni paid ${formatDay(c.payments.at(-1)!.date)}` : ""}</span>
                              </span>
                              <span className="shrink-0 font-semibold tabular-nums text-foreground">{money(c.counsellorAmount)}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="px-6 py-12 text-center text-sm text-muted-foreground">No commission in this {month === PENDING ? "list" : "payroll"}{hasFilters ? " for these filters" : ""}.</p>}
        </div>
      </Card>

      {editingPlan && (
        <PlanDialog
          plan={plan}
          onClose={() => setEditingPlan(false)}
          onSave={(p, recalc) => {
            setPlan(p);
            if (recalc) setClaims((prev) => prev.map((c) => (c.counsellorStatus === "Paid" ? c : { ...c, counsellorAmount: planAmount(c.channel, p) })));
            notify(recalc ? "Plan saved — unpaid commission recalculated" : "Plan saved for new enrolments");
            setEditingPlan(false);
          }}
        />
      )}

      {confirmRun && (
        <Modal
          open
          onClose={() => setConfirmRun(false)}
          icon={Banknote}
          size="sm"
          title={`Run ${monthLabel(month)} payroll?`}
          subtitle={`${approvedHere.length} counsellors · ${money(approvedHere.reduce((n, r) => n + r.total, 0))} including bonuses`}
          footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setConfirmRun(false)} className={buttonSecondary}>Cancel</button><button type="button" onClick={() => { payRows(approvedHere.map((r) => r.name)); notify(`${monthLabel(month)} payroll marked paid`); setConfirmRun(false); }} className={buttonPrimary}>Mark all paid</button></div>}
        >
          <ul className="max-h-60 overflow-y-auto rounded-xl border border-border text-xs">
            {approvedHere.map((r) => (
              <li key={r.name} className="flex justify-between gap-2 border-b border-border px-3 py-2 last:border-0">
                <span className="text-foreground">{r.name}</span>
                <span className="font-semibold tabular-nums text-foreground">{money(r.total)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Send the same totals to payroll. This only records them as paid in the CRM.</p>
        </Modal>
      )}
      {toast}
    </div>
  );
}

function PlanDialog({ plan, onClose, onSave }: { plan: CounsellorPlan; onClose: () => void; onSave: (p: CounsellorPlan, recalc: boolean) => void }) {
  const [p, setP] = useState(plan);
  const [recalc, setRecalc] = useState(false);
  const num = (k: keyof CounsellorPlan, max = 5000) => ({
    inputMode: "numeric" as const,
    value: String(p[k]),
    onChange: (e: ChangeEvent<HTMLInputElement>) => setP((x) => ({ ...x, [k]: Math.min(max, Number(e.target.value.replace(/\D/g, "")) || 0) })),
  });
  const valid = p.direct > 0 && p.payrollDay >= 1 && p.payrollDay <= 28;
  return (
    <Modal open onClose={onClose} icon={Settings2} title="Counsellor commission plan" subtitle="Amounts in GBP per enrolled student, paid once the university pays BHE."
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" disabled={!valid} onClick={() => onSave(p, recalc)} className={buttonPrimary}>Save plan</button></div>}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Direct student (£)"><TextInput {...num("direct")} /></Field>
        <Field label="Agent-referred student (£)" hint="Lower, because the agent did most of the work."><TextInput {...num("agent")} /></Field>
        <Field label="Ambassador referral (£)"><TextInput {...num("affiliate")} /></Field>
        <Field label="Monthly target bonus (£)" hint="When a payroll month's enrolments reach the counsellor's target in People."><TextInput {...num("targetBonus")} /></Field>
        <Field label="Payroll day" hint="Day of the month commission is paid (1–28)."><TextInput {...num("payrollDay", 28)} /></Field>
        <div className="flex items-end pb-2 sm:col-span-2">
          <Checkbox checked={recalc} onChange={setRecalc} label={<span><span className="font-semibold">Apply to unpaid commission too</span><span className="block text-xs text-muted-foreground">Leave unticked to use the new rates only for future enrolments.</span></span>} />
        </div>
      </div>
    </Modal>
  );
}
