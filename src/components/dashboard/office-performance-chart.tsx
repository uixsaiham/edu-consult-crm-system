"use client";

import { Building2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { getOfficePerformance } from "@/lib/mock/dashboard";
import { ChartTooltip } from "./chart-tooltip";

const applicationsColor = "var(--chart-1)";
const enrolledColor = "var(--success)";
const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 };

export function OfficePerformanceChart() {
  const data = getOfficePerformance();
  const totalApps = data.reduce((sum, d) => sum + d.applications, 0);
  const totalEnrolled = data.reduce((sum, d) => sum + d.enrolled, 0);
  const topOffice = [...data].sort((a, b) => b.applications - a.applications)[0];
  const ukApps = data.filter((d) => d.country === "UK").reduce((sum, d) => sum + d.applications, 0);
  const share = (n: number) => `${Math.round((n / totalApps) * 100)}%`;

  const stats = [
    { label: "Applications", value: totalApps.toLocaleString("en-GB"), note: `${data.length} offices` },
    { label: "Enrolled", value: totalEnrolled.toLocaleString("en-GB"), note: share(totalEnrolled) },
    { label: "Top office", value: topOffice?.office ?? "—", note: topOffice ? share(topOffice.applications) : "" },
    { label: "UK offices", value: ukApps.toLocaleString("en-GB"), note: share(ukApps) },
  ];

  return (
    <Card className="flex min-w-0 flex-col">
      <CardHeader icon={Building2} title="Branch performance" subtitle="Applications and enrolments by office" />

      <div className="flex flex-1 flex-col gap-5 px-6 pb-6 pt-5">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0 bg-surface px-4 py-3">
              <dt className="truncate text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-lg font-semibold tabular-nums text-foreground">{stat.value}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{stat.note}</span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="h-60 min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 6" />
              <XAxis dataKey="office" tickLine={false} axisLine={false} tickMargin={10} tick={axisTick} interval={0} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={axisTick}
                width={56}
                tickFormatter={(v: number) => v.toLocaleString("en-GB")}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-hover)" }} />
              <Bar dataKey="applications" name="Applications" fill={applicationsColor} radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="enrolled" name="Enrolled" fill={enrolledColor} radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <Legend color={applicationsColor} label="Applications" />
          <Legend color={enrolledColor} label="Enrolled" />
        </div>
      </div>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
