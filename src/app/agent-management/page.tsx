"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  ChevronDown,
  FileCheck,
  GraduationCap,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { mockAgents, type AgentRecord } from "@/lib/mock/directory";
import { cn } from "@/lib/utils";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";

export default function AgentManagementPage() {
  const [agents, setAgents] = useState<AgentRecord[]>(mockAgents);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [complianceFilter, setComplianceFilter] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [country, setCountry] = useState("Bangladesh");
  const [tier, setTier] = useState<AgentRecord["tier"]>("Silver Partner");
  const [commissionRate, setCommissionRate] = useState("50% of net");

  const filtered = useMemo(() => {
    let list = agents;
    if (tierFilter) list = list.filter((a) => a.tier === tierFilter);
    if (complianceFilter) list = list.filter((a) => a.complianceStatus === complianceFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.companyName.toLowerCase().includes(q) ||
          a.contactPerson.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.country.toLowerCase().includes(q)
      );
    }
    return list;
  }, [agents, search, tierFilter, complianceFilter]);

  const totalReferred = agents.reduce((acc, a) => acc + a.referredApps, 0);
  const totalEnrolled = agents.reduce((acc, a) => acc + a.enrolledStudents, 0);
  const overallConversion = Math.round((totalEnrolled / totalReferred) * 100);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !contactPerson || !email) return;

    const newAgent: AgentRecord = {
      id: `AGT-${Date.now().toString().slice(-4)}`,
      name,
      companyName: companyName || name,
      contactPerson,
      email,
      phone: phone || "+880 1700-000000",
      city,
      country,
      tier,
      commissionRate,
      referredApps: 0,
      enrolledStudents: 0,
      complianceStatus: "Pending Audit",
      joinedYear: "2026",
    };

    setAgents([newAgent, ...agents]);
    setName("");
    setCompanyName("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setAddModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Agent & Partner Management
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage educational agencies, sub-agent commissions, KYC compliance certifications, and referral pipelines.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className={buttonPrimary}
          >
            <Plus className="size-4" />
            <span>Onboard New Agent</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <StatGrid>
        <StatCard icon={Briefcase} label="Active agencies" value={agents.length} note="Contracted" />
        <StatCard icon={TrendingUp} tone="primary" label="Referred applications" value={totalReferred.toLocaleString()} note="+22% YoY" />
        <StatCard icon={GraduationCap} tone="success" label="Confirmed enrolments" value={totalEnrolled.toLocaleString()} />
        <StatCard icon={CheckCircle2} tone="violet" label="Conversion ratio" value={`${overallConversion}%`} />
      </StatGrid>

      {/* Filter and Search Bar */}
      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search agency, contact or city…" label="Search agents" />
        <SelectFilter
          label="Tier"
          allLabel="All tiers"
          value={tierFilter}
          onChange={setTierFilter}
          options={[
            { value: "Gold Partner", label: "Gold Partner (60–65%)" },
            { value: "Silver Partner", label: "Silver Partner (50–55%)" },
            { value: "Bronze Partner", label: "Bronze Partner (45%)" },
          ]}
        />
        <SelectFilter
          label="Compliance"
          allLabel="All compliance"
          value={complianceFilter}
          onChange={setComplianceFilter}
          options={["Verified", "Pending Audit"]}
        />
        {(search || tierFilter || complianceFilter) && (
          <ResetFilters
            onClick={() => {
              setSearch("");
              setTierFilter("");
              setComplianceFilter("");
            }}
          />
        )}
      </FilterBar>

      {/* Agents Table */}
      <Card>
        <CardHeader
          title="Contracted B2B Educational Agents"
          description={`Showing ${filtered.length} of ${agents.length} authorized agency partners.`}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                <th className="py-3 pl-6 pr-4">Agency Details</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Partner Tier</th>
                <th className="py-3 px-4">Commission Split</th>
                <th className="py-3 px-4">Referrals & Enrollment</th>
                <th className="py-3 px-4">KYC Compliance</th>
                <th className="py-3 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No partner agencies matched your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((agent) => {
                  const convPct =
                    agent.referredApps > 0
                      ? Math.round((agent.enrolledStudents / agent.referredApps) * 100)
                      : 0;

                  return (
                    <tr key={agent.id} className="transition-colors hover:bg-muted/30">
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-start gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary font-bold text-xs">
                            <Briefcase className="size-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-foreground text-sm block">
                              {agent.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground block mt-0.5">
                              {agent.city}, {agent.country} • Since {agent.joinedYear}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <span className="font-medium text-foreground block">{agent.contactPerson}</span>
                        <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                          <Mail className="size-2.5" />
                          <span className="text-[11px]">{agent.email}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                          <Phone className="size-2.5" />
                          <span className="text-[11px]">{agent.phone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap",
                            agent.tier === "Gold Partner"
                              ? "border-amber-300/70 bg-amber-500/15 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                              : agent.tier === "Silver Partner"
                              ? "border-slate-300/70 bg-slate-500/15 text-slate-700 dark:border-slate-400/30 dark:bg-slate-400/15 dark:text-slate-300"
                              : "border-orange-300/70 bg-orange-500/15 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              agent.tier === "Gold Partner"
                                ? "bg-amber-500"
                                : agent.tier === "Silver Partner"
                                ? "bg-slate-400"
                                : "bg-orange-500"
                            )}
                          />
                          {agent.tier}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <span className="font-semibold text-foreground block">
                          {agent.commissionRate}
                        </span>
                        <span className="text-[11px] text-muted-foreground">Invoice net sharing</span>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {agent.enrolledStudents} / {agent.referredApps} apps
                          </span>
                          <span className="rounded-full bg-success/10 px-1.5 py-0.2 text-[10px] font-bold text-success">
                            {convPct}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-success rounded-full"
                            style={{ width: `${convPct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            agent.complianceStatus === "Verified"
                              ? "border border-success/20 bg-success/10 text-success"
                              : "border border-amber-500/20 bg-amber-700/10 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300"
                          )}
                        >
                          {agent.complianceStatus === "Verified" ? (
                            <ShieldCheck className="size-3" />
                          ) : (
                            <FileCheck className="size-3" />
                          )}
                          <span>{agent.complianceStatus}</span>
                        </span>
                      </td>

                      <td className="py-3.5 pl-4 pr-6 align-top text-right">
                        <button
                          type="button"
                          className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          Agreement
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

      {/* Onboard Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Onboard Partner Agency</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Register a new educational agency and establish commission split terms.
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
                  Agency Brand Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Zenith Global Education"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Registered Legal Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Zenith Overseas Consultants Ltd"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Principal Contact Person <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Tariq Mahmood"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Official Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@zenithglobal.com"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Partner Tier</label>
                  <div className="relative mt-1">
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value as AgentRecord["tier"])}
                      className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2 pr-8 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    >
                      <option value="Gold Partner">Gold Partner</option>
                      <option value="Silver Partner">Silver Partner</option>
                      <option value="Bronze Partner">Bronze Partner</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Commission Rate</label>
                  <input
                    type="text"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    placeholder="e.g. 55% of net"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
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
                  Onboard Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

