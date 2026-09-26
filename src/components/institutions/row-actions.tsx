"use client";

import Link from "next/link";
import { Eye, EyeOff, Globe, PencilLine } from "lucide-react";
import { cn } from "@/lib/utils";

/** Slim switch with a text state beside it: [●━] Active */
export function StatusSwitch({
  checked,
  onChange,
  ariaLabel,
  showLabel = true,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
  showLabel?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      title={checked ? "Active — click to deactivate" : "Inactive — click to activate"}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-2 rounded-full py-1 pr-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span
        className={cn(
          "relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors duration-200",
          checked ? "bg-primary" : "bg-border-strong"
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 size-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked && "translate-x-3.5"
          )}
        />
      </span>
      {showLabel && (
        <span className={cn("text-xs font-medium", checked ? "text-foreground" : "text-muted-foreground")}>
          {checked ? "Active" : "Inactive"}
        </span>
      )}
    </button>
  );
}

/** Chip that publishes / hides an institution's courses on the public website. */
export function WebsiteToggle({
  live,
  onChange,
  disabled,
  ariaLabel,
}: {
  live: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={live}
      aria-label={ariaLabel}
      disabled={disabled}
      title={
        disabled
          ? "Activate the institution to publish its courses"
          : live
            ? "Courses are live on the website — click to hide"
            : "Courses are hidden — click to publish"
      }
      onClick={() => onChange(!live)}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50",
        live
          ? "border-success/30 bg-success-soft text-success hover:border-success/60"
          : "border-dashed border-border-strong bg-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground"
      )}
    >
      {live ? (
        <>
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-success" />
          </span>
          <Globe className="size-3.5" />
          Live
        </>
      ) : (
        <>
          <EyeOff className="size-3.5" />
          Hidden
        </>
      )}
    </button>
  );
}

/** View + Edit joined into one quiet button group. */
export function RowActions({ onView, editHref, name, editLabel = "Edit institution" }: { onView: () => void; editHref: string; name: string; editLabel?: string }) {
  const item =
    "flex size-8 items-center justify-center text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:bg-primary-soft focus-visible:text-primary focus-visible:outline-none";
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-border bg-surface shadow-xs divide-x divide-border">
      <button type="button" onClick={onView} aria-label={`View ${name}`} title="View details" className={item}>
        <Eye className="size-4" />
      </button>
      <Link href={editHref} aria-label={`Edit ${name}`} title={editLabel} className={item}>
        <PencilLine className="size-4" />
      </Link>
    </div>
  );
}
