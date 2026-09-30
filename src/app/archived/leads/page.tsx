"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, CalendarRange, Download, Eye, Mail, MoreHorizontal, PencilLine, Phone, RotateCcw, Tags, Trash2, Users2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { BarButton, HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { SlideOver } from "@/components/ui/slide-over";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { AnchoredMenu, MenuDivider, MenuItem } from "@/components/applications/list/anchored-menu";
import { formatDay } from "@/components/people/people-ui";
import { ArchiveDialog, ArchiveInfo, ArchiveNav, ArchivedCell, Detail, EmptyArchive, PurgeDialog, ReasonCell, RetentionCell, retentionOptions } from "@/components/archive/archive-ui";
import { archiveKinds, archiveReasons, daysSince, leadArchive, retentionState, retentionUntil, type ArchivedEntry } from "@/lib/mock/archive";
import { leadStatuses, leadStatusStyles, type LeadRow } from "@/lib/mock/leads";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

type Entry = ArchivedEntry<LeadRow>;
type Sort = "" | "oldest" | "name";

export default function ArchivedLeadsPage() {
  const { user } = useUser();
  const [items, setItems] = useState<Entry[]>(leadArchive.list);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("");
  const [country, setCountry] = useState("");
  const [by, setBy] = useState("");
  const [retention, setRetention] = useState("");
  const [sort, setSort] = useState<Sort>("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [purging, setPurging] = useState<string[] | null>(null);
  const [toast, notify] = useToast();

  const refresh = () => setItems(leadArchive.list());
  const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter(
        (e) =>
          (!reason || e.reason === reason) &&
          (!status || e.record.status === status) &&
          (!country || e.record.country === country) &&
          (!by || e.archivedBy === by) &&
          (!retention || retentionState("leads", e.archivedAt) === retention) &&
          (!q || `${e.record.name} ${e.record.email} ${e.record.phone} ${e.record.id} ${e.record.leadSource} ${e.note}`.toLowerCase().includes(q))
      )
      .sort((a, b) =>
        sort === "oldest" ? a.archivedAt.localeCompare(b.archivedAt) : sort === "name" ? a.record.name.localeCompare(b.record.name) : b.archivedAt.localeCompare(a.archivedAt)
      );
  }, [items, search, reason, status, country, by, retention, sort]);

  const selection = useRowSelection(filtered.map((e) => e.id));
  const selected = filtered.filter((e) => selection.isSelected(e.id));
  const hasFilters = !!(search || reason || status || country || by || retention || sort);
  const reset = () => { setSearch(""); setReason(""); setStatus(""); setCountry(""); setBy(""); setRetention(""); setSort(""); };

  const due = items.filter((e) => retentionState("leads", e.archivedAt) === "due");
  const topReason = Object.entries(items.reduce<Record<string, number>>((m, e) => ({ ...m, [e.reason]: (m[e.reason] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1])[0];

  const restore = (ids: string[]) => {
    const back = leadArchive.restore(ids, user.name);
    refresh();
    selection.retain([...selection.selected].filter((id) => !ids.includes(id)));
    if (viewingId && ids.includes(viewingId)) setViewingId(null);
    notify(back.length === 1 ? `${back[0].name} restored to All Leads` : `${back.length} leads restored to All Leads`);
  };
  const purge = (ids: string[]) => {
    leadArchive.purge(ids, user.name);
    refresh();
    selection.retain([...selection.selected].filter((id) => !ids.includes(id)));
    if (viewingId && ids.includes(viewingId)) setViewingId(null);
    setPurging(null);
    notify(ids.length === 1 ? "Lead deleted permanently" : `${ids.length} leads deleted permanently`);
  };
  const exportRows = (rows: Entry[], file: string) =>
    downloadCsv(file, rows.map((e) => ({
      id: e.record.id, name: e.record.name, phone: e.record.phone, email: e.record.email, country: e.record.country, branch: e.record.branch, counsellor: e.record.counsellor,
      lastStatus: e.record.status, leadSource: e.record.leadSource, created: e.record.createdDate, archived: e.archivedAt, archivedBy: e.archivedBy, reason: e.reason, note: e.note, keepUntil: retentionUntil("leads", e.archivedAt),
    })));

  const viewing = items.find((e) => e.id === viewingId);
  const editing = items.find((e) => e.id === editingId);
  const byId = (id: string) => items.find((e) => e.id === id);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Archived Leads</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Enquiries taken out of the pipeline. Restore one to put it back in All Leads with its details intact, or delete it once its {archiveKinds.leads.retentionYears}-year retention period ends.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={() => exportRows(filtered, "archived-leads.csv")} disabled={!filtered.length} className={cn(buttonSecondary, "disabled:opacity-50")}><Download className="size-4" /> Export</button>
          <Link href="/leads" className={buttonPrimary}><Users2 className="size-4" /> All Leads</Link>
        </div>
      </header>

      <ArchiveNav counts={{ leads: items.length }} />

      <StatGrid>
        <StatCard icon={Archive} label="Archived leads" value={items.length} onClick={reset} />
        <StatCard icon={CalendarRange} tone="violet" label="Archived in last 30 days" value={items.filter((e) => daysSince(e.archivedAt) <= 30).length} />
        <StatCard icon={Tags} tone="neutral" label={topReason ? topReason[0] : "Top reason"} value={topReason ? topReason[1] : 0} note="top reason" onClick={() => topReason && setReason(topReason[0])} />
        <StatCard icon={Trash2} tone={due.length ? "danger" : "success"} label="Due for deletion" value={due.length} note="past retention" onClick={() => setRetention("due")} />
      </StatGrid>

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Name, email, phone, ID…" label="Search archived leads" />
        <SelectFilter label="Reason" value={reason} onChange={setReason} allLabel="All reasons" width="w-72" options={archiveReasons.leads.map((r) => ({ value: r, label: r, hint: items.filter((e) => e.reason === r).length }))} />
        <SelectFilter label="Last status" value={status} onChange={setStatus} allLabel="Any status" options={leadStatuses.map((s) => ({ value: s, label: s, dot: leadStatusStyles[s].dot }))} />
        <SelectFilter label="Country" value={country} onChange={setCountry} allLabel="All countries" options={uniq(items.map((e) => e.record.country))} />
        <SelectFilter label="Archived by" value={by} onChange={setBy} allLabel="Anyone" options={uniq(items.map((e) => e.archivedBy))} />
        <SelectFilter label="Retention" value={retention} onChange={setRetention} allLabel="Any" width="w-60" options={retentionOptions} />
        <SelectFilter label="Sort" value={sort} onChange={(v) => setSort(v as Sort)} allLabel="Recently archived" options={[{ value: "oldest", label: "Oldest archived" }, { value: "name", label: "Name A–Z" }]} />
        {hasFilters && <ResetFilters onClick={reset} />}
      </FilterBar>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Archive</h3>
          <p className="text-xs text-muted-foreground">Showing {filtered.length} of {items.length} archived lead{items.length === 1 ? "" : "s"}</p>
        </div>
        <SelectionBar selection={selection} noun={["lead", "leads"]} onExport={() => exportRows(selected, "archived-leads-selected.csv")} className="mx-5 mt-3">
          <BarButton onClick={() => restore(selected.map((e) => e.id))}><RotateCcw className="size-3.5" /> Restore</BarButton>
          <BarButton tone="danger" onClick={() => setPurging(selected.map((e) => e.id))}><Trash2 className="size-3.5" /> Delete permanently</BarButton>
        </SelectionBar>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-xs">
            <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 py-2.5 pl-5 pr-0"><HeaderCheckbox selection={selection} label="Select all archived leads shown" /></th>
                <th className="py-2.5 pl-3 pr-3">Lead</th>
                <th className="px-3 py-2.5">Contact</th>
                <th className="px-3 py-2.5">Last status</th>
                <th className="px-3 py-2.5">Source & counsellor</th>
                <th className="px-3 py-2.5">Reason</th>
                <th className="px-3 py-2.5">Archived</th>
                <th className="px-3 py-2.5">Keep until</th>
                <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((e) => {
                const l = e.record;
                const st = leadStatusStyles[l.status];
                return (
                  <tr key={e.id} className={cn("transition-colors hover:bg-surface-hover/60", selectedRowClass(selection, e.id))}>
                    <td className="py-3 pl-5 pr-0 align-middle"><RowCheckbox selection={selection} id={e.id} label={`Select ${l.name}`} /></td>
                    <td className="py-3 pl-3 pr-3">
                      <button type="button" onClick={() => setViewingId(e.id)} className="flex items-center gap-2.5 text-left">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-[11px] font-semibold text-muted-foreground">{l.initials}</span>
                        <span>
                          <span className="block whitespace-nowrap text-sm font-semibold text-foreground hover:text-primary">{l.name}</span>
                          <span className="block whitespace-nowrap font-mono text-[11px] text-muted-foreground">{l.id} · {l.country}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-foreground">{l.phone}</p>
                      <p className="max-w-44 truncate text-[11px] text-muted-foreground">{l.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", st.bg, st.text)}><span className={cn("size-1.5 rounded-full", st.dot)} />{l.status}</span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="max-w-44 truncate text-foreground">{l.leadSource}</p>
                      <p className="text-[11px] text-muted-foreground">{l.counsellor || "Unassigned"}{l.branch ? ` · ${l.branch}` : ""}</p>
                    </td>
                    <td className="px-3 py-3"><ReasonCell reason={e.reason} note={e.note} /></td>
                    <td className="px-3 py-3"><ArchivedCell at={e.archivedAt} by={e.archivedBy} /></td>
                    <td className="px-3 py-3"><RetentionCell kind="leads" archivedAt={e.archivedAt} /></td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button type="button" onClick={() => restore([e.id])} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-semibold text-foreground hover:bg-surface-hover"><RotateCcw className="size-3.5" /> Restore</button>
                        <AnchoredMenu label={`Actions for ${l.name}`} align="end" width={200} trigger={<MoreHorizontal className="size-4" />} triggerClassName="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground">
                          {(close) => (
                            <>
                              <MenuItem icon={Eye} onClick={() => { close(); setViewingId(e.id); }}>View details</MenuItem>
                              <MenuItem icon={PencilLine} onClick={() => { close(); setEditingId(e.id); }}>Edit reason</MenuItem>
                              <MenuItem icon={Mail} onClick={() => { close(); void navigator.clipboard?.writeText(l.email); notify("Email copied"); }}>Copy email</MenuItem>
                              <MenuDivider />
                              <MenuItem icon={Trash2} tone="danger" onClick={() => { close(); setPurging([e.id]); }}>Delete permanently</MenuItem>
                            </>
                          )}
                        </AnchoredMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyArchive filtered={hasFilters} noun="leads" onReset={reset} />}
        </div>
      </Card>

      {viewing && (
        <SlideOver open onClose={() => setViewingId(null)} icon={Archive} title={viewing.record.name} subtitle={`${viewing.record.id} · archived ${formatDay(viewing.archivedAt)}`}
          footer={
            <div className="flex justify-between gap-2">
              <button type="button" onClick={() => setPurging([viewing.id])} className={cn(buttonSecondary, "text-danger hover:bg-danger-soft")}><Trash2 className="size-4" /> Delete</button>
              <button type="button" onClick={() => restore([viewing.id])} className={buttonPrimary}><RotateCcw className="size-4" /> Restore to All Leads</button>
            </div>
          }
        >
          <div className="flex flex-col gap-5">
            <ArchiveInfo kind="leads" entry={viewing} onEdit={() => setEditingId(viewing.id)} />
            <div className="flex gap-2">
              <a href={`tel:${viewing.record.phone}`} className={cn(buttonSecondary, "h-9 flex-1 justify-center")}><Phone className="size-4" /> Call</a>
              <a href={`mailto:${viewing.record.email}`} className={cn(buttonSecondary, "h-9 flex-1 justify-center")}><Mail className="size-4" /> Email</a>
            </div>
            <section>
              <h4 className="mb-3 text-xs font-semibold text-foreground">Lead record</h4>
              <dl className="grid grid-cols-2 gap-4">
                <Detail label="Phone">{viewing.record.phone}</Detail>
                <Detail label="Email">{viewing.record.email}</Detail>
                <Detail label="Country">{viewing.record.country}</Detail>
                <Detail label="Last status">{viewing.record.status}</Detail>
                <Detail label="Branch">{viewing.record.branch || "Not assigned"}</Detail>
                <Detail label="Counsellor">{viewing.record.counsellor || "Unassigned"}</Detail>
                <Detail label="Lead source">{viewing.record.leadSource}</Detail>
                <Detail label="Created">{formatDay(viewing.record.createdDate)}</Detail>
                <Detail label="In pipeline for">{Math.max(0, Math.round((Date.parse(viewing.archivedAt) - Date.parse(viewing.record.createdDate)) / 86_400_000))} days</Detail>
                <Detail label="Lead note" className="col-span-2">{viewing.record.leadNote}</Detail>
              </dl>
            </section>
          </div>
        </SlideOver>
      )}

      {editing && (
        <ArchiveDialog kind="leads" names={[editing.record.name]} initial={editing} onClose={() => setEditingId(null)}
          onConfirm={(meta) => { leadArchive.update(editing.id, meta, user.name); refresh(); setEditingId(null); notify("Archive reason updated"); }} />
      )}
      {purging && (
        <PurgeDialog kind="leads" entries={purging.map((id) => byId(id)!).filter(Boolean)} name={(id) => byId(id)?.record.name ?? id} onClose={() => setPurging(null)} onConfirm={() => purge(purging)} />
      )}
      {toast}
    </div>
  );
}
