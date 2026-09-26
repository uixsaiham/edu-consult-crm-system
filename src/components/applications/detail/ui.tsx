import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** "12 Mar 2001" in UTC, or "" for an empty value. */
export function fmtDate(value: string) {
  if (!value) return "";
  return new Date(value.length === 10 ? `${value}T00:00:00Z` : value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function Panel({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card-shadow rounded-3xl border border-border bg-surface">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

export function Group({ title, icon: Icon, children, className }: { title: string; icon?: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {title}
      </h3>
      {children}
    </div>
  );
}

export function InfoGrid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2",
        cols === 3 && "xl:grid-cols-3",
        cols === 4 && "lg:grid-cols-3 xl:grid-cols-4"
      )}
    >
      {children}
    </dl>
  );
}

export function Info({ label, value, hint, children }: { label: string; value?: string; hint?: ReactNode; children?: ReactNode }) {
  const empty = !children && !value;
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 break-words text-sm", empty ? "text-muted-foreground/70" : "font-medium text-foreground")}>
        {children ?? (value || "Not provided")}
        {hint && <span className="ml-1.5 align-middle">{hint}</span>}
      </dd>
    </div>
  );
}

export function Tag({ children, tone = "muted", className }: { children: ReactNode; tone?: "muted" | "primary" | "success" | "warning" | "danger" | "violet"; className?: string }) {
  const tones = {
    muted: "bg-surface-hover text-muted-foreground",
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  };
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", tones[tone], className)}>{children}</span>;
}

export function Empty({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {body && <p className="max-w-sm text-xs text-muted-foreground">{body}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export const smallButton =
  "inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary disabled:pointer-events-none disabled:opacity-50";
export const smallPrimary =
  "inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50";
