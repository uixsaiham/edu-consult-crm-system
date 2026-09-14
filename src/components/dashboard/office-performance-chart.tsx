"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { getOfficePerformance } from "@/lib/mock/dashboard";
import { ChartTooltip } from "./chart-tooltip";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export function OfficePerformanceChart() {
  const data = getOfficePerformance();

  return (
    <Card>
      <CardHeader title="Branch Performance" subtitle="Applications by branch, trailing 12 months" />
      <div className="h-80 px-2 pb-4 pt-2 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 24 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="office"
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={56}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              width={44}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-hover)" }} />
            <Bar dataKey="applications" name="Applications" radius={[6, 6, 0, 0]} maxBarSize={44}>
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
