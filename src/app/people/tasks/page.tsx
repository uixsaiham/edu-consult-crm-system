"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, BellRing, CalendarClock, Clock3, ListChecks, Plus, RotateCcw, Save, Trash2, Workflow, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Checkbox, Field, PillGroup, Select, TextInput } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { useToast } from "@/components/ui/toast";
import { StatusSwitch } from "@/components/institutions/row-actions";
import {
  getTaskSettings,
  saveTaskSettings,
  type AssignRule,
  type AutomationRule,
  type TaskPriority,
  type TaskSettings,
  type TaskType,
} from "@/lib/mock/staff";
import { cn } from "@/lib/utils";

type Tab = "types" | "rules" | "hours";
const priorities: TaskPriority[] = ["Low", "Normal", "High", "Urgent"];
const assignRules: AssignRule[] = ["Record owner", "Round robin in team", "Team lead", "Least busy in branch"];
const reminders: [number, string][] = [[0, "No reminder"], [15, "15 min before"], [30, "30 min before"], [60, "1 hour before"], [120, "2 hours before"], [1440, "1 day before"]];
const categories: TaskType["category"][] = ["Leads", "Applications", "Compliance", "Admin"];
const triggers = ["Lead created", "Lead status changed", "Lead not contacted", "Application status changed", "Document requested", "Meeting booked", "Student Finance status changed"];
const weekdays = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const priorityStyle: Record<TaskPriority, string> = {
  Low: "bg-surface-hover text-muted-foreground",
  Normal: "bg-primary-soft text-primary",
  High: "bg-warning-soft text-warning",
  Urgent: "bg-danger-soft text-danger",
};
const inline = "h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus:border-primary focus:outline-none";

export default function TaskSettingsPage() {
  const [saved, setSaved] = useState<TaskSettings>(getTaskSettings);
  const [draft, setDraft] = useState<TaskSettings>(() => structuredClone(saved));
  const [tab, setTab] = useState<Tab>("types");
  const [adding, setAdding] = useState<"type" | "rule" | null>(null);
  const [toast, notify] = useToast();
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);

  const patchType = (id: string, patch: Partial<TaskType>) => setDraft((d) => ({ ...d, types: d.types.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const patchRule = (id: string, patch: Partial<AutomationRule>) => setDraft((d) => ({ ...d, rules: d.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const typeName = (id: string) => draft.types.find((t) => t.id === id);

  const save = () => {
    saveTaskSettings(draft);
    setSaved(structuredClone(draft));
    notify("Task settings saved — new tasks will use them straight away");
  };

  const activeRules = draft.rules.filter((r) => r.active);
  const runs = activeRules.reduce((n, r) => n + r.runs30d, 0);

  return (
    <div className="flex flex-col gap-4 pb-16">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Task settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Control which tasks the CRM creates, who gets them, when they&apos;re due and when they escalate.</p>
      </header>

      <StatGrid>
        <StatCard icon={ListChecks} label="Active task types" value={draft.types.filter((t) => t.active).length} note={`of ${draft.types.length}`} onClick={() => setTab("types")} />
        <StatCard icon={Zap} tone="violet" label="Automation rules on" value={activeRules.length} note={`of ${draft.rules.length}`} onClick={() => setTab("rules")} />
        <StatCard icon={Workflow} tone="teal" label="Tasks auto-created (30 days)" value={runs.toLocaleString()} />
        <StatCard icon={BellRing} tone="warning" label="Escalate overdue after" value={`${draft.escalateAfterHours} h`} note={draft.escalateTo} onClick={() => setTab("hours")} />
      </StatGrid>

      <PillGroup
        options={[
          { value: "types", label: `Task types · ${draft.types.length}` },
          { value: "rules", label: `Automation rules · ${draft.rules.length}` },
          { value: "hours", label: "Working hours & escalation" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "types" && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Task types</h3>
              <p className="text-xs text-muted-foreground">Default due time, priority, owner and reminder for each kind of task.</p>
            </div>
            <button type="button" onClick={() => setAdding("type")} className={buttonSecondary}><Plus className="size-4" /> Add task type</button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2.5 pl-5 pr-3 sm:pl-6">Task</th>
                  <th className="px-3 py-2.5">Due within</th>
                  <th className="px-3 py-2.5">Priority</th>
                  <th className="px-3 py-2.5">Assign to</th>
                  <th className="px-3 py-2.5">Reminder</th>
                  <th className="px-3 py-2.5">Used by rules</th>
                  <th className="py-2.5 pl-3 pr-5 text-right sm:pr-6">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {draft.types.map((t) => {
                  const used = draft.rules.filter((r) => r.taskTypeId === t.id).length;
                  return (
                    <tr key={t.id} className={cn("hover:bg-surface-hover/50", !t.active && "opacity-60")}>
                      <td className="py-3 pl-5 pr-3 sm:pl-6">
                        <p className="text-sm font-medium text-foreground">{t.name}</p>
                        <p className="text-[11px] text-muted-foreground">{t.category}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <input aria-label={`${t.name} due amount`} inputMode="numeric" value={t.dueIn} onChange={(e) => patchType(t.id, { dueIn: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} className={cn(inline, "w-14 text-center")} />
                          <select aria-label={`${t.name} due unit`} value={t.dueUnit} onChange={(e) => patchType(t.id, { dueUnit: e.target.value as TaskType["dueUnit"] })} className={inline}>
                            <option value="hours">hours</option>
                            <option value="days">days</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <select aria-label={`${t.name} priority`} value={t.priority} onChange={(e) => patchType(t.id, { priority: e.target.value as TaskPriority })} className={cn(inline, "border-transparent font-semibold", priorityStyle[t.priority])}>
                          {priorities.map((p) => <option key={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <select aria-label={`${t.name} assignment`} value={t.assign} onChange={(e) => patchType(t.id, { assign: e.target.value as AssignRule })} className={inline}>
                          {assignRules.map((a) => <option key={a}>{a}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <select aria-label={`${t.name} reminder`} value={t.reminderMins} onChange={(e) => patchType(t.id, { reminderMins: Number(e.target.value) })} className={inline}>
                          {reminders.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{used ? `${used} rule${used > 1 ? "s" : ""}` : "Manual only"}</td>
                      <td className="py-3 pl-3 pr-5 text-right sm:pr-6">
                        <StatusSwitch checked={t.active} showLabel={false} ariaLabel={`${t.name} active`} onChange={(active) => patchType(t.id, { active })} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "rules" && (
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Automation rules</h3>
              <p className="text-xs text-muted-foreground">When something happens in the CRM, create a task automatically.</p>
            </div>
            <button type="button" onClick={() => setAdding("rule")} className={buttonSecondary}><Plus className="size-4" /> Add rule</button>
          </div>
          <ul className="flex flex-col gap-2.5">
            {draft.rules.map((r) => {
              const t = typeName(r.taskTypeId);
              return (
                <li key={r.id} className={cn("flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center", !r.active && "bg-surface-muted/60")}>
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", r.active ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" : "bg-surface-hover text-muted-foreground")}>
                    <Zap className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-foreground">
                      <span className="text-muted-foreground">When</span>
                      <span className="rounded-md bg-surface-hover px-1.5 py-0.5 font-medium">{r.trigger}</span>
                      <span className="text-muted-foreground">and</span>
                      <span className="rounded-md bg-surface-hover px-1.5 py-0.5 font-medium">{r.condition}</span>
                      <ArrowRight className="size-3.5 text-muted-foreground" />
                      <span className="font-semibold">{t?.name ?? "Missing task type"}</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t ? `Due in ${t.dueIn} ${t.dueUnit} · ${t.priority} · assigned to ${t.assign.toLowerCase()}` : "Pick a task type"}
                      {" · "}
                      {r.active ? `${r.runs30d} tasks created in the last 30 days` : "Paused"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button type="button" aria-label="Delete rule" onClick={() => setDraft((d) => ({ ...d, rules: d.rules.filter((x) => x.id !== r.id) }))} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger-soft hover:text-danger">
                      <Trash2 className="size-4" />
                    </button>
                    <StatusSwitch checked={r.active} ariaLabel="Rule active" onChange={(active) => patchRule(r.id, { active })} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {tab === "hours" && (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="p-5 sm:p-6">
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Branch working hours</h3>
            <p className="text-xs text-muted-foreground">Due times and reminders skip hours when the branch is closed.</p>
            <ul className="mt-4 flex flex-col divide-y divide-border">
              {draft.hours.map((h, i) => (
                <li key={h.branch} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-start">
                  <div className="w-40 shrink-0 md:pt-1.5">
                    <p className="text-sm font-semibold text-foreground">{h.branch}</p>
                    <p className="text-[11px] text-muted-foreground">{h.timezone}</p>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <input type="time" aria-label={`${h.branch} opens`} value={h.start} onChange={(e) => setDraft((d) => ({ ...d, hours: d.hours.map((x, k) => (k === i ? { ...x, start: e.target.value } : x)) }))} className={inline} />
                    <span className="text-xs text-muted-foreground">to</span>
                    <input type="time" aria-label={`${h.branch} closes`} value={h.end} onChange={(e) => setDraft((d) => ({ ...d, hours: d.hours.map((x, k) => (k === i ? { ...x, end: e.target.value } : x)) }))} className={inline} />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {weekdays.map((day) => {
                      const on = h.days.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setDraft((d) => ({ ...d, hours: d.hours.map((x, k) => (k === i ? { ...x, days: on ? x.days.filter((y) => y !== day) : weekdays.filter((w) => [...x.days, day].includes(w)) } : x)) }))}
                          className={cn("h-7 w-9 rounded-md text-[11px] font-semibold transition-colors", on ? "bg-primary text-primary-foreground" : "bg-surface-hover text-muted-foreground hover:text-foreground")}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="flex flex-col gap-5 p-5 sm:p-6">
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Escalation</h3>
              <p className="text-xs text-muted-foreground">What happens when a task is overdue.</p>
            </div>
            <Field label="Escalate overdue tasks after">
              <Select value={draft.escalateAfterHours} onChange={(e) => setDraft({ ...draft, escalateAfterHours: Number(e.target.value) })}>
                {[4, 8, 24, 48, 72].map((h) => <option key={h} value={h}>{h} hours</option>)}
              </Select>
            </Field>
            <Field label="Escalate to">
              <PillGroup options={[{ value: "Team lead", label: "Team lead" }, { value: "Branch manager", label: "Branch manager" }]} value={draft.escalateTo} onChange={(escalateTo) => setDraft({ ...draft, escalateTo })} />
            </Field>
            <Field label="Daily task digest email" hint="Each person gets their tasks for the day at this time.">
              <TextInput type="time" value={draft.digestTime} onChange={(e) => setDraft({ ...draft, digestTime: e.target.value })} />
            </Field>
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <Checkbox checked={draft.countWorkingHoursOnly} onChange={(v) => setDraft({ ...draft, countWorkingHoursOnly: v })} label={<span>Count working hours only<span className="block text-xs text-muted-foreground">A 2-hour task created at 6pm is due at 11am the next working day.</span></span>} />
              <Checkbox checked={draft.pauseOnLeave} onChange={(v) => setDraft({ ...draft, pauseOnLeave: v })} label={<span>Reassign tasks when someone is on leave<span className="block text-xs text-muted-foreground">Their open tasks move to their team lead.</span></span>} />
            </div>
            <p className="flex items-start gap-2 rounded-xl bg-surface-muted px-3 py-2.5 text-xs text-muted-foreground">
              <Clock3 className="mt-0.5 size-3.5 shrink-0" />
              Example: a “First contact call” created at 17:45 in London is due at {draft.countWorkingHoursOnly ? "10:15 the next working day" : "19:45 the same day"}.
            </p>
          </Card>
        </div>
      )}

      {dirty && (
        <div className="card-shadow animate-fade-in sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 self-center rounded-full border border-border bg-surface px-5 py-2.5">
          <span className="text-xs font-medium text-foreground">You have unsaved changes</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setDraft(structuredClone(saved))} className={cn(buttonSecondary, "min-h-8 py-1.5")}><RotateCcw className="size-3.5" /> Discard</button>
            <button type="button" onClick={save} className={cn(buttonPrimary, "min-h-8 py-1.5")}><Save className="size-3.5" /> Save changes</button>
          </div>
        </div>
      )}

      {adding === "type" && (
        <AddTypeModal
          onClose={() => setAdding(null)}
          onAdd={(t) => {
            setDraft((d) => ({ ...d, types: [...d.types, t] }));
            setAdding(null);
            notify(`${t.name} added — save to apply`);
          }}
        />
      )}
      {adding === "rule" && (
        <AddRuleModal
          types={draft.types.filter((t) => t.active)}
          onClose={() => setAdding(null)}
          onAdd={(r) => {
            setDraft((d) => ({ ...d, rules: [...d.rules, r] }));
            setAdding(null);
            notify("Rule added — save to apply");
          }}
        />
      )}
      {toast}
    </div>
  );
}

function AddTypeModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: TaskType) => void }) {
  const [t, setT] = useState<TaskType>({ id: "", name: "", category: "Applications", dueIn: 1, dueUnit: "days", priority: "Normal", assign: "Record owner", reminderMins: 60, active: true });
  const [tried, setTried] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!t.name.trim() || !t.dueIn) return;
    onAdd({ ...t, id: `TT-${Date.now().toString(36)}`, name: t.name.trim() });
  };
  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      icon={ListChecks}
      title="Add task type"
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="submit" form="add-type" className={buttonPrimary}>Add task type</button></div>}
    >
      <form id="add-type" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Name" required hint={tried && !t.name.trim() ? "Give the task a name" : undefined}>
          <TextInput value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} placeholder="e.g. Accommodation check" className={cn(tried && !t.name.trim() && "border-danger")} />
        </Field>
        <Field label="Category">
          <PillGroup options={categories.map((c) => ({ value: c, label: c }))} value={t.category} onChange={(category) => setT({ ...t, category })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due within" required>
            <div className="flex gap-2">
              <TextInput inputMode="numeric" value={t.dueIn || ""} onChange={(e) => setT({ ...t, dueIn: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) })} />
              <Select value={t.dueUnit} onChange={(e) => setT({ ...t, dueUnit: e.target.value as TaskType["dueUnit"] })}><option value="hours">hours</option><option value="days">days</option></Select>
            </div>
          </Field>
          <Field label="Priority">
            <Select value={t.priority} onChange={(e) => setT({ ...t, priority: e.target.value as TaskPriority })}>{priorities.map((p) => <option key={p}>{p}</option>)}</Select>
          </Field>
        </div>
        <Field label="Assign to">
          <Select value={t.assign} onChange={(e) => setT({ ...t, assign: e.target.value as AssignRule })}>{assignRules.map((a) => <option key={a}>{a}</option>)}</Select>
        </Field>
      </form>
    </Modal>
  );
}

function AddRuleModal({ types, onClose, onAdd }: { types: TaskType[]; onClose: () => void; onAdd: (r: AutomationRule) => void }) {
  const [trigger, setTrigger] = useState(triggers[0]);
  const [condition, setCondition] = useState("");
  const [taskTypeId, setTaskTypeId] = useState(types[0]?.id ?? "");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onAdd({ id: `AR-${Date.now().toString(36)}`, trigger, condition: condition.trim() || "Always", taskTypeId, active: true, runs30d: 0 });
  };
  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      icon={CalendarClock}
      title="Add automation rule"
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="submit" form="add-rule" className={buttonPrimary}>Add rule</button></div>}
    >
      <form id="add-rule" onSubmit={submit} className="flex flex-col gap-4">
        <Field label="When">
          <Select value={trigger} onChange={(e) => setTrigger(e.target.value)}>{triggers.map((t) => <option key={t}>{t}</option>)}</Select>
        </Field>
        <Field label="Only if" hint="Leave empty to run every time.">
          <TextInput value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="e.g. Source is Education Fair" />
        </Field>
        <Field label="Create task">
          <Select value={taskTypeId} onChange={(e) => setTaskTypeId(e.target.value)}>{types.map((t) => <option key={t.id} value={t.id}>{t.name} · due in {t.dueIn} {t.dueUnit}</option>)}</Select>
        </Field>
      </form>
    </Modal>
  );
}
