"use client";

import { useId, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Download, Minus, type LucideIcon } from "lucide-react";
import { buttonSecondary } from "@/components/ui/button-styles";
import { cn, initialsFor } from "@/lib/utils";
import { change, fmt, periods, type PeriodKey } from "./metrics";

export type Tone = "primary" | "success" | "warning" | "danger" | "violet" | "teal" | "neutral";

export const toneClass: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  teal: "bg-teal-600/10 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
  neutral: "bg-surface-muted text-muted-foreground",
};

const toneStroke: Record<Tone, string> = {
  primary: "var(--primary)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  violet: "#8b5cf6",
  teal: "#14b8a6",
  neutral: "var(--muted-foreground)",
};

// --- Page header -------------------------------------------------------

export function PerformanceHeader({
  title,
  description,
  period,
  onPeriodChange,
  onExport,
}: {
  title: string;
  description: string;
  period: PeriodKey;
  onPeriodChange: (p: PeriodKey) => void;
  onExport?: () => void;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <PeriodTabs value={period} onChange={onPeriodChange} />
        {onExport && (
          <button type="button" onClick={onExport} className={buttonSecondary}>
            <Download className="size-4 text-muted-foreground" />
            Export CSV
          </button>
        )}
      </div>
    </header>
  );
}

export function PeriodTabs({ value, onChange }: { value: PeriodKey; onChange: (p: PeriodKey) => void }) {
  return (
    <div role="tablist" aria-label="Reporting period" className="inline-flex w-fit max-w-full shrink-0 rounded-full border border-border bg-surface p-1 card-shadow">
      {periods.map((p) => (
        <button
          key={p.key}
          type="button"
          role="tab"
          aria-selected={value === p.key}
          onClick={() => onChange(p.key)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
            value === p.key
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// --- KPI cards ---------------------------------------------------------

export function KpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5", className)}>{children}</div>;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  current,
  previous,
  compareLabel,
  spark,
  tone = "primary",
  invert,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  /** Omit to hide the change badge. */
  current?: number;
  previous?: number;
  compareLabel: string;
  spark?: number[];
  tone?: Tone;
  /** Lower is better (e.g. cost per lead). */
  invert?: boolean;
  hint?: string;
}) {
  return (
    <div className="card-shadow flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-4" title={hint}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", toneClass[tone])}>
          <Icon className="size-4" />
        </span>
        {spark && <Sparkline values={spark} color={toneStroke[tone]} className="h-8 w-20" />}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-2xl font-bold tracking-tight tabular-nums text-foreground">{value}</p>
      </div>
      <div className="flex min-w-0 items-center gap-1.5 text-[11px]">
        {current !== undefined && previous !== undefined && (
          <DeltaBadge value={change(current, previous)} invert={invert} />
        )}
        <span className="truncate text-muted-foreground">{compareLabel}</span>
      </div>
    </div>
  );
}

export function DeltaBadge({ value, invert, className }: { value: number | null; invert?: boolean; className?: string }) {
  if (value === null || !Number.isFinite(value)) {
    return <span className={cn("rounded-full bg-surface-muted px-1.5 py-0.5 font-semibold text-muted-foreground", className)}>—</span>;
  }
  const flat = Math.abs(value) < 0.005;
  const good = invert ? value < 0 : value > 0;
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums",
        flat ? "bg-surface-muted text-muted-foreground" : good ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
        className
      )}
    >
      <Icon className="size-3" />
      {fmt.pct(Math.abs(value))}
    </span>
  );
}

// --- Small visual primitives ------------------------------------------

export function Sparkline({
  values,
  color = "var(--primary)",
  className,
}: {
  values: number[];
  color?: string;
  className?: string;
}) {
  const id = useId();
  if (values.length < 2) return null;
  const w = 100;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.75} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/** Horizontal bar showing a 0–1 share with its label. */
export function RateBar({ value, max = 1, tone = "primary", label }: { value: number; max?: number; tone?: Tone; label?: string }) {
  const width = Math.max(2, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className="flex min-w-[112px] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: toneStroke[tone] }} />
      </div>
      <span className="w-11 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">{label ?? fmt.pct(value)}</span>
    </div>
  );
}

/** Target attainment bar: green at/above 100%, amber from 75%, red below. */
export function TargetProgress({ actual, target }: { actual: number; target: number }) {
  const pct = target > 0 ? actual / target : 0;
  const tone: Tone = pct >= 1 ? "success" : pct >= 0.75 ? "warning" : "danger";
  return (
    <div className="min-w-[128px]">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">{fmt.number(actual)}</span> / {fmt.number(target)}
        </span>
        <span className={cn("font-semibold tabular-nums", tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-danger")}>
          {Math.round(pct * 100)}%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-hover">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct * 100)}%`, backgroundColor: toneStroke[tone] }} />
      </div>
    </div>
  );
}

const avatarPalette: Tone[] = ["primary", "warning", "success", "violet", "teal", "danger"];

export function Avatar({ name, label, className }: { name: string; label?: string; className?: string }) {
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        toneClass[avatarPalette[hash % avatarPalette.length]],
        className
      )}
    >
      {label ?? initialsFor(name)}
    </span>
  );
}

export function Pill({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", toneClass[tone], className)}>
      {children}
    </span>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/** Callout used for the "what stands out" row on each page. */
export function InsightCard({
  icon: Icon,
  tone,
  eyebrow,
  title,
  detail,
  onClick,
}: {
  icon: LucideIcon;
  tone: Tone;
  eyebrow: string;
  title: string;
  detail: ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", toneClass[tone])}>
        <Icon className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{eyebrow}</span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span>
      </span>
    </>
  );
  const className = "card-shadow flex min-w-0 items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-left";
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(className, "transition-colors hover:border-border-strong")}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** Segmented toggle for switching a chart's metric. */
export function MetricToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex w-fit max-w-full shrink-0 self-start rounded-lg bg-surface-hover p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
            value === o.value ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
