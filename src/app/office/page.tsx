"use client";

import { HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv, toCsvRow } from "@/lib/csv";
import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Phone,
  Plus,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { mockOffices, type OfficeRecord } from "@/lib/mock/directory";
import { cn } from "@/lib/utils";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";

export default function OfficesPage() {
  const [offices, setOffices] = useState<OfficeRecord[]>(mockOffices);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [manager, setManager] = useState("");
  const [counselors, setCounselors] = useState(6);
  const [target, setTarget] = useState(200);

  const filtered = useMemo(() => {
    let list = offices;
    if (countryFilter) list = list.filter((o) => o.country === countryFilter);
    if (statusFilter) list = list.filter((o) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.city.toLowerCase().includes(q) ||
          o.manager.toLowerCase().includes(q) ||
          o.country.toLowerCase().includes(q)
      );
    }
    return list;
  }, [offices, search, countryFilter, statusFilter]);

  const totalCounselors = offices.reduce((acc, o) => acc + o.counselorCount, 0);
  const totalLeads = offices.reduce((acc, o) => acc + o.leadsThisMonth, 0);
  const totalActual = offices.reduce((acc, o) => acc + o.enrolledActual, 0);
  const totalTarget = offices.reduce((acc, o) => acc + o.enrolledTarget, 0);
  const overallPacing = Math.round((totalActual / totalTarget) * 100);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !city || !manager) return;

    const newOffice: OfficeRecord = {
      id: `OFF-${city.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`,
      name,
      city,
      country,
      address: address || `${city} Central Branch`,
      phone: phone || "+880 2 0000000",
      email: email || `${city.toLowerCase()}@bhe-consultancy.co.uk`,
      manager,
      counselorCount: counselors,
      leadsThisMonth: 0,
      enrolledTarget: target,
      enrolledActual: 0,
      conversionRate: 0,
      status: "Active",
    };

    setOffices([newOffice, ...offices]);
    setName("");
    setCity("");
    setAddress("");
    setPhone("");
    setEmail("");
    setManager("");
    setAddModalOpen(false);
  }

  const selection = useRowSelection(filtered.map((row) => row.id));
  const exportSelected = () =>
    downloadCsv(`offices-selected.csv`, offices.filter((row) => selection.isSelected(row.id)).map(toCsvRow));

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Offices & Regional Branches
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage BHE global branch network, counselor allocations, monthly intake pacing, and conversion performance.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className={buttonPrimary}
          >
            <Plus className="size-4" />
            <span>Open New Branch</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <StatGrid>
        <StatCard icon={Building2} label="Total branches" value={offices.length} note="UK & BD" />
        <StatCard icon={Users} tone="teal" label="Active counsellors" value={totalCounselors} />
        <StatCard icon={TrendingUp} tone="warning" label="Inquiries this month" value={totalLeads.toLocaleString()} note="+14% MoM" />
        <StatCard icon={CheckCircle2} tone="success" label="Intake target pacing" value={`${overallPacing}%`} note={`${totalActual} / ${totalTarget}`} />
      </StatGrid>

      {/* Filter and Search Bar */}
      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search branch, city or manager…" label="Search branches" />
        <SelectFilter
          label="Country"
          allLabel="All countries"
          value={countryFilter}
          onChange={setCountryFilter}
          options={["United Kingdom", "Bangladesh"].map((c) => ({ value: c, label: c, hint: offices.filter((o) => o.country === c).length }))}
        />
        <SelectFilter
          label="Status"
          allLabel="All statuses"
          value={statusFilter}
          onChange={setStatusFilter}
          options={["Active", "Expanding"].map((st) => ({ value: st, label: st, hint: offices.filter((o) => o.status === st).length }))}
        />
        {(search || countryFilter || statusFilter) && (
          <ResetFilters
            onClick={() => {
              setSearch("");
              setCountryFilter("");
              setStatusFilter("");
            }}
          />
        )}
      </FilterBar>

      {/* Offices Table */}
      <Card>
        <CardHeader
          title="BHE Regional Network Directory"
          description={`Showing ${filtered.length} of ${offices.length} branches across global operations.`}
        />

        <SelectionBar selection={selection} noun={["office", "offices"]} onExport={exportSelected} className="mx-4 mb-3 sm:mx-6" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                <th className="w-10 py-2.5 pl-6 pr-0">
                  <HeaderCheckbox selection={selection} />
                </th>
                <th className="py-3 pl-3 pr-4">Branch & Location</th>
                <th className="py-3 px-4">Branch Lead / Manager</th>
                <th className="py-3 px-4">Counselor Team</th>
                <th className="py-3 px-4">Current Intake Pacing</th>
                <th className="py-3 px-4">Conversion Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No branches matched your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((office) => {
                  const pct = Math.min(100, Math.round((office.enrolledActual / office.enrolledTarget) * 100));
                  return (
                    <tr key={office.id} className={cn("transition-colors hover:bg-muted/30", selectedRowClass(selection, office.id))}>
                      <td className="py-3 pl-6 pr-0 align-middle">
                        <RowCheckbox selection={selection} id={office.id} label={`Select ${office.name}`} />
                      </td>
                      <td className="py-3.5 pl-3 pr-4">
                        <div className="flex items-start gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary font-bold text-xs">
                            {office.city.substring(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground text-sm block">
                              {office.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                              <MapPin className="size-3" />
                              <span>{office.city}, {office.country}</span>
                            </div>
                            <span className="text-[11px] text-muted-foreground/80 mt-0.5 line-clamp-1">
                              {office.address}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <span className="font-medium text-foreground block">{office.manager}</span>
                        <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                          <Phone className="size-2.5" />
                          <span className="text-[11px]">{office.phone}</span>
                        </div>
                        <span className="text-[11px] text-primary block mt-0.5">{office.email}</span>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <Users className="size-3.5 text-muted-foreground" />
                          <span>{office.counselorCount} Advisors</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          {office.leadsThisMonth} inquiries/mo
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-top min-w-[170px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-foreground">
                            {office.enrolledActual} / {office.enrolledTarget}
                          </span>
                          <span className="font-semibold text-primary">{pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              pct >= 85
                                ? "bg-success"
                                : pct >= 65
                                ? "bg-primary"
                                : "bg-amber-500"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                          {office.conversionRate}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            office.status === "Active"
                              ? "border border-success/20 bg-success/10 text-success"
                              : "border border-amber-500/20 bg-amber-700/10 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300"
                          )}
                        >
                          {office.status}
                        </span>
                      </td>

                      <td className="py-3.5 pl-4 pr-6 align-top text-right">
                        <button
                          type="button"
                          className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          Manage
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

      {/* Add Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Open New Regional Branch</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Register a physical office branch and assign staff capacities.
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
                  Branch Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chittagong Agrabad Hub"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    City <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Chittagong"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Country</label>
                  <div className="relative mt-1">
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2 pr-8 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    >
                      <option value="Bangladesh">Bangladesh</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                      <option value="Malaysia">Malaysia</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Full Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Level 4, Tower Plaza, Agrabad C/A"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Branch Manager / Lead <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    placeholder="e.g. Farhan Chowdhury"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Official Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 31 778899"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Counselors Allocated</label>
                  <input
                    type="number"
                    min={1}
                    value={counselors}
                    onChange={(e) => setCounselors(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Intake Target (Students)</label>
                  <input
                    type="number"
                    min={10}
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
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
                  Confirm & Open Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

