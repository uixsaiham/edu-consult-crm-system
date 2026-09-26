"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Building2, Clock, Globe, Landmark, Plus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonPrimary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { RowActions, StatusSwitch, WebsiteToggle } from "@/components/institutions/row-actions";
import { BarButton, HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv, toCsvRow } from "@/lib/csv";
import { InstitutionView } from "@/components/institutions/institution-view";
import type { InstitutionRecord } from "@/lib/mock/directory";
import {
  clearLastChange,
  getInstitutions,
  getLastChange,
  isActive,
  isOnWebsite,
  updateInstitution,
} from "@/lib/mock/institution-store";
import { cn } from "@/lib/utils";

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<InstitutionRecord[]>(getInstitutions);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [webFilter, setWebFilter] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [lastChange] = useState(getLastChange);
  const [toast, notify] = useToast();

  useEffect(() => {
    if (!lastChange) return;
    clearLastChange();
    notify(lastChange.kind === "added" ? "Institution added to your directory" : "Changes saved");
  }, [lastChange, notify]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return institutions.filter((inst) => {
      if (countryFilter && inst.country !== countryFilter) return false;
      if (statusFilter === "active" && !isActive(inst)) return false;
      if (statusFilter === "inactive" && isActive(inst)) return false;
      if (webFilter === "live" && !isOnWebsite(inst)) return false;
      if (webFilter === "hidden" && isOnWebsite(inst)) return false;
      return !q || `${inst.name} ${inst.city} ${inst.country}`.toLowerCase().includes(q);
    });
  }, [institutions, search, countryFilter, statusFilter, webFilter]);

  const activeList = institutions.filter(isActive);
  const liveList = institutions.filter(isOnWebsite);
  const viewing = institutions.find((i) => i.id === viewingId) ?? null;
  const selection = useRowSelection(filtered.map((i) => i.id));
  const selectedInstitutions = institutions.filter((i) => selection.isSelected(i.id));

  const bulkActive = (next: boolean) => {
    selectedInstitutions.forEach((i) => updateInstitution(i.id, next ? { active: true } : { active: false, showOnWebsite: false }));
    setInstitutions(getInstitutions());
    notify(`${selectedInstitutions.length} institution${selectedInstitutions.length === 1 ? "" : "s"} ${next ? "activated" : "deactivated"}`);
  };

  const bulkWebsite = (next: boolean) => {
    const eligible = selectedInstitutions.filter(isActive);
    eligible.forEach((i) => updateInstitution(i.id, { showOnWebsite: next }));
    setInstitutions(getInstitutions());
    const skipped = selectedInstitutions.length - eligible.length;
    notify(
      `${eligible.length} ${next ? "published to" : "hidden from"} the website` + (next && skipped ? ` · ${skipped} inactive skipped` : "")
    );
  };
  const hasFilters = !!(search || countryFilter || statusFilter || webFilter);

  const patch = (id: string, change: Partial<InstitutionRecord>) => {
    updateInstitution(id, change);
    setInstitutions(getInstitutions());
  };

  const setActive = (inst: InstitutionRecord, next: boolean) => {
    // Deactivating also unpublishes, so hidden institutions never appear on the website.
    patch(inst.id, next ? { active: true } : { active: false, showOnWebsite: false });
    notify(next ? `${inst.name} is active` : `${inst.name} deactivated and removed from the website`);
  };

  const setWebsite = (inst: InstitutionRecord, next: boolean) => {
    patch(inst.id, { showOnWebsite: next });
    notify(next ? `${inst.programsCount} courses published to the website` : `${inst.name}'s courses hidden from the website`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Institutions & Universities</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Contracted partner universities, direct representation agreements, commission tiers, and application TAT.
          </p>
        </div>
        <Link href="/institutions/new" className={cn(buttonPrimary, "shrink-0 self-start sm:self-auto")}>
          <Plus className="size-4" />
          <span>Add Institution</span>
        </Link>
      </div>

      <StatGrid>
        <StatCard
          icon={Building2}
          label="Active institutions"
          value={activeList.length}
          note={`of ${institutions.length}`}
          onClick={() => setStatusFilter(statusFilter === "active" ? "" : "active")}
        />
        <StatCard
          icon={Globe}
          tone="danger"
          label="Live on website"
          value={liveList.length}
          note={`${liveList.reduce((s, i) => s + i.programsCount, 0).toLocaleString()} courses`}
          onClick={() => setWebFilter(webFilter === "live" ? "" : "live")}
        />
        <StatCard icon={BookOpen} tone="violet" label="Offered programs" value={activeList.reduce((s, i) => s + i.programsCount, 0).toLocaleString()} />
        <StatCard icon={Clock} tone="success" label="Average offer time" value="48–72h" note="Fast-track" />
      </StatGrid>

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search university or city…" label="Search institutions" />
        <SelectFilter
          label="Country"
          allLabel="All countries"
          value={countryFilter}
          onChange={setCountryFilter}
          options={[...new Set(institutions.map((i) => i.country))].sort().map((c) => ({
            value: c,
            label: c,
            hint: institutions.filter((i) => i.country === c).length,
          }))}
        />
        <SelectFilter
          label="Status"
          allLabel="All statuses"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "active", label: "Active", hint: activeList.length },
            { value: "inactive", label: "Inactive", hint: institutions.length - activeList.length },
          ]}
        />
        <SelectFilter
          label="Website"
          allLabel="Website: any"
          value={webFilter}
          onChange={setWebFilter}
          options={[
            { value: "live", label: "Live on website", hint: liveList.length },
            { value: "hidden", label: "Hidden", hint: institutions.length - liveList.length },
          ]}
        />
        {hasFilters && (
          <ResetFilters
            onClick={() => {
              setSearch("");
              setCountryFilter("");
              setStatusFilter("");
              setWebFilter("");
            }}
          />
        )}
      </FilterBar>

      <Card className="flex flex-col">
        <CardHeader
          icon={Landmark}
          title="University Contracts & Representation"
          subtitle={`${filtered.length} institution${filtered.length === 1 ? "" : "s"} match your filters`}
        />

        <SelectionBar
          selection={selection}
          noun={["institution", "institutions"]}
          onExport={() => downloadCsv("institutions-selected.csv", selectedInstitutions.map(toCsvRow))}
          className="mx-4 mt-4 sm:mx-6"
        >
          <BarButton onClick={() => bulkActive(true)}>Activate</BarButton>
          <BarButton onClick={() => bulkActive(false)}>Deactivate</BarButton>
          <BarButton onClick={() => bulkWebsite(true)}>Publish to web</BarButton>
          <BarButton onClick={() => bulkWebsite(false)}>Hide from web</BarButton>
        </SelectionBar>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-surface-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="w-10 py-3 pl-6 pr-0">
                  <HeaderCheckbox selection={selection} label="Select all institutions" />
                </th>
                <th className="py-3 pl-3 pr-3 font-semibold">University</th>
                <th className="px-3 py-3 font-semibold">Commission Tier</th>
                <th className="px-3 py-3 font-semibold">Agreement</th>
                <th className="px-3 py-3 font-semibold">Programs</th>
                <th className="px-3 py-3 font-semibold">Open Intakes</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Website</th>
                <th className="py-3 pl-3 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((inst) => {
                const active = isActive(inst);
                const highlighted = inst.id === lastChange?.id;
                const dim = !active && "opacity-50";
                return (
                  <tr
                    key={inst.id}
                    className={cn(
                      "group transition-colors hover:bg-surface-muted/40",
                      highlighted && "bg-success-soft/60",
                      selectedRowClass(selection, inst.id)
                    )}
                  >
                    <td className="py-3.5 pl-6 pr-0 align-middle">
                      <RowCheckbox selection={selection} id={inst.id} label={`Select ${inst.name}`} />
                    </td>
                    <td className={cn("py-3.5 pl-3 pr-3 align-middle", dim)}>
                      <button type="button" onClick={() => setViewingId(inst.id)} className="flex items-center gap-3 text-left">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-muted font-mono text-xs font-bold text-primary">
                          {inst.logoText}
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground group-hover:text-primary">{inst.name}</span>
                            {highlighted && (
                              <span className="rounded-full bg-success px-1.5 py-0.5 text-[9px] font-bold text-white">
                                {lastChange?.kind === "added" ? "New" : "Updated"}
                              </span>
                            )}
                            {!active && <span className="rounded-full bg-surface-hover px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">Inactive</span>}
                            {active && inst.status === "Onboarding" && (
                              <span className="rounded-full bg-warning-soft px-1.5 py-0.5 text-[9px] font-bold text-warning">Onboarding</span>
                            )}
                            {inst.featured && (
                              <span className="whitespace-nowrap rounded-full border border-amber-200/60 bg-amber-700/10 px-1.5 text-[9px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                Top Partner
                              </span>
                            )}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            {inst.city}, {inst.country} · {inst.ranking}
                          </span>
                        </span>
                      </button>
                    </td>

                    <td className={cn("px-3 py-3.5 align-middle", dim)}>
                      <span
                        className={cn(
                          "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                          inst.commissionTier.includes("Tier 1")
                            ? "border-success/20 bg-success/10 text-success"
                            : "border-primary/20 bg-primary-soft text-primary"
                        )}
                      >
                        {inst.commissionTier}
                      </span>
                    </td>

                    <td className={cn("px-3 py-3.5 align-middle", dim)}>
                      <span className="font-medium text-foreground">
                        {inst.agreementType === "Direct Agreement" ? "Direct" : "Aggregator"}
                      </span>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        {inst.tatDays}
                      </p>
                    </td>

                    <td className={cn("px-3 py-3.5 align-middle", dim)}>
                      <span className="font-semibold tabular-nums text-foreground">{inst.programsCount}</span>
                      <span className="ml-1 text-[11px] text-muted-foreground">courses</span>
                    </td>

                    <td className={cn("px-3 py-3.5 align-middle", dim)}>
                      <div className="flex max-w-[190px] flex-wrap gap-1">
                        {inst.openIntakes.map((intake) => (
                          <span key={intake} className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {intake}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-3 py-3.5 align-middle">
                      <StatusSwitch checked={active} onChange={(next) => setActive(inst, next)} ariaLabel={`${inst.name} active`} />
                    </td>

                    <td className="px-3 py-3.5 align-middle">
                      <WebsiteToggle
                        live={isOnWebsite(inst)}
                        onChange={(next) => setWebsite(inst, next)}
                        disabled={!active}
                        ariaLabel={`Show ${inst.name} courses on website`}
                      />
                    </td>

                    <td className="py-3.5 pl-3 pr-6 text-right align-middle">
                      <RowActions onView={() => setViewingId(inst.id)} editHref={`/institutions/${inst.id}/edit`} name={inst.name} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="px-6 py-14 text-center text-sm text-muted-foreground">No institutions match your filters.</p>
          )}
        </div>
      </Card>

      {viewing && (
        <InstitutionView
          institution={viewing}
          onClose={() => setViewingId(null)}
          onToggleActive={(next) => setActive(viewing, next)}
          onToggleWebsite={(next) => setWebsite(viewing, next)}
        />
      )}
      {toast}
    </div>
  );
}
