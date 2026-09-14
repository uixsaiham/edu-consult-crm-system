"use client";

import {
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
import { ChartTooltip } from "./chart-tooltip";

const tagStyles: Record<string, string> = {
  previous: "border-border text-muted-foreground",
  current: "border-primary bg-primary-soft text-primary",
  upcoming: "border-border text-muted-foreground",
  following: "border-border text-muted-foreground",
};

export function IntakeOverview() {
  const periods = getIntakePeriods();
  const breakdown = getIntakeBreakdown();

  return (
    <Card>
      <CardHeader
        title="Intake Application Pipeline"
        subtitle="Current intake plus the two before and after it"
      />

      <div className="grid grid-cols-2 gap-3 px-5 pt-4 sm:grid-cols-4">
        {periods.map((p) => (
          <div
            key={p.id}
            className={cn(
              "rounded-xl border px-3 py-3",
              tagStyles[p.tag]
            )}
          >
            <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">
              {p.label}
            </p>
            <p className="mt-1 text-sm font-semibold">{p.month}</p>
            <p className="mt-1 text-xs opacity-80">
              {p.applications.toLocaleString()} applications
            </p>
          </div>
        ))}
      </div>

      <div className="h-72 px-2 pb-3 pt-4 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={breakdown} margin={{ top: 4, right: 12, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="intake"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              width={44}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-hover)" }} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="submitted" name="Submitted" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="offer" name="Offer" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="visaFiled" name="Visa Filed" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="enrolled" name="Enrolled" fill="var(--chart-9)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
