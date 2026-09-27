"use client";

import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, CircleDashed, Clock3, Copy, PencilLine, Target as TargetIcon, TrendingDown, TrendingUp, XCircle } from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import { buttonSecondary } from "@/components/ui/button-styles";
import { formatDay } from "@/components/people/people-ui";
import { counts, measure, metricHelp, metricLabel, scopeLabel, type Metric, type Progress, type Target, type TargetStatus } from "@/lib/mock/targets";
import { cn } from "@/lib/utils";

const statusStyle: Record<TargetStatus, { cls: string; icon: typeof CheckCircle2 }> = {
  Achieved: { cls: "bg-success-soft text-success", icon: CheckCircle2 },
  "On track": { cls: "bg-primary-soft text-primary", icon: TrendingUp },
  "At risk": { cls: "bg-warning-soft text-warning", icon: AlertTriangle },
  "Off track": { cls: "bg-danger-soft text-danger", icon: TrendingDown },
  Missed: { cls: "bg-danger-soft text-danger", icon: XCircle },
  "Not started": { cls: "bg-surface-hover text-muted-foreground", icon: CircleDashed },
};
export const statusOrder: TargetStatus[] = ["Off track", "At risk", "On track", "Not started", "Achieved", "Missed"];

/** Status with icon + label, so it never relies on colour alone. */
export function TargetStatusBadge({ status }: { status: TargetStatus }) {
  const { cls, icon: Icon } = statusStyle[status];
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", cls)}>
      <Icon className="size-3" />
      {status}
    </span>
  );
}

const barTone: Record<TargetStatus, string> = {
  Achieved: "bg-success",
  "On track": "bg-primary",
  "At risk": "bg-warning",
  "Off track": "bg-danger",
  Missed: "bg-danger",
  "Not started": "bg-muted-foreground",
};

/** Actual vs target with a tick where the target says we should be today. */
export function TargetBar({ target, progress, compact }: { target: number; progress: Progress; compact?: boolean }) {
  const scale = Math.max(target, progress.actual, progress.forecast, 1);
  const pct = (n: number) => `${Math.min(100, (n / scale) * 100)}%`;
  const done = Math.round((progress.actual / Math.max(1, target)) * 100);
  return (
    <div className={cn("min-w-[150px]", compact && "min-w-[120px]")}>
      <p className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">{progress.actual}</span> / {target}
        </span>
        <span className="font-semibold tabular-nums text-foreground">{done}%</span>
      </p>
      <span className="relative block h-2 rounded-full bg-surface-hover" title={`Actual ${progress.actual} · forecast ${progress.forecast} · expected by today ${progress.expected} · target ${target}`}>
        <span className="absolute inset-y-0 left-0 rounded-full bg-current opacity-20" style={{ width: pct(progress.forecast) }} />
        <span className={cn("absolute inset-y-0 left-0 rounded-full", barTone[progress.status])} style={{ width: pct(progress.actual) }} />
        <span className="absolute -top-0.5 h-3 w-0.5 rounded-full bg-foreground/70" style={{ left: pct(target) }} aria-hidden />
        {progress.status !== "Achieved" && progress.status !== "Missed" && progress.expected > 0 && (
          <span className="absolute -bottom-1 size-0 border-x-4 border-b-4 border-x-transparent border-b-muted-foreground" style={{ left: `calc(${pct(progress.expected)} - 4px)` }} aria-hidden />
        )}
      </span>
    </div>
  );
}

export function BarLegend() {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5"><span className="flex h-2 w-4 overflow-hidden rounded-full"><span className="w-1/3 bg-success" /><span className="w-1/3 bg-warning" /><span className="w-1/3 bg-danger" /></span> Achieved so far, coloured by status</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-primary/20" /> Forecast</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-0.5 rounded-full bg-foreground/70" /> Target</span>
      <span className="inline-flex items-center gap-1.5"><span className="size-0 border-x-4 border-b-4 border-x-transparent border-b-muted-foreground" /> Where we should be today</span>
    </span>
  );
}

/** Break a target down one level: company → branches, branch/team → counsellors, else → universities. */
function breakdown(t: Target, p: Progress) {
  const key: (a: Progress["apps"][number]) => string = t.scope === "Company" ? (a) => a.branch : t.scope === "Branch" || t.scope === "Team" ? (a) => a.counsellor : t.scope === "Counsellor" ? (a) => a.university : (a) => a.counsellor;
  const label = t.scope === "Company" ? "By branch" : t.scope === "Counsellor" ? "By university" : "By counsellor";
  const m = new Map<string, { actual: number; open: number }>();
  for (const a of p.apps) {
    const k = key(a);
    const e = m.get(k) ?? { actual: 0, open: 0 };
    if (counts(a, t.metric)) e.actual++;
    else if (a.stage !== "Rejected" && a.stage !== "Withdrawn") e.open++;
    m.set(k, e);
  }
  return { label, rows: [...m.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.actual - a.actual || b.open - a.open).slice(0, 8) };
}

export function TargetDetail({ target: t, onClose, onDuplicate }: { target: Target; onClose: () => void; onDuplicate: () => void }) {
  const p = measure(t);
  const gap = Math.max(0, t.target - p.actual);
  const b = breakdown(t, p);
  const max = Math.max(1, ...b.rows.map((r) => r.actual + r.open));
  const recent = [...p.apps].sort((x, y) => y.updatedAt.localeCompare(x.updatedAt)).slice(0, 5);

  return (
    <SlideOver
      open
      onClose={onClose}
      icon={TargetIcon}
      title={`${scopeLabel(t)} · ${metricLabel[t.metric]}`}
      subtitle={`${t.id} · ${t.intake} intake · owner ${t.owner}`}
      footer={
        <Link href={t.scope === "University" ? `/applications?search=${encodeURIComponent(t.scopeValue)}` : t.scope === "Channel" ? `/applications?source=${t.scopeValue.toLowerCase()}` : "/applications"} className={cn(buttonSecondary, "w-full")}>
          View applications
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link href={`/target-setup/${t.id}/edit`} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"><PencilLine className="size-3.5" /> Edit</Link>
          <button type="button" onClick={onDuplicate} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover"><Copy className="size-3.5" /> Copy to next intake</button>
          <span className="ml-auto"><TargetStatusBadge status={p.status} /></span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            ["Target", t.target, t.stretch ? `stretch ${t.stretch}` : ""],
            ["Achieved", p.actual, `${Math.round((p.actual / Math.max(1, t.target)) * 100)}%`],
            ["Forecast", p.forecast, p.forecast >= t.target ? "meets target" : `${t.target - p.forecast} short`],
            ["Still needed", gap, p.status === "Achieved" || p.status === "Missed" ? "final" : `${p.daysLeft} days left`],
          ].map(([l, v, note]) => (
            <div key={l as string} className="rounded-xl bg-surface-muted px-3 py-2.5">
              <p className="text-lg font-bold tabular-nums text-foreground">{v}</p>
              <p className="text-[11px] text-muted-foreground">{l}</p>
              {note && <p className="text-[10px] text-muted-foreground/80">{note}</p>}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <TargetBar target={t.target} progress={p} />
          <BarLegend />
        </div>

        <p className={cn("rounded-xl px-3 py-2.5 text-xs text-foreground", p.status === "Off track" || p.status === "Missed" ? "bg-danger-soft" : p.status === "At risk" ? "bg-warning-soft" : "bg-surface-muted")}>
          {advice(t, p)}
        </p>

        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5 text-xs">
          <dt className="text-muted-foreground">Measures</dt><dd className="text-foreground">{metricHelp[t.metric]}</dd>
          <dt className="text-muted-foreground">Scope</dt><dd className="text-foreground">{t.scope}{t.scope !== "Company" ? ` — ${scopeLabel(t)}` : ""}</dd>
          <dt className="flex items-center gap-1 text-muted-foreground"><CalendarClock className="size-3" /> Window</dt><dd className="text-foreground">{formatDay(t.startDate)} – {formatDay(t.endDate)}</dd>
          <dt className="flex items-center gap-1 text-muted-foreground"><Clock3 className="size-3" /> Created</dt><dd className="text-foreground">{formatDay(t.createdAt)} by {t.createdBy}</dd>
          {t.notes && <><dt className="text-muted-foreground">Notes</dt><dd className="text-foreground">{t.notes}</dd></>}
        </dl>

        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">{b.label}</p>
          {b.rows.length ? (
            <ul className="flex flex-col gap-2">
              {b.rows.map((r) => (
                <li key={r.name} className="text-xs">
                  <p className="mb-1 flex justify-between gap-2"><span className="truncate text-foreground">{r.name}</span><span className="shrink-0 tabular-nums text-muted-foreground"><span className="font-semibold text-foreground">{r.actual}</span> done · {r.open} open</span></p>
                  <span className="flex h-1.5 overflow-hidden rounded-full bg-surface-hover">
                    <span className="bg-primary" style={{ width: `${(r.actual / max) * 100}%` }} />
                    <span className="bg-primary/25" style={{ width: `${(r.open / max) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No applications in this scope for {t.intake} yet.</p>
          )}
        </div>

        {recent.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-foreground">Recently updated applications</p>
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {recent.map((a) => (
                <li key={a.id}>
                  <Link href={`/applications/${a.id}`} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs hover:bg-surface-hover">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{a.applicant}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{a.university} · {a.counsellor}</span>
                    </span>
                    <span className={cn("shrink-0 text-[11px] font-medium", counts(a, t.metric) ? "text-success" : "text-muted-foreground")}>{a.stage}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SlideOver>
  );
}

export function advice(t: Pick<Target, "target" | "metric">, p: Progress) {
  const unit = metricLabel[t.metric as Metric].toLowerCase();
  const gap = t.target - p.actual;
  switch (p.status) {
    case "Achieved":
      return `Target reached with ${p.actual} ${unit}${p.actual > t.target ? ` — ${p.actual - t.target} over` : ""}.`;
    case "Missed":
      return `Finished ${gap} ${unit} short of the target (${Math.round((p.actual / Math.max(1, t.target)) * 100)}%).`;
    case "Not started":
      return "The recruitment window hasn't opened yet.";
    case "On track":
      return t.metric === "applications"
        ? `${gap} more ${unit} needed; at the current pace about ${p.pipeline} more should arrive before the deadline.`
        : `${gap} more ${unit} needed; the current pipeline should deliver about ${p.pipeline}. Keep chasing documents and deposits.`;
    case "At risk":
      return t.metric === "applications"
        ? `${gap} more ${unit} needed but the current pace brings only about ${p.pipeline}. Follow up open leads and book more counselling appointments.`
        : `${gap} more ${unit} needed but the pipeline only covers about ${p.pipeline}. Prioritise the open applications closest to the next stage.`;
    default:
      return t.metric === "applications"
        ? `${gap} more ${unit} needed and the current pace brings only about ${p.pipeline}. Run a campaign or event, or revise the target.`
        : `${gap} more ${unit} needed and the pipeline covers only about ${p.pipeline}. Add new applications or revise the target.`;
  }
}
