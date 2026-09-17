"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ListTodo, CalendarClock, CircleAlert } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/form-controls";
import { getLeads } from "@/lib/mock/leads";
import { getApplications, operationsSnapshotDate } from "@/lib/mock/applications";
import { cn } from "@/lib/utils";

const leads = getLeads();
const applications = getApplications();
const branchOptions = [...new Set([...leads, ...applications].map((row) => row.branch).filter(Boolean))].sort();
const windows = ["Overdue", "Next 7 days", "Next 30 days"] as const;
const categories = ["Documents", "Payment", "University response"] as const;
function daysFromSnapshot(date: string) {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${operationsSnapshotDate}T00:00:00Z`)) / 86400000);
}
function dateLabel(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}
const filterClass = (selected: boolean) => cn("rounded-full px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary", selected ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground hover:bg-surface-hover");
const queues = ["Unassigned", "Follow-up", "Qualified"] as const;
type Queue = (typeof queues)[number];

export function OperationsOverview() {
  const [branch, setBranch] = useState("");
  const [queue, setQueue] = useState<Queue>("Unassigned");
  const [showAll, setShowAll] = useState(false);
  const scoped = leads.filter((lead) => !branch || (branch === "unassigned" ? !lead.branch : lead.branch === branch));
  const active = scoped.filter((lead) => lead.status !== "Converted" && lead.status !== "Lost");
  const queueRows = {
    Unassigned: active.filter((lead) => !lead.counsellor),
    "Follow-up": active.filter((lead) => lead.status === "Follow-up"),
    Qualified: active.filter((lead) => lead.status === "Qualified"),
  };
  const waiting = [...queueRows[queue]].sort((a, b) => a.createdDate.localeCompare(b.createdDate));
  const [window, setWindow] = useState<(typeof windows)[number]>("Next 7 days");
  const [category, setCategory] = useState<(typeof categories)[number]>("Documents");
  const scopedApplications = applications.filter((app) => !branch || (branch === "unassigned" ? !app.branch : app.branch === branch));
  const openApplications = scopedApplications.filter((app) => app.stage !== "Enrolled" && app.stage !== "Rejected");
  const deadlines = openApplications.flatMap((app) => (app.deadlines || []).map((deadline) => ({ app, ...deadline, days: daysFromSnapshot(deadline.dueDate) }))).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const deadlineRows = (period: (typeof windows)[number]) => deadlines.filter((row) => period === "Overdue" ? row.days < 0 : row.days >= 0 && row.days <= (period === "Next 7 days" ? 7 : 30));
  const blockers = openApplications.flatMap((app) => (app.blockers || []).map((blocker) => ({ app, ...blocker }))).sort((a, b) => a.since.localeCompare(b.since));
  const visibleDeadlines = deadlineRows(window);
  const visibleBlockers = blockers.filter((row) => row.category === category);

  return (
    <section aria-labelledby="operations-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="operations-heading" className="text-lg font-bold tracking-tight">Where to focus next</h2>
            <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold text-primary">Sample data</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Sample snapshot: 17 Sep 2026 · {scoped.length} leads · {scopedApplications.length} applications · Branch filter applies to all three cards</p>
        </div>
        <div className="w-full sm:w-52">
          <Select aria-label="Operations branch" value={branch} onChange={(event) => { setBranch(event.target.value); setShowAll(false); }}>
            <option value="">All branches</option>
            <option value="unassigned">No branch assigned</option>
            {branchOptions.map((name) => <option key={name}>{name}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Needs attention" subtitle="Open leads, oldest created first" icon={ListTodo} />
          <div className="px-6 pb-5 pt-4">
            <div className="flex flex-wrap gap-2" aria-label="Attention queue">
              {queues.map((name) => <button key={name} type="button" aria-pressed={queue === name} onClick={() => { setQueue(name); setShowAll(false); }} className={cn("rounded-full px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary", queue === name ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground hover:bg-surface-hover")}>{name} <span className="ml-1 tabular-nums">{queueRows[name].length}</span></button>)}
            </div>
            <ul className="mt-3 divide-y divide-border">
              {waiting.slice(0, showAll ? waiting.length : 4).map((lead) => <li key={lead.id}>
                <Link href={`/leads?search=${encodeURIComponent(lead.id)}`} className="group flex items-center gap-2 rounded-lg py-3 focus-visible:outline-2 focus-visible:outline-primary">
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium group-hover:text-primary">{lead.name}</span><span className="mt-0.5 block text-xs text-muted-foreground">{lead.createdDate} · {lead.counsellor || "Needs a counsellor"}</span></span>
                  <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                </Link>
              </li>)}
            </ul>
            {waiting.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No {queue.toLowerCase()} leads in this branch.</p>}
            {waiting.length > 4 && <button type="button" onClick={() => setShowAll(!showAll)} className="mt-2 text-xs font-semibold text-primary hover:underline">{showAll ? "Show fewer" : `Show all ${waiting.length} leads`}</button>}
          </div>
        </Card>
        <Card className="flex min-w-0 flex-col">
          <CardHeader title="Upcoming deadlines" subtitle="Application, deposit, CAS and visa dates" icon={CalendarClock} />
          <div className="flex flex-1 flex-col px-6 pb-5 pt-4">
            <div className="flex flex-wrap gap-2" aria-label="Deadline period">
              {windows.map((period) => <button key={period} type="button" aria-pressed={window === period} onClick={() => setWindow(period)} className={filterClass(window === period)}>{period} <span className="ml-1 tabular-nums">{deadlineRows(period).length}</span></button>)}
            </div>
            <ul className="mt-3 divide-y divide-border">
              {visibleDeadlines.map((row) => <li key={`${row.app.id}-${row.type}-${row.dueDate}`}>
                <Link href={`/applications?search=${encodeURIComponent(row.app.id)}`} className="group flex items-start gap-3 rounded-lg py-3 focus-visible:outline-2 focus-visible:outline-primary">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium group-hover:text-primary">{row.app.applicant}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{row.app.university}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{row.type} · {dateLabel(row.dueDate)}</span>
                  </span>
                  <span className={cn("shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold", row.days < 0 ? "bg-danger-soft text-danger" : row.days <= 3 ? "bg-warning-soft text-warning" : "bg-primary-soft text-primary")}>{row.days < 0 ? `${-row.days}d overdue` : row.days === 0 ? "Due today" : `${row.days}d left`}</span>
                  <ArrowUpRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>)}
            </ul>
            {visibleDeadlines.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No {window === "Overdue" ? "overdue deadlines" : `deadlines in the ${window.toLowerCase()}`} for this branch.</p>}
            <p className="mt-auto border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">{visibleDeadlines.length} deadlines · Upcoming periods include today. Days remaining use the sample snapshot date.</p>
          </div>
        </Card>
        <Card className="flex min-w-0 flex-col">
          <CardHeader title="Applications blocked" subtitle="Resolve the next step for each student" icon={CircleAlert} />
          <div className="flex flex-1 flex-col px-6 pb-5 pt-4">
            <div className="flex flex-wrap gap-2" aria-label="Blocker category">
              {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={filterClass(category === item)}>{item} <span className="ml-1 tabular-nums">{blockers.filter((row) => row.category === item).length}</span></button>)}
            </div>
            <ul className="mt-3 divide-y divide-border">
              {visibleBlockers.map((row) => <li key={`${row.app.id}-${row.category}-${row.reason}`}>
                <Link href={`/applications?search=${encodeURIComponent(row.app.id)}`} className="group flex items-start gap-3 rounded-lg py-3 focus-visible:outline-2 focus-visible:outline-primary">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium group-hover:text-primary">{row.app.applicant}</span>
                    <span className="mt-1 block text-xs font-medium text-warning">{row.reason}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{row.app.stage} · {row.app.counsellor || "Unassigned"}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">Waiting since {dateLabel(row.since)} · {Math.max(0, -daysFromSnapshot(row.since))} days</span>
                  </span>
                  <ArrowUpRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>)}
            </ul>
            {visibleBlockers.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No {category.toLowerCase()} blockers for this branch.</p>}
            <p className="mt-auto border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">{new Set(visibleBlockers.map((row) => row.app.id)).size} blocked applications · Oldest blockers first. Enrolled and rejected applications are excluded.</p>
          </div>
        </Card>
      </div>
    </section>
  );
}
