"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState, type FormEvent } from "react";
import { Building2, Crown, GraduationCap, PencilLine, Plus, Search, Target, Trash2, UserMinus, UserPlus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { SlideOver } from "@/components/ui/slide-over";
import { Field, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { useToast } from "@/components/ui/toast";
import { Avatar, AvatarStack, loadTone, Meter, RoleChip } from "@/components/people/people-ui";
import { getApplications } from "@/lib/mock/applications";
import { caseloads, getStaff, getTeams, saveTeams, staffBranches, type StaffMember, type Team } from "@/lib/mock/staff";
import { cn } from "@/lib/utils";

const colors = ["bg-primary", "bg-teal-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-sky-500", "bg-emerald-500", "bg-pink-500"];

/** Enrolments for 2026 intakes so far, by counsellor. */
function enrolmentsThisYear() {
  const m = new Map<string, number>();
  for (const a of getApplications()) if (a.stage === "Enrolled" && a.intake.endsWith("2026")) m.set(a.counsellor, (m.get(a.counsellor) ?? 0) + 1);
  return m;
}
/** Months of 2026 elapsed at the data snapshot (Jan–Sep). */
const MONTHS_YTD = 9;

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>(getTeams);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [managingId, setManagingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Team | "new" | null>(null);
  const [deleting, setDeleting] = useState<Team | null>(null);
  const [toast, notify] = useToast();
  const staff = getStaff();
  const loads = useMemo(() => caseloads(), []);
  const enrolments = useMemo(() => enrolmentsThisYear(), []);
  const byId = (id: string) => staff.find((s) => s.id === id);

  const commit = (next: Team[]) => {
    setTeams(next);
    saveTeams(next);
  };

  const statsFor = (t: Team) => {
    const members = t.memberIds.map(byId).filter((s): s is StaffMember => !!s);
    const open = members.reduce((n, m) => n + (loads.get(m.name)?.open ?? 0), 0);
    const capacity = members.reduce((n, m) => n + m.capacity, 0);
    const enrolled = members.reduce((n, m) => n + (enrolments.get(m.name) ?? 0), 0);
    return { members, open, capacity, enrolled };
  };

  const filtered = teams.filter(
    (t) => (!branch || t.branch === branch) && (!search.trim() || `${t.name} ${t.description} ${t.focus.join(" ")}`.toLowerCase().includes(search.trim().toLowerCase()))
  );
  const unassigned = staff.filter((s) => s.status !== "Inactive" && !teams.some((t) => t.memberIds.includes(s.id)));
  const managing = teams.find((t) => t.id === managingId);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Teams</h2>
          <p className="mt-1 text-sm text-muted-foreground">Group people by branch or focus so work, targets and announcements go to the right place.</p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className={buttonPrimary}>
          <Plus className="size-4" /> New team
        </button>
      </header>

      <StatGrid>
        <StatCard icon={Users} label="Teams" value={teams.length} note={`${new Set(teams.flatMap((t) => t.memberIds)).size} people`} />
        <StatCard icon={Target} tone="violet" label="Combined monthly target" value={teams.reduce((n, t) => n + t.monthlyTarget, 0)} note="enrolments" />
        <StatCard icon={GraduationCap} tone="success" label="Enrolled for 2026 intakes" value={[...enrolments.values()].reduce((a, b) => a + b, 0)} />
        <StatCard icon={UserPlus} tone={unassigned.length ? "warning" : "success"} label="People not in a team" value={unassigned.length} />
      </StatGrid>

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search teams or focus…" label="Search teams" />
        <SelectFilter label="Branch" value={branch} onChange={setBranch} allLabel="All branches" options={[...staffBranches, "All branches"].map((b) => ({ value: b, label: b === "All branches" ? "Cross-branch" : b, hint: teams.filter((t) => t.branch === b).length }))} />
        {(search || branch) && <ResetFilters onClick={() => { setSearch(""); setBranch(""); }} />}
      </FilterBar>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {filtered.map((t) => {
          const { members, open, capacity, enrolled } = statsFor(t);
          const lead = byId(t.leadId);
          const ytdTarget = t.monthlyTarget * MONTHS_YTD;
          const pct = ytdTarget ? Math.min(100, Math.round((enrolled / ytdTarget) * 100)) : 0;
          return (
            <Card key={t.id} className="flex flex-col overflow-hidden">
              <div className={cn("h-1.5", t.color)} />
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-start gap-3">
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white", t.color)}>
                    {t.name.split(" ").map((w) => w[0]).filter((c) => /[A-Z]/.test(c)).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-semibold tracking-tight text-foreground">{t.name}</h3>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Building2 className="size-3" /> {t.branch === "All branches" ? "Cross-branch" : t.branch}</p>
                  </div>
                  <button type="button" aria-label={`Edit ${t.name}`} onClick={() => setEditing(t)} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground">
                    <PencilLine className="size-4" />
                  </button>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                <div className="flex flex-wrap gap-1">
                  {t.focus.map((f) => <span key={f} className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-foreground">{f}</span>)}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-surface-muted py-2">
                    <p className="text-base font-bold tabular-nums text-foreground">{members.length}</p>
                    <p className="text-[10px] text-muted-foreground">Members</p>
                  </div>
                  <div className="rounded-xl bg-surface-muted py-2">
                    <p className="text-base font-bold tabular-nums text-foreground">{open}</p>
                    <p className="text-[10px] text-muted-foreground">Open cases</p>
                  </div>
                  <div className="rounded-xl bg-surface-muted py-2">
                    <p className="text-base font-bold tabular-nums text-foreground">{capacity ? `${Math.round((open / capacity) * 100)}%` : "—"}</p>
                    <p className="text-[10px] text-muted-foreground">Capacity used</p>
                  </div>
                </div>

                {t.monthlyTarget > 0 ? (
                  <div>
                    <p className="mb-1.5 flex justify-between text-[11px]">
                      <span className="text-muted-foreground">2026 enrolments vs target ({t.monthlyTarget}/month)</span>
                      <span className="font-semibold tabular-nums text-foreground">{enrolled} / {ytdTarget} · {pct}%</span>
                    </p>
                    <Meter value={enrolled} max={ytdTarget} tone={pct >= 100 ? "success" : pct >= 70 ? "primary" : "warning"} />
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Support team — no enrolment target</p>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                  <div className="flex min-w-0 items-center gap-2">
                    {lead && <Avatar name={lead.name} size="sm" />}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{lead?.name ?? "No lead"}</p>
                      <p className="text-[10px] text-muted-foreground">Team lead</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setManagingId(t.id)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs font-semibold text-primary hover:bg-primary-soft">
                    <AvatarStack names={members.map((m) => m.name)} max={3} />
                    Manage
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
        <button type="button" onClick={() => setEditing("new")} className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft/30 hover:text-primary">
          <Plus className="size-6" />
          <span className="text-sm font-semibold">Create a team</span>
          {unassigned.length > 0 && <span className="text-xs">{unassigned.length} people aren&apos;t in a team yet</span>}
        </button>
      </div>

      {managing && (
        <TeamMembers
          team={managing}
          staff={staff}
          loads={loads}
          enrolments={enrolments}
          onClose={() => setManagingId(null)}
          onChange={(patch, message) => {
            commit(teams.map((t) => (t.id === managing.id ? { ...t, ...patch } : t)));
            notify(message);
          }}
          onDelete={() => setDeleting(managing)}
        />
      )}
      {editing && (
        <TeamModal
          team={editing === "new" ? undefined : editing}
          staff={staff}
          existing={teams}
          onClose={() => setEditing(null)}
          onSave={(t) => {
            const isNew = !teams.some((x) => x.id === t.id);
            commit(isNew ? [...teams, t] : teams.map((x) => (x.id === t.id ? t : x)));
            setEditing(null);
            notify(isNew ? `${t.name} created with ${t.memberIds.length} members` : "Team updated");
          }}
        />
      )}
      {deleting && (
        <Modal
          open
          size="sm"
          icon={Trash2}
          title={`Delete ${deleting.name}?`}
          onClose={() => setDeleting(null)}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleting(null)} className={buttonSecondary}>Cancel</button>
              <button
                type="button"
                onClick={() => {
                  commit(teams.filter((t) => t.id !== deleting.id));
                  setDeleting(null);
                  setManagingId(null);
                  notify("Team deleted");
                }}
                className={cn(buttonPrimary, "bg-danger hover:bg-danger/90")}
              >
                Delete team
              </button>
            </div>
          }
        >
          <p className="text-sm text-muted-foreground">The {deleting.memberIds.length} members keep their accounts and records. Announcements sent to this team stay visible to them.</p>
        </Modal>
      )}
      {toast}
    </div>
  );
}

function TeamMembers({
  team,
  staff,
  loads,
  enrolments,
  onClose,
  onChange,
  onDelete,
}: {
  team: Team;
  staff: StaffMember[];
  loads: ReturnType<typeof caseloads>;
  enrolments: Map<string, number>;
  onClose: () => void;
  onChange: (patch: Partial<Team>, message: string) => void;
  onDelete: () => void;
}) {
  const [query, setQuery] = useState("");
  const members = team.memberIds.map((id) => staff.find((s) => s.id === id)).filter((s): s is StaffMember => !!s);
  const candidates = staff.filter((s) => s.status !== "Inactive" && !team.memberIds.includes(s.id) && (!query.trim() || `${s.name} ${s.branch} ${s.jobTitle}`.toLowerCase().includes(query.trim().toLowerCase())));

  return (
    <SlideOver
      open
      onClose={onClose}
      icon={Users}
      title={team.name}
      subtitle={`${members.length} members · ${team.branch === "All branches" ? "Cross-branch" : team.branch}`}
      footer={
        <button type="button" onClick={onDelete} className={cn(buttonSecondary, "w-full text-danger hover:bg-danger-soft")}>
          <Trash2 className="size-4" /> Delete team
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        <section>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Members</h4>
          <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border">
            {members.map((m) => {
              const load = loads.get(m.name);
              const isLead = m.id === team.leadId;
              return (
                <li key={m.id} className="flex items-center gap-3 px-3 py-3">
                  <Avatar name={m.name} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
                      {m.name}
                      {isLead && <Crown className="size-3.5 text-amber-500" aria-label="Team lead" />}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <RoleChip roleId={m.roleId} />
                      <span className="text-[11px] text-muted-foreground">{m.branch}</span>
                    </div>
                    {m.capacity > 0 && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="w-24"><Meter value={load?.open ?? 0} max={m.capacity} tone={loadTone(load?.open ?? 0, m.capacity)} /></div>
                        <span className="text-[10px] tabular-nums text-muted-foreground">{load?.open ?? 0}/{m.capacity} open · {enrolments.get(m.name) ?? 0} enrolled in 2026</span>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!isLead && (
                      <button type="button" title="Make team lead" aria-label={`Make ${m.name} team lead`} onClick={() => onChange({ leadId: m.id }, `${m.name} is now team lead`)} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600">
                        <Crown className="size-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Remove from team"
                      aria-label={`Remove ${m.name}`}
                      disabled={isLead}
                      onClick={() => onChange({ memberIds: team.memberIds.filter((id) => id !== m.id) }, `${m.name} removed from ${team.name}`)}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger-soft hover:text-danger disabled:pointer-events-none disabled:opacity-30"
                    >
                      <UserMinus className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">Make someone else lead before removing the current lead.</p>
        </section>

        <section>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Add people</h4>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or branch" className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none" />
          </label>
          <ul className="mt-2 flex max-h-72 flex-col gap-1 overflow-y-auto">
            {candidates.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-hover">
                <Avatar name={s.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{s.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{s.jobTitle} · {s.branch}</p>
                </div>
                <button type="button" onClick={() => onChange({ memberIds: [...team.memberIds, s.id] }, `${s.name} added to ${team.name}`)} className="inline-flex h-7 items-center gap-1 rounded-full bg-primary-soft px-2.5 text-[11px] font-semibold text-primary hover:bg-primary hover:text-primary-foreground">
                  <UserPlus className="size-3" /> Add
                </button>
              </li>
            ))}
            {candidates.length === 0 && <li className="px-2 py-4 text-center text-xs text-muted-foreground">No one else to add.</li>}
          </ul>
        </section>
      </div>
    </SlideOver>
  );
}

function TeamModal({ team, staff, existing, onClose, onSave }: { team?: Team; staff: StaffMember[]; existing: Team[]; onClose: () => void; onSave: (t: Team) => void }) {
  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [branch, setBranch] = useState<Team["branch"]>(team?.branch ?? "Dhaka HQ");
  const [leadId, setLeadId] = useState(team?.leadId ?? "");
  const [focus, setFocus] = useState(team?.focus.join(", ") ?? "");
  const [target, setTarget] = useState(String(team?.monthlyTarget ?? 10));
  const [color, setColor] = useState(team?.color ?? colors[existing.length % colors.length]);
  const [tried, setTried] = useState(false);
  const active = staff.filter((s) => s.status !== "Inactive");
  const leads = active.filter((s) => branch === "All branches" || s.branch === branch);
  const errors = {
    name: !name.trim() ? "Give the team a name" : existing.some((t) => t.id !== team?.id && t.name.toLowerCase() === name.trim().toLowerCase()) ? "A team with this name exists" : "",
    lead: !leadId ? "Choose a team lead" : "",
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (errors.name || errors.lead) return;
    const memberIds = team ? [...new Set([...team.memberIds, leadId])] : [leadId];
    onSave({
      id: team?.id ?? `TM-${Date.now().toString(36)}`,
      name: name.trim(),
      description: description.trim(),
      branch,
      leadId,
      memberIds,
      focus: focus.split(",").map((f) => f.trim()).filter(Boolean),
      monthlyTarget: Number(target) || 0,
      color,
      createdAt: team?.createdAt ?? "2026-09-17",
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      icon={Users}
      title={team ? `Edit ${team.name}` : "New team"}
      subtitle={team ? undefined : "You can add more members after creating it."}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button type="submit" form="team-form" className={buttonPrimary}>{team ? "Save team" : "Create team"}</button>
        </div>
      }
    >
      <form id="team-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Team name" required className="sm:col-span-2" hint={tried && errors.name ? errors.name : undefined}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Birmingham Home Admissions" className={cn(tried && errors.name && "border-danger")} />
        </Field>
        <Field label="Branch">
          <Select value={branch} onChange={(e) => { setBranch(e.target.value as Team["branch"]); setLeadId(""); }}>
            {staffBranches.map((b) => <option key={b}>{b}</option>)}
            <option value="All branches">Cross-branch</option>
          </Select>
        </Field>
        <Field label="Team lead" required hint={tried && errors.lead ? errors.lead : undefined}>
          <Select value={leadId} onChange={(e) => setLeadId(e.target.value)} className={cn(tried && errors.lead && "border-danger")}>
            <option value="">Choose…</option>
            {leads.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.jobTitle}</option>)}
          </Select>
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Who this team serves" />
        </Field>
        <Field label="Focus areas" hint="Separate with commas">
          <TextInput value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Nursing, Foundation year" />
        </Field>
        <Field label="Monthly enrolment target" hint="0 for support teams">
          <TextInput inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, "").slice(0, 3))} />
        </Field>
        <Field label="Colour" className="sm:col-span-2">
          <div className="flex gap-2">
            {colors.map((c) => (
              <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={color === c} onClick={() => setColor(c)} className={cn("size-7 rounded-full", c, color === c && "ring-2 ring-foreground/40 ring-offset-2 ring-offset-surface")} />
            ))}
          </div>
        </Field>
      </form>
    </Modal>
  );
}
