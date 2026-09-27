"use client";

import { HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv, toCsvRow } from "@/lib/csv";
import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Eye,
  Globe2,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  RotateCcw,
  TrendingUp,
  X,
} from "lucide-react";
import { AddRepresentedCountry } from "@/components/countries/add-represented-country";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { Tooltip } from "@/components/ui/tooltip";
import { mockCountries, type CountryRecord } from "@/lib/mock/directory";
import { cn } from "@/lib/utils";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";

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
  function handleCreate(country: CountryRecord) {
    setCountries((prev) => [country, ...prev]);
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

  const selection = useRowSelection(filtered.map((row) => row.id));
  const exportSelected = () =>
    downloadCsv(`countries-selected.csv`, countries.filter((row) => selection.isSelected(row.id)).map(toCsvRow));

  return (
    <div className="flex flex-col gap-4">
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
            className={buttonPrimary}
          >
            <Plus className="size-4" />
            <span>Add Represent Country</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <StatGrid>
        <StatCard
          icon={Globe2}
          label="Represented countries"
          value={countries.length}
          note={`${countries.filter((c) => c.isActive).length} active`}
        />
        <StatCard icon={Building2} tone="warning" label="Partner universities" value={totalUniversities.toLocaleString()} />
        <StatCard
          icon={TrendingUp}
          tone="violet"
          label="Applications"
          value={(totalDirect + totalAgent).toLocaleString()}
          note={`${totalDirect.toLocaleString()} dir · ${totalAgent.toLocaleString()} agt`}
        />
        <StatCard icon={CheckCircle2} tone="success" label="Completed leads" value={totalCompleted.toLocaleString()} note="Enrolled" />
      </StatGrid>

      {/* Filter and Control Bar */}
      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search country, code, region…" label="Search countries" />
        <SelectFilter
          label="Region"
          allLabel="All regions"
          value={regionFilter}
          onChange={setRegionFilter}
          options={["Europe", "North America", "Oceania", "Asia"].map((r) => ({
            value: r,
            label: r,
            hint: countries.filter((c) => c.region === r).length,
          }))}
        />
        <SelectFilter
          label="Status"
          allLabel="All statuses"
          value={statusFilter === "all" ? "" : statusFilter}
          onChange={(v) => setStatusFilter((v || "all") as "all" | "active" | "inactive")}
          options={[
            { value: "active", label: "Active", hint: countries.filter((c) => c.isActive).length },
            { value: "inactive", label: "Inactive", hint: countries.filter((c) => !c.isActive).length },
          ]}
        />
        {(search || regionFilter || statusFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setRegionFilter("");
              setStatusFilter("all");
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </button>
        )}

        {/* View mode */}
        <div role="group" aria-label="View" className="ml-auto flex h-9 items-center gap-0.5 rounded-lg bg-surface-muted p-1">
          {([
            { mode: "grid", label: "Card view", icon: LayoutGrid },
            { mode: "table", label: "Table view", icon: List },
          ] as const).map(({ mode, label, icon: Icon }) => (
            <Tooltip key={mode} label={label} align="end">
              <button
                type="button"
                aria-label={label}
                aria-pressed={viewMode === mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors",
                  viewMode === mode ? "bg-surface text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
              </button>
            </Tooltip>
          ))}
        </div>
      </FilterBar>

      {/* Grid View — compact cards, 4 per row on wide screens */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              No represented countries found matching your filters.
            </div>
          ) : (
            filtered.map((country) => (
              <div
                key={country.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-md"
              >
                {/* Header: flag, name, status switch */}
                <div className="flex items-center gap-3 px-4 pt-4">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-surface-muted text-xl leading-none",
                      !country.isActive && "grayscale"
                    )}
                  >
                    {country.flagImage ? (
                      // eslint-disable-next-line @next/next/no-img-element -- user-uploaded preview
                      <img src={country.flagImage} alt="" className="size-full rounded-full object-cover" />
                    ) : (
                      country.flag
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-foreground">{country.name}</h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {country.region} · {country.currency}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={country.isActive}
                    aria-label={`${country.name} active`}
                    title={country.isActive ? "Active — click to deactivate" : "Inactive — click to activate"}
                    onClick={() => handleToggleActive(country.id)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-primary",
                      country.isActive ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                        country.isActive ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* Metrics: 3 × 2 grid, outcomes colour-coded */}
                <div className="px-4 pt-4">
                  <dl
                    className={cn(
                      "grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border/70 bg-border-strong/60",
                      !country.isActive && "opacity-50"
                    )}
                  >
                    {[
                      { label: "Universities", value: country.partnerUniversities, tone: "text-foreground" },
                      { label: "Direct apps", value: country.directApplications, tone: "text-foreground" },
                      { label: "Agent apps", value: country.agentApplications, tone: "text-foreground" },
                      { label: "In progress", value: country.leadInProgress, tone: "text-warning" },
                      { label: "Completed", value: country.completedLeads, tone: "text-success" },
                      { label: "Rejected", value: country.rejectedLeads, tone: "text-danger" },
                    ].map(({ label, value, tone }) => (
                      <div key={label} className="flex min-w-0 flex-col items-center bg-surface-muted/30 px-1 py-2.5 text-center">
                        <dd className={cn("text-base font-bold leading-tight tabular-nums", tone)}>
                          {value.toLocaleString("en-GB")}
                        </dd>
                        <dt className="mt-0.5 w-full truncate text-[11px] text-muted-foreground">{label}</dt>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Actions */}
                <div className="mt-auto grid grid-cols-2 gap-2 p-4">
                  <button
                    type="button"
                    onClick={() => setViewingCountry(country)}
                    className="flex h-8 items-center justify-center gap-1.5 group/btn rounded-full border border-border bg-surface text-xs font-medium text-foreground transition-colors hover:border-warning hover:bg-warning hover:text-white"
                  >
                    <Eye className="size-3.5 text-warning transition-colors group-hover/btn:text-white" />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCountry(country)}
                    className="flex h-8 items-center justify-center gap-1.5 group/btn rounded-full border border-border bg-surface text-xs font-medium text-foreground transition-colors hover:border-violet-500 hover:bg-violet-500 hover:text-white"
                  >
                    <Pencil className="size-3.5 text-violet-500 transition-colors group-hover/btn:text-white" />
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Table View */
        <Card>
          <SelectionBar selection={selection} noun={["country", "countries"]} onExport={exportSelected} className="mx-4 mb-3 sm:mx-6" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                  <th className="w-10 py-2.5 pl-6 pr-0">
                    <HeaderCheckbox selection={selection} />
                  </th>
                  <th className="py-3 pl-3 pr-3">Country</th>
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
                  <tr key={item.id} className={cn("transition-colors hover:bg-muted/30", selectedRowClass(selection, item.id))}>
                    <td className="py-3 pl-6 pr-0 align-middle">
                      <RowCheckbox selection={selection} id={item.id} label={`Select ${item.name}`} />
                    </td>
                    <td className="py-3.5 pl-3 pr-3">
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
                      <span className="rounded-md bg-amber-700/10 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-300/10 dark:text-amber-300">
                        {item.leadInProgress}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="rounded-md bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success">
                        {item.completedLeads}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="rounded-md bg-rose-700/10 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-300/10 dark:text-rose-300">
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

      {/* Add Represented Country */}
      {addModalOpen && (
        <AddRepresentedCountry existing={countries} onClose={() => setAddModalOpen(false)} onCreate={handleCreate} />
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
                  <span className="text-xl font-bold text-success mt-0.5 block">
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
                  <span className="font-bold text-success">{viewingCountry.visaSuccessRate}%</span>
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
                  className={buttonPrimary}
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
                  <label className="text-xs font-semibold text-foreground">Total Universities</label>
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
                  <label className="text-xs font-semibold text-foreground">Status</label>
                  <div className="relative mt-1">
                    <select
                      value={editingCountry.isActive ? "active" : "inactive"}
                      onChange={(e) =>
                        setEditingCountry({ ...editingCountry, isActive: e.target.value === "active" })
                      }
                      className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2 pr-8 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Direct Applications</label>
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
                  <label className="text-xs font-semibold text-foreground">Agent Applications</label>
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
                  <label className="text-xs font-semibold text-foreground">In Progress</label>
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
                  <label className="text-xs font-semibold text-foreground">Completed</label>
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
                  <label className="text-xs font-semibold text-foreground">Rejected</label>
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
                  className={buttonSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={buttonPrimary}
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
