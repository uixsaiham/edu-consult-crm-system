"use client";

import { useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  Building2,
  Clock,
  Filter,
  Landmark,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { mockInstitutions, type InstitutionRecord } from "@/lib/mock/directory";
import { cn } from "@/lib/utils";

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<InstitutionRecord[]>(mockInstitutions);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [city, setCity] = useState("");
  const [ranking, setRanking] = useState("");
  const [commissionTier, setCommissionTier] = useState<InstitutionRecord["commissionTier"]>("Tier 1 (15-18%)");

  const filtered = useMemo(() => {
    let list = institutions;
    if (countryFilter) list = list.filter((inst) => inst.country === countryFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (inst) =>
          inst.name.toLowerCase().includes(q) ||
          inst.city.toLowerCase().includes(q) ||
          inst.country.toLowerCase().includes(q)
      );
    }
    return list;
  }, [institutions, search, countryFilter]);

  const totalPrograms = institutions.reduce((acc, i) => acc + i.programsCount, 0);
  const directContracts = institutions.filter((i) => i.agreementType === "Direct Agreement").length;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !city) return;

    const newInst: InstitutionRecord = {
      id: `INS-0${institutions.length + 1}`,
      name,
      country,
      city,
      logoText: name.slice(0, 3).toUpperCase(),
      ranking: ranking || "Ranked UK Institution",
      commissionTier,
      agreementType: "Direct Agreement",
      tatDays: "48-72 hours",
      openIntakes: ["September 2026", "January 2027"],
      programsCount: 85,
      featured: false,
    };

    setInstitutions([newInst, ...institutions]);
    setName("");
    setCity("");
    setRanking("");
    setAddModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Institutions & Universities
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Contracted partner universities, direct representation agreements, commission tiers, and application TAT.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95"
          >
            <Plus className="size-3.5" />
            <span>Add University</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Partner Institutions</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Building2 className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">{institutions.length}</span>
            <span className="text-xs font-medium text-emerald-600">Universities & Colleges</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Across UK, Ireland, US, CA & AU</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Direct Agreements</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Award className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">{directContracts}</span>
            <span className="text-xs font-medium text-primary">Priority Agency</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Direct tier-1 representation contracts</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Offered Programs</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <BookOpen className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">{totalPrograms.toLocaleString()}</span>
            <span className="text-xs font-medium text-purple-600">Active Degrees</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Undergrad, Master & Foundation</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Average Offer TAT</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Clock className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">48-72h</span>
            <span className="text-xs font-medium text-emerald-600">Fast-track</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Dedicated admissions desk support</p>
        </Card>
      </div>

      {/* Directory Table Card */}
      <Card className="flex flex-col">
        <CardHeader
          icon={Landmark}
          iconBg="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          iconColor="text-amber-600"
          title="University Contracts & Representation"
          subtitle="Direct representation terms, ranking tiers, application processing speed, and program catalogs"
          action={
            <span className="text-xs font-medium text-muted-foreground">
              Showing {filtered.length} institutions
            </span>
          }
        />

        {/* Filter Bar */}
        <div className="flex flex-col gap-2.5 border-b border-border/70 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-muted-foreground">Country:</span>
            <div className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-0.5">
              {["", "United Kingdom", "Ireland", "United States", "Canada", "Australia"].map((c) => (
                <button
                  key={c || "all"}
                  type="button"
                  onClick={() => setCountryFilter(c)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all",
                    countryFilter === c ? "bg-surface text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c ? (c === "United Kingdom" ? "UK" : c === "United States" ? "USA" : c) : "All"}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search university or city..."
              className="h-7 w-full rounded-full border border-border bg-surface pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-surface-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 pl-6 pr-3 font-semibold">University</th>
                <th className="px-3 py-3 font-semibold">Country & City</th>
                <th className="px-3 py-3 font-semibold">Commission Tier</th>
                <th className="px-3 py-3 font-semibold">Agreement Type</th>
                <th className="px-3 py-3 font-semibold">Turnaround (TAT)</th>
                <th className="px-3 py-3 font-semibold">Programs</th>
                <th className="py-3 pl-3 pr-6 text-right font-semibold">Open Intakes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((inst) => (
                <tr key={inst.id} className="group transition-colors hover:bg-surface-muted/40">
                  <td className="py-3.5 pl-6 pr-3 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted border border-border font-mono font-bold text-primary text-xs">
                        {inst.logoText}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">{inst.name}</span>
                          {inst.featured && (
                            <span className="rounded-full bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                              Top Partner
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{inst.ranking}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3.5 align-middle">
                    <span className="font-semibold text-foreground">{inst.city}</span>
                    <p className="text-[11px] text-muted-foreground">{inst.country}</p>
                  </td>

                  <td className="px-3 py-3.5 align-middle">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                        inst.commissionTier.includes("Tier 1")
                          ? "border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "border-primary/20 bg-primary-soft text-primary"
                      )}
                    >
                      {inst.commissionTier}
                    </span>
                  </td>

                  <td className="px-3 py-3.5 align-middle">
                    <span className="text-foreground font-medium">{inst.agreementType}</span>
                  </td>

                  <td className="px-3 py-3.5 align-middle text-muted-foreground text-[11px]">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3 text-muted-foreground" />
                      <span>{inst.tatDays}</span>
                    </div>
                  </td>

                  <td className="px-3 py-3.5 align-middle">
                    <span className="font-semibold text-foreground tabular-nums">{inst.programsCount}</span>
                    <span className="text-[11px] text-muted-foreground ml-1">courses</span>
                  </td>

                  <td className="py-3.5 pl-3 pr-6 align-middle text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {inst.openIntakes.map((intake) => (
                        <span
                          key={intake}
                          className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {intake}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Institution Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 card-shadow">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Add Partner University</h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Institution Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. University of Westminster"
                  className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Ireland">Ireland</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">City / Campus</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="London"
                    className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Ranking / Accolade</label>
                  <input
                    type="text"
                    value={ranking}
                    onChange={(e) => setRanking(e.target.value)}
                    placeholder="Top 100 UK"
                    className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Commission Tier</label>
                  <select
                    value={commissionTier}
                    onChange={(e) => setCommissionTier(e.target.value as InstitutionRecord["commissionTier"])}
                    className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="Tier 1 (15-18%)">Tier 1 (15-18%)</option>
                    <option value="Tier 2 (12-15%)">Tier 2 (12-15%)</option>
                    <option value="Tier 3 (10-12%)">Tier 3 (10-12%)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Save University
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
