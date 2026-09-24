"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowRightLeft,
  Clock,
  Download,
  FileText,
  Search,
  X,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { getRecentActivity } from "@/lib/mock/dashboard";
import { cn } from "@/lib/utils";

type ActivityFilter = "all" | "status-change" | "note-create";

const statusColors: Record<string, string> = {
  New: "bg-sky-700/10 text-sky-700 border-sky-200/60 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
  Hot: "bg-amber-700/10 text-amber-700 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  "Future Intake": "bg-purple-700/10 text-purple-700 border-purple-200/60 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
  Unreachable: "bg-rose-700/10 text-rose-700 border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  "No Response": "bg-slate-700/10 text-slate-700 border-slate-200/60 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  "Not Potential": "bg-rose-700/10 text-rose-700 border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  "Not Interested": "bg-red-700/10 text-red-700 border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
};

const filterClass = (selected: boolean) =>
  cn(
    "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary",
    selected ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
  );

const defaultStatusColor = "bg-surface-muted text-muted-foreground border-border";

const avatarPalette = [
  "bg-primary-soft text-primary",
  "bg-accent-soft text-accent",
  "bg-warning-soft text-warning",
  "bg-success-soft text-success",
  "bg-danger-soft text-danger",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function paletteFor(name: string) {
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return avatarPalette[hash % avatarPalette.length];
}

function cleanNoteText(text: string) {
  const cleaned = text.replace(/^Note Data Create of this Application:\s*/i, "").trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : text;
}

export function RecentActivity() {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const activities = getRecentActivity();

  const statusChangesCount = useMemo(
    () => activities.filter((a) => a.type === "status-change").length,
    [activities]
  );
  const notesCount = useMemo(
    () => activities.filter((a) => a.type === "note-create").length,
    [activities]
  );

  const filteredItems = useMemo(() => {
    let list = activities;
    if (filter !== "all") {
      list = list.filter((a) => a.type === filter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.targetId.toLowerCase().includes(q) ||
          a.actor.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          (a.fromStatus && a.fromStatus.toLowerCase().includes(q)) ||
          (a.toStatus && a.toStatus.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activities, filter, searchQuery]);

  const handleDownloadCSV = () => {
    const headers = ["Activity", "Lead ID", "From Status", "To Status", "Details", "Counsellor", "Time"];
    const rows = filteredItems.map((item) => [
      `"${item.type === "status-change" ? "Lead Status Change" : "Note Create"}"`,
      `"${item.targetId}"`,
      `"${item.fromStatus || ""}"`,
      `"${item.toStatus || ""}"`,
      `"${cleanNoteText(item.description).replace(/"/g, '""')}"`,
      `"${item.actor}"`,
      `"${item.time}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `bhe_recent_activities_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        icon={Activity}
        title="Recent activity"
        subtitle="Lead status changes and counsellor notes"
        action={
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCSV}
              title="Download Activity CSV"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-surface-hover hover:border-border-strong active:scale-95 shadow-xs whitespace-nowrap"
            >
              <Download className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Download CSV</span>
            </button>
          </div>
        }
      />

      {/* Filter & search */}
      <div className="flex flex-col gap-3 px-6 pb-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Activity type" className="inline-flex max-w-full gap-0.5 self-start overflow-x-auto rounded-full bg-surface-muted p-0.5">
          <button
            type="button"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
            className={filterClass(filter === "all")}
          >
            All
            <span className={cn("tabular-nums", filter === "all" ? "text-primary" : "text-muted-foreground/80")}>{activities.length}</span>
          </button>
          <button
            type="button"
            aria-pressed={filter === "status-change"}
            onClick={() => setFilter("status-change")}
            className={filterClass(filter === "status-change")}
          >
            Status changes
            <span className={cn("tabular-nums", filter === "status-change" ? "text-primary" : "text-muted-foreground/80")}>{statusChangesCount}</span>
          </button>
          <button
            type="button"
            aria-pressed={filter === "note-create"}
            onClick={() => setFilter("note-create")}
            className={filterClass(filter === "note-create")}
          >
            Notes
            <span className={cn("tabular-nums", filter === "note-create" ? "text-primary" : "text-muted-foreground/80")}>{notesCount}</span>
          </button>
        </div>

        <div className="relative flex w-full items-center sm:w-52">
          <Search className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground" />
          <input
            type="search"
            aria-label="Search activity"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ID, note, counsellor"
            className="h-8 w-full rounded-full border border-border bg-surface pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Polished Table Structure with Sticky Header & Smooth Scroll */}
      <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-border bg-surface text-muted-foreground">
            <tr>
              <th className="py-2 pl-6 pr-3 font-medium">Activity</th>
              <th className="px-3 py-2 font-medium">Lead</th>
              <th className="px-3 py-2 font-medium">Update</th>
              <th className="px-3 py-2 font-medium">Counsellor</th>
              <th className="py-2 pl-3 pr-6 text-right font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Search className="size-5 text-muted-foreground/60" />
                    <p className="text-xs font-medium">No activity records match your criteria</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFilter("all");
                        setSearchQuery("");
                      }}
                      className="mt-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Reset filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isStatusChange = item.type === "status-change";

                return (
                  <tr
                    key={item.id}
                    className="group transition-colors hover:bg-surface-muted/40"
                  >
                    {/* Activity Type Badge */}
                    <td className="py-3 pl-6 pr-3 align-middle whitespace-nowrap">
                      {isStatusChange ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/60 bg-indigo-700/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                          <ArrowRightLeft className="size-3 shrink-0" />
                          <span>Lead Status Change</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/60 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                          <FileText className="size-3 shrink-0" />
                          <span>Note Create</span>
                        </span>
                      )}
                    </td>

                    {/* Target Application ID */}
                    <td className="px-3 py-3 align-middle whitespace-nowrap">
                      <span className="inline-flex items-center font-mono text-[11px] font-semibold text-primary bg-primary-soft/60 px-2.5 py-1 rounded-md border border-primary/20">
                        {item.targetId}
                      </span>
                    </td>

                    {/* Update Details */}
                    <td className="px-3 py-3 align-middle min-w-[240px]">
                      {isStatusChange && item.fromStatus && item.toStatus ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              From
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                                statusColors[item.fromStatus] || defaultStatusColor
                              )}
                            >
                              {item.fromStatus}
                            </span>
                            <ArrowRight className="size-3 text-muted-foreground/60 shrink-0" />
                            <span className="text-[11px] font-medium text-muted-foreground">
                              To
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                                statusColors[item.toStatus] || defaultStatusColor
                              )}
                            >
                              {item.toStatus}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              {item.description}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs font-medium text-foreground leading-snug">
                            {cleanNoteText(item.description)}
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            Counsellor documented verification note
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Counsellor / Actor */}
                    <td className="px-3 py-3 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold shadow-2xs",
                            paletteFor(item.actor)
                          )}
                        >
                          {getInitials(item.actor)}
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          {item.actor}
                        </span>
                      </div>
                    </td>

                    {/* Time */}
                    <td className="py-3 pl-3 pr-6 align-middle text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <Clock className="size-3 text-muted-foreground/60 shrink-0" />
                        <span>{item.time}</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="flex items-center justify-between border-t border-border/70 px-6 py-2.5 text-xs text-muted-foreground bg-surface-muted/20">
        <span>
          Total updates: <strong className="font-semibold text-foreground">{filteredItems.length}</strong> logged
        </span>
        <span className="text-[11px] text-muted-foreground">
          Real-time CRM Audit Trail
        </span>
      </div>
    </Card>
  );
}
