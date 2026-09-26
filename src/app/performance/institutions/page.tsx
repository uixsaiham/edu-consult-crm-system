"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Globe2,
  GraduationCap,
  Landmark,
  PoundSterling,
  Send,
  Stamp,
  Timer,
  TrendingUp,
  Trophy,
  Zap,
  Percent,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { getInstitutionPerformance, type InstitutionPerformance } from "@/lib/mock/performance";
import { DataTable, NumCell, type Column } from "@/components/performance/data-table";
import { DetailDrawer } from "@/components/performance/detail-drawer";
import { DonutBreakdown, EntityTrendChart, RankedBarChart, metricDefs } from "@/components/performance/charts";
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
} from "@/components/performance/metrics";
import {
  Avatar,
  DeltaBadge,
  InsightCard,
  KpiCard,
  KpiGrid,
  PerformanceHeader,
  Pill,
  RateBar,
} from "@/components/performance/perf-ui";
import { cn } from "@/lib/utils";

const institutions = getInstitutionPerformance();
const countryOptions = [...new Set(institutions.map((i) => i.country))];

type Row = InstitutionPerformance & Snapshot;

export default function InstitutionPerformancePage() {
  const [period, setPeriod] = useState<PeriodKey>("12m");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [partnership, setPartnership] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const info = periodInfo(period);

  const allRows: Row[] = useMemo(() => institutions.map((i) => ({ ...i, ...snapshot(i.series, info.months) })), [info.months]);

  const rows = allRows.filter(
    (r) =>
      (!country || r.country === country) &&
      (!partnership || r.partnership === partnership) &&
      (!search || `${r.name} ${r.city}`.toLowerCase().includes(search.toLowerCase()))
  );
  const hasFilters = !!(search || country || partnership);

  const total = snapshot(combineSeries(rows.map((r) => r.series)), info.months);
  const selected = allRows.find((r) => r.id === selectedId) ?? null;
  const offerRate = (r: Row) => ratio(r.current.offers, r.current.applications);

  const bestOffer = [...rows].sort((a, b) => offerRate(b) - offerRate(a))[0];
  const fastest = [...rows].sort((a, b) => a.avgDecisionDays - b.avgDecisionDays)[0];
  const topRevenue = [...rows].sort((a, b) => b.current.revenue - a.current.revenue)[0];

  const byCountry = countryOptions
    .map((c, i) => ({
      name: c,
      value: rows.filter((r) => r.country === c).reduce((s, r) => s + r.current.applications, 0),
      color: seriesColors[i % seriesColors.length],
    }))
    .filter((d) => d.value > 0);

  const exportCsv = () =>
    downloadCsv(
      `institution-performance-${period}.csv`,
      rows.map((r) => ({
        Institution: r.name,
        Country: r.country,
        City: r.city,
        Partnership: r.partnership,
        Applications: r.current.applications,
        Offers: r.current.offers,
        "Offer rate %": (offerRate(r) * 100).toFixed(1),
        "CAS / visas": r.current.visas,
        Enrolled: r.current.enrolled,
        "Avg decision (days)": r.avgDecisionDays,
        "Commission rate %": Math.round(r.commissionRate * 100),
        "Revenue (GBP)": r.current.revenue,
      }))
    );

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Institution",
      sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} label={r.shortName} className="rounded-xl text-[10px]" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{r.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{r.city}, {r.country} · {r.ranking}</p>
          </div>
        </div>
      ),
    },
    { key: "partnership", header: "Partnership", sortValue: (r) => r.partnership, render: (r) => <Pill tone={r.partnership === "Direct" ? "primary" : "violet"}>{r.partnership}</Pill> },
    { key: "apps", header: "Applications", align: "right", sortValue: (r) => r.current.applications, render: (r) => <NumCell value={fmt.number(r.current.applications)} sub={<DeltaBadge value={change(r.current.applications, r.previous.applications)} className="text-[10px]" />} /> },
    { key: "offer", header: "Offer rate", sortValue: offerRate, render: (r) => { const v = offerRate(r); return <RateBar value={v} tone={v >= 0.7 ? "success" : v >= 0.55 ? "primary" : "warning"} />; } },
    { key: "cas", header: "CAS / visa", align: "right", sortValue: (r) => r.current.visas, render: (r) => <NumCell value={fmt.number(r.current.visas)} sub={`${fmt.pct(ratio(r.current.visas, r.current.offers), 0)} of offers`} /> },
    { key: "enrolled", header: "Enrolled", align: "right", sortValue: (r) => r.current.enrolled, render: (r) => <NumCell value={fmt.number(r.current.enrolled)} sub={`${fmt.pct(ratio(r.current.enrolled, r.current.applications), 0)} yield`} /> },
    { key: "decision", header: "Decision time", align: "right", sortValue: (r) => -r.avgDecisionDays, render: (r) => <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", r.avgDecisionDays <= 7 ? "text-success" : r.avgDecisionDays <= 14 ? "text-foreground" : "text-warning")}><Timer className="size-3.5" />{r.avgDecisionDays} days</span> },
    { key: "revenue", header: "Revenue", align: "right", sortValue: (r) => r.current.revenue, render: (r) => <NumCell value={fmt.gbpCompact(r.current.revenue)} sub={`${Math.round(r.commissionRate * 100)}% of tuition`} /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PerformanceHeader
        title="Institutions Performance"
        description={`Offer rates, visa outcomes and revenue per partner institution · ${info.label.toLowerCase()} ${info.compare}`}
        period={period}
        onPeriodChange={setPeriod}
        onExport={exportCsv}
      />

      <KpiGrid>
        <KpiCard icon={Send} label="Applications sent" value={fmt.number(total.current.applications)} current={total.current.applications} previous={total.previous.applications} compareLabel={info.compare} spark={total.trend.map((p) => p.applications)} />
        <KpiCard icon={BadgeCheck} tone="violet" label="Offer rate" value={fmt.pct(ratio(total.current.offers, total.current.applications))} current={ratio(total.current.offers, total.current.applications)} previous={ratio(total.previous.offers, total.previous.applications)} compareLabel={info.compare} spark={total.trend.map((p) => ratio(p.offers, p.applications))} />
        <KpiCard icon={Stamp} tone="teal" label="CAS & visas issued" value={fmt.number(total.current.visas)} current={total.current.visas} previous={total.previous.visas} compareLabel={info.compare} spark={total.trend.map((p) => p.visas)} />
        <KpiCard icon={GraduationCap} tone="success" label="Enrolled" value={fmt.number(total.current.enrolled)} current={total.current.enrolled} previous={total.previous.enrolled} compareLabel={info.compare} spark={total.trend.map((p) => p.enrolled)} />
        <KpiCard icon={PoundSterling} tone="warning" label="Commission revenue" value={fmt.gbpCompact(total.current.revenue)} current={total.current.revenue} previous={total.previous.revenue} compareLabel={info.compare} spark={total.trend.map((p) => p.revenue)} />
      </KpiGrid>

      {bestOffer && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <InsightCard icon={Trophy} tone="warning" eyebrow="Top revenue" title={topRevenue.name} detail={`${fmt.gbpCompact(topRevenue.current.revenue)} from ${fmt.number(topRevenue.current.enrolled)} enrolments`} onClick={() => setSelectedId(topRevenue.id)} />
          <InsightCard icon={Percent} tone="success" eyebrow="Highest offer rate" title={bestOffer.name} detail={`${fmt.pct(offerRate(bestOffer))} of ${fmt.number(bestOffer.current.applications)} applications received an offer`} onClick={() => setSelectedId(bestOffer.id)} />
          <InsightCard icon={Zap} tone="primary" eyebrow="Fastest decisions" title={fastest.name} detail={`Average ${fastest.avgDecisionDays}-day turnaround from submission to decision`} onClick={() => setSelectedId(fastest.id)} />
        </div>
      )}

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-5">
        <Card className="flex min-w-0 flex-col xl:col-span-3">
          <CardHeader icon={BadgeCheck} iconBg="bg-violet-500/10" iconColor="text-violet-600 dark:text-violet-400" title="Offer rate by institution" subtitle="Share of applications that received an offer" />
          <div className="px-4 pb-5 pt-4">
            <RankedBarChart
              color="#8b5cf6"
              format={(n) => fmt.pct(n)}
              data={[...rows].sort((a, b) => offerRate(b) - offerRate(a)).map((r) => ({ name: r.name.replace("University of ", "U. of "), value: offerRate(r) }))}
            />
          </div>
        </Card>
        <Card className="flex min-w-0 flex-col xl:col-span-2">
          <CardHeader icon={Globe2} iconBg="bg-success-soft" iconColor="text-success" title="Applications by destination" subtitle={info.label} />
          <div className="flex flex-1 items-center px-6 pb-6 pt-5">
            <DonutBreakdown centerLabel="applications" data={byCountry} />
          </div>
        </Card>
      </div>

      <EntityTrendChart
        icon={TrendingUp}
        title="Monthly volume by institution"
        subtitle="Top 6 institutions, last 12 months"
        entities={rows}
        metrics={[metricDefs.applications, metricDefs.offers, metricDefs.enrolled, metricDefs.revenue]}
      />

      <Card className="overflow-hidden">
        <CardHeader icon={Landmark} title="Institution scorecard" subtitle={`${rows.length} institutions · click a row for details`} />
        <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
          <SearchField value={search} onChange={setSearch} placeholder="Search institution or city…" />
          <SelectFilter label="Country" value={country} onChange={setCountry} options={countryOptions} allLabel="All countries" />
          <SelectFilter label="Partnership" value={partnership} onChange={setPartnership} options={["Direct", "Aggregator"]} allLabel="All partnerships" />
          {hasFilters && (
            <ResetFilters
              onClick={() => {
                setSearch("");
                setCountry("");
                setPartnership("");
              }}
            />
          )}
        </div>
        <div className="mt-4">
          <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} onRowClick={(r) => setSelectedId(r.id)} defaultSort={{ key: "apps", dir: "desc" }} minWidth={1120} />
        </div>
      </Card>

      {selected && (
        <DetailDrawer
          open
          onClose={() => setSelectedId(null)}
          icon={Landmark}
          title={selected.name}
          subtitle={`${selected.city}, ${selected.country} · ${selected.partnership} partner`}
          compareLabel={info.compare}
          series={selected.series}
          trend={[metricDefs.applications, metricDefs.offers]}
          kpis={[
            { label: "Applications", value: fmt.number(selected.current.applications), current: selected.current.applications, previous: selected.previous.applications },
            { label: "Offers", value: fmt.number(selected.current.offers), current: selected.current.offers, previous: selected.previous.offers },
            { label: "Enrolled", value: fmt.number(selected.current.enrolled), current: selected.current.enrolled, previous: selected.previous.enrolled },
            { label: "Revenue", value: fmt.gbpCompact(selected.current.revenue), current: selected.current.revenue, previous: selected.previous.revenue },
          ]}
          stages={[
            { label: "Applications", value: selected.current.applications },
            { label: "Offers", value: selected.current.offers },
            { label: "CAS / visa issued", value: selected.current.visas },
            { label: "Enrolled", value: selected.current.enrolled },
          ]}
          details={[
            { label: "Ranking", value: selected.ranking },
            { label: "Partnership", value: selected.partnership },
            { label: "Commission rate", value: `${Math.round(selected.commissionRate * 100)}% of first-year tuition` },
            { label: "Avg decision time", value: `${selected.avgDecisionDays} days` },
            { label: "Revenue per enrolment", value: fmt.gbp(ratio(selected.current.revenue, selected.current.enrolled)) },
          ]}
        />
      )}
    </div>
  );
}
