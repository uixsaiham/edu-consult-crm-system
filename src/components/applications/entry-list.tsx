"use client";

import { Trash2, type LucideIcon } from "lucide-react";

interface EntryMeta {
  label: string;
  value: string;
}

export function EntryList<T extends { id: string }>({
  items,
  onRemove,
  emptyIcon: EmptyIcon,
  emptyText,
  renderItem,
}: {
  items: T[];
  onRemove: (id: string) => void;
  emptyIcon: LucideIcon;
  emptyText: string;
  renderItem: (item: T) => { title: string; subtitle?: string; meta?: EntryMeta[]; icon?: LucideIcon };
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface-muted/50 px-6 py-10 text-center">
        <EmptyIcon className="size-7 text-muted-foreground/60" />
        <p className="text-sm font-medium text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => {
        const { title, subtitle, meta, icon: ItemIcon } = renderItem(item);
        return (
          <div
            key={item.id}
            className="group flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-3.5 transition-colors hover:border-border-strong hover:bg-surface-hover"
          >
            <div className="flex min-w-0 gap-3">
              {ItemIcon && (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <ItemIcon className="size-4" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
                {meta && meta.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {meta.map((m) => (
                      <span
                        key={m.label}
                        className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {m.label}: <span className="text-foreground">{m.value}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label="Remove"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-70 transition-all hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
