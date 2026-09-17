"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Eye,
  Filter,
  Globe2,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { mockCountries, type CountryRecord } from "@/lib/mock/directory";
import { cn } from "@/lib/utils";

export default function CountriesPage() {
  const [countries, setCountries] = useState<CountryRecord[]>(mockCountries);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewingCountry, setViewingCountry] = useState<CountryRecord | null>(null);
  const [editingCountry, setEditingCountry] = useState<CountryRecord | null>(null);

  // Add form fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [flag, setFlag] = useState("🌍");
  const [region, setRegion] = useState<CountryRecord["region"]>("Europe");
  const [currency, setCurrency] = useState("GBP (£)");
  const [avgTuition, setAvgTuition] = useState("£14,000 – £20,000");
  const [minIelts, setMinIelts] = useState("6.0 overall");
  const [partnerUniversities, setPartnerUniversities] = useState(10);
  const [directApps, setDirectApps] = useState(25);
  const [agentApps, setAgentApps] = useState(15);
  const [inProgress, setInProgress] = useState(12);
  const [completed, setCompleted] = useState(28);
  const [rejected, setRejected] = useState(3);

  // Filter logic
  const filtered = useMemo(() => {
    let list = countries;
    if (regionFilter) list = list.filter((c) => c.region === regionFilter);
    if (statusFilter === "active") list = list.filter((c) => c.isActive);
    if (statusFilter === "inactive") list = list.filter((c) => !c.isActive);

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.currency.toLowerCase().includes(q) ||
          c.region.toLowerCase().includes(q)
      );
    }
    return list;
  }, [countries, search, regionFilter, statusFilter]);

  // Aggregate totals
  const totalUniversities = countries.reduce((acc, c) => acc + c.partnerUniversities, 0);
  const totalDirect = countries.reduce((acc, c) => acc + c.directApplications, 0);
  const totalAgent = countries.reduce((acc, c) => acc + c.agentApplications, 0);
  const totalCompleted = countries.reduce((acc, c) => acc + c.completedLeads, 0);

  // Toggle active state
  function handleToggleActive(countryId: string) {
    setCountries((prev) =>
      prev.map((c) => (c.id === countryId ? { ...c, isActive: !c.isActive } : c))
    );
  }

  // Create new represented country
  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !code) return;

    const newCountry: CountryRecord = {
      id: code.toUpperCase(),
      name,
      code: code.toUpperCase(),
      flag: flag || "🌍",
      region,
      currency,
      avgTuition,
      minIelts,
      visaSuccessRate: 92.5,
      processingDays: "15-20 days",
      partnerUniversities,
      popularIntakes: ["September", "January"],
      status: "Active",
      directApplications: directApps,
      agentApplications: agentApps,
      leadInProgress: inProgress,
      completedLeads: completed,
      rejectedLeads: rejected,
      isActive: true,
    };

    setCountries([newCountry, ...countries]);
    setName("");
    setCode("");
    setFlag("🌍");
    setAddModalOpen(false);
  }

  // Update edited country
  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCountry) return;

    setCountries((prev) =>
      prev.map((c) => (c.id === editingCountry.id ? editingCountry : c))
    );
    setEditingCountry(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Represented Countries
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage global study destination markets, university representations, direct & agent application volumes, and student conversion pipelines.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95"
          >
            <Plus className="size-3.5" />
            <span>Add Represent Country</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Represented Countries</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Globe2 className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {countries.length}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              {countries.filter((c) => c.isActive).length} Active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Europe, Americas, Oceania & Asia</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Partner Universities</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Building2 className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {totalUniversities}
            </span>
            <span className="text-xs font-medium text-primary">Direct Contracts</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Accredited university partners</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Application Pipeline</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {(totalDirect + totalAgent).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {totalDirect} Dir / {totalAgent} Agt
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Direct vs agent applicant volume</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Completed Leads</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {totalCompleted.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-emerald-600">Enrolled</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Successful student visas & admissions</p>
        </Card>
      </div>

      {/* Filter and Control Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country, code, region..."
              className="w-full rounded-full border border-border bg-background py-1.5 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Region Tabs & Status Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              <span>Region:</span>
            </div>

            <div className="flex items-center gap-1 rounded-full border border-border bg-muted/40 p-0.5 text-xs">
              {["", "Europe", "North America", "Oceania", "Asia"].map((reg) => (
                <button
                  key={reg || "all"}
                  type="button"
                  onClick={() => setRegionFilter(reg)}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-semibold transition-all",
                    regionFilter === reg
                      ? "bg-surface text-primary shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {reg || "All Regions"}
                </button>
              ))}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              aria-label="Filter by Status"
              className="h-8 rounded-full border border-border bg-background px-3 text-xs font-medium text-foreground focus:border-primary focus:outline-hidden"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-full border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Card Grid View"
                className={cn(
                  "flex size-7 items-center justify-center rounded-full transition-all",
                  viewMode === "grid"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Table View"
                className={cn(
                  "flex size-7 items-center justify-center rounded-full transition-all",
                  viewMode === "table"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid View (Matching User Screenshot with Modern Design) */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              No represented countries found matching your filters.
            </div>
          ) : (
            filtered.map((country) => (
              <div
                key={country.id}
                className={cn(
                  "group relative rounded-2xl border border-border/60 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-border overflow-hidden",
                  !country.isActive && "opacity-55"
                )}
              >
                {/* Card Body */}
                <div className="p-5">
                  {/* Header: Flag + Actions */}
                  <div className="flex items-center justify-between">
                    {/* Circular Flag Badge */}
                    <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-[26px] select-none shadow-xs dark:bg-slate-800/80">
                      <span className="leading-none">{country.flag}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* View */}
                      <button
                        type="button"
                        onClick={() => setViewingCountry(country)}
                        title="View Details"
                        className="flex size-8 items-center justify-center rounded-full bg-amber-400 text-white shadow-xs transition-all hover:bg-amber-500 hover:shadow-md active:scale-95 cursor-pointer"
                      >
                        <Eye className="size-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => setEditingCountry(country)}
                        title="Edit Country"
                        className="flex size-8 items-center justify-center rounded-full bg-violet-500 text-white shadow-xs transition-all hover:bg-violet-600 hover:shadow-md active:scale-95 cursor-pointer"
                      >
                        <Pencil className="size-3.5" />
                      </button>

                      {/* Active Toggle Pill */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={country.isActive}
                        onClick={() => handleToggleActive(country.id)}
                        title={country.isActive ? "Active — click to deactivate" : "Inactive — click to activate"}
                        className={cn(
                          "relative flex h-8 w-[72px] cursor-pointer items-center rounded-full px-2 shadow-xs transition-all duration-300 focus:outline-none select-none",
                          country.isActive
                            ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                            : "bg-slate-200 dark:bg-slate-700"
                        )}
                      >
                        <span
                          className={cn(
                            "text-[10px] font-bold tracking-wide transition-all duration-300",
                            country.isActive
                              ? "text-white mr-auto"
                              : "text-slate-500 dark:text-slate-300 ml-auto"
                          )}
                        >
                          {country.isActive ? "Active" : "Off"}
                        </span>
                        <span
                          className={cn(
                            "absolute size-5 rounded-full bg-white shadow-sm transition-all duration-300",
                            country.isActive ? "right-1.5" : "left-1.5"
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Country Name */}
                  <h3 className="mt-4 text-[15px] font-bold tracking-tight text-foreground">
                    {country.name}
                  </h3>

                  {/* Thin Divider */}
                  <div className="mt-3 h-px w-full bg-border/60" />

                  {/* 6 Metric Rows */}
                  <div className="divide-y divide-border/40 text-[13px]">
                    {[
                      { label: "Total Universities", value: country.partnerUniversities },
                      { label: "Direct Applications", value: country.directApplications },
                      { label: "Agent Applications", value: country.agentApplications },
                      { label: "Lead In Progress", value: country.leadInProgress },
                      { label: "Completed Leads", value: country.completedLeads },
                      { label: "Rejected Leads", value: country.rejectedLeads },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-[9px]">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-bold tabular-nums text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Table View */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                  <th className="py-3 pl-6 pr-3">Country</th>
                  <th className="py-3 px-3">Total Universities</th>
                  <th className="py-3 px-3">Direct Apps</th>
                  <th className="py-3 px-3">Agent Apps</th>
                  <th className="py-3 px-3">In Progress</th>
                  <th className="py-3 px-3">Completed</th>
                  <th className="py-3 px-3">Rejected</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-muted/30">
                    <td className="py-3.5 pl-6 pr-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.flag}</span>
                        <div>
                          <span className="font-bold text-foreground block">{item.name}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {item.code} • {item.region}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-foreground">
                      {item.partnerUniversities} unis
                    </td>

                    <td className="py-3.5 px-3 font-medium text-foreground">
                      {item.directApplications}
                    </td>

                    <td className="py-3.5 px-3 font-medium text-foreground">
                      {item.agentApplications}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        {item.leadInProgress}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {item.completedLeads}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        {item.rejectedLeads}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.isActive}
                        onClick={() => handleToggleActive(item.id)}
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                          item.isActive ? "bg-primary" : "bg-muted-foreground/30"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out",
                            item.isActive ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </td>

                    <td className="py-3.5 pl-3 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingCountry(item)}
                          className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="View"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCountry(item)}
                          className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Represented Country Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Add Represent Country</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Register a new study destination market and initialize representation pipeline.
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

            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-semibold text-foreground">Country Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Netherlands"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Code / Flag</label>
                  <div className="flex gap-1 mt-1">
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="NLD"
                      maxLength={3}
                      className="w-16 rounded-xl border border-border bg-background px-2 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-hidden"
                    />
                    <input
                      type="text"
                      value={flag}
                      onChange={(e) => setFlag(e.target.value)}
                      placeholder="🇳🇱"
                      className="w-12 text-center rounded-xl border border-border bg-background px-1 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as CountryRecord["region"])}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="Europe">Europe</option>
                    <option value="North America">North America</option>
                    <option value="Oceania">Oceania</option>
                    <option value="Asia">Asia</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-foreground">Currency</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="EUR (€)"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Avg Tuition</label>
                  <input
                    type="text"
                    value={avgTuition}
                    onChange={(e) => setAvgTuition(e.target.value)}
                    placeholder="€10,000 – €16,000"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Min IELTS</label>
                  <input
                    type="text"
                    value={minIelts}
                    onChange={(e) => setMinIelts(e.target.value)}
                    placeholder="6.0 overall"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <span className="font-bold text-foreground block mb-2">Initial Quota & Applications</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground">Total Unis</label>
                    <input
                      type="number"
                      min={0}
                      value={partnerUniversities}
                      onChange={(e) => setPartnerUniversities(Number(e.target.value))}
                      className="mt-0.5 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">Direct Apps</label>
                    <input
                      type="number"
                      min={0}
                      value={directApps}
                      onChange={(e) => setDirectApps(Number(e.target.value))}
                      className="mt-0.5 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">Agent Apps</label>
                    <input
                      type="number"
                      min={0}
                      value={agentApps}
                      onChange={(e) => setAgentApps(Number(e.target.value))}
                      className="mt-0.5 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground">Lead In Progress</label>
                    <input
                      type="number"
                      min={0}
                      value={inProgress}
                      onChange={(e) => setInProgress(Number(e.target.value))}
                      className="mt-0.5 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">Completed Leads</label>
                    <input
                      type="number"
                      min={0}
                      value={completed}
                      onChange={(e) => setCompleted(Number(e.target.value))}
                      className="mt-0.5 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">Rejected Leads</label>
                    <input
                      type="number"
                      min={0}
                      value={rejected}
                      onChange={(e) => setRejected(Number(e.target.value))}
                      className="mt-0.5 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Confirm & Add Country
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Country Profile Modal */}
      {viewingCountry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{viewingCountry.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">{viewingCountry.name}</h3>
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">
                      {viewingCountry.code}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {viewingCountry.region} • Currency: {viewingCountry.currency}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingCountry(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-4 text-xs">
              {/* Represented Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <span className="text-muted-foreground block text-[11px]">Total Universities</span>
                  <span className="text-xl font-bold text-foreground mt-0.5 block">
                    {viewingCountry.partnerUniversities}
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <span className="text-muted-foreground block text-[11px]">Direct Applications</span>
                  <span className="text-xl font-bold text-foreground mt-0.5 block">
                    {viewingCountry.directApplications}
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <span className="text-muted-foreground block text-[11px]">Agent Applications</span>
                  <span className="text-xl font-bold text-foreground mt-0.5 block">
                    {viewingCountry.agentApplications}
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <span className="text-muted-foreground block text-[11px]">Lead In Progress</span>
                  <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {viewingCountry.leadInProgress}
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <span className="text-muted-foreground block text-[11px]">Completed Leads</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {viewingCountry.completedLeads}
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <span className="text-muted-foreground block text-[11px]">Rejected Leads</span>
                  <span className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">
                    {viewingCountry.rejectedLeads}
                  </span>
                </div>
              </div>

              {/* Visa & Tuition Specs */}
              <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Visa Success Rate:</span>
                  <span className="font-bold text-emerald-600">{viewingCountry.visaSuccessRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Average Annual Tuition:</span>
                  <span className="font-bold text-foreground">{viewingCountry.avgTuition}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Minimum IELTS Criterion:</span>
                  <span className="font-bold text-foreground">{viewingCountry.minIelts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Visa Processing Window:</span>
                  <span className="font-bold text-foreground">{viewingCountry.processingDays}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Open Intakes:</span>
                  <span className="font-semibold text-primary">{viewingCountry.popularIntakes.join(", ")}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setViewingCountry(null)}
                  className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Country Modal */}
      {editingCountry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{editingCountry.flag}</span>
                <h3 className="text-lg font-bold text-foreground">Edit {editingCountry.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCountry(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Total Universities</label>
                  <input
                    type="number"
                    min={0}
                    value={editingCountry.partnerUniversities}
                    onChange={(e) =>
                      setEditingCountry({ ...editingCountry, partnerUniversities: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Status</label>
                  <select
                    value={editingCountry.isActive ? "active" : "inactive"}
                    onChange={(e) =>
                      setEditingCountry({ ...editingCountry, isActive: e.target.value === "active" })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Direct Applications</label>
                  <input
                    type="number"
                    min={0}
                    value={editingCountry.directApplications}
                    onChange={(e) =>
                      setEditingCountry({ ...editingCountry, directApplications: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Agent Applications</label>
                  <input
                    type="number"
                    min={0}
                    value={editingCountry.agentApplications}
                    onChange={(e) =>
                      setEditingCountry({ ...editingCountry, agentApplications: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-foreground">In Progress</label>
                  <input
                    type="number"
                    min={0}
                    value={editingCountry.leadInProgress}
                    onChange={(e) =>
                      setEditingCountry({ ...editingCountry, leadInProgress: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Completed</label>
                  <input
                    type="number"
                    min={0}
                    value={editingCountry.completedLeads}
                    onChange={(e) =>
                      setEditingCountry({ ...editingCountry, completedLeads: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Rejected</label>
                  <input
                    type="number"
                    min={0}
                    value={editingCountry.rejectedLeads}
                    onChange={(e) =>
                      setEditingCountry({ ...editingCountry, rejectedLeads: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setEditingCountry(null)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
