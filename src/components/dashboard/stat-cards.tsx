"use client";

import {
  CheckCircle2,
  Handshake,
  UserCheck,
  Users2,
  type LucideIcon,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { getStatCards } from "@/lib/mock/dashboard";
import { cn } from "@/lib/utils";

const statStyles: Record<
  string,
  { icon: LucideIcon; iconBg: string; iconColor: string; spark: string }
> = {
  leads: { icon: Users2, iconBg: "bg-danger-soft", iconColor: "text-danger", spark: "var(--danger)" },
  "direct-applications": {
    icon: UserCheck,
    iconBg: "bg-accent-soft",
    iconColor: "text-accent",
    spark: "var(--accent)",
  },
  "agent-applications": {
    icon: Handshake,
    iconBg: "bg-primary-soft",
    iconColor: "text-primary",
    spark: "var(--primary)",
  },
  "cas-received": {
    icon: CheckCircle2,
    iconBg: "bg-success-soft",
    iconColor: "text-success",
    spark: "var(--success)",
  },
};

export function StatCards() {
  const stats = getStatCards();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const style = statStyles[stat.id];
        const Icon = style?.icon ?? Users2;
        const data = stat.spark.map((v, i) => ({ i, v }));
        const up = stat.trend === "up" || stat.trend === "flat";

        return (
          <Card key={stat.id} className="p-5 transition-shadow hover:shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full",
                    style?.iconBg ?? "bg-primary-soft"
                  )}
                >
                  <Icon className={cn("size-5", style?.iconColor ?? "text-primary")} />
                </span>
                <p className="truncate text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
              </div>
              <p className="shrink-0 text-xl font-bold tracking-tight">{stat.value}</p>
            </div>

            {stat.split && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span>
                    {stat.split.leftPercent}% {stat.split.leftLabel}
                  </span>
                  <span>
                    {100 - stat.split.leftPercent}% {stat.split.rightLabel}
                  </span>
                </div>
                <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${stat.split.leftPercent}%` }}
                  />
                  <div
                    className="h-full bg-primary/60"
                    style={{ width: `${100 - stat.split.leftPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
              <p className="text-xs">
                <span className={up ? "font-semibold text-success" : "font-semibold text-danger"}>
                  {stat.deltaLabel}
                </span>{" "}
                <span className="text-muted-foreground">from last year</span>
              </p>
              <div className="h-8 w-20 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`spark-${stat.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={style?.spark} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={style?.spark} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={style?.spark}
                      strokeWidth={2}
                      fill={`url(#spark-${stat.id})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
