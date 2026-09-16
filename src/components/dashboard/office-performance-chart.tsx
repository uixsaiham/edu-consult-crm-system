"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  Globe2,
  Layers,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { getOfficePerformance } from "@/lib/mock/dashboard";
import { cn } from "@/lib/utils";

type BranchViewMode = "applications" | "comparison";

const officePalette = [
  { stroke: "#6366f1", gradient: ["#6366f1", "#4f46e5"] }, // Dhaka
  { stroke: "#3b82f6", gradient: ["#3b82f6", "#2563eb"] }, // London
  { stroke: "#0ea5e9", gradient: ["#0ea5e9", "#0284c7"] }, // Manchester
  { stroke: "#10b981", gradient: ["#10b981", "#059669"] }, // Milton Keynes
  { stroke: "#8b5cf6", gradient: ["#8b5cf6", "#7c3aed"] }, // Sylhet
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color?: string;
    name?: string;
    payload?: {
      office: string;
      country: string;
      applications: number;
      enrolled: number;
    };
  }>;
  label?: string;
}

function OfficeCustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0].payload;
  if (!item) return null;

  const convRate = item.applications > 0 ? ((item.enrolled / item.applications) * 100).toFixed(1) : "0";

  return (
    <div className="card-shadow flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3.5 text-xs shadow-xl min-w-[210px]">
      <div className="flex items-center justify-between border-b border-border/70 pb-2">
        <div>
          <p className="font-bold text-foreground text-sm">{item.office}</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Globe2 className="size-2.5" />
            {item.country} Office
          </p>
        </div>
        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
          {convRate}% Conv.
        </span>
      </div>

      <div className="flex flex-col gap-1.5 pt-0.5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" />
            Applications:
          </span>
          <span className="font-bold text-foreground tabular-nums">
            {item.applications.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" />
            Enrolled Students:
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {item.enrolled.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export function OfficePerformanceChart() {
  const data = getOfficePerformance();
  const [viewMode, setViewMode] = useState<BranchViewMode>("applications");

  // Calculate totals
  const metrics = useMemo(() => {
    const totalApps = data.reduce((acc, d) => acc + d.applications, 0);
    const totalEnrolled = data.reduce((acc, d) => acc + d.enrolled, 0);
    const avgConversion = totalApps > 0 ? ((totalEnrolled / totalApps) * 100).toFixed(1) : "0";
    const topOffice = [...data].sort((a, b) => b.applications - a.applications)[0];
    const ukTotal = data.filter((d) => d.country === "UK").reduce((acc, d) => acc + d.applications, 0);
    const bdTotal = data.filter((d) => d.country === "Bangladesh").reduce((acc, d) => acc + d.applications, 0);

    return {
      totalApps,
      totalEnrolled,
      avgConversion,
      topOffice,
      ukTotal,
      bdTotal,
      bdPct: Math.round((bdTotal / totalApps) * 100),
      ukPct: Math.round((ukTotal / totalApps) * 100),
    };
  }, [data]);

  return (
    <Card className="flex flex-col">
      <CardHeader
        icon={Building2}
        iconBg="bg-success-soft"
        iconColor="text-success"
        title="Branch Performance"
        subtitle="Regional office volume & student conversion"
        action={
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface-muted p-1">
            <button
              type="button"
              onClick={() => setViewMode("applications")}
              aria-label="Branch applications volume"
              title="Branch applications volume"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
                viewMode === "applications"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BarChart3 className="size-3.5 shrink-0" />
              <span className="whitespace-nowrap">Applications</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("comparison")}
              aria-label="Applications vs Enrolled comparison"
              title="Applications vs Enrolled comparison"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
                viewMode === "comparison"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="size-3.5 shrink-0" />
              <span className="whitespace-nowrap">Apps vs Enrolled</span>
            </button>
          </div>
        }
      />

      {/* 4 Quick Branch KPI Cards (Matching IntakeOverview Tabs structure) */}
      <div className="grid grid-cols-2 gap-2.5 px-5 pt-4 sm:grid-cols-4">
        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-3 transition-all hover:border-border-strong">
          <div className="flex items-center justify-between gap-1">
            <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              GLOBAL
            </span>
          </div>
          <div className="mt-2">
            <p className="truncate text-xs font-bold tracking-tight text-foreground sm:text-sm">Total Apps</p>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-base font-bold text-foreground tabular-nums sm:text-lg">
                {metrics.totalApps.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground">apps</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-3 transition-all hover:border-border-strong">
          <div className="flex items-center justify-between gap-1">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              ENROLLED
            </span>
          </div>
          <div className="mt-2">
            <p className="truncate text-xs font-bold tracking-tight text-foreground sm:text-sm">Students</p>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums sm:text-lg">
                {metrics.totalEnrolled.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground">({metrics.avgConversion}%)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-primary/40 bg-primary-soft/30 p-3 shadow-xs transition-all hover:border-primary">
          <div className="flex items-center justify-between gap-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
              TOP OFFICE
            </span>
          </div>
          <div className="mt-2">
            <p className="truncate text-xs font-bold tracking-tight text-foreground sm:text-sm">
              {metrics.topOffice?.office}
            </p>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-base font-bold text-foreground tabular-nums sm:text-lg">
                {metrics.topOffice?.applications.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground">
                ({Math.round(((metrics.topOffice?.applications || 0) / metrics.totalApps) * 100)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-3 transition-all hover:border-border-strong">
          <div className="flex items-center justify-between gap-1">
            <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              UK OFFICES
            </span>
          </div>
          <div className="mt-2">
            <p
              className="truncate text-xs font-bold tracking-tight text-foreground sm:text-sm"
              title="London, Manchester, Milton Keynes"
            >
              3 UK Offices
            </p>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-base font-bold text-foreground tabular-nums sm:text-lg">
                {metrics.ukTotal.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground">({metrics.ukPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Performance Distribution Banner (Matching IntakeOverview Stage Banner) */}
      <div className="mx-5 mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-surface-muted/40 p-2 sm:p-2.5 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            <span className="font-semibold text-foreground">Bangladesh Offices:</span>
            <span className="text-muted-foreground tabular-nums">{metrics.bdTotal.toLocaleString()} ({metrics.bdPct}%)</span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-sky-500" />
            <span className="font-semibold text-foreground">UK Offices:</span>
            <span className="text-muted-foreground tabular-nums">{metrics.ukTotal.toLocaleString()} ({metrics.ukPct}%)</span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <Globe2 className="size-3" />
          5 Active Branches • Last 12 Months
        </span>
      </div>

      {/* Main Chart Visualization */}
      <div className="px-3 pb-5 pt-4 sm:px-5">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "applications" ? (
              <BarChart data={data} margin={{ top: 10, right: 12, left: -14, bottom: 0 }}>
                <defs>
                  {data.map((d, i) => (
                    <linearGradient key={d.office} id={`branch-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={officePalette[i % officePalette.length].gradient[0]} stopOpacity={1} />
                      <stop offset="100%" stopColor={officePalette[i % officePalette.length].gradient[1]} stopOpacity={0.65} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 8" />
                <XAxis
                  dataKey="office"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 500 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  width={38}
                />
                <Tooltip content={<OfficeCustomTooltip />} cursor={{ fill: "var(--surface-hover)", radius: 8 }} />
                <Bar dataKey="applications" name="Applications" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={`url(#branch-grad-${i})`} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 12, left: -14, bottom: 0 }} barGap={4} barCategoryGap="22%">
                <defs>
                  <linearGradient id="office-apps-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="office-enrolled-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 8" />
                <XAxis
                  dataKey="office"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 500 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  width={38}
                />
                <Tooltip content={<OfficeCustomTooltip />} cursor={{ fill: "var(--surface-hover)", radius: 8 }} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)", paddingTop: 12 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="applications" name="Applications" fill="url(#office-apps-grad)" radius={[6, 6, 0, 0]} maxBarSize={24} />
                <Bar dataKey="enrolled" name="Enrolled" fill="url(#office-enrolled-grad)" radius={[6, 6, 0, 0]} maxBarSize={24} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
