"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  /** Makes the column sortable. */
  sortValue?: (row: T) => number | string;
  render: (row: T, rank: number) => ReactNode;
  className?: string;
}

type SortState = { key: string; dir: "asc" | "desc" };

/** Sortable table; rows are clickable when `onRowClick` is set. */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  defaultSort,
  minWidth = 880,
  footer,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  defaultSort?: SortState;
  minWidth?: number;
  footer?: ReactNode;
}) {
  const [sort, setSort] = useState<SortState | undefined>(defaultSort);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!sort || !col?.sortValue) return rows;
    const get = col.sortValue;
    return [...rows].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, columns, sort]);

  const toggle = (key: string) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-y border-border bg-surface-muted text-[11px] uppercase tracking-wide text-muted-foreground">
            {columns.map((col, i) => {
              const active = sort?.key === col.key;
              const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    "whitespace-nowrap py-2.5 font-semibold",
                    i === 0 ? "pl-5 pr-3" : i === columns.length - 1 ? "pl-3 pr-5" : "px-3",
                    col.align === "right" && "text-right"
                  )}
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggle(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-foreground",
                        active && "text-foreground",
                        col.align === "right" && "flex-row-reverse"
                      )}
                    >
                      {col.header}
                      <Icon className={cn("size-3", !active && "opacity-50")} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, index) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
              className={cn(
                "border-b border-border last:border-b-0 transition-colors",
                onRowClick && "cursor-pointer hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none"
              )}
            >
              {columns.map((col, i) => (
                <td
                  key={col.key}
                  className={cn(
                    "py-3 align-middle",
                    i === 0 ? "pl-5 pr-3" : i === columns.length - 1 ? "pl-3 pr-5" : "px-3",
                    col.align === "right" && "text-right tabular-nums",
                    col.className
                  )}
                >
                  {col.render(row, index + 1)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-muted-foreground">
            <SearchX className="size-5" />
          </span>
          <p className="text-sm font-medium text-foreground">No results match your filters</p>
          <p className="text-xs text-muted-foreground">Try a different search or reset the filters.</p>
        </div>
      )}
      {footer}
    </div>
  );
}

/** Numeric column cell: bold value with a muted sub-line. */
export function NumCell({ value, sub }: { value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="tabular-nums">
      <div className="font-semibold text-foreground">{value}</div>
      {sub !== undefined && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function RankBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1
      ? "bg-amber-400/20 text-amber-600 dark:text-amber-300"
      : rank === 2
        ? "bg-slate-400/20 text-slate-600 dark:text-slate-300"
        : rank === 3
          ? "bg-orange-400/20 text-orange-700 dark:text-orange-300"
          : "text-muted-foreground";
  return (
    <span className={cn("inline-flex size-6 items-center justify-center rounded-full text-[11px] font-bold tabular-nums", medal)}>
      {rank}
    </span>
  );
}
