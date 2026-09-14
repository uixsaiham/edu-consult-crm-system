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
}: {
  title: string;
  subtitle: string;
  rows: PersonPerformance[];
  nameLabel: string;
}) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="overflow-x-auto px-2 pb-2 pt-3 sm:px-3">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">{nameLabel}</th>
              <th className="px-3 py-2 font-medium">Applications</th>
              <th className="px-3 py-2 font-medium">Offers</th>
              <th className="px-3 py-2 font-medium">Enrolled</th>
              <th className="px-3 py-2 font-medium">Rejected</th>
              <th className="px-3 py-2 font-medium">Conversion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.name}
                className="border-t border-border transition-colors hover:bg-surface-hover"
              >
                <td className="px-3 py-2.5 font-medium text-foreground">
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
                <td className="px-3 py-2.5 text-muted-foreground">{row.applications}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{row.offers}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{row.enrolled}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{row.rejected}</td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
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
