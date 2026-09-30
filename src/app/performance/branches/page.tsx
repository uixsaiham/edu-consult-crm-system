"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState } from "react";
import {
  Building2,
  GraduationCap,
  PoundSterling,
  Table2,
  Target,
  TrendingUp,
  UserPlus,
  FileText,
  PieChart as PieIcon,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { getBranchPerformance, type BranchPerformance } from "@/lib/mock/performance";
import { DataTable, NumCell, type Column } from "@/components/performance/data-table";
import { DetailDrawer } from "@/components/performance/detail-drawer";
import { DonutBreakdown, EntityTrendChart, metricDefs } from "@/components/performance/charts";
import {
  combineSeries,
  downloadCsv,
  fmt,
  periodInfo,
  ratio,
  seriesColors,
  snapshot,
  change,
  type PeriodKey,
  type Snapshot,
} from "@/components/performance/metrics";
import {
  DeltaBadge,
  KpiCard,
  KpiGrid,
  MetricToggle,
  PerformanceHeader,
  Pill,
  TargetProgress,
} from "@/components/performance/perf-ui";
import { cn } from "@/lib/utils";

const branches = getBranchPerformance();

type Row = BranchPerformance & Snapshot & { target: number; rank: number };
type CountryFilter = "all" | "Bangladesh" | "United Kingdom";

const countryOptions = [
  { value: "all", label: "All" },
  { value: "Bangladesh", label: "Bangladesh" },
  { value: "United Kingdom", label: "UK" },
] as const;

export default function BranchPerformancePage() {
  const [period, setPeriod] = useState<PeriodKey>("3m");
  const [country, setCountry] = useState<CountryFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const info = periodInfo(period);

  const rows: Row[] = useMemo(() => {
    const list = branches
      .filter((b) => country === "all" || b.country === country)
      .map((b) => ({ ...b, ...snapshot(b.series, info.months), target: Math.round((b.annualTarget * info.months) / 12), rank: 0 }));
    return [...list]
      .sort((a, b) => b.current.enrolled - a.current.enrolled)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [country, info.months]);

  const total = snapshot(combineSeries(rows.map((r) => r.series)), info.months);
  const totalTarget = rows.reduce((s, r) => s + r.target, 0);
  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const exportCsv = () =>
    downloadCsv(
      `branch-performance-${period}.csv`,
      rows.map((r) => ({
        Branch: r.name,
        Country: r.country,
        Manager: r.manager,
        Counsellors: r.counsellors,
        Leads: r.current.leads,
        Applications: r.current.applications,
        Offers: r.current.offers,
        "Visas granted": r.current.visas,
        Enrolled: r.current.enrolled,
        Target: r.target,
        "Revenue (GBP)": r.current.revenue,
        "Lead to enrolment %": (ratio(r.current.enrolled, r.current.leads) * 100).toFixed(2),
        "Avg response (h)": r.avgResponseHours,
        "Follow-up completion %": Math.round(r.followUpRate * 100),
        CSAT: r.csat,
      }))
    );

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Branch",
      sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Building2 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{r.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{r.country} · {r.counsellors} counsellors</p>
          </div>
        </div>
      ),
    },
    { key: "leads", header: "Leads", align: "right", sortValue: (r) => r.current.leads, render: (r) => <NumCell value={fmt.number(r.current.leads)} sub={`${fmt.pct(ratio(r.current.qualified, r.current.leads), 0)} qualified`} /> },
    { key: "apps", header: "Applications", align: "right", sortValue: (r) => r.current.applications, render: (r) => <NumCell value={fmt.number(r.current.applications)} sub={`${fmt.pct(ratio(r.current.applications, r.current.qualified), 0)} of qualified`} /> },
    { key: "offers", header: "Offers", align: "right", sortValue: (r) => r.current.offers, render: (r) => <NumCell value={fmt.number(r.current.offers)} sub={`${fmt.pct(ratio(r.current.offers, r.current.applications), 0)} offer rate`} /> },
    { key: "enrolled", header: "Enrolled", align: "right", sortValue: (r) => r.current.enrolled, render: (r) => <NumCell value={fmt.number(r.current.enrolled)} sub={<DeltaBadge value={change(r.current.enrolled, r.previous.enrolled)} className="text-[10px]" />} /> },
    { key: "target", header: "Target pace", sortValue: (r) => ratio(r.current.enrolled, r.target), render: (r) => <TargetProgress actual={r.current.enrolled} target={r.target} /> },
    { key: "revenue", header: "Revenue", align: "right", sortValue: (r) => r.current.revenue, render: (r) => <NumCell value={fmt.gbpCompact(r.current.revenue)} sub={`${fmt.gbpCompact(r.current.revenue / r.counsellors)} / counsellor`} /> },
    { key: "response", header: "Response", align: "right", sortValue: (r) => -r.avgResponseHours, render: (r) => <NumCell value={fmt.hours(r.avgResponseHours)} sub={`${Math.round(r.followUpRate * 100)}% follow-ups`} /> },
    { key: "csat", header: "CSAT", align: "right", sortValue: (r) => r.csat, render: (r) => <Pill tone={r.csat >= 4.7 ? "success" : r.csat >= 4.5 ? "primary" : "warning"}>★ {r.csat.toFixed(1)}</Pill> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PerformanceHeader
        title="Branch Performance"
        description={`How each office converts leads into enrolments · ${info.label.toLowerCase()} ${info.compare}`}
        period={period}
        onPeriodChange={setPeriod}
        onExport={exportCsv}
      />

      <KpiGrid>
        <KpiCard icon={UserPlus} label="Leads" value={fmt.number(total.current.leads)} current={total.current.leads} previous={total.previous.leads} compareLabel={info.compare} spark={total.trend.map((p) => p.leads)} />
        <KpiCard icon={FileText} tone="violet" label="Applications" value={fmt.number(total.current.applications)} current={total.current.applications} previous={total.previous.applications} compareLabel={info.compare} spark={total.trend.map((p) => p.applications)} />
        <KpiCard icon={GraduationCap} tone="success" label="Enrolled" value={fmt.number(total.current.enrolled)} current={total.current.enrolled} previous={total.previous.enrolled} compareLabel={info.compare} spark={total.trend.map((p) => p.enrolled)} />
        <KpiCard icon={PoundSterling} tone="warning" label="Commission revenue" value={fmt.gbpCompact(total.current.revenue)} current={total.current.revenue} previous={total.previous.revenue} compareLabel={info.compare} spark={total.trend.map((p) => p.revenue)} />
        <KpiCard
          icon={Target}
          tone="teal"
          label="Target attainment"
          value={fmt.pct(ratio(total.current.enrolled, totalTarget), 0)}
          compareLabel={`${fmt.number(total.current.enrolled)} of ${fmt.number(totalTarget)} enrolments`}
        />
      </KpiGrid>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Offices</h3>
          <MetricToggle value={country} onChange={setCountry} options={countryOptions} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {rows.map((r) => (
            <BranchCard key={r.id} row={r} onOpen={() => setSelectedId(r.id)} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-5">
        <EntityTrendChart
          className="xl:col-span-3"
          icon={TrendingUp}
          title="Monthly trend by branch"
          subtitle="Last 12 months"
          entities={rows}
          metrics={[metricDefs.enrolled, metricDefs.applications, metricDefs.leads, metricDefs.revenue]}
        />
        <Card className="flex min-w-0 flex-col xl:col-span-2">
          <CardHeader icon={PieIcon} iconBg="bg-warning-soft" iconColor="text-warning" title="Revenue share" subtitle={`Commission earned · ${info.label.toLowerCase()}`} />
          <div className="flex flex-1 items-center px-6 pb-6 pt-5">
            <DonutBreakdown
              centerLabel="revenue"
              format={fmt.gbpCompact}
              data={rows.map((r, i) => ({ name: r.name, value: r.current.revenue, color: seriesColors[i % seriesColors.length] }))}
            />
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader icon={Table2} title="Branch scorecard" subtitle="Click a branch for its full breakdown · sort by any column" />
        <div className="mt-5">
          <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} onRowClick={(r) => setSelectedId(r.id)} defaultSort={{ key: "enrolled", dir: "desc" }} minWidth={1080} />
        </div>
      </Card>

      {selected && (
        <DetailDrawer
          open
          onClose={() => setSelectedId(null)}
          icon={Building2}
          title={`${selected.name} branch`}
          subtitle={`${selected.city} · managed by ${selected.manager}`}
          compareLabel={info.compare}
          series={selected.series}
          kpis={[
            { label: "Leads", value: fmt.number(selected.current.leads), current: selected.current.leads, previous: selected.previous.leads },
            { label: "Applications", value: fmt.number(selected.current.applications), current: selected.current.applications, previous: selected.previous.applications },
            { label: "Enrolled", value: fmt.number(selected.current.enrolled), current: selected.current.enrolled, previous: selected.previous.enrolled },
            { label: "Revenue", value: fmt.gbpCompact(selected.current.revenue), current: selected.current.revenue, previous: selected.previous.revenue },
          ]}
          stages={[
            { label: "Leads", value: selected.current.leads },
            { label: "Qualified", value: selected.current.qualified },
            { label: "Applications", value: selected.current.applications },
            { label: "Offers", value: selected.current.offers },
            { label: "Visas granted", value: selected.current.visas },
            { label: "Enrolled", value: selected.current.enrolled },
          ]}
          details={[
            { label: "Branch manager", value: selected.manager },
            { label: "Counsellors", value: selected.counsellors },
            { label: "Opened", value: selected.opened },
            { label: "Top destination", value: selected.topDestination },
            { label: "Annual enrolment target", value: fmt.number(selected.annualTarget) },
            { label: "Avg first response", value: fmt.hours(selected.avgResponseHours) },
            { label: "Follow-up completion", value: fmt.pct(selected.followUpRate, 0) },
            { label: "Student satisfaction", value: `★ ${selected.csat.toFixed(1)} / 5` },
          ]}
        >
          <section>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Target pace</h4>
            <TargetProgress actual={selected.current.enrolled} target={selected.target} />
          </section>
        </DetailDrawer>
      )}
    </div>
  );
}

function BranchCard({ row, onOpen }: { row: Row; onOpen: () => void }) {
  const pace = ratio(row.current.enrolled, row.target);
  const tone = pace >= 1 ? "success" : pace >= 0.75 ? "warning" : "danger";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card-shadow flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            <span className="mr-1.5 tabular-nums text-muted-foreground">#{row.rank}</span>
            {row.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{row.manager} · {row.counsellors} counsellors</p>
        </div>
        <Pill tone={row.country === "United Kingdom" ? "primary" : "success"}>{row.country === "United Kingdom" ? "UK" : "BD"}</Pill>
      </div>

      <div>
        <div className="flex items-end justify-between gap-2">
          <p className="tabular-nums">
            <span className="text-2xl font-bold text-foreground">{fmt.number(row.current.enrolled)}</span>
            <span className="text-xs text-muted-foreground"> / {fmt.number(row.target)} enrolled</span>
          </p>
          <DeltaBadge value={change(row.current.enrolled, row.previous.enrolled)} className="mb-1 text-[10px]" />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
            <div className={cn("h-full rounded-full", tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-danger")} style={{ width: `${Math.min(100, pace * 100)}%` }} />
          </div>
          <span className={cn("text-[11px] font-semibold tabular-nums", tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-danger")}>{Math.round(pace * 100)}%</span>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 border-t border-border pt-3">
        <div>
          <dt className="text-[10px] text-muted-foreground">Leads</dt>
          <dd className="text-xs font-semibold tabular-nums text-foreground">{fmt.number(row.current.leads)}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-muted-foreground">Conversion</dt>
          <dd className="text-xs font-semibold tabular-nums text-foreground">{fmt.pct(ratio(row.current.enrolled, row.current.leads))}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-muted-foreground">Revenue</dt>
          <dd className="text-xs font-semibold tabular-nums text-foreground">{fmt.gbpCompact(row.current.revenue)}</dd>
        </div>
      </dl>
    </button>
  );
}
