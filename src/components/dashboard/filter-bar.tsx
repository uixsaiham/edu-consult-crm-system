"use client";

import { useState } from "react";
import {
  Activity,
  Building2,
  Calendar,
  ChevronDown,
  FileText,
  Globe2,
  Landmark,
  Ticket,
  UserRound,
  Users2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

const filters: FilterDef[] = [
  { id: "date", label: "Date Filter", icon: Calendar },
  { id: "branch", label: "Branch", icon: Building2 },
  { id: "counsellor", label: "Counsellor", icon: UserRound },
  { id: "country", label: "Country", icon: Globe2 },
  { id: "university", label: "University", icon: Landmark },
  { id: "status", label: "Status", icon: Activity },
  { id: "intake", label: "Intake", icon: Ticket },
  { id: "agent", label: "Agent", icon: Users2 },
  { id: "application-type", label: "Application Type", icon: FileText },
];

export function FilterBar() {
  const [active, setActive] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = active.has(filter.id);
        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => toggle(filter.id)}
            className={cn(
              "flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {filter.label}
            <ChevronDown className="size-3.5 opacity-70" />
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => setActive(new Set())}
        aria-label="Clear filters"
        className="flex size-8 items-center justify-center rounded-full border border-danger/40 text-danger transition-colors hover:bg-danger-soft"
      >
        <XCircle className="size-4" />
      </button>
    </div>
  );
}
