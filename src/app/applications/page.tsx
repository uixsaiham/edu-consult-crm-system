"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/form-controls";
import { applicationStageStyles, getApplications, type ApplicationRow } from "@/lib/mock/applications";
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

const stages: ApplicationRow["stage"][] = ["New", "Submitted", "Offer Received", "Visa Filed", "Enrolled", "Rejected"];

export default function ApplicationsPage() {
  const applications = getApplications();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("");

  const filtered = useMemo(() => {
    let list = applications;
    if (stageFilter) list = list.filter((a) => a.stage === stageFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.applicant.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.course.toLowerCase().includes(q) ||
          a.university.toLowerCase().includes(q)
      );
    }
    return list;
  }, [applications, search, stageFilter]);

  const total = applications.length;
  const enrolled = applications.filter((a) => a.stage === "Enrolled").length;
  const inProgress = applications.filter((a) => !["Enrolled", "Rejected"].includes(a.stage)).length;
  const offers = applications.filter((a) => a.stage === "Offer Received").length;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Sparkles className="size-3" />
            Applications
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Manage Applications
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Track every application from submission through to enrollment.
          </p>
        </div>

        <Link
          href="/applications/new"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary-hover active:scale-95"
        >
          <Plus className="size-4" />
          New Application
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 card-shadow">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <ClipboardList className="size-4" />
          </span>
          <div className="mt-3">
            <p className="text-2xl font-bold tabular-nums text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground">Total Applications</p>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 card-shadow">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
            <FileText className="size-4" />
          </span>
          <div className="mt-3">
            <p className="text-2xl font-bold tabular-nums text-foreground">{inProgress}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 card-shadow">
          <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <Sparkles className="size-4" />
          </span>
          <div className="mt-3">
            <p className="text-2xl font-bold tabular-nums text-foreground">{offers}</p>
            <p className="text-xs text-muted-foreground">Offers Received</p>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 card-shadow">
          <span className="flex size-8 items-center justify-center rounded-lg bg-success-soft text-success">
            <CheckCircle2 className="size-4" />
          </span>
          <div className="mt-3">
            <p className="text-2xl font-bold tabular-nums text-foreground">{enrolled}</p>
            <p className="text-xs text-muted-foreground">Enrolled</p>
          </div>
        </div>
      </div>

      <Card className="flex flex-col">
        <CardHeader
          icon={ClipboardList}
          title="All Applications"
          subtitle="Search, filter, and open any application"
          action={
            <div className="flex shrink-0 items-center gap-2.5">
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search applicant, course, ID..."
                  className="h-9 w-56 rounded-full border border-border bg-surface pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <div className="w-40">
                <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="text-xs">
                  <option value="">All stages</option>
                  {stages.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          }
        />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead className="border-b border-border/80 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2.5 pl-6 pr-3 font-semibold">Applicant</th>
                <th className="px-3 py-2.5 font-semibold">Course</th>
                <th className="px-3 py-2.5 font-semibold">Branch</th>
                <th className="px-3 py-2.5 font-semibold">Counsellor</th>
                <th className="px-3 py-2.5 font-semibold">Intake</th>
                <th className="px-3 py-2.5 font-semibold">Stage</th>
                <th className="py-2.5 pl-3 pr-6 text-right font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Search className="size-5 text-muted-foreground/60" />
                      <p className="text-xs font-medium">No applications match your criteria</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setStageFilter("");
                        }}
                        className="mt-1 text-xs font-semibold text-primary hover:underline"
                      >
                        Reset filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((app) => {
                  const stage = applicationStageStyles[app.stage];
                  return (
                    <tr key={app.id} className="group transition-colors hover:bg-surface-muted/40">
                      <td className="py-3 pl-6 pr-3 align-middle">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                              paletteFor(app.applicant)
                            )}
                          >
                            {app.initials}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">{app.applicant}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{app.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <p className="text-xs font-medium text-foreground">{app.course}</p>
                        <p className="text-[11px] text-muted-foreground">{app.university}</p>
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap text-xs text-muted-foreground">
                        {app.branch}
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap text-xs text-muted-foreground">
                        {app.counsellor}
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap text-xs text-muted-foreground">
                        {app.intake}
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            stage.bg,
                            stage.text
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", stage.dot)} />
                          {app.stage}
                        </span>
                      </td>
                      <td className="py-3 pl-3 pr-6 align-middle text-right whitespace-nowrap text-[11px] text-muted-foreground">
                        {app.updatedAt}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-1 flex items-center justify-between border-t border-border/70 px-6 py-2.5 text-xs text-muted-foreground">
          <span>
            Showing <strong className="font-semibold text-foreground">{filtered.length}</strong> of{" "}
            <strong className="font-semibold text-foreground">{applications.length}</strong> applications
          </span>
        </div>
      </Card>
    </div>
  );
}
