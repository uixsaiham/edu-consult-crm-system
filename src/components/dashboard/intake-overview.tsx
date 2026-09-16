"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  FileCheck2,
  FileText,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { getIntakeBreakdown, getIntakePeriods } from "@/lib/mock/dashboard";
import { cn } from "@/lib/utils";

type ViewMode = "grouped" | "funnel";

interface StageConfig {
  key: "submitted" | "offer" | "visaFiled" | "enrolled";
  name: string;
  color: string;
  fill: string;
  icon: typeof Send;
  bgSoft: string;
}

const stages: StageConfig[] = [
  {
    key: "submitted",
    name: "Submitted",
    color: "#6366f1",
    fill: "url(#intake-submitted)",
    icon: Send,
    bgSoft: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  },
  {
    key: "offer",
    name: "Offer Received",
    color: "#f59e0b",
    fill: "url(#intake-offer)",
    icon: FileText,
    bgSoft: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
  {
    key: "visaFiled",
    name: "Visa Filed",
    color: "#0ea5e9",
    fill: "url(#intake-visaFiled)",
    icon: FileCheck2,
    bgSoft: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  },
  {
    key: "enrolled",
    name: "Enrolled",
    color: "#10b981",
    fill: "url(#intake-enrolled)",
    icon: CheckCircle2,
    bgSoft: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    name: string;
  }>;
  label?: string;
}

function IntakeCustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const submittedItem = payload.find((p) => p.dataKey === "submitted");
  const submittedVal = submittedItem ? submittedItem.value : 1;

  return (
    <div className="card-shadow flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3.5 text-xs shadow-xl min-w-[200px]">
      <div className="flex items-center justify-between border-b border-border/70 pb-2">
        <span className="font-bold text-foreground">{label}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Intake Pipeline
        </span>
      </div>

      <div className="flex flex-col gap-1.5 pt-0.5">
        {payload.map((item) => {
          const stage = stages.find((s) => s.key === item.dataKey);
          const pct = Math.round((item.value / submittedVal) * 100);
          return (
            <div key={item.dataKey} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: stage?.color || item.color }} />
                <span className="text-muted-foreground">{item.name}:</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-foreground tabular-nums">
                <span>{item.value.toLocaleString()}</span>
                {item.dataKey !== "submitted" && (
                  <span className="text-[10px] font-normal text-muted-foreground">({pct}%)</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function IntakeOverview() {
  const periods = getIntakePeriods();
  const breakdown = getIntakeBreakdown();
  const [selectedIntakeId, setSelectedIntakeId] = useState<string>("sep26");
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");

  // Active intake breakdown metrics
  const activeBreakdown = useMemo(() => {
    const period = periods.find((p) => p.id === selectedIntakeId) || periods[1];
    const item = breakdown.find((b) => b.intake.toLowerCase().includes(period.id.slice(0, 3))) || breakdown[1];
    return {
      period,
      data: item,
      convRate: item.submitted > 0 ? ((item.enrolled / item.submitted) * 100).toFixed(1) : "0",
    };
  }, [selectedIntakeId, periods, breakdown]);

  // Funnel data for the selected intake
  const funnelData = useMemo(() => {
    const d = activeBreakdown.data;
    return [
      { stage: "Submitted", count: d.submitted, pct: 100, color: "#6366f1" },
      { stage: "Offer Received", count: d.offer, pct: Math.round((d.offer / d.submitted) * 100), color: "#f59e0b" },
      { stage: "Visa Filed", count: d.visaFiled, pct: Math.round((d.visaFiled / d.submitted) * 100), color: "#0ea5e9" },
      { stage: "Enrolled", count: d.enrolled, pct: Math.round((d.enrolled / d.submitted) * 100), color: "#10b981" },
    ];
  }, [activeBreakdown]);

  return (
    <Card className="flex flex-col">
      <CardHeader
        icon={CalendarRange}
        iconBg="bg-warning-soft"
        iconColor="text-warning"
        title="Intake Application Pipeline"
        subtitle="Applicant progression across academic intakes"
        action={
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface-muted p-1">
            <button
              type="button"
              onClick={() => setViewMode("grouped")}
              aria-label="Grouped bars view"
              title="Grouped stages comparison"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
                viewMode === "grouped"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BarChart3 className="size-3.5 shrink-0" />
              <span className="whitespace-nowrap">Grouped</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("funnel")}
              aria-label="Intake funnel flow"
              title="Selected intake funnel flow"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
                viewMode === "funnel"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TrendingUp className="size-3.5 shrink-0" />
              <span className="whitespace-nowrap">Intake Flow</span>
            </button>
          </div>
        }
      />

      {/* Interactive Intake Period Cards / Tabs */}
      <div className="grid grid-cols-2 gap-2.5 px-5 pt-4 sm:grid-cols-4">
        {periods.map((p) => {
          const isSelected = p.id === selectedIntakeId;
          const isCurrent = p.tag === "current";
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedIntakeId(p.id)}
              className={cn(
                "group relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5",
                isSelected
                  ? "border-primary bg-primary-soft/50 shadow-sm ring-2 ring-primary/20"
                  : "border-border bg-surface hover:border-border-strong hover:bg-surface-muted/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-muted text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {isCurrent && <span className="size-1.5 rounded-full bg-white animate-pulse" />}
                  {p.label}
                </span>
              </div>

              <div className="mt-2">
                <p className="truncate text-xs font-bold tracking-tight text-foreground sm:text-sm">{p.month}</p>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className="text-base font-bold text-foreground tabular-nums sm:text-lg">
                    {p.applications.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-muted-foreground">apps</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage KPI Progression Banner for Selected Intake */}
      <div className="mx-5 mt-3.5 grid grid-cols-2 gap-2 rounded-xl border border-border/80 bg-surface-muted/40 p-2 sm:grid-cols-4">
        {stages.map((st, i) => {
          const val = activeBreakdown.data[st.key];
          const subVal = activeBreakdown.data.submitted;
          const rate = subVal > 0 ? Math.round((val / subVal) * 100) : 0;
          const Icon = st.icon;

          return (
            <div key={st.key} className="flex items-center gap-2 rounded-lg bg-surface p-2 card-shadow min-w-0">
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", st.bgSoft)}>
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-medium text-muted-foreground">{st.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {val.toLocaleString()}
                  </span>
                  {i > 0 && (
                    <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                      ({rate}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Chart Visualization */}
      <div className="px-3 pb-5 pt-4 sm:px-5">
        {viewMode === "funnel" ? (
          /* Intake Funnel Flow View */
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {activeBreakdown.period.month} Conversion Pipeline
                </h4>
                <p className="text-xs text-muted-foreground">
                  Funnel attrition from submission to student enrollment
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Sparkles className="size-3.5" />
                {activeBreakdown.convRate}% Overall Conversion
              </span>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={funnelData} margin={{ top: 15, right: 24, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="funnelFlowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 8" />
                  <XAxis
                    dataKey="stage"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    width={40}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="card-shadow rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-xl">
                          <p className="font-semibold text-foreground">{item.stage}</p>
                          <p className="text-muted-foreground">
                            <span className="font-bold text-foreground">{item.count} applicants</span> ({item.pct}% of submitted)
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Applicants"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#funnelFlowGradient)"
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--surface)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stage Steps Indicator */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {funnelData.map((f, i) => (
                <div
                  key={f.stage}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-surface px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ backgroundColor: f.color }} />
                    <span className="font-medium text-muted-foreground">{f.stage}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-foreground tabular-nums">
                    <span>{f.count}</span>
                    {i < funnelData.length - 1 && (
                      <ArrowRight className="size-3 text-muted-foreground/60" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Grouped Bar Chart Comparison */
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={breakdown}
                margin={{ top: 10, right: 12, left: -14, bottom: 0 }}
                barGap={4}
                barCategoryGap="22%"
              >
                <defs>
                  {stages.map((s) => (
                    <linearGradient key={s.key} id={`intake-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0.65} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 8" />
                <XAxis
                  dataKey="intake"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 500 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  width={44}
                />
                <Tooltip content={<IntakeCustomTooltip />} cursor={{ fill: "var(--surface-hover)", radius: 8 }} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)", paddingTop: 16 }}
                  iconType="circle"
                  iconSize={8}
                />
                {stages.map((st) => (
                  <Bar
                    key={st.key}
                    dataKey={st.key}
                    name={st.name}
                    fill={st.fill}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}
