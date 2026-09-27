import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The arrow for every custom dropdown trigger. Same size (14px) and colour as
 * the arrow native <select>s get from globals.css, so all dropdowns match.
 * Give the trigger slightly less padding on the right than the left (e.g.
 * `pl-3 pr-2.5`): the glyph has its own side bearing.
 */
export function DropdownChevron({ open, className }: { open?: boolean; className?: string }) {
  return <ChevronDown aria-hidden className={cn("size-3.5 shrink-0 opacity-60 transition-transform", open && "rotate-180", className)} />;
}
