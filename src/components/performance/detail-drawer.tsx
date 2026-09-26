"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import type { MonthPoint } from "@/lib/mock/performance";
import { DualAreaChart, Funnel, type MetricDef } from "./charts";
import { change } from "./metrics";
import { DeltaBadge, Legend } from "./perf-ui";
import { cn } from "@/lib/utils";

export interface DrawerKpi {
  label: string;
  value: ReactNode;
  current: number;
  previous: number;
  invert?: boolean;
}

/** Slide-over with period KPIs, a 12-month trend, the funnel and profile details. */
export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  icon,
  compareLabel,
  kpis,
  series,
  trend,
  stages,
  details,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  compareLabel: string;
  kpis: DrawerKpi[];
  series: MonthPoint[];
  trend?: [MetricDef, MetricDef];
  stages: { label: string; value: number }[];
  details: { label: string; value: ReactNode }[];
  children?: ReactNode;
}) {
  return (
    <SlideOver open={open} onClose={onClose} title={title} subtitle={subtitle} icon={icon}>
      <div className="flex flex-col gap-6">
        <section>
          <SectionLabel>Selected period · {compareLabel}</SectionLabel>
          <div className="grid grid-cols-2 gap-2.5">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-surface-muted px-3.5 py-3">
                <p className="text-[11px] text-muted-foreground">{k.label}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-lg font-bold tabular-nums text-foreground">{k.value}</span>
                  <DeltaBadge value={change(k.current, k.previous)} invert={k.invert} className="text-[10px]" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <SectionLabel className="mb-0">Last 12 months</SectionLabel>
            <Legend
              items={[
                { label: trend?.[0].label ?? "Applications", color: "var(--chart-1)" },
                { label: trend?.[1].label ?? "Enrolled", color: "var(--success)" },
              ]}
            />
          </div>
          <DualAreaChart series={series} a={trend?.[0]} b={trend?.[1]} />
        </section>

        <section>
          <SectionLabel>Conversion funnel</SectionLabel>
          <Funnel stages={stages} />
        </section>

        {children}

        <section>
          <SectionLabel>Profile</SectionLabel>
          <dl className="divide-y divide-border rounded-xl border border-border">
            {details.map((d) => (
              <div key={d.label} className="flex items-center justify-between gap-4 px-3.5 py-2.5 text-xs">
                <dt className="text-muted-foreground">{d.label}</dt>
                <dd className="text-right font-medium text-foreground">{d.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </SlideOver>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h4 className={cn("mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground", className)}>
      {children}
    </h4>
  );
}
