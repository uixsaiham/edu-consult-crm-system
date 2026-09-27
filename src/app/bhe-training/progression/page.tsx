"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Award, BellRing, CalendarPlus, CheckCircle2, Download, GraduationCap, RotateCcw, SearchX, ShieldCheck, UserRound } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonSecondary } from "@/components/ui/button-styles";
import { BarButton, HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/office/office-ui";
import { Avatar, formatDay, RoleChip } from "@/components/people/people-ui";
import { Bar, LearnerStatusBadge, learnerStatuses } from "@/components/training/training-ui";
import { getRoles, getStaff, staffBranches, type StaffMember } from "@/lib/mock/staff";
import {
  addDays,
  bestScore,
  daysUntil,
  expiresAt,
  getCourses,
  getEnrolments,
  progressOf,
  saveEnrolments,
  statusOf,
  trainingToday,
  type Course,
  type Enrolment,
  type LearnerStatus,
} from "@/lib/mock/training";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

type View = "people" | "assignments" | "matrix";
const inDate = (s: LearnerStatus) => s === "Completed" || s === "Expiring";
const needsAction = (s: LearnerStatus) => s === "Overdue" || s === "Expired";
const dot: Record<LearnerStatus, string> = { Completed: "bg-success", Expiring: "bg-warning", "In progress": "bg-primary", "Not started": "bg-border-strong", Overdue: "bg-danger", Expired: "bg-danger" };

export default function ProgressionPage() {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading progress…</p>}>
      <FromParams />
    </Suspense>
  );
}

function FromParams() {
  const p = useSearchParams();
  const status = p.get("status") ?? "";
  return <Progression key={p.toString()} initialStatus={status} initialCourse={p.get("course") ?? ""} />;
}

function Progression({ initialStatus, initialCourse }: { initialStatus: string; initialCourse: string }) {
  const courses = getCourses().filter((c) => c.published);
  const staff = useMemo(() => getStaff().filter((s) => s.status === "Active" || s.status === "On leave"), []);
  const [enrolments, setEnrolments] = useState<Enrolment[]>(getEnrolments);
  const [view, setView] = useState<View>(initialStatus || initialCourse ? "assignments" : "people");
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [role, setRole] = useState("");
  const [course, setCourse] = useState(initialCourse);
  const [status, setStatus] = useState(initialStatus);
  const [personId, setPersonId] = useState<string | null>(null);
  const [toast, notify] = useToast();

  useEffect(() => saveEnrolments(enrolments), [enrolments]);

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const staffById = new Map(staff.map((s) => [s.id, s]));
  const rows = enrolments
    .filter((e) => courseById.has(e.courseId) && staffById.has(e.staffId))
    .map((e) => {
      const c = courseById.get(e.courseId)!;
      return { e, c, s: staffById.get(e.staffId)!, st: statusOf(e, c) };
    });

  const q = search.trim().toLowerCase();
  const matchPerson = (s: StaffMember) => (!branch || s.branch === branch) && (!role || s.roleId === role) && (!q || `${s.name} ${s.jobTitle} ${s.branch}`.toLowerCase().includes(q));
  const filteredRows = rows
    .filter((r) => matchPerson(r.s) && (!course || r.c.id === course) && (!status || r.st === status || (status === "Expiring" && r.st === "Expired")))
    .sort((a, b) => learnerStatuses.indexOf(a.st) - learnerStatuses.indexOf(b.st) || a.e.dueDate.localeCompare(b.e.dueDate));
  const hasFilters = !!(search || branch || role || course || status);

  const mandatoryRows = rows.filter((r) => r.c.level === "Mandatory");
  const compliance = Math.round((mandatoryRows.filter((r) => inDate(r.st)).length / Math.max(1, mandatoryRows.length)) * 100);
  const overdue = rows.filter((r) => r.st === "Overdue").length;
  const refresh = rows.filter((r) => r.st === "Expired" || r.st === "Expiring").length;
  const scores = rows.map((r) => bestScore(r.e)).filter((x): x is number => x !== undefined);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const people = staff
    .filter(matchPerson)
    .map((s) => {
      const mine = rows.filter((r) => r.s.id === s.id && (!course || r.c.id === course));
      const mand = mine.filter((r) => r.c.level === "Mandatory");
      return {
        s,
        mine,
        done: mine.filter((r) => inDate(r.st)).length,
        action: mine.filter((r) => needsAction(r.st)).length,
        compliance: mand.length ? Math.round((mand.filter((r) => inDate(r.st)).length / mand.length) * 100) : 100,
      };
    })
    .filter((p) => !status || p.mine.some((r) => r.st === status || (status === "Expiring" && r.st === "Expired")))
    .sort((a, b) => a.compliance - b.compliance || b.action - a.action);

  // Keyed by "staffId|courseId".
  const selection = useRowSelection(view === "assignments" ? filteredRows.map((r) => `${r.e.staffId}|${r.e.courseId}`) : []);
  const selectedKeys = new Set(filteredRows.filter((r) => selection.isSelected(`${r.e.staffId}|${r.e.courseId}`)).map((r) => `${r.e.staffId}|${r.e.courseId}`));

  const patch = (keys: Set<string>, fn: (e: Enrolment) => Enrolment) => setEnrolments((prev) => prev.map((e) => (keys.has(`${e.staffId}|${e.courseId}`) ? fn(e) : e)));
  const remind = (keys: Set<string>) => {
    patch(keys, (e) => ({ ...e, reminders: [...e.reminders, trainingToday] }));
    notify(keys.size === 1 ? "Reminder sent by email and in-app" : `${keys.size} reminders sent`);
  };
  const extend = (keys: Set<string>) => {
    patch(keys, (e) => ({ ...e, dueDate: addDays(e.dueDate < trainingToday ? trainingToday : e.dueDate, 14) }));
    notify(keys.size === 1 ? "Due date extended by 14 days" : `${keys.size} due dates extended by 14 days`);
  };
  const remindOverdue = () => {
    const keys = new Set(rows.filter((r) => needsAction(r.st) && matchPerson(r.s)).map((r) => `${r.e.staffId}|${r.e.courseId}`));
    if (!keys.size) return notify("No one is overdue", "error");
    remind(keys);
  };

  const byBranch = staffBranches.map((b) => {
    const list = mandatoryRows.filter((r) => r.s.branch === b);
    return { b, pct: Math.round((list.filter((r) => inDate(r.st)).length / Math.max(1, list.length)) * 100), action: list.filter((r) => needsAction(r.st)).length, total: list.length };
  });
  const byCourse = courses.map((c) => {
    const list = rows.filter((r) => r.c.id === c.id);
    return { c, pct: Math.round((list.filter((r) => inDate(r.st)).length / Math.max(1, list.length)) * 100), total: list.length, action: list.filter((r) => needsAction(r.st)).length };
  });

  const exportCsv = () =>
    downloadCsv(
      "training-progress.csv",
      filteredRows.map((r) => ({
        person: r.s.name, role: getRoles().find((x) => x.id === r.s.roleId)?.name ?? "", branch: r.s.branch, course: r.c.title, requirement: r.c.level,
        assigned: r.e.assignedAt, due: r.e.dueDate, progress: `${progressOf(r.e, r.c)}%`, status: r.st, completed: r.e.completedAt ?? "", validUntil: expiresAt(r.e, r.c) ?? "", bestScore: bestScore(r.e) ?? "", attempts: r.e.attempts.length,
      }))
    );

  const person = personId ? staffById.get(personId) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Training Progression</h2>
          <p className="mt-1 text-sm text-muted-foreground">Who has completed what, what&apos;s overdue and which certificates need renewing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} className={buttonSecondary}><Download className="size-4" /> Export</button>
          <button type="button" onClick={remindOverdue} className={buttonSecondary}><BellRing className="size-4" /> Remind everyone overdue</button>
          <Link href="/bhe-training" className={buttonSecondary}><GraduationCap className="size-4" /> Training Hub</Link>
        </div>
      </header>

      <StatGrid>
        <StatCard icon={ShieldCheck} tone={compliance >= 90 ? "success" : compliance >= 75 ? "warning" : "danger"} label="Mandatory done" value={`${compliance}%`} note="target 95%" />
        <StatCard icon={AlertTriangle} tone={overdue ? "danger" : "success"} label="Overdue" value={overdue} onClick={() => { setView("assignments"); setStatus("Overdue"); }} />
        <StatCard icon={RotateCcw} tone={refresh ? "warning" : "success"} label="Renewals due" value={refresh} note="≤30 days" onClick={() => { setView("assignments"); setStatus("Expiring"); }} />
        <StatCard icon={Award} tone="violet" label="Average quiz score" value={`${avgScore}%`} note={`${scores.length} passed`} />
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Mandatory training by branch" subtitle="Share of mandatory courses completed and in date" />
          <ul className="flex flex-col gap-3 px-6 pb-5 pt-4">
            {byBranch.map((x) => (
              <li key={x.b}>
                <button type="button" onClick={() => setBranch(branch === x.b ? "" : x.b)} className="w-full text-left">
                  <p className="mb-1 flex justify-between gap-2 text-xs"><span className={cn("font-medium", branch === x.b ? "text-primary" : "text-foreground")}>{x.b}</span><span className="tabular-nums text-muted-foreground"><span className="font-semibold text-foreground">{x.pct}%</span>{x.action ? <span className="text-danger"> · {x.action} to act on</span> : ""}</span></p>
                  <Bar value={x.pct} tone={x.pct >= 90 ? "bg-success" : x.pct >= 75 ? "bg-warning" : "bg-danger"} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Completion by course" subtitle="Everyone assigned, any requirement" />
          <ul className="flex flex-col gap-3 px-6 pb-5 pt-4">
            {byCourse.map((x) => (
              <li key={x.c.id}>
                <button type="button" onClick={() => { setCourse(course === x.c.id ? "" : x.c.id); setView("assignments"); }} className="w-full text-left">
                  <p className="mb-1 flex justify-between gap-2 text-xs"><span className={cn("truncate font-medium", course === x.c.id ? "text-primary" : "text-foreground")}>{x.c.title}</span><span className="shrink-0 tabular-nums text-muted-foreground"><span className="font-semibold text-foreground">{x.pct}%</span> of {x.total}{x.action ? <span className="text-danger"> · {x.action} overdue</span> : ""}</span></p>
                  <Bar value={x.pct} tone={x.pct >= 90 ? "bg-success" : x.pct >= 75 ? "bg-warning" : "bg-primary"} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Tabs<View> label="View" value={view} onChange={(v) => { setView(v); selection.clear(); }} options={[{ value: "people", label: "By person", count: people.length }, { value: "assignments", label: "Assignments", count: filteredRows.length }, { value: "matrix", label: "Matrix" }]} />

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Name, job title, branch…" label="Search people" />
        <SelectFilter label="Branch" value={branch} onChange={setBranch} allLabel="All branches" options={[...staffBranches]} />
        <SelectFilter label="Role" value={role} onChange={setRole} allLabel="All roles" options={getRoles().filter((r) => staff.some((s) => s.roleId === r.id)).map((r) => ({ value: r.id, label: r.name }))} />
        <SelectFilter label="Course" value={course} onChange={setCourse} allLabel="All courses" width="w-72" options={courses.map((c) => ({ value: c.id, label: c.title }))} />
        <SelectFilter label="Status" value={status} onChange={setStatus} allLabel="Any status" options={learnerStatuses.map((s) => ({ value: s, label: s, dot: dot[s] }))} />
        {hasFilters && <ResetFilters onClick={() => { setSearch(""); setBranch(""); setRole(""); setCourse(""); setStatus(""); }} />}
      </FilterBar>

      {view === "people" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead className="whitespace-nowrap border-b border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2.5 pl-5 pr-3">Person</th>
                  <th className="px-3 py-2.5">Role</th>
                  <th className="px-3 py-2.5">Courses</th>
                  <th className="px-3 py-2.5">Mandatory</th>
                  <th className="px-3 py-2.5">Needs action</th>
                  <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {people.map((p) => (
                  <tr key={p.s.id} className="transition-colors hover:bg-surface-hover/60">
                    <td className="py-3 pl-5 pr-3">
                      <button type="button" onClick={() => setPersonId(p.s.id)} className="flex items-center gap-2.5 text-left">
                        <Avatar name={p.s.name} size="sm" />
                        <span><span className="block text-sm font-semibold text-foreground hover:text-primary">{p.s.name}</span><span className="block text-[11px] text-muted-foreground">{p.s.branch}{p.s.status === "On leave" ? " · on leave" : ""}</span></span>
                      </button>
                    </td>
                    <td className="px-3 py-3"><RoleChip roleId={p.s.roleId} /></td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1" aria-label={`${p.done} of ${p.mine.length} complete`}>
                        {p.mine.map((r) => <span key={r.c.id} title={`${r.c.title}: ${r.st}`} className={cn("size-2.5 rounded-full", dot[r.st])} />)}
                        <span className="ml-1.5 tabular-nums text-muted-foreground">{p.done}/{p.mine.length}</span>
                      </span>
                    </td>
                    <td className="w-40 px-3 py-3">
                      <p className="mb-1 text-[11px] font-semibold tabular-nums text-foreground">{p.compliance}%</p>
                      <Bar value={p.compliance} tone={p.compliance === 100 ? "bg-success" : p.compliance >= 75 ? "bg-warning" : "bg-danger"} />
                    </td>
                    <td className="px-3 py-3">{p.action ? <span className="font-semibold text-danger">{p.action} overdue or expired</span> : <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="size-3.5" /> Up to date</span>}</td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      <button type="button" onClick={() => setPersonId(p.s.id)} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover"><UserRound className="size-3.5" /> Record</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {people.length === 0 && <Empty />}
          </div>
        </Card>
      )}

      {view === "assignments" && (
        <Card className="overflow-hidden">
          <SelectionBar selection={selection} noun={["assignment", "assignments"]} className="mx-5 mt-4">
            <BarButton onClick={() => { remind(selectedKeys); selection.clear(); }}><BellRing className="size-3.5" /> Remind</BarButton>
            <BarButton onClick={() => { extend(selectedKeys); selection.clear(); }}><CalendarPlus className="size-3.5" /> Extend 14 days</BarButton>
          </SelectionBar>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-10 py-2.5 pl-5 pr-0"><HeaderCheckbox selection={selection} /></th>
                  <th className="py-2.5 pl-3 pr-3">Person</th>
                  <th className="px-3 py-2.5">Course</th>
                  <th className="px-3 py-2.5">Progress</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Due / valid until</th>
                  <th className="px-3 py-2.5 text-right">Score</th>
                  <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.map((r) => {
                  const key = `${r.e.staffId}|${r.e.courseId}`;
                  const exp = expiresAt(r.e, r.c);
                  const lastReminder = r.e.reminders.at(-1);
                  return (
                    <tr key={key} className={cn("transition-colors hover:bg-surface-hover/60", selectedRowClass(selection, key))}>
                      <td className="py-3 pl-5 pr-0 align-middle"><RowCheckbox selection={selection} id={key} label={`Select ${r.s.name} ${r.c.title}`} /></td>
                      <td className="py-3 pl-3 pr-3">
                        <button type="button" onClick={() => setPersonId(r.s.id)} className="flex items-center gap-2 text-left">
                          <Avatar name={r.s.name} size="xs" />
                          <span><span className="block font-semibold text-foreground hover:text-primary">{r.s.name}</span><span className="block text-[11px] text-muted-foreground">{r.s.branch}</span></span>
                        </button>
                      </td>
                      <td className="max-w-[240px] px-3 py-3">
                        <Link href={`/bhe-training/${r.c.id}`} className="block truncate font-medium text-foreground hover:text-primary">{r.c.title}</Link>
                        <p className="text-[11px] text-muted-foreground">{r.c.level}</p>
                      </td>
                      <td className="w-32 px-3 py-3">
                        <p className="mb-1 text-[11px] font-semibold tabular-nums text-foreground">{progressOf(r.e, r.c)}%</p>
                        <Bar value={progressOf(r.e, r.c)} tone={r.e.completedAt ? "bg-success" : "bg-primary"} />
                      </td>
                      <td className="px-3 py-3"><LearnerStatusBadge status={r.st} /></td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {r.e.completedAt ? (
                          <>
                            <p className="text-foreground">{exp ? formatDay(exp) : "No expiry"}</p>
                            <p className="text-[11px] text-muted-foreground">done {formatDay(r.e.completedAt)}</p>
                          </>
                        ) : (
                          <>
                            <p className={cn(r.st === "Overdue" ? "font-semibold text-danger" : "text-foreground")}>{formatDay(r.e.dueDate)}</p>
                            <p className="text-[11px] text-muted-foreground">{daysUntil(r.e.dueDate) < 0 ? `${-daysUntil(r.e.dueDate)} days late` : `in ${daysUntil(r.e.dueDate)} days`}{lastReminder ? ` · reminded ${formatDay(lastReminder)}` : ""}</p>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-foreground">{bestScore(r.e) !== undefined ? `${bestScore(r.e)}%` : <span className="text-muted-foreground">—</span>}</td>
                      <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right">
                        {!inDate(r.st) || r.st === "Expiring" ? (
                          <div className="inline-flex gap-1.5">
                            <button type="button" onClick={() => remind(new Set([key]))} aria-label={`Remind ${r.s.name}`} title="Send reminder" className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground"><BellRing className="size-3.5" /></button>
                            {!r.e.completedAt && <button type="button" onClick={() => extend(new Set([key]))} aria-label={`Extend ${r.s.name}'s due date`} title="Extend 14 days" className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground"><CalendarPlus className="size-3.5" /></button>}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredRows.length === 0 && <Empty />}
          </div>
        </Card>
      )}

      {view === "matrix" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="border-b border-border bg-surface-muted text-[11px] font-semibold text-muted-foreground">
                <tr>
                  <th className="sticky left-0 z-10 bg-surface-muted py-2.5 pl-5 pr-3 uppercase tracking-wide">Person</th>
                  {courses.filter((c) => !course || c.id === course).map((c) => (
                    <th key={c.id} className="w-28 px-2 py-2.5 text-center font-semibold leading-tight">
                      <Link href={`/bhe-training/${c.id}`} className="hover:text-primary">{c.title.split(" ").slice(0, 3).join(" ")}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {people.map((p) => (
                  <tr key={p.s.id} className="hover:bg-surface-hover/60">
                    <td className="sticky left-0 z-10 bg-surface py-2 pl-5 pr-3">
                      <button type="button" onClick={() => setPersonId(p.s.id)} className="text-left font-medium text-foreground hover:text-primary">{p.s.name}</button>
                      <span className="block text-[11px] text-muted-foreground">{p.s.branch}</span>
                    </td>
                    {courses.filter((c) => !course || c.id === course).map((c) => {
                      const r = p.mine.find((x) => x.c.id === c.id);
                      return (
                        <td key={c.id} className="px-2 py-2 text-center">
                          {r ? (
                            <span title={`${c.title}: ${r.st}${r.e.completedAt ? ` · ${formatDay(r.e.completedAt)}` : ` · due ${formatDay(r.e.dueDate)}`}`} className={cn("inline-flex h-6 min-w-12 items-center justify-center rounded-md px-1.5 text-[10px] font-semibold", r.st === "Completed" ? "bg-success-soft text-success" : r.st === "Expiring" ? "bg-warning-soft text-warning" : needsAction(r.st) ? "bg-danger-soft text-danger" : r.st === "In progress" ? "bg-primary-soft text-primary" : "bg-surface-hover text-muted-foreground")}>
                              {r.st === "Completed" || r.st === "Expiring" ? "✓" : r.st === "In progress" ? `${progressOf(r.e, r.c)}%` : r.st === "Not started" ? "—" : r.st === "Overdue" ? "Late" : "Exp."}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50">n/a</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {people.length === 0 && <Empty />}
          </div>
          <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
            <span>✓ complete</span><span className="text-warning">✓ renew within 30 days</span><span>% in progress</span><span>— not started</span><span className="text-danger">Late overdue</span><span className="text-danger">Exp. certificate expired</span><span>n/a not assigned</span>
          </p>
        </Card>
      )}

      {person && (
        <PersonRecord
          person={person}
          rows={rows.filter((r) => r.s.id === person.id)}
          onClose={() => setPersonId(null)}
          onRemind={(courseId) => remind(new Set([`${person.id}|${courseId}`]))}
          onExtend={(courseId) => extend(new Set([`${person.id}|${courseId}`]))}
        />
      )}
      {toast}
    </div>
  );
}

function PersonRecord({ person, rows, onClose, onRemind, onExtend }: { person: StaffMember; rows: { e: Enrolment; c: Course; st: LearnerStatus }[]; onClose: () => void; onRemind: (courseId: string) => void; onExtend: (courseId: string) => void }) {
  const done = rows.filter((r) => inDate(r.st)).length;
  return (
    <SlideOver open onClose={onClose} icon={GraduationCap} title={person.name} subtitle={`${person.jobTitle} · ${person.branch}`}>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Assigned", rows.length],
            ["Complete", done],
            ["Needs action", rows.filter((r) => needsAction(r.st)).length],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-surface-muted px-3 py-2.5">
              <p className="text-lg font-bold tabular-nums text-foreground">{v}</p>
              <p className="text-[11px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        <ul className="flex flex-col gap-2">
          {rows
            .sort((a, b) => learnerStatuses.indexOf(a.st) - learnerStatuses.indexOf(b.st))
            .map((r) => {
              const exp = expiresAt(r.e, r.c);
              return (
                <li key={r.c.id} className="rounded-2xl border border-border p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/bhe-training/${r.c.id}`} className="block truncate text-sm font-semibold text-foreground hover:text-primary">{r.c.title}</Link>
                      <p className="text-[11px] text-muted-foreground">{r.c.level} · assigned {formatDay(r.e.assignedAt)}</p>
                    </div>
                    <LearnerStatusBadge status={r.st} />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <Bar value={progressOf(r.e, r.c)} tone={r.e.completedAt ? "bg-success" : "bg-primary"} className="flex-1" />
                    <span className="text-[11px] tabular-nums text-muted-foreground">{progressOf(r.e, r.c)}%</span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {r.e.completedAt ? `Completed ${formatDay(r.e.completedAt)}${bestScore(r.e) !== undefined ? ` · ${bestScore(r.e)}% in ${r.e.attempts.length} attempt${r.e.attempts.length === 1 ? "" : "s"}` : ""}${exp ? ` · valid until ${formatDay(exp)}` : ""}` : `Due ${formatDay(r.e.dueDate)}${r.e.reminders.length ? ` · ${r.e.reminders.length} reminder${r.e.reminders.length === 1 ? "" : "s"} sent` : ""}`}
                  </p>
                  {(!r.e.completedAt || r.st === "Expiring" || r.st === "Expired") && (
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => onRemind(r.c.id)} className="inline-flex h-7 items-center gap-1 rounded-full border border-border px-2.5 text-[11px] font-semibold text-foreground hover:bg-surface-hover"><BellRing className="size-3" /> Remind</button>
                      {!r.e.completedAt && <button type="button" onClick={() => onExtend(r.c.id)} className="inline-flex h-7 items-center gap-1 rounded-full border border-border px-2.5 text-[11px] font-semibold text-foreground hover:bg-surface-hover"><CalendarPlus className="size-3" /> Extend 14 days</button>}
                    </div>
                  )}
                </li>
              );
            })}
        </ul>
      </div>
    </SlideOver>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-muted-foreground"><SearchX className="size-5" /></span>
      <p className="text-sm font-medium text-foreground">No one matches</p>
      <p className="text-xs text-muted-foreground">Try other filters.</p>
    </div>
  );
}
