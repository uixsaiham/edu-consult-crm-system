"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, MailCheck, Plus, SearchX, ShieldAlert, UserCheck, Users, UserX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { BarButton, HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { useToast } from "@/components/ui/toast";
import { RowActions, StatusSwitch } from "@/components/institutions/row-actions";
import { Avatar, lastSeen, loadTone, Meter, RoleChip, StaffProfile, StaffStatusBadge, staffStatusDot } from "@/components/people/people-ui";
import {
  caseloads,
  clearStaffChange,
  getRoles,
  getStaff,
  getStaffChange,
  getTeams,
  roleName,
  saveStaff,
  staffBranches,
  type StaffMember,
  type StaffStatus,
} from "@/lib/mock/staff";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const statusTabs: ("All" | StaffStatus)[] = ["All", "Active", "On leave", "Invited", "Inactive"];

export default function PeoplePage() {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading people…</p>}>
      <PeopleFromParams />
    </Suspense>
  );
}

function PeopleFromParams() {
  const params = useSearchParams();
  return <PeopleList key={params.toString()} initialRole={params.get("role") ?? ""} initialBranch={params.get("branch") ?? ""} />;
}

function PeopleList({ initialRole, initialBranch }: { initialRole: string; initialBranch: string }) {
  const [people, setPeople] = useState<StaffMember[]>(getStaff);
  const [tab, setTab] = useState<(typeof statusTabs)[number]>("All");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState(initialRole);
  const [branch, setBranch] = useState(initialBranch);
  const [team, setTeam] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [lastChange] = useState(getStaffChange);
  const [toast, notify] = useToast();
  const loads = useMemo(() => caseloads(), []);
  const teams = getTeams();
  const roles = getRoles();

  useEffect(() => {
    if (!lastChange) return;
    clearStaffChange();
    const who = getStaff().find((p) => p.id === lastChange.id)?.name ?? "Team member";
    notify(lastChange.verb === "invited" ? `Invitation sent to ${who}` : lastChange.verb === "added" ? `${who} added` : "Changes saved");
  }, [lastChange, notify]);

  useEffect(() => saveStaff(people), [people]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter(
      (p) =>
        (tab === "All" || p.status === tab) &&
        (!role || p.roleId === role) &&
        (!branch || p.branch === branch) &&
        (!team || teams.find((t) => t.id === team)?.memberIds.includes(p.id)) &&
        (!q || `${p.name} ${p.email} ${p.phone} ${p.jobTitle} ${p.id} ${p.languages.join(" ")}`.toLowerCase().includes(q))
    );
  }, [people, tab, search, role, branch, team, teams]);

  const selection = useRowSelection(filtered.map((p) => p.id));
  const selected = people.filter((p) => selection.isSelected(p.id));
  const count = (s: StaffStatus) => people.filter((p) => p.status === s).length;
  const counsellors = people.filter((p) => p.capacity > 0 && p.status === "Active");
  const overCapacity = counsellors.filter((p) => (loads.get(p.name)?.open ?? 0) >= p.capacity).length;
  const noTwoFactor = people.filter((p) => !p.twoFactor && p.status === "Active").length;
  const hasFilters = !!(search || role || branch || team);

  const setStatus = (ids: string[], status: StaffStatus, message: string) => {
    const set = new Set(ids);
    setPeople((prev) => prev.map((p) => (set.has(p.id) ? { ...p, status } : p)));
    notify(message);
  };

  const exportRows = (rows: StaffMember[], name: string) =>
    downloadCsv(
      name,
      rows.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        jobTitle: p.jobTitle,
        role: roleName(p.roleId),
        branch: p.branch,
        teams: teams.filter((t) => t.memberIds.includes(p.id)).map((t) => t.name).join("; "),
        status: p.status,
        openCases: loads.get(p.name)?.open ?? 0,
        capacity: p.capacity,
        enrolled: loads.get(p.name)?.enrolled ?? 0,
        joined: p.joined,
        twoFactor: p.twoFactor ? "On" : "Off",
      }))
    );

  const viewing = people.find((p) => p.id === viewingId);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">People</h2>
          <p className="mt-1 text-sm text-muted-foreground">Everyone with a CRM account — their role, branch, teams and current caseload.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => exportRows(filtered, "people.csv")} className={buttonSecondary}>
            <Download className="size-4" /> Export
          </button>
          <Link href="/people/new" className={buttonPrimary}>
            <Plus className="size-4" /> Add people
          </Link>
        </div>
      </header>

      <StatGrid>
        <StatCard icon={Users} label="Active team members" value={count("Active")} note={`${staffBranches.length} branches`} onClick={() => setTab("Active")} />
        <StatCard icon={MailCheck} tone="primary" label="Invitations pending" value={count("Invited")} onClick={() => setTab("Invited")} />
        <StatCard icon={UserCheck} tone={overCapacity ? "warning" : "success"} label="At or over case capacity" value={overCapacity} note={`of ${counsellors.length}`} />
        <StatCard icon={ShieldAlert} tone={noTwoFactor ? "danger" : "success"} label="Two-factor sign-in off" value={noTwoFactor} note="due 1 Oct" />
      </StatGrid>

      <div role="tablist" aria-label="Status" className="inline-flex w-fit max-w-full gap-0.5 self-start overflow-x-auto rounded-full border border-border bg-surface-muted p-0.5">
        {statusTabs.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition-colors", tab === t ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
          >
            {t !== "All" && <span className={cn("size-1.5 rounded-full", staffStatusDot[t])} />}
            {t}
            <span className="rounded-full bg-surface-hover px-1.5 text-[10px] tabular-nums">{t === "All" ? people.length : count(t)}</span>
          </button>
        ))}
      </div>

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Name, email, phone, language…" label="Search people" />
        <SelectFilter label="Role" value={role} onChange={setRole} allLabel="All roles" options={roles.map((r) => ({ value: r.id, label: r.name, hint: people.filter((p) => p.roleId === r.id).length }))} />
        <SelectFilter label="Branch" value={branch} onChange={setBranch} allLabel="All branches" options={staffBranches.map((b) => ({ value: b, label: b, hint: people.filter((p) => p.branch === b).length }))} />
        <SelectFilter label="Team" value={team} onChange={setTeam} allLabel="All teams" width="w-64" options={teams.map((t) => ({ value: t.id, label: t.name, hint: t.memberIds.length }))} />
        {hasFilters && <ResetFilters onClick={() => { setSearch(""); setRole(""); setBranch(""); setTeam(""); }} />}
      </FilterBar>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Team directory</h3>
            <p className="text-xs text-muted-foreground">{filtered.length} of {people.length} people</p>
          </div>
        </div>
        <SelectionBar selection={selection} noun={["person", "people"]} onExport={() => exportRows(selected, "people-selected.csv")} className="mx-5 mt-3">
          <BarButton onClick={() => { setStatus(selected.map((p) => p.id), "Active", `${selected.length} activated`); selection.clear(); }}>Activate</BarButton>
          <BarButton onClick={() => { setStatus(selected.map((p) => p.id), "Inactive", `${selected.length} deactivated`); selection.clear(); }} tone="danger">Deactivate</BarButton>
        </SelectionBar>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-xs">
            <thead className="border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 py-2.5 pl-5 pr-0"><HeaderCheckbox selection={selection} /></th>
                <th className="py-2.5 pl-3 pr-3">Person</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5">Branch & teams</th>
                <th className="px-3 py-2.5">Caseload</th>
                <th className="px-3 py-2.5">Enrolled</th>
                <th className="px-3 py-2.5">Last active</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const load = loads.get(p.name);
                const open = load?.open ?? 0;
                const memberOf = teams.filter((t) => t.memberIds.includes(p.id));
                return (
                  <tr key={p.id} className={cn("transition-colors hover:bg-surface-hover/60", selectedRowClass(selection, p.id), p.status === "Inactive" && "opacity-60")}>
                    <td className="py-3 pl-5 pr-0 align-middle"><RowCheckbox selection={selection} id={p.id} label={`Select ${p.name}`} /></td>
                    <td className="py-3 pl-3 pr-3">
                      <button type="button" onClick={() => setViewingId(p.id)} className="flex items-center gap-3 text-left">
                        <span className="relative">
                          <Avatar name={p.name} />
                          {lastSeen(p.lastActive) === "Online now" && <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-success ring-2 ring-surface" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-foreground hover:text-primary">{p.name}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">{p.email}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <RoleChip roleId={p.roleId} />
                      <p className="mt-1 text-[11px] text-muted-foreground">{p.jobTitle}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-foreground">{p.branch}</p>
                      <p className="max-w-[200px] truncate text-[11px] text-muted-foreground" title={memberOf.map((t) => t.name).join(", ")}>
                        {memberOf.length ? memberOf.map((t) => t.name).join(", ") : "No team"}
                      </p>
                    </td>
                    <td className="w-40 px-3 py-3">
                      {p.capacity > 0 ? (
                        <>
                          <p className="mb-1 flex justify-between text-[11px]">
                            <span className="font-semibold tabular-nums text-foreground">{open} / {p.capacity}</span>
                            <span className="text-muted-foreground">{Math.round((open / p.capacity) * 100)}%</span>
                          </p>
                          <Meter value={open} max={p.capacity} tone={loadTone(open, p.capacity)} />
                        </>
                      ) : (
                        <span className="text-muted-foreground">No caseload</span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-semibold tabular-nums text-foreground">{load?.enrolled ?? <span className="font-normal text-muted-foreground">—</span>}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{lastSeen(p.lastActive)}</td>
                    <td className="px-3 py-3">
                      {p.status === "Invited" ? (
                        <div className="flex flex-col items-start gap-1">
                          <StaffStatusBadge status="Invited" />
                          <button type="button" onClick={() => notify(`Invitation re-sent to ${p.email}`)} className="text-[11px] font-semibold text-primary hover:underline">Resend invite</button>
                        </div>
                      ) : p.status === "On leave" ? (
                        <StaffStatusBadge status="On leave" />
                      ) : (
                        <StatusSwitch
                          checked={p.status === "Active"}
                          ariaLabel={`${p.name} account active`}
                          onChange={(on) => setStatus([p.id], on ? "Active" : "Inactive", on ? `${p.name} activated` : `${p.name} deactivated — they can no longer sign in`)}
                        />
                      )}
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      <RowActions onView={() => setViewingId(p.id)} editHref={`/people/${p.id}/edit`} name={p.name} editLabel="Edit person" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-muted-foreground"><SearchX className="size-5" /></span>
              <p className="text-sm font-medium text-foreground">No one matches</p>
              <p className="text-xs text-muted-foreground">Try another status, role or search.</p>
            </div>
          )}
        </div>
        <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Under 80% of capacity</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-warning" /> 80–99%</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-danger" /> Full — stops auto-assigning</span>
          <span className="ml-auto inline-flex items-center gap-1.5"><UserX className="size-3.5" /> Deactivated people keep their records but can&apos;t sign in</span>
        </footer>
      </Card>

      {viewing && <StaffProfile person={viewing} load={loads.get(viewing.name)} onClose={() => setViewingId(null)} />}
      {toast}
    </div>
  );
}
