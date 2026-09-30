"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Ban, Banknote, ChevronLeft, ChevronRight, CircleAlert, Download, Eye, FileText, MoreHorizontal, Plus, Printer, Receipt, SearchX, Send, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { BarButton, HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { useToast } from "@/components/ui/toast";
import { AnchoredMenu, MenuDivider, MenuItem } from "@/components/applications/list/anchored-menu";
import { Tabs } from "@/components/office/office-ui";
import { formatDay } from "@/components/people/people-ui";
import { ClaimDetail, ClaimStatusBadge, PaymentDialog, ReasonDialog, printInvoice } from "@/components/finance/finance-ui";
import {
  clearFinanceChange,
  daysBetween,
  financeToday,
  getClaims,
  getFinanceChange,
  invoice,
  isOverdue,
  last12Months,
  money,
  nextInvoiceNo,
  outstanding,
  paid,
  recordPayment,
  saveClaims,
  toGbp,
  type Claim,
} from "@/lib/mock/finance";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

type Tab = "all" | "ready" | "awaiting" | "overdue" | "paid" | "disputed" | "written";
const PAGE = 20;
const inTab = (c: Claim, t: Tab) =>
  t === "all" ||
  (t === "ready" && c.status === "Ready to invoice") ||
  (t === "awaiting" && (c.status === "Invoiced" || c.status === "Part paid") && !isOverdue(c)) ||
  (t === "overdue" && isOverdue(c)) ||
  (t === "paid" && c.status === "Paid") ||
  (t === "disputed" && c.status === "Disputed") ||
  (t === "written" && c.status === "Written off");

function PaymentsPageInner() {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading payments…</p>}>
      <FromParams />
    </Suspense>
  );
}

function FromParams() {
  const p = useSearchParams();
  const tab = p.get("tab") as Tab | null;
  return <Ledger key={p.toString()} initialTab={tab ?? "all"} initialUniversity={p.get("university") ?? ""} />;
}

function Ledger({ initialTab, initialUniversity }: { initialTab: Tab; initialUniversity: string }) {
  const [claims, setClaims] = useState<Claim[]>(getClaims);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState("");
  const [university, setUniversity] = useState(initialUniversity);
  const [intake, setIntake] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ kind: "pay" | "dispute" | "writeoff"; ids: string[] } | null>(null);
  const [lastChange] = useState(getFinanceChange);
  const [toast, notify] = useToast();

  useEffect(() => saveClaims(claims), [claims]);
  useEffect(() => {
    if (!lastChange) return;
    clearFinanceChange();
    notify(lastChange.text);
  }, [lastChange, notify]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return claims
      .filter(
        (c) =>
          inTab(c, tab) &&
          (!university || c.university === university) &&
          (!intake || c.intake === intake) &&
          (!source || c.channel === source) &&
          (!q || `${c.student} ${c.invoiceNo ?? ""} ${c.id} ${c.university} ${c.course} ${c.agent ?? ""}`.toLowerCase().includes(q))
      )
      .sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a)) || (b.invoiceDate ?? b.censusDate).localeCompare(a.invoiceDate ?? a.censusDate));
  }, [claims, tab, university, intake, source, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE, current * PAGE);
  const selection = useRowSelection(shown.map((c) => c.id));
  const selected = claims.filter((c) => selection.isSelected(c.id));
  const hasFilters = !!(search || university || intake || source);
  const count = (t: Tab) => claims.filter((c) => inTab(c, t)).length;

  const yearStart = `${last12Months()[0]}-01`;
  const invoicedYear = claims.filter((c) => c.invoiceDate && c.invoiceDate >= yearStart).reduce((n, c) => n + toGbp(c.amount, c.currency), 0);
  const receivedYear = claims.reduce((n, c) => n + c.payments.filter((p) => p.date >= yearStart).reduce((m, p) => m + toGbp(p.amount, c.currency), 0), 0);
  const outstandingAll = claims.reduce((n, c) => n + toGbp(outstanding(c), c.currency), 0);
  const overdueAll = claims.filter(isOverdue).reduce((n, c) => n + toGbp(outstanding(c), c.currency), 0);
  const ready = claims.filter((c) => c.status === "Ready to invoice");
  const filteredTotal = filtered.reduce((n, c) => n + toGbp(c.amount, c.currency), 0);
  const filteredOut = filtered.reduce((n, c) => n + toGbp(outstanding(c), c.currency), 0);

  const update = (ids: string[], fn: (c: Claim) => Claim) => {
    const set = new Set(ids);
    setClaims((prev) => prev.map((c) => (set.has(c.id) ? fn(c) : c)));
  };

  const raiseInvoices = (list: Claim[]) => {
    const readyOnes = list.filter((c) => c.status === "Ready to invoice");
    if (!readyOnes.length) return notify("None of those are ready to invoice", "error");
    let next = Number(nextInvoiceNo(claims).split("-").pop());
    const numbers = new Map(readyOnes.map((c) => [c.id, `BHE-INV-${next++}`]));
    update([...numbers.keys()], (c) => invoice(c, numbers.get(c.id)!));
    notify(readyOnes.length === 1 ? `Invoice ${numbers.get(readyOnes[0].id)} raised` : `${readyOnes.length} invoices raised`);
  };

  const exportRows = (rows: Claim[], name: string) =>
    downloadCsv(
      name,
      rows.map((c) => ({
        claim: c.id, invoice: c.invoiceNo ?? "", type: c.type, student: c.student, university: c.university, course: c.course, intake: c.intake,
        source: c.channel, agent: c.agent ?? "", currency: c.currency, tuition: c.tuition, calculation: c.rateLabel, amount: c.amount, received: paid(c), outstanding: outstanding(c),
        status: isOverdue(c) ? "Overdue" : c.status, invoiceDate: c.invoiceDate ?? "", dueDate: c.dueDate ?? "", paidDate: c.payments.at(-1)?.date ?? "",
      }))
    );

  const viewing = claims.find((c) => c.id === viewingId);
  const dialogClaims = dialog ? claims.filter((c) => dialog.ids.includes(c.id)) : [];
  const universities = [...new Set(claims.map((c) => c.university))].sort();
  const intakes = [...new Set(claims.map((c) => c.intake))];

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Commission Payments</h2>
          <p className="mt-1 text-sm text-muted-foreground">Every commission BHE is owed by universities — raise invoices, record what&apos;s paid and chase what&apos;s overdue. Totals in GBP.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => exportRows(filtered, "commission-payments.csv")} className={buttonSecondary}><Download className="size-4" /> Export</button>
          <Link href="/finance/new" className={buttonPrimary}><Plus className="size-4" /> Add commission</Link>
        </div>
      </header>

      <StatGrid>
        <StatCard icon={FileText} label="Invoiced · 12 months" value={money(invoicedYear, "GBP", true)} />
        <StatCard icon={Wallet} tone="success" label="Received · 12 months" value={money(receivedYear, "GBP", true)} />
        <StatCard icon={AlertTriangle} tone={overdueAll ? "danger" : "success"} label="Outstanding" value={money(outstandingAll, "GBP", true)} note={`${money(overdueAll, "GBP", true)} overdue`} onClick={() => { setTab("overdue"); setPage(1); }} />
        <StatCard icon={Send} tone="violet" label="Ready to invoice" value={ready.length} note={money(ready.reduce((n, c) => n + toGbp(c.amount, c.currency), 0), "GBP", true)} onClick={() => { setTab("ready"); setPage(1); }} />
      </StatGrid>

      <Tabs<Tab>
        label="Status"
        value={tab}
        onChange={(t) => { setTab(t); setPage(1); selection.clear(); }}
        options={[
          { value: "all", label: "All", count: count("all") },
          { value: "ready", label: "Ready to invoice", count: count("ready"), dot: "bg-violet-500" },
          { value: "awaiting", label: "Awaiting payment", count: count("awaiting"), dot: "bg-primary" },
          { value: "overdue", label: "Overdue", count: count("overdue"), dot: "bg-danger" },
          { value: "paid", label: "Paid", count: count("paid"), dot: "bg-success" },
          { value: "disputed", label: "Disputed", count: count("disputed"), dot: "bg-danger" },
          { value: "written", label: "Written off", count: count("written"), dot: "bg-muted-foreground" },
        ]}
      />

      <FilterBar>
        <SearchField value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Student, invoice no., university…" label="Search payments" />
        <SelectFilter label="University" value={university} onChange={(v) => { setUniversity(v); setPage(1); }} allLabel="All universities" searchable width="w-72" options={universities.map((u) => ({ value: u, label: u, hint: claims.filter((c) => c.university === u && inTab(c, tab)).length }))} />
        <SelectFilter label="Intake" value={intake} onChange={(v) => { setIntake(v); setPage(1); }} allLabel="All intakes" options={intakes} />
        <SelectFilter label="Source" value={source} onChange={(v) => { setSource(v); setPage(1); }} allLabel="All sources" options={["Direct", "Agent", "Affiliate"]} />
        {hasFilters && <ResetFilters onClick={() => { setSearch(""); setUniversity(""); setIntake(""); setSource(""); setPage(1); }} />}
      </FilterBar>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-2 px-5 pt-5">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Commission ledger</h3>
            <p className="text-xs text-muted-foreground">{filtered.length} claims · {money(filteredTotal)} billed · {money(filteredOut)} outstanding</p>
          </div>
        </div>
        <SelectionBar selection={selection} noun={["claim", "claims"]} onExport={() => exportRows(selected, "commission-selected.csv")} className="mx-5 mt-3">
          {selected.some((c) => c.status === "Ready to invoice") && <BarButton onClick={() => { raiseInvoices(selected); selection.clear(); }}><Send className="size-3.5" /> Raise invoices</BarButton>}
          {selected.some((c) => c.status === "Invoiced" || c.status === "Part paid") && <BarButton onClick={() => setDialog({ kind: "pay", ids: selected.filter((c) => c.status === "Invoiced" || c.status === "Part paid").map((c) => c.id) })}><Banknote className="size-3.5" /> Mark paid</BarButton>}
        </SelectionBar>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-xs">
            <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 py-2.5 pl-5 pr-0"><HeaderCheckbox selection={selection} /></th>
                <th className="py-2.5 pl-3 pr-3">Invoice</th>
                <th className="px-3 py-2.5">Student</th>
                <th className="px-3 py-2.5">University</th>
                <th className="px-3 py-2.5 text-right">Commission</th>
                <th className="px-3 py-2.5 text-right">Outstanding</th>
                <th className="px-3 py-2.5">Invoiced</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((c) => {
                const out = outstanding(c);
                const lastPaid = c.payments.at(-1)?.date;
                return (
                  <tr key={c.id} className={cn("transition-colors hover:bg-surface-hover/60", selectedRowClass(selection, c.id), c.status === "Written off" && "opacity-60")}>
                    <td className="py-3 pl-5 pr-0 align-middle"><RowCheckbox selection={selection} id={c.id} label={`Select ${c.student}`} /></td>
                    <td className="whitespace-nowrap py-3 pl-3 pr-3">
                      <button type="button" onClick={() => setViewingId(c.id)} className="text-left">
                        <span className="block font-mono text-xs font-semibold text-foreground hover:text-primary">{c.invoiceNo ?? "Not invoiced"}</span>
                        <span className="block text-[11px] text-muted-foreground">{c.id}{c.type !== "Student commission" ? ` · ${c.type}` : ""}</span>
                      </button>
                    </td>
                    <td className="max-w-[170px] px-3 py-3">
                      <p className="truncate font-medium text-foreground">{c.student}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{c.course}</p>
                    </td>
                    <td className="max-w-[180px] px-3 py-3">
                      <p className="truncate text-foreground">{c.university}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{c.intake} · {c.channel}{c.agent ? ` · ${c.agent}` : ""}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <p className="font-semibold tabular-nums text-foreground">{money(c.amount, c.currency)}</p>
                      <p className="text-[11px] text-muted-foreground">{c.rateLabel.length > 22 ? c.rateLabel.split(" of ")[0] : c.rateLabel}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <p className={cn("font-semibold tabular-nums", out ? (isOverdue(c) ? "text-danger" : "text-foreground") : "text-muted-foreground")}>{out ? money(out, c.currency) : "—"}</p>
                      {paid(c) > 0 && out > 0 && <p className="text-[11px] text-muted-foreground">{money(paid(c), c.currency)} paid</p>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {c.invoiceDate ? (
                        <>
                          <p className="text-foreground">{formatDay(c.invoiceDate)}</p>
                          <p className={cn("text-[11px]", isOverdue(c) ? "font-semibold text-danger" : "text-muted-foreground")}>
                            {c.status === "Paid" && lastPaid ? `Paid ${formatDay(lastPaid)}` : isOverdue(c) ? `${daysBetween(c.dueDate!)} days overdue` : `Due ${formatDay(c.dueDate!)}`}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-foreground">Census {formatDay(c.censusDate)}</p>
                          <p className="text-[11px] text-muted-foreground">{c.censusDate > financeToday ? `in ${-daysBetween(c.censusDate)} days` : "ready to invoice"}</p>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-3"><ClaimStatusBadge claim={c} /></td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {c.status === "Ready to invoice" ? (
                          <button type="button" onClick={() => raiseInvoices([c])} className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"><Send className="size-3.5" /> Invoice</button>
                        ) : c.status === "Invoiced" || c.status === "Part paid" ? (
                          <button type="button" onClick={() => setDialog({ kind: "pay", ids: [c.id] })} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover"><Banknote className="size-3.5" /> Paid</button>
                        ) : null}
                        <AnchoredMenu label={`Actions for ${c.id}`} align="end" width={190} trigger={<MoreHorizontal className="size-4" />} triggerClassName="flex size-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground shadow-xs transition-colors hover:bg-primary-soft hover:text-primary">
                          {(close) => (
                            <>
                              <MenuItem icon={Eye} onClick={() => { close(); setViewingId(c.id); }}>View details</MenuItem>
                              {c.invoiceNo && <MenuItem icon={Printer} onClick={() => { close(); printInvoice(c); }}>Print invoice</MenuItem>}
                              {(c.status === "Invoiced" || c.status === "Part paid") && <MenuItem icon={CircleAlert} onClick={() => { close(); setDialog({ kind: "dispute", ids: [c.id] }); }}>Mark disputed</MenuItem>}
                              {c.status === "Disputed" && <MenuItem icon={Receipt} onClick={() => { close(); update([c.id], (x) => ({ ...x, status: x.payments.length ? "Part paid" : "Invoiced", disputeReason: undefined })); notify("Dispute resolved"); }}>Dispute resolved</MenuItem>}
                              {c.status !== "Paid" && c.status !== "Written off" && (
                                <>
                                  <MenuDivider />
                                  <MenuItem icon={Ban} tone="danger" onClick={() => { close(); setDialog({ kind: "writeoff", ids: [c.id] }); }}>Write off</MenuItem>
                                </>
                              )}
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
              <p className="text-sm font-medium text-foreground">Nothing here</p>
              <p className="text-xs text-muted-foreground">{hasFilters ? "Try other filters." : "No claims in this status."}</p>
            </div>
          )}
        </div>
        {filtered.length > PAGE && (
          <footer className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
            <span>{(current - 1) * PAGE + 1}–{Math.min(current * PAGE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page" className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-surface-hover disabled:opacity-40"><ChevronLeft className="size-4" /></button>
              <span className="px-2 tabular-nums">Page {current} of {pages}</span>
              <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Next page" className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-surface-hover disabled:opacity-40"><ChevronRight className="size-4" /></button>
            </div>
          </footer>
        )}
      </Card>

      {viewing && (
        <ClaimDetail
          claim={viewing}
          onClose={() => setViewingId(null)}
          onInvoice={() => raiseInvoices([viewing])}
          onPay={() => setDialog({ kind: "pay", ids: [viewing.id] })}
          onDispute={() => setDialog({ kind: "dispute", ids: [viewing.id] })}
          onResolve={() => { update([viewing.id], (x) => ({ ...x, status: x.payments.length ? "Part paid" : "Invoiced", disputeReason: undefined })); notify("Dispute resolved"); }}
          onWriteOff={() => setDialog({ kind: "writeoff", ids: [viewing.id] })}
        />
      )}

      {dialog?.kind === "pay" && (
        <PaymentDialog
          claims={dialogClaims}
          onClose={() => setDialog(null)}
          onSave={({ amount, date, reference }) => {
            update(dialog.ids, (c) => recordPayment(c, { date, reference, amount: amount ?? outstanding(c) }));
            notify(dialog.ids.length === 1 ? (amount !== undefined && amount < outstanding(dialogClaims[0]) ? "Part payment recorded" : "Payment recorded — invoice paid") : `${dialog.ids.length} invoices marked paid`);
            setDialog(null);
            selection.clear();
          }}
        />
      )}
      {dialog?.kind === "dispute" && (
        <ReasonDialog
          title="Mark as disputed"
          subtitle="The invoice stays outstanding but is flagged for follow-up."
          label="What does the university dispute?"
          placeholder="e.g. They say the student withdrew before census"
          confirm="Mark disputed"
          onClose={() => setDialog(null)}
          onSave={(reason) => { update(dialog.ids, (c) => ({ ...c, status: "Disputed", disputeReason: reason })); notify("Marked as disputed"); setDialog(null); }}
        />
      )}
      {dialog?.kind === "writeoff" && (
        <ReasonDialog
          title="Write off this commission?"
          subtitle="It stops counting as outstanding. Agent payouts on it are put on hold."
          label="Reason"
          placeholder="e.g. Student withdrew in week 2 — no commission payable"
          confirm="Write off"
          danger
          onClose={() => setDialog(null)}
          onSave={(reason) => {
            update(dialog.ids, (c) => ({ ...c, status: "Written off", notes: reason, payoutStatus: c.payoutStatus === "Paid" ? "Paid" : c.channel === "Agent" ? "On hold" : c.payoutStatus, counsellorStatus: c.counsellorStatus === "Paid" ? "Paid" : "Pending" }));
            notify("Commission written off");
            setDialog(null);
          }}
        />
      )}
      {toast}
    </div>
  );
}

export default function PaymentsPage() { return <Suspense><PaymentsPageInner /></Suspense>; }
