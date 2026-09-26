"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import type { MonthPoint } from "@/lib/mock/performance";
import { cn } from "@/lib/utils";
import { fmt, ratio, seriesColors } from "./metrics";
import { Legend, MetricToggle } from "./perf-ui";

const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 };

export interface MetricDef {
  value: string;
  label: string;
  get: (p: MonthPoint) => number;
  format: (n: number) => string;
}

export const metricDefs = {
  leads: { value: "leads", label: "Leads", get: (p: MonthPoint) => p.leads, format: fmt.number },
  applications: { value: "applications", label: "Applications", get: (p: MonthPoint) => p.applications, format: fmt.number },
  offers: { value: "offers", label: "Offers", get: (p: MonthPoint) => p.offers, format: fmt.number },
  enrolled: { value: "enrolled", label: "Enrolled", get: (p: MonthPoint) => p.enrolled, format: fmt.number },
  revenue: { value: "revenue", label: "Revenue", get: (p: MonthPoint) => p.revenue, format: fmt.gbpCompact },
  spend: { value: "spend", label: "Spend", get: (p: MonthPoint) => p.spend, format: fmt.gbpCompact },
} satisfies Record<string, MetricDef>;

interface TooltipEntry {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string | number;
}

function FormattedTooltip({
  active,
  payload,
  label,
  format,
  showTotal,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  format: (n: number) => string;
  showTotal?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const items = [...payload].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const total = items.reduce((s, i) => s + (i.value ?? 0), 0);
  return (
    <div className="card-shadow min-w-44 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs">
      {label && <p className="mb-1.5 font-semibold text-foreground">{label}</p>}
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <div key={String(item.dataKey)} className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="truncate text-muted-foreground">{item.name}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums text-foreground">{format(item.value ?? 0)}</span>
          </div>
        ))}
        {showTotal && items.length > 1 && (
          <div className="mt-1 flex items-center border-t border-border pt-1.5">
            <span className="text-muted-foreground">Total</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">{format(total)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** 12-month trend per entity with a metric switcher. */
export function EntityTrendChart({
  title,
  subtitle,
  icon,
  entities,
  metrics,
  variant = "line",
  limit = 6,
  className,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  entities: { id: string; name: string; series: MonthPoint[] }[];
  metrics: MetricDef[];
  variant?: "line" | "stacked";
  limit?: number;
  className?: string;
}) {
  const [metricKey, setMetricKey] = useState(metrics[0].value);
  const metric = metrics.find((m) => m.value === metricKey) ?? metrics[0];

  const { data, shown } = useMemo(() => {
    const ranked = entities
      .map((e) => ({ ...e, total: e.series.slice(-12).reduce((s, p) => s + metric.get(p), 0) }))
      .sort((a, b) => b.total - a.total);
    const top = ranked.slice(0, limit);
    const rest = ranked.slice(limit);
    const months = entities[0]?.series.slice(-12) ?? [];
    const rows = months.map((m, i) => {
      const offset = entities[0].series.length - 12 + i;
      const row: Record<string, string | number> = { label: `${m.label} ${m.key.slice(2, 4)}` };
      top.forEach((e) => (row[e.id] = metric.get(e.series[offset])));
      if (rest.length) row.__other = rest.reduce((s, e) => s + metric.get(e.series[offset]), 0);
      return row;
    });
    const list = top.map((e, i) => ({ id: e.id, name: e.name, color: seriesColors[i % seriesColors.length] }));
    if (rest.length) list.push({ id: "__other", name: `Other (${rest.length})`, color: "var(--border-strong)" });
    return { data: rows, shown: list };
  }, [entities, metric, limit]);

  const Chart = variant === "stacked" ? AreaChart : LineChart;

  return (
    <Card className={cn("flex min-w-0 flex-col", className)}>
      <CardHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        action={
          metrics.length > 1 ? (
            <div className="hidden sm:block">
              <MetricToggle value={metricKey} onChange={setMetricKey} options={metrics} />
            </div>
          ) : undefined
        }
      />
      {metrics.length > 1 && (
        <div className="px-6 pt-4 sm:hidden">
          <MetricToggle value={metricKey} onChange={setMetricKey} options={metrics} />
        </div>
      )}
      <div className="h-72 min-w-0 px-2 pt-5 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 8" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} tick={axisTick} interval="preserveStartEnd" minTickGap={12} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={axisTick} width={52} tickFormatter={(v: number) => metric.format(v)} />
            <Tooltip
              content={<FormattedTooltip format={metric.format} showTotal={variant === "stacked"} />}
              cursor={{ stroke: "var(--border-strong)", strokeWidth: 1.5 }}
            />
            {shown.map((s) =>
              variant === "stacked" ? (
                <Area
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  name={s.name}
                  stackId="1"
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.55}
                  strokeWidth={1.5}
                />
              ) : (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2.25}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
                />
              )
            )}
          </Chart>
        </ResponsiveContainer>
      </div>
      <div className="mt-auto border-t border-border px-6 py-4">
        <Legend items={shown.map((s) => ({ label: s.name, color: s.color }))} />
      </div>
    </Card>
  );
}

/** Applications vs enrolled (or any two metrics) for a single series. */
export function DualAreaChart({
  series,
  a = metricDefs.applications,
  b = metricDefs.enrolled,
  height = 200,
}: {
  series: MonthPoint[];
  a?: MetricDef;
  b?: MetricDef;
  height?: number;
}) {
  const data = series.slice(-12).map((p) => ({ label: p.label, a: a.get(p), b: b.get(p) }));
  return (
    <div style={{ height }} className="min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="dual-a" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="dual-b" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--success)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 8" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={axisTick} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} tickMargin={6} tick={axisTick} width={40} />
          <Tooltip content={<FormattedTooltip format={fmt.number} />} cursor={{ stroke: "var(--border-strong)" }} />
          <Area type="monotone" dataKey="a" name={a.label} stroke="var(--chart-1)" strokeWidth={2} fill="url(#dual-a)" />
          <Area type="monotone" dataKey="b" name={b.label} stroke="var(--success)" strokeWidth={2} fill="url(#dual-b)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Ranked horizontal bars (one value per entity). */
export function RankedBarChart({
  data,
  format,
  color = "var(--chart-1)",
  height,
}: {
  data: { name: string; value: number }[];
  format: (n: number) => string;
  color?: string;
  height?: number;
}) {
  return (
    <div style={{ height: height ?? Math.max(180, data.length * 34) }} className="min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }} barCategoryGap="28%">
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={axisTick} width={150} />
          <Tooltip content={<FormattedTooltip format={format} />} cursor={{ fill: "var(--surface-hover)" }} />
          <Bar
            dataKey="value"
            name="Value"
            fill={color}
            radius={[0, 6, 6, 0]}
            label={{ position: "right", fill: "var(--muted-foreground)", fontSize: 11, formatter: (v: unknown) => format(Number(v)) }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut with a centred total and a value list. */
export function DonutBreakdown({
  data,
  format = fmt.number,
  centerLabel,
}: {
  data: { name: string; value: number; color: string }[];
  format?: (n: number) => string;
  centerLabel: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative size-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<FormattedTooltip format={format} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums text-foreground">{format(total)}</span>
          <span className="text-[11px] text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <ul className="flex w-full min-w-0 flex-col gap-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="truncate text-muted-foreground">{d.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">{format(d.value)}</span>
            <span className="w-11 text-right tabular-nums text-muted-foreground">{fmt.pct(ratio(d.value, total), 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Stage-by-stage funnel with step conversion. */
export function Funnel({ stages }: { stages: { label: string; value: number }[] }) {
  const top = stages[0]?.value || 1;
  return (
    <ol className="flex flex-col gap-2.5">
      {stages.map((s, i) => {
        const prev = stages[i - 1]?.value;
        return (
          <li key={s.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-foreground">{s.label}</span>
              <span className="tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{fmt.number(s.value)}</span>
                {prev !== undefined && <span className="ml-2">{fmt.pct(ratio(s.value, prev))} of prev.</span>}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-hover">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(2, (s.value / top) * 100)}%`,
                  backgroundColor: seriesColors[i % seriesColors.length],
                }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
