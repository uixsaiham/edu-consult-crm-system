"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, ChevronRight, ListChecks, Pencil, Plus, Route, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, fieldClass } from "@/components/ui/form-controls";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { SlideOver } from "@/components/ui/slide-over";
import { Modal } from "@/components/ui/modal";
import { IconButton, Switch } from "@/components/settings/list-controls";
import { useToast } from "@/components/ui/toast";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useSettingsStore } from "@/lib/settings/store";
import {
  applicationProcessStore,
  matchesTrack,
  newProcessId,
  processOutcomes,
  processTracks,
  type ProcessOutcome,
  type ProcessStage,
  type ProcessStatus,
  type ProcessTrack,
} from "@/lib/settings/application-process";
import { cn } from "@/lib/utils";

type Editing =
  | { kind: "status"; status?: ProcessStatus; stageId?: string }
  | { kind: "stage"; stage?: ProcessStage };
type Deleting = { kind: "status"; status: ProcessStatus } | { kind: "stage"; stage: ProcessStage };

const trackOptions = [
  { value: "International", label: "International" },
  { value: "EU/Home", label: "EU/Home" },
];
const stateOptions = [
  { value: "on", label: "Active" },
  { value: "off", label: "Inactive" },
];
const outcomeOptions = (Object.keys(processOutcomes) as ProcessOutcome[]).map((o) => ({ value: o, label: processOutcomes[o].label, dot: processOutcomes[o].dot }));

const dateLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function ApplicationProcessPage() {
  const process = useSettingsStore(applicationProcessStore);
  const { stages, statuses } = process;
  const [search, setSearch] = useState("");
  const [track, setTrack] = useState("");
  const [outcome, setOutcome] = useState("");
  const [state, setState] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<Deleting | null>(null);
  const [toast, showToast] = useToast();

  const hasFilters = Boolean(search || track || outcome || state);
  const visibleByStage = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, ProcessStatus[]>();
    for (const s of statuses) {
      const stageName = stages.find((st) => st.id === s.stageId)?.name.toLowerCase() ?? "";
      if (q && !s.name.toLowerCase().includes(q) && !stageName.includes(q)) continue;
      if (!matchesTrack(s, track) || (outcome && s.outcome !== outcome) || (state && s.active !== (state === "on"))) continue;
      map.set(s.stageId, [...(map.get(s.stageId) ?? []), s]);
    }
    return map;
  }, [statuses, stages, search, track, outcome, state]);
  const shownStages = hasFilters ? stages.filter((st) => visibleByStage.has(st.id)) : stages;

  const save = (next: typeof process, message: string) => {
    applicationProcessStore.set(next);
    showToast(message);
  };
  const saveStatus = (item: ProcessStatus) => {
    const exists = statuses.some((s) => s.id === item.id);
    save({ ...process, statuses: exists ? statuses.map((s) => (s.id === item.id ? item : s)) : [...statuses, item] }, exists ? "Status updated" : "Status added");
    setEditing(null);
  };
  const saveStage = (item: ProcessStage) => {
    const exists = stages.some((s) => s.id === item.id);
    save({ ...process, stages: exists ? stages.map((s) => (s.id === item.id ? item : s)) : [...stages, item] }, exists ? "Stage updated" : "Stage added");
    setEditing(null);
  };
  const toggleStatus = (item: ProcessStatus) =>
    save({ ...process, statuses: statuses.map((s) => (s.id === item.id ? { ...s, active: !s.active } : s)) }, `${item.name} ${item.active ? "turned off" : "turned on"}`);
  const moveStage = (index: number, by: -1 | 1) => {
    const next = [...stages];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    applicationProcessStore.set({ ...process, stages: next });
  };
  const confirmDelete = () => {
    if (!deleting) return;
    if (deleting.kind === "status") save({ ...process, statuses: statuses.filter((s) => s.id !== deleting.status.id) }, "Status deleted");
    else save({ stages: stages.filter((s) => s.id !== deleting.stage.id), statuses: statuses.filter((s) => s.stageId !== deleting.stage.id) }, "Stage deleted");
    setDeleting(null);
  };
  const resetFilters = () => {
    setSearch("");
    setTrack("");
    setOutcome("");
    setState("");
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Application process</h2>
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
              {stages.length} stages · {statuses.length} statuses
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">The steps an application moves through, and the statuses counsellors can set at each step.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button type="button" onClick={() => setEditing({ kind: "stage" })} className={buttonSecondary}>
            <Plus className="size-4" /> Add stage
          </button>
          <button type="button" onClick={() => setEditing({ kind: "status" })} disabled={stages.length === 0} className={buttonPrimary}>
            <Plus className="size-4" /> Add status
          </button>
        </div>
      </header>

      {/* Pipeline overview */}
      {stages.length > 0 && (
        <nav aria-label="Stages in order" className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-border bg-surface p-2 card-shadow">
          {stages.map((st, i) => (
            <div key={st.id} className="flex shrink-0 items-center gap-1">
              {i > 0 && <ChevronRight aria-hidden="true" className="size-3.5 text-muted-foreground/60" />}
              <a href={`#stage-${st.id}`} className={cn("flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover", st.active ? "text-foreground" : "text-muted-foreground line-through")}>
                <span className="flex size-5 items-center justify-center rounded-full bg-primary-soft text-[10px] font-bold tabular-nums text-primary">{i + 1}</span>
                {st.name}
                <span className="tabular-nums text-muted-foreground">{statuses.filter((s) => s.stageId === st.id).length}</span>
              </a>
            </div>
          ))}
        </nav>
      )}

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search statuses or stages…" label="Search statuses" />
        <SelectFilter label="Applies to" value={track} onChange={setTrack} options={trackOptions} allLabel="All students" />
        <SelectFilter label="Meaning" value={outcome} onChange={setOutcome} options={outcomeOptions} allLabel="All meanings" />
        <SelectFilter label="State" value={state} onChange={setState} options={stateOptions} allLabel="Active and inactive" />
        {hasFilters && <ResetFilters onClick={resetFilters} />}
      </FilterBar>

      <div className="flex flex-col gap-3">
        {shownStages.map((st) => {
          const index = stages.indexOf(st);
          const rows = hasFilters ? visibleByStage.get(st.id) ?? [] : statuses.filter((s) => s.stageId === st.id);
          const total = statuses.filter((s) => s.stageId === st.id);
          return (
            <Card key={st.id} className="scroll-mt-24 overflow-hidden rounded-2xl">
              <section id={`stage-${st.id}`} aria-labelledby={`stage-title-${st.id}`}>
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-xs font-bold tabular-nums text-primary">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 id={`stage-title-${st.id}`} className="truncate text-[15px] font-semibold tracking-tight text-foreground">{st.name}</h3>
                      {!st.active && <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Hidden</span>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {st.description || "No description"} · {total.filter((s) => s.active).length} of {total.length} active
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconButton label="Move up" disabled={index === 0 || hasFilters} onClick={() => moveStage(index, -1)} icon={ArrowUp} />
                    <IconButton label="Move down" disabled={index === stages.length - 1 || hasFilters} onClick={() => moveStage(index, 1)} icon={ArrowDown} />
                    <IconButton label="Edit stage" onClick={() => setEditing({ kind: "stage", stage: st })} icon={Pencil} />
                    <IconButton label="Delete stage" tone="danger" onClick={() => setDeleting({ kind: "stage", stage: st })} icon={Trash2} />
                  </div>
                </div>

                {rows.length > 0 && (
                  <ul className="divide-y divide-border/70 border-t border-border">
                    {rows.map((s) => (
                      <StatusRow key={s.id} status={s} onToggle={() => toggleStatus(s)} onEdit={() => setEditing({ kind: "status", status: s })} onDelete={() => setDeleting({ kind: "status", status: s })} />
                    ))}
                  </ul>
                )}
                <div className={cn("px-4 py-2 sm:px-5", rows.length > 0 ? "border-t border-border/70" : "border-t border-border")}>
                  <button type="button" onClick={() => setEditing({ kind: "status", stageId: st.id })} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-soft">
                    <Plus className="size-3.5" /> Add status to {st.name}
                  </button>
                </div>
              </section>
            </Card>
          );
        })}

        {shownStages.length === 0 && (
          <Card className="rounded-2xl px-6 py-14 text-center">
            <p className="text-sm font-medium text-foreground">{hasFilters ? "No statuses match these filters" : "No stages yet"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{hasFilters ? "Try a different search or reset the filters." : "Add the first stage of your application process."}</p>
          </Card>
        )}
      </div>

      {editing?.kind === "status" && (
        <StatusForm key={editing.status?.id ?? "new"} initial={editing.status} stageId={editing.stageId} stages={stages} statuses={statuses} onClose={() => setEditing(null)} onSave={saveStatus} />
      )}
      {editing?.kind === "stage" && <StageForm key={editing.stage?.id ?? "new"} initial={editing.stage} stages={stages} onClose={() => setEditing(null)} onSave={saveStage} />}

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        icon={Trash2}
        size="sm"
        title={deleting?.kind === "stage" ? `Delete the ${deleting.stage.name} stage?` : `Delete ${deleting?.status.name ?? ""}?`}
        subtitle="This can't be undone"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleting(null)} className={buttonSecondary}>Cancel</button>
            <button type="button" onClick={confirmDelete} className={buttonDanger}>Delete</button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          {deleting?.kind === "stage"
            ? `Its ${statuses.filter((s) => s.stageId === deleting.stage.id).length} statuses will be deleted too. To keep them out of use without losing them, hide the stage instead.`
            : "Counsellors won't be able to pick it any more. To keep it for old applications, turn it off instead."}
        </p>
      </Modal>
      {toast}
    </div>
  );
}

function StatusRow({ status, onToggle, onEdit, onDelete }: { status: ProcessStatus; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const meaning = processOutcomes[status.outcome];
  return (
    <li className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-hover/60 sm:px-5">
      <span className={cn("size-2 shrink-0 rounded-full", status.active ? meaning.dot : "bg-border-strong")} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", status.active ? "text-foreground" : "text-muted-foreground")}>{status.name}{!status.active && <span className="ml-1.5 text-[11px] font-normal">· Off</span>}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          <span className={meaning.text}>{meaning.label}</span> · {status.track === "Both" ? "EU/Home and International" : status.track}
        </p>
      </div>
      <Switch on={status.active} onChange={onToggle} label={`${status.name} active`} />
      <div className="flex items-center gap-1">
        <IconButton label="Edit status" onClick={onEdit} icon={Pencil} />
        <IconButton label="Delete status" tone="danger" onClick={onDelete} icon={Trash2} />
      </div>
    </li>
  );
}

function StatusForm({
  initial,
  stageId,
  stages,
  statuses,
  onClose,
  onSave,
}: {
  initial?: ProcessStatus;
  stageId?: string;
  stages: ProcessStage[];
  statuses: ProcessStatus[];
  onClose: () => void;
  onSave: (item: ProcessStatus) => void;
}) {
  const [stage, setStage] = useState(initial?.stageId ?? stageId ?? stages[0]?.id ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [track, setTrack] = useState<ProcessTrack>(initial?.track ?? "International");
  const [outcome, setOutcome] = useState<ProcessOutcome>(initial?.outcome ?? "active");
  const [active, setActive] = useState(initial?.active ?? true);
  const [error, setError] = useState("");
  const stageName = stages.find((s) => s.id === stage)?.name ?? "";

  function submit(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, " ");
    if (!stage) return setError("Choose a stage.");
    if (!clean) return setError("Enter a status name.");
    const clash = statuses.find((s) => s.stageId === stage && s.id !== initial?.id && s.name.toLowerCase() === clean.toLowerCase());
    if (clash) return setError(`${stageName} already has a status called “${clash.name}”.`);
    onSave({ id: initial?.id ?? newProcessId(), stageId: stage, name: clean, track, outcome, active, createdAt: initial?.createdAt ?? new Date().toISOString().slice(0, 10) });
  }

  return (
    <SlideOver
      open
      onClose={onClose}
      icon={ListChecks}
      title={initial ? "Edit status" : "Add status"}
      subtitle={initial ? `Added ${dateLabel(initial.createdAt)}` : "A status counsellors can set on an application"}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button type="submit" form="status-form" className={buttonPrimary}>{initial ? "Save changes" : "Add status"}</button>
        </div>
      }
    >
      <form id="status-form" onSubmit={submit} className="flex flex-col gap-5">
        <Field label="Stage" required>
          <select value={stage} onChange={(e) => { setStage(e.target.value); setError(""); }} className={fieldClass}>
            {stages.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.name}</option>)}
          </select>
        </Field>
        <Field label="Status name" required hint="Say what happened, e.g. “Interview pending” or “Visa granted”.">
          <input autoFocus value={name} onChange={(e) => { setName(e.target.value); setError(""); }} maxLength={48} placeholder="e.g. Interview pending" className={fieldClass} />
        </Field>
        <Field label="Applies to">
          <Segmented value={track} onChange={setTrack} options={processTracks.map((t) => ({ value: t, label: t }))} />
        </Field>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-xs font-semibold text-foreground">What it means</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(Object.keys(processOutcomes) as ProcessOutcome[]).map((o) => {
              const m = processOutcomes[o];
              const selected = outcome === o;
              return (
                <label key={o} className={cn("flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors", selected ? "border-primary bg-primary-soft/40" : "border-border hover:bg-surface-hover")}>
                  <input type="radio" name="outcome" value={o} checked={selected} onChange={() => setOutcome(o)} className="sr-only" />
                  <span className={cn("mt-1 size-2 shrink-0 rounded-full", m.dot)} />
                  <span>
                    <span className="block text-xs font-semibold text-foreground">{m.label}</span>
                    <span className="block text-[11px] leading-snug text-muted-foreground">{m.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border px-4 py-3">
          <span>
            <span className="block text-sm font-medium text-foreground">Active</span>
            <span className="block text-xs text-muted-foreground">Inactive statuses stay on old applications but can&apos;t be picked.</span>
          </span>
          <Switch on={active} onChange={() => setActive(!active)} label="Active" />
        </div>

        <div className="rounded-2xl bg-surface-muted/60 p-3">
          <p className="mb-2 text-[11px] font-medium text-muted-foreground">Preview</p>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", processOutcomes[outcome].bg, processOutcomes[outcome].text)}>
            <span className={cn("size-1.5 rounded-full", processOutcomes[outcome].dot)} />
            {name.trim() || "Status name"}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">in {stageName || "—"}</span>
        </div>

        {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </form>
    </SlideOver>
  );
}

function StageForm({ initial, stages, onClose, onSave }: { initial?: ProcessStage; stages: ProcessStage[]; onClose: () => void; onSave: (item: ProcessStage) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean) return setError("Enter a stage name.");
    if (stages.some((s) => s.id !== initial?.id && s.name.toLowerCase() === clean.toLowerCase())) return setError(`There's already a stage called “${clean}”.`);
    onSave({ id: initial?.id ?? newProcessId(), name: clean, description: description.trim(), active });
  }

  return (
    <SlideOver
      open
      onClose={onClose}
      icon={Route}
      title={initial ? "Edit stage" : "Add stage"}
      subtitle={initial ? initial.name : `Added as step ${stages.length + 1}. You can reorder it afterwards.`}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button type="submit" form="stage-form" className={buttonPrimary}>{initial ? "Save changes" : "Add stage"}</button>
        </div>
      }
    >
      <form id="stage-form" onSubmit={submit} className="flex flex-col gap-5">
        <Field label="Stage name" required>
          <input autoFocus value={name} onChange={(e) => { setName(e.target.value); setError(""); }} maxLength={40} placeholder="e.g. Visa decision" className={fieldClass} />
        </Field>
        <Field label="Description" hint="One line so counsellors know what this step covers.">
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={80} placeholder="e.g. Outcome of the visa application" className={fieldClass} />
        </Field>
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border px-4 py-3">
          <span>
            <span className="block text-sm font-medium text-foreground">Show this stage</span>
            <span className="block text-xs text-muted-foreground">Hidden stages and their statuses can&apos;t be picked on applications.</span>
          </span>
          <Switch on={active} onChange={() => setActive(!active)} label="Show this stage" />
        </div>
        {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </form>
    </SlideOver>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div role="radiogroup" className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-xl bg-surface-muted p-1">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className={cn("h-8 rounded-lg text-xs font-medium transition-colors", value === o.value ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

