"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ListTodo, CalendarClock, CircleAlert, type LucideIcon } from "lucide-react";
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
const maxRows = 5;
const filterClass = (selected: boolean) => cn("rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary", selected ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground hover:bg-surface-hover");
const queues = ["Unassigned", "Follow-up", "Qualified"] as const;
type Queue = (typeof queues)[number];

export function OperationsOverview() {
  const [branch, setBranch] = useState("");
  const [queue, setQueue] = useState<Queue>("Unassigned");
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
  const openApplications = scopedApplications.filter((app) => !["Enrolled", "Rejected", "Withdrawn"].includes(app.stage));
  const deadlines = openApplications.flatMap((app) => (app.deadlines || []).map((deadline) => ({ app, ...deadline, days: daysFromSnapshot(deadline.dueDate) }))).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const deadlineRows = (period: (typeof windows)[number]) => deadlines.filter((row) => period === "Overdue" ? row.days < 0 : row.days >= 0 && row.days <= (period === "Next 7 days" ? 7 : 30));
  const blockers = openApplications.flatMap((app) => (app.blockers || []).map((blocker) => ({ app, ...blocker }))).sort((a, b) => a.since.localeCompare(b.since));
  const visibleDeadlines = deadlineRows(window);
  const visibleBlockers = blockers.filter((row) => row.category === category);

  return (
    <section aria-labelledby="operations-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="operations-heading" className="text-lg font-bold tracking-tight">Where to focus next</h2>
            <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold text-primary">Sample data</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Sample snapshot: 17 Sep 2026 · {scoped.length} leads · {scopedApplications.length} applications · Branch filter applies to all three cards</p>
        </div>
        <div className="w-full sm:w-52">
          <Select aria-label="Operations branch" value={branch} onChange={(event) => setBranch(event.target.value)}>
            <option value="">All branches</option>
            <option value="unassigned">No branch assigned</option>
            {branchOptions.map((name) => <option key={name}>{name}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-3">
        <FocusCard title="Needs attention" subtitle="Open leads, oldest created first" icon={ListTodo}
          filters={queues.map((name) => <button key={name} type="button" aria-pressed={queue === name} onClick={() => setQueue(name)} className={filterClass(queue === name)}>{name} <span className="ml-1 tabular-nums">{queueRows[name].length}</span></button>)}
          filterLabel="Attention queue" total={waiting.length} viewAllHref="/leads" noun="leads"
          empty={`No ${queue.toLowerCase()} leads in this branch.`}>
          {waiting.slice(0, maxRows).map((lead) => <FocusRow key={lead.id} href={`/leads?search=${encodeURIComponent(lead.id)}`} title={lead.name} meta={<>{dateLabel(lead.createdDate)} · {lead.counsellor || "Needs a counsellor"}</>} />)}
        </FocusCard>
        <FocusCard title="Upcoming deadlines" subtitle="Application, deposit, CAS and visa dates" icon={CalendarClock}
          filters={windows.map((period) => <button key={period} type="button" aria-pressed={window === period} onClick={() => setWindow(period)} className={filterClass(window === period)}>{period} <span className="ml-1 tabular-nums">{deadlineRows(period).length}</span></button>)}
          filterLabel="Deadline period" total={visibleDeadlines.length} viewAllHref="/applications" noun="deadlines"
          empty={`No ${window === "Overdue" ? "overdue deadlines" : `deadlines in the ${window.toLowerCase()}`} for this branch.`}>
          {visibleDeadlines.slice(0, maxRows).map((row) => <FocusRow key={`${row.app.id}-${row.type}-${row.dueDate}`} href={`/applications?search=${encodeURIComponent(row.app.id)}`} title={row.app.applicant}
            meta={<>{row.type} · {dateLabel(row.dueDate)} · {row.app.university}</>}
            badge={<span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", row.days < 0 ? "bg-danger-soft text-danger" : row.days <= 3 ? "bg-warning-soft text-warning" : "bg-primary-soft text-primary")}>{row.days < 0 ? `${-row.days}d overdue` : row.days === 0 ? "Today" : `${row.days}d left`}</span>} />)}
        </FocusCard>
        <FocusCard title="Applications blocked" subtitle="Resolve the next step for each student" icon={CircleAlert}
          filters={categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={filterClass(category === item)}>{item} <span className="ml-1 tabular-nums">{blockers.filter((row) => row.category === item).length}</span></button>)}
          filterLabel="Blocker category" total={visibleBlockers.length} viewAllHref="/applications" noun="blockers"
          empty={`No ${category.toLowerCase()} blockers for this branch.`}>
          {visibleBlockers.slice(0, maxRows).map((row) => <FocusRow key={`${row.app.id}-${row.category}-${row.reason}`} href={`/applications?search=${encodeURIComponent(row.app.id)}`} title={row.app.applicant}
            meta={<><span className="font-medium text-warning">{row.reason}</span> · {row.app.counsellor || "Unassigned"}</>}
            badge={<span className="text-[11px] tabular-nums text-muted-foreground" title={`Waiting since ${dateLabel(row.since)}`}>{Math.max(0, -daysFromSnapshot(row.since))}d</span>} />)}
        </FocusCard>
      </div>
    </section>
  );
}

function FocusCard({ title, subtitle, icon, filters, filterLabel, total, viewAllHref, noun, empty, children }: {
  title: string; subtitle: string; icon: LucideIcon; filters: ReactNode; filterLabel: string;
  total: number; viewAllHref: string; noun: string; empty: string; children: ReactNode;
}) {
  return (
    <Card className="flex min-w-0 flex-col">
      <CardHeader title={title} subtitle={subtitle} icon={icon} />
      <div className="flex flex-1 flex-col px-6 pb-4 pt-4">
        <div className="flex flex-wrap gap-1.5" aria-label={filterLabel}>{filters}</div>
        {total === 0
          ? <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-muted-foreground">{empty}</p>
          : <ul className="mt-2 flex-1 divide-y divide-border">{children}</ul>}
        {total > maxRows && (
          <Link href={viewAllHref} className="mt-2 inline-flex items-center gap-1 self-start text-xs font-semibold text-primary hover:underline">
            View all {total} {noun} <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        )}
      </div>
    </Card>
  );
}

function FocusRow({ href, title, meta, badge }: { href: string; title: string; meta: ReactNode; badge?: ReactNode }) {
  return (
    <li>
      <Link href={href} className="group flex items-center gap-3 rounded-lg py-2.5 focus-visible:outline-2 focus-visible:outline-primary">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium group-hover:text-primary">{title}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{meta}</span>
        </span>
        {badge && <span className="shrink-0">{badge}</span>}
      </Link>
    </li>
  );
}
