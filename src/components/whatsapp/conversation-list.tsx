"use client";

import { Search, X } from "lucide-react";
import {
  conversationStatuses,
  conversationStatusStyles,
  lastMessageOf,
  type Conversation,
  type ConversationStatus,
} from "@/lib/mock/whatsapp";
import { cn } from "@/lib/utils";

const avatarPalette = [
  "bg-primary-soft text-primary",
  "bg-accent-soft text-accent",
  "bg-warning-soft text-warning",
  "bg-success-soft text-success",
  "bg-danger-soft text-danger",
];

function paletteFor(name: string) {
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return avatarPalette[hash % avatarPalette.length];
}

function formatListTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: ConversationStatus | "";
  onStatusFilterChange: (v: ConversationStatus | "") => void;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="shrink-0 border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="h-9 w-full rounded-full border border-border bg-surface-muted pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onStatusFilterChange("")}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
              statusFilter === "" ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {conversationStatuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onStatusFilterChange(statusFilter === s ? "" : s)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <li className="flex flex-col items-center justify-center gap-1.5 px-4 py-16 text-center">
            <Search className="size-5 text-muted-foreground/60" />
            <p className="text-xs font-medium text-muted-foreground">No conversations match</p>
          </li>
        ) : (
          conversations.map((c) => {
            const last = lastMessageOf(c);
            const active = c.id === selectedId;
            const status = conversationStatusStyles[c.status];
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 border-b border-border/60 px-3.5 py-3 text-left transition-colors",
                    active ? "bg-primary-soft" : "hover:bg-surface-muted/60"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      paletteFor(c.contactName)
                    )}
                  >
                    {c.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-xs font-semibold", active ? "text-primary" : "text-foreground")}>
                        {c.contactName}
                      </span>
                      {last && (
                        <span className="shrink-0 text-[10px] text-muted-foreground/70">{formatListTime(last.time)}</span>
                      )}
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-muted-foreground">
                        {last?.direction === "out" && <span className="text-muted-foreground/60">You: </span>}
                        {last?.text ?? "No messages yet"}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-success text-[9px] font-bold text-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                      <span className={cn("size-1.5 rounded-full", status.dot)} />
                      <span className={status.text}>{c.status}</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
