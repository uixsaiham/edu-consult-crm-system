import type { MonthPoint } from "@/lib/mock/performance";

export type PeriodKey = "1m" | "3m" | "6m" | "12m";

export const periods: { key: PeriodKey; label: string; months: number; compare: string }[] = [
  { key: "1m", label: "This month", months: 1, compare: "vs last month" },
  { key: "3m", label: "Quarter", months: 3, compare: "vs previous quarter" },
  { key: "6m", label: "6 months", months: 6, compare: "vs previous 6 months" },
  { key: "12m", label: "12 months", months: 12, compare: "vs previous year" },
];

export function periodInfo(key: PeriodKey) {
  return periods.find((p) => p.key === key) ?? periods[periods.length - 1];
}

export type Totals = Omit<MonthPoint, "key" | "label">;

const emptyTotals: Totals = {
  leads: 0, qualified: 0, applications: 0, offers: 0, visas: 0, enrolled: 0, revenue: 0, spend: 0,
};

export function sumPoints(points: MonthPoint[]): Totals {
  return points.reduce<Totals>(
    (acc, p) => ({
      leads: acc.leads + p.leads,
      qualified: acc.qualified + p.qualified,
      applications: acc.applications + p.applications,
      offers: acc.offers + p.offers,
      visas: acc.visas + p.visas,
      enrolled: acc.enrolled + p.enrolled,
      revenue: acc.revenue + p.revenue,
      spend: acc.spend + p.spend,
    }),
    { ...emptyTotals }
  );
}

/** Totals for the latest `months`, or the equal window before it when `previous` is set. */
export function windowTotals(series: MonthPoint[], months: number, previous = false) {
  const end = series.length - (previous ? months : 0);
  return sumPoints(series.slice(Math.max(0, end - months), end));
}

/** Month-by-month sum across several entities (all series share the same months). */
export function combineSeries(all: MonthPoint[][]): MonthPoint[] {
  if (all.length === 0) return [];
  return all[0].map((p, i) => ({ key: p.key, label: p.label, ...sumPoints(all.map((s) => s[i])) }));
}

export interface Snapshot {
  current: Totals;
  previous: Totals;
  /** Latest 12 months, for sparklines and charts. */
  trend: MonthPoint[];
}

export function snapshot(series: MonthPoint[], months: number): Snapshot {
  return {
    current: windowTotals(series, months),
    previous: windowTotals(series, months, true),
    trend: series.slice(-12),
  };
}

export function ratio(part: number, whole: number) {
  return whole > 0 ? part / whole : 0;
}

/** Relative change, or null when there is nothing to compare with. */
export function change(current: number, previous: number) {
  return previous > 0 ? (current - previous) / previous : null;
}

const numberFmt = new Intl.NumberFormat("en-GB");
const compactFmt = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 });
const gbpFmt = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const gbpCompactFmt = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  notation: "compact",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const fmt = {
  number: (n: number) => numberFmt.format(Math.round(n)),
  compact: (n: number) => (Math.abs(n) >= 10000 ? compactFmt.format(n) : numberFmt.format(Math.round(n))),
  gbp: (n: number) => gbpFmt.format(n),
  gbpCompact: (n: number) => (Math.abs(n) >= 10000 ? gbpCompactFmt.format(n) : gbpFmt.format(n)),
  pct: (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`,
  hours: (n: number) => (n < 1 ? `${Math.round(n * 60)}m` : `${n.toFixed(1)}h`),
  days: (n: number) => `${Math.round(n)}d`,
};

/** Distinct series colours that read well in light and dark themes. */
export const seriesColors = [
  "#4d76bb",
  "#f59e0b",
  "#45c348",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#fb923c",
  "#0ea5e9",
  "#e53e2b",
  "#64748b",
  "#a3a3a3",
  "#84cc16",
];

export { downloadCsv } from "@/lib/csv";
