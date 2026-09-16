"use client";

import { useMemo, useState } from "react";
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
import { Select } from "@/components/ui/form-controls";
import { AddLeadPanel } from "@/components/leads/add-lead-panel";
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

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const PAGE_SIZE = 8;

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>(getLeads);

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [counsellorFilter, setCounsellorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [addOpen, setAddOpen] = useState(false);
  const [assigning, setAssigning] = useState<LeadRow | null>(null);
  const [viewing, setViewing] = useState<LeadRow | null>(null);

  const hasFilters = !!(search || countryFilter || branchFilter || counsellorFilter || statusFilter || unassignedOnly);

  function resetFilters() {
    setSearch("");
    setCountryFilter("");
    setBranchFilter("");
    setCounsellorFilter("");
    setStatusFilter("");
    setUnassignedOnly(false);
    setPage(1);
  }

  const filtered = useMemo(() => {
    let list = leads;
    if (countryFilter) list = list.filter((l) => l.country === countryFilter);
    if (branchFilter) list = list.filter((l) => l.branch === branchFilter);
    if (counsellorFilter) list = list.filter((l) => l.counsellor === counsellorFilter);
    if (statusFilter) list = list.filter((l) => l.status === statusFilter);
    if (unassignedOnly) list = list.filter((l) => !l.counsellor);
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
  }, [leads, search, countryFilter, branchFilter, counsellorFilter, statusFilter, unassignedOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const total = leads.length;
  const newCount = leads.filter((l) => l.status === "New").length;
  const unassignedCount = leads.filter((l) => !l.counsellor).length;
  const convertedCount = leads.filter((l) => l.status === "Converted").length;

  const allOnPageSelected = pageItems.length > 0 && pageItems.every((l) => selected.has(l.id));

  function toggleSelectAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageItems.forEach((l) => next.delete(l.id));
      } else {
        pageItems.forEach((l) => next.add(l.id));
      }
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDeleteSelected() {
    setLeads((prev) => prev.filter((l) => !selected.has(l.id)));
    setSelected(new Set());
  }

  function handleAssign(id: string, branch: string, counsellor: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, branch, counsellor } : l)));
  }

  function handleAdd(lead: LeadRow) {
    setLeads((prev) => [lead, ...prev]);
    setPage(1);
  }

  function goToPage(next: number) {
    setPage(Math.min(Math.max(1, next), totalPages));
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Sparkles className="size-3" />
            Leads
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">All Leads</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Track, filter, and assign every incoming lead to a counsellor.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary-hover active:scale-95"
        >
          <Plus className="size-4" />
          Add Lead
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 card-shadow">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Users2 className="size-4" />
          </span>
          <div className="mt-3">
            <p className="text-2xl font-bold tabular-nums text-foreground">{total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Leads</p>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 card-shadow">
          <span className="flex size-8 items-center justify-center rounded-lg bg-success-soft text-success">
            <Sparkles className="size-4" />
          </span>
          <div className="mt-3">
            <p className="text-2xl font-bold tabular-nums text-foreground">{newCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">New Leads</p>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 card-shadow">
          <span className="flex size-8 items-center justify-center rounded-lg bg-danger-soft text-danger">
            <UserCog className="size-4" />
          </span>
          <div className="mt-3">
            <p className="text-2xl font-bold tabular-nums text-foreground">{unassignedCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Unassigned</p>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 card-shadow">
          <span className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
            <CheckCircle2 className="size-4" />
          </span>
          <div className="mt-3">
            <p className="text-2xl font-bold tabular-nums text-foreground">{convertedCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Converted</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-border bg-surface p-3 card-shadow">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, phone, ID..."
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

        <div className="w-36">
          <Select
            value={countryFilter}
            onChange={(e) => {
              setCountryFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs"
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-36">
          <Select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-40">
          <Select
            value={counsellorFilter}
            onChange={(e) => {
              setCounsellorFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs"
          >
            <option value="">All Counsellors</option>
            {counsellors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-36">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs"
          >
            <option value="">All Statuses</option>
            {leadStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <button
          type="button"
          onClick={() => {
            setUnassignedOnly((v) => !v);
            setPage(1);
          }}
          aria-pressed={unassignedOnly}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all",
            unassignedOnly
              ? "border-danger/30 bg-danger-soft text-danger"
              : "border-border bg-surface text-muted-foreground hover:text-foreground"
          )}
        >
          <UserCog className="size-3.5" />
          Unassigned Only
        </button>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
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

        {selected.size > 0 && (
          <div className="mx-6 mt-4 flex items-center justify-between rounded-xl bg-primary-soft px-4 py-2.5 text-xs">
            <span className="font-semibold text-primary">{selected.size} selected</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1.5 font-semibold text-danger hover:underline"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="font-semibold text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left text-xs">
            <thead className="border-b border-border/80 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2.5 pl-6 pr-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAllOnPage}
                    className="size-3.5 rounded border-border-strong accent-primary"
                    aria-label="Select all leads on this page"
                  />
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
                  const checked = selected.has(lead.id);
                  return (
                    <tr key={lead.id} className="group transition-colors hover:bg-surface-muted/40">
                      <td className="py-3 pl-6 pr-2 align-middle">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(lead.id)}
                          className="size-3.5 rounded border-border-strong accent-primary"
                          aria-label={`Select ${lead.name}`}
                        />
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
                            onClick={() => setAssigning(lead)}
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
                            onClick={() => setAssigning(lead)}
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
        key={assigning?.id ?? "none"}
        lead={assigning}
        onClose={() => setAssigning(null)}
        onAssign={handleAssign}
      />
      <LeadDetailsPanel
        lead={viewing}
        onClose={() => setViewing(null)}
        onAssign={(lead) => {
          setViewing(null);
          setAssigning(lead);
        }}
      />
    </div>
  );
}
