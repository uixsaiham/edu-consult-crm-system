"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, List, Plus, Target as TargetIcon, TrendingDown } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { Legend, MetricToggle } from "@/components/performance/perf-ui";
import { Tabs } from "@/components/office/office-ui";
import { Avatar, formatDay } from "@/components/people/people-ui";
import { BarLegend, TargetBar, TargetStatusBadge, advice, statusOrder } from "@/components/targets/target-ui";
import {
  allIntakes,
  counts,
  cumulativeApplications,
  getTargets,
  intakeStart,
  intakeWindow,
  isClosed,
  measure,
  metricLabel,
  metrics,
  scopeLabel,
  scopedApps,
  today,
  type Metric,
  type Progress,
  type Target,
} from "@/lib/mock/targets";
import { cn } from "@/lib/utils";

const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 };

function TargetOverviewPageInner() {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading overview…</p>}>
      <FromParams />
    </Suspense>
  );
}

function FromParams() {
  const p = useSearchParams();
  return <Overview key={p.toString()} requested={p.get("intake") ?? ""} />;
}

function Overview({ requested }: { requested: string }) {
  const targets = useMemo(() => getTargets().filter((t) => !t.archived), []);
  const withTargets = allIntakes.filter((i) => targets.some((t) => t.intake === i));
  // Default to the intake being recruited for right now (soonest one not yet closed).
  const defaultIntake = withTargets.find((i) => Date.parse(intakeWindow(i).end) >= Date.parse(today)) ?? withTargets[withTargets.length - 1] ?? "Jan 2027";
  const [intake, setIntake] = useState(withTargets.includes(requested) ? requested : defaultIntake);
  const intakeTargets = useMemo(() => targets.filter((t) => t.intake === intake), [targets, intake]);
  const intakeMetrics = metrics.filter((m) => intakeTargets.some((t) => t.metric === m));
  const companyTargets = intakeTargets.filter((t) => t.scope === "Company");
  const [metric, setMetric] = useState<Metric>(companyTargets.find((t) => t.metric === "enrolments")?.metric ?? companyTargets[0]?.metric ?? intakeMetrics[0] ?? "enrolments");
  const activeMetric = intakeMetrics.includes(metric) ? metric : (intakeMetrics[0] ?? metric);

  const progress = useMemo(() => new Map(intakeTargets.map((t) => [t.id, measure(t)])), [intakeTargets]);
  const prog = (t: Target) => progress.get(t.id) as Progress;
  const headline = companyTargets.find((t) => t.metric === activeMetric) ?? companyTargets[0];
  const hp = headline ? prog(headline) : null;
  const closed = headline ? isClosed(headline) : Date.parse(intakeWindow(intake).end) < Date.parse(today);
  const count = (s: string) => intakeTargets.filter((t) => prog(t).status === s).length;
  const attention = intakeTargets.filter((t) => ["Off track", "At risk"].includes(prog(t).status)).sort((a, b) => statusOrder.indexOf(prog(a).status) - statusOrder.indexOf(prog(b).status) || (b.target - prog(b).forecast) - (a.target - prog(a).forecast));
  const daysToStart = Math.ceil((intakeStart(intake) - Date.parse(today)) / 86400000);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Target Overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">How each intake is tracking against its targets, and where to focus.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/target-setup?intake=${encodeURIComponent(intake)}`} className={buttonSecondary}><List className="size-4" /> Target list</Link>
          <Link href={`/target-setup/new?intake=${encodeURIComponent(intake)}`} className={buttonPrimary}><Plus className="size-4" /> Add target</Link>
        </div>
      </header>

      <Tabs label="Intake" value={intake} onChange={setIntake} options={withTargets.map((i) => ({ value: i, label: i, dot: Date.parse(intakeWindow(i).end) < Date.parse(today) ? "bg-muted-foreground" : "bg-primary" }))} />

      {/* Headline company target */}
      <Card className="p-5 sm:p-6">
        {headline && hp ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{intake} · company {metricLabel[headline.metric].toLowerCase()}</span>
                <TargetStatusBadge status={hp.status} />
              </div>
              <p className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums tracking-tight text-foreground">{hp.actual}</span>
                <span className="text-lg text-muted-foreground">of {headline.target}</span>
                <span className="ml-1 text-sm font-semibold text-foreground">{Math.round((hp.actual / Math.max(1, headline.target)) * 100)}%</span>
              </p>
              <p className="text-sm text-muted-foreground">{advice(headline, hp)}</p>
              {companyTargets.length > 1 && (
                <MetricToggle<Metric> value={headline.metric} onChange={setMetric} options={companyTargets.map((t) => ({ value: t.metric, label: metricLabel[t.metric] }))} />
              )}
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Target", headline.target, headline.stretch ? `stretch ${headline.stretch}` : ""],
                  ["Forecast", closed ? hp.actual : hp.forecast, closed ? "final" : hp.forecast >= headline.target ? `+${hp.forecast - headline.target}` : `${headline.target - hp.forecast} short`],
                  ["Expected by now", closed ? headline.target : hp.expected, "on a steady pace"],
                  [closed ? "Intake" : daysToStart > 0 ? "Intake starts" : "Census in", closed ? "Closed" : daysToStart > 0 ? `${daysToStart}d` : `${hp.daysLeft}d`, closed ? formatDay(headline.endDate) : formatDay(daysToStart > 0 ? new Date(intakeStart(intake)).toISOString() : headline.endDate)],
                ].map(([l, v, note]) => (
                  <div key={l as string} className="rounded-xl bg-surface-muted px-3 py-2.5">
                    <p className="text-lg font-bold tabular-nums text-foreground">{v}</p>
                    <p className="text-[11px] text-muted-foreground">{l}</p>
                    {note && <p className="truncate text-[10px] text-muted-foreground/80">{note}</p>}
                  </div>
                ))}
              </div>
              <TargetBar target={headline.target} progress={hp} />
              <BarLegend />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <TargetIcon className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No company target for {intake}</p>
            <p className="text-xs text-muted-foreground">Set one to see the headline number here — branch and counsellor targets are shown below.</p>
            <Link href={`/target-setup/new?intake=${encodeURIComponent(intake)}&scope=Company`} className={cn(buttonPrimary, "mt-2")}><Plus className="size-4" /> Add company target</Link>
          </div>
        )}
      </Card>

      <StatGrid>
        <StatCard icon={TargetIcon} label="Targets this intake" value={intakeTargets.length} note={`${new Set(intakeTargets.map((t) => t.owner)).size} owners`} />
        <StatCard icon={CheckCircle2} tone="success" label={closed ? "Achieved" : "On track or achieved"} value={count("On track") + count("Achieved")} />
        <StatCard icon={AlertTriangle} tone="warning" label="At risk" value={count("At risk")} />
        <StatCard icon={TrendingDown} tone="danger" label={closed ? "Missed" : "Off track"} value={closed ? count("Missed") : count("Off track")} />
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <ApplicationsChart intake={intake} target={intakeTargets.find((t) => t.scope === "Company" && t.metric === "applications")} />
        <FunnelCard intake={intake} companyTargets={companyTargets} closed={closed} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Leaderboard title="Branches" scope="Branch" intake={intake} metric={activeMetric} targets={intakeTargets} prog={prog} metricsAvailable={intakeMetrics} onMetric={setMetric} />
        <Leaderboard title="Counsellors" scope="Counsellor" intake={intake} metric={activeMetric} targets={intakeTargets} prog={prog} metricsAvailable={intakeMetrics} onMetric={setMetric} />
      </div>

      <Card>
        <CardHeader icon={AlertTriangle} iconBg="bg-warning-soft" iconColor="text-warning" title="Needs attention" subtitle={attention.length ? "Targets whose forecast falls short — biggest gaps first" : "Nothing at risk for this intake"} />
        {attention.length ? (
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {attention.map((t) => {
              const p = prog(t);
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate text-sm font-semibold text-foreground">{scopeLabel(t)} <span className="font-normal text-muted-foreground">· {metricLabel[t.metric]}</span></p>
                    <p className="text-[11px] text-muted-foreground">{advice(t, p)}</p>
                  </div>
                  <div className="w-44"><TargetBar target={t.target} progress={p} compact /></div>
                  <TargetStatusBadge status={p.status} />
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Avatar name={t.owner} size="xs" />{t.owner}</span>
                  <Link href={`/target-setup/${t.id}/edit`} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover">Review <ArrowRight className="size-3.5" /></Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="flex items-center gap-2 px-6 pb-6 pt-3 text-sm text-muted-foreground"><CheckCircle2 className="size-4 text-success" /> Every target for {intake} is on track, achieved or not started.</p>
        )}
      </Card>
    </div>
  );
}

function ApplicationsChart({ intake, target }: { intake: string; target?: Target }) {
  const series = useMemo(() => cumulativeApplications(intake), [intake]);
  const total = [...series].reverse().find((p) => p.cumulative !== null)?.cumulative ?? 0;
  const data = series.map((p, i) => ({
    month: p.month,
    Applications: p.cumulative,
    "Target pace": target ? Math.round(target.target * ((i + 1) / series.length)) : undefined,
  }));
  return (
    <Card>
      <CardHeader icon={CalendarClock} title="Applications received" subtitle={`${intake} · cumulative across the recruitment window`} action={<span className="text-lg font-bold tabular-nums text-foreground">{total}</span>} />
      <div className="px-4 pb-2 pt-3 sm:px-6">
        <div className="h-60 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="apps-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 8" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={axisTick} interval="preserveStartEnd" />
              <YAxis tickLine={false} axisLine={false} tickMargin={6} tick={axisTick} width={36} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border-strong)" }} />
              <Area type="monotone" dataKey="Applications" stroke="var(--chart-1)" strokeWidth={2} fill="url(#apps-fill)" connectNulls={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }} />
              {target && <Line type="linear" dataKey="Target pace" stroke="var(--muted-foreground)" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-3">
        <Legend items={[{ label: "Applications so far", color: "var(--chart-1)" }, ...(target ? [{ label: `Even pace to ${target.target}`, color: "var(--muted-foreground)" }] : [])]} />
        {!target && (
          <Link href={`/target-setup/new?intake=${encodeURIComponent(intake)}&metric=applications&scope=Company`} className="text-xs font-semibold text-primary hover:underline">Add an applications target to compare</Link>
        )}
      </div>
    </Card>
  );
}

function FunnelCard({ intake, companyTargets, closed }: { intake: string; companyTargets: Target[]; closed: boolean }) {
  const apps = scopedApps(intake, "Company", "");
  const rows = metrics.map((m) => {
    const actual = apps.filter((a) => counts(a, m)).length;
    const t = companyTargets.find((x) => x.metric === m);
    return { m, actual, target: t?.target, forecast: t ? measure(t).forecast : undefined };
  });
  const top = Math.max(1, ...rows.map((r) => Math.max(r.actual, r.target ?? 0, r.forecast ?? 0)));
  return (
    <Card>
      <CardHeader icon={TargetIcon} title="Intake funnel" subtitle={`${intake} · whole company`} />
      <ol className="flex flex-col gap-4 px-6 pb-6 pt-4">
        {rows.map((r, i) => (
          <li key={r.m}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-foreground">{metricLabel[r.m]}</span>
              <span className="tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{r.actual}</span>
                {r.target !== undefined && <> / {r.target} target</>}
                {i > 0 && rows[i - 1].actual > 0 && <span className="ml-2">{Math.round((r.actual / rows[i - 1].actual) * 100)}% of prev.</span>}
              </span>
            </div>
            <span className="relative block h-2.5 rounded-full bg-surface-hover">
              {!closed && r.forecast !== undefined && <span className="absolute inset-y-0 left-0 rounded-full bg-primary/20" style={{ width: `${(r.forecast / top) * 100}%` }} />}
              <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${Math.max(1, (r.actual / top) * 100)}%` }} />
              {r.target !== undefined && <span className="absolute -top-0.5 h-3.5 w-0.5 rounded-full bg-foreground/70" style={{ left: `${(r.target / top) * 100}%` }} aria-hidden />}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Leaderboard({
  title,
  scope,
  intake,
  metric,
  targets,
  prog,
  metricsAvailable,
  onMetric,
}: {
  title: string;
  scope: "Branch" | "Counsellor";
  intake: string;
  metric: Metric;
  targets: Target[];
  prog: (t: Target) => Progress;
  metricsAvailable: Metric[];
  onMetric: (m: Metric) => void;
}) {
  const scoped = targets.filter((t) => t.scope === scope);
  const metricHere = scoped.some((t) => t.metric === metric) ? metric : (scoped[0]?.metric ?? metric);
  const rows = scoped.filter((t) => t.metric === metricHere).sort((a, b) => prog(b).actual / b.target - prog(a).actual / a.target);
  const options = metricsAvailable.filter((m) => scoped.some((t) => t.metric === m));
  return (
    <Card>
      <CardHeader
        title={`${title} vs target`}
        subtitle={rows.length ? `${metricLabel[metricHere]} · best attainment first` : `No ${scope.toLowerCase()} targets for ${intake}`}
        action={options.length > 1 ? <MetricToggle<Metric> value={metricHere} onChange={onMetric} options={options.map((m) => ({ value: m, label: metricLabel[m] }))} /> : undefined}
      />
      {rows.length ? (
        <ul className="mt-3 flex flex-col divide-y divide-border border-t border-border">
          {rows.map((t, i) => {
            const p = prog(t);
            return (
              <li key={t.id} className="flex items-center gap-3 px-6 py-2.5">
                <span className={cn("w-4 text-center text-xs font-bold tabular-nums", i === 0 ? "text-amber-500" : "text-muted-foreground")}>{i + 1}</span>
                {scope === "Counsellor" ? <Avatar name={t.scopeValue} size="sm" /> : <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[10px] font-bold text-muted-foreground">{t.scopeValue.slice(0, 2).toUpperCase()}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-foreground">{t.scopeValue}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{scope === "Branch" ? t.owner : `${p.pipeline} in pipeline`}</span>
                </span>
                <span className="w-40 shrink-0"><TargetBar target={t.target} progress={p} compact /></span>
                <span className="hidden w-24 shrink-0 justify-end sm:flex"><TargetStatusBadge status={p.status} /></span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="px-6 pb-6 pt-3">
          <Link href={`/target-setup/new?intake=${encodeURIComponent(intake)}&scope=Company&metric=${metric}`} className="text-xs font-semibold text-primary hover:underline">
            Set a company target and split it by {scope.toLowerCase()} →
          </Link>
        </div>
      )}
    </Card>
  );
}

export default function TargetOverviewPage() { return <Suspense><TargetOverviewPageInner /></Suspense>; }
