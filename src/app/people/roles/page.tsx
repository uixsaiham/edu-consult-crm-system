"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, Copy, Lock, Plus, RotateCcw, Save, ShieldCheck, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Field, PillGroup, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { AvatarStack } from "@/components/people/people-ui";
import {
  getRoles,
  getStaff,
  permissionActions,
  permissionModules,
  saveRoles,
  type DataScope,
  type PermissionAction,
  type PermissionModule,
  type Role,
} from "@/lib/mock/staff";
import { cn } from "@/lib/utils";

const scopes: DataScope[] = ["All branches", "Own branch", "Own records"];
const colors = ["bg-primary", "bg-violet-500", "bg-teal-500", "bg-sky-500", "bg-amber-500", "bg-pink-500", "bg-emerald-500", "bg-slate-500"];
const moduleHints: Record<PermissionModule, string> = {
  Dashboard: "Overview, performance and targets",
  Leads: "All leads, follow-ups, exports",
  Applications: "Student files, status and documents",
  Communications: "WhatsApp, announcements, news feed",
  "Institutions & courses": "Directory and course catalogue",
  People: "Staff, roles and teams",
  Agents: "Partner agents and ambassadors",
  Finance: "Commissions and payments",
  Reports: "Insights and CSV exports",
  Settings: "Company, menus and audit logs",
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(getRoles);
  const [selectedId, setSelectedId] = useState(roles[1].id);
  const [draft, setDraft] = useState<Role>(() => structuredClone(roles[1]));
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, notify] = useToast();
  const staff = getStaff();

  const saved = roles.find((r) => r.id === selectedId)!;
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  const members = (id: string) => staff.filter((s) => s.roleId === id && s.status !== "Inactive");
  const locked = draft.system;

  const commit = (next: Role[]) => {
    setRoles(next);
    saveRoles(next);
  };

  const select = (id: string) => {
    if (dirty && !window.confirm("Discard unsaved changes to this role?")) return;
    setSelectedId(id);
    setDraft(structuredClone(roles.find((r) => r.id === id)!));
  };

  const toggle = (m: PermissionModule, a: PermissionAction) =>
    setDraft((d) => {
      const has = d.permissions[m].includes(a);
      let next = has ? d.permissions[m].filter((x) => x !== a) : [...d.permissions[m], a];
      // Any other action needs View; removing View removes everything
      if (!has && a !== "View" && !next.includes("View")) next = ["View", ...next];
      if (has && a === "View") next = [];
      return { ...d, permissions: { ...d.permissions, [m]: permissionActions.filter((x) => next.includes(x)) } };
    });
  const setRow = (m: PermissionModule, on: boolean) => setDraft((d) => ({ ...d, permissions: { ...d.permissions, [m]: on ? [...permissionActions] : [] } }));
  const setColumn = (a: PermissionAction, on: boolean) =>
    setDraft((d) => ({
      ...d,
      permissions: Object.fromEntries(
        permissionModules.map((m) => {
          const cur = d.permissions[m];
          const next = on ? [...new Set([...cur, a, "View" as PermissionAction])] : a === "View" ? [] : cur.filter((x) => x !== a);
          return [m, permissionActions.filter((x) => next.includes(x))];
        })
      ) as Role["permissions"],
    }));

  const granted = useMemo(() => permissionModules.reduce((n, m) => n + draft.permissions[m].length, 0), [draft]);
  const total = permissionModules.length * permissionActions.length;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Roles & permissions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Decide what each role can see and change. Changes apply the next time people sign in.</p>
        </div>
        <button type="button" onClick={() => setCreating(true)} className={buttonPrimary}>
          <Plus className="size-4" /> New role
        </button>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="p-2 lg:sticky lg:top-0">
          <ul className="flex flex-col gap-0.5">
            {roles.map((r) => {
              const people = members(r.id);
              const active = r.id === selectedId;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => select(r.id)}
                    className={cn("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors", active ? "bg-primary-soft" : "hover:bg-surface-hover")}
                  >
                    <span className={cn("size-2.5 shrink-0 rounded-full", r.color)} />
                    <span className="min-w-0 flex-1">
                      <span className={cn("flex items-center gap-1.5 truncate text-sm font-semibold", active ? "text-primary" : "text-foreground")}>
                        {r.name}
                        {r.system && <Lock className="size-3 text-muted-foreground" />}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">{r.scope} · {permissionModules.filter((m) => r.permissions[m].length).length} modules</span>
                    </span>
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border">{people.length}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {locked ? (
                  <>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">{draft.name} <span className="inline-flex items-center gap-1 rounded-full bg-surface-hover px-2 py-0.5 text-[11px] font-medium text-muted-foreground"><Lock className="size-3" /> Built-in</span></h3>
                    <p className="mt-1 text-sm text-muted-foreground">{draft.description} Built-in roles can&apos;t be changed.</p>
                  </>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <Field label="Role name">
                      <TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                    </Field>
                    <Field label="Colour">
                      <div className="flex h-[42px] items-center gap-1.5">
                        {colors.map((c) => (
                          <button key={c} type="button" aria-label={`Colour ${c}`} onClick={() => setDraft({ ...draft, color: c })} className={cn("flex size-6 items-center justify-center rounded-full", c, draft.color === c && "ring-2 ring-offset-2 ring-offset-surface ring-foreground/40")}>
                            {draft.color === c && <Check className="size-3 text-white" strokeWidth={3} />}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Description" className="sm:col-span-2">
                      <Textarea rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                    </Field>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <Field label="Data scope" hint={draft.scope === "All branches" ? "Sees records from every branch." : draft.scope === "Own branch" ? "Sees records from their own branch only." : "Sees only records assigned to them."}>
                {locked ? <p className="text-sm font-medium text-foreground">{draft.scope}</p> : <PillGroup options={scopes.map((s) => ({ value: s, label: s }))} value={draft.scope} onChange={(scope) => setDraft({ ...draft, scope })} />}
              </Field>
              <div className="flex items-center gap-3">
                <AvatarStack names={members(draft.id).map((m) => m.name)} />
                <Link href={`/people?role=${draft.id}`} className="text-xs font-semibold text-primary hover:underline">{members(draft.id).length} people</Link>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Permissions</h3>
                <p className="text-xs text-muted-foreground">{granted} of {total} permissions granted. Create, edit, delete and export include view.</p>
              </div>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-surface-hover">
                <div className={cn("h-full rounded-full", draft.color)} style={{ width: `${(granted / total) * 100}%` }} />
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2.5 pl-5 pr-3 sm:pl-6">Module</th>
                    {permissionActions.map((a) => {
                      const on = permissionModules.every((m) => draft.permissions[m].includes(a));
                      return (
                        <th key={a} className="px-2 py-2.5 text-center">
                          <button type="button" disabled={locked} onClick={() => setColumn(a, !on)} className="rounded px-1 uppercase hover:text-foreground disabled:hover:text-muted-foreground" title={on ? `Remove ${a.toLowerCase()} everywhere` : `Allow ${a.toLowerCase()} everywhere`}>
                            {a}
                          </button>
                        </th>
                      );
                    })}
                    <th className="py-2.5 pl-2 pr-5 text-right sm:pr-6">All</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {permissionModules.map((m) => {
                    const row = draft.permissions[m];
                    return (
                      <tr key={m} className="hover:bg-surface-hover/50">
                        <td className="py-3 pl-5 pr-3 sm:pl-6">
                          <p className={cn("text-sm font-medium", row.length ? "text-foreground" : "text-muted-foreground")}>{m}</p>
                          <p className="text-[11px] text-muted-foreground">{moduleHints[m]}</p>
                        </td>
                        {permissionActions.map((a) => {
                          const on = row.includes(a);
                          return (
                            <td key={a} className="px-2 py-3 text-center">
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={on}
                                aria-label={`${a} ${m}`}
                                disabled={locked}
                                onClick={() => toggle(m, a)}
                                className={cn(
                                  "mx-auto flex size-6 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed",
                                  on ? "border-primary bg-primary text-primary-foreground" : "border-border-strong bg-surface hover:border-primary",
                                  locked && "opacity-70"
                                )}
                              >
                                {on && <Check className="size-3.5" strokeWidth={3} />}
                              </button>
                            </td>
                          );
                        })}
                        <td className="py-3 pl-2 pr-5 text-right sm:pr-6">
                          <button type="button" disabled={locked} onClick={() => setRow(m, row.length < permissionActions.length)} className="text-[11px] font-semibold text-primary hover:underline disabled:text-muted-foreground disabled:no-underline">
                            {row.length === permissionActions.length ? "None" : "Full"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3 sm:px-6">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const copy: Role = { ...structuredClone(draft), id: `role-${Date.now().toString(36)}`, name: `${draft.name} (copy)`, system: false };
                    commit([...roles, copy]);
                    setSelectedId(copy.id);
                    setDraft(structuredClone(copy));
                    notify(`Duplicated ${draft.name}`);
                  }}
                  className={buttonSecondary}
                >
                  <Copy className="size-4" /> Duplicate
                </button>
                {!locked && (
                  <button type="button" onClick={() => setConfirmDelete(true)} className={cn(buttonSecondary, "text-danger hover:bg-danger-soft")}>
                    <Trash2 className="size-4" /> Delete
                  </button>
                )}
              </div>
              {!locked && (
                <div className="flex gap-2">
                  <button type="button" disabled={!dirty} onClick={() => setDraft(structuredClone(saved))} className={buttonSecondary}>
                    <RotateCcw className="size-4" /> Discard
                  </button>
                  <button
                    type="button"
                    disabled={!dirty || !draft.name.trim()}
                    onClick={() => {
                      commit(roles.map((r) => (r.id === draft.id ? { ...draft, name: draft.name.trim() } : r)));
                      notify(`${draft.name} saved — ${members(draft.id).length} people updated`);
                    }}
                    className={buttonPrimary}
                  >
                    <Save className="size-4" /> Save role
                  </button>
                </div>
              )}
            </footer>
          </Card>
        </div>
      </div>

      {creating && (
        <NewRoleModal
          roles={roles}
          onClose={() => setCreating(false)}
          onCreate={(role) => {
            commit([...roles, role]);
            setSelectedId(role.id);
            setDraft(structuredClone(role));
            setCreating(false);
            notify(`${role.name} created`);
          }}
        />
      )}
      {confirmDelete && (
        <Modal
          open
          size="sm"
          onClose={() => setConfirmDelete(false)}
          icon={Trash2}
          title={`Delete ${draft.name}?`}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className={buttonSecondary}>Cancel</button>
              <button
                type="button"
                disabled={members(draft.id).length > 0}
                onClick={() => {
                  const next = roles.filter((r) => r.id !== draft.id);
                  commit(next);
                  setSelectedId(next[0].id);
                  setDraft(structuredClone(next[0]));
                  setConfirmDelete(false);
                  notify("Role deleted");
                }}
                className={cn(buttonPrimary, "bg-danger hover:bg-danger/90")}
              >
                Delete role
              </button>
            </div>
          }
        >
          <p className="text-sm text-muted-foreground">
            {members(draft.id).length > 0
              ? `${members(draft.id).length} people still have this role. Move them to another role first.`
              : "No one has this role. It will be removed permanently."}
          </p>
        </Modal>
      )}
      {toast}
    </div>
  );
}

function NewRoleModal({ roles, onClose, onCreate }: { roles: Role[]; onClose: () => void; onCreate: (r: Role) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [from, setFrom] = useState("counsellor");
  const [tried, setTried] = useState(false);
  const exists = roles.some((r) => r.name.toLowerCase() === name.trim().toLowerCase());
  const error = !name.trim() ? "Give the role a name" : exists ? "A role with this name already exists" : "";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (error) return;
    const base = roles.find((r) => r.id === from)!;
    onCreate({ ...structuredClone(base), id: `role-${Date.now().toString(36)}`, name: name.trim(), description: description.trim() || `Based on ${base.name}.`, system: false });
  };

  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      icon={ShieldCheck}
      title="New role"
      subtitle="Start from an existing role, then adjust permissions."
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button type="submit" form="new-role" className={buttonPrimary}>Create role</button>
        </div>
      }
    >
      <form id="new-role" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Role name" required hint={tried && error ? error : undefined}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Visa Specialist" className={cn(tried && error && "border-danger")} />
        </Field>
        <Field label="Copy permissions from">
          <Select value={from} onChange={(e) => setFrom(e.target.value)}>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </Field>
        <Field label="Description">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this role is for" />
        </Field>
      </form>
    </Modal>
  );
}
