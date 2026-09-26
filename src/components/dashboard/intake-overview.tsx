"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
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
}

const stages: StageConfig[] = [
  {
    key: "submitted",
    name: "Submitted",
    color: "var(--primary)",
    fill: "url(#intake-submitted)",
  },
  {
    key: "offer",
    name: "Offer Received",
    color: "#f59e0b",
    fill: "url(#intake-offer)",
  },
  {
    key: "visaFiled",
    name: "Visa Filed",
    color: "#0ea5e9",
    fill: "url(#intake-visaFiled)",
  },
  {
    key: "enrolled",
    name: "Enrolled",
    color: "var(--success)",
    fill: "url(#intake-enrolled)",
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
      { stage: "Submitted", count: d.submitted, pct: 100, color: "var(--primary)" },
      { stage: "Offer Received", count: d.offer, pct: Math.round((d.offer / d.submitted) * 100), color: "#f59e0b" },
      { stage: "Visa Filed", count: d.visaFiled, pct: Math.round((d.visaFiled / d.submitted) * 100), color: "#0ea5e9" },
      { stage: "Enrolled", count: d.enrolled, pct: Math.round((d.enrolled / d.submitted) * 100), color: "var(--success)" },
    ];
  }, [activeBreakdown]);

  return (
    <Card className="flex flex-col">
      <CardHeader
        icon={CalendarRange}
        title="Intake pipeline"
        subtitle="Stage progress for each intake"
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

      {/* Intake tabs — sized to their labels; the current intake is marked with a dot */}
      <div className="px-6 pt-5">
        <div role="tablist" aria-label="Intake" className="no-scrollbar inline-flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-full bg-surface-muted p-0.5">
          {periods.map((p) => {
            const isSelected = p.id === selectedIntakeId;
            const isCurrent = p.tag === "current";
            const [month, year] = p.month.split(" ");
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                title={isCurrent ? "Current intake" : undefined}
                onClick={() => setSelectedIntakeId(p.id)}
                className={cn(
                  "flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                  isSelected ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                  isCurrent && "font-semibold text-primary"
                )}
              >
                {isCurrent && <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
                {month.slice(0, 3)} {year}
                {isCurrent && <span className="sr-only">(current intake)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chart Visualization */}
      <div className="flex flex-1 flex-col px-6 pb-6 pt-4">
        {viewMode === "funnel" ? (
          /* Intake Funnel Flow View */
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {activeBreakdown.period.month} Conversion Pipeline
                </h4>
                <p className="text-xs text-muted-foreground">
                  Funnel attrition from submission to student enrollment
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                <Sparkles className="size-3.5" />
                {activeBreakdown.convRate}% Overall Conversion
              </span>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={funnelData} margin={{ top: 15, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="funnelFlowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0.05} />
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
                    stroke="var(--primary)"
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
          /* Grouped Bar Chart Comparison — grows to fill the card */
          <div className="min-h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={breakdown}
                margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
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
                  align="left"
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
