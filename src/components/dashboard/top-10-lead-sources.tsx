"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Clapperboard,
  ClipboardList,
  Database,
  Globe,
  GraduationCap,
  HeartHandshake,
  Layout,
  ListOrdered,
  Megaphone,
  MessageCircle,
  PieChart as PieChartIcon,
  Share2,
  Sparkles,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { getTop10LeadSources, type LeadSource } from "@/lib/mock/dashboard";
import { cn } from "@/lib/utils";

interface ChannelMeta {
  icon: LucideIcon;
  color: string;
  gradient: string;
  bgSoft: string;
}

const channelMeta: Record<string, ChannelMeta> = {
  TikTok: {
    icon: Clapperboard,
    color: "#3b82f6",
    gradient: "from-blue-500 to-indigo-600",
    bgSoft: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  "All Leads Import": {
    icon: Database,
    color: "#8b5cf6",
    gradient: "from-violet-500 to-purple-600",
    bgSoft: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  },
  "Facebook Ads": {
    icon: Share2,
    color: "#0ea5e9",
    gradient: "from-sky-500 to-blue-600",
    bgSoft: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  },
  "CRM (Manual)": {
    icon: UserCheck,
    color: "#0d9488",
    gradient: "from-teal-500 to-emerald-600",
    bgSoft: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
  },
  "Consultation Form": {
    icon: ClipboardList,
    color: "#ec4899",
    gradient: "from-pink-500 to-rose-600",
    bgSoft: "bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400",
  },
  "Landing Page Form": {
    icon: Layout,
    color: "#f97316",
    gradient: "from-amber-500 to-orange-600",
    bgSoft: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  },
  "WhatsApp Direct": {
    icon: MessageCircle,
    color: "#10b981",
    gradient: "from-emerald-500 to-green-600",
    bgSoft: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  "University Fair": {
    icon: GraduationCap,
    color: "#6366f1",
    gradient: "from-indigo-500 to-indigo-700",
    bgSoft: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  },
  "Referral Partner": {
    icon: HeartHandshake,
    color: "#eab308",
    gradient: "from-amber-400 to-yellow-500",
    bgSoft: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  },
  "Google Organic": {
    icon: Globe,
    color: "#14b8a6",
    gradient: "from-teal-400 to-teal-600",
    bgSoft: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  },
};

const defaultMeta: ChannelMeta = {
  icon: Megaphone,
  color: "#64748b",
  gradient: "from-slate-400 to-slate-500",
  bgSoft: "bg-surface-muted text-muted-foreground",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: LeadSource & { pct: string };
  }>;
}

function LeadSourceTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;
  const meta = channelMeta[item.source] || defaultMeta;
  const Icon = meta.icon;

  return (
    <div className="card-shadow flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs shadow-xl">
      <span className={cn("flex size-7 items-center justify-center rounded-lg", meta.bgSoft)}>
        <Icon className="size-3.5" />
      </span>
      <div>
        <p className="font-semibold text-foreground">{item.source}</p>
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">{item.value} leads</span> ({item.pct}%)
        </p>
      </div>
    </div>
  );
}

export function Top10LeadSources() {
  const [viewMode, setViewMode] = useState<"donut" | "chart" | "list">("donut");
  const rawData = getTop10LeadSources();

  const totalLeads = useMemo(() => {
    return rawData.reduce((acc, curr) => acc + curr.value, 0);
  }, [rawData]);

  // For chart (horizontal bars): reverse so highest is at the top
  const chartData = useMemo(() => {
    return [...rawData]
      .sort((a, b) => a.value - b.value)
      .map((item) => ({
        ...item,
        pct: ((item.value / totalLeads) * 100).toFixed(1),
      }));
  }, [rawData, totalLeads]);

  // For list and donut (highest first)
  const listData = useMemo(() => {
    return [...rawData]
      .sort((a, b) => b.value - a.value)
      .map((item) => ({
        ...item,
        pct: ((item.value / totalLeads) * 100).toFixed(1),
        color: (channelMeta[item.source] || defaultMeta).color,
      }));
  }, [rawData, totalLeads]);

  const topChannel = listData[0];

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        icon={Megaphone}
        iconBg="bg-primary-soft"
        iconColor="text-primary"
        title="Top 10 Lead Sources"
        subtitle="Top channels by volume"
        action={
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface-muted p-1">
            <button
              type="button"
              onClick={() => setViewMode("donut")}
              aria-label="Pie / Donut chart view"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all",
                viewMode === "donut"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PieChartIcon className="size-3.5 shrink-0" />
              <span className="whitespace-nowrap">Pie</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("chart")}
              aria-label="Horizontal bar chart view"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all",
                viewMode === "chart"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BarChart3 className="size-3.5 shrink-0" />
              <span className="whitespace-nowrap">Bars</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="Ranked list view"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all",
                viewMode === "list"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListOrdered className="size-3.5 shrink-0" />
              <span className="whitespace-nowrap">List</span>
            </button>
          </div>
        }
      />

      <div className="flex flex-1 flex-col justify-between px-6 pb-5 pt-2">
        {viewMode === "donut" ? (
          /* Segmented Donut / Pie Distribution */
          <div className="flex flex-col gap-2">
            <div className="relative flex h-[175px] w-full items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={listData}
                    dataKey="value"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    cornerRadius={5}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  >
                    {listData.map((entry) => (
                      <Cell key={entry.source} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<LeadSourceTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Metrics Pill */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  {totalLeads}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Leads
                </span>
              </div>
            </div>

            {/* Ranked Badges Matrix - 2 symmetrical columns, no internal scrollbar */}
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {listData.map((item) => {
                const meta = channelMeta[item.source] || defaultMeta;
                return (
                  <div
                    key={item.source}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface-muted/50 px-2.5 py-1.5 transition-colors hover:bg-surface-hover"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <div className="min-w-0 flex-1 flex items-baseline justify-between gap-1">
                      <p className="truncate text-[11px] font-medium text-muted-foreground">
                        {item.source}
                      </p>
                      <span className="text-[11px] font-semibold text-foreground tabular-nums shrink-0">
                        {item.value}{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          ({item.pct}%)
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewMode === "chart" ? (
          /* Modern Horizontal Bar Chart matching Image 2 with sleek styling */
          <div className="flex flex-col">
            <div className="h-[350px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 8, right: 36, left: 16, bottom: 20 }}
                  barCategoryGap="16%"
                >
                  <defs>
                    <linearGradient id="top10BarGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 6" />
                  <XAxis
                    type="number"
                    domain={[0, "dataMax + 10"]}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)" }}
                    tickMargin={8}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    label={{
                      value: "Leads",
                      position: "insideBottom",
                      offset: -12,
                      fill: "var(--muted-foreground)",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="source"
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)" }}
                    width={110}
                    tick={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 500 }}
                  />
                  <Tooltip content={<LeadSourceTooltip />} cursor={{ fill: "var(--surface-hover)", radius: 6 }} />
                  <Bar
                    dataKey="value"
                    name="Leads"
                    fill="url(#top10BarGradient)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={22}
                  >
                    {chartData.map((entry) => {
                      const meta = channelMeta[entry.source];
                      return (
                        <Cell
                          key={entry.source}
                          fill={meta ? meta.color : "url(#top10BarGradient)"}
                        />
                      );
                    })}
                    <LabelList
                      dataKey="value"
                      position="right"
                      style={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 700 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          /* Ranked Channel List */
          <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1 pt-1">
            {listData.map((item, idx) => {
              const meta = channelMeta[item.source] || defaultMeta;
              const Icon = meta.icon;
              const widthPct = Math.max((item.value / topChannel.value) * 100, 5);

              return (
                <div
                  key={item.source}
                  className="group flex flex-col gap-1.5 rounded-xl border border-border/60 bg-surface p-2.5 transition-colors hover:border-border-strong hover:bg-surface-muted/40"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
                          meta.bgSoft
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span className="truncate font-semibold text-foreground">
                        {item.source}
                      </span>
                      <span className="rounded-sm bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-foreground tabular-nums">
                        {item.value}
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                        {item.pct}%
                      </span>
                    </div>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted ring-1 ring-border/30">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", meta.gradient)}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Insight Highlight Footer */}
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary-soft/50 px-3.5 py-2 text-xs text-foreground">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
              <Sparkles className="size-3" />
            </span>
            <p className="truncate text-xs font-medium">
              <strong className="font-semibold text-primary">{topChannel.source}</strong> generated{" "}
              <strong>{topChannel.value} leads</strong> this month ({topChannel.pct}% of total).
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-primary shadow-xs">
            #1 Channel
          </span>
        </div>
      </div>
    </Card>
  );
}
