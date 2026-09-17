"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  Download,
  Filter,
  GraduationCap,
  RotateCcw,
  Search,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { mockArchivedRecords, type ArchivedRecord } from "@/lib/mock/system";
import { cn } from "@/lib/utils";

export default function ArchivedPage() {
  const [records, setRecords] = useState<ArchivedRecord[]>(mockArchivedRecords);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");

  const filtered = useMemo(() => {
    let list = records;
    if (typeFilter) list = list.filter((r) => r.entityType === typeFilter);
    if (reasonFilter) list = list.filter((r) => r.reason === reasonFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.subjectName.toLowerCase().includes(q) ||
          r.originalId.toLowerCase().includes(q) ||
          r.associatedEntity.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, search, typeFilter, reasonFilter]);

  const graduatedCount = records.filter((r) => r.reason === "Course Graduated").length;
  const dormantCount = records.filter((r) => r.reason === "Lead Inactive > 12M").length;

  function handleRestore(id: string) {
    setRecords(records.filter((r) => r.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Archived Records
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Historical depository for completed intake cycles, alumni graduations, and GDPR-compliant statutory retention.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-muted active:scale-95"
          >
            <Download className="size-3.5" />
            <span>Export Archive Audit Log</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Archived Vault</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Archive className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {records.length}
            </span>
            <span className="text-xs font-medium text-muted-foreground">Historical Entries</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Graduated Alumni</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <GraduationCap className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {graduatedCount}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Successfully Completed</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Purged Dormant Leads</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <UserX className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {dormantCount}
            </span>
            <span className="text-xs font-medium text-muted-foreground">&gt; 12M Inactive</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Statutory Retention</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <ShieldCheck className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              100%
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">GDPR Compliant</span>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search archive by student, original ID, or institution..."
              className="w-full rounded-full border border-border bg-background py-1.5 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              <span>Filter:</span>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by Entity Type"
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-hidden"
            >
              <option value="">All Entity Types</option>
              <option value="Lead">Leads</option>
              <option value="Application">Applications</option>
              <option value="Student Record">Student Records</option>
            </select>

            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              aria-label="Filter by Archival Reason"
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-hidden"
            >
              <option value="">All Archival Reasons</option>
              <option value="Course Graduated">Course Graduated</option>
              <option value="Intake Concluded">Intake Concluded</option>
              <option value="Student Withdrawn">Student Withdrawn</option>
              <option value="Lead Inactive > 12M">Lead Inactive &gt; 12M</option>
              <option value="Visa Refused & Closed">Visa Refused & Closed</option>
            </select>

            {(search || typeFilter || reasonFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("");
                  setReasonFilter("");
                }}
                className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Archived Table */}
      <Card>
        <CardHeader
          title="Vault Archives"
          description={`Showing ${filtered.length} of ${records.length} compliance archived files.`}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                <th className="py-3 pl-6 pr-4">Subject & Reference</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Associated Entity</th>
                <th className="py-3 px-4">Intake Cycle</th>
                <th className="py-3 px-4">Archival Reason</th>
                <th className="py-3 px-4">Archived By</th>
                <th className="py-3 px-4">Retention Until</th>
                <th className="py-3 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No archived records match the search filter.
                  </td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr key={record.id} className="transition-colors hover:bg-muted/30">
                    <td className="py-3.5 pl-6 pr-4">
                      <div>
                        <span className="font-semibold text-foreground text-sm block">
                          {record.subjectName}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {record.originalId}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {record.entityType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span className="font-medium text-foreground block max-w-xs truncate">
                        {record.associatedEntity}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top text-foreground">
                      <span>{record.intakePeriod}</span>
                      <span className="text-[11px] text-muted-foreground block">
                        Archived: {record.archivedDate}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          record.reason === "Course Graduated"
                            ? "border border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : record.reason === "Intake Concluded"
                            ? "border border-blue-500/20 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            : "border border-muted bg-muted text-muted-foreground"
                        )}
                      >
                        {record.reason}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top text-muted-foreground">
                      {record.archivedBy}
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span className="font-mono text-foreground block">
                        {record.retentionUntil}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        Compliant
                      </span>
                    </td>

                    <td className="py-3.5 pl-4 pr-6 align-top text-right">
                      <button
                        type="button"
                        onClick={() => handleRestore(record.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted hover:text-primary transition-colors"
                      >
                        <RotateCcw className="size-3" />
                        <span>Restore</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
