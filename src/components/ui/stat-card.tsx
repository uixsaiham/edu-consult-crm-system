import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTone = "primary" | "success" | "warning" | "danger" | "teal" | "violet" | "neutral";

const toneClass: Record<StatTone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  teal: "bg-teal-600/10 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  neutral: "bg-surface-muted text-muted-foreground",
};

/** Row of summary cards at the top of a page (2 columns, 4 on wide screens). */
export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>{children}</div>;
}

/** Compact summary card: tinted icon, bold value, label, optional note on the right. */
export function StatCard({
  icon: Icon,
  label,
  value,
  note,
  tone = "primary",
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: StatTone;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", toneClass[tone])}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xl font-bold leading-tight tabular-nums text-foreground">{value}</span>
        <span className="block truncate text-xs text-muted-foreground">{label}</span>
      </span>
      {note !== undefined && note !== null && note !== "" && (
        <span className="max-w-[45%] shrink-0 truncate text-right text-xs font-medium tabular-nums text-muted-foreground">{note}</span>
      )}
    </>
  );
  const className =
    "flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-left card-shadow";
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(className, "transition-colors hover:border-border-strong")}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}
