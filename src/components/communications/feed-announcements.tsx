"use client";

import Link from "next/link";
import { useState } from "react";
import { BellRing, ChevronDown, ChevronRight, Megaphone, Pin } from "lucide-react";
import { getAnnouncements, type Announcement } from "@/lib/mock/communications";
import { Pill } from "@/components/performance/perf-ui";
import { cn } from "@/lib/utils";
import { categoryTone } from "./announcement-detail";
import { daysUntil, dueLabel, relativeTime } from "./time";

const COLLAPSED = 3;

const needsAck = (a: Announcement) => a.requiresAck && !a.acknowledgedByMe;

/** Rank what the user should see first: action needed, then unread, pinned, newest. */
function rank(a: Announcement) {
  return (needsAck(a) ? 0 : 4) + (a.readByMe ? 2 : 0) + (a.pinned ? 0 : 1);
}

/** Active announcements for the current user, shown at the top of the news feed. */
export function FeedAnnouncements() {
  const [expanded, setExpanded] = useState(false);
  const items = getAnnouncements()
    .filter((a) => a.status === "Published")
    .sort((a, b) => rank(a) - rank(b) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  if (items.length === 0) return null;

  const actionCount = items.filter(needsAck).length;
  const unreadCount = items.filter((a) => !a.readByMe).length;
  const shown = expanded ? items : items.slice(0, COLLAPSED);

  return (
    <section aria-labelledby="feed-announcements" className="card-shadow overflow-hidden rounded-2xl border border-border bg-surface">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Megaphone className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="feed-announcements" className="text-[15px] font-semibold tracking-tight text-foreground">
            Announcements
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {actionCount > 0 ? `${actionCount} need your acknowledgement` : "You're all caught up"}
            {unreadCount > 0 && ` · ${unreadCount} unread`}
          </p>
        </div>
        <Link
          href="/communications/announcements"
          className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-soft"
        >
          View all
          <ChevronRight className="size-3.5" />
        </Link>
      </header>

      <ul className="divide-y divide-border">
        {shown.map((a) => {
          const action = needsAck(a);
          const urgentDue = action && a.dueDate && daysUntil(a.dueDate) <= 3;
          return (
            <li key={a.id}>
              <Link
                href={`/communications/announcements?id=${a.id}`}
                className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-hover sm:px-5"
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    a.priority === "Urgent" ? "bg-danger" : a.priority === "Important" ? "bg-warning" : a.readByMe ? "bg-border-strong" : "bg-primary"
                  )}
                  aria-label={`${a.priority} priority`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Pill tone={categoryTone[a.category]}>{a.category}</Pill>
                    {a.pinned && <Pin className="size-3 text-primary" aria-label="Pinned" />}
                    {!a.readByMe && <span className="text-[10px] font-bold uppercase tracking-wide text-primary">New</span>}
                    <span className="ml-auto text-[11px] text-muted-foreground">{relativeTime(a.publishedAt)}</span>
                  </span>
                  <span
                    className={cn(
                      "mt-1 block text-sm leading-snug text-foreground group-hover:text-primary",
                      a.readByMe ? "font-medium" : "font-semibold"
                    )}
                  >
                    {a.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {a.author.name} · {a.summary}
                  </span>
                  {action && (
                    <span className={cn("mt-1 flex items-center gap-1 text-[11px] font-semibold sm:hidden", urgentDue ? "text-danger" : "text-warning")}>
                      <BellRing className="size-3" />
                      Acknowledge{a.dueDate ? ` · ${dueLabel(a.dueDate).toLowerCase()}` : ""}
                    </span>
                  )}
                </span>
                {action && (
                  <span
                    className={cn(
                      "mt-5 hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex",
                      urgentDue ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"
                    )}
                  >
                    <BellRing className="size-3" />
                    {a.dueDate ? dueLabel(a.dueDate) : "Acknowledge"}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {items.length > COLLAPSED && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex w-full items-center justify-center gap-1 border-t border-border py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          {expanded ? "Show less" : `Show ${items.length - COLLAPSED} more`}
          <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
        </button>
      )}
    </section>
  );
}
