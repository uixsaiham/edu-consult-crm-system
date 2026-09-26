"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  UserCog,
  Users2,
  X,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import {
  anyDate,
  DateRangeFilter,
  FilterDropdown,
  FilterOptions,
  inDateRange,
  type DateRange,
} from "@/components/ui/filter-dropdown";
import { AddLeadPanel } from "@/components/leads/add-lead-panel";
import { HeaderCheckbox, RowCheckbox, selectedRowClass } from "@/components/ui/row-selection";
import { useRowSelection } from "@/lib/use-row-selection";
import { AssignLeadPanel } from "@/components/leads/assign-lead-panel";
import { LeadDetailsPanel } from "@/components/leads/lead-details-panel";
import {
  branches,
  countries,
  counsellors,
  getLeads,
  leadStatuses,
  leadStatusStyles,
  type LeadRow,
} from "@/lib/mock/leads";
import { operationsSnapshotDate } from "@/lib/mock/applications";
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

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const PAGE_SIZE = 25;

// "Today" for date presets matches the snapshot date used across the mock data.
const today = operationsSnapshotDate;

const assignmentOptions = [
  { value: "unassigned", label: "Unassigned only" },
  { value: "assigned", label: "Assigned only" },
];

export default function LeadsPage() {
  return <Suspense fallback={<p className="p-6 text-muted-foreground">Loading leads…</p>}><LeadsFromDashboard /></Suspense>;
}

function LeadsFromDashboard() {
  const params = useSearchParams();
  return <LeadsList key={params.toString()} initialSearch={params.get("search") || ""} />;
}

function LeadsList({ initialSearch }: { initialSearch: string }) {
  const [leads, setLeads] = useState<LeadRow[]>(getLeads);

  const [search, setSearch] = useState(initialSearch);
  const [countryFilter, setCountryFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [counsellorFilter, setCounsellorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assignment, setAssignment] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<DateRange>(anyDate);

  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [assigning, setAssigning] = useState<LeadRow[] | null>(null);
  const [viewing, setViewing] = useState<LeadRow | null>(null);

  const hasFilters = !!(
    search ||
    countryFilter ||
    branchFilter ||
    counsellorFilter ||
    statusFilter ||
    assignment ||
    sourceFilter ||
    dateFilter.from ||
    dateFilter.to
  );

  function resetFilters() {
    setSearch("");
    setCountryFilter("");
    setBranchFilter("");
    setCounsellorFilter("");
    setStatusFilter("");
    setAssignment("");
    setSourceFilter("");
    setDateFilter(anyDate);
    setPage(1);
  }

  const filtered = useMemo(() => {
    let list = leads;
    if (countryFilter) list = list.filter((l) => l.country === countryFilter);
    if (branchFilter) list = list.filter((l) => l.branch === branchFilter);
    if (counsellorFilter) list = list.filter((l) => l.counsellor === counsellorFilter);
    if (statusFilter) list = list.filter((l) => l.status === statusFilter);
    if (assignment === "unassigned") list = list.filter((l) => !l.counsellor);
    if (assignment === "assigned") list = list.filter((l) => !!l.counsellor);
    if (sourceFilter) list = list.filter((l) => l.leadSource === sourceFilter);
    list = list.filter((l) => inDateRange(l.createdDate, dateFilter));
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q)
      );
    }
    return list;
  }, [leads, search, countryFilter, branchFilter, counsellorFilter, statusFilter, assignment, sourceFilter, dateFilter]);

  // Options for the Source filter come from the leads themselves, with counts.
  const sourceOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of leads) if (l.leadSource) counts.set(l.leadSource, (counts.get(l.leadSource) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, count]) => ({ value, label: value, hint: count }));
  }, [leads]);

  function applyFilter(setter: (v: string) => void, close: () => void) {
    return (v: string) => {
      setter(v);
      setPage(1);
      close();
    };
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const selection = useRowSelection(pageItems.map((l) => l.id));
  const { selected } = selection;

  const total = leads.length;
  const newCount = leads.filter((l) => l.status === "New").length;
  const unassignedCount = leads.filter((l) => !l.counsellor).length;
  const convertedCount = leads.filter((l) => l.status === "Converted").length;
  const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : undefined);

  function handleDeleteSelected() {
    setLeads((prev) => prev.filter((l) => !selected.has(l.id)));
    selection.clear();
  }

  function handleAssign(ids: string[], branch: string, counsellor: string) {
    const idSet = new Set(ids);
    setLeads((prev) => prev.map((l) => (idSet.has(l.id) ? { ...l, branch, counsellor } : l)));
    selection.retain([...selected].filter((id) => !idSet.has(id)));
  }

  const selectedLeads = useMemo(() => leads.filter((l) => selected.has(l.id)), [leads, selected]);

  function handleAdd(lead: LeadRow) {
    setLeads((prev) => [lead, ...prev]);
    setPage(1);
  }

  function goToPage(next: number) {
    setPage(Math.min(Math.max(1, next), totalPages));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">All leads</h2>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            Track, filter, and assign every incoming lead to a counsellor.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className={buttonPrimary}
        >
          <Plus className="size-4" />
          Add lead
        </button>
      </div>

      <StatGrid>
        <StatCard icon={Users2} label="Total leads" value={total.toLocaleString()} />
        <StatCard icon={Sparkles} tone="success" label="New leads" value={newCount.toLocaleString()} note={pct(newCount)} />
        <StatCard icon={UserCog} tone="danger" label="Unassigned" value={unassignedCount.toLocaleString()} note={pct(unassignedCount)} />
        <StatCard icon={CheckCircle2} tone="teal" label="Converted" value={convertedCount.toLocaleString()} note={pct(convertedCount)} />
      </StatGrid>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 card-shadow">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            aria-label="Search leads"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, phone, ID…"
            className="h-9 w-60 rounded-lg border border-border bg-surface pl-9 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <DateRangeFilter
          today={today}
          value={dateFilter}
          onChange={(v) => {
            setDateFilter(v);
            setPage(1);
          }}
        />

        <FilterDropdown
          label="Country"
          valueLabel={countryFilter || undefined}
          onClear={() => {
            setCountryFilter("");
            setPage(1);
          }}
        >
          {(close) => (
            <FilterOptions
              searchable
              allLabel="All countries"
              value={countryFilter}
              options={countries.map((c) => ({ value: c, label: c }))}
              onSelect={applyFilter(setCountryFilter, close)}
            />
          )}
        </FilterDropdown>

        <FilterDropdown
          label="Branch"
          valueLabel={branchFilter || undefined}
          onClear={() => {
            setBranchFilter("");
            setPage(1);
          }}
        >
          {(close) => (
            <FilterOptions
              allLabel="All branches"
              value={branchFilter}
              options={branches.map((b) => ({ value: b, label: b }))}
              onSelect={applyFilter(setBranchFilter, close)}
            />
          )}
        </FilterDropdown>

        <FilterDropdown
          label="Counsellor"
          valueLabel={counsellorFilter || undefined}
          onClear={() => {
            setCounsellorFilter("");
            setPage(1);
          }}
        >
          {(close) => (
            <FilterOptions
              searchable={counsellors.length > 8}
              allLabel="All counsellors"
              value={counsellorFilter}
              options={counsellors.map((c) => ({ value: c, label: c }))}
              onSelect={applyFilter(setCounsellorFilter, close)}
            />
          )}
        </FilterDropdown>

        <FilterDropdown
          label="Status"
          valueLabel={statusFilter || undefined}
          onClear={() => {
            setStatusFilter("");
            setPage(1);
          }}
        >
          {(close) => (
            <FilterOptions
              allLabel="All statuses"
              value={statusFilter}
              options={leadStatuses.map((st) => ({
                value: st,
                label: st,
                hint: leads.filter((l) => l.status === st).length,
              }))}
              onSelect={applyFilter(setStatusFilter, close)}
            />
          )}
        </FilterDropdown>

        <FilterDropdown
          label="Unassigned"
          valueLabel={assignmentOptions.find((o) => o.value === assignment)?.label}
          activeText={assignmentOptions.find((o) => o.value === assignment)?.label}
          onClear={() => {
            setAssignment("");
            setPage(1);
          }}
        >
          {(close) => (
            <FilterOptions
              allLabel="All leads"
              value={assignment}
              options={assignmentOptions.map((o) => ({
                ...o,
                hint: leads.filter((l) => (o.value === "unassigned" ? !l.counsellor : !!l.counsellor)).length,
              }))}
              onSelect={applyFilter(setAssignment, close)}
            />
          )}
        </FilterDropdown>

        <FilterDropdown
          label="Source"
          valueLabel={sourceFilter || undefined}
          onClear={() => {
            setSourceFilter("");
            setPage(1);
          }}
          width="w-72"
        >
          {(close) => (
            <FilterOptions
              searchable
              allLabel="All sources"
              value={sourceFilter}
              options={sourceOptions}
              onSelect={applyFilter(setSourceFilter, close)}
            />
          )}
        </FilterDropdown>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </button>
        )}
      </div>

      <Card className="flex flex-col">
        <CardHeader
          icon={Users2}
          title="All Leads"
          subtitle={`${filtered.length.toLocaleString()} lead${filtered.length === 1 ? "" : "s"} match your filters`}
        />

        {selectedLeads.length > 0 && (
          <div className="mx-6 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-primary-soft px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {selectedLeads.slice(0, 4).map((l) => (
                  <span
                    key={l.id}
                    className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-surface bg-primary/15 text-[10px] font-bold text-primary"
                    title={l.name}
                  >
                    {l.initials}
                  </span>
                ))}
                {selectedLeads.length > 4 && (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-surface bg-primary text-[10px] font-bold text-primary-foreground">
                    +{selectedLeads.length - 4}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-primary">
                {selectedLeads.length} lead{selectedLeads.length === 1 ? "" : "s"} selected
              </span>
              <span className="hidden text-[11px] text-muted-foreground md:inline">Shift-click to select a range</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAssigning(selectedLeads)}
                className={buttonPrimary}
              >
                <UserCog className="size-4" />
                Assign to Counsellor
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-danger/30 bg-surface px-3.5 text-xs font-semibold text-danger transition-all hover:bg-danger-soft"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
              <button
                type="button"
                onClick={selection.clear}
                aria-label="Clear selection"
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left text-xs">
            <thead className="border-b border-border/80 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2.5 pl-6 pr-2 font-semibold">
                  <HeaderCheckbox selection={selection} label="Select all leads on this page" />
                </th>
                <th className="px-3 py-2.5 font-semibold">Actions</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold">Name</th>
                <th className="px-3 py-2.5 font-semibold">Phone</th>
                <th className="px-3 py-2.5 font-semibold">Email</th>
                <th className="px-3 py-2.5 font-semibold">Branch</th>
                <th className="px-3 py-2.5 font-semibold">Counsellor</th>
                <th className="px-3 py-2.5 font-semibold">Lead Note</th>
                <th className="px-3 py-2.5 font-semibold">Lead Source</th>
                <th className="py-2.5 pl-3 pr-6 text-right font-semibold">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Search className="size-5 text-muted-foreground/60" />
                      <p className="text-xs font-medium">No leads match your criteria</p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-1 text-xs font-semibold text-primary hover:underline"
                      >
                        Reset filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((lead) => {
                  const status = leadStatusStyles[lead.status];
                  return (
                    <tr key={lead.id} className={cn("group transition-colors hover:bg-surface-muted/40", selectedRowClass(selection, lead.id))}>
                      <td className="py-3 pl-6 pr-2 align-middle">
                        <RowCheckbox selection={selection} id={lead.id} label={`Select ${lead.name}`} />
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewing(lead)}
                            aria-label="View lead"
                            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssigning([lead])}
                            aria-label="Assign lead"
                            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                          >
                            <UserCog className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setLeads((prev) => prev.filter((l) => l.id !== lead.id))}
                            aria-label="Delete lead"
                            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            status.bg,
                            status.text
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", status.dot)} />
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                              paletteFor(lead.name)
                            )}
                          >
                            {lead.initials}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">{lead.name}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{lead.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap text-xs text-muted-foreground">
                        {lead.phone}
                      </td>
                      <td className="px-3 py-3 align-middle text-xs text-muted-foreground">
                        <span className="block max-w-[180px] truncate">{lead.email}</span>
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap text-xs text-muted-foreground">
                        {lead.branch || <span className="text-muted-foreground/50">—</span>}
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap">
                        {lead.counsellor ? (
                          <span className="text-xs font-medium text-foreground">{lead.counsellor}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAssigning([lead])}
                            className="rounded-full bg-danger-soft px-2.5 py-1 text-[11px] font-semibold text-danger transition-all hover:brightness-95"
                          >
                            Assign To Counselor
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <span className="block max-w-[160px] truncate text-xs text-muted-foreground">
                          {lead.leadNote || <span className="text-muted-foreground/50">—</span>}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <span className="block max-w-[150px] truncate text-[11px] text-muted-foreground">
                          {lead.leadSource}
                        </span>
                      </td>
                      <td className="py-3 pl-3 pr-6 align-middle text-right whitespace-nowrap text-[11px] text-muted-foreground">
                        {formatDate(lead.createdDate)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-6 py-2.5 text-xs text-muted-foreground">
          <span>
            Showing{" "}
            <strong className="font-semibold text-foreground">
              {filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1}–
              {Math.min(pageSafe * PAGE_SIZE, filtered.length)}
            </strong>{" "}
            of <strong className="font-semibold text-foreground">{filtered.length.toLocaleString()}</strong> leads
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToPage(pageSafe - 1)}
              disabled={pageSafe <= 1}
              aria-label="Previous page"
              className="flex size-7 items-center justify-center rounded-lg border border-border transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="px-1.5 font-medium text-foreground">
              {pageSafe} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(pageSafe + 1)}
              disabled={pageSafe >= totalPages}
              aria-label="Next page"
              className="flex size-7 items-center justify-center rounded-lg border border-border transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </Card>

      <AddLeadPanel open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      <AssignLeadPanel
        key={assigning?.map((l) => l.id).join("|") ?? "none"}
        leads={assigning}
        onClose={() => setAssigning(null)}
        onAssign={handleAssign}
      />
      <LeadDetailsPanel
        lead={viewing}
        onClose={() => setViewing(null)}
        onAssign={(lead) => {
          setViewing(null);
          setAssigning([lead]);
        }}
      />
    </div>
  );
}
