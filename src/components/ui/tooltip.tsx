import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Small label shown below an icon button on hover or keyboard focus.
 * Pass `hidden` while the button's own menu is open so the two don't overlap.
 * The trigger should carry its own aria-label; the tooltip is visual only.
 */
export function Tooltip({
  label,
  hidden = false,
  align = "center",
  children,
}: {
  label: string;
  hidden?: boolean;
  align?: "center" | "end";
  children: ReactNode;
}) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      {!hidden && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-full z-40 mt-2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background opacity-0 shadow-md transition-opacity delay-150",
            "group-hover/tooltip:opacity-100 group-has-[:focus-visible]/tooltip:opacity-100",
            align === "center" ? "left-1/2 -translate-x-1/2" : "right-0"
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
