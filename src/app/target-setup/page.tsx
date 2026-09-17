"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  Filter,
  Layers,
  Plus,
  Search,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { mockTargets, type TargetRecord } from "@/lib/mock/insights";
import { cn } from "@/lib/utils";

export default function TargetSetupPage() {
  const [targets, setTargets] = useState<TargetRecord[]>(mockTargets);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form states
  const [intakeName, setIntakeName] = useState("September 2026");
  const [entityType, setEntityType] = useState<TargetRecord["entityType"]>("Branch");
  const [entityName, setEntityName] = useState("");
  const [targetCount, setTargetCount] = useState(250);
  const [censusDate, setCensusDate] = useState("2026-10-15");

  const filtered = useMemo(() => {
    let list = targets;
    if (typeFilter) list = list.filter((t) => t.entityType === typeFilter);
    if (statusFilter) list = list.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.entityName.toLowerCase().includes(q) ||
          t.intakeName.toLowerCase().includes(q) ||
          t.entityType.toLowerCase().includes(q)
      );
    }
    return list;
  }, [targets, search, typeFilter, statusFilter]);

  // Aggregate totals across branches for consistent high-level KPIs
  const branchTargets = targets.filter((t) => t.entityType === "Branch");
  const totalTargetQuota = branchTargets.reduce((acc, t) => acc + t.targetCount, 0);
  const totalAchieved = branchTargets.reduce((acc, t) => acc + t.achievedCount, 0);
  const totalPipeline = branchTargets.reduce((acc, t) => acc + t.inPipeline, 0);
  const pacingRatio = Math.round((totalAchieved / totalTargetQuota) * 100);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!entityName) return;

    const newTarget: TargetRecord = {
      id: `TGT-${Date.now().toString().slice(-4)}`,
      intakeName,
      year: 2026,
      entityType,
      entityName,
      targetCount,
      achievedCount: 0,
      inPipeline: 0,
      startDate: "2026-03-01",
      censusDate: censusDate || "2026-10-15",
      status: "Needs Attention",
    };

    setTargets([newTarget, ...targets]);
    setEntityName("");
    setAddModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Target Setup & Performance
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Set enrollment goals for branches, counselors, and destination countries for the 2026/27 academic cycles.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95"
          >
            <Plus className="size-3.5" />
            <span>Set New Target</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Intake Target</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Target className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {totalTargetQuota}
            </span>
            <span className="text-xs font-medium text-muted-foreground">Students Target</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Confirmed Enrolments</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {totalAchieved}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {pacingRatio}% achieved
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pipeline In-Flight</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {totalPipeline}
            </span>
            <span className="text-xs font-medium text-muted-foreground">Offers / CAS stage</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Census Cutoff Deadline</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
              <Calendar className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              15 Oct 2026
            </span>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">28 days left</span>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search targets by entity or intake..."
              className="w-full rounded-full border border-border bg-background py-1.5 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              <span>Filter:</span>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by Target Scope"
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-hidden"
            >
              <option value="">All Scopes</option>
              <option value="Branch">Branch Targets</option>
              <option value="Counselor">Counselor Targets</option>
              <option value="Destination Country">Country Targets</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="Exceeded">Exceeded</option>
              <option value="On Track">On Track</option>
              <option value="Needs Attention">Needs Attention</option>
            </select>

            {(search || typeFilter || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("");
                  setStatusFilter("");
                }}
                className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Targets Table */}
      <Card>
        <CardHeader
          title="Intake Quota Performance Matrix"
          description={`Showing ${filtered.length} target records for ongoing intake cycles.`}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                <th className="py-3 pl-6 pr-4">Entity & Scope</th>
                <th className="py-3 px-4">Intake Cycle</th>
                <th className="py-3 px-4">Target vs Actual</th>
                <th className="py-3 px-4">Completion Pacing</th>
                <th className="py-3 px-4">In Pipeline</th>
                <th className="py-3 px-4">Health Status</th>
                <th className="py-3 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No target setup records matched your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((target) => {
                  const pct = Math.min(100, Math.round((target.achievedCount / target.targetCount) * 100));

                  return (
                    <tr key={target.id} className="transition-colors hover:bg-muted/30">
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary font-bold text-xs">
                            <Layers className="size-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-foreground text-sm block">
                              {target.entityName}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground mt-0.5">
                              {target.entityType}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <span>{target.intakeName}</span>
                        <span className="text-[11px] text-muted-foreground block">
                          Cutoff: {target.censusDate}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-foreground">
                            {target.achievedCount}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / {target.targetCount}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 min-w-[160px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-foreground">{pct}%</span>
                          <span className="text-[11px] text-muted-foreground">
                            {target.targetCount - target.achievedCount > 0
                              ? `${target.targetCount - target.achievedCount} to goal`
                              : "Goal reached"}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              pct >= 90
                                ? "bg-emerald-500"
                                : pct >= 70
                                ? "bg-primary"
                                : "bg-amber-500"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-blue-600 dark:text-blue-400">
                        {target.inPipeline} applications
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            target.status === "Exceeded"
                              ? "border border-purple-500/20 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                              : target.status === "On Track"
                              ? "border border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "border border-amber-500/20 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          )}
                        >
                          {target.status === "Exceeded" ? (
                            <Award className="size-3" />
                          ) : target.status === "On Track" ? (
                            <CheckCircle2 className="size-3" />
                          ) : (
                            <AlertTriangle className="size-3" />
                          )}
                          <span>{target.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 pl-4 pr-6 text-right">
                        <button
                          type="button"
                          className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          Adjust
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
                <h3 className="text-lg font-bold text-foreground">Set Intake Target</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Allocate student enrolment quota to a branch, counselor, or destination.
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Intake Name</label>
                  <select
                    value={intakeName}
                    onChange={(e) => setIntakeName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="September 2026">September 2026</option>
                    <option value="January 2027">January 2027</option>
                    <option value="May 2027">May 2027</option>
                    <option value="September 2027">September 2027</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Target Scope</label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as TargetRecord["entityType"])}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="Branch">Branch</option>
                    <option value="Counselor">Counselor</option>
                    <option value="Destination Country">Destination Country</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Entity Name</label>
                <input
                  type="text"
                  required
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  placeholder="e.g. Sylhet Zindabazar Hub or Counselor Name"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Enrolment Target (Students)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={targetCount}
                    onChange={(e) => setTargetCount(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Census Cutoff Date</label>
                  <input
                    type="date"
                    value={censusDate}
                    onChange={(e) => setCensusDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
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
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

