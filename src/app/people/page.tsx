"use client";

import { useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Mail,
  Phone,
  Plus,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { mockPeople, type PersonRecord } from "@/lib/mock/directory";
import { cn } from "@/lib/utils";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";

export default function PeoplePage() {
  const [people, setPeople] = useState<PersonRecord[]>(mockPeople);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [officeFilter, setOfficeFilter] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<PersonRecord["role"]>("Education Counselor");
  const [office, setOffice] = useState("Dhaka Dhanmondi Flagship");

  const filtered = useMemo(() => {
    let list = people;
    if (roleFilter) list = list.filter((p) => p.role === roleFilter);
    if (officeFilter) list = list.filter((p) => p.office === officeFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q) ||
          p.office.toLowerCase().includes(q)
      );
    }
    return list;
  }, [people, search, roleFilter, officeFilter]);

  const totalLeads = people.reduce((acc, p) => acc + p.activeLeads, 0);
  const totalEnrolled = people.reduce((acc, p) => acc + p.enrolledCount, 0);
  const avgConversion = (
    people.reduce((acc, p) => acc + p.conversionRate, 0) / people.length
  ).toFixed(1);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return;

    const newPerson: PersonRecord = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name,
      email,
      phone: phone || "+880 1700-000000",
      role,
      office,
      activeLeads: 0,
      enrolledCount: 0,
      conversionRate: 0,
      status: "In Training",
      joinedDate: "Today",
    };

    setPeople([newPerson, ...people]);
    setName("");
    setEmail("");
    setPhone("");
    setAddModalOpen(false);
  }

  const officesList = Array.from(new Set(people.map((p) => p.office)));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            People & Counselors
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage counselors, admissions officers, branch leaders, and student caseload allocations.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className={buttonPrimary}
          >
            <Plus className="size-4" />
            <span>Invite Team Member</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <StatGrid>
        <StatCard icon={Users} label="Total staff" value={people.length} note="Verified" />
        <StatCard icon={UserCheck} tone="teal" label="Active lead caseload" value={totalLeads.toLocaleString()} />
        <StatCard icon={GraduationCap} tone="success" label="Placed students" value={totalEnrolled.toLocaleString()} note="2026" />
        <StatCard icon={Award} tone="violet" label="Avg conversion rate" value={`${avgConversion}%`} />
      </StatGrid>

      {/* Search and Filters */}
      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search name, email, role or branch…" label="Search staff" />
        <SelectFilter
          label="Role"
          allLabel="All roles"
          value={roleFilter}
          onChange={setRoleFilter}
          options={["Senior Counselor", "Education Counselor", "Branch Manager", "Admissions Officer", "Compliance Lead"].map((r) => ({
            value: r,
            label: r,
            hint: people.filter((p) => p.role === r).length,
          }))}
        />
        <SelectFilter
          label="Office"
          allLabel="All offices"
          width="w-64"
          value={officeFilter}
          onChange={setOfficeFilter}
          options={officesList.map((o) => ({ value: o, label: o, hint: people.filter((p) => p.office === o).length }))}
        />
        {(search || roleFilter || officeFilter) && (
          <ResetFilters
            onClick={() => {
              setSearch("");
              setRoleFilter("");
              setOfficeFilter("");
            }}
          />
        )}
      </FilterBar>

      {/* Staff Table */}
      <Card>
        <CardHeader
          title="Team Members Directory"
          description={`Showing ${filtered.length} of ${people.length} active staff profiles.`}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                <th className="py-3 pl-6 pr-4">Staff Member</th>
                <th className="py-3 px-4">Role & Designation</th>
                <th className="py-3 px-4">Office Branch</th>
                <th className="py-3 px-4">Active Caseload</th>
                <th className="py-3 px-4">Enrolled Placements</th>
                <th className="py-3 px-4">Conversion</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No team members matched your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((person) => {
                  const initials = person.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr key={person.id} className="transition-colors hover:bg-muted/30">
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-xs text-primary">
                            {initials}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground text-sm block">
                              {person.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                              <span className="flex items-center gap-1 text-[11px]">
                                <Mail className="size-2.5" />
                                {person.email}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-[11px]">
                                <Phone className="size-2.5" />
                                {person.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {person.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-foreground font-medium">
                        {person.office}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <Users className="size-3.5 text-muted-foreground" />
                          <span>{person.activeLeads} leads</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-success">
                          <CheckCircle2 className="size-3.5" />
                          <span>{person.enrolledCount} enrolled</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                          {person.conversionRate}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            person.status === "Active"
                              ? "border border-success/20 bg-success/10 text-success"
                              : "border border-amber-500/20 bg-amber-700/10 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300"
                          )}
                        >
                          {person.status}
                        </span>
                      </td>

                      <td className="py-3.5 pl-4 pr-6 text-right">
                        <button
                          type="button"
                          className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          Profile
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Invite New Team Member</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send system login credentials and assign office branch.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mahbuba Akhter"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Work Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@bhe-consultancy.co.uk"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Official Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1711-000000"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Role</label>
                  <div className="relative mt-1">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as PersonRecord["role"])}
                      className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2 pr-8 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    >
                      <option value="Education Counselor">Education Counselor</option>
                      <option value="Senior Counselor">Senior Counselor</option>
                      <option value="Branch Manager">Branch Manager</option>
                      <option value="Admissions Officer">Admissions Officer</option>
                      <option value="Compliance Lead">Compliance Lead</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Assigned Branch</label>
                  <div className="relative mt-1">
                    <select
                      value={office}
                      onChange={(e) => setOffice(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2 pr-8 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    >
                      {officesList.map((off) => (
                        <option key={off} value={off}>
                          {off}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className={buttonSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={buttonPrimary}
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

