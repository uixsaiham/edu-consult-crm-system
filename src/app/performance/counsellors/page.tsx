"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  GraduationCap,
  Medal,
  PoundSterling,
  Target,
  Timer,
  TrendingUp,
  UserPlus,
  Users,
  UserCog,
} from "lucide-react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { getCounsellorPerformanceDetail, type CounsellorPerformance } from "@/lib/mock/performance";
import { DataTable, NumCell, RankBadge, type Column } from "@/components/performance/data-table";
import { DetailDrawer } from "@/components/performance/detail-drawer";
import { EntityTrendChart, metricDefs } from "@/components/performance/charts";
import {
  change,
  combineSeries,
  downloadCsv,
  fmt,
  periodInfo,
  ratio,
  snapshot,
  type PeriodKey,
  type Snapshot,
} from "@/components/performance/metrics";
import {
  Avatar,
  DeltaBadge,
  KpiCard,
  KpiGrid,
  PerformanceHeader,
  Pill,
  RateBar,
  Sparkline,
  TargetProgress,
} from "@/components/performance/perf-ui";
import { cn } from "@/lib/utils";

const counsellors = getCounsellorPerformanceDetail();
const branchOptions = [...new Set(counsellors.map((c) => c.branch))];
const roleOptions = [...new Set(counsellors.map((c) => c.role))];

type Row = CounsellorPerformance & Snapshot & { target: number };

export default function CounsellorPerformancePage() {
  const [period, setPeriod] = useState<PeriodKey>("3m");
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [role, setRole] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const info = periodInfo(period);

  const allRows: Row[] = useMemo(
    () =>
      counsellors.map((c) => ({ ...c, ...snapshot(c.series, info.months), target: c.monthlyTarget * info.months })),
    [info.months]
  );

  const rows = allRows.filter(
    (r) =>
      (!branch || r.branch === branch) &&
      (!role || r.role === role) &&
      (!search || r.name.toLowerCase().includes(search.toLowerCase()))
  );
  const hasFilters = !!(search || branch || role);

  const total = snapshot(combineSeries(rows.map((r) => r.series)), info.months);
  const target = rows.reduce((s, r) => s + r.target, 0);
  const onTarget = rows.filter((r) => r.current.enrolled >= r.target).length;
  const byEnrolled = [...rows].sort((a, b) => b.current.enrolled - a.current.enrolled);
  const rankOf = new Map(byEnrolled.map((r, i) => [r.id, i + 1]));
  const podium = byEnrolled.slice(0, 3);
  const selected = allRows.find((r) => r.id === selectedId) ?? null;
  const maxAppConv = Math.max(...rows.map((r) => ratio(r.current.enrolled, r.current.applications)), 0.01);

  const exportCsv = () =>
    downloadCsv(
      `counsellor-performance-${period}.csv`,
      rows.map((r) => ({
        Counsellor: r.name,
        Role: r.role,
        Branch: r.branch,
        "Active caseload": r.activeCaseload,
        Leads: r.current.leads,
        Applications: r.current.applications,
        Offers: r.current.offers,
        Enrolled: r.current.enrolled,
        Target: r.target,
        "Revenue (GBP)": r.current.revenue,
        "Avg response (h)": r.avgResponseHours,
        "Follow-up completion %": Math.round(r.followUpRate * 100),
        CSAT: r.csat,
      }))
    );

  const columns: Column<Row>[] = [
    { key: "rank", header: "#", sortValue: (r) => -(rankOf.get(r.id) ?? 0), render: (r) => <RankBadge rank={rankOf.get(r.id) ?? 0} /> },
    {
      key: "name",
      header: "Counsellor",
      sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{r.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{r.role} · {r.branch}</p>
          </div>
        </div>
      ),
    },
    { key: "caseload", header: "Caseload", align: "right", sortValue: (r) => r.activeCaseload, render: (r) => <NumCell value={r.activeCaseload} sub="active" /> },
    { key: "leads", header: "Leads", align: "right", sortValue: (r) => r.current.leads, render: (r) => <NumCell value={fmt.number(r.current.leads)} sub={`${fmt.pct(ratio(r.current.qualified, r.current.leads), 0)} qualified`} /> },
    { key: "apps", header: "Applications", align: "right", sortValue: (r) => r.current.applications, render: (r) => <NumCell value={fmt.number(r.current.applications)} sub={`${fmt.number(r.current.offers)} offers`} /> },
    { key: "enrolled", header: "Enrolled", align: "right", sortValue: (r) => r.current.enrolled, render: (r) => <NumCell value={fmt.number(r.current.enrolled)} sub={<DeltaBadge value={change(r.current.enrolled, r.previous.enrolled)} className="text-[10px]" />} /> },
    { key: "conv", header: "App → enrol", sortValue: (r) => ratio(r.current.enrolled, r.current.applications), render: (r) => <RateBar value={ratio(r.current.enrolled, r.current.applications)} max={maxAppConv} tone="success" /> },
    { key: "target", header: "Target", sortValue: (r) => ratio(r.current.enrolled, r.target), render: (r) => <TargetProgress actual={r.current.enrolled} target={r.target} /> },
    { key: "response", header: "Response", align: "right", sortValue: (r) => -r.avgResponseHours, render: (r) => <NumCell value={<span className={r.avgResponseHours > 3 ? "text-danger" : undefined}>{fmt.hours(r.avgResponseHours)}</span>} sub={`${Math.round(r.followUpRate * 100)}% follow-ups`} /> },
    { key: "csat", header: "CSAT", align: "right", sortValue: (r) => r.csat, render: (r) => <Pill tone={r.csat >= 4.7 ? "success" : r.csat >= 4.5 ? "primary" : "warning"}>★ {r.csat.toFixed(1)}</Pill> },
    { key: "trend", header: "12-mo trend", render: (r) => <Sparkline values={r.trend.map((p) => p.enrolled)} color="var(--success)" className="h-8 w-24" /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PerformanceHeader
        title="Counsellor Performance"
        description={`Output, conversion and service quality per counsellor · ${info.label.toLowerCase()} ${info.compare}`}
        period={period}
        onPeriodChange={setPeriod}
        onExport={exportCsv}
      />

      <KpiGrid>
        <KpiCard icon={UserPlus} label="Leads handled" value={fmt.number(total.current.leads)} current={total.current.leads} previous={total.previous.leads} compareLabel={info.compare} spark={total.trend.map((p) => p.leads)} />
        <KpiCard icon={FileText} tone="violet" label="Applications" value={fmt.number(total.current.applications)} current={total.current.applications} previous={total.previous.applications} compareLabel={info.compare} spark={total.trend.map((p) => p.applications)} />
        <KpiCard icon={GraduationCap} tone="success" label="Enrolled" value={fmt.number(total.current.enrolled)} current={total.current.enrolled} previous={total.previous.enrolled} compareLabel={info.compare} spark={total.trend.map((p) => p.enrolled)} />
        <KpiCard icon={PoundSterling} tone="warning" label="Revenue generated" value={fmt.gbpCompact(total.current.revenue)} current={total.current.revenue} previous={total.previous.revenue} compareLabel={info.compare} spark={total.trend.map((p) => p.revenue)} />
        <KpiCard
          icon={Target}
          tone="teal"
          label={`On target · ${onTarget} of ${rows.length} counsellors`}
          value={fmt.pct(ratio(total.current.enrolled, target), 0)}
          current={ratio(total.current.enrolled, target)}
          previous={ratio(total.previous.enrolled, target)}
          compareLabel="team attainment"
        />
      </KpiGrid>

      {podium.length === 3 && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {podium.map((r, i) => (
            <PodiumCard key={r.id} row={r} place={i + 1} share={ratio(r.current.enrolled, total.current.enrolled)} onOpen={() => setSelectedId(r.id)} />
          ))}
        </section>
      )}

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-5">
        <EntityTrendChart
          className="xl:col-span-3"
          icon={TrendingUp}
          title="Monthly output"
          subtitle="Top 6 counsellors, last 12 months"
          entities={rows}
          metrics={[metricDefs.enrolled, metricDefs.applications, metricDefs.revenue]}
        />
        <SpeedVsConversion rows={rows} />
      </div>

      <Card className="overflow-hidden">
        <CardHeader icon={Users} title="Counsellor leaderboard" subtitle={`${rows.length} counsellors · click a row for details`} />
        <div className="px-5 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <SearchField value={search} onChange={setSearch} placeholder="Search counsellors…" />
            <SelectFilter label="Branch" value={branch} onChange={setBranch} options={branchOptions} allLabel="All branches" />
            <SelectFilter label="Role" value={role} onChange={setRole} options={roleOptions} allLabel="All roles" />
            {hasFilters && (
              <ResetFilters
                onClick={() => {
                  setSearch("");
                  setBranch("");
                  setRole("");
                }}
              />
            )}
          </div>
        </div>
        <div className="mt-4">
          <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} onRowClick={(r) => setSelectedId(r.id)} defaultSort={{ key: "enrolled", dir: "desc" }} minWidth={1240} />
        </div>
      </Card>

      {selected && (
        <DetailDrawer
          open
          onClose={() => setSelectedId(null)}
          icon={UserCog}
          title={selected.name}
          subtitle={`${selected.role} · ${selected.branch}`}
          compareLabel={info.compare}
          series={selected.series}
          kpis={[
            { label: "Leads handled", value: fmt.number(selected.current.leads), current: selected.current.leads, previous: selected.previous.leads },
            { label: "Applications", value: fmt.number(selected.current.applications), current: selected.current.applications, previous: selected.previous.applications },
            { label: "Enrolled", value: fmt.number(selected.current.enrolled), current: selected.current.enrolled, previous: selected.previous.enrolled },
            { label: "Revenue", value: fmt.gbpCompact(selected.current.revenue), current: selected.current.revenue, previous: selected.previous.revenue },
          ]}
          stages={[
            { label: "Leads assigned", value: selected.current.leads },
            { label: "Qualified", value: selected.current.qualified },
            { label: "Applications", value: selected.current.applications },
            { label: "Offers", value: selected.current.offers },
            { label: "Visas granted", value: selected.current.visas },
            { label: "Enrolled", value: selected.current.enrolled },
          ]}
          details={[
            { label: "Branch", value: selected.branch },
            { label: "Joined", value: selected.joined },
            { label: "Active caseload", value: `${selected.activeCaseload} students` },
            { label: "Destinations", value: selected.focus.join(", ") },
            { label: "Monthly enrolment target", value: selected.monthlyTarget },
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

const podiumStyle = [
  { ring: "ring-amber-400/60", badge: "bg-amber-400 text-amber-950", label: "1st" },
  { ring: "ring-slate-300/70", badge: "bg-slate-300 text-slate-800", label: "2nd" },
  { ring: "ring-orange-400/50", badge: "bg-orange-400 text-orange-950", label: "3rd" },
];

function PodiumCard({ row, place, share, onOpen }: { row: Row; place: number; share: number; onOpen: () => void }) {
  const style = podiumStyle[place - 1];
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "card-shadow relative flex min-w-0 items-center gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong",
        place === 1 && "bg-gradient-to-br from-amber-400/10 via-surface to-surface"
      )}
    >
      <div className="relative">
        <Avatar name={row.name} className={cn("size-14 text-base ring-2 ring-offset-2 ring-offset-surface", style.ring)} />
        <span className={cn("absolute -bottom-1 -right-1 flex h-5 items-center rounded-full px-1.5 text-[10px] font-bold", style.badge)}>
          {style.label}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {place === 1 && <Medal className="size-4 shrink-0 text-amber-500" />}
          <p className="truncate font-semibold text-foreground">{row.name}</p>
        </div>
        <p className="truncate text-[11px] text-muted-foreground">{row.branch} · {fmt.pct(share, 0)} of team enrolments</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xl font-bold tabular-nums text-foreground">{fmt.number(row.current.enrolled)}</span>
          <span className="text-[11px] text-muted-foreground">enrolled</span>
          <DeltaBadge value={change(row.current.enrolled, row.previous.enrolled)} className="ml-auto text-[10px]" />
        </div>
      </div>
    </button>
  );
}

interface ScatterPoint {
  name: string;
  x: number;
  y: number;
  z: number;
}

function SpeedTooltip({ active, payload }: { active?: boolean; payload?: { payload: ScatterPoint }[] }) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  return (
    <div className="card-shadow rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs">
      <p className="mb-1 font-semibold text-foreground">{p.name}</p>
      <p className="text-muted-foreground">First response <span className="font-semibold text-foreground">{fmt.hours(p.x)}</span></p>
      <p className="text-muted-foreground">Lead → enrolment <span className="font-semibold text-foreground">{fmt.pct(p.y / 100)}</span></p>
      <p className="text-muted-foreground">Caseload <span className="font-semibold text-foreground">{p.z}</span></p>
    </div>
  );
}

function SpeedVsConversion({ rows }: { rows: Row[] }) {
  const data: ScatterPoint[] = rows.map((r) => ({
    name: r.name,
    x: r.avgResponseHours,
    y: Number((ratio(r.current.enrolled, r.current.leads) * 100).toFixed(2)),
    z: r.activeCaseload,
  }));
  return (
    <Card className="flex min-w-0 flex-col xl:col-span-2">
      <CardHeader icon={Timer} iconBg="bg-warning-soft" iconColor="text-warning" title="Response speed vs conversion" subtitle="Faster first contact tends to convert better" />
      <div className="h-72 min-w-0 px-2 pt-5 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 6, right: 16, left: 0, bottom: 12 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 8" />
            <XAxis
              type="number"
              dataKey="x"
              name="Response"
              unit="h"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              domain={[0, "dataMax + 0.5"]}
              label={{ value: "Avg first response (hours)", position: "insideBottom", offset: -8, fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Conversion"
              unit="%"
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <ZAxis type="number" dataKey="z" range={[60, 360]} />
            <Tooltip content={<SpeedTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={data} fill="var(--primary)" fillOpacity={0.65} stroke="var(--primary)" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-auto border-t border-border px-6 py-4 text-xs text-muted-foreground">
        Bubble size shows active caseload. Top-left is best: quick responses and high conversion.
      </p>
    </Card>
  );
}
