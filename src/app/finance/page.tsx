"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Download,
  Plus,
  Receipt,
  Wallet,
  X,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { mockFinanceTransactions, type FinanceTransaction } from "@/lib/mock/insights";
import { cn } from "@/lib/utils";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";

export default function FinancePage() {
  const [transactions, setTransactions] =
    useState<FinanceTransaction[]>(mockFinanceTransactions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form states
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [institution, setInstitution] = useState("University of Hertfordshire");
  const [tuitionFee, setTuitionFee] = useState(16500);
  const [depositAmount, setDepositAmount] = useState(5000);
  const [commissionRate, setCommissionRate] = useState(15);
  const [subAgentPayout, setSubAgentPayout] = useState(0);
  const [currency, setCurrency] = useState("GBP");

  const filtered = useMemo(() => {
    let list = transactions;
    if (statusFilter) list = list.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.studentName.toLowerCase().includes(q) ||
          t.ref.toLowerCase().includes(q) ||
          t.institution.toLowerCase().includes(q) ||
          t.studentId.toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, search, statusFilter]);

  const totalGrossCommission = transactions.reduce((acc, t) => acc + t.commissionAmount, 0);
  const totalNetRevenue = transactions.reduce((acc, t) => acc + t.netRevenue, 0);
  const totalAgentPayout = transactions.reduce((acc, t) => acc + t.subAgentPayout, 0);
  const totalDeposits = transactions.reduce((acc, t) => acc + t.depositAmount, 0);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!studentName || !studentId) return;

    const commAmt = Math.round((tuitionFee * commissionRate) / 100);
    const net = Math.max(0, commAmt - subAgentPayout);

    const newTx: FinanceTransaction = {
      id: `FTX-${Date.now().toString().slice(-4)}`,
      ref: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId,
      studentName,
      institution,
      country: "United Kingdom",
      tuitionFee,
      depositAmount,
      commissionRate,
      commissionAmount: commAmt,
      subAgentPayout,
      netRevenue: net,
      currency,
      status: "Invoice Approved",
      invoiceDate: new Date().toISOString().split("T")[0],
    };

    setTransactions([newTx, ...transactions]);
    setStudentName("");
    setStudentId("");
    setAddModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Finance & Commission Ledger
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track university institutional commissions, deposit milestones, B2B partner disbursements, and audited revenue.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className={buttonPrimary}
          >
            <Plus className="size-4" />
            <span>Record Invoice / Commission</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <StatGrid>
        <StatCard icon={Receipt} label="Gross commissions" value={`£${totalGrossCommission.toLocaleString()}`} note="Billed" />
        <StatCard icon={ArrowDownRight} tone="success" label="Net BHE revenue" value={`£${totalNetRevenue.toLocaleString()}`} note="After split" />
        <StatCard icon={ArrowUpRight} tone="warning" label="Sub-agent payouts" value={`£${totalAgentPayout.toLocaleString()}`} note="B2B share" />
        <StatCard icon={Wallet} tone="violet" label="Tuition deposits" value={`£${totalDeposits.toLocaleString()}`} note="Verified" />
      </StatGrid>

      {/* Filter and Search Bar */}
      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search invoice, student, ID, university…" label="Search transactions" />
        <SelectFilter
          label="Invoice status"
          allLabel="All statuses"
          width="w-64"
          value={statusFilter}
          onChange={setStatusFilter}
          options={["Paid", "Invoice Approved", "Pending University Approval", "Under Review"].map((st) => ({
            value: st,
            label: st,
            hint: transactions.filter((t) => t.status === st).length,
          }))}
        />
        {(search || statusFilter) && (
          <ResetFilters
            onClick={() => {
              setSearch("");
              setStatusFilter("");
            }}
          />
        )}
      </FilterBar>

      {/* Transactions Table */}
      <Card>
        <CardHeader
          title="Commission Ledger Records"
          description={`Showing ${filtered.length} of ${transactions.length} institutional payment ledger entries.`}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                <th className="py-3 pl-6 pr-4">Invoice & Student</th>
                <th className="py-3 px-4">Institution & Market</th>
                <th className="py-3 px-4">Tuition & Deposit</th>
                <th className="py-3 px-4">Commission %</th>
                <th className="py-3 px-4">Gross Receivable</th>
                <th className="py-3 px-4">Net BHE Revenue</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No financial ledger records matched your search.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="transition-colors hover:bg-muted/30">
                    <td className="py-3.5 pl-6 pr-4">
                      <div>
                        <span className="font-mono font-bold text-foreground block">
                          {tx.ref}
                        </span>
                        <span className="font-semibold text-foreground text-sm block mt-0.5">
                          {tx.studentName}
                        </span>
                        <span className="text-[11px] text-muted-foreground block font-mono">
                          {tx.studentId}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span className="font-medium text-foreground block">
                        {tx.institution}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {tx.country}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span className="font-semibold text-foreground block">
                        £{tx.tuitionFee.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-success">
                        Deposit: £{tx.depositAmount.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span className="inline-flex items-center rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                        {tx.commissionRate}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span className="font-bold text-foreground block text-sm">
                        £{tx.commissionAmount.toLocaleString()}
                      </span>
                      {tx.subAgentPayout > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          Agent Share: £{tx.subAgentPayout.toLocaleString()}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span className="font-bold text-success block text-sm">
                        £{tx.netRevenue.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {tx.invoiceDate}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          tx.status === "Paid"
                            ? "border border-success/20 bg-success/10 text-success"
                            : tx.status === "Invoice Approved"
                            ? "border border-blue-500/20 bg-blue-700/10 text-blue-700 dark:bg-blue-300/10 dark:text-blue-300"
                            : "border border-amber-500/20 bg-amber-700/10 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300"
                        )}
                      >
                        {tx.status}
                      </span>
                    </td>

                    <td className="py-3.5 pl-4 pr-6 align-top text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        <Download className="size-3" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Record Commission Invoice</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Log university tuition payment and commission invoice milestone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Student Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Mahir Faysal"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Student ID <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="BHE-900239280"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Host University <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. University of Hertfordshire"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Total Tuition Fee (£)</label>
                  <input
                    type="number"
                    min={1000}
                    value={tuitionFee}
                    onChange={(e) => setTuitionFee(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Deposit Paid (£)</label>
                  <input
                    type="number"
                    min={500}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Currency</label>
                  <div className="relative mt-1">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2 pr-8 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    >
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Commission (%)</label>
                  <input
                    type="number"
                    min={5}
                    max={30}
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Sub-Agent Share</label>
                  <input
                    type="number"
                    min={0}
                    value={subAgentPayout}
                    onChange={(e) => setSubAgentPayout(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className={buttonSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={buttonPrimary}
                >
                  Generate Invoice Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
