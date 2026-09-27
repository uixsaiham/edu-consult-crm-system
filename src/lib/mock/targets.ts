// Target Setup: recruitment targets per intake, measured live against the
// applications data. Edits are kept for the session until the backend exists.
import { getApplications, type ApplicationRow, type ApplicationStage } from "./applications";
import { getStaff, getTeams } from "./staff";

export const metrics = ["applications", "offers", "cas", "enrolments"] as const;
export type Metric = (typeof metrics)[number];
export const metricLabel: Record<Metric, string> = { applications: "Applications", offers: "Offers", cas: "CAS issued", enrolments: "Enrolments" };
export const metricHelp: Record<Metric, string> = {
  applications: "Every application submitted for the intake.",
  offers: "Applications that reached a conditional or unconditional offer (or beyond).",
  cas: "Applications with a CAS issued (or further — visa filed, enrolled).",
  enrolments: "Students who enrolled.",
};

export const scopes = ["Company", "Branch", "Team", "Counsellor", "Destination", "University", "Channel"] as const;
export type Scope = (typeof scopes)[number];

export type TargetStatus = "Not started" | "On track" | "At risk" | "Off track" | "Achieved" | "Missed";

export interface Target {
  id: string;
  intake: string;
  metric: Metric;
  scope: Scope;
  /** Branch, team id, counsellor, country, university or channel — empty for Company. */
  scopeValue: string;
  target: number;
  stretch?: number;
  owner: string;
  startDate: string;
  endDate: string;
  notes: string;
  archived: boolean;
  createdAt: string;
  createdBy: string;
  /** Set when the target was created by splitting a company target. */
  parentId?: string;
}

// --- Intakes ----------------------------------------------------------------------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const today = "2026-09-17";
const todayMs = Date.parse(today);

/** Intakes BHE recruits for, oldest first. */
export const allIntakes = ["Oct 2025", "Jan 2026", "Mar 2026", "May 2026", "Sep 2026", "Oct 2026", "Jan 2027", "Mar 2027", "May 2027", "Sep 2027"];

export function intakeStart(label: string) {
  const [m, y] = label.split(" ");
  return Date.UTC(Number(y), MONTHS.indexOf(m), 20);
}

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Default recruitment window: 9 months before the intake starts to 4 weeks after (census). */
export function intakeWindow(label: string) {
  const start = new Date(intakeStart(label));
  start.setUTCMonth(start.getUTCMonth() - 9);
  start.setUTCDate(1);
  return { start: iso(start.getTime()), end: iso(intakeStart(label) + 28 * 86400000) };
}

export function isClosed(t: Pick<Target, "endDate">) {
  return Date.parse(t.endDate) < todayMs;
}

export function nextIntake(label: string) {
  const i = allIntakes.indexOf(label);
  return allIntakes[Math.min(allIntakes.length - 1, i + 1)];
}

/** Intakes still being recruited for (census not passed), soonest first. */
export function openIntakes() {
  return allIntakes.filter((i) => Date.parse(intakeWindow(i).end) >= todayMs);
}

// --- Measuring ----------------------------------------------------------------------

const ladder: ApplicationStage[] = ["New", "App submitted", "Conditional offer", "Unconditional offer", "CAS issued", "Visa filed", "Enrolled"];
/** Chance of moving one step up the ladder, from BHE's recent intakes. */
const stepRate = [0.8, 0.65, 0.75, 0.8, 0.9, 0.85];
const threshold: Record<Metric, number> = { applications: 0, offers: 2, cas: 4, enrolments: 6 };
/** How much later in the cycle each measure lands (1 = evenly spread). */
const paceCurve: Record<Metric, number> = { applications: 1, offers: 1.5, cas: 2.4, enrolments: 1 };

export function counts(a: ApplicationRow, m: Metric) {
  // Every application counts towards an applications target, even if later rejected or withdrawn.
  return m === "applications" || ladder.indexOf(a.stage) >= threshold[m];
}
const lost = (a: ApplicationRow) => a.stage === "Rejected" || a.stage === "Withdrawn";

function chanceToReach(stage: ApplicationStage, m: Metric) {
  let p = 1;
  for (let s = ladder.indexOf(stage); s < threshold[m]; s++) p *= stepRate[s];
  return p;
}

export function scopeLabel(t: Pick<Target, "scope" | "scopeValue">) {
  if (t.scope === "Company") return "Whole company";
  if (t.scope === "Team") return getTeams().find((x) => x.id === t.scopeValue)?.name ?? t.scopeValue;
  if (t.scope === "Channel") return `${t.scopeValue} applications`;
  return t.scopeValue;
}

export function inScope(a: ApplicationRow, scope: Scope, value: string) {
  switch (scope) {
    case "Company":
      return true;
    case "Branch":
      return a.branch === value;
    case "Counsellor":
      return a.counsellor === value;
    case "Team": {
      const team = getTeams().find((t) => t.id === value);
      const names = new Set(getStaff().filter((s) => team?.memberIds.includes(s.id)).map((s) => s.name));
      return names.has(a.counsellor);
    }
    case "Destination":
      return a.country === value;
    case "University":
      return a.university === value;
    case "Channel":
      return a.channel === value;
  }
}

export function scopedApps(intake: string, scope: Scope, value: string) {
  return getApplications().filter((a) => a.intake === intake && inScope(a, scope, value));
}

export interface Progress {
  actual: number;
  /** Open applications that could still count, weighted by their chance of getting there. */
  pipeline: number;
  forecast: number;
  /** Where the target says we should be by today. */
  expected: number;
  elapsed: number;
  daysLeft: number;
  status: TargetStatus;
  apps: ApplicationRow[];
}

export function measure(t: Pick<Target, "intake" | "scope" | "scopeValue" | "metric" | "target" | "startDate" | "endDate">): Progress {
  const apps = scopedApps(t.intake, t.scope, t.scopeValue);
  const actual = apps.filter((a) => counts(a, t.metric)).length;
  const start = Date.parse(t.startDate);
  const end = Date.parse(t.endDate);
  const elapsed = Math.min(1, Math.max(0, (todayMs - start) / Math.max(1, end - start)));
  const closed = todayMs > end;
  const started = intakeStart(t.intake) <= todayMs;

  let pipeline = 0;
  if (!closed) {
    if (t.metric === "applications") {
      // Applications keep arriving: project the current pace to the end of the window.
      pipeline = elapsed > 0.05 && !started ? Math.round(actual / elapsed - actual) : 0;
    } else {
      pipeline = Math.round(apps.filter((a) => !lost(a) && !counts(a, t.metric)).reduce((n, a) => n + chanceToReach(a.stage, t.metric) * (started && t.metric !== "enrolments" ? 0.3 : 1), 0));
    }
  }
  const forecast = actual + pipeline;
  // Students can only enrol once the intake starts, so the enrolment pace begins there.
  const expected =
    t.metric === "enrolments"
      ? Math.round(t.target * Math.min(1, Math.max(0, (todayMs - intakeStart(t.intake)) / Math.max(1, end - intakeStart(t.intake)))))
      : Math.round(t.target * Math.pow(elapsed, paceCurve[t.metric]));
  const daysLeft = Math.max(0, Math.ceil((end - todayMs) / 86400000));

  let status: TargetStatus;
  if (todayMs < start) status = "Not started";
  else if (closed) status = actual >= t.target ? "Achieved" : "Missed";
  else if (actual >= t.target) status = "Achieved";
  else if (forecast >= t.target) status = "On track";
  else if (forecast >= t.target * 0.85) status = "At risk";
  else status = "Off track";

  return { actual, pipeline, forecast, expected, elapsed, daysLeft, status, apps };
}

/** The most recent finished intake's result for the same scope and measure, to sense-check a new target. */
export function lastResult(intake: string, scope: Scope, value: string, m: Metric) {
  const before = allIntakes.slice(0, allIntakes.indexOf(intake)).reverse();
  for (const i of before) {
    if (Date.parse(intakeWindow(i).end) >= todayMs) continue;
    const apps = scopedApps(i, scope, value);
    if (apps.length) return { intake: i, value: apps.filter((a) => counts(a, m)).length };
  }
  return null;
}

/** Scope options with how many applications each has for an intake. */
export function scopeOptions(scope: Scope, intake: string) {
  const apps = getApplications().filter((a) => a.intake === intake);
  const tally = (key: (a: ApplicationRow) => string, all: string[]) =>
    all.map((v) => ({ value: v, label: v, count: apps.filter((a) => key(a) === v).length }));
  const uniq = (key: (a: ApplicationRow) => string) => [...new Set(getApplications().map(key))].sort();
  switch (scope) {
    case "Company":
      return [];
    case "Branch":
      return tally((a) => a.branch, uniq((a) => a.branch));
    case "Counsellor":
      return tally((a) => a.counsellor, uniq((a) => a.counsellor));
    case "Destination":
      return tally((a) => a.country, uniq((a) => a.country));
    case "University":
      return tally((a) => a.university, uniq((a) => a.university));
    case "Channel":
      return tally((a) => a.channel, ["Direct", "Agent", "Affiliate"]);
    case "Team":
      return getTeams().map((t) => ({ value: t.id, label: t.name, count: apps.filter((a) => inScope(a, "Team", t.id)).length }));
  }
}

/** Who is usually accountable for a scope. */
export function defaultOwner(scope: Scope, value: string, fallback: string) {
  const staff = getStaff();
  if (scope === "Counsellor") return value;
  if (scope === "Branch") return staff.find((s) => s.branch === value && s.roleId === "branch-manager")?.name ?? fallback;
  if (scope === "Team") {
    const lead = getTeams().find((t) => t.id === value)?.leadId;
    return staff.find((s) => s.id === lead)?.name ?? fallback;
  }
  return fallback;
}

// --- Seed data ------------------------------------------------------------------------

/** Seeds set the target relative to what the data will produce, so statuses are realistic. */
type Seed = Omit<Target, "id" | "target" | "startDate" | "endDate" | "archived" | "notes" | "createdAt" | "createdBy"> & { factor: number; notes?: string; created: string };

const branches = ["Dhaka HQ", "Sylhet", "London", "Manchester", "Milton Keynes"];
const seeds: Seed[] = [
  // September 2026 — the intake starting now
  { intake: "Sep 2026", metric: "enrolments", scope: "Company", scopeValue: "", factor: 1.05, owner: "Sadman Rahman", created: "2025-12-02", notes: "Board target: grow September enrolments 12% on last year." },
  { intake: "Sep 2026", metric: "cas", scope: "Company", scopeValue: "", factor: 0.95, owner: "Sadman Rahman", created: "2025-12-02" },
  ...branches.map((b, i): Seed => ({ intake: "Sep 2026", metric: "enrolments", scope: "Branch", scopeValue: b, factor: [0.92, 1.3, 1.02, 0.85, 1.12][i], owner: "", created: "2025-12-05" })),
  { intake: "Sep 2026", metric: "offers", scope: "Team", scopeValue: "TM-01", factor: 0.9, owner: "", created: "2026-01-12" },
  { intake: "Sep 2026", metric: "enrolments", scope: "University", scopeValue: "Coventry University", factor: 1.4, owner: "Alif Tasnim", created: "2026-02-01", notes: "Coventry offered a bonus tier above this number." },
  // October 2026
  { intake: "Oct 2026", metric: "enrolments", scope: "Company", scopeValue: "", factor: 0.98, owner: "Sadman Rahman", created: "2026-01-10" },
  { intake: "Oct 2026", metric: "offers", scope: "Channel", scopeValue: "Agent", factor: 1.2, owner: "Bickey Shah", created: "2026-02-18" },
  // January 2027 — recruiting now
  { intake: "Jan 2027", metric: "applications", scope: "Company", scopeValue: "", factor: 1.08, owner: "Sadman Rahman", created: "2026-04-02", notes: "Jan intakes are usually 35% of September — set from the 3-year average." },
  { intake: "Jan 2027", metric: "offers", scope: "Company", scopeValue: "", factor: 0.95, owner: "Sadman Rahman", created: "2026-04-02" },
  ...["Alif Tasnim", "Nusrat Choudhury", "Yuliana Prokipchak", "Sadia Afrin", "Md. Shariful Islam", "Harunor Rashid", "Ummay Saiha Limu", "N. Bintay Zaman"].map((c, i): Seed => ({ intake: "Jan 2027", metric: "offers", scope: "Counsellor", scopeValue: c, factor: [0.9, 0.95, 1.25, 1.0, 1.4, 0.8, 1.1, 1.05][i], owner: c, created: "2026-04-05" })),
  { intake: "Jan 2027", metric: "applications", scope: "Destination", scopeValue: "Ireland", factor: 1.5, owner: "Bickey Shah", created: "2026-05-20", notes: "New NCI partnership — push Irish options in counselling." },
  // Finished intakes
  { intake: "May 2026", metric: "enrolments", scope: "Company", scopeValue: "", factor: 0.95, owner: "Sadman Rahman", created: "2025-08-04" },
  ...branches.map((b, i): Seed => ({ intake: "May 2026", metric: "enrolments", scope: "Branch", scopeValue: b, factor: [0.9, 1.15, 0.97, 1.08, 0.88][i], owner: "", created: "2025-08-06" })),
  { intake: "Mar 2026", metric: "enrolments", scope: "Company", scopeValue: "", factor: 1.1, owner: "Sadman Rahman", created: "2025-06-02" },
  { intake: "Jan 2026", metric: "enrolments", scope: "Company", scopeValue: "", factor: 0.92, owner: "Sadman Rahman", created: "2025-04-01" },
];

function build(): Target[] {
  return seeds.map((s, i) => {
    const { start, end } = intakeWindow(s.intake);
    const draft = { intake: s.intake, metric: s.metric, scope: s.scope, scopeValue: s.scopeValue, target: 1, startDate: start, endDate: end };
    const m = measure(draft);
    const base = isClosed(draft) ? m.actual : Math.max(m.forecast, m.actual);
    const target = Math.max(3, Math.round(base * s.factor));
    return {
      id: `TGT-${String(101 + i)}`,
      intake: s.intake,
      metric: s.metric,
      scope: s.scope,
      scopeValue: s.scopeValue,
      target,
      stretch: s.scope === "Company" ? Math.round(target * 1.15) : undefined,
      owner: s.owner || defaultOwner(s.scope, s.scopeValue, "Sadman Rahman"),
      startDate: start,
      endDate: end,
      notes: s.notes ?? "",
      archived: false,
      createdAt: s.created,
      createdBy: "Sadman Rahman",
    };
  });
}

// --- Store --------------------------------------------------------------------------

let targets: Target[] | null = null;
export function getTargets() {
  return (targets ??= build());
}
export function saveTargets(next: Target[]) {
  targets = next;
}
export function getTarget(id: string) {
  return getTargets().find((t) => t.id === id);
}
export function nextTargetId(offset = 0) {
  const max = Math.max(100, ...getTargets().map((t) => Number(t.id.slice(4)) || 0));
  return `TGT-${max + 1 + offset}`;
}

let lastChange: { id: string; verb: "added" | "updated"; count: number } | null = null;
export function markTargetChange(id: string, verb: "added" | "updated", count = 1) {
  lastChange = { id, verb, count };
}
export function getTargetChange() {
  return lastChange;
}
export function clearTargetChange() {
  lastChange = null;
}

export function targetName(t: Pick<Target, "intake" | "metric" | "scope" | "scopeValue">) {
  return `${scopeLabel(t)} · ${metricLabel[t.metric]}`;
}

/** Cumulative applications per month for an intake (for the overview chart). */
export function cumulativeApplications(intake: string, scope: Scope = "Company", value = "") {
  const apps = scopedApps(intake, scope, value);
  const { start, end } = intakeWindow(intake);
  const out: { month: string; key: string; cumulative: number | null }[] = [];
  const d = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  let running = 0;
  while (d <= last) {
    const key = iso(d.getTime()).slice(0, 7);
    running += apps.filter((a) => a.createdAt.startsWith(key)).length;
    out.push({ month: `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`, key, cumulative: `${key}-01` <= today ? running : null });
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}
