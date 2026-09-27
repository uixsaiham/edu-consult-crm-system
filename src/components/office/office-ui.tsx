"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { openState, type Branch } from "@/lib/mock/office";
import { cn } from "@/lib/utils";

/** "● Open · closes 19:00" pill, live in the branch's time zone. */
export function OpenPill({ branch, now }: { branch: Branch; now: number | null }) {
  if (!now) return <span className="inline-flex h-6 w-28 animate-pulse rounded-full bg-surface-hover" />;
  const s = openState(branch, new Date(now));
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
        s.open ? "bg-success-soft text-success" : branch.status === "Open" ? "bg-surface-hover text-muted-foreground" : "bg-warning-soft text-warning"
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.open ? "animate-pulse bg-success" : branch.status === "Open" ? "bg-muted-foreground" : "bg-warning")} />
      {s.label}
    </span>
  );
}

export function EmptyState({ icon: Icon = Search, title, body, action }: { icon?: typeof Search; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border px-6 py-14 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Pill tabs used across the Office pages. */
export function Tabs<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number; dot?: string }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar inline-flex w-fit max-w-full gap-0.5 self-start overflow-x-auto rounded-full border border-border bg-surface-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition-colors", value === o.value ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
        >
          {o.dot && <span className={cn("size-1.5 rounded-full", o.dot)} />}
          {o.label}
          {o.count !== undefined && <span className="rounded-full bg-surface-hover px-1.5 text-[10px] tabular-nums">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
