import type { LucideIcon } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import type { PersonPerformance } from "@/lib/mock/dashboard";
import { cn } from "@/lib/utils";

const avatarPalette = [
  "bg-primary-soft text-primary",
  "bg-accent-soft text-accent",
  "bg-warning-soft text-warning",
  "bg-success-soft text-success",
  "bg-danger-soft text-danger",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function paletteFor(name: string) {
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return avatarPalette[hash % avatarPalette.length];
}

export function PerformanceTable({
  title,
  subtitle,
  rows,
  nameLabel,
  icon,
  iconBg,
  iconColor,
}: {
  title: string;
  subtitle: string;
  rows: PersonPerformance[];
  nameLabel: string;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} icon={icon} iconBg={iconBg} iconColor={iconColor} />
      <div className="overflow-x-auto px-3 pb-3 pt-5 sm:px-4">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground/80">
              <th className="px-3 py-2 font-semibold">{nameLabel}</th>
              <th className="px-3 py-2 font-semibold">Applications</th>
              <th className="px-3 py-2 font-semibold">Offers</th>
              <th className="px-3 py-2 font-semibold">Enrolled</th>
              <th className="px-3 py-2 font-semibold">Rejected</th>
              <th className="px-3 py-2 font-semibold">Conversion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.name}
                className="border-t border-border transition-colors hover:bg-surface-hover"
              >
                <td className="px-3 py-3 font-medium text-foreground">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        paletteFor(row.name)
                      )}
                    >
                      {initials(row.name)}
                    </span>
                    {row.name}
                  </div>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{row.applications}</td>
                <td className="px-3 py-3 text-muted-foreground">{row.offers}</td>
                <td className="px-3 py-3 text-muted-foreground">{row.enrolled}</td>
                <td className="px-3 py-3 text-muted-foreground">{row.rejected}</td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                    {row.conversion}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
