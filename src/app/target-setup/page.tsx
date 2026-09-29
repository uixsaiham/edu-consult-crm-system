"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Archive, ArchiveRestore, CheckCircle2, Copy, Download, Gauge, MoreHorizontal, Percent, Plus, SearchX, Target as TargetIcon, Trash2, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { BarButton, HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { Modal } from "@/components/ui/modal";
import { Field, TextInput } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { RowActions } from "@/components/institutions/row-actions";
import { AnchoredMenu, MenuDivider, MenuItem } from "@/components/applications/list/anchored-menu";
import { Tabs } from "@/components/office/office-ui";
import { Avatar, formatDay } from "@/components/people/people-ui";
import { BarLegend, TargetBar, TargetDetail, TargetStatusBadge, statusOrder } from "@/components/targets/target-ui";
import {
  allIntakes,
  clearTargetChange,
  getTargetChange,
  getTargets,
  isClosed,
  measure,
  metricLabel,
  metrics,
  saveTargets,
  scopeLabel,
  scopes,
  targetName,
  type Progress,
  type Target,
  type TargetStatus,
} from "@/lib/mock/targets";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

type Tab = "current" | "finished" | "archived";
const inTab = (t: Target, x: Tab) => (x === "archived" ? t.archived : !t.archived && (x === "finished" ? isClosed(t) : !isClosed(t)));

function TargetListPageInner() {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading targets…</p>}>
      <FromParams />
    </Suspense>
  );
}

function FromParams() {
  const p = useSearchParams();
  return <TargetList key={p.toString()} initialStatus={p.get("status") ?? ""} initialIntake={p.get("intake") ?? ""} />;
}

function TargetList({ initialStatus, initialIntake }: { initialStatus: string; initialIntake: string }) {
  const router = useRouter();
  const [targets, setTargets] = useState<Target[]>(getTargets);
  const [tab, setTab] = useState<Tab>(initialStatus === "Achieved" || initialStatus === "Missed" ? "finished" : "current");
  const [search, setSearch] = useState("");
  const [intake, setIntake] = useState(initialIntake);
  const [scope, setScope] = useState("");
  const [metric, setMetric] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<Target[] | null>(null);
  const [deleting, setDeleting] = useState<Target[] | null>(null);
  const [lastChange] = useState(getTargetChange);
  const [toast, notify] = useToast();

  useEffect(() => saveTargets(targets), [targets]);
  useEffect(() => {
    if (!lastChange) return;
    clearTargetChange();
    notify(lastChange.verb === "updated" ? "Target saved" : lastChange.count > 1 ? `${lastChange.count} targets created` : "Target created");
  }, [lastChange, notify]);

  const progress = useMemo(() => new Map(targets.map((t) => [t.id, measure(t)])), [targets]);
  const prog = (t: Target) => progress.get(t.id) as Progress;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const st = (t: Target) => (progress.get(t.id) as Progress).status;
    return targets
      .filter(
        (t) =>
          inTab(t, tab) &&
          (!intake || t.intake === intake) &&
          (!scope || t.scope === scope) &&
          (!metric || t.metric === metric) &&
          (!status || st(t) === status) &&
          (!q || `${targetName(t)} ${t.owner} ${t.intake} ${t.id} ${t.notes}`.toLowerCase().includes(q))
      )
      .sort((a, b) => statusOrder.indexOf(st(a)) - statusOrder.indexOf(st(b)) || allIntakes.indexOf(a.intake) - allIntakes.indexOf(b.intake) || scopes.indexOf(a.scope) - scopes.indexOf(b.scope));
  }, [targets, tab, search, intake, scope, metric, status, progress]);

  const selection = useRowSelection(filtered.map((t) => t.id));
  const selected = targets.filter((t) => selection.isSelected(t.id));
  const current = targets.filter((t) => inTab(t, "current"));
  const countStatus = (s: TargetStatus) => current.filter((t) => prog(t).status === s).length;
  const hasFilters = !!(search || intake || scope || metric || status);

  const patch = (ids: string[], fn: (t: Target) => Partial<Target>) => {
    const set = new Set(ids);
    setTargets((prev) => prev.map((t) => (set.has(t.id) ? { ...t, ...fn(t) } : t)));
  };

  const exportRows = (rows: Target[], name: string) =>
    downloadCsv(
      name,
      rows.map((t) => {
        const p = prog(t);
        return {
          id: t.id, intake: t.intake, scope: t.scope, for: scopeLabel(t), measure: metricLabel[t.metric], target: t.target, stretch: t.stretch ?? "",
          achieved: p.actual, forecast: p.forecast, expectedByToday: p.expected, percent: `${Math.round((p.actual / Math.max(1, t.target)) * 100)}%`,
          status: p.status, owner: t.owner, windowStart: t.startDate, windowEnd: t.endDate, notes: t.notes,
        };
      })
    );

  const viewing = targets.find((t) => t.id === viewingId);
  const tabCount = (x: Tab) => targets.filter((t) => inTab(t, x)).length;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Targets</h2>
          <p className="mt-1 text-sm text-muted-foreground">Recruitment targets for each intake — measured live against applications, with a forecast from the current pipeline.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => exportRows(filtered, "targets.csv")} className={buttonSecondary}><Download className="size-4" /> Export</button>
          <Link href="/target-setup/overview" className={buttonSecondary}><Gauge className="size-4" /> Overview</Link>
          <Link href="/target-setup/new" className={buttonPrimary}><Plus className="size-4" /> Add target</Link>
        </div>
      </header>

      <StatGrid>
        <StatCard icon={TargetIcon} label="Active targets" value={current.length} note={`${new Set(current.map((t) => t.intake)).size} intakes`} onClick={() => { setTab("current"); setStatus(""); }} />
        <StatCard icon={CheckCircle2} tone="success" label="On track or achieved" value={countStatus("On track") + countStatus("Achieved")} onClick={() => { setTab("current"); setStatus("On track"); }} />
        <StatCard icon={AlertTriangle} tone="warning" label="At risk" value={countStatus("At risk")} note="forecast 85–99%" onClick={() => { setTab("current"); setStatus("At risk"); }} />
        <StatCard icon={TrendingDown} tone="danger" label="Off track" value={countStatus("Off track")} note="forecast < 85%" onClick={() => { setTab("current"); setStatus("Off track"); }} />
      </StatGrid>

      <Tabs<Tab>
        label="Targets"
        value={tab}
        onChange={(t) => { setTab(t); setStatus(""); selection.clear(); }}
        options={[
          { value: "current", label: "Current intakes", count: tabCount("current") },
          { value: "finished", label: "Finished intakes", count: tabCount("finished") },
          { value: "archived", label: "Archived", count: tabCount("archived") },
        ]}
      />

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Branch, counsellor, owner, notes…" label="Search targets" />
        <SelectFilter label="Intake" value={intake} onChange={setIntake} allLabel="All intakes" options={allIntakes.filter((i) => targets.some((t) => t.intake === i && inTab(t, tab))).map((i) => ({ value: i, label: i, hint: targets.filter((t) => t.intake === i && inTab(t, tab)).length }))} />
        <SelectFilter label="Scope" value={scope} onChange={setScope} allLabel="All scopes" options={scopes.map((s) => ({ value: s, label: s, hint: targets.filter((t) => t.scope === s && inTab(t, tab)).length }))} />
        <SelectFilter label="Measure" value={metric} onChange={setMetric} allLabel="All measures" options={metrics.map((m) => ({ value: m, label: metricLabel[m] }))} />
        <SelectFilter label="Status" value={status} onChange={setStatus} allLabel="Any status" options={statusOrder.map((s) => ({ value: s, label: s, hint: targets.filter((t) => inTab(t, tab) && prog(t).status === s).length }))} />
        {hasFilters && <ResetFilters onClick={() => { setSearch(""); setIntake(""); setScope(""); setMetric(""); setStatus(""); }} />}
      </FilterBar>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-2 px-5 pt-5">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{tab === "current" ? "Current targets" : tab === "finished" ? "Finished intakes" : "Archived targets"}</h3>
            <p className="text-xs text-muted-foreground">{filtered.length} target{filtered.length === 1 ? "" : "s"} · most urgent first</p>
          </div>
          <BarLegend />
        </div>
        <SelectionBar selection={selection} noun={["target", "targets"]} onExport={() => exportRows(selected, "targets-selected.csv")} className="mx-5 mt-3">
          {tab !== "archived" && <BarButton onClick={() => setAdjusting(selected)}><Percent className="size-3.5" /> Adjust</BarButton>}
          {tab !== "archived" ? (
            <BarButton onClick={() => { patch(selected.map((t) => t.id), () => ({ archived: true })); notify(`${selected.length} archived`); selection.clear(); }}>Archive</BarButton>
          ) : (
            <BarButton onClick={() => { patch(selected.map((t) => t.id), () => ({ archived: false })); notify(`${selected.length} restored`); selection.clear(); }}>Restore</BarButton>
          )}
          <BarButton tone="danger" onClick={() => setDeleting(selected)}>Delete</BarButton>
        </SelectionBar>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1060px] text-left text-xs">
            <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 py-2.5 pl-5 pr-0"><HeaderCheckbox selection={selection} /></th>
                <th className="py-2.5 pl-3 pr-3">Target</th>
                <th className="px-3 py-2.5">Intake</th>
                <th className="px-3 py-2.5">Progress</th>
                <th className="px-3 py-2.5">Forecast</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Owner</th>
                <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => {
                const p = prog(t);
                const closed = isClosed(t);
                return (
                  <tr key={t.id} className={cn("transition-colors hover:bg-surface-hover/60", selectedRowClass(selection, t.id))}>
                    <td className="py-3 pl-5 pr-0 align-middle"><RowCheckbox selection={selection} id={t.id} label={`Select ${targetName(t)}`} /></td>
                    <td className="max-w-[280px] py-3 pl-3 pr-3">
                      <button type="button" onClick={() => setViewingId(t.id)} className="block max-w-full text-left">
                        <span className="block truncate text-sm font-semibold text-foreground hover:text-primary">{scopeLabel(t)}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="rounded-md bg-surface-muted px-1.5 py-0.5 font-semibold text-foreground">{metricLabel[t.metric]}</span>
                          {t.scope !== "Company" && <span>{t.scope}</span>}
                          <span className="font-mono">{t.id}</span>
                        </span>
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="font-medium text-foreground">{t.intake}</p>
                      <p className="text-[11px] text-muted-foreground">{closed ? `Closed ${formatDay(t.endDate)}` : p.status === "Not started" ? `Opens ${formatDay(t.startDate)}` : `${p.daysLeft} days left`}</p>
                    </td>
                    <td className="w-56 px-3 py-3"><TargetBar target={t.target} progress={p} /></td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="font-semibold tabular-nums text-foreground">{closed ? p.actual : p.forecast}</p>
                      <p className={cn("text-[11px]", p.forecast >= t.target ? "text-success" : "text-muted-foreground")}>
                        {closed ? "final" : p.forecast >= t.target ? `+${p.forecast - t.target} over` : `${t.target - p.forecast} short`}
                      </p>
                    </td>
                    <td className="px-3 py-3"><TargetStatusBadge status={p.status} /></td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2">
                        <Avatar name={t.owner} size="xs" />
                        <span className="max-w-[120px] truncate text-foreground">{t.owner}</span>
                      </span>
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <RowActions onView={() => setViewingId(t.id)} editHref={`/target-setup/${t.id}/edit`} name={targetName(t)} editLabel="Edit target" />
                        <AnchoredMenu label={`More actions for ${targetName(t)}`} align="end" width={200} trigger={<MoreHorizontal className="size-4" />} triggerClassName="flex size-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground shadow-xs transition-colors hover:bg-primary-soft hover:text-primary">
                          {(close) => (
                            <>
                              <MenuItem icon={Copy} onClick={() => { close(); router.push(`/target-setup/new?copy=${t.id}`); }}>Copy to next intake</MenuItem>
                              <MenuItem icon={Percent} onClick={() => { close(); setAdjusting([t]); }}>Adjust target</MenuItem>
                              <MenuItem icon={t.archived ? ArchiveRestore : Archive} onClick={() => { close(); patch([t.id], () => ({ archived: !t.archived })); notify(t.archived ? "Target restored" : "Target archived"); }}>{t.archived ? "Restore" : "Archive"}</MenuItem>
                              <MenuDivider />
                              <MenuItem icon={Trash2} tone="danger" onClick={() => { close(); setDeleting([t]); }}>Delete</MenuItem>
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
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-muted-foreground"><SearchX className="size-5" /></span>
              <p className="text-sm font-medium text-foreground">{hasFilters ? "No targets match" : tab === "archived" ? "Nothing archived" : "No targets here yet"}</p>
              <p className="text-xs text-muted-foreground">{hasFilters ? "Try other filters." : "Set a target for an intake to start tracking it."}</p>
              {!hasFilters && tab !== "archived" && <Link href="/target-setup/new" className={cn(buttonPrimary, "mt-2")}><Plus className="size-4" /> Add target</Link>}
            </div>
          )}
        </div>
      </Card>

      {viewing && <TargetDetail target={viewing} onClose={() => setViewingId(null)} onDuplicate={() => router.push(`/target-setup/new?copy=${viewing.id}`)} />}

      {adjusting && (
        <AdjustDialog
          targets={adjusting}
          onClose={() => setAdjusting(null)}
          onApply={(pct) => {
            patch(adjusting.map((t) => t.id), (t) => ({ target: Math.max(1, Math.round(t.target * (1 + pct / 100))), stretch: t.stretch ? Math.max(2, Math.round(t.stretch * (1 + pct / 100))) : undefined }));
            notify(`${adjusting.length === 1 ? "Target" : `${adjusting.length} targets`} ${pct > 0 ? "raised" : "lowered"} by ${Math.abs(pct)}%`);
            setAdjusting(null);
            selection.clear();
          }}
        />
      )}

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        icon={Trash2}
        size="sm"
        title={deleting?.length === 1 ? `Delete ${targetName(deleting[0])}?` : `Delete ${deleting?.length} targets?`}
        subtitle="Applications aren't affected. To keep the history, archive instead."
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleting(null)} className={buttonSecondary}>Cancel</button>
            <button type="button" onClick={() => { const ids = new Set(deleting!.map((t) => t.id)); setTargets((prev) => prev.filter((t) => !ids.has(t.id))); notify(deleting!.length === 1 ? "Target deleted" : `${deleting!.length} targets deleted`); setDeleting(null); selection.clear(); }} className={buttonDanger}>Delete</button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">Finished-intake targets are useful for comparing next year — archiving keeps them out of the way.</p>
      </Modal>
      {toast}
    </div>
  );
}

function AdjustDialog({ targets, onClose, onApply }: { targets: Target[]; onClose: () => void; onApply: (pct: number) => void }) {
  const [pct, setPct] = useState("10");
  const n = Number(pct);
  const valid = Number.isFinite(n) && n !== 0 && n > -90 && n <= 200;
  return (
    <Modal
      open
      onClose={onClose}
      icon={Percent}
      size="sm"
      title={targets.length === 1 ? `Adjust ${targetName(targets[0])}` : `Adjust ${targets.length} targets`}
      subtitle="Raise or lower by a percentage. Stretch targets move too."
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" disabled={!valid} onClick={() => onApply(n)} className={buttonPrimary}>Apply</button></div>}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {[-10, -5, 5, 10, 15, 20].map((v) => (
            <button key={v} type="button" onClick={() => setPct(String(v))} className={cn("h-8 rounded-full border px-3 text-xs font-semibold", n === v ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground")}>{v > 0 ? `+${v}` : v}%</button>
          ))}
        </div>
        <Field label="Change (%)" hint="Use a minus sign to lower, e.g. -5.">
          <TextInput inputMode="numeric" value={pct} onChange={(e) => setPct(e.target.value.replace(/[^\d-]/g, "").slice(0, 4))} />
        </Field>
        {valid && (
          <ul className="max-h-40 overflow-y-auto rounded-xl border border-border text-xs">
            {targets.map((t) => (
              <li key={t.id} className="flex justify-between gap-2 border-b border-border px-3 py-2 last:border-0">
                <span className="truncate text-foreground">{targetName(t)}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{t.target} → <span className="font-semibold text-foreground">{Math.max(1, Math.round(t.target * (1 + n / 100)))}</span></span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

export default function TargetListPage() { return <Suspense><TargetListPageInner /></Suspense>; }
