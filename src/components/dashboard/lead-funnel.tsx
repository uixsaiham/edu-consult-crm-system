import { Filter } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { getLeadFunnel } from "@/lib/mock/dashboard";

export function LeadFunnel() {
  const stages = getLeadFunnel();
  const max = stages[0]?.count ?? 0;

  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardHeader
        icon={Filter}
        iconBg="bg-accent-soft"
        iconColor="text-accent"
        title="Lead Conversion Funnel"
        subtitle="From first contact to enrollment, this intake cycle"
      />
      <div className="flex min-h-72 flex-1 flex-col justify-between gap-3 px-4 py-5 sm:px-6">
        {stages.map((stage, i) => {
          const widthPct = max > 0 ? (stage.count / max) * 100 : 0;
          const prev = i > 0 ? stages[i - 1].count : null;
          const conv = prev ? Math.round((stage.count / prev) * 100) : null;
          return (
            <div key={stage.stage} className="grid grid-cols-[6.5rem_minmax(0,1fr)_3.5rem_2.25rem] items-center gap-2 sm:grid-cols-[9rem_minmax(0,1fr)_3.5rem_2.5rem] sm:gap-3 xl:grid-cols-[6.5rem_minmax(0,1fr)_3.5rem_2.25rem] xl:gap-2 2xl:grid-cols-[9rem_minmax(0,1fr)_3.5rem_2.5rem] 2xl:gap-3">
              <div className="text-xs font-medium text-muted-foreground">
                {stage.stage}
              </div>
              <div className="h-2.5 min-w-0 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <div className="tabular-nums text-right text-xs font-semibold text-foreground">
                {stage.count.toLocaleString("en-GB")}
              </div>
              <div className="tabular-nums text-right text-xs text-muted-foreground">
                {conv !== null ? `${conv}%` : "—"}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-auto border-t border-border px-6 py-4 text-xs text-muted-foreground">
        Percentages show conversion from the previous stage.
      </div>
    </Card>
  );
}
