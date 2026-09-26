"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  FileText,
  GraduationCap,
  Handshake,
  Layers,
  PoundSterling,
  ShieldAlert,
  TrendingUp,
  Wallet,
  CircleCheck,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { getAgentPerformanceDetail, type AgentCompliance, type AgentPerformance, type AgentTier } from "@/lib/mock/performance";
import { DataTable, NumCell, RankBadge, type Column } from "@/components/performance/data-table";
import { DetailDrawer } from "@/components/performance/detail-drawer";
import { DonutBreakdown, EntityTrendChart, metricDefs } from "@/components/performance/charts";
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
  toneClass,
  type Tone,
} from "@/components/performance/perf-ui";
import { cn } from "@/lib/utils";

const agents = getAgentPerformanceDetail();
const countryOptions = [...new Set(agents.map((a) => a.country))].sort();
const tiers: AgentTier[] = ["Gold", "Silver", "Bronze"];
const tierTone: Record<AgentTier, Tone> = { Gold: "warning", Silver: "neutral", Bronze: "danger" };
const tierColor: Record<AgentTier, string> = { Gold: "#f59e0b", Silver: "#94a3b8", Bronze: "#c2733f" };
const complianceTone: Record<AgentCompliance, Tone> = { Verified: "success", "Pending review": "warning", "Contract expiring": "danger" };

type Row = AgentPerformance & Snapshot & { earned: number; outstanding: number };

interface Alert {
  id: string;
  agent: Row;
  icon: typeof AlertTriangle;
  tone: Tone;
  title: string;
  detail: string;
}

export default function AgentPerformancePage() {
  const [period, setPeriod] = useState<PeriodKey>("12m");
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("");
  const [country, setCountry] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const info = periodInfo(period);

  const allRows: Row[] = useMemo(
    () =>
      agents.map((a) => {
        const snap = snapshot(a.series, info.months);
        const earned = Math.round(snap.current.revenue * a.commissionShare);
        return { ...a, ...snap, earned, outstanding: Math.round(earned * (1 - a.paidRatio)) };
      }),
    [info.months]
  );

  const rows = allRows.filter(
    (r) =>
      (!tier || r.tier === tier) &&
      (!country || r.country === country) &&
      (!search || `${r.name} ${r.contact} ${r.city}`.toLowerCase().includes(search.toLowerCase()))
  );
  const hasFilters = !!(search || tier || country);

  const total = snapshot(combineSeries(rows.map((r) => r.series)), info.months);
  const payable = rows.reduce((s, r) => s + r.outstanding, 0);
  const earned = rows.reduce((s, r) => s + r.earned, 0);
  const previousEarned = rows.reduce((s, r) => s + Math.round(r.previous.revenue * r.commissionShare), 0);
  const selected = allRows.find((r) => r.id === selectedId) ?? null;
  const rankOf = new Map([...rows].sort((a, b) => b.current.applications - a.current.applications).map((r, i) => [r.id, i + 1]));

  const alerts: Alert[] = rows.flatMap((r) => {
    const list: Alert[] = [];
    if (r.compliance !== "Verified")
      list.push({ id: `${r.id}-c`, agent: r, icon: ShieldAlert, tone: complianceTone[r.compliance], title: r.compliance, detail: r.compliance === "Contract expiring" ? "Renew the agreement before new submissions" : "KYC and agreement documents awaiting review" });
    if (r.lastSubmissionDays > 30)
      list.push({ id: `${r.id}-d`, agent: r, icon: Clock, tone: "neutral", title: "Dormant", detail: `No application submitted in ${r.lastSubmissionDays} days` });
    const noOffer = 1 - ratio(r.current.offers, r.current.applications);
    if (noOffer > 0.55)
      list.push({ id: `${r.id}-q`, agent: r, icon: AlertTriangle, tone: "danger", title: "Low offer rate", detail: `${fmt.pct(noOffer, 0)} of applications did not receive an offer — review document quality` });
    return list;
  });

  const exportCsv = () =>
    downloadCsv(
      `agent-performance-${period}.csv`,
      rows.map((r) => ({
        Agent: r.name,
        Tier: r.tier,
        City: r.city,
        Country: r.country,
        Contact: r.contact,
        Applications: r.current.applications,
        Offers: r.current.offers,
        "Offer rate %": (ratio(r.current.offers, r.current.applications) * 100).toFixed(1),
        Enrolled: r.current.enrolled,
        "Commission earned (GBP)": r.earned,
        "Commission outstanding (GBP)": r.outstanding,
        Compliance: r.compliance,
        "Days since last submission": r.lastSubmissionDays,
      }))
    );

  const columns: Column<Row>[] = [
    { key: "rank", header: "#", sortValue: (r) => -(rankOf.get(r.id) ?? 0), render: (r) => <RankBadge rank={rankOf.get(r.id) ?? 0} /> },
    {
      key: "name",
      header: "Agent",
      sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-semibold text-foreground">
              <span className="truncate">{r.name}</span>
              <Pill tone={tierTone[r.tier]}>{r.tier}</Pill>
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{r.city}, {r.country}</p>
          </div>
        </div>
      ),
    },
    { key: "apps", header: "Applications", align: "right", sortValue: (r) => r.current.applications, render: (r) => <NumCell value={fmt.number(r.current.applications)} sub={<DeltaBadge value={change(r.current.applications, r.previous.applications)} className="text-[10px]" />} /> },
    { key: "offer", header: "Offer rate", sortValue: (r) => ratio(r.current.offers, r.current.applications), render: (r) => { const v = ratio(r.current.offers, r.current.applications); return <RateBar value={v} tone={v >= 0.55 ? "success" : v >= 0.45 ? "warning" : "danger"} />; } },
    { key: "enrolled", header: "Enrolled", align: "right", sortValue: (r) => r.current.enrolled, render: (r) => <NumCell value={fmt.number(r.current.enrolled)} sub={`${fmt.pct(ratio(r.current.enrolled, r.current.applications), 0)} of apps`} /> },
    { key: "commission", header: "Commission", align: "right", sortValue: (r) => r.earned, render: (r) => <NumCell value={fmt.gbpCompact(r.earned)} sub={r.outstanding > 0 ? <span className="text-warning">{fmt.gbpCompact(r.outstanding)} due</span> : "Paid in full"} /> },
    { key: "compliance", header: "Compliance", sortValue: (r) => r.compliance, render: (r) => <Pill tone={complianceTone[r.compliance]}>{r.compliance === "Verified" ? <BadgeCheck className="size-3" /> : <ShieldAlert className="size-3" />}{r.compliance}</Pill> },
    { key: "last", header: "Last active", align: "right", sortValue: (r) => -r.lastSubmissionDays, render: (r) => <span className={cn("text-xs font-medium", r.lastSubmissionDays > 30 ? "text-danger" : "text-muted-foreground")}>{r.lastSubmissionDays === 0 ? "Today" : `${r.lastSubmissionDays}d ago`}</span> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PerformanceHeader
        title="Agent Performance"
        description={`Partner agents' submissions, quality and commission · ${info.label.toLowerCase()} ${info.compare}`}
        period={period}
        onPeriodChange={setPeriod}
        onExport={exportCsv}
      />

      <KpiGrid>
        <KpiCard icon={FileText} label="Applications submitted" value={fmt.number(total.current.applications)} current={total.current.applications} previous={total.previous.applications} compareLabel={info.compare} spark={total.trend.map((p) => p.applications)} />
        <KpiCard icon={BadgeCheck} tone="violet" label="Offer rate" value={fmt.pct(ratio(total.current.offers, total.current.applications))} current={ratio(total.current.offers, total.current.applications)} previous={ratio(total.previous.offers, total.previous.applications)} compareLabel={info.compare} spark={total.trend.map((p) => ratio(p.offers, p.applications))} />
        <KpiCard icon={GraduationCap} tone="success" label="Enrolled" value={fmt.number(total.current.enrolled)} current={total.current.enrolled} previous={total.previous.enrolled} compareLabel={info.compare} spark={total.trend.map((p) => p.enrolled)} />
        <KpiCard icon={PoundSterling} tone="warning" label="Agent commission earned" value={fmt.gbpCompact(earned)} current={earned} previous={previousEarned} compareLabel={info.compare} spark={total.trend.map((p) => p.revenue)} />
        <KpiCard icon={Wallet} tone="danger" label="Commission outstanding" value={fmt.gbpCompact(payable)} compareLabel={`${fmt.pct(ratio(payable, earned), 0)} of earned commission unpaid`} />
      </KpiGrid>

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-5">
        <EntityTrendChart
          className="xl:col-span-3"
          icon={TrendingUp}
          title="Submissions by agent"
          subtitle="Top 6 agents, last 12 months"
          entities={rows}
          metrics={[metricDefs.applications, metricDefs.enrolled]}
        />
        <Card className="flex min-w-0 flex-col xl:col-span-2">
          <CardHeader icon={Layers} iconBg="bg-warning-soft" iconColor="text-warning" title="Applications by tier" subtitle={`${rows.length} active partners · ${info.label.toLowerCase()}`} />
          <div className="flex flex-1 items-center px-6 pb-6 pt-5">
            <DonutBreakdown
              centerLabel="applications"
              data={tiers.map((t) => ({
                name: `${t} (${rows.filter((r) => r.tier === t).length})`,
                value: rows.filter((r) => r.tier === t).reduce((s, r) => s + r.current.applications, 0),
                color: tierColor[t],
              }))}
            />
          </div>
        </Card>
      </div>

      <Card className="flex min-w-0 flex-col">
        <CardHeader
          icon={AlertTriangle}
          iconBg="bg-danger-soft"
          iconColor="text-danger"
          title="Needs attention"
          subtitle={alerts.length ? `${alerts.length} issues across ${new Set(alerts.map((a) => a.agent.id)).size} agents` : "All partners in good standing"}
        />
        <ul className="grid grid-cols-1 gap-2 p-4 md:grid-cols-2 2xl:grid-cols-3">
          {alerts.length === 0 && (
            <li className="col-span-full flex flex-col items-center gap-2 py-8 text-center text-xs text-muted-foreground">
              <CircleCheck className="size-6 text-success" />
              No compliance, activity or quality issues.
            </li>
          )}
          {alerts.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setSelectedId(a.agent.id)}
                className="flex h-full w-full items-start gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-surface-hover"
              >
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", toneClass[a.tone])}>
                  <a.icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">{a.agent.name}</span>
                    <Pill tone={a.tone}>{a.title}</Pill>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{a.detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader icon={Handshake} iconBg="bg-success-soft" iconColor="text-success" title="Agent leaderboard" subtitle={`${rows.length} agents · ranked by applications`} />
        <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
          <SearchField value={search} onChange={setSearch} placeholder="Search agent, contact, city…" />
          <SelectFilter label="Tier" value={tier} onChange={setTier} options={tiers} allLabel="All tiers" />
          <SelectFilter label="Country" value={country} onChange={setCountry} options={countryOptions} allLabel="All countries" />
          {hasFilters && (
            <ResetFilters
              onClick={() => {
                setSearch("");
                setTier("");
                setCountry("");
              }}
            />
          )}
        </div>
        <div className="mt-4">
          <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} onRowClick={(r) => setSelectedId(r.id)} defaultSort={{ key: "apps", dir: "desc" }} minWidth={1080} />
        </div>
      </Card>

      {selected && (
        <DetailDrawer
          open
          onClose={() => setSelectedId(null)}
          icon={Handshake}
          title={selected.name}
          subtitle={`${selected.tier} partner · ${selected.city}, ${selected.country}`}
          compareLabel={info.compare}
          series={selected.series}
          kpis={[
            { label: "Applications", value: fmt.number(selected.current.applications), current: selected.current.applications, previous: selected.previous.applications },
            { label: "Offers", value: fmt.number(selected.current.offers), current: selected.current.offers, previous: selected.previous.offers },
            { label: "Enrolled", value: fmt.number(selected.current.enrolled), current: selected.current.enrolled, previous: selected.previous.enrolled },
            { label: "Commission earned", value: fmt.gbpCompact(selected.earned), current: selected.current.revenue, previous: selected.previous.revenue },
          ]}
          stages={[
            { label: "Applications", value: selected.current.applications },
            { label: "Offers", value: selected.current.offers },
            { label: "Visas granted", value: selected.current.visas },
            { label: "Enrolled", value: selected.current.enrolled },
          ]}
          details={[
            { label: "Primary contact", value: selected.contact },
            { label: "Partner since", value: selected.partnerSince },
            { label: "Sub-agents", value: selected.subAgents },
            { label: "Commission share", value: fmt.pct(selected.commissionShare, 0) },
            { label: "Outstanding payout", value: fmt.gbp(selected.outstanding) },
            { label: "Compliance", value: <Pill tone={complianceTone[selected.compliance]}>{selected.compliance}</Pill> },
            { label: "Last submission", value: selected.lastSubmissionDays === 0 ? "Today" : `${selected.lastSubmissionDays} days ago` },
          ]}
        />
      )}
    </div>
  );
}
