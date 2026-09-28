"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Ban, Download, Eye, FileWarning, Hourglass, Mail, MoreHorizontal, PencilLine, Phone, RotateCcw, Trash2, UserCog } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { BarButton, HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { SlideOver } from "@/components/ui/slide-over";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { AnchoredMenu, MenuDivider, MenuItem } from "@/components/applications/list/anchored-menu";
import { formatDay, Meter } from "@/components/people/people-ui";
import { DocStatusBadge, TierBadge } from "@/components/agents/agent-ui";
import { ArchiveDialog, ArchiveInfo, ArchiveNav, ArchivedCell, Detail, EmptyArchive, PurgeDialog, ReasonCell, RetentionCell, retentionOptions } from "@/components/archive/archive-ui";
import { agentApplicationArchive, archiveKinds, archiveReasons, retentionState, retentionUntil, type ArchivedEntry } from "@/lib/mock/archive";
import { docProgress, relationshipManagers, requiredDocs, type Agent } from "@/lib/mock/agents";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

type Entry = ArchivedEntry<Agent>;
type Sort = "" | "oldest" | "name";

/** Where the application stood when it was archived. */
function Outcome({ agent }: { agent: Agent }) {
  return agent.status === "Rejected" ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-danger-soft px-2.5 py-1 text-[11px] font-semibold text-danger"><span className="size-1.5 rounded-full bg-danger" />Rejected</span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-hover px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"><span className="size-1.5 rounded-full bg-muted-foreground" />Closed in review</span>
  );
}

export default function ArchivedAgentApplicationsPage() {
  const { user } = useUser();
  const [items, setItems] = useState<Entry[]>(agentApplicationArchive.list);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const [outcome, setOutcome] = useState("");
  const [country, setCountry] = useState("");
  const [manager, setManager] = useState("");
  const [retention, setRetention] = useState("");
  const [sort, setSort] = useState<Sort>("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [purging, setPurging] = useState<string[] | null>(null);
  const [toast, notify] = useToast();

  const refresh = () => setItems(agentApplicationArchive.list());
  const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter(
        (e) =>
          (!reason || e.reason === reason) &&
          (!outcome || (outcome === "Rejected" ? e.record.status === "Rejected" : e.record.status !== "Rejected")) &&
          (!country || e.record.country === country) &&
          (!manager || e.record.manager === manager) &&
          (!retention || retentionState("agent-applications", e.archivedAt) === retention) &&
          (!q || `${e.record.name} ${e.record.contactName} ${e.record.email} ${e.record.city} ${e.record.country} ${e.record.id}`.toLowerCase().includes(q))
      )
      .sort((a, b) => (sort === "oldest" ? a.archivedAt.localeCompare(b.archivedAt) : sort === "name" ? a.record.name.localeCompare(b.record.name) : b.archivedAt.localeCompare(a.archivedAt)));
  }, [items, search, reason, outcome, country, manager, retention, sort]);

  const selection = useRowSelection(filtered.map((e) => e.id));
  const selected = filtered.filter((e) => selection.isSelected(e.id));
  const hasFilters = !!(search || reason || outcome || country || manager || retention || sort);
  const reset = () => { setSearch(""); setReason(""); setOutcome(""); setCountry(""); setManager(""); setRetention(""); setSort(""); };

  const rejected = items.filter((e) => e.record.status === "Rejected").length;
  const kyc = items.filter((e) => e.reason === "Failed KYC checks").length;
  const due = items.filter((e) => retentionState("agent-applications", e.archivedAt) === "due").length;

  const drop = (ids: string[]) => {
    refresh();
    selection.retain([...selection.selected].filter((id) => !ids.includes(id)));
    if (viewingId && ids.includes(viewingId)) setViewingId(null);
  };
  const restore = (ids: string[]) => {
    const back = agentApplicationArchive.restore(ids, user.name);
    drop(ids);
    notify(back.length === 1 ? `${back[0].name} restored to Pending Agents` : `${back.length} agent applications restored to Pending Agents`);
  };
  const purge = (ids: string[]) => {
    agentApplicationArchive.purge(ids, user.name);
    drop(ids);
    setPurging(null);
    notify(ids.length === 1 ? "Agent application deleted permanently" : `${ids.length} agent applications deleted permanently`);
  };
  const exportRows = (rows: Entry[], file: string) =>
    downloadCsv(file, rows.map((e) => {
      const p = docProgress(e.record);
      return {
        id: e.record.id, agency: e.record.name, type: e.record.type, contact: e.record.contactName, email: e.record.email, phone: e.record.phone, city: e.record.city, country: e.record.country,
        markets: e.record.markets.join("; "), expectedStudents: e.record.expectedStudents, source: e.record.source, manager: e.record.manager, applied: e.record.appliedAt,
        outcome: e.record.status === "Rejected" ? "Rejected" : "Closed in review", rejectionReason: e.record.rejectionReason ?? "", documentsVerified: `${p.verified}/${p.total}`,
        archived: e.archivedAt, archivedBy: e.archivedBy, reason: e.reason, note: e.note, keepUntil: retentionUntil("agent-applications", e.archivedAt),
      };
    }));

  const viewing = items.find((e) => e.id === viewingId);
  const editing = items.find((e) => e.id === editingId);
  const byId = (id: string) => items.find((e) => e.id === id);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Archived Agent Applications</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Partner applications that were rejected, withdrawn or went quiet. KYC evidence is kept for {archiveKinds["agent-applications"].retentionYears} years; restore one to reopen it in Pending Agents.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={() => exportRows(filtered, "archived-agent-applications.csv")} disabled={!filtered.length} className={cn(buttonSecondary, "disabled:opacity-50")}><Download className="size-4" /> Export</button>
          <Link href="/agent-management/pending" className={buttonPrimary}><UserCog className="size-4" /> Pending Agents</Link>
        </div>
      </header>

      <ArchiveNav counts={{ "agent-applications": items.length }} />

      <StatGrid>
        <StatCard icon={Archive} label="Archived applications" value={items.length} onClick={reset} />
        <StatCard icon={Ban} tone="danger" label="Rejected" value={rejected} onClick={() => setOutcome("Rejected")} />
        <StatCard icon={FileWarning} tone="warning" label="Failed KYC" value={kyc} onClick={() => setReason("Failed KYC checks")} />
        <StatCard icon={Hourglass} tone="neutral" label="Closed in review" value={items.length - rejected} note={due ? `${due} due for deletion` : undefined} onClick={() => setOutcome("Closed")} />
      </StatGrid>

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Agency, contact, email, city…" label="Search archived agent applications" />
        <SelectFilter label="Reason" value={reason} onChange={setReason} allLabel="All reasons" width="w-72" options={archiveReasons["agent-applications"].map((r) => ({ value: r, label: r, hint: items.filter((e) => e.reason === r).length }))} />
        <SelectFilter label="Outcome" value={outcome} onChange={setOutcome} allLabel="Any outcome" options={[{ value: "Rejected", label: "Rejected", dot: "bg-danger" }, { value: "Closed", label: "Closed in review", dot: "bg-muted-foreground" }]} />
        <SelectFilter label="Country" value={country} onChange={setCountry} allLabel="All countries" options={uniq(items.map((e) => e.record.country))} />
        <SelectFilter label="Manager" value={manager} onChange={setManager} allLabel="All managers" options={relationshipManagers} />
        <SelectFilter label="Retention" value={retention} onChange={setRetention} allLabel="Any" width="w-60" options={retentionOptions} />
        <SelectFilter label="Sort" value={sort} onChange={(v) => setSort(v as Sort)} allLabel="Recently archived" options={[{ value: "oldest", label: "Oldest archived" }, { value: "name", label: "Agency A–Z" }]} />
        {hasFilters && <ResetFilters onClick={reset} />}
      </FilterBar>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Archive</h3>
          <p className="text-xs text-muted-foreground">Showing {filtered.length} of {items.length} archived agent application{items.length === 1 ? "" : "s"}</p>
        </div>
        <SelectionBar selection={selection} noun={["application", "applications"]} onExport={() => exportRows(selected, "archived-agent-applications-selected.csv")} className="mx-5 mt-3">
          <BarButton onClick={() => restore(selected.map((e) => e.id))}><RotateCcw className="size-3.5" /> Restore</BarButton>
          <BarButton tone="danger" onClick={() => setPurging(selected.map((e) => e.id))}><Trash2 className="size-3.5" /> Delete permanently</BarButton>
        </SelectionBar>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-xs">
            <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 py-2.5 pl-5 pr-0"><HeaderCheckbox selection={selection} label="Select all archived agent applications shown" /></th>
                <th className="py-2.5 pl-3 pr-3">Agency</th>
                <th className="px-3 py-2.5">Recruits from</th>
                <th className="px-3 py-2.5">Outcome</th>
                <th className="px-3 py-2.5">KYC documents</th>
                <th className="px-3 py-2.5">Reason</th>
                <th className="px-3 py-2.5">Archived</th>
                <th className="px-3 py-2.5">Keep until</th>
                <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((e) => {
                const a = e.record;
                const p = docProgress(a);
                return (
                  <tr key={e.id} className={cn("transition-colors hover:bg-surface-hover/60", selectedRowClass(selection, e.id))}>
                    <td className="py-3 pl-5 pr-0 align-middle"><RowCheckbox selection={selection} id={e.id} label={`Select ${a.name}`} /></td>
                    <td className="py-3 pl-3 pr-3">
                      <button type="button" onClick={() => setViewingId(e.id)} className="text-left">
                        <span className="block whitespace-nowrap text-sm font-semibold text-foreground hover:text-primary">{a.name}</span>
                        <span className="block whitespace-nowrap text-[11px] text-muted-foreground">{a.contactName} · <span className="font-mono">{a.id}</span></span>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <p className="whitespace-nowrap font-medium text-foreground">{a.city}, {a.country}</p>
                      <p className="whitespace-nowrap text-[11px] text-muted-foreground">{a.type} · ~{a.expectedStudents}/yr · applied {formatDay(a.appliedAt)}</p>
                    </td>
                    <td className="px-3 py-3"><Outcome agent={a} /></td>
                    <td className="w-44 px-3 py-3">
                      <p className="mb-1 flex justify-between text-[11px]">
                        <span className="font-semibold tabular-nums text-foreground">{p.verified} / {p.total} verified</span>
                        {p.rejected > 0 && <span className="font-semibold text-danger">{p.rejected} rejected</span>}
                      </p>
                      <Meter value={p.verified} max={p.total} tone={p.rejected ? "danger" : p.verified === p.total ? "success" : "primary"} />
                    </td>
                    <td className="px-3 py-3"><ReasonCell reason={e.reason} note={e.note} /></td>
                    <td className="px-3 py-3"><ArchivedCell at={e.archivedAt} by={e.archivedBy} /></td>
                    <td className="px-3 py-3"><RetentionCell kind="agent-applications" archivedAt={e.archivedAt} /></td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button type="button" onClick={() => restore([e.id])} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-semibold text-foreground hover:bg-surface-hover"><RotateCcw className="size-3.5" /> Restore</button>
                        <AnchoredMenu label={`Actions for ${a.name}`} align="end" width={200} trigger={<MoreHorizontal className="size-4" />} triggerClassName="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground">
                          {(close) => (
                            <>
                              <MenuItem icon={Eye} onClick={() => { close(); setViewingId(e.id); }}>View application</MenuItem>
                              <MenuItem icon={PencilLine} onClick={() => { close(); setEditingId(e.id); }}>Edit reason</MenuItem>
                              <MenuItem icon={Mail} onClick={() => { close(); void navigator.clipboard?.writeText(a.email); notify("Email copied"); }}>Copy email</MenuItem>
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
          {filtered.length === 0 && <EmptyArchive filtered={hasFilters} noun="agent applications" onReset={reset} />}
        </div>
      </Card>

      {viewing && (
        <SlideOver open onClose={() => setViewingId(null)} icon={Archive} title={viewing.record.name} subtitle={`${viewing.record.id} · archived ${formatDay(viewing.archivedAt)}`}
          footer={
            <div className="flex justify-between gap-2">
              <button type="button" onClick={() => setPurging([viewing.id])} className={cn(buttonSecondary, "text-danger hover:bg-danger-soft")}><Trash2 className="size-4" /> Delete</button>
              <button type="button" onClick={() => restore([viewing.id])} className={buttonPrimary}><RotateCcw className="size-4" /> Restore to Pending Agents</button>
            </div>
          }
        >
          <AgentFile entry={viewing} onEdit={() => setEditingId(viewing.id)} />
        </SlideOver>
      )}

      {editing && (
        <ArchiveDialog kind="agent-applications" names={[editing.record.name]} initial={editing} onClose={() => setEditingId(null)}
          onConfirm={(meta) => { agentApplicationArchive.update(editing.id, meta, user.name); refresh(); setEditingId(null); notify("Archive reason updated"); }} />
      )}
      {purging && (
        <PurgeDialog kind="agent-applications" entries={purging.map((id) => byId(id)!).filter(Boolean)} name={(id) => byId(id)?.record.name ?? id} onClose={() => setPurging(null)} onConfirm={() => purge(purging)} />
      )}
      {toast}
    </div>
  );
}

function AgentFile({ entry, onEdit }: { entry: Entry; onEdit: () => void }) {
  const a = entry.record;
  return (
    <div className="flex flex-col gap-5">
      <ArchiveInfo kind="agent-applications" entry={entry} onEdit={onEdit} />
      {a.rejectionReason && (
        <p className="flex gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-xs text-foreground"><Ban className="mt-0.5 size-4 shrink-0 text-danger" /><span><span className="font-semibold">Rejected:</span> {a.rejectionReason}</span></p>
      )}
      <div className="flex gap-2">
        <a href={`tel:${a.phone}`} className={cn(buttonSecondary, "h-9 flex-1 justify-center")}><Phone className="size-4" /> Call</a>
        <a href={`mailto:${a.email}`} className={cn(buttonSecondary, "h-9 flex-1 justify-center")}><Mail className="size-4" /> Email</a>
      </div>
      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-foreground">Application</h4>
          <Outcome agent={a} />
        </div>
        <dl className="grid grid-cols-2 gap-4">
          <Detail label="Legal name">{a.legalName}</Detail>
          <Detail label="Type">{a.type}</Detail>
          <Detail label="Contact">{a.contactName} · {a.contactRole}</Detail>
          <Detail label="Location">{a.city}, {a.country}</Detail>
          <Detail label="Email">{a.email}</Detail>
          <Detail label="Phone">{a.phone}</Detail>
          <Detail label="Recruits from">{a.markets.join(", ")}</Detail>
          <Detail label="Sends students to">{a.destinations.join(", ")}</Detail>
          <Detail label="Proposed tier"><TierBadge tier={a.tier} /></Detail>
          <Detail label="Expected students">~{a.expectedStudents} a year</Detail>
          <Detail label="Source">{a.source}</Detail>
          <Detail label="Relationship manager">{a.manager}</Detail>
          <Detail label="Applied">{formatDay(a.appliedAt)}</Detail>
          {a.notes && <Detail label="Notes" className="col-span-2">{a.notes}</Detail>}
        </dl>
      </section>
      <section>
        <h4 className="mb-2 text-xs font-semibold text-foreground">KYC documents</h4>
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {requiredDocs.map((d) => (
            <li key={d.key} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="min-w-0">
                <span className="block text-xs text-foreground">{d.label}</span>
                {a.docs[d.key].fileName && <span className="block truncate font-mono text-[11px] text-muted-foreground">{a.docs[d.key].fileName}</span>}
              </span>
              <DocStatusBadge status={a.docs[d.key].status} />
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h4 className="mb-2 text-xs font-semibold text-foreground">Activity</h4>
        <ol className="flex flex-col gap-3 border-l border-border pl-4">
          {a.activity.map((ev, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-surface bg-border-strong" />
              <p className="text-xs text-foreground">{ev.text}</p>
              <p className="text-[11px] text-muted-foreground">{ev.by} · {formatDay(ev.at)}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
