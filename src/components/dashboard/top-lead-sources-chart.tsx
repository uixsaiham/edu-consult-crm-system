"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { getTopLeadSources } from "@/lib/mock/dashboard";
import { ChartTooltip } from "./chart-tooltip";

const colors = [
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-7)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-8)",
  "var(--chart-10)",
];

export function TopLeadSourcesChart() {
  const data = [...getTopLeadSources()].sort((a, b) => a.value - b.value);

  return (
    <Card>
      <CardHeader title="Top Lead Sources" subtitle="Lead volume by acquisition channel, this month" />
      <div className="h-80 px-2 pb-4 pt-2 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="source"
              tickLine={false}
              axisLine={false}
              width={120}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-hover)" }} />
            <Bar dataKey="value" name="Leads" radius={[0, 6, 6, 0]} maxBarSize={18}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
