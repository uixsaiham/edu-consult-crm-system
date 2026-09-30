"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Archive, BellRing, CalendarClock, Eye, EyeOff, Inbox, Megaphone, Paperclip, Pin, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { SlideOver } from "@/components/ui/slide-over";
import { buttonPrimary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { Avatar, Pill } from "@/components/performance/perf-ui";
import { AnnouncementComposer } from "@/components/communications/announcement-composer";
import { AnnouncementDetail, categoryTone, priorityTone } from "@/components/communications/announcement-detail";
import { daysUntil, dueLabel, relativeTime, shortDate } from "@/components/communications/time";
import { announcementCategories, commsNow, getAnnouncements, type Announcement } from "@/lib/mock/communications";
import { cn } from "@/lib/utils";

type Tab = "all" | "action" | "unread" | "outbox" | "inactive" | "archived";

const priorityRank = { Urgent: 0, Important: 1, Normal: 2 } as const;

function tabFor(a: Announcement): Tab {
  if (a.status === "Published") return "all";
  if (a.status === "Inactive") return "inactive";
  if (a.status === "Archived") return "archived";
  return "outbox";
}

function needsAction(a: Announcement) {
  return a.status === "Published" && a.requiresAck && !a.acknowledgedByMe;
}

function AnnouncementsPageInner() {
  const { user } = useUser();
  const [items, setItems] = useState<Announcement[]>(getAnnouncements);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [toast, notify] = useToast();

  const published = items.filter((a) => a.status === "Published");
  const counts = {
    all: published.length,
    action: published.filter(needsAction).length,
    unread: published.filter((a) => !a.readByMe).length,
    outbox: items.filter((a) => a.status === "Scheduled" || a.status === "Draft").length,
    inactive: items.filter((a) => a.status === "Inactive").length,
    archived: items.filter((a) => a.status === "Archived").length,
  };
  const readRate = published.reduce((s, a) => s + a.read, 0) / Math.max(1, published.reduce((s, a) => s + a.recipients, 0));

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "action", label: "Needs my action", count: counts.action },
    { key: "unread", label: "Unread", count: counts.unread },
    { key: "outbox", label: "Scheduled & drafts", count: counts.outbox },
    { key: "inactive", label: "Inactive", count: counts.inactive },
    { key: "archived", label: "Archived", count: counts.archived },
  ];

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((a) => {
        if (tab === "all" && a.status !== "Published") return false;
        if (tab === "action" && !needsAction(a)) return false;
        if (tab === "unread" && (a.status !== "Published" || a.readByMe)) return false;
        if (tab === "outbox" && a.status !== "Scheduled" && a.status !== "Draft") return false;
        if (tab === "inactive" && a.status !== "Inactive") return false;
        if (tab === "archived" && a.status !== "Archived") return false;
        if (category && a.category !== category) return false;
        if (priority && a.priority !== priority) return false;
        return !q || `${a.title} ${a.summary} ${a.author.name}`.toLowerCase().includes(q);
      })
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          (tab === "action" ? priorityRank[a.priority] - priorityRank[b.priority] : 0) ||
          Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
      );
  }, [items, tab, search, category, priority]);

  const selected = list.find((a) => a.id === selectedId) ?? list[0] ?? null;
  const hasFilters = !!(search || category || priority);

  const update = (id: string, patch: Partial<Announcement> | ((a: Announcement) => Partial<Announcement>)) =>
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, ...(typeof patch === "function" ? patch(a) : patch) } : a)));

  const open = (a: Announcement) => {
    setSelectedId(a.id);
    if (!a.readByMe) update(a.id, (x) => ({ readByMe: true, read: x.read + 1 }));
    if (!window.matchMedia("(min-width: 1024px)").matches) setMobileOpen(true);
  };

  // Deep link from the news feed: /communications/announcements?id=ANN-2041
  const openById = (id: string) => {
    const a = items.find((x) => x.id === id);
    if (!a) return;
    setTab(tabFor(a));
    setSearch("");
    setCategory("");
    setPriority("");
    setSelectedId(a.id);
    if (!a.readByMe) update(a.id, (x) => ({ readByMe: true, read: x.read + 1 }));
  };

  const detail = selected && (
    <AnnouncementDetail
      item={selected}
      onNotify={notify}
      onAcknowledge={() => {
        update(selected.id, (x) => ({ acknowledgedByMe: true, acknowledged: x.acknowledged + 1, readByMe: true }));
        notify("Acknowledged — thanks!");
      }}
      onTogglePin={() => {
        update(selected.id, (x) => ({ pinned: !x.pinned }));
        notify(selected.pinned ? "Unpinned" : "Pinned to top");
      }}
      onToggleActive={() => {
        const activating = selected.status === "Inactive";
        update(selected.id, { status: activating ? "Published" : "Inactive", pinned: false });
        // Follow the announcement to the tab it now belongs to, so it stays open.
        setTab(activating ? "all" : "inactive");
        setSelectedId(selected.id);
        notify(activating ? "Announcement is active again" : "Announcement deactivated — hidden from recipients");
      }}
      onToggleArchive={() => {
        const restoring = selected.status === "Archived";
        update(selected.id, { status: restoring ? "Published" : "Archived", pinned: false });
        setTab(restoring ? "all" : "archived");
        setSelectedId(selected.id);
        notify(restoring ? "Announcement restored" : "Announcement archived");
      }}
      onEdit={() => {
        setMobileOpen(false);
        setEditing(selected);
      }}
      onPublish={() => {
        update(selected.id, { status: "Published", publishedAt: commsNow });
        setTab("all");
        notify(`Published to ${selected.recipients} people`);
      }}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Announcements</h2>
          <p className="mt-1 text-sm text-muted-foreground">Official updates from management — policies, deadlines and changes you need to act on.</p>
        </div>
        <button type="button" onClick={() => setComposing(true)} className={cn(buttonPrimary, "self-start sm:self-auto")}>
          <Plus className="size-4" />
          New announcement
        </button>
      </header>

      <StatGrid>
        <StatCard icon={BellRing} tone="danger" label="Needs my acknowledgement" value={counts.action} onClick={() => setTab("action")} />
        <StatCard icon={Inbox} tone="primary" label="Unread" value={counts.unread} onClick={() => setTab("unread")} />
        <StatCard icon={CalendarClock} tone="warning" label="Scheduled & drafts" value={counts.outbox} onClick={() => setTab("outbox")} />
        <StatCard icon={Eye} tone="success" label="Average read rate" value={`${Math.round(readRate * 100)}%`} note={`${counts.all} live`} />
      </StatGrid>

      <div className="flex flex-col gap-3">
        <div role="tablist" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
                tab === t.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              )}
            >
              {t.label}
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                  tab === t.key ? "bg-background/20" : t.key === "action" && t.count ? "bg-danger text-white" : "bg-surface-hover"
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchField value={search} onChange={setSearch} placeholder="Search announcements…" />
          <SelectFilter label="Category" value={category} onChange={setCategory} options={announcementCategories} allLabel="All categories" />
          <SelectFilter label="Priority" value={priority} onChange={setPriority} options={["Urgent", "Important", "Normal"]} allLabel="All priorities" />
          {hasFilters && (
            <ResetFilters
              onClick={() => {
                setSearch("");
                setCategory("");
                setPriority("");
              }}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <ul className="flex flex-col gap-3">
          {list.length === 0 && (
            <li className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <Megaphone className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {tab === "action" ? "You're all caught up" : "No announcements here"}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasFilters ? "Try clearing the filters." : "New announcements will appear here."}
              </p>
            </li>
          )}
          {list.map((a) => (
            <li key={a.id}>
              <AnnouncementRow item={a} active={selected?.id === a.id} onOpen={() => open(a)} />
            </li>
          ))}
        </ul>

        <Card className="sticky top-0 hidden max-h-[calc(100vh-7rem)] overflow-y-auto p-6 lg:block">
          {detail ?? <p className="py-20 text-center text-sm text-muted-foreground">Select an announcement to read it.</p>}
        </Card>
      </div>

      {selected && (
        <SlideOver open={mobileOpen} onClose={() => setMobileOpen(false)} title={selected.category} subtitle={selected.id} icon={Megaphone}>
          {detail}
        </SlideOver>
      )}

      {editing && (
        <AnnouncementComposer
          key={editing.id}
          open
          initial={editing}
          onClose={() => setEditing(null)}
          author={user}
          onSubmit={(a) => {
            setItems((prev) => prev.map((x) => (x.id === a.id ? a : x)));
            setEditing(null);
            setSelectedId(a.id);
            notify(
              a.status === "Scheduled" && editing.status !== "Scheduled"
                ? `Scheduled for ${shortDate(a.publishedAt)}`
                : a.status === "Published" && editing.status !== "Published"
                  ? `Published to ${a.recipients} people`
                  : "Changes saved"
            );
            if (a.status !== editing.status) setTab(tabFor(a));
          }}
        />
      )}

      <AnnouncementComposer
        open={composing}
        onClose={() => setComposing(false)}
        author={user}
        onSubmit={(a) => {
          setItems((prev) => [a, ...prev]);
          setComposing(false);
          setTab(a.status === "Published" ? "all" : "outbox");
          setSelectedId(a.id);
          notify(
            a.status === "Published"
              ? `Published to ${a.recipients} people`
              : a.status === "Scheduled"
                ? `Scheduled for ${shortDate(a.publishedAt)}`
                : "Saved as draft"
          );
        }}
      />
      <Suspense fallback={null}>
        <SelectFromUrl onSelect={openById} />
      </Suspense>
      {toast}
    </div>
  );
}

/** Opens the announcement named in `?id=` once, after the page loads. */
function SelectFromUrl({ onSelect }: { onSelect: (id: string) => void }) {
  const id = useSearchParams().get("id");
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (id && id !== handled.current) {
      handled.current = id;
      onSelect(id);
    }
  }, [id, onSelect]);
  return null;
}

function AnnouncementRow({ item, active, onOpen }: { item: Announcement; active: boolean; onOpen: () => void }) {
  const unread = item.status === "Published" && !item.readByMe;
  const action = needsAction(item);
  const stripe = item.priority === "Urgent" ? "bg-danger" : item.priority === "Important" ? "bg-warning" : "bg-transparent";
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={active}
      className={cn(
        "card-shadow relative flex w-full flex-col gap-2.5 overflow-hidden rounded-2xl border bg-surface p-4 pl-5 text-left transition-colors",
        active ? "border-primary/50 ring-2 ring-primary/15" : "border-border hover:border-border-strong",
        (item.status === "Inactive" || item.status === "Archived") && "opacity-70"
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", stripe)} />
      <div className="flex items-center gap-1.5">
        {unread && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
        <Pill tone={categoryTone[item.category]}>{item.category}</Pill>
        {item.priority !== "Normal" && <Pill tone={priorityTone[item.priority]}>{item.priority}</Pill>}
        {item.pinned && <Pin className="size-3.5 text-primary" aria-label="Pinned" />}
        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
          {item.status === "Scheduled" ? `Sends ${shortDate(item.publishedAt)}` : relativeTime(item.publishedAt)}
        </span>
      </div>
      <div>
        <h3 className={cn("text-sm leading-snug text-foreground", unread ? "font-bold" : "font-semibold")}>{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.summary}</p>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Avatar name={item.author.name} className="size-6 text-[9px]" />
        <span className="truncate">{item.author.name}</span>
        {item.attachments.length > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <Paperclip className="size-3" />
            {item.attachments.length}
          </span>
        )}
        <span className="ml-auto shrink-0">
          {action ? (
            <span className={cn("font-semibold", item.dueDate && daysUntil(item.dueDate) <= 3 ? "text-danger" : "text-warning")}>
              Acknowledge{item.dueDate ? ` · ${dueLabel(item.dueDate).toLowerCase()}` : ""}
            </span>
          ) : item.status === "Inactive" ? (
            <span className="inline-flex items-center gap-1 font-semibold">
              <EyeOff className="size-3" />
              Inactive
            </span>
          ) : item.status === "Archived" ? (
            <span className="inline-flex items-center gap-1 font-semibold">
              <Archive className="size-3" />
              Archived
            </span>
          ) : item.status === "Draft" ? (
            "Draft"
          ) : item.status === "Published" ? (
            `${Math.round((item.read / Math.max(1, item.recipients)) * 100)}% read`
          ) : null}
        </span>
      </div>
    </button>
  );
}

export default function AnnouncementsPage() { return <Suspense><AnnouncementsPageInner /></Suspense>; }
