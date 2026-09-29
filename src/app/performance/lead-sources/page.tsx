"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Coins,
  Filter,
  GraduationCap,
  Megaphone,
  PieChart as PieIcon,
  Radar,
  Rocket,
  Sparkles,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { getLeadSourcePerformance, type LeadChannel, type LeadSourcePerformance } from "@/lib/mock/performance";
import { DataTable, NumCell, type Column } from "@/components/performance/data-table";
import { DetailDrawer } from "@/components/performance/detail-drawer";
import { DonutBreakdown, EntityTrendChart, metricDefs } from "@/components/performance/charts";
import {
  change,
  combineSeries,
  downloadCsv,
  fmt,
  periodInfo,
  ratio,
  seriesColors,
  snapshot,
  type PeriodKey,
  type Snapshot,
  type Totals,
} from "@/components/performance/metrics";
import {
  DeltaBadge,
  InsightCard,
  KpiCard,
  KpiGrid,
  PerformanceHeader,
  Pill,
  RateBar,
  toneClass,
  type Tone,
} from "@/components/performance/perf-ui";
import { cn } from "@/lib/utils";

const sources = getLeadSourcePerformance();
const channels = [...new Set(sources.map((s) => s.channel))];
const channelTone: Record<LeadChannel, Tone> = {
  "Paid social": "violet",
  "Paid search": "primary",
  Organic: "success",
  Direct: "teal",
  Referral: "warning",
  Events: "danger",
  Partner: "neutral",
};

type Row = LeadSourcePerformance & Snapshot;

const cpl = (t: Totals) => (t.spend > 0 ? t.spend / t.leads : 0);
const cpe = (t: Totals) => (t.spend > 0 && t.enrolled > 0 ? t.spend / t.enrolled : 0);
/** Net return on spend; null when the source has no cost. */
const roi = (t: Totals) => (t.spend > 0 ? (t.revenue - t.spend) / t.spend : null);

export default function LeadSourcePerformancePage() {
  const [period, setPeriod] = useState<PeriodKey>("3m");
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const info = periodInfo(period);

  const allRows: Row[] = useMemo(() => sources.map((s) => ({ ...s, ...snapshot(s.series, info.months) })), [info.months]);

  const rows = allRows.filter(
    (r) => (!channel || r.channel === channel) && (!search || r.name.toLowerCase().includes(search.toLowerCase()))
  );
  const hasFilters = !!(search || channel);

  const total = snapshot(combineSeries(rows.map((r) => r.series)), info.months);
  const selected = allRows.find((r) => r.id === selectedId) ?? null;
  const leadToEnrol = (r: Row) => ratio(r.current.enrolled, r.current.leads);
  const maxConv = Math.max(...rows.map(leadToEnrol), 0.001);
  const avgCpe = ratio(total.current.spend, total.current.enrolled);

  const paid = rows.filter((r) => r.current.spend > 0);
  const bestRoi = [...paid].sort((a, b) => (roi(b.current) ?? 0) - (roi(a.current) ?? 0))[0];
  const bestQuality = [...rows].sort((a, b) => leadToEnrol(b) - leadToEnrol(a))[0];
  const costliest = [...paid].sort((a, b) => cpe(b.current) - cpe(a.current))[0];
  const fastestGrowing = [...rows].sort(
    (a, b) => (change(b.current.leads, b.previous.leads) ?? 0) - (change(a.current.leads, a.previous.leads) ?? 0)
  )[0];

  const byChannel = channels
    .map((c, i) => ({
      name: c,
      value: rows.filter((r) => r.channel === c).reduce((s, r) => s + r.current.leads, 0),
      color: seriesColors[i % seriesColors.length],
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const exportCsv = () =>
    downloadCsv(
      `lead-source-performance-${period}.csv`,
      rows.map((r) => ({
        Source: r.name,
        Channel: r.channel,
        Leads: r.current.leads,
        Qualified: r.current.qualified,
        Applications: r.current.applications,
        Enrolled: r.current.enrolled,
        "Lead to enrolment %": (leadToEnrol(r) * 100).toFixed(2),
        "Spend (GBP)": r.current.spend,
        "Cost per lead (GBP)": cpl(r.current).toFixed(2),
        "Cost per enrolment (GBP)": cpe(r.current).toFixed(0),
        "Revenue (GBP)": r.current.revenue,
        "ROI %": roi(r.current) === null ? "n/a" : ((roi(r.current) ?? 0) * 100).toFixed(0),
        "Avg days to convert": r.avgDaysToConvert,
      }))
    );

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Source",
      sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", toneClass[channelTone[r.channel]])}>
            <Megaphone className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{r.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{r.channel} · {r.owner}</p>
          </div>
        </div>
      ),
    },
    { key: "leads", header: "Leads", align: "right", sortValue: (r) => r.current.leads, render: (r) => <NumCell value={fmt.number(r.current.leads)} sub={<DeltaBadge value={change(r.current.leads, r.previous.leads)} className="text-[10px]" />} /> },
    { key: "qualified", header: "Qualified", align: "right", sortValue: (r) => ratio(r.current.qualified, r.current.leads), render: (r) => <NumCell value={fmt.pct(ratio(r.current.qualified, r.current.leads), 0)} sub={fmt.number(r.current.qualified)} /> },
    { key: "enrolled", header: "Enrolled", align: "right", sortValue: (r) => r.current.enrolled, render: (r) => <NumCell value={fmt.number(r.current.enrolled)} sub={`~${r.avgDaysToConvert} days`} /> },
    { key: "conv", header: "Lead → enrol", sortValue: leadToEnrol, render: (r) => <RateBar value={leadToEnrol(r)} max={maxConv} tone="success" label={fmt.pct(leadToEnrol(r))} /> },
    { key: "spend", header: "Spend", align: "right", sortValue: (r) => r.current.spend, render: (r) => (r.current.spend > 0 ? <NumCell value={fmt.gbpCompact(r.current.spend)} sub={`${fmt.gbp(cpl(r.current))} / lead`} /> : <span className="text-xs text-muted-foreground">No cost</span>) },
    { key: "cpe", header: "Cost / enrol", align: "right", sortValue: (r) => -(cpe(r.current) || Infinity), render: (r) => (cpe(r.current) > 0 ? <span className={cn("font-semibold", cpe(r.current) > avgCpe * 1.2 ? "text-danger" : "text-foreground")}>{fmt.gbp(cpe(r.current))}</span> : <span className="text-xs text-muted-foreground">—</span>) },
    { key: "revenue", header: "Revenue", align: "right", sortValue: (r) => r.current.revenue, render: (r) => <NumCell value={fmt.gbpCompact(r.current.revenue)} /> },
    { key: "roi", header: "ROI", align: "right", sortValue: (r) => roi(r.current) ?? Number.MAX_SAFE_INTEGER, render: (r) => { const v = roi(r.current); return v === null ? <Pill tone="success">Free</Pill> : <Pill tone={v >= 2 ? "success" : v >= 1 ? "primary" : v >= 0 ? "warning" : "danger"}>{v >= 0 ? "+" : ""}{Math.round(v * 100)}%</Pill>; } },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PerformanceHeader
        title="Lead Source Performance"
        description={`Volume, quality and return on spend per acquisition channel · ${info.label.toLowerCase()} ${info.compare}`}
        period={period}
        onPeriodChange={setPeriod}
        onExport={exportCsv}
      />

      <KpiGrid>
        <KpiCard icon={UserPlus} label="New leads" value={fmt.number(total.current.leads)} current={total.current.leads} previous={total.previous.leads} compareLabel={info.compare} spark={total.trend.map((p) => p.leads)} />
        <KpiCard icon={Filter} tone="violet" label="Qualified rate" value={fmt.pct(ratio(total.current.qualified, total.current.leads))} current={ratio(total.current.qualified, total.current.leads)} previous={ratio(total.previous.qualified, total.previous.leads)} compareLabel={info.compare} spark={total.trend.map((p) => ratio(p.qualified, p.leads))} />
        <KpiCard icon={GraduationCap} tone="success" label="Enrolments sourced" value={fmt.number(total.current.enrolled)} current={total.current.enrolled} previous={total.previous.enrolled} compareLabel={info.compare} spark={total.trend.map((p) => p.enrolled)} />
        <KpiCard icon={Coins} tone="warning" label={`Cost per lead · ${fmt.gbpCompact(total.current.spend)} spend`} value={fmt.gbp(ratio(total.current.spend, total.current.leads))} current={ratio(total.current.spend, total.current.leads)} previous={ratio(total.previous.spend, total.previous.leads)} compareLabel={info.compare} invert />
        <KpiCard icon={Wallet} tone="teal" label="Cost per enrolment" value={fmt.gbp(ratio(total.current.spend, total.current.enrolled))} current={ratio(total.current.spend, total.current.enrolled)} previous={ratio(total.previous.spend, total.previous.enrolled)} compareLabel={info.compare} invert />
      </KpiGrid>

      {bestQuality && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {bestRoi && <InsightCard icon={Sparkles} tone="success" eyebrow="Best paid ROI" title={bestRoi.name} detail={`Returns £${((roi(bestRoi.current) ?? 0) + 1).toFixed(1)} for every £1 spent`} onClick={() => setSelectedId(bestRoi.id)} />}
          <InsightCard icon={Radar} tone="primary" eyebrow="Highest quality" title={bestQuality.name} detail={`${fmt.pct(leadToEnrol(bestQuality))} of leads enrol, in ~${bestQuality.avgDaysToConvert} days`} onClick={() => setSelectedId(bestQuality.id)} />
          <InsightCard icon={Rocket} tone="violet" eyebrow="Fastest growing" title={fastestGrowing.name} detail={<>Leads <DeltaBadge value={change(fastestGrowing.current.leads, fastestGrowing.previous.leads)} className="text-[10px]" /> {info.compare}</>} onClick={() => setSelectedId(fastestGrowing.id)} />
          {costliest && <InsightCard icon={AlertTriangle} tone="danger" eyebrow="Highest cost / enrolment" title={costliest.name} detail={`${fmt.gbp(cpe(costliest.current))} per enrolment — review targeting or budget`} onClick={() => setSelectedId(costliest.id)} />}
        </div>
      )}

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-5">
        <EntityTrendChart
          className="xl:col-span-3"
          variant="stacked"
          icon={TrendingUp}
          title="Lead mix over time"
          subtitle="Top 6 sources stacked, last 12 months"
          entities={rows}
          metrics={[metricDefs.leads, metricDefs.enrolled, metricDefs.spend]}
        />
        <Card className="flex min-w-0 flex-col xl:col-span-2">
          <CardHeader icon={PieIcon} iconBg="bg-violet-500/10" iconColor="text-violet-600 dark:text-violet-400" title="Leads by channel" subtitle={info.label} />
          <div className="flex flex-1 items-center px-6 pb-6 pt-5">
            <DonutBreakdown centerLabel="leads" data={byChannel} />
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader icon={Megaphone} title="Source efficiency" subtitle={`${rows.length} sources · click a row for its funnel`} />
        <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
          <SearchField value={search} onChange={setSearch} placeholder="Search sources…" />
          <SelectFilter label="Channel" value={channel} onChange={setChannel} options={channels} allLabel="All channels" />
          {hasFilters && (
            <ResetFilters
              onClick={() => {
                setSearch("");
                setChannel("");
              }}
            />
          )}
        </div>
        <div className="mt-4">
          <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} onRowClick={(r) => setSelectedId(r.id)} defaultSort={{ key: "leads", dir: "desc" }} minWidth={1080} />
        </div>
      </Card>

      {selected && (
        <DetailDrawer
          open
          onClose={() => setSelectedId(null)}
          icon={Megaphone}
          title={selected.name}
          subtitle={`${selected.channel} · owned by ${selected.owner}`}
          compareLabel={info.compare}
          series={selected.series}
          trend={[metricDefs.leads, metricDefs.enrolled]}
          kpis={[
            { label: "Leads", value: fmt.number(selected.current.leads), current: selected.current.leads, previous: selected.previous.leads },
            { label: "Enrolled", value: fmt.number(selected.current.enrolled), current: selected.current.enrolled, previous: selected.previous.enrolled },
            { label: "Spend", value: selected.current.spend ? fmt.gbpCompact(selected.current.spend) : "No cost", current: selected.current.spend, previous: selected.previous.spend, invert: true },
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
            { label: "Channel", value: <Pill tone={channelTone[selected.channel]}>{selected.channel}</Pill> },
            { label: "Owner", value: selected.owner },
            { label: "Cost per lead", value: selected.current.spend ? fmt.gbp(cpl(selected.current)) : "—" },
            { label: "Cost per enrolment", value: cpe(selected.current) ? fmt.gbp(cpe(selected.current)) : "—" },
            { label: "Return on spend", value: roi(selected.current) === null ? "No direct cost" : `${Math.round((roi(selected.current) ?? 0) * 100)}%` },
            { label: "Avg days to convert", value: `${selected.avgDaysToConvert} days` },
          ]}
        />
      )}
    </div>
  );
}
