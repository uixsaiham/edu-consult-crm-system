"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Download, X } from "lucide-react";
import type { RowSelection } from "@/lib/use-row-selection";
import { cn } from "@/lib/utils";

const boxClass = "size-3.5 cursor-pointer rounded border-border-strong accent-primary align-middle";

/** Row checkbox. Shift-click selects or clears every row back to the last one clicked. */
export function RowCheckbox({ selection, id, label }: { selection: RowSelection; id: string; label: string }) {
  return (
    <input
      type="checkbox"
      checked={selection.isSelected(id)}
      readOnly
      // Keep Shift-click from also highlighting the text between rows.
      onMouseDown={(e) => e.shiftKey && e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        selection.toggle(id, e.shiftKey);
      }}
      className={boxClass}
      aria-label={label}
      title="Shift-click to select a range"
    />
  );
}

/** Header checkbox: selects or clears every row currently shown; shows a dash when some are selected. */
export function HeaderCheckbox({ selection, label = "Select all rows" }: { selection: RowSelection; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = selection.headerState === "some";
  }, [selection.headerState]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={selection.headerState === "all"}
      onChange={selection.toggleAllVisible}
      className={boxClass}
      aria-label={label}
    />
  );
}

/** Row highlight for selected rows. */
export function selectedRowClass(selection: RowSelection, id: string) {
  return selection.isSelected(id) ? "bg-primary-soft hover:bg-primary-soft" : undefined;
}

/**
 * Bar shown while rows are selected: count, bulk actions and Clear.
 * Pass `onExport` to get an "Export CSV" action.
 */
export function SelectionBar({
  selection,
  noun,
  onExport,
  children,
  className,
}: {
  selection: RowSelection;
  noun: [singular: string, plural: string];
  onExport?: () => void;
  children?: ReactNode;
  className?: string;
}) {
  if (selection.count === 0) return null;
  return (
    <div
      role="region"
      aria-label="Selected rows"
      className={cn(
        "animate-fade-in flex flex-wrap items-center gap-2 rounded-2xl border border-primary/25 bg-primary-soft px-4 py-2.5",
        className
      )}
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold tabular-nums text-primary-foreground">
        {selection.count}
      </span>
      <span className="text-xs font-semibold text-foreground">
        {selection.count === 1 ? noun[0] : noun[1]} selected
      </span>
      <span className="hidden text-[11px] text-muted-foreground md:inline">· Shift-click to select a range</span>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {children}
        {onExport && (
          <BarButton onClick={onExport}>
            <Download className="size-3.5" />
            Export CSV
          </BarButton>
        )}
        <BarButton onClick={selection.clear} aria-label="Clear selection">
          <X className="size-3.5" />
          Clear
        </BarButton>
      </div>
    </div>
  );
}

export function BarButton({
  onClick,
  children,
  tone = "default",
  ...rest
}: {
  onClick: () => void;
  children: ReactNode;
  tone?: "default" | "danger";
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border bg-surface px-3 text-xs font-semibold transition-colors",
        tone === "danger"
          ? "border-danger/30 text-danger hover:bg-danger-soft"
          : "border-border text-foreground hover:bg-surface-hover"
      )}
    >
      {children}
    </button>
  );
}
