"use client";

import { useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { getNotifications, type NotificationItem } from "@/lib/mock/notifications";
import { Tooltip } from "@/components/ui/tooltip";
import { useClickOutside } from "@/lib/use-click-outside";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(getNotifications);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false), open);

  const unreadCount = items.filter((n) => !n.read).length;

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div ref={ref} className="relative">
      <Tooltip label="Notifications" hidden={open}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Notifications"
          aria-expanded={open}
          className="relative flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <Bell className="size-[17px]" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold leading-none text-white ring-2 ring-surface-muted">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </Tooltip>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">You&apos;re all caught up.</p>
            ) : (
              <ul className="divide-y divide-border/70">
                {items.map((n) => {
                  const Icon = n.icon;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted/60",
                          !n.read && "bg-primary-soft/40"
                        )}
                      >
                        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", n.iconBg)}>
                          <Icon className={cn("size-4", n.iconColor)} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-semibold text-foreground">{n.title}</span>
                            {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{n.description}</span>
                          <span className="mt-1 block text-[10px] text-muted-foreground/70">{n.time}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
