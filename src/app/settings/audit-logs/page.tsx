"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, FileDown, History, KeyRound, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { anyDate, DateRangeFilter, FilterBar, inDateRange, ResetFilters, SearchField, SelectFilter, type DateRange } from "@/components/ui/filter-dropdown";
import { SlideOver } from "@/components/ui/slide-over";
import { buttonSecondary } from "@/components/ui/button-styles";
import { formatDay } from "@/components/people/people-ui";
import { allAuditEvents, AUDIT_RETENTION_YEARS, auditActions, auditModules, auditStore, type AuditEvent, type AuditSeverity } from "@/lib/settings/audit";
import { useSettingsStore } from "@/lib/settings/store";
import { downloadCsv } from "@/lib/csv";
import { cn, initialsFor } from "@/lib/utils";

const PAGE = 40;
const severityStyle: Record<AuditSeverity, { label: string; dot: string; cls: string }> = {
  info: { label: "Info", dot: "bg-muted-foreground", cls: "bg-surface-hover text-muted-foreground" },
  notice: { label: "Notice", dot: "bg-primary", cls: "bg-primary-soft text-primary" },
  critical: { label: "Critical", dot: "bg-danger", cls: "bg-danger-soft text-danger" },
};

export default function AuditLogsPage() {
  return (
    <Suspense>
      <AuditLogs />
    </Suspense>
  );
}

function AuditLogs() {
  const params = useSearchParams();
  const recorded = useSettingsStore(auditStore);
  const events = useMemo(() => allAuditEvents(recorded), [recorded]);
  const [search, setSearch] = useState("");
  const [module, setModule] = useState(params.get("module") ?? "");
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const [severity, setSeverity] = useState("");
  const [dates, setDates] = useState<DateRange>(anyDate);
  const [shown, setShown] = useState(PAGE);
  const [viewing, setViewing] = useState<AuditEvent | null>(null);

  const today = events[0]?.at.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.parse(today) - 6 * 86_400_000).toISOString().slice(0, 10);
  const q = search.trim().toLowerCase();
  const filtered = events.filter(
    (e) =>
      (!module || e.module === module) &&
      (!action || e.action === action) &&
      (!actor || e.actor === actor) &&
      (!severity || e.severity === severity) &&
      inDateRange(e.at.slice(0, 10), dates) &&
      (!q || `${e.summary} ${e.entity} ${e.entityId ?? ""} ${e.actor} ${e.ip} ${e.changes?.map((c) => `${c.field} ${c.from} ${c.to}`).join(" ") ?? ""}`.toLowerCase().includes(q))
  );
  const hasFilters = !!(search || module || action || actor || severity || dates.from || dates.to);
  const reset = () => { setSearch(""); setModule(""); setAction(""); setActor(""); setSeverity(""); setDates(anyDate); };

  const recent = events.filter((e) => e.at.slice(0, 10) >= weekAgo);
  const byDay = useMemo(() => {
    const groups: { day: string; items: AuditEvent[] }[] = [];
    for (const e of filtered.slice(0, shown)) {
      const day = e.at.slice(0, 10);
      if (groups.at(-1)?.day !== day) groups.push({ day, items: [] });
      groups.at(-1)!.items.push(e);
    }
    return groups;
  }, [filtered, shown]);

  const exportCsv = () =>
    downloadCsv("audit-log.csv", filtered.map((e) => ({
      id: e.id, time: e.at, severity: e.severity, module: e.module, action: e.action, actor: e.actor, role: e.role, entity: e.entity, entityId: e.entityId ?? "",
      summary: e.summary, changes: e.changes?.map((c) => `${c.field}: ${c.from} → ${c.to}`).join("; ") ?? "", ip: e.ip, device: e.device,
    })));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Audit Logs</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Every sign-in, change, export, archive and deletion — who did it, when, from where, and what changed. Entries can&apos;t be edited or deleted and are kept for {AUDIT_RETENTION_YEARS} years.</p>
        </div>
        <button type="button" onClick={exportCsv} disabled={!filtered.length} className={cn(buttonSecondary, "disabled:opacity-50")}><Download className="size-4" /> Export {hasFilters ? "filtered" : "all"}</button>
      </header>

      <StatGrid>
        <StatCard icon={History} label="Events in last 7 days" value={recent.length} note={`${events.length} total`} onClick={() => { reset(); setDates({ preset: "7d", from: weekAgo, to: today }); }} />
        <StatCard icon={ShieldAlert} tone="danger" label="Critical events" value={recent.filter((e) => e.severity === "critical").length} note="7 days" onClick={() => { reset(); setSeverity("critical"); }} />
        <StatCard icon={FileDown} tone="warning" label="Data exports" value={recent.filter((e) => e.action === "Exported").length} note="7 days" onClick={() => { reset(); setAction("Exported"); }} />
        <StatCard icon={KeyRound} tone="violet" label="Settings & permission changes" value={events.filter((e) => e.action === "Settings changed" || e.action === "Permission changed").length} onClick={() => { reset(); setModule("Settings"); }} />
      </StatGrid>

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Summary, record ID, person, IP…" label="Search audit log" />
        <SelectFilter label="Module" value={module} onChange={setModule} allLabel="All modules" options={auditModules.map((m) => ({ value: m, label: m, hint: events.filter((e) => e.module === m).length }))} />
        <SelectFilter label="Action" value={action} onChange={setAction} allLabel="All actions" options={auditActions.filter((a) => events.some((e) => e.action === a))} />
        <SelectFilter label="Person" value={actor} onChange={setActor} allLabel="Anyone" options={[...new Set(events.map((e) => e.actor))].sort()} />
        <SelectFilter label="Severity" value={severity} onChange={setSeverity} allLabel="Any severity" options={(Object.keys(severityStyle) as AuditSeverity[]).map((s) => ({ value: s, label: severityStyle[s].label, dot: severityStyle[s].dot }))} />
        <DateRangeFilter value={dates} onChange={setDates} today={today} />
        {hasFilters && <ResetFilters onClick={reset} />}
      </FilterBar>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Activity</h3>
          <p className="text-xs text-muted-foreground">{filtered.length} event{filtered.length === 1 ? "" : "s"} · newest first · click one for details</p>
        </div>
        <div className="mt-3 border-t border-border">
          {byDay.map((g) => (
            <section key={g.day}>
              <h4 className="sticky top-0 z-10 border-b border-border bg-surface-muted px-5 py-1.5 text-[11px] font-semibold text-muted-foreground">{formatDay(g.day)}</h4>
              <ul className="divide-y divide-border">
                {g.items.map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => setViewing(e)} className="grid w-full grid-cols-[56px_minmax(0,1fr)] items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-hover/60 md:grid-cols-[56px_200px_minmax(0,1fr)_170px]">
                      <span className="pt-0.5 text-xs tabular-nums text-muted-foreground">{e.at.slice(11, 16)}</span>
                      <span className="hidden min-w-0 items-center gap-2 md:flex">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-hover text-[10px] font-semibold text-muted-foreground">{e.actor === "Unknown" ? "?" : initialsFor(e.actor)}</span>
                        <span className="min-w-0"><span className="block truncate text-xs font-semibold text-foreground">{e.actor}</span><span className="block truncate text-[10px] text-muted-foreground">{e.role}</span></span>
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", severityStyle[e.severity].cls)}><span className={cn("size-1.5 rounded-full", severityStyle[e.severity].dot)} />{e.action}</span>
                          <span className="text-[10px] font-medium text-muted-foreground">{e.module}{e.entityId ? ` · ${e.entityId}` : ""}</span>
                        </span>
                        <span className="mt-1 block text-sm text-foreground">{e.summary}</span>
                        {e.changes?.length ? <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{e.changes.slice(0, 2).map((c) => `${c.field}: ${c.from} → ${c.to}`).join(" · ")}{e.changes.length > 2 ? ` · +${e.changes.length - 2} more` : ""}</span> : null}
                        <span className="mt-0.5 block text-[11px] text-muted-foreground md:hidden">{e.actor} · {e.ip}</span>
                      </span>
                      <span className="hidden text-right text-[11px] text-muted-foreground md:block"><span className="block font-mono">{e.ip}</span><span className="block">{e.device}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {!filtered.length && <p className="px-6 py-14 text-center text-sm text-muted-foreground">No events match. <button type="button" onClick={reset} className="font-semibold text-primary hover:underline">Reset filters</button></p>}
          {filtered.length > shown && (
            <div className="border-t border-border px-5 py-3 text-center">
              <button type="button" onClick={() => setShown(shown + PAGE)} className="text-xs font-semibold text-primary hover:underline">Show {Math.min(PAGE, filtered.length - shown)} more of {filtered.length - shown}</button>
            </div>
          )}
        </div>
      </Card>

      {viewing && (
        <SlideOver open onClose={() => setViewing(null)} icon={SlidersHorizontal} title={viewing.summary} subtitle={`${viewing.id} · ${formatDay(viewing.at)} ${viewing.at.slice(11, 19)} UTC`}>
          <div className="flex flex-col gap-5">
            <dl className="grid grid-cols-2 gap-4 text-xs">
              {[
                ["Person", `${viewing.actor} · ${viewing.role}`],
                ["Action", viewing.action],
                ["Module", viewing.module],
                ["Record", `${viewing.entity}${viewing.entityId ? ` · ${viewing.entityId}` : ""}`],
                ["IP address", viewing.ip],
                ["Device", viewing.device],
              ].map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="mt-0.5 break-words text-sm text-foreground">{v}</dd></div>)}
              <div><dt className="text-muted-foreground">Severity</dt><dd className="mt-1"><span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", severityStyle[viewing.severity].cls)}><span className={cn("size-1.5 rounded-full", severityStyle[viewing.severity].dot)} />{severityStyle[viewing.severity].label}</span></dd></div>
            </dl>
            <section>
              <h4 className="mb-2 text-xs font-semibold text-foreground">Changes</h4>
              {viewing.changes?.length ? (
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Field</th><th className="px-3 py-2">Before</th><th className="px-3 py-2">After</th></tr></thead>
                    <tbody className="divide-y divide-border align-top">
                      {viewing.changes.map((c, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-medium text-foreground">{c.field}</td>
                          <td className="whitespace-pre-line px-3 py-2 text-danger line-through decoration-danger/40">{c.from}</td>
                          <td className="whitespace-pre-line px-3 py-2 text-success">{c.to}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="rounded-xl bg-surface-muted px-3 py-3 text-xs text-muted-foreground">No field changes recorded for this event.</p>
              )}
            </section>
            {viewing.ip === "This device" && <p className="text-[11px] text-muted-foreground">Recorded in this browser. Once the CRM has a server-side audit trail, the real IP address is stored.</p>}
          </div>
        </SlideOver>
      )}
    </div>
  );
}
