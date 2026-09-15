"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Clapperboard,
  ClipboardList,
  Database,
  HeartHandshake,
  Layers,
  Layout,
  Megaphone,
  MessageCircle,
  PieChart as PieChartIcon,
  Share2,
  Sparkles,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { getTopLeadSources, type LeadSource } from "@/lib/mock/dashboard";
import { cn } from "@/lib/utils";

interface ChannelConfig {
  icon: LucideIcon;
  color: string;
  gradient: string;
  bgSoft: string;
}

const channelConfigs: Record<string, ChannelConfig> = {
  "TikTok Ads": {
    icon: Clapperboard,
    color: "#6366f1",
    gradient: "from-indigo-500 to-indigo-600",
    bgSoft: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
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
  WhatsApp: {
    icon: MessageCircle,
    color: "#10b981",
    gradient: "from-emerald-500 to-green-600",
    bgSoft: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  Others: {
    icon: Layers,
    color: "#64748b",
    gradient: "from-slate-500 to-gray-600",
    bgSoft: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400",
  },
  Referral: {
    icon: HeartHandshake,
    color: "#eab308",
    gradient: "from-amber-400 to-yellow-500",
    bgSoft: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  },
};

const defaultConfig: ChannelConfig = {
  icon: Megaphone,
  color: "#64748b",
  gradient: "from-slate-400 to-slate-500",
  bgSoft: "bg-surface-muted text-muted-foreground",
};

interface DonutTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: LeadSource & {
      pct: string;
      color: string;
    };
  }>;
}

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;
  const config = channelConfigs[item.source] || defaultConfig;
  const Icon = config.icon;

  return (
    <div className="card-shadow flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs shadow-xl">
      <span className={cn("flex size-7 items-center justify-center rounded-lg", config.bgSoft)}>
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

export function TopLeadSourcesChart() {
  const [viewMode, setViewMode] = useState<"donut" | "bars">("donut");
  const rawData = getTopLeadSources();

  // Sort descending by value (highest to lowest)
  const sortedData = useMemo(() => {
    return [...rawData].sort((a, b) => b.value - a.value);
  }, [rawData]);

  const totalLeads = useMemo(() => {
    return sortedData.reduce((acc, curr) => acc + curr.value, 0);
  }, [sortedData]);

  const chartData = useMemo(() => {
    return sortedData.map((item) => ({
      ...item,
      pct: ((item.value / totalLeads) * 100).toFixed(1),
      color: (channelConfigs[item.source] || defaultConfig).color,
    }));
  }, [sortedData, totalLeads]);

  const topChannel = chartData[0];

  return (
    <Card className="flex flex-col">
      <CardHeader
        icon={Megaphone}
        iconBg="bg-danger-soft"
        iconColor="text-danger"
        title="Top Lead Sources"
        subtitle={`${totalLeads} total leads across ${sortedData.length} channels`}
        action={
          <div className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1">
            <button
              type="button"
              onClick={() => setViewMode("donut")}
              aria-label="Donut chart view"
              title="Donut distribution view"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all",
                viewMode === "donut"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PieChartIcon className="size-3.5" />
              <span>Donut</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("bars")}
              aria-label="Progress bars view"
              title="Ranked list view"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all",
                viewMode === "bars"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BarChart3 className="size-3.5" />
              <span>Bars</span>
            </button>
          </div>
        }
      />

      <div className="flex flex-1 flex-col justify-between px-6 pb-6 pt-4">
        {viewMode === "donut" ? (
          <div className="flex flex-col gap-4">
            {/* Donut Ring with Center Summary */}
            <div className="relative flex h-52 w-full items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={3}
                    cornerRadius={6}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Metrics Pill */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {totalLeads}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Leads
                </span>
              </div>
            </div>

            {/* Ranked Badges Matrix */}
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              {chartData.slice(0, 6).map((item) => {
                const config = channelConfigs[item.source] || defaultConfig;
                return (
                  <div
                    key={item.source}
                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-surface-muted/50 p-2 transition-colors hover:bg-surface-hover"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-muted-foreground">
                        {item.source}
                      </p>
                      <p className="font-semibold text-foreground tabular-nums">
                        {item.value}{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          ({item.pct}%)
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Ranked Full-Width Bars View (Pixel-perfect alignment, no clipping!) */
          <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
            {chartData.map((item, idx) => {
              const config = channelConfigs[item.source] || defaultConfig;
              const Icon = config.icon;
              const widthPct = Math.max((item.value / topChannel.value) * 100, 4);

              return (
                <div
                  key={item.source}
                  className="group flex flex-col gap-1.5 rounded-xl border border-transparent p-1.5 transition-colors hover:border-border/60 hover:bg-surface-muted/40"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
                          config.bgSoft
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span className="truncate font-medium text-foreground">
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

                  {/* Clean Horizontal Progress Bar with Gradient */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted ring-1 ring-border/30">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", config.gradient)}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Insight Highlight Callout (inspired by Clinexa in ref_image_2.jpg) */}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary-soft/60 px-3.5 py-2.5 text-xs text-foreground">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
              <Sparkles className="size-3" />
            </span>
            <p className="truncate text-xs font-medium">
              <strong className="font-semibold text-primary">{topChannel.source}</strong> is your
              #1 acquisition channel ({topChannel.pct}% of total).
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-emerald-600 shadow-xs dark:text-emerald-400">
            Top Driver
          </span>
        </div>
      </div>
    </Card>
  );
}
