"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, ArrowRight, CalendarRange, Download, FileText, RotateCcw, ShieldCheck, Trash2, UserCog, Users2, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { buttonSecondary } from "@/components/ui/button-styles";
import { formatDay } from "@/components/people/people-ui";
import { ArchiveNav } from "@/components/archive/archive-ui";
import { archiveKinds, archiveSummary, getArchiveEvents, type ArchiveEvent, type ArchiveKind } from "@/lib/mock/archive";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const kindIcon: Record<ArchiveKind, LucideIcon> = { leads: Users2, applications: FileText, "agent-applications": UserCog };
const kindTone: Record<ArchiveKind, string> = {
  leads: "bg-primary-soft text-primary",
  applications: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "agent-applications": "bg-teal-600/10 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
};
const actionStyle: Record<ArchiveEvent["action"], { icon: LucideIcon; cls: string }> = {
  Archived: { icon: Archive, cls: "bg-surface-hover text-muted-foreground" },
  Restored: { icon: RotateCcw, cls: "bg-success-soft text-success" },
  "Deleted permanently": { icon: Trash2, cls: "bg-danger-soft text-danger" },
  "Reason updated": { icon: Archive, cls: "bg-primary-soft text-primary" },
};

export default function ArchiveOverviewPage() {
  const [summary] = useState(archiveSummary);
  const [events] = useState(getArchiveEvents);
  const [kind, setKind] = useState<ArchiveKind | "">("");
  const shown = useMemo(() => events.filter((e) => !kind || e.kind === kind).slice(0, 12), [events, kind]);

  const total = summary.reduce((n, s) => n + s.total, 0);
  const last30 = summary.reduce((n, s) => n + s.last30, 0);
  const due = summary.reduce((n, s) => n + s.due, 0);
  const soon = summary.reduce((n, s) => n + s.soon, 0);

  const exportLog = () =>
    downloadCsv("archive-audit-log.csv", events.map((e) => ({ date: e.at, section: archiveKinds[e.kind].label, action: e.action, records: e.names.join("; "), count: e.names.length, by: e.by })));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Archive</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Closed leads, student applications and partner applications, kept out of the working lists but never lost. Restore anything in one click; records past their retention date can be deleted for good.</p>
        </div>
        <button type="button" onClick={exportLog} className={buttonSecondary}><Download className="size-4" /> Export audit log</button>
      </header>

      <ArchiveNav />

      <StatGrid>
        <StatCard icon={Archive} label="Archived records" value={total} />
        <StatCard icon={CalendarRange} tone="violet" label="Archived in last 30 days" value={last30} />
        <StatCard icon={Trash2} tone={due ? "danger" : "success"} label="Due for deletion" value={due} note="past retention" />
        <StatCard icon={ShieldCheck} tone={soon ? "warning" : "teal"} label="Due within 90 days" value={soon} />
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summary.map((s) => {
          const def = archiveKinds[s.kind];
          const Icon = kindIcon[s.kind];
          return (
            <Link key={s.kind} href={def.href} className="card-shadow group flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 transition-colors hover:border-border-strong">
              <div className="flex items-start justify-between gap-3">
                <span className={cn("flex size-10 items-center justify-center rounded-2xl", kindTone[s.kind])}><Icon className="size-5" /></span>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{def.label}</p>
                <p className="mt-0.5 text-3xl font-bold tabular-nums tracking-tight text-foreground">{s.total}</p>
              </div>
              <dl className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <div><dt className="text-[10px] text-muted-foreground">Last 30 days</dt><dd className="text-sm font-semibold tabular-nums text-foreground">{s.last30}</dd></div>
                <div><dt className="text-[10px] text-muted-foreground">Due soon</dt><dd className={cn("text-sm font-semibold tabular-nums", s.soon ? "text-warning" : "text-foreground")}>{s.soon}</dd></div>
                <div><dt className="text-[10px] text-muted-foreground">Due now</dt><dd className={cn("text-sm font-semibold tabular-nums", s.due ? "text-danger" : "text-foreground")}>{s.due}</dd></div>
              </dl>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{def.policy}</p>
            </Link>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Recent activity</h3>
            <p className="text-xs text-muted-foreground">Every archive, restore and permanent delete, newest first.</p>
          </div>
          <div role="tablist" aria-label="Filter activity" className="inline-flex flex-wrap gap-0.5 rounded-full border border-border bg-surface-muted p-0.5">
            {([["", "All"], ["leads", "Leads"], ["applications", "Applications"], ["agent-applications", "Agent applications"]] as const).map(([v, label]) => (
              <button key={v} type="button" role="tab" aria-selected={kind === v} onClick={() => setKind(v)} className={cn("h-7 rounded-full px-3 text-xs font-semibold transition-colors", kind === v ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}>{label}</button>
            ))}
          </div>
        </div>
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {shown.map((e) => {
            const a = actionStyle[e.action];
            return (
              <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", a.cls)}><a.icon className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    <span className="font-semibold">{e.action}</span> {e.names.length === 1 ? e.names[0] : `${e.names.length} ${archiveKinds[e.kind].singular}s`}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{archiveKinds[e.kind].label} · {e.by}{e.names.length > 1 ? ` · ${e.names.slice(0, 3).join(", ")}${e.names.length > 3 ? "…" : ""}` : ""}</p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatDay(e.at)}</span>
              </li>
            );
          })}
          {!shown.length && <li className="px-5 py-10 text-center text-xs text-muted-foreground">No archive activity yet.</li>}
        </ul>
      </Card>
    </div>
  );
}
