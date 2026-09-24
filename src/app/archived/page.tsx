"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  Download,
  GraduationCap,
  RotateCcw,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { mockArchivedRecords, type ArchivedRecord } from "@/lib/mock/system";
import { cn } from "@/lib/utils";
import { buttonSecondary } from "@/components/ui/button-styles";

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
            className={buttonSecondary}
          >
            <Download className="size-4" />
            <span>Export Archive Audit Log</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <StatGrid>
        <StatCard icon={Archive} label="Total archived" value={records.length} note="Entries" />
        <StatCard icon={GraduationCap} tone="success" label="Graduated alumni" value={graduatedCount} />
        <StatCard icon={UserX} tone="warning" label="Purged dormant leads" value={dormantCount} note="> 12M inactive" />
        <StatCard icon={ShieldCheck} tone="teal" label="Statutory retention" value="100%" note="GDPR" />
      </StatGrid>

      {/* Filter and Search Bar */}
      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search student, original ID, institution…" label="Search archive" />
        <SelectFilter
          label="Entity type"
          allLabel="All entity types"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "Lead", label: "Leads" },
            { value: "Application", label: "Applications" },
            { value: "Student Record", label: "Student records" },
          ]}
        />
        <SelectFilter
          label="Reason"
          allLabel="All reasons"
          value={reasonFilter}
          onChange={setReasonFilter}
          width="w-64"
          options={["Course Graduated", "Intake Concluded", "Student Withdrawn", "Lead Inactive > 12M", "Visa Refused & Closed"]}
        />
        {(search || typeFilter || reasonFilter) && (
          <ResetFilters
            onClick={() => {
              setSearch("");
              setTypeFilter("");
              setReasonFilter("");
            }}
          />
        )}
      </FilterBar>

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
                            ? "border border-success/20 bg-success/10 text-success"
                            : record.reason === "Intake Concluded"
                            ? "border border-blue-500/20 bg-blue-700/10 text-blue-700 dark:bg-blue-300/10 dark:text-blue-300"
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
                      <span className="text-[10px] text-success">
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
