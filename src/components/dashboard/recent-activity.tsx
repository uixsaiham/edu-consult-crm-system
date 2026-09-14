import { Download } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { getRecentActivity } from "@/lib/mock/dashboard";

export function RecentActivity() {
  const items = getRecentActivity();

  return (
    <Card>
      <CardHeader
        title="Recent Activity"
        subtitle="Latest updates across leads and applications"
        action={
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground">
            <Download className="size-3.5" />
            Export
          </button>
        }
      />
      <ul className="flex flex-col gap-1 px-3 py-3">
        {items.map((item, i) => (
          <li key={item.id} className="relative flex gap-3 px-2 py-2.5">
            <div className="flex flex-col items-center">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
              {i !== items.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-border" />
              )}
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">{item.description}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {item.actor} · {item.time}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
