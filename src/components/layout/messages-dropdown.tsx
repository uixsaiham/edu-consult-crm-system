"use client";

import { useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { getConversations, type ConversationItem } from "@/lib/mock/notifications";
import { Tooltip } from "@/components/ui/tooltip";
import { useClickOutside } from "@/lib/use-click-outside";
import { cn } from "@/lib/utils";

export function MessagesDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ConversationItem[]>(getConversations);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false), open);

  const unreadCount = items.filter((c) => c.unread).length;

  function markRead(id: string) {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, unread: false } : c)));
  }

  return (
    <div ref={ref} className="relative">
      <Tooltip label="Messages" hidden={open}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Messages"
          aria-expanded={open}
          className="relative flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <MessageCircle className="size-[17px]" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground ring-2 ring-surface-muted">
              {unreadCount}
            </span>
          )}
        </button>
      </Tooltip>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl animate-fade-in">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Messages</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">No conversations yet.</p>
            ) : (
              <ul className="divide-y divide-border/70">
                {items.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => markRead(c.id)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted/60",
                        c.unread && "bg-primary-soft/40"
                      )}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
                        {c.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-foreground">{c.name}</span>
                          <span className="shrink-0 text-[10px] text-muted-foreground/70">{c.time}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{c.lastMessage}</span>
                      </span>
                      {c.unread && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
