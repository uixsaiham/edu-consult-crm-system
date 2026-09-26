"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const GAP = 6;
const EDGE = 8;

/**
 * Button + dropdown. The panel is rendered in a portal on <body>, so it always
 * sits above sticky table cells and is never clipped by a scrolling container.
 * It opens below the button, or above it when there is not enough room, and
 * follows the button while the page scrolls.
 */
export function AnchoredMenu({
  trigger,
  children,
  align = "start",
  width = 208,
  label,
  triggerClassName,
}: {
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  width?: number;
  label: string;
  triggerClassName?: string;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const close = useCallback(() => {
    setOpen(false);
    setPos(null);
  }, []);

  const place = useCallback(() => {
    const r = button.current?.getBoundingClientRect();
    if (!r) return;
    const height = panel.current?.offsetHeight ?? 0;
    const below = window.innerHeight - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    const up = height > below && above > below;
    const left = align === "end" ? r.right - width : r.left;
    setPos({
      top: up ? Math.max(EDGE, r.top - GAP - height) : r.bottom + GAP,
      left: Math.max(EDGE, Math.min(left, window.innerWidth - width - EDGE)),
    });
  }, [align, width]);

  // Measure the rendered panel, then place it.
  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!button.current?.contains(t) && !panel.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, close, place]);

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            role="menu"
            style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, width, visibility: pos ? "visible" : "hidden" }}
            className="card-shadow animate-fade-in fixed z-[70] max-h-80 overflow-y-auto rounded-xl border border-border bg-surface p-1 text-left"
          >
            {children(close)}
          </div>,
          document.body
        )}
    </>
  );
}

export function MenuItem({
  onClick,
  children,
  icon: Icon,
  selected,
  tone = "default",
}: {
  onClick: () => void;
  children: ReactNode;
  icon?: typeof Check;
  selected?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors",
        tone === "danger" ? "text-danger hover:bg-danger-soft" : "text-foreground hover:bg-surface-hover"
      )}
    >
      {Icon && <Icon className={cn("size-3.5 shrink-0", tone === "danger" ? "text-danger" : "text-muted-foreground")} />}
      <span className="min-w-0 flex-1">{children}</span>
      {selected && <Check className="size-3.5 shrink-0 text-primary" />}
    </button>
  );
}

export function MenuDivider() {
  return <div className="my-1 h-px bg-border" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>;
}
