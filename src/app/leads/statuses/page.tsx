"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, fieldClass } from "@/components/ui/form-controls";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { SlideOver } from "@/components/ui/slide-over";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { IconButton, Switch } from "@/components/settings/list-controls";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useSettingsStore } from "@/lib/settings/store";
import { leadStatusGroupHints, leadStatusStore, type LeadStatusOption } from "@/lib/settings/lead-statuses";
import { newProcessId } from "@/lib/settings/application-process";
import { leadStatuses, leadStatusStyles, type LeadStatus } from "@/lib/mock/leads";
import { cn } from "@/lib/utils";

const groupOptions = leadStatuses.map((g) => ({ value: g, label: g, dot: leadStatusStyles[g].dot }));
const stateOptions = [
  { value: "on", label: "Active" },
  { value: "off", label: "Inactive" },
];

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const cleanName = (s: string) => s.trim().replace(/\s+/g, " ");

export default function LeadStatusesPage() {
  const statuses = useSettingsStore(leadStatusStore);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("");
  const [state, setState] = useState("");
  const [editing, setEditing] = useState<LeadStatusOption | null>(null);
  const [deleting, setDeleting] = useState<LeadStatusOption | null>(null);
  const [toast, showToast] = useToast();

  const hasFilters = Boolean(search || group || state);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return statuses.filter((s) => (!q || s.name.toLowerCase().includes(q)) && (!group || s.group === group) && (!state || s.active === (state === "on")));
  }, [statuses, search, group, state]);
  const groups = leadStatuses.filter((g) => !hasFilters || visible.some((s) => s.group === g));
  const activeCount = statuses.filter((s) => s.active).length;

  const findClash = (name: string, id?: string) => statuses.find((s) => s.id !== id && s.name.toLowerCase() === name.toLowerCase());
  const save = (next: LeadStatusOption[], message: string) => {
    leadStatusStore.set(next);
    showToast(message);
  };
  const add = (name: string, g: LeadStatus) => save([...statuses, { id: newProcessId(), name, group: g, active: true, createdAt: new Date().toISOString() }], `${name} added to ${g}`);
  const update = (item: LeadStatusOption) => {
    save(statuses.map((s) => (s.id === item.id ? item : s)), "Status updated");
    setEditing(null);
  };
  const toggle = (item: LeadStatusOption) => save(statuses.map((s) => (s.id === item.id ? { ...s, active: !s.active } : s)), `${item.name} turned ${item.active ? "off" : "on"}`);
  const remove = () => {
    if (!deleting) return;
    save(statuses.filter((s) => s.id !== deleting.id), "Status deleted");
    setDeleting(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <header>
        <div className="flex items-center gap-2.5">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Lead statuses</h2>
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
            {activeCount} of {statuses.length} active
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Detailed statuses counsellors can set on a lead, grouped under the six pipeline stages.</p>
      </header>

      <QuickAdd onAdd={add} findClash={findClash} />

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search statuses…" label="Search statuses" />
        <SelectFilter label="Group" value={group} onChange={setGroup} options={groupOptions} allLabel="All groups" />
        <SelectFilter label="State" value={state} onChange={setState} options={stateOptions} allLabel="Active and inactive" />
        {hasFilters && <ResetFilters onClick={() => { setSearch(""); setGroup(""); setState(""); }} />}
      </FilterBar>

      {/* Masonry columns: each card sits right under the one above, so short groups leave no gaps. */}
      <div className="columns-1 gap-3 lg:columns-2 [&>*]:mb-3 [&>*]:break-inside-avoid">
        {groups.map((g) => {
          const rows = visible.filter((s) => s.group === g);
          const style = leadStatusStyles[g];
          return (
            <Card key={g} className="overflow-hidden rounded-2xl">
              <section aria-labelledby={`group-${g}`}>
                <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl", style.bg)}>
                    <span className={cn("size-2.5 rounded-full", style.dot)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 id={`group-${g}`} className="text-[15px] font-semibold tracking-tight text-foreground">{g}</h3>
                    <p className="truncate text-xs text-muted-foreground">{leadStatusGroupHints[g]}</p>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">{rows.length}</span>
                </div>
                {rows.length > 0 ? (
                  <ul className="divide-y divide-border/70 border-t border-border">
                    {rows.map((s) => (
                      <li key={s.id} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-hover/60 sm:px-5">
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate text-sm font-medium", s.active ? "text-foreground" : "text-muted-foreground")}>{s.name}</p>
                          <p className="text-[11px] text-muted-foreground">{s.active ? "Active" : "Off"} · Added {dateLabel(s.createdAt)}</p>
                        </div>
                        <Switch on={s.active} onChange={() => toggle(s)} label={`${s.name} active`} />
                        <div className="flex items-center gap-1">
                          <IconButton label="Edit status" icon={Pencil} onClick={() => setEditing(s)} />
                          <IconButton label="Delete status" icon={Trash2} tone="danger" onClick={() => setDeleting(s)} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="border-t border-border px-5 py-4 text-xs text-muted-foreground">No detailed statuses yet. Leads here just show “{g}”.</p>
                )}
              </section>
            </Card>
          );
        })}
      </div>

      {groups.length === 0 && (
        <Card className="rounded-2xl px-6 py-14 text-center">
          <p className="text-sm font-medium text-foreground">No statuses match these filters</p>
          <p className="mt-1 text-xs text-muted-foreground">Try a different search or reset the filters.</p>
        </Card>
      )}

      {editing && <EditStatus key={editing.id} initial={editing} findClash={findClash} onClose={() => setEditing(null)} onSave={update} />}

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        icon={Trash2}
        size="sm"
        title={`Delete ${deleting?.name ?? ""}?`}
        subtitle="This can't be undone"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleting(null)} className={buttonSecondary}>Cancel</button>
            <button type="button" onClick={remove} className={buttonDanger}>Delete</button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">Counsellors won&apos;t be able to pick it any more. To keep it on existing leads, turn it off instead.</p>
      </Modal>
      {toast}
    </div>
  );
}

function QuickAdd({ onAdd, findClash }: { onAdd: (name: string, group: LeadStatus) => void; findClash: (name: string) => LeadStatusOption | undefined }) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState<LeadStatus>("Follow-up");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const clean = cleanName(name);
    if (!clean) return setError("Enter a status name.");
    const clash = findClash(clean);
    if (clash) return setError(`“${clash.name}” already exists under ${clash.group}.`);
    onAdd(clean, group);
    setName("");
  }

  return (
    <Card className="rounded-2xl p-4 sm:px-5">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="New status" className="flex-1">
          <input value={name} onChange={(e) => { setName(e.target.value); setError(""); }} maxLength={40} placeholder="e.g. Waiting for IELTS result" className={fieldClass} />
        </Field>
        <Field label="Group" className="sm:w-48">
          <select value={group} onChange={(e) => setGroup(e.target.value as LeadStatus)} className={fieldClass}>
            {leadStatuses.map((g) => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <button type="submit" className={cn(buttonPrimary, "sm:mb-px")}>
          <Plus className="size-4" /> Add status
        </button>
      </form>
      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
    </Card>
  );
}

function EditStatus({ initial, findClash, onClose, onSave }: { initial: LeadStatusOption; findClash: (name: string, id?: string) => LeadStatusOption | undefined; onClose: () => void; onSave: (item: LeadStatusOption) => void }) {
  const [name, setName] = useState(initial.name);
  const [group, setGroup] = useState<LeadStatus>(initial.group);
  const [active, setActive] = useState(initial.active);
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const clean = cleanName(name);
    if (!clean) return setError("Enter a status name.");
    const clash = findClash(clean, initial.id);
    if (clash) return setError(`“${clash.name}” already exists under ${clash.group}.`);
    onSave({ ...initial, name: clean, group, active });
  }

  return (
    <SlideOver
      open
      onClose={onClose}
      icon={Tags}
      title="Edit lead status"
      subtitle={`Added ${dateLabel(initial.createdAt)}`}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button type="submit" form="lead-status-form" className={buttonPrimary}>Save changes</button>
        </div>
      }
    >
      <form id="lead-status-form" onSubmit={submit} className="flex flex-col gap-5">
        <Field label="Status name" required>
          <input autoFocus value={name} onChange={(e) => { setName(e.target.value); setError(""); }} maxLength={40} className={fieldClass} />
        </Field>
        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-foreground">Group</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {leadStatuses.map((g) => (
              <label key={g} className={cn("flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors", group === g ? "border-primary bg-primary-soft/40" : "border-border hover:bg-surface-hover")}>
                <input type="radio" name="group" value={g} checked={group === g} onChange={() => setGroup(g)} className="sr-only" />
                <span className={cn("mt-1 size-2 shrink-0 rounded-full", leadStatusStyles[g].dot)} />
                <span>
                  <span className="block text-xs font-semibold text-foreground">{g}</span>
                  <span className="block text-[11px] leading-snug text-muted-foreground">{leadStatusGroupHints[g]}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border px-4 py-3">
          <span>
            <span className="block text-sm font-medium text-foreground">Active</span>
            <span className="block text-xs text-muted-foreground">Inactive statuses stay on existing leads but can&apos;t be picked.</span>
          </span>
          <Switch on={active} onChange={() => setActive(!active)} label="Active" />
        </div>
        {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </form>
    </SlideOver>
  );
}
