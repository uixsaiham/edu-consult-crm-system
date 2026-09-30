"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Settings2 } from "lucide-react";
import Link from "next/link";
import { DropdownChevron } from "@/components/ui/dropdown-chevron";
import { useSettingsStore } from "@/lib/settings/store";
import { leadStatusStore } from "@/lib/settings/lead-statuses";
import { leadStatuses, leadStatusStyles, type LeadStatus } from "@/lib/mock/leads";
import { cn } from "@/lib/utils";

const MENU_WIDTH = 256;
const MENU_MAX_HEIGHT = 360;

/**
 * The status badge in the leads table. Clicking it opens a menu of the six pipeline statuses,
 * each followed by its active detailed statuses from Leads Status settings.
 * The menu is portalled so the table's horizontal scroll container doesn't clip it.
 */
export function LeadStatusMenu({
  status,
  detail,
  leadName,
  onChange,
}: {
  status: LeadStatus;
  detail?: string;
  leadName: string;
  onChange: (status: LeadStatus, detail?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const detailed = useSettingsStore(leadStatusStore);
  const style = leadStatusStyles[status];

  // Place the menu under the badge, or above it when there isn't room below.
  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const r = button.current.getBoundingClientRect();
    const up = window.innerHeight - r.bottom < MENU_MAX_HEIGHT + 16 && r.top > window.innerHeight - r.bottom;
    setPos({ top: up ? r.top - 6 : r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - MENU_WIDTH - 8)), up });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!button.current?.contains(t) && !menu.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        button.current?.focus();
      }
    };
    const onScroll = (e: Event) => {
      if (!menu.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  // Move focus to the current option when the menu opens.
  useEffect(() => {
    if (open && pos) menu.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
  }, [open, pos]);

  const pick = (next: LeadStatus, nextDetail?: string) => {
    setOpen(false);
    if (next !== status || nextDetail !== detail) onChange(next, nextDetail);
  };

  const option = (group: LeadStatus, name?: string) => {
    const selected = status === group && detail === name;
    return (
      <button
        key={`${group}-${name ?? ""}`}
        type="button"
        role="menuitemradio"
        aria-checked={selected}
        onClick={() => pick(group, name)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-left text-xs transition-colors hover:bg-surface-hover focus:bg-surface-hover focus:outline-none",
          name ? "pl-6 text-foreground" : "pl-2 font-semibold text-foreground",
          selected && "bg-primary-soft/60"
        )}
      >
        {!name && <span className={cn("size-2 shrink-0 rounded-full", leadStatusStyles[group].dot)} />}
        <span className="min-w-0 flex-1 truncate">{name ?? group}</span>
        {selected && <Check className="size-3.5 shrink-0 text-primary" />}
      </button>
    );
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Status of ${leadName}: ${status}${detail ? `, ${detail}` : ""}. Change status`}
        onClick={() => setOpen((v) => !v)}
        className="group flex max-w-44 flex-col items-start text-left"
      >
        <span className={cn("inline-flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-1.5 text-[11px] font-semibold transition-shadow group-hover:ring-2 group-hover:ring-border-strong/70", style.bg, style.text)}>
          <span className={cn("size-1.5 rounded-full", style.dot)} />
          {status}
          <DropdownChevron open={open} />
        </span>
        {detail && <span className="mt-1 block w-full truncate pl-1 text-[11px] text-muted-foreground" title={detail}>{detail}</span>}
      </button>

      {open && pos && createPortal(
        <div
          ref={menu}
          role="menu"
          aria-label={`Change status of ${leadName}`}
          style={{ top: pos.top, left: pos.left, width: MENU_WIDTH, maxHeight: MENU_MAX_HEIGHT, transform: pos.up ? "translateY(-100%)" : undefined }}
          className="fixed z-[70] flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl animate-fade-in"
        >
          <div className="flex-1 overflow-y-auto p-1">
            {leadStatuses.map((group) => (
              <div key={group} className="border-b border-border/60 py-0.5 last:border-0">
                {option(group)}
                {detailed.filter((s) => s.group === group && (s.active || (status === group && detail === s.name))).map((s) => option(group, s.name))}
              </div>
            ))}
          </div>
          <Link href="/leads/statuses" className="flex items-center gap-1.5 border-t border-border px-3 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground">
            <Settings2 className="size-3.5" /> Manage lead statuses
          </Link>
        </div>,
        document.body
      )}
    </>
  );
}
