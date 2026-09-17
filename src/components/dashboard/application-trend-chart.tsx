"use client";

import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { getApplicationTrend } from "@/lib/mock/dashboard";
import { ChartTooltip } from "./chart-tooltip";

export function ApplicationTrendChart() {
  const data = getApplicationTrend();

  return (
    <Card className="flex min-h-[400px] min-w-0 flex-col">
      <CardHeader
        icon={TrendingUp}
        title="Applications Trend"
        subtitle="Direct vs. agent-referred applications, last 6 months"
      />
      <div className="h-72 min-w-0 shrink-0 px-2 pb-4 pt-4 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="directFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="agentFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 8" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              width={44}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border-strong)", strokeWidth: 1.5 }} />
            <Area
              type="monotone"
              dataKey="direct"
              name="Direct"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              fill="url(#directFill)"
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface)" }}
            />
            <Area
              type="monotone"
              dataKey="agent"
              name="Agent"
              stroke="var(--chart-3)"
              strokeWidth={2.5}
              fill="url(#agentFill)"
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-6 py-4">
        <Legend color="var(--chart-1)" label="Direct Applications" />
        <Legend color="var(--chart-3)" label="Agent Applications" />
      </div>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}
