"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { applicationStageStyles, getApplications, type ApplicationRow } from "@/lib/mock/applications";
import { cn } from "@/lib/utils";
import { buttonPrimary } from "@/components/ui/button-styles";

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
  return <Suspense fallback={<p className="p-6 text-muted-foreground">Loading applications…</p>}><ApplicationsFromDashboard /></Suspense>;
}

function ApplicationsFromDashboard() {
  const params = useSearchParams();
  return <ApplicationsList key={params.toString()} initialSearch={params.get("search") || ""} />;
}

function ApplicationsList({ initialSearch }: { initialSearch: string }) {
  const applications = getApplications();
  const [search, setSearch] = useState(initialSearch);
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
  const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : undefined);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Manage Applications
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Track every application from submission through to enrollment.
          </p>
        </div>

        <Link
          href="/applications/new"
          className={buttonPrimary}
        >
          <Plus className="size-4" />
          New Application
        </Link>
      </div>

      <StatGrid>
        <StatCard icon={ClipboardList} label="Total applications" value={total} />
        <StatCard icon={FileText} tone="warning" label="In progress" value={inProgress} note={pct(inProgress)} />
        <StatCard icon={Sparkles} tone="violet" label="Offers received" value={offers} note={pct(offers)} />
        <StatCard icon={CheckCircle2} tone="success" label="Enrolled" value={enrolled} note={pct(enrolled)} />
      </StatGrid>

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search applicant, course, ID…" label="Search applications" />
        <SelectFilter
          label="Stage"
          allLabel="All stages"
          value={stageFilter}
          onChange={setStageFilter}
          options={stages.map((s) => ({ value: s, label: s, hint: applications.filter((a) => a.stage === s).length }))}
        />
        {(search || stageFilter) && (
          <ResetFilters
            onClick={() => {
              setSearch("");
              setStageFilter("");
            }}
          />
        )}
      </FilterBar>

      <Card className="flex flex-col">
        <CardHeader
          icon={ClipboardList}
          title="All Applications"
          subtitle={`${filtered.length} application${filtered.length === 1 ? "" : "s"} match your filters`}
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
