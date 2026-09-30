"use client";

import type { LucideIcon } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Compact on/off switch for settings rows. */
export function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-primary" : "bg-border-strong")}>
      <span className={cn("absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform", on && "translate-x-4")} />
    </button>
  );
}

/** Round, borderless icon button with a tooltip — row actions in settings lists. */
export function IconButton({ label, icon: Icon, onClick, disabled, tone }: { label: string; icon: LucideIcon; onClick: () => void; disabled?: boolean; tone?: "danger" }) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors disabled:pointer-events-none disabled:opacity-30",
          tone === "danger" ? "hover:bg-danger-soft hover:text-danger" : "hover:bg-surface-hover hover:text-foreground"
        )}
      >
        <Icon className="size-3.5" />
      </button>
    </Tooltip>
  );
}
