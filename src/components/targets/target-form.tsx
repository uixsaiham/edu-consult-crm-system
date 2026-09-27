"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleAlert, History, Lightbulb, Split } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, PillGroup, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useUser } from "@/components/layout/user-context";
import { formatDay } from "@/components/people/people-ui";
import { getStaff } from "@/lib/mock/staff";
import {
  allIntakes,
  defaultOwner,
  getTargets,
  intakeWindow,
  lastResult,
  markTargetChange,
  measure,
  metricHelp,
  metricLabel,
  metrics,
  nextTargetId,
  saveTargets,
  scopeLabel,
  scopeOptions,
  scopes,
  scopedApps,
  today,
  type Metric,
  type Scope,
  type Target,
} from "@/lib/mock/targets";
import { cn } from "@/lib/utils";
import { BarLegend, TargetBar, TargetStatusBadge, advice } from "./target-ui";

export interface TargetDraft {
  intake: string;
  metric: Metric;
  scope: Scope;
  scopeValue: string;
  target: string;
  stretch: string;
  owner: string;
  startDate: string;
  endDate: string;
  notes: string;
}

export function draftFrom(t?: Partial<Target>, fallbackOwner = "Sadman Rahman"): TargetDraft {
  const intake = t?.intake ?? "Jan 2027";
  const w = intakeWindow(intake);
  return {
    intake,
    metric: t?.metric ?? "enrolments",
    scope: t?.scope ?? "Company",
    scopeValue: t?.scopeValue ?? "",
    target: t?.target ? String(t.target) : "",
    stretch: t?.stretch ? String(t.stretch) : "",
    owner: t?.owner ?? fallbackOwner,
    startDate: t?.startDate ?? w.start,
    endDate: t?.endDate ?? w.end,
    notes: t?.notes ?? "",
  };
}

export function TargetForm({ target, initial }: { target?: Target; initial?: TargetDraft }) {
  const router = useRouter();
  const { user } = useUser();
  const editing = !!target;
  const [f, setF] = useState<TargetDraft>(() => initial ?? draftFrom(target, user.name));
  const [split, setSplit] = useState(false);
  const [splitBy, setSplitBy] = useState<"Branch" | "Counsellor">("Branch");
  const [tried, setTried] = useState(false);
  const set = <K extends keyof TargetDraft>(k: K, v: TargetDraft[K]) => setF((x) => ({ ...x, [k]: v }));
  const all = getTargets();
  const staffNames = getStaff().filter((s) => s.status !== "Inactive").map((s) => s.name);
  const options = useMemo(() => scopeOptions(f.scope, f.intake), [f.scope, f.intake]);
  const n = Number(f.target) || 0;

  const probe = { intake: f.intake, metric: f.metric, scope: f.scope, scopeValue: f.scopeValue, target: n || 1, startDate: f.startDate, endDate: f.endDate };
  const ready = f.scope === "Company" || !!f.scopeValue;
  const p = ready ? measure(probe) : null;
  const last = ready ? lastResult(f.intake, f.scope, f.scopeValue, f.metric) : null;
  const duplicate = all.find((t) => t.id !== target?.id && !t.archived && t.intake === f.intake && t.metric === f.metric && t.scope === f.scope && t.scopeValue === f.scopeValue);

  const suggestions = [
    p && p.forecast > 0 ? { label: `Match forecast (${p.forecast})`, value: p.forecast } : null,
    last && last.value > 0 ? { label: `${last.intake} +10% (${Math.round(last.value * 1.1)})`, value: Math.round(last.value * 1.1) } : null,
    p && p.forecast > 0 ? { label: `Stretch +15% (${Math.round(p.forecast * 1.15)})`, value: Math.round(p.forecast * 1.15) } : null,
  ].filter(Boolean) as { label: string; value: number }[];

  // Split a company target across branches or counsellors by their share of this intake's applications.
  const splitRows = useMemo(() => {
    if (f.scope !== "Company" || !split || !n) return [];
    const opts = scopeOptions(splitBy, f.intake).filter((o) => o.count > 0);
    const total = opts.reduce((s, o) => s + o.count, 0) || 1;
    const rows = opts.map((o) => ({ value: o.value, share: o.count / total, target: Math.max(1, Math.round((o.count / total) * n)) }));
    return rows.sort((a, b) => b.share - a.share);
  }, [f.scope, f.intake, split, splitBy, n]);

  const errors: Partial<Record<keyof TargetDraft | "duplicate", string>> = {};
  if (f.scope !== "Company" && !f.scopeValue) errors.scopeValue = `Choose the ${f.scope.toLowerCase()}`;
  if (!(n > 0)) errors.target = "Enter a target above zero";
  if (f.stretch && Number(f.stretch) <= n) errors.stretch = "The stretch target should be higher than the target";
  if (!f.owner) errors.owner = "Choose who is accountable";
  if (f.endDate <= f.startDate) errors.endDate = "The window must end after it starts";
  if (duplicate) errors.duplicate = `${f.intake} already has a ${metricLabel[f.metric].toLowerCase()} target for ${scopeLabel(duplicate).toLowerCase() === "whole company" ? "the whole company" : scopeLabel(duplicate)}`;
  const show = (k: keyof typeof errors) => (tried ? errors[k] : undefined);
  const errorCount = Object.keys(errors).length;

  const changeIntake = (intake: string) => {
    const w = intakeWindow(intake);
    setF((x) => ({ ...x, intake, startDate: w.start, endDate: w.end }));
  };
  const changeScope = (scope: Scope) => setF((x) => ({ ...x, scope, scopeValue: "", owner: scope === "Company" ? user.name : x.owner }));
  const changeValue = (v: string) => setF((x) => ({ ...x, scopeValue: v, owner: defaultOwner(x.scope, v, x.owner || user.name) }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (errorCount) {
      document.querySelector("[aria-invalid='true']")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const id = target?.id ?? nextTargetId();
    const record: Target = {
      id,
      intake: f.intake,
      metric: f.metric,
      scope: f.scope,
      scopeValue: f.scope === "Company" ? "" : f.scopeValue,
      target: n,
      stretch: Number(f.stretch) || undefined,
      owner: f.owner,
      startDate: f.startDate,
      endDate: f.endDate,
      notes: f.notes.trim(),
      archived: target?.archived ?? false,
      createdAt: target?.createdAt ?? today,
      createdBy: target?.createdBy ?? user.name,
      parentId: target?.parentId,
    };
    const children: Target[] = splitRows
      .filter((r) => !all.some((t) => !t.archived && t.intake === f.intake && t.metric === f.metric && t.scope === splitBy && t.scopeValue === r.value))
      .map((r, i) => ({
        ...record,
        id: nextTargetId(i + 1),
        scope: splitBy,
        scopeValue: r.value,
        target: r.target,
        stretch: undefined,
        owner: defaultOwner(splitBy, r.value, user.name),
        notes: `Split from ${record.id} by share of ${f.intake} applications.`,
        parentId: record.id,
      }));
    saveTargets(editing ? all.map((t) => (t.id === id ? record : t)) : [record, ...children, ...all]);
    markTargetChange(id, editing ? "updated" : "added", 1 + children.length);
    router.push("/target-setup");
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <header className="flex flex-col gap-3">
        <Link href="/target-setup" className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Target list
        </Link>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{editing ? `Edit ${scopeLabel(target)} · ${metricLabel[target.metric]}` : "Add Target"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Set what should be achieved for an intake. Progress is measured live from applications, so there&apos;s nothing to update by hand.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Section index={1} title="What and when" description="The intake and the result you're aiming for.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Intake" required>
                <Select value={f.intake} onChange={(e) => changeIntake(e.target.value)}>
                  {allIntakes.map((i) => {
                    const apps = scopedApps(i, "Company", "").length;
                    return <option key={i} value={i}>{i}{apps ? ` · ${apps} applications` : ""}</option>;
                  })}
                </Select>
              </Field>
              <Field label="Measure" required hint={metricHelp[f.metric]}>
                <Select value={f.metric} onChange={(e) => set("metric", e.target.value as Metric)}>
                  {metrics.map((m) => <option key={m} value={m}>{metricLabel[m]}</option>)}
                </Select>
              </Field>
              <Field label="Window starts">
                <TextInput type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
              </Field>
              <Field label="Window ends" hint="Defaults to 9 months before the intake until census, 4 weeks after it starts.">
                <TextInput type="date" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} aria-invalid={!!show("endDate")} className={cn(show("endDate") && "border-danger")} />
                <Err msg={show("endDate")} />
              </Field>
            </div>
          </Section>

          <Section index={2} title="Who it's for" description="A target can cover the whole company or one part of it.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Scope" className="sm:col-span-2">
                <PillGroup<Scope> options={scopes.map((s) => ({ value: s, label: s }))} value={f.scope} onChange={changeScope} />
              </Field>
              {duplicate && (
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-warning-soft px-3 py-2 text-xs text-foreground sm:col-span-2" aria-invalid={tried}>
                  <CircleAlert className="size-3.5 text-warning" /> {errors.duplicate}.
                  <Link href={`/target-setup/${duplicate.id}/edit`} className="font-semibold text-primary hover:underline">Edit that target instead</Link>
                </p>
              )}
              {f.scope !== "Company" && (
                <Field label={f.scope} required>
                  <Select value={f.scopeValue} onChange={(e) => changeValue(e.target.value)} placeholder={`Choose ${f.scope === "Destination" ? "a destination" : `a ${f.scope.toLowerCase()}`}`} aria-invalid={!!show("scopeValue")} className={cn(show("scopeValue") && "border-danger")}>
                    {options.map((o) => <option key={o.value} value={o.value}>{o.label} · {o.count} applications</option>)}
                  </Select>
                  <Err msg={show("scopeValue")} />
                </Field>
              )}
              <Field label="Accountable" required hint="Usually filled in for you — the branch manager, team lead or counsellor.">
                <Select value={f.owner} onChange={(e) => set("owner", e.target.value)} aria-invalid={!!show("owner")}>
                  {[...new Set([f.owner, ...staffNames])].filter(Boolean).map((s) => <option key={s}>{s}</option>)}
                </Select>
                <Err msg={show("owner")} />
              </Field>
            </div>
          </Section>

          <Section index={3} title="The numbers" description={`How many ${metricLabel[f.metric].toLowerCase()} for ${f.intake}.`}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Target" required>
                <TextInput inputMode="numeric" value={f.target} onChange={(e) => set("target", e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="e.g. 120" aria-invalid={!!show("target")} className={cn("text-lg font-semibold", show("target") && "border-danger")} />
                <Err msg={show("target")} />
              </Field>
              <Field label="Stretch target" hint="Optional — a higher bar for bonuses.">
                <TextInput inputMode="numeric" value={f.stretch} onChange={(e) => set("stretch", e.target.value.replace(/\D/g, "").slice(0, 5))} aria-invalid={!!show("stretch")} className={cn(show("stretch") && "border-danger")} />
                <Err msg={show("stretch")} />
              </Field>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 sm:col-span-2">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Lightbulb className="size-3.5" /> Suggestions:</span>
                  {suggestions.map((s) => (
                    <button key={s.label} type="button" onClick={() => set("target", String(s.value))} className={cn("h-7 rounded-full border px-2.5 text-[11px] font-semibold transition-colors", n === s.value ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
              <Field label="Notes" className="sm:col-span-2">
                <Textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="How the number was set, bonus terms, agreed actions…" />
              </Field>
            </div>
          </Section>

          {!editing && f.scope === "Company" && (
            <Section index={4} title="Split it down" description="Optional — create matching targets for each branch or counsellor at the same time.">
              <Checkbox checked={split} onChange={setSplit} label={<span><span className="font-semibold">Also create targets below this one</span><span className="block text-xs text-muted-foreground">Shared out by each one&apos;s share of {f.intake} applications. You can edit them afterwards; existing ones are skipped.</span></span>} />
              {split && (
                <div className="mt-4 flex flex-col gap-3">
                  <PillGroup<"Branch" | "Counsellor"> options={[{ value: "Branch", label: "By branch" }, { value: "Counsellor", label: "By counsellor" }]} value={splitBy} onChange={setSplitBy} />
                  {!n ? (
                    <p className="text-xs text-muted-foreground">Enter the company target first.</p>
                  ) : (
                    <ul className="divide-y divide-border rounded-2xl border border-border">
                      {splitRows.map((r) => (
                        <li key={r.value} className="flex items-center gap-3 px-3.5 py-2 text-xs">
                          <span className="min-w-0 flex-1 truncate text-foreground">{r.value}</span>
                          <span className="w-12 text-right tabular-nums text-muted-foreground">{Math.round(r.share * 100)}%</span>
                          <span className="w-12 text-right font-semibold tabular-nums text-foreground">{r.target}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Section>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-0">
          <Card className="p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Reality check</p>
            {!p ? (
              <p className="text-xs text-muted-foreground">Choose the {f.scope.toLowerCase()} to see how it&apos;s tracking.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{scopeLabel({ scope: f.scope, scopeValue: f.scopeValue })}</p>
                    <p className="text-xs text-muted-foreground">{metricLabel[f.metric]} · {f.intake}</p>
                  </div>
                  {n > 0 && <TargetStatusBadge status={p.status} />}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["So far", p.actual],
                    ["Pipeline", p.pipeline],
                    ["Forecast", p.forecast],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-xl bg-surface-muted px-3 py-2">
                      <p className="text-base font-bold tabular-nums text-foreground">{v}</p>
                      <p className="text-[11px] text-muted-foreground">{l}</p>
                    </div>
                  ))}
                </div>
                {n > 0 && (
                  <>
                    <TargetBar target={n} progress={p} />
                    <BarLegend />
                    <p className="text-xs text-foreground">{advice({ target: n, metric: f.metric }, p)}</p>
                  </>
                )}
                <p className="flex items-start gap-2 rounded-xl bg-surface-muted px-3 py-2 text-xs text-muted-foreground">
                  <History className="mt-0.5 size-3.5 shrink-0" />
                  {last ? <span>Last finished intake ({last.intake}): <span className="font-semibold text-foreground">{last.value}</span> {metricLabel[f.metric].toLowerCase()}.</span> : <span>No finished intake to compare with for this scope.</span>}
                </p>
                <p className="text-[11px] text-muted-foreground">Window {formatDay(f.startDate)} – {formatDay(f.endDate)} · forecast weights each open application by its chance of reaching this stage.</p>
              </div>
            )}
          </Card>

          {splitRows.length > 0 && (
            <p className="flex items-center gap-2 rounded-2xl bg-primary-soft px-4 py-3 text-xs text-foreground">
              <Split className="size-4 shrink-0 text-primary" /> Also creates {splitRows.length} {splitBy.toLowerCase()} targets.
            </p>
          )}

          {tried && errorCount > 0 && (
            <p className="flex items-center gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-xs font-medium text-danger">
              <CircleAlert className="size-4 shrink-0" /> Fix {errorCount} field{errorCount > 1 ? "s" : ""} to continue.
            </p>
          )}

          <div className="flex gap-2">
            <Link href="/target-setup" className={cn(buttonSecondary, "flex-1")}>Cancel</Link>
            <button type="submit" className={cn(buttonPrimary, "flex-1")}>{editing ? "Save changes" : splitRows.length ? `Create ${splitRows.length + 1} targets` : "Create target"}</button>
          </div>
        </aside>
      </div>
    </form>
  );
}

function Section({ index, title, description, children }: { index: number; title: string; description: string; children: ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{index}</span>
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function Err({ msg }: { msg?: string }) {
  return msg ? <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-danger"><CircleAlert className="size-3" /> {msg}</span> : null;
}
