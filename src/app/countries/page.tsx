"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Filter,
  Globe2,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { mockCountries, type CountryRecord } from "@/lib/mock/directory";
import { cn } from "@/lib/utils";

export default function CountriesPage() {
  const [countries, setCountries] = useState<CountryRecord[]>(mockCountries);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Add form fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [flag, setFlag] = useState("🌍");
  const [region, setRegion] = useState<"Europe" | "North America" | "Oceania" | "Asia">("Europe");
  const [currency, setCurrency] = useState("GBP (£)");
  const [avgTuition, setAvgTuition] = useState("£14,000 - £20,000");
  const [minIelts, setMinIelts] = useState("6.0 overall");

  const filtered = useMemo(() => {
    let list = countries;
    if (regionFilter) list = list.filter((c) => c.region === regionFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.currency.toLowerCase().includes(q)
      );
    }
    return list;
  }, [countries, search, regionFilter]);

  const totalPartners = countries.reduce((acc, c) => acc + c.partnerUniversities, 0);
  const avgVisa = (
    countries.reduce((acc, c) => acc + c.visaSuccessRate, 0) / countries.length
  ).toFixed(1);

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
      partnerUniversities: 12,
      popularIntakes: ["September", "January"],
      status: "Active",
    };

    setCountries([...countries, newCountry]);
    setName("");
    setCode("");
    setAddModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Countries & Destinations
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore global education markets, visa regulations, tuition thresholds, and university partnerships.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95"
          >
            <Plus className="size-3.5" />
            <span>Add Destination</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Destination Countries</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Globe2 className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">{countries.length}</span>
            <span className="text-xs font-medium text-emerald-600">Active Portfolios</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Across UK, North America & Oceania</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Partner Universities</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Building2 className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">{totalPartners}</span>
            <span className="text-xs font-medium text-primary">Direct Contracts</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Represented by BHE Consultancy</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Avg Visa Success Rate</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">{avgVisa}%</span>
            <span className="text-xs font-medium text-emerald-600">Trailing 12M</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Industry leading compliance record</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Primary Intake Cycle</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <Sparkles className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">Sep 2026</span>
            <span className="text-xs font-medium text-purple-600">Open Now</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Highest applicant intake volume</p>
        </Card>
      </div>

      {/* Directory Card */}
      <Card className="flex flex-col">
        <CardHeader
          icon={Globe2}
          iconBg="bg-primary-soft"
          iconColor="text-primary"
          title="Study Destination Directory"
          subtitle="Entry criteria, average tuition fees, visa turnaround times, and intake cycles"
          action={
            <span className="text-xs font-medium text-muted-foreground">
              Showing {filtered.length} of {countries.length} countries
            </span>
          }
        />

        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-2.5 border-b border-border/70 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-muted-foreground">Region:</span>
            <div className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-0.5">
              {["", "Europe", "North America", "Oceania", "Asia"].map((reg) => (
                <button
                  key={reg || "all"}
                  type="button"
                  onClick={() => setRegionFilter(reg)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all",
                    regionFilter === reg ? "bg-surface text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {reg || "All Regions"}
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
              placeholder="Search country or currency..."
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

        {/* Countries Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-surface-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 pl-6 pr-3 font-semibold">Country</th>
                <th className="px-3 py-3 font-semibold">Avg Tuition</th>
                <th className="px-3 py-3 font-semibold">English (IELTS)</th>
                <th className="px-3 py-3 font-semibold">Visa Success</th>
                <th className="px-3 py-3 font-semibold">Processing TAT</th>
                <th className="px-3 py-3 font-semibold">Universities</th>
                <th className="py-3 pl-3 pr-6 text-right font-semibold">Popular Intakes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((item) => (
                <tr key={item.id} className="group transition-colors hover:bg-surface-muted/40">
                  <td className="py-3.5 pl-6 pr-3 align-middle">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.flag}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">{item.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">({item.code})</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{item.region}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3.5 align-middle">
                    <span className="font-semibold text-foreground">{item.avgTuition}</span>
                    <p className="text-[10px] text-muted-foreground">{item.currency}</p>
                  </td>

                  <td className="px-3 py-3.5 align-middle">
                    <span className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-foreground">
                      {item.minIelts}
                    </span>
                  </td>

                  <td className="px-3 py-3.5 align-middle">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${item.visaSuccessRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {item.visaSuccessRate}%
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3.5 align-middle text-muted-foreground text-[11px]">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3 text-muted-foreground" />
                      <span>{item.processingDays}</span>
                    </div>
                  </td>

                  <td className="px-3 py-3.5 align-middle">
                    <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">
                      {item.partnerUniversities} partners
                    </span>
                  </td>

                  <td className="py-3.5 pl-3 pr-6 align-middle text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {item.popularIntakes.map((intake) => (
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

      {/* Add Destination Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 card-shadow">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Add Study Destination</h3>
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
                <label className="text-xs font-semibold text-foreground">Country Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Netherlands"
                  className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">ISO Code (3-letter)</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. NLD"
                    className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Flag Emoji</label>
                  <input
                    type="text"
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    placeholder="🇳🇱"
                    className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as CountryRecord["region"])}
                    className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="Europe">Europe</option>
                    <option value="North America">North America</option>
                    <option value="Oceania">Oceania</option>
                    <option value="Asia">Asia</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Currency</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="EUR (€)"
                    className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Avg Tuition</label>
                  <input
                    type="text"
                    value={avgTuition}
                    onChange={(e) => setAvgTuition(e.target.value)}
                    placeholder="£14,000 - £20,000"
                    className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Min IELTS</label>
                  <input
                    type="text"
                    value={minIelts}
                    onChange={(e) => setMinIelts(e.target.value)}
                    placeholder="6.0 overall"
                    className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
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
                  Save Country
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
