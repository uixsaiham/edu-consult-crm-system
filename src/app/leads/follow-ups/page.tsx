"use client";

import { BarButton, HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv, toCsvRow } from "@/lib/csv";
import { useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Plus,
  RotateCcw,
  Search,
  Undo2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Field, fieldClass, Select, Textarea } from "@/components/ui/form-controls";
import { SlideOver } from "@/components/ui/slide-over";
import { Tooltip } from "@/components/ui/tooltip";
import { FilterDropdown, FilterOptions } from "@/components/ui/filter-dropdown";
import { branches, counsellors } from "@/lib/mock/applications";
import { followUpToday as today, getFollowUps, type FollowUpRecord } from "@/lib/mock/follow-ups";
import { getLeads } from "@/lib/mock/leads";
import { cn, initialsFor } from "@/lib/utils";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";

const PAGE_SIZE = 25;
const leads = getLeads();

function shift(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysFromToday(iso: string) {
  return Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
}

function longDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function time12(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${m.toString().padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

type DisplayStatus = "Due" | "Overdue" | "Completed" | "Cancelled";

function displayStatus(f: FollowUpRecord): DisplayStatus {
  if (f.status === "Completed" || f.status === "Cancelled") return f.status;
  return f.date < today ? "Overdue" : "Due";
}

const statusStyle: Record<DisplayStatus, string> = {
  Due: "bg-primary-soft text-primary",
  Overdue: "bg-danger-soft text-danger",
  Completed: "bg-success-soft text-success",
  Cancelled: "bg-surface-muted text-muted-foreground",
};

const datePresets = [
  { value: "today", label: "Today", title: "Today's follow-ups", match: (d: string) => d === today },
  { value: "tomorrow", label: "Tomorrow", title: "Tomorrow's follow-ups", match: (d: string) => d === shift(today, 1) },
  { value: "next7", label: "Next 7 days", title: "Upcoming follow-ups (next 7 days)", match: (d: string) => d > today && d <= shift(today, 7) },
  { value: "overdue", label: "Overdue", title: "Overdue follow-ups", match: (d: string) => d < today },
] as const;

export default function FollowUpsPage() {
  const [items, setItems] = useState<FollowUpRecord[]>(getFollowUps);
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<string>("today");
  const [specificDate, setSpecificDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [counsellorFilter, setCounsellorFilter] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);

  const counts = useMemo(() => {
    const pending = items.filter((f) => f.status === "Pending");
    return {
      today: pending.filter((f) => f.date === today).length,
      overdue: pending.filter((f) => f.date < today).length,
      upcoming: pending.filter((f) => f.date > today && f.date <= shift(today, 7)).length,
      completed: items.filter((f) => f.status === "Completed").length,
    };
  }, [items]);

  const preset = datePresets.find((p) => p.value === datePreset);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((f) => (specificDate ? f.date === specificDate : preset ? preset.match(f.date) : true))
      .filter((f) => !statusFilter || displayStatus(f) === statusFilter)
      .filter((f) => !branchFilter || f.branch === branchFilter)
      .filter((f) => !counsellorFilter || f.counsellor === counsellorFilter)
      .filter(
        (f) =>
          !q ||
          f.leadName.toLowerCase().includes(q) ||
          f.leadId.toLowerCase().includes(q) ||
          f.phone.toLowerCase().includes(q) ||
          f.note.toLowerCase().includes(q)
      )
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [items, search, specificDate, preset, statusFilter, branchFilter, counsellorFilter]);

  const overdueInView = filtered.filter((f) => displayStatus(f) === "Overdue").length;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasFilters = !!(search || datePreset !== "today" || specificDate || statusFilter || branchFilter || counsellorFilter);
  const tableTitle = specificDate
    ? `Follow-ups on ${longDate(specificDate)}`
    : preset?.title ?? "All follow-ups";

  function reset() {
    setSearch("");
    setDatePreset("today");
    setSpecificDate("");
    setStatusFilter("");
    setBranchFilter("");
    setCounsellorFilter("");
    setPage(1);
  }

  function setStatus(id: string, status: FollowUpRecord["status"]) {
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
  }

  function pick<T>(setter: (v: T) => void, close: () => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
      close();
    };
  }

  const selection = useRowSelection(visible.map((row) => row.id));
  const exportSelected = () =>
    downloadCsv(`follow-ups-selected.csv`, items.filter((row) => selection.isSelected(row.id)).map(toCsvRow));

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Follow-ups</h2>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">Scheduled calls and check-ins with your leads.</p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={buttonPrimary}
        >
          <Plus className="size-4" />
          Add follow-up
        </button>
      </div>

      {/* Stats — click to jump to that view */}
      <StatGrid>
        {[
          { key: "today", label: "Due today", value: counts.today, icon: CalendarDays, tone: "primary" as const, preset: "today", status: "" },
          { key: "overdue", label: "Overdue", value: counts.overdue, icon: AlertCircle, tone: "danger" as const, preset: "overdue", status: "Overdue" },
          { key: "next7", label: "Next 7 days", value: counts.upcoming, icon: CalendarClock, tone: "warning" as const, preset: "next7", status: "Due" },
          { key: "completed", label: "Completed", value: counts.completed, icon: CalendarCheck2, tone: "success" as const, preset: "", status: "Completed" },
        ].map((stat) => (
          <StatCard
            key={stat.key}
            icon={stat.icon}
            tone={stat.tone}
            label={stat.label}
            value={stat.value}
            onClick={() => {
              setDatePreset(stat.preset);
              setStatusFilter(stat.status);
              setSpecificDate("");
              setPage(1);
            }}
          />
        ))}
      </StatGrid>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 card-shadow">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            aria-label="Search follow-ups"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search lead, phone, note…"
            className="h-9 w-60 rounded-lg border border-border bg-surface pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <FilterDropdown
          label="Follow-up date"
          valueLabel={specificDate ? longDate(specificDate) : preset?.label ?? "All dates"}
          activeText={specificDate ? longDate(specificDate) : preset?.label ?? "All dates"}
          width="w-60"
        >
          {(close) => (
            <div className="flex flex-col">
              <FilterOptions
                allLabel="All dates"
                value={specificDate ? "__none" : datePreset}
                options={datePresets.map((p) => ({ value: p.value, label: p.label }))}
                onSelect={(v) => {
                  setDatePreset(v);
                  setSpecificDate("");
                  setPage(1);
                  close();
                }}
              />
              <label className="mt-1 flex flex-col gap-1 border-t border-border px-2.5 pb-1.5 pt-2.5 text-[11px] font-medium text-muted-foreground">
                Specific date
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => {
                    setSpecificDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 w-full rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </label>
            </div>
          )}
        </FilterDropdown>

        <FilterDropdown label="Status" valueLabel={statusFilter || undefined} onClear={() => { setStatusFilter(""); setPage(1); }}>
          {(close) => (
            <FilterOptions
              allLabel="All statuses"
              value={statusFilter}
              options={(["Due", "Overdue", "Completed", "Cancelled"] as const).map((s) => ({
                value: s,
                label: s,
                hint: items.filter((f) => displayStatus(f) === s).length,
              }))}
              onSelect={pick(setStatusFilter, close)}
            />
          )}
        </FilterDropdown>

        <FilterDropdown label="Branch" valueLabel={branchFilter || undefined} onClear={() => { setBranchFilter(""); setPage(1); }}>
          {(close) => (
            <FilterOptions
              allLabel="All branches"
              value={branchFilter}
              options={branches.map((b) => ({ value: b, label: b }))}
              onSelect={pick(setBranchFilter, close)}
            />
          )}
        </FilterDropdown>

        <FilterDropdown label="Counsellor" valueLabel={counsellorFilter || undefined} onClear={() => { setCounsellorFilter(""); setPage(1); }}>
          {(close) => (
            <FilterOptions
              allLabel="All counsellors"
              value={counsellorFilter}
              options={counsellors.map((c) => ({ value: c, label: c }))}
              onSelect={pick(setCounsellorFilter, close)}
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

      {/* Table */}
      <Card className="overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <ClipboardList className="size-[18px]" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{tableTitle}</h3>
              <p className="text-xs text-muted-foreground">
                {filtered.length} follow-up{filtered.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          {overdueInView > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">
              <AlertCircle className="size-3.5" />
              {overdueInView} overdue
            </span>
          )}
        </div>

        <SelectionBar selection={selection} noun={["follow-up", "follow-ups"]} onExport={exportSelected} className="mx-4 mb-3 sm:mx-6">
          <BarButton
            onClick={() => {
              setItems((prev) => prev.map((f) => (selection.isSelected(f.id) ? { ...f, status: "Completed" } : f)));
              selection.clear();
            }}
          >
            Mark completed
          </BarButton>
        </SelectionBar>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-y border-border bg-surface-muted/40 text-xs text-muted-foreground">
                <th className="w-10 py-2.5 pl-6 pr-0">
                  <HeaderCheckbox selection={selection} />
                </th>
                <th className="py-2.5 pl-3 pr-3 font-medium">Lead</th>
                <th className="px-3 py-2.5 font-medium">Phone</th>
                <th className="px-3 py-2.5 font-medium">Counsellor</th>
                <th className="px-3 py-2.5 font-medium">Date &amp; time</th>
                <th className="px-3 py-2.5 font-medium">Notes</th>
                <th className="px-3 py-2.5 font-medium">Created by</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="py-2.5 pl-3 pr-5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <CalendarCheck2 className="mx-auto size-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm font-medium text-foreground">No follow-ups found</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Try another date or clear the filters.</p>
                  </td>
                </tr>
              ) : (
                visible.map((f) => {
                  const status = displayStatus(f);
                  const days = daysFromToday(f.date);
                  const done = f.status !== "Pending";
                  return (
                    <tr key={f.id} className={cn("border-b border-border/70 transition-colors last:border-0 hover:bg-surface-hover", selectedRowClass(selection, f.id))}>
                      <td className="py-3 pl-6 pr-0 align-middle">
                        <RowCheckbox selection={selection} id={f.id} label={`Select ${f.leadName}`} />
                      </td>
                      <td className="py-3 pl-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[11px] font-semibold text-muted-foreground">
                            {initialsFor(f.leadName)}
                          </span>
                          <span className="min-w-0">
                            <span className={cn("block truncate font-medium text-foreground", done && "text-muted-foreground")}>{f.leadName}</span>
                            <span className="block font-mono text-[11px] text-muted-foreground">{f.leadId}</span>
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs tabular-nums text-muted-foreground">{f.phone}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-foreground">{f.counsellor}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className="block text-xs font-medium text-foreground">
                          {days === 0 ? "Today" : days === 1 ? "Tomorrow" : days === -1 ? "Yesterday" : longDate(f.date)}
                        </span>
                        <span className="block text-[11px] tabular-nums text-muted-foreground">{time12(f.time)}</span>
                      </td>
                      <td className="max-w-64 px-3 py-3">
                        <span className="line-clamp-2 text-xs text-muted-foreground" title={f.note}>{f.note}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">{f.createdBy}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", statusStyle[status])}>
                          {status === "Overdue" ? `Overdue ${-days}d` : status}
                        </span>
                      </td>
                      <td className="py-3 pl-3 pr-5">
                        <div className="flex justify-end">
                          {done ? (
                            <Tooltip label="Reopen" align="end">
                              <button
                                type="button"
                                aria-label={`Reopen follow-up with ${f.leadName}`}
                                onClick={() => setStatus(f.id, "Pending")}
                                className="flex size-8 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                              >
                                <Undo2 className="size-3.5" />
                              </button>
                            </Tooltip>
                          ) : (
                            <Tooltip label="Mark done" align="end">
                              <button
                                type="button"
                                aria-label={`Mark follow-up with ${f.leadName} as done`}
                                onClick={() => setStatus(f.id, "Completed")}
                                className="group/btn flex size-8 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:border-success hover:bg-success"
                              >
                                <Check className="size-3.5 text-success transition-colors group-hover/btn:text-white" strokeWidth={2.5} />
                              </button>
                            </Tooltip>
                          )}
                        </div>
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
            <span>
              Showing <span className="font-medium tabular-nums text-foreground">{(currentPage - 1) * PAGE_SIZE + 1}–{(currentPage - 1) * PAGE_SIZE + visible.length}</span> of{" "}
              <span className="font-medium tabular-nums text-foreground">{filtered.length}</span>
            </span>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="flex size-8 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-40">
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-2 tabular-nums">Page {currentPage} of {pageCount}</span>
              <button type="button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} className="flex size-8 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-40">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {adding && (
        <AddFollowUp
          onClose={() => setAdding(false)}
          onAdd={(f) => {
            setItems((prev) => [...prev, f]);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

function AddFollowUp({ onClose, onAdd }: { onClose: () => void; onAdd: (f: FollowUpRecord) => void }) {
  const [leadId, setLeadId] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("10:00");
  const [counsellor, setCounsellor] = useState("");
  const [note, setNote] = useState("");
  const lead = leads.find((l) => l.id === leadId);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!lead) return;
    onAdd({
      id: `FU-${Date.now()}`,
      leadId: lead.id,
      leadName: lead.name,
      phone: lead.phone,
      branch: lead.branch,
      counsellor: counsellor || lead.counsellor || counsellors[0],
      date,
      time,
      note: note.trim() || "Follow up",
      createdBy: "Sadman Rahman",
      status: "Pending",
    });
  }

  return (
    <SlideOver
      open
      onClose={onClose}
      icon={ClipboardList}
      title="Add follow-up"
      subtitle="Schedule a call or check-in with a lead"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonSecondary}>
            Cancel
          </button>
          <button type="submit" form="follow-up-form" className={buttonPrimary}>
            Add follow-up
          </button>
        </div>
      }
    >
      <form id="follow-up-form" onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Lead" required>
          <Select
            required
            value={leadId}
            placeholder="Select lead"
            onChange={(e) => {
              setLeadId(e.target.value);
              setCounsellor(leads.find((l) => l.id === e.target.value)?.counsellor ?? "");
            }}
          >
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} · {l.id}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" required>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
          </Field>
          <Field label="Time" required>
            <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={fieldClass} />
          </Field>
        </div>
        <Field label="Counsellor">
          <Select value={counsellor} onChange={(e) => setCounsellor(e.target.value)}>
            <option value="">{lead?.counsellor ? `Lead's counsellor (${lead.counsellor})` : "Choose counsellor"}</option>
            {counsellors.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Notes">
          <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should be discussed?" />
        </Field>
        {lead && (
          <p className="rounded-xl bg-surface-muted/60 px-3 py-2 text-xs text-muted-foreground">
            {lead.phone} · {lead.branch || "No branch"}
          </p>
        )}
      </form>
    </SlideOver>
  );
}
