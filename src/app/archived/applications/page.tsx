"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Download, Eye, FileText, GraduationCap, Mail, MoreHorizontal, PencilLine, Phone, RotateCcw, Trash2, XCircle } from "lucide-react";
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
import { applicationArchive, archiveKinds, archiveReasons, retentionState, retentionUntil, type ArchivedEntry } from "@/lib/mock/archive";
import { applicationStages, applicationStageStyles, type ApplicationRow } from "@/lib/mock/applications";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

type Entry = ArchivedEntry<ApplicationRow>;
type Sort = "" | "oldest" | "name";

function StageBadge({ stage }: { stage: ApplicationRow["stage"] }) {
  const s = applicationStageStyles[stage];
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold", s.bg, s.text)}><span className={cn("size-1.5 rounded-full", s.dot)} />{stage}</span>;
}

export default function ArchivedApplicationsPage() {
  const { user } = useUser();
  const [items, setItems] = useState<Entry[]>(applicationArchive.list);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const [stage, setStage] = useState("");
  const [channel, setChannel] = useState("");
  const [intakeYear, setIntakeYear] = useState("");
  const [counsellor, setCounsellor] = useState("");
  const [retention, setRetention] = useState("");
  const [sort, setSort] = useState<Sort>("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [purging, setPurging] = useState<string[] | null>(null);
  const [toast, notify] = useToast();

  const refresh = () => setItems(applicationArchive.list());
  const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort();
  const yearOf = (intake: string) => intake.slice(-4);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter(
        (e) =>
          (!reason || e.reason === reason) &&
          (!stage || e.record.stage === stage) &&
          (!channel || e.record.channel === channel) &&
          (!intakeYear || yearOf(e.record.intake) === intakeYear) &&
          (!counsellor || e.record.counsellor === counsellor) &&
          (!retention || retentionState("applications", e.archivedAt) === retention) &&
          (!q || `${e.record.applicant} ${e.record.id} ${e.record.email} ${e.record.phone} ${e.record.university} ${e.record.course} ${e.record.studentId} ${e.record.partner ?? ""}`.toLowerCase().includes(q))
      )
      .sort((a, b) => (sort === "oldest" ? a.archivedAt.localeCompare(b.archivedAt) : sort === "name" ? a.record.applicant.localeCompare(b.record.applicant) : b.archivedAt.localeCompare(a.archivedAt)));
  }, [items, search, reason, stage, channel, intakeYear, counsellor, retention, sort]);

  const selection = useRowSelection(filtered.map((e) => e.id));
  const selected = filtered.filter((e) => selection.isSelected(e.id));
  const hasFilters = !!(search || reason || stage || channel || intakeYear || counsellor || retention || sort);
  const reset = () => { setSearch(""); setReason(""); setStage(""); setChannel(""); setIntakeYear(""); setCounsellor(""); setRetention(""); setSort(""); };

  const enrolled = items.filter((e) => e.record.stage === "Enrolled").length;
  const refused = items.filter((e) => e.record.stage === "Rejected").length;
  const withdrawn = items.filter((e) => e.record.stage === "Withdrawn").length;
  const due = items.filter((e) => retentionState("applications", e.archivedAt) === "due").length;

  const drop = (ids: string[]) => {
    refresh();
    selection.retain([...selection.selected].filter((id) => !ids.includes(id)));
    if (viewingId && ids.includes(viewingId)) setViewingId(null);
  };
  const restore = (ids: string[]) => {
    const back = applicationArchive.restore(ids, user.name);
    drop(ids);
    notify(back.length === 1 ? `${back[0].applicant}'s application restored` : `${back.length} applications restored`);
  };
  const purge = (ids: string[]) => {
    applicationArchive.purge(ids, user.name);
    drop(ids);
    setPurging(null);
    notify(ids.length === 1 ? "Application deleted permanently" : `${ids.length} applications deleted permanently`);
  };
  const exportRows = (rows: Entry[], file: string) =>
    downloadCsv(file, rows.map((e) => ({
      id: e.record.id, applicant: e.record.applicant, email: e.record.email, phone: e.record.phone, studentId: e.record.studentId, university: e.record.university, course: e.record.course, intake: e.record.intake,
      finalStage: e.record.stage, funding: e.record.funding, channel: e.record.channel, partner: e.record.partner ?? "", branch: e.record.branch, counsellor: e.record.counsellor,
      archived: e.archivedAt, archivedBy: e.archivedBy, reason: e.reason, note: e.note, keepUntil: retentionUntil("applications", e.archivedAt),
    })));

  const viewing = items.find((e) => e.id === viewingId);
  const editing = items.find((e) => e.id === editingId);
  const byId = (id: string) => items.find((e) => e.id === id);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Archived Applications</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Closed student files from past intakes — enrolled, refused or withdrawn. Kept for {archiveKinds.applications.retentionYears} years for university audits and UKVI compliance; restore one to reopen it.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={() => exportRows(filtered, "archived-applications.csv")} disabled={!filtered.length} className={cn(buttonSecondary, "disabled:opacity-50")}><Download className="size-4" /> Export</button>
          <Link href="/applications" className={buttonPrimary}><FileText className="size-4" /> Applications</Link>
        </div>
      </header>

      <ArchiveNav counts={{ applications: items.length }} />

      <StatGrid>
        <StatCard icon={Archive} label="Archived applications" value={items.length} onClick={reset} />
        <StatCard icon={GraduationCap} tone="success" label="Enrolled & closed" value={enrolled} onClick={() => setStage("Enrolled")} />
        <StatCard icon={XCircle} tone="warning" label="Refused or withdrawn" value={refused + withdrawn} note={`${refused} refused`} onClick={() => setStage(refused >= withdrawn ? "Rejected" : "Withdrawn")} />
        <StatCard icon={Trash2} tone={due ? "danger" : "success"} label="Due for deletion" value={due} note="past retention" onClick={() => setRetention("due")} />
      </StatGrid>

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Student, ID, university, course…" label="Search archived applications" />
        <SelectFilter label="Reason" value={reason} onChange={setReason} allLabel="All reasons" width="w-64" options={archiveReasons.applications.map((r) => ({ value: r, label: r, hint: items.filter((e) => e.reason === r).length }))} />
        <SelectFilter label="Final stage" value={stage} onChange={setStage} allLabel="Any stage" options={applicationStages.filter((s) => items.some((e) => e.record.stage === s)).map((s) => ({ value: s, label: s, dot: applicationStageStyles[s].dot }))} />
        <SelectFilter label="Channel" value={channel} onChange={setChannel} allLabel="All channels" options={["Direct", "Agent", "Affiliate"]} />
        <SelectFilter label="Intake year" value={intakeYear} onChange={setIntakeYear} allLabel="Any year" options={uniq(items.map((e) => yearOf(e.record.intake))).reverse()} />
        <SelectFilter label="Counsellor" value={counsellor} onChange={setCounsellor} allLabel="All counsellors" options={uniq(items.map((e) => e.record.counsellor))} />
        <SelectFilter label="Retention" value={retention} onChange={setRetention} allLabel="Any" width="w-60" options={retentionOptions} />
        <SelectFilter label="Sort" value={sort} onChange={(v) => setSort(v as Sort)} allLabel="Recently archived" options={[{ value: "oldest", label: "Oldest archived" }, { value: "name", label: "Student A–Z" }]} />
        {hasFilters && <ResetFilters onClick={reset} />}
      </FilterBar>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Archive</h3>
          <p className="text-xs text-muted-foreground">Showing {filtered.length} of {items.length} archived application{items.length === 1 ? "" : "s"}</p>
        </div>
        <SelectionBar selection={selection} noun={["application", "applications"]} onExport={() => exportRows(selected, "archived-applications-selected.csv")} className="mx-5 mt-3">
          <BarButton onClick={() => restore(selected.map((e) => e.id))}><RotateCcw className="size-3.5" /> Restore</BarButton>
          <BarButton tone="danger" onClick={() => setPurging(selected.map((e) => e.id))}><Trash2 className="size-3.5" /> Delete permanently</BarButton>
        </SelectionBar>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-xs">
            <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 py-2.5 pl-5 pr-0"><HeaderCheckbox selection={selection} label="Select all archived applications shown" /></th>
                <th className="py-2.5 pl-3 pr-3">Student</th>
                <th className="px-3 py-2.5">University & course</th>
                <th className="px-3 py-2.5">Final stage</th>
                <th className="px-3 py-2.5">Channel & counsellor</th>
                <th className="px-3 py-2.5">Reason</th>
                <th className="px-3 py-2.5">Archived</th>
                <th className="px-3 py-2.5">Keep until</th>
                <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((e) => {
                const a = e.record;
                return (
                  <tr key={e.id} className={cn("transition-colors hover:bg-surface-hover/60", selectedRowClass(selection, e.id))}>
                    <td className="py-3 pl-5 pr-0 align-middle"><RowCheckbox selection={selection} id={e.id} label={`Select ${a.applicant}`} /></td>
                    <td className="py-3 pl-3 pr-3">
                      <button type="button" onClick={() => setViewingId(e.id)} className="flex items-center gap-2.5 text-left">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-[11px] font-semibold text-muted-foreground">{a.initials}</span>
                        <span>
                          <span className="block whitespace-nowrap text-sm font-semibold text-foreground hover:text-primary">{a.applicant}</span>
                          <span className="block whitespace-nowrap font-mono text-[11px] text-muted-foreground">{a.id}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <p className="max-w-60 truncate font-medium text-foreground" title={a.course}>{a.course}</p>
                      <p className="max-w-60 truncate text-[11px] text-muted-foreground">{a.university} · {a.intake}</p>
                    </td>
                    <td className="px-3 py-3"><StageBadge stage={a.stage} /></td>
                    <td className="px-3 py-3">
                      <p className="max-w-48 truncate text-foreground" title={a.partner}>{a.channel}{a.partner ? ` · ${a.partner}` : ""}</p>
                      <p className="max-w-48 truncate text-[11px] text-muted-foreground">{a.counsellor} · {a.branch}</p>
                    </td>
                    <td className="px-3 py-3"><ReasonCell reason={e.reason} note={e.note} /></td>
                    <td className="px-3 py-3"><ArchivedCell at={e.archivedAt} by={e.archivedBy} /></td>
                    <td className="px-3 py-3"><RetentionCell kind="applications" archivedAt={e.archivedAt} /></td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button type="button" onClick={() => restore([e.id])} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-semibold text-foreground hover:bg-surface-hover"><RotateCcw className="size-3.5" /> Restore</button>
                        <AnchoredMenu label={`Actions for ${a.applicant}`} align="end" width={200} trigger={<MoreHorizontal className="size-4" />} triggerClassName="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground">
                          {(close) => (
                            <>
                              <MenuItem icon={Eye} onClick={() => { close(); setViewingId(e.id); }}>View file</MenuItem>
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
          {filtered.length === 0 && <EmptyArchive filtered={hasFilters} noun="applications" onReset={reset} />}
        </div>
      </Card>

      {viewing && (
        <SlideOver open onClose={() => setViewingId(null)} icon={Archive} title={viewing.record.applicant} subtitle={`${viewing.record.id} · archived ${formatDay(viewing.archivedAt)}`}
          footer={
            <div className="flex justify-between gap-2">
              <button type="button" onClick={() => setPurging([viewing.id])} className={cn(buttonSecondary, "text-danger hover:bg-danger-soft")}><Trash2 className="size-4" /> Delete</button>
              <button type="button" onClick={() => restore([viewing.id])} className={buttonPrimary}><RotateCcw className="size-4" /> Restore application</button>
            </div>
          }
        >
          <ApplicationFile entry={viewing} onEdit={() => setEditingId(viewing.id)} />
        </SlideOver>
      )}

      {editing && (
        <ArchiveDialog kind="applications" names={[editing.record.applicant]} initial={editing} onClose={() => setEditingId(null)}
          onConfirm={(meta) => { applicationArchive.update(editing.id, meta, user.name); refresh(); setEditingId(null); notify("Archive reason updated"); }} />
      )}
      {purging && (
        <PurgeDialog kind="applications" entries={purging.map((id) => byId(id)!).filter(Boolean)} name={(id) => byId(id)?.record.applicant ?? id} onClose={() => setPurging(null)} onConfirm={() => purge(purging)} />
      )}
      {toast}
    </div>
  );
}

function ApplicationFile({ entry, onEdit }: { entry: Entry; onEdit: () => void }) {
  const a = entry.record;
  return (
    <div className="flex flex-col gap-5">
      <ArchiveInfo kind="applications" entry={entry} onEdit={onEdit} />
      <div className="flex gap-2">
        <a href={`tel:${a.phone}`} className={cn(buttonSecondary, "h-9 flex-1 justify-center")}><Phone className="size-4" /> Call</a>
        <a href={`mailto:${a.email}`} className={cn(buttonSecondary, "h-9 flex-1 justify-center")}><Mail className="size-4" /> Email</a>
      </div>
      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-foreground">Main course</h4>
          <StageBadge stage={a.stage} />
        </div>
        <dl className="grid grid-cols-2 gap-4">
          <Detail label="Course" className="col-span-2">{a.course}</Detail>
          <Detail label="University">{a.university}</Detail>
          <Detail label="Campus">{a.campus}</Detail>
          <Detail label="Intake">{a.intake}</Detail>
          <Detail label="Level & mode">{a.level} · {a.mode}</Detail>
          <Detail label="Funding">{a.funding}</Detail>
          <Detail label="Student ID">{a.studentId || "Not issued"}</Detail>
        </dl>
      </section>
      <section>
        <h4 className="mb-3 text-xs font-semibold text-foreground">Student & ownership</h4>
        <dl className="grid grid-cols-2 gap-4">
          <Detail label="Phone">{a.phone}</Detail>
          <Detail label="Email">{a.email}</Detail>
          <Detail label="Branch">{a.branch}</Detail>
          <Detail label="Counsellor">{a.counsellor}</Detail>
          <Detail label="Channel">{a.channel}{a.partner ? ` · ${a.partner}` : ""}</Detail>
          <Detail label="Source">{a.source}</Detail>
          <Detail label="Created">{formatDay(a.createdAt)}</Detail>
          <Detail label="Last updated">{formatDay(a.updatedAt)}</Detail>
        </dl>
      </section>
      {a.courseOptions.length > 0 && (
        <section>
          <h4 className="mb-2 text-xs font-semibold text-foreground">Other course choices</h4>
          <ul className="flex flex-col gap-1.5">
            {a.courseOptions.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-foreground">{o.course}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{o.university} · {o.intake}</span>
                </span>
                <StageBadge stage={o.stage} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h4 className="mb-2 text-xs font-semibold text-foreground">History</h4>
        <dl className="mb-3 grid grid-cols-3 gap-2">
          {[["Notes", a.notes.length], ["Follow-ups", a.followUps.length], ["Meetings", a.meetings.length]].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-surface-muted px-3 py-2"><dt className="text-[11px] text-muted-foreground">{k}</dt><dd className="text-base font-semibold tabular-nums text-foreground">{v}</dd></div>
          ))}
        </dl>
        {a.notes.length ? (
          <ul className="flex flex-col gap-2">
            {a.notes.map((n, i) => (
              <li key={i} className="rounded-xl border border-border px-3 py-2">
                <p className="text-xs text-foreground">{n.text}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{n.author} · {formatDay(n.at)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No notes on this file.</p>
        )}
      </section>
    </div>
  );
}
