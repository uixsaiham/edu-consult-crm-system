import { Filter } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { getLeadFunnel } from "@/lib/mock/dashboard";

export function LeadFunnel() {
  const stages = getLeadFunnel();
  const max = stages[0].count;

  return (
    <Card>
      <CardHeader
        icon={Filter}
        iconBg="bg-accent-soft"
        iconColor="text-accent"
        title="Lead Conversion Funnel"
        subtitle="From first contact to enrollment, this intake cycle"
      />
      <div className="flex flex-col gap-3.5 px-6 pb-6 pt-5">
        {stages.map((stage, i) => {
          const widthPct = Math.max((stage.count / max) * 100, 4);
          const prev = i > 0 ? stages[i - 1].count : null;
          const conv = prev ? Math.round((stage.count / prev) * 100) : null;
          return (
            <div key={stage.stage} className="flex items-center gap-3">
              <div className="w-32 shrink-0 text-xs font-medium text-muted-foreground sm:w-36">
                {stage.stage}
              </div>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <div className="w-14 shrink-0 text-right text-xs font-semibold text-foreground">
                {stage.count.toLocaleString()}
              </div>
              <div className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                {conv !== null ? `${conv}%` : ""}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
