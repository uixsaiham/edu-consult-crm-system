"use client";

import { useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  Filter,
  GraduationCap,
  Mail,
  Phone,
  Plus,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { mockPeople, type PersonRecord } from "@/lib/mock/directory";
import { cn } from "@/lib/utils";

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
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95"
          >
            <Plus className="size-3.5" />
            <span>Invite Team Member</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Staff Members</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Users className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {people.length}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">All Verified</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Lead Caseload</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <UserCheck className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {totalLeads}
            </span>
            <span className="text-xs font-medium text-muted-foreground">Under active guidance</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Placed Students</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <GraduationCap className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {totalEnrolled}
            </span>
            <span className="text-xs font-medium text-muted-foreground">Enrolled in 2026</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Avg Conversion Rate</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
              <Award className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {avgConversion}%
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Top Benchmark</span>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff by name, email, role, or branch..."
              className="w-full rounded-full border border-border bg-background py-1.5 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              <span>Filter:</span>
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by Role"
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-hidden"
            >
              <option value="">All Roles</option>
              <option value="Senior Counselor">Senior Counselor</option>
              <option value="Education Counselor">Education Counselor</option>
              <option value="Branch Manager">Branch Manager</option>
              <option value="Admissions Officer">Admissions Officer</option>
              <option value="Compliance Lead">Compliance Lead</option>
            </select>

            <select
              value={officeFilter}
              onChange={(e) => setOfficeFilter(e.target.value)}
              aria-label="Filter by Office Branch"
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-hidden"
            >
              <option value="">All Offices</option>
              {officesList.map((off) => (
                <option key={off} value={off}>
                  {off}
                </option>
              ))}
            </select>

            {(search || roleFilter || officeFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("");
                  setOfficeFilter("");
                }}
                className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </Card>

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
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
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
                              ? "border border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "border border-amber-500/20 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
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
                <label className="text-xs font-medium text-foreground">Full Name</label>
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
                  <label className="text-xs font-medium text-foreground">Work Email</label>
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
                  <label className="text-xs font-medium text-foreground">Official Phone / WhatsApp</label>
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
                  <label className="text-xs font-medium text-foreground">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as PersonRecord["role"])}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="Education Counselor">Education Counselor</option>
                    <option value="Senior Counselor">Senior Counselor</option>
                    <option value="Branch Manager">Branch Manager</option>
                    <option value="Admissions Officer">Admissions Officer</option>
                    <option value="Compliance Lead">Compliance Lead</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground">Assigned Branch</label>
                  <select
                    value={office}
                    onChange={(e) => setOffice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  >
                    {officesList.map((off) => (
                      <option key={off} value={off}>
                        {off}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
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

