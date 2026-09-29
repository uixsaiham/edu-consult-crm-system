"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, Download, Handshake, Landmark, MoreHorizontal, PencilLine, Plus, RefreshCw, SearchX, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { Modal } from "@/components/ui/modal";
import { Checkbox, Field, PillGroup, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { AnchoredMenu, MenuItem } from "@/components/applications/list/anchored-menu";
import { formatDay } from "@/components/people/people-ui";
import { institutionOptions } from "@/lib/mock/courses";
import {
  agreementStatus,
  commissionFor,
  currencies,
  currencyFor,
  getAgreements,
  getClaims,
  isOverdue,
  last12Months,
  money,
  outstanding,
  saveAgreements,
  saveClaims,
  toGbp,
  toGbpRate,
  type AgreementStatus,
  type Claim,
  type CommissionBasis,
  type Currency,
  type UniversityAgreement,
} from "@/lib/mock/finance";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const statusCls: Record<AgreementStatus, string> = { Active: "bg-success-soft text-success", Expiring: "bg-warning-soft text-warning", Expired: "bg-danger-soft text-danger" };

export default function UniversityCommissionPage() {
  const [agreements, setAgreements] = useState<UniversityAgreement[]>(getAgreements);
  const [claims, setClaims] = useState<Claim[]>(getClaims);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [basis, setBasis] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<UniversityAgreement | "new" | null>(null);
  const [toast, notify] = useToast();

  useEffect(() => saveAgreements(agreements), [agreements]);
  useEffect(() => saveClaims(claims), [claims]);

  const yearStart = `${last12Months()[0]}-01`;
  const stats = useMemo(() => {
    const m = new Map<string, { students: number; earned: number; received: number; outstanding: number; overdue: number }>();
    for (const c of claims) {
      if (c.status === "Written off") continue;
      const s = m.get(c.university) ?? { students: 0, earned: 0, received: 0, outstanding: 0, overdue: 0 };
      if (c.type === "Student commission") s.students++;
      s.earned += c.amount;
      s.received += c.payments.filter((p) => p.date >= yearStart).reduce((n, p) => n + p.amount, 0);
      s.outstanding += outstanding(c);
      if (isOverdue(c)) s.overdue += outstanding(c);
      m.set(c.university, s);
    }
    return (u: string) => m.get(u) ?? { students: 0, earned: 0, received: 0, outstanding: 0, overdue: 0 };
  }, [claims, yearStart]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agreements
      .filter((a) => (!country || a.country === country) && (!basis || a.basis === basis) && (!status || agreementStatus(a) === status) && (!q || `${a.university} ${a.contact} ${a.contactEmail}`.toLowerCase().includes(q)))
      .sort((a, b) => toGbp(stats(b.university).earned, b.currency) - toGbp(stats(a.university).earned, a.currency));
  }, [agreements, search, country, basis, status, stats]);

  const hasFilters = !!(search || country || basis || status);
  const gbp = (fn: (s: ReturnType<typeof stats>) => number) => agreements.reduce((n, a) => n + toGbp(fn(stats(a.university)), a.currency), 0);
  const expiring = agreements.filter((a) => agreementStatus(a) !== "Active").length;

  const renew = (a: UniversityAgreement) => {
    const next = `${Number(a.endDate.slice(0, 4)) + 1}${a.endDate.slice(4)}`;
    setAgreements((prev) => prev.map((x) => (x.id === a.id ? { ...x, endDate: next } : x)));
    notify(`${a.university} renewed until ${formatDay(next)}`);
  };

  const exportCsv = () =>
    downloadCsv(
      "university-commission.csv",
      filtered.map((a) => {
        const s = stats(a.university);
        return {
          university: a.university, country: a.country, currency: a.currency, basis: a.basis, rate: a.basis === "Flat fee per student" ? a.rate : `${a.rate}%`,
          bonus: a.bonusRate ? `+${a.bonusRate}% from ${a.bonusThreshold} students` : "", paymentDays: a.paymentDays, trigger: a.invoiceTrigger,
          students: s.students, earned: s.earned, received12m: s.received, outstanding: s.outstanding, overdue: s.overdue, agreementEnds: a.endDate, status: agreementStatus(a),
        };
      })
    );

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">University Commission</h2>
          <p className="mt-1 text-sm text-muted-foreground">Commission agreements with each university — rates, payment terms and what each one owes BHE.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} className={buttonSecondary}><Download className="size-4" /> Export</button>
          <button type="button" onClick={() => setEditing("new")} className={buttonPrimary}><Plus className="size-4" /> Add agreement</button>
        </div>
      </header>

      <StatGrid>
        <StatCard icon={Handshake} label="Agreements" value={agreements.length} note={`${agreements.filter((a) => agreementStatus(a) === "Active").length} active`} />
        <StatCard icon={CalendarClock} tone={expiring ? "warning" : "success"} label="Expiring or expired" value={expiring} onClick={() => setStatus(status === "Expiring" ? "" : "Expiring")} />
        <StatCard icon={Wallet} tone="success" label="Received · 12 months" value={money(gbp((s) => s.received), "GBP", true)} />
        <StatCard icon={Landmark} tone="danger" label="Owed to BHE" value={money(gbp((s) => s.outstanding), "GBP", true)} note={`${money(gbp((s) => s.overdue), "GBP", true)} overdue`} />
      </StatGrid>

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="University or contact…" label="Search agreements" />
        <SelectFilter label="Country" value={country} onChange={setCountry} allLabel="All countries" options={[...new Set(agreements.map((a) => a.country))].sort()} />
        <SelectFilter label="Basis" value={basis} onChange={setBasis} allLabel="Any basis" options={["Percent of first-year tuition", "Flat fee per student"]} width="w-64" />
        <SelectFilter label="Status" value={status} onChange={setStatus} allLabel="Any status" options={[{ value: "Active", label: "Active", dot: "bg-success" }, { value: "Expiring", label: "Expiring (60 days)", dot: "bg-warning" }, { value: "Expired", label: "Expired", dot: "bg-danger" }]} />
        {hasFilters && <ResetFilters onClick={() => { setSearch(""); setCountry(""); setBasis(""); setStatus(""); }} />}
      </FilterBar>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Commission agreements</h3>
          <p className="text-xs text-muted-foreground">{filtered.length} universities · highest earning first · amounts in each university&apos;s currency</p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-xs">
            <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2.5 pl-5 pr-3">University</th>
                <th className="px-3 py-2.5">Commission</th>
                <th className="px-3 py-2.5">Terms</th>
                <th className="px-3 py-2.5 text-right">Students</th>
                <th className="px-3 py-2.5 text-right">Earned</th>
                <th className="px-3 py-2.5 text-right">Outstanding</th>
                <th className="px-3 py-2.5">Agreement</th>
                <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => {
                const s = stats(a.university);
                const st = agreementStatus(a);
                return (
                  <tr key={a.id} className="transition-colors hover:bg-surface-hover/60">
                    <td className="max-w-[260px] py-3 pl-5 pr-3">
                      <button type="button" onClick={() => setEditing(a)} className="block max-w-full truncate text-left text-sm font-semibold text-foreground hover:text-primary">{a.university}</button>
                      <p className="text-[11px] text-muted-foreground">{a.country} · {a.currency}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="font-semibold text-foreground">{a.basis === "Flat fee per student" ? `${money(a.rate, a.currency)} per student` : `${a.rate}% of tuition`}</p>
                      <p className="text-[11px] text-muted-foreground">{a.bonusRate ? `+${a.bonusRate}% from ${a.bonusThreshold} students` : "No volume bonus"}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="text-foreground">{a.paymentDays} days</p>
                      <p className="text-[11px] text-muted-foreground">{a.invoiceTrigger.replace("After ", "after ")}</p>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-foreground">{s.students}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <p className="font-semibold tabular-nums text-foreground">{money(s.earned, a.currency)}</p>
                      <p className="text-[11px] text-muted-foreground">{money(s.received, a.currency)} in 12m</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <p className={cn("font-semibold tabular-nums", s.overdue ? "text-danger" : s.outstanding ? "text-foreground" : "text-muted-foreground")}>{s.outstanding ? money(s.outstanding, a.currency) : "—"}</p>
                      {s.overdue > 0 && <p className="text-[11px] text-danger">{money(s.overdue, a.currency)} overdue</p>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", statusCls[st])}>{st}</span>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">until {formatDay(a.endDate)}</p>
                    </td>
                    <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link href={`/finance/payments?university=${encodeURIComponent(a.university)}`} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover">Claims <ArrowRight className="size-3.5" /></Link>
                        <AnchoredMenu label={`Actions for ${a.university}`} align="end" width={180} trigger={<MoreHorizontal className="size-4" />} triggerClassName="flex size-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground shadow-xs transition-colors hover:bg-primary-soft hover:text-primary">
                          {(close) => (
                            <>
                              <MenuItem icon={PencilLine} onClick={() => { close(); setEditing(a); }}>Edit agreement</MenuItem>
                              <MenuItem icon={RefreshCw} onClick={() => { close(); renew(a); }}>Renew for a year</MenuItem>
                            </>
                          )}
                        </AnchoredMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-muted-foreground"><SearchX className="size-5" /></span>
              <p className="text-sm font-medium text-foreground">No agreements match</p>
            </div>
          )}
        </div>
      </Card>

      {editing && (
        <AgreementDialog
          key={editing === "new" ? "new" : editing.id}
          agreement={editing === "new" ? undefined : editing}
          existing={agreements}
          openClaims={editing === "new" ? 0 : claims.filter((c) => c.university === editing.university && (c.status === "Ready to invoice" || c.status === "Awaiting census") && c.type === "Student commission").length}
          onClose={() => setEditing(null)}
          onSave={(a, recalc) => {
            const isNew = !agreements.some((x) => x.id === a.id);
            setAgreements((prev) => (isNew ? [...prev, a] : prev.map((x) => (x.id === a.id ? a : x))));
            if (recalc) {
              setClaims((prev) =>
                prev.map((c) => {
                  if (c.university !== a.university || c.type !== "Student commission" || (c.status !== "Ready to invoice" && c.status !== "Awaiting census")) return c;
                  const { amount, label } = commissionFor(a, c.tuition);
                  return { ...c, amount, rateLabel: label, agentAmount: Math.round((amount * c.agentShare) / 100) };
                })
              );
            }
            notify(isNew ? `Agreement with ${a.university} added` : recalc ? `${a.university} saved — open claims recalculated` : `${a.university} saved`);
            setEditing(null);
          }}
        />
      )}
      {toast}
    </div>
  );
}

function AgreementDialog({ agreement, existing, openClaims, onClose, onSave }: { agreement?: UniversityAgreement; existing: UniversityAgreement[]; openClaims: number; onClose: () => void; onSave: (a: UniversityAgreement, recalc: boolean) => void }) {
  const choices = institutionOptions().filter((i) => !existing.some((a) => a.university === i.name));
  const [f, setF] = useState<UniversityAgreement>(
    () =>
      agreement ?? {
        id: `AGR-${String(existing.length + 1).padStart(2, "0")}`,
        university: "",
        country: "United Kingdom",
        currency: "GBP",
        basis: "Percent of first-year tuition",
        rate: 15,
        bonusRate: 0,
        bonusThreshold: 0,
        paymentDays: 45,
        invoiceTrigger: "After census date",
        startDate: "2026-09-01",
        endDate: "2028-08-31",
        contact: "",
        contactEmail: "",
        notes: "",
      }
  );
  const [recalc, setRecalc] = useState(true);
  const [tried, setTried] = useState(false);
  const set = <K extends keyof UniversityAgreement>(k: K, v: UniversityAgreement[K]) => setF((x) => ({ ...x, [k]: v }));
  const errors: Record<string, string> = {};
  if (!f.university) errors.university = "Choose the university";
  if (!(f.rate > 0) || (f.basis === "Percent of first-year tuition" && f.rate > 50)) errors.rate = f.basis === "Flat fee per student" ? "Enter the fee per student" : "Enter a rate between 1 and 50%";
  if (!(f.paymentDays > 0)) errors.paymentDays = "Enter the payment terms";
  if (f.endDate <= f.startDate) errors.endDate = "The agreement must end after it starts";
  if (f.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contactEmail)) errors.contactEmail = "Check the email";
  const err = (k: string) => (tried ? errors[k] : undefined);
  const sampleTuition = Math.round(16000 / toGbpRate[f.currency] / 500) * 500;
  const example = commissionFor(f, sampleTuition);

  return (
    <Modal
      open
      onClose={onClose}
      icon={Handshake}
      size="lg"
      title={agreement ? `Agreement · ${agreement.university}` : "Add commission agreement"}
      subtitle="New commission claims for this university are calculated from these terms."
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" onClick={() => { setTried(true); if (!Object.keys(errors).length) onSave(f, !!agreement && recalc && openClaims > 0); }} className={buttonPrimary}>{agreement ? "Save agreement" : "Add agreement"}</button></div>}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="University" required className="sm:col-span-2">
          {agreement ? (
            <TextInput value={f.university} disabled />
          ) : (
            <Select value={f.university} placeholder="Choose a university" onChange={(e) => { const i = choices.find((x) => x.name === e.target.value); setF((x) => ({ ...x, university: e.target.value, country: i?.country ?? x.country, currency: currencyFor(i?.country ?? x.country) })); }} aria-invalid={!!err("university")}>
              {choices.map((i) => <option key={i.name} value={i.name}>{i.name} · {i.country}</option>)}
            </Select>
          )}
          {err("university") && <span className="text-[11px] font-medium text-danger">{err("university")}</span>}
        </Field>
        <Field label="Commission basis" className="sm:col-span-2">
          <PillGroup<CommissionBasis> options={[{ value: "Percent of first-year tuition", label: "% of tuition" }, { value: "Flat fee per student", label: "Flat fee per student" }]} value={f.basis} onChange={(v) => setF((x) => ({ ...x, basis: v, rate: v === "Flat fee per student" ? 1800 : 15 }))} />
        </Field>
        <Field label={f.basis === "Flat fee per student" ? `Fee per student (${f.currency})` : "Rate (%)"} required hint={f.basis === "Flat fee per student" ? `Each enrolled student earns ${money(f.rate, f.currency)}.` : `e.g. ${money(sampleTuition, f.currency)} tuition earns ${money(example.amount, f.currency)}.`}>
          <TextInput inputMode="numeric" value={f.rate || ""} onChange={(e) => set("rate", Number(e.target.value.replace(/\D/g, "").slice(0, 5)) || 0)} aria-invalid={!!err("rate")} className={cn(err("rate") && "border-danger")} />
          {err("rate") && <span className="text-[11px] font-medium text-danger">{err("rate")}</span>}
        </Field>
        <Field label="Currency">
          <Select value={f.currency} onChange={(e) => set("currency", e.target.value as Currency)}>
            {currencies.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        {f.basis === "Percent of first-year tuition" && (
          <>
            <Field label="Volume bonus (extra %)" hint="Optional — paid once enrolments reach the threshold.">
              <TextInput inputMode="numeric" value={f.bonusRate || ""} onChange={(e) => set("bonusRate", Number(e.target.value.replace(/\D/g, "").slice(0, 2)) || 0)} placeholder="0" />
            </Field>
            <Field label="Bonus threshold (students per intake)">
              <TextInput inputMode="numeric" value={f.bonusThreshold || ""} onChange={(e) => set("bonusThreshold", Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0)} placeholder="e.g. 25" disabled={!f.bonusRate} />
            </Field>
          </>
        )}
        <Field label="Payment terms (days)" required>
          <TextInput inputMode="numeric" value={f.paymentDays || ""} onChange={(e) => set("paymentDays", Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0)} aria-invalid={!!err("paymentDays")} />
        </Field>
        <Field label="Invoice when">
          <Select value={f.invoiceTrigger} onChange={(e) => set("invoiceTrigger", e.target.value as UniversityAgreement["invoiceTrigger"])}>
            <option>After census date</option>
            <option>After tuition is paid</option>
            <option>After enrolment confirmed</option>
          </Select>
        </Field>
        <Field label="Agreement starts">
          <TextInput type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </Field>
        <Field label="Agreement ends">
          <TextInput type="date" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} aria-invalid={!!err("endDate")} className={cn(err("endDate") && "border-danger")} />
          {err("endDate") && <span className="text-[11px] font-medium text-danger">{err("endDate")}</span>}
        </Field>
        <Field label="Contact / team">
          <TextInput value={f.contact} onChange={(e) => set("contact", e.target.value)} placeholder="e.g. International Partnerships" />
        </Field>
        <Field label="Contact email">
          <TextInput type="email" value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} aria-invalid={!!err("contactEmail")} className={cn(err("contactEmail") && "border-danger")} />
          {err("contactEmail") && <span className="text-[11px] font-medium text-danger">{err("contactEmail")}</span>}
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. Commission paid on first-year tuition net of scholarships" />
        </Field>
        {agreement && openClaims > 0 && (
          <div className="rounded-2xl bg-surface-muted p-3.5 sm:col-span-2">
            <Checkbox checked={recalc} onChange={setRecalc} label={<span><span className="font-semibold">Recalculate {openClaims} claim{openClaims === 1 ? "" : "s"} not yet invoiced</span><span className="block text-xs text-muted-foreground">Invoiced and paid claims keep their original amounts.</span></span>} />
          </div>
        )}
      </div>
    </Modal>
  );
}

