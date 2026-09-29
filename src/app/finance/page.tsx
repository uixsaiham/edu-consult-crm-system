"use client";

export const dynamic = 'force-dynamic';

import { useMemo } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowRight, Banknote, CalendarClock, FileText, Handshake, HandCoins, Landmark, Plus, Receipt, Send, TrendingUp, Users, Wallet } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { Legend } from "@/components/performance/perf-ui";
import { formatDay } from "@/components/people/people-ui";
import { ClaimStatusBadge } from "@/components/finance/finance-ui";
import {
  agreementStatus,
  daysBetween,
  financeToday,
  getAgreements,
  getClaims,
  isOverdue,
  last12Months,
  money,
  monthLabel,
  outstanding,
  payrollDate,
  toGbp,
  type Claim,
} from "@/lib/mock/finance";
import { cn } from "@/lib/utils";

const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 };

export default function FinanceOverviewPage() {
  const claims = useMemo(() => getClaims().filter((c) => c.status !== "Written off"), []);
  const agreements = getAgreements();
  const months = last12Months();
  const yearStart = `${months[0]}-01`;
  const gbp = (c: Claim, n: number) => toGbp(n, c.currency);

  const received = claims.reduce((n, c) => n + c.payments.filter((p) => p.date >= yearStart).reduce((m, p) => m + gbp(c, p.amount), 0), 0);
  const agentPaid = claims.filter((c) => c.payoutStatus === "Paid" && (c.payoutDate ?? "") >= yearStart).reduce((n, c) => n + gbp(c, c.agentAmount), 0);
  const counsellorPaid = claims.filter((c) => c.counsellorStatus === "Paid" && (c.payrollMonth ?? "") >= months[0]).reduce((n, c) => n + c.counsellorAmount, 0);
  const net = received - agentPaid - counsellorPaid;
  const outstandingTotal = claims.reduce((n, c) => n + gbp(c, outstanding(c)), 0);
  const overdue = claims.filter(isOverdue);
  const overdueTotal = overdue.reduce((n, c) => n + gbp(c, outstanding(c)), 0);
  const agentDue = claims.filter((c) => c.payoutStatus === "Due");
  const ready = claims.filter((c) => c.status === "Ready to invoice");
  const disputed = claims.filter((c) => c.status === "Disputed");
  const nextPayroll = [...new Set(claims.filter((c) => c.counsellorStatus === "Approved").map((c) => c.payrollMonth!))].sort()[0];
  const payrollDue = claims.filter((c) => c.counsellorStatus === "Approved" && c.payrollMonth === nextPayroll).reduce((n, c) => n + c.counsellorAmount, 0);
  const expiring = agreements.filter((a) => agreementStatus(a) !== "Active");

  const monthly = months.map((m) => ({
    month: monthLabel(m),
    Invoiced: claims.filter((c) => c.invoiceDate?.startsWith(m)).reduce((n, c) => n + gbp(c, c.amount), 0),
    Received: claims.reduce((n, c) => n + c.payments.filter((p) => p.date.startsWith(m)).reduce((s, p) => s + gbp(c, p.amount), 0), 0),
  }));

  const buckets = [
    { label: "Not yet due", test: (c: Claim) => !isOverdue(c), tone: "bg-primary" },
    { label: "1–30 days overdue", test: (c: Claim) => isOverdue(c) && daysBetween(c.dueDate!) <= 30, tone: "bg-warning" },
    { label: "31–60 days", test: (c: Claim) => isOverdue(c) && daysBetween(c.dueDate!) > 30 && daysBetween(c.dueDate!) <= 60, tone: "bg-orange-500" },
    { label: "61–90 days", test: (c: Claim) => isOverdue(c) && daysBetween(c.dueDate!) > 60 && daysBetween(c.dueDate!) <= 90, tone: "bg-danger" },
    { label: "Over 90 days", test: (c: Claim) => isOverdue(c) && daysBetween(c.dueDate!) > 90, tone: "bg-danger" },
  ].map((b) => {
    const list = claims.filter((c) => outstanding(c) > 0 && b.test(c));
    return { ...b, count: list.length, value: list.reduce((n, c) => n + gbp(c, outstanding(c)), 0) };
  });
  const maxBucket = Math.max(1, ...buckets.map((b) => b.value));

  const bySource = (["Direct", "Agent", "Affiliate"] as const).map((s) => {
    const list = claims.filter((c) => c.channel === s && (c.invoiceDate ?? c.censusDate) >= yearStart);
    const earned = list.reduce((n, c) => n + gbp(c, c.amount), 0);
    const payouts = list.reduce((n, c) => n + gbp(c, c.agentAmount) + c.counsellorAmount, 0);
    return { s, students: list.length, earned, keep: earned - payouts };
  });
  const maxSource = Math.max(1, ...bySource.map((x) => x.earned));

  const unis = [...new Set(claims.map((c) => c.university))]
    .map((u) => {
      const list = claims.filter((c) => c.university === u && (c.invoiceDate ?? c.censusDate) >= yearStart);
      return { u, earned: list.reduce((n, c) => n + gbp(c, c.amount), 0), owed: claims.filter((c) => c.university === u).reduce((n, c) => n + gbp(c, outstanding(c)), 0), students: list.length };
    })
    .filter((x) => x.earned > 0)
    .sort((a, b) => b.earned - a.earned)
    .slice(0, 8);
  const maxUni = Math.max(1, ...unis.map((x) => x.earned));
  const chase = [...overdue].sort((a, b) => gbp(b, outstanding(b)) - gbp(a, outstanding(a))).slice(0, 6);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Finance Overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">Commission earned from universities, what&apos;s still owed, and what BHE pays out to agents and counsellors. Last 12 months, in GBP.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/finance/payments" className={buttonSecondary}><Receipt className="size-4" /> Payments</Link>
          <Link href="/finance/new" className={buttonPrimary}><Plus className="size-4" /> Add commission</Link>
        </div>
      </header>

      <StatGrid>
        <StatCard icon={Wallet} tone="success" label="Received · 12 months" value={money(received, "GBP", true)} />
        <StatCard icon={TrendingUp} tone="primary" label="Net to BHE" value={money(net, "GBP", true)} note={`${received ? Math.round((net / received) * 100) : 0}% kept`} />
        <StatCard icon={Landmark} tone={overdueTotal ? "danger" : "success"} label="Owed to BHE" value={money(outstandingTotal, "GBP", true)} note={`${money(overdueTotal, "GBP", true)} late`} />
        <StatCard icon={HandCoins} tone="warning" label="Due to agents" value={money(agentDue.reduce((n, c) => n + gbp(c, c.agentAmount), 0), "GBP", true)} note={`${agentDue.length} payouts`} />
      </StatGrid>

      {/* To-do strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Todo href="/finance/payments?tab=ready" icon={Send} tone="violet" title={`${ready.length} to invoice`} detail={money(ready.reduce((n, c) => n + gbp(c, c.amount), 0))} />
        <Todo href="/finance/payments?tab=overdue" icon={AlertTriangle} tone="danger" title={`${overdue.length} overdue`} detail={`${money(overdueTotal)} to chase`} />
        <Todo href="/finance/payments?tab=disputed" icon={FileText} tone="warning" title={`${disputed.length} disputed`} detail={money(disputed.reduce((n, c) => n + gbp(c, outstanding(c)), 0))} />
        <Todo href="/finance/counsellor-commission" icon={Users} tone="primary" title={nextPayroll ? `Payroll ${formatDay(payrollDate(nextPayroll)).replace(/ \d{4}$/, "")}` : "No payroll due"} detail={`${money(payrollDue)} to counsellors`} />
        <Todo href="/finance/universities" icon={Handshake} tone={expiring.length ? "warning" : "success"} title={`${expiring.length} to renew`} detail="agreements expiring" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader icon={Banknote} title="Invoiced vs received" subtitle="Commission per month, GBP" />
          <div className="px-4 pb-2 pt-3 sm:px-6">
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 6, right: 6, left: 0, bottom: 0 }} barGap={2} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 8" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={axisTick} interval="preserveStartEnd" />
                  <YAxis tickLine={false} axisLine={false} tickMargin={6} tick={axisTick} width={48} tickFormatter={(v: number) => money(v, "GBP", true)} />
                  <Tooltip content={<MoneyTooltip />} cursor={{ fill: "var(--surface-hover)" }} />
                  <Bar dataKey="Invoiced" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Received" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-3">
            <Legend items={[{ label: "Invoiced", color: "var(--chart-4)" }, { label: "Received", color: "var(--chart-1)" }]} />
            <span className="text-xs text-muted-foreground">Total received {money(received)}</span>
          </div>
        </Card>

        <Card>
          <CardHeader icon={CalendarClock} iconBg="bg-danger-soft" iconColor="text-danger" title="What universities owe" subtitle={`${money(outstandingTotal)} outstanding, by age`} />
          <ul className="flex flex-col gap-3.5 px-6 pb-6 pt-4">
            {buckets.map((b) => (
              <li key={b.label}>
                <p className="mb-1 flex justify-between gap-2 text-xs">
                  <span className="text-foreground">{b.label}</span>
                  <span className="tabular-nums text-muted-foreground"><span className="font-semibold text-foreground">{money(b.value)}</span> · {b.count}</span>
                </p>
                <span className="block h-2 overflow-hidden rounded-full bg-surface-hover">
                  <span className={cn("block h-full rounded-full", b.tone)} style={{ width: `${Math.max(b.value ? 2 : 0, (b.value / maxBucket) * 100)}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader icon={Landmark} title="Top universities" subtitle="Commission earned in the last 12 months" action={<Link href="/finance/universities" className="text-xs font-semibold text-primary hover:underline">All universities</Link>} />
          <ul className="mt-3 flex flex-col divide-y divide-border border-t border-border">
            {unis.map((x) => (
              <li key={x.u} className="px-6 py-2.5">
                <p className="mb-1 flex justify-between gap-3 text-xs">
                  <span className="truncate font-medium text-foreground">{x.u}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground"><span className="font-semibold text-foreground">{money(x.earned)}</span> · {x.students} students{x.owed ? <span className="text-danger"> · {money(x.owed, "GBP", true)} owed</span> : ""}</span>
                </p>
                <span className="block h-1.5 overflow-hidden rounded-full bg-surface-hover"><span className="block h-full rounded-full bg-primary" style={{ width: `${(x.earned / maxUni) * 100}%` }} /></span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader icon={TrendingUp} title="Where the money comes from" subtitle="Earned vs what BHE keeps after agent and counsellor commission" />
          <ul className="flex flex-col gap-4 px-6 pb-4 pt-4">
            {bySource.map((x) => (
              <li key={x.s}>
                <p className="mb-1.5 flex justify-between gap-2 text-xs">
                  <span className="font-medium text-foreground">{x.s === "Affiliate" ? "Ambassador referrals" : x.s === "Agent" ? "Agent students" : "Direct students"} <span className="font-normal text-muted-foreground">· {x.students}</span></span>
                  <span className="tabular-nums text-muted-foreground"><span className="font-semibold text-foreground">{money(x.keep)}</span> kept of {money(x.earned)}</span>
                </p>
                <span className="relative block h-2.5 overflow-hidden rounded-full bg-surface-hover">
                  <span className="absolute inset-y-0 left-0 rounded-full bg-primary/30" style={{ width: `${(x.earned / maxSource) * 100}%` }} />
                  <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${(x.keep / maxSource) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-6 py-3">
            <Legend items={[{ label: "BHE keeps", color: "var(--primary)" }, { label: "Paid on to agents and counsellors", color: "color-mix(in srgb, var(--primary) 30%, transparent)" }]} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader icon={AlertTriangle} iconBg="bg-danger-soft" iconColor="text-danger" title="Chase these first" subtitle={chase.length ? "Largest overdue invoices" : "Nothing overdue"} action={<Link href="/finance/payments?tab=overdue" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">All overdue <ArrowRight className="size-3.5" /></Link>} />
        {chase.length ? (
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {chase.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3 text-xs">
                <span className="w-28 font-mono font-semibold text-foreground">{c.invoiceNo}</span>
                <span className="min-w-0 flex-1 basis-48">
                  <span className="block truncate font-medium text-foreground">{c.university}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{c.student} · {c.intake}</span>
                </span>
                <span className="font-semibold tabular-nums text-danger">{money(outstanding(c), c.currency)}</span>
                <span className="text-muted-foreground">{daysBetween(c.dueDate!)} days late</span>
                <ClaimStatusBadge claim={c} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 pb-6 pt-3 text-sm text-muted-foreground">Every invoice is within its payment terms.</p>
        )}
        <p className="border-t border-border px-6 py-3 text-[11px] text-muted-foreground">Figures as of {formatDay(financeToday)}. Non-GBP amounts are converted at fixed reporting rates.</p>
      </Card>
    </div>
  );
}

function Todo({ href, icon: Icon, tone, title, detail }: { href: string; icon: typeof Send; tone: "violet" | "danger" | "warning" | "primary" | "success"; title: string; detail: string }) {
  const tones = { violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400", danger: "bg-danger-soft text-danger", warning: "bg-warning-soft text-warning", primary: "bg-primary-soft text-primary", success: "bg-success-soft text-success" };
  return (
    <Link href={href} className="card-shadow group flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", tones[tone])}><Icon className="size-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function MoneyTooltip({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-shadow rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto pl-4 font-semibold tabular-nums text-foreground">{money(Number(p.value ?? 0))}</span>
        </p>
      ))}
    </div>
  );
}
