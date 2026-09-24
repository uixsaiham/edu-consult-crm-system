"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Download, RotateCcw, Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  anyDate,
  DateRangeFilter,
  FilterDropdown,
  FilterOptions,
  inDateRange,
  type DateRange,
} from "@/components/ui/filter-dropdown";
import { operationsSnapshotDate } from "@/lib/mock/applications";
import { branches, counsellors, getLeads, leadStatuses, leadStatusStyles, type LeadRow } from "@/lib/mock/leads";
import { useClickOutside } from "@/lib/use-click-outside";
import { cn } from "@/lib/utils";
import { buttonPrimary } from "@/components/ui/button-styles";

const PAGE_SIZE = 25;
const today = operationsSnapshotDate;
const leads = getLeads();

// Columns shown in the table and available in the CSV export.
const columns = [
  { key: "status", label: "Status", value: (l: LeadRow) => l.status },
  { key: "id", label: "Lead ID", value: (l: LeadRow) => l.id },
  { key: "createdDate", label: "Created date", value: (l: LeadRow) => l.createdDate },
  { key: "name", label: "Name", value: (l: LeadRow) => l.name },
  { key: "phone", label: "Phone", value: (l: LeadRow) => l.phone },
  { key: "email", label: "Email", value: (l: LeadRow) => l.email },
  { key: "country", label: "Country", value: (l: LeadRow) => l.country },
  { key: "branch", label: "Branch", value: (l: LeadRow) => l.branch },
  { key: "counsellor", label: "Counsellor", value: (l: LeadRow) => l.counsellor },
  { key: "leadSource", label: "Lead source", value: (l: LeadRow) => l.leadSource },
] as const;
type ColumnKey = (typeof columns)[number]["key"];

function longDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function downloadCsv(rows: LeadRow[], keys: ColumnKey[]) {
  const cols = columns.filter((c) => keys.includes(c.key));
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [cols.map((c) => escape(c.label)), ...rows.map((r) => cols.map((c) => escape(c.value(r) || "")))]
    .map((line) => line.join(","))
    .join("\r\n");
  // BOM so Excel opens UTF-8 (e.g. Bangla names) correctly.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-export-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportLeadsPage() {
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>(anyDate);
  const [branch, setBranch] = useState("");
  const [counsellor, setCounsellor] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sourceOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of leads) if (l.leadSource) counts.set(l.leadSource, (counts.get(l.leadSource) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([value, n]) => ({ value, label: value, hint: n }));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads
      .filter((l) => inDateRange(l.createdDate, dateRange))
      .filter((l) => !branch || l.branch === branch)
      .filter((l) => !counsellor || (counsellor === "__none" ? !l.counsellor : l.counsellor === counsellor))
      .filter((l) => !status || l.status === status)
      .filter((l) => !source || l.leadSource === source)
      .filter(
        (l) =>
          !q ||
          l.name.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q)
      );
  }, [search, dateRange, branch, counsellor, status, source]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const first = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(first, first + PAGE_SIZE);
  const hasFilters = !!(search || dateRange.from || dateRange.to || branch || counsellor || status || source);
  const allOnPageSelected = visible.length > 0 && visible.every((l) => selected.has(l.id));
  const selectedRows = filtered.filter((l) => selected.has(l.id));

  function update<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  function reset() {
    setSearch("");
    setDateRange(anyDate);
    setBranch("");
    setCounsellor("");
    setStatus("");
    setSource("");
    setSelected(new Set());
    setPage(1);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const l of visible) {
        if (allOnPageSelected) next.delete(l.id);
        else next.add(l.id);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Export leads</h2>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">Filter leads, then download them as a CSV file.</p>
        </div>
        <ExportMenu matching={filtered} selectedRows={selectedRows} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 card-shadow">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            aria-label="Search leads"
            value={search}
            onChange={(e) => update(setSearch)(e.target.value)}
            placeholder="Search name, email, phone, ID…"
            className="h-9 w-60 rounded-lg border border-border bg-surface pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <DateRangeFilter today={today} value={dateRange} onChange={update(setDateRange)} />

        <FilterDropdown label="Branch" valueLabel={branch || undefined} onClear={() => update(setBranch)("")}>
          {(close) => (
            <FilterOptions
              allLabel="All branches"
              value={branch}
              options={branches.map((b) => ({ value: b, label: b, hint: leads.filter((l) => l.branch === b).length }))}
              onSelect={(v) => {
                update(setBranch)(v);
                close();
              }}
            />
          )}
        </FilterDropdown>

        <FilterDropdown
          label="Counsellor"
          valueLabel={counsellor === "__none" ? "Unassigned" : counsellor || undefined}
          onClear={() => update(setCounsellor)("")}
        >
          {(close) => (
            <FilterOptions
              allLabel="All counsellors"
              value={counsellor}
              options={[
                ...counsellors.map((c) => ({ value: c, label: c, hint: leads.filter((l) => l.counsellor === c).length })),
                { value: "__none", label: "Unassigned", hint: leads.filter((l) => !l.counsellor).length },
              ]}
              onSelect={(v) => {
                update(setCounsellor)(v);
                close();
              }}
            />
          )}
        </FilterDropdown>

        <FilterDropdown label="Status" valueLabel={status || undefined} onClear={() => update(setStatus)("")}>
          {(close) => (
            <FilterOptions
              allLabel="All statuses"
              value={status}
              options={leadStatuses.map((s) => ({ value: s, label: s, hint: leads.filter((l) => l.status === s).length }))}
              onSelect={(v) => {
                update(setStatus)(v);
                close();
              }}
            />
          )}
        </FilterDropdown>

        <FilterDropdown label="Lead source" valueLabel={source || undefined} onClear={() => update(setSource)("")} width="w-72">
          {(close) => (
            <FilterOptions
              searchable
              allLabel="All sources"
              value={source}
              options={sourceOptions}
              onSelect={(v) => {
                update(setSource)(v);
                close();
              }}
            />
          )}
        </FilterDropdown>

        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Results */}
      <Card className="overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs text-muted-foreground">
          <p>
            <span className="font-semibold tabular-nums text-foreground">{filtered.length.toLocaleString()}</span> lead
            {filtered.length === 1 ? "" : "s"} found
            {filtered.length > 0 && (
              <>
                {" "}· Showing <span className="tabular-nums">{first + 1}–{first + visible.length}</span>
              </>
            )}
          </p>
          {selected.size > 0 && (
            <p className="flex items-center gap-2">
              <span className="font-medium text-primary">{selected.size} selected</span>
              <button type="button" onClick={() => setSelected(new Set())} className="inline-flex items-center gap-1 hover:text-foreground">
                <X className="size-3" />
                Clear
              </button>
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-y border-border bg-surface-muted/40 text-muted-foreground">
                <th className="w-10 py-2.5 pl-5 pr-2">
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allOnPageSelected}
                    onChange={togglePage}
                    className="size-3.5 cursor-pointer accent-[var(--primary)]"
                  />
                </th>
                {columns
                  .filter((c) => c.key !== "country")
                  .map((c) => (
                    <th key={c.key} className="whitespace-nowrap px-3 py-2.5 font-medium last:pr-5">
                      {c.label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center text-sm text-muted-foreground">
                    No leads match these filters.
                  </td>
                </tr>
              ) : (
                visible.map((l) => {
                  const style = leadStatusStyles[l.status];
                  const checked = selected.has(l.id);
                  return (
                    <tr
                      key={l.id}
                      className={cn(
                        "border-b border-border/70 transition-colors last:border-0 hover:bg-surface-hover",
                        checked && "bg-primary-soft/40"
                      )}
                    >
                      <td className="py-2.5 pl-5 pr-2">
                        <input
                          type="checkbox"
                          aria-label={`Select ${l.name}`}
                          checked={checked}
                          onChange={() => toggle(l.id)}
                          className="size-3.5 cursor-pointer accent-[var(--primary)]"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", style.bg, style.text)}>
                          <span className={cn("size-1.5 rounded-full", style.dot)} />
                          {l.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{l.id}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{longDate(l.createdDate)}</td>
                      <td className="max-w-48 truncate px-3 py-2.5 font-medium text-foreground">{l.name}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-muted-foreground">{l.phone}</td>
                      <td className="max-w-56 truncate px-3 py-2.5 text-muted-foreground">{l.email}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-foreground">{l.branch || <Dash />}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-foreground">{l.counsellor || <Dash />}</td>
                      <td className="max-w-72 truncate px-3 py-2.5 pr-5 text-muted-foreground" title={l.leadSource}>
                        {l.leadSource || <Dash />}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
            <span className="tabular-nums">
              Page {currentPage} of {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="flex size-8 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-40">
                <ChevronLeft className="size-4" />
              </button>
              <button type="button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} className="flex size-8 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-40">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Dash() {
  return <span className="text-muted-foreground/60">—</span>;
}

function ExportMenu({ matching, selectedRows }: { matching: LeadRow[]; selectedRows: LeadRow[] }) {
  const [open, setOpen] = useState(false);
  const [keys, setKeys] = useState<ColumnKey[]>(columns.map((c) => c.key));
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  function run(rows: LeadRow[]) {
    downloadCsv(rows, keys);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={buttonPrimary}
      >
        <Download className="size-4" />
        Export
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl animate-fade-in">
          <div className="p-1.5">
            <MenuAction
              label={`Export all matching (${matching.length})`}
              hint="Every lead that matches the filters"
              disabled={matching.length === 0 || keys.length === 0}
              onClick={() => run(matching)}
            />
            <MenuAction
              label={`Export selected (${selectedRows.length})`}
              hint="Only the rows you ticked"
              disabled={selectedRows.length === 0 || keys.length === 0}
              onClick={() => run(selectedRows)}
            />
          </div>
          <div className="border-t border-border px-3.5 pb-3 pt-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[11px] font-medium text-muted-foreground">Columns in file</p>
              <button
                type="button"
                onClick={() => setKeys(keys.length === columns.length ? [] : columns.map((c) => c.key))}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                {keys.length === columns.length ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              {columns.map((c) => {
                const on = keys.includes(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={on}
                    onClick={() => setKeys((prev) => (on ? prev.filter((k) => k !== c.key) : columns.map((x) => x.key).filter((k) => prev.includes(k) || k === c.key)))}
                    className="flex items-center gap-2 rounded-md px-1 py-1 text-left text-xs text-foreground hover:bg-surface-hover"
                  >
                    <span className={cn("flex size-3.5 shrink-0 items-center justify-center rounded border", on ? "border-primary bg-primary text-primary-foreground" : "border-border-strong")}>
                      {on && <Check className="size-2.5" strokeWidth={3} />}
                    </span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuAction({ label, hint, disabled, onClick }: { label: string; hint: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full flex-col items-start rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-40"
    >
      <span className="text-xs font-medium text-foreground">{label}</span>
      <span className="text-[11px] text-muted-foreground">{hint}</span>
    </button>
  );
}
