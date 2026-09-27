"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, BellRing, BookOpen, CheckCircle2, CircleDashed, Clock3, Flag, GraduationCap, PencilLine, Plus, SearchX, Trash2, TrendingDown, UserPlus, Users, Video, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { Modal } from "@/components/ui/modal";
import { SlideOver } from "@/components/ui/slide-over";
import { Checkbox, Field, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { Tabs } from "@/components/office/office-ui";
import { Avatar, formatDay } from "@/components/people/people-ui";
import { AgentStatusBadge } from "@/components/agents/agent-ui";
import { Bar } from "@/components/training/training-ui";
import { getAgents } from "@/lib/mock/agents";
import { getStaff } from "@/lib/mock/staff";
import {
  addDays,
  allLessons,
  getCourses,
  getProgrammeLearners,
  getProgrammes,
  getVideos,
  programmeProgress,
  saveEnrolments,
  saveProgrammeLearners,
  saveProgrammes,
  saveVideos,
  seedAgentEnrolments,
  trainingToday,
  type Enrolment,
  type LearnerProgrammeStatus,
  type Programme,
  type ProgrammeAudience,
  type ProgrammeLearner,
  type ProgrammeStep,
  type StepStatus,
  type VideoSession,
} from "@/lib/mock/training";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const learnerStatus: Record<LearnerProgrammeStatus, string> = {
  "Not started": "bg-surface-hover text-muted-foreground",
  "On track": "bg-primary-soft text-primary",
  Behind: "bg-danger-soft text-danger",
  Completed: "bg-success-soft text-success",
};
const stepTone: Record<StepStatus, string> = { Done: "text-success", "Due soon": "text-warning", Overdue: "text-danger", Upcoming: "text-muted-foreground" };

export default function TrainingPeriodsPage() {
  const { user } = useUser();
  const agents = useMemo(() => getAgents(), []);
  const staff = useMemo(() => getStaff(), []);
  const [programmes, setProgrammes] = useState<Programme[]>(getProgrammes);
  const [learners, setLearners] = useState<ProgrammeLearner[]>(() => getProgrammeLearners(agents));
  const [enrolments, setEnrolments] = useState<Enrolment[]>(() => seedAgentEnrolments(agents));
  const [videos, setVideos] = useState<VideoSession[]>(getVideos);
  const [audience, setAudience] = useState<ProgrammeAudience>("Counsellor");
  const inAudience = programmes.filter((p) => p.audience === audience);
  const [programmeId, setProgrammeId] = useState(inAudience[0]?.id ?? "");
  const programme = programmes.find((p) => p.id === programmeId && p.audience === audience) ?? inAudience[0];
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [place, setPlace] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Programme | "new" | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [toast, notify] = useToast();

  useEffect(() => saveProgrammes(programmes), [programmes]);
  useEffect(() => saveProgrammeLearners(learners), [learners]);
  useEffect(() => saveEnrolments(enrolments), [enrolments]);
  useEffect(() => saveVideos(videos), [videos]);

  const courses = getCourses();
  const who = (id: string) => {
    const s = staff.find((x) => x.id === id);
    if (s) return { name: s.name, sub: `${s.jobTitle} · ${s.branch}`, place: s.branch, agent: undefined };
    const a = agents.find((x) => x.id === id);
    return { name: a?.name ?? id, sub: a ? `${a.contactName} · ${a.city}, ${a.country}` : "", place: a?.country ?? "", agent: a };
  };

  const rows = programme
    ? learners
        .filter((l) => l.programmeId === programme.id)
        .map((l) => ({ l, w: who(l.learnerId), p: programmeProgress(programme, l, enrolments, videos) }))
    : [];
  const q = search.trim().toLowerCase();
  const shown = rows
    .filter((r) => (!status || r.p.status === status) && (!place || r.w.place === place) && (!q || `${r.w.name} ${r.w.sub}`.toLowerCase().includes(q)))
    .sort((a, b) => ["Behind", "On track", "Not started", "Completed"].indexOf(a.p.status) - ["Behind", "On track", "Not started", "Completed"].indexOf(b.p.status) || b.l.startDate.localeCompare(a.l.startDate));
  const hasFilters = !!(search || status || place);
  const count = (s: LearnerProgrammeStatus) => rows.filter((r) => r.p.status === s).length;
  const viewing = rows.find((r) => r.l.learnerId === viewingId);

  const stepTitle = (st: ProgrammeStep) => (st.kind === "course" ? courses.find((c) => c.id === st.refId)?.title : videos.find((v) => v.id === st.refId)?.title) ?? "Removed item";
  const stepRate = (st: ProgrammeStep) => {
    const done = rows.filter((r) => r.p.steps.find((s) => s.step.id === st.id)?.done).length;
    return rows.length ? Math.round((done / rows.length) * 100) : 0;
  };

  /** Make sure each course step exists as an assignment for the learner, due on the programme's schedule. */
  const assignCourses = (p: Programme, learnerId: string, start: string, list: Enrolment[]) => {
    const add: Enrolment[] = [];
    for (const st of p.steps) {
      if (st.kind !== "course" || list.some((e) => e.staffId === learnerId && e.courseId === st.refId)) continue;
      add.push({ staffId: learnerId, courseId: st.refId, assignedAt: start, dueDate: addDays(start, st.dueDay), completedLessons: [], attempts: [], reminders: [] });
    }
    return add;
  };

  const recordStep = (learnerId: string, st: ProgrammeStep) => {
    if (st.kind === "course") {
      const c = courses.find((x) => x.id === st.refId);
      setEnrolments((prev) => {
        const exists = prev.some((e) => e.staffId === learnerId && e.courseId === st.refId);
        const done = (e: Enrolment): Enrolment => ({ ...e, completedLessons: c ? allLessons(c).map((l) => l.id) : e.completedLessons, completedAt: trainingToday, attempts: [...e.attempts, { date: trainingToday, score: 100 }] });
        return exists ? prev.map((e) => (e.staffId === learnerId && e.courseId === st.refId ? done(e) : e)) : [...prev, done({ staffId: learnerId, courseId: st.refId, assignedAt: trainingToday, dueDate: trainingToday, completedLessons: [], attempts: [], reminders: [] })];
      });
    } else {
      setVideos((prev) => prev.map((v) => (v.id === st.refId ? { ...v, results: { ...v.results, [learnerId]: { ...(v.results[learnerId] ?? { attempts: [] }), watchedAt: v.results[learnerId]?.watchedAt ?? trainingToday, passedAt: trainingToday, recordedBy: user.name } } } : v)));
    }
    notify(`${stepTitle(st)} recorded as complete`);
  };

  const remind = (ids: string[]) => {
    const set = new Set(ids);
    setLearners((prev) => prev.map((l) => (l.programmeId === programme?.id && set.has(l.learnerId) ? { ...l, reminders: [...l.reminders, trainingToday] } : l)));
    notify(ids.length === 1 ? "Reminder sent" : `${ids.length} reminders sent`);
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Training Periods</h2>
          <p className="mt-1 text-sm text-muted-foreground">Structured onboarding with a deadline for each step — separate programmes for new counsellors and for agent partners.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/bhe-training/videos" className={buttonSecondary}><Video className="size-4" /> Video sessions</Link>
          <button type="button" onClick={() => setEditing("new")} className={buttonSecondary}><Plus className="size-4" /> New training period</button>
          {programme && <button type="button" onClick={() => setEnrolling(true)} className={buttonPrimary}><UserPlus className="size-4" /> Enrol {audience === "Agent" ? "agents" : "counsellors"}</button>}
        </div>
      </header>

      <Tabs<ProgrammeAudience>
        label="Audience"
        value={audience}
        onChange={(a) => { setAudience(a); setProgrammeId(programmes.find((p) => p.audience === a)?.id ?? ""); setStatus(""); setPlace(""); }}
        options={[
          { value: "Counsellor", label: "Counsellors", count: learners.filter((l) => programmes.find((p) => p.id === l.programmeId)?.audience === "Counsellor").length },
          { value: "Agent", label: "Agent partners", count: learners.filter((l) => programmes.find((p) => p.id === l.programmeId)?.audience === "Agent").length },
        ]}
      />

      {!programme ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <GraduationCap className="size-7 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">No {audience.toLowerCase()} training period yet</p>
          <button type="button" onClick={() => setEditing("new")} className={buttonPrimary}><Plus className="size-4" /> Create one</button>
        </Card>
      ) : (
        <>
          {inAudience.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {inAudience.map((p) => (
                <button key={p.id} type="button" onClick={() => setProgrammeId(p.id)} className={cn("h-8 rounded-full border px-3 text-xs font-semibold", p.id === programme.id ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground")}>{p.name}</button>
              ))}
            </div>
          )}

          <Card className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{programme.audience} training period · {programme.durationDays} days</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{programme.name}</h3>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{programme.description}</p>
              </div>
              <button type="button" onClick={() => setEditing(programme)} className={cn(buttonSecondary, "shrink-0")}><PencilLine className="size-4" /> Edit steps</button>
            </div>
            <ol className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {programme.steps.map((st, i) => (
                <li key={st.id} className="flex items-start gap-3 rounded-2xl border border-border p-3">
                  <span className="flex size-9 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-muted leading-none">
                    <span className="text-[9px] font-semibold uppercase text-muted-foreground">Day</span>
                    <span className="text-sm font-bold text-foreground">{st.dueDay}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">{st.kind === "course" ? <BookOpen className="size-3" /> : <Video className="size-3" />}{i + 1}. {st.kind === "course" ? "Course + quiz" : "Video + questions"}</span>
                    <Link href={st.kind === "course" ? `/bhe-training/${st.refId}` : "/bhe-training/videos"} className="block truncate text-sm font-semibold text-foreground hover:text-primary">{stepTitle(st)}</Link>
                    <span className="mt-1.5 flex items-center gap-2"><Bar value={stepRate(st)} tone="bg-success" className="flex-1" /><span className="text-[11px] tabular-nums text-muted-foreground">{stepRate(st)}%</span></span>
                  </span>
                </li>
              ))}
              {programme.steps.length === 0 && <li className="text-sm text-muted-foreground">No steps yet — add courses and video sessions.</li>}
            </ol>
          </Card>

          <StatGrid>
            <StatCard icon={Users} label={audience === "Agent" ? "Agents in training" : "Counsellors in training"} value={rows.length - count("Completed")} note={`${rows.length} total`} />
            <StatCard icon={CheckCircle2} tone="success" label="Completed" value={count("Completed")} onClick={() => setStatus(status === "Completed" ? "" : "Completed")} />
            <StatCard icon={Clock3} tone="primary" label="On track" value={count("On track")} onClick={() => setStatus(status === "On track" ? "" : "On track")} />
            <StatCard icon={TrendingDown} tone={count("Behind") ? "danger" : "success"} label="Behind schedule" value={count("Behind")} onClick={() => setStatus(status === "Behind" ? "" : "Behind")} />
          </StatGrid>

          <FilterBar>
            <SearchField value={search} onChange={setSearch} placeholder={audience === "Agent" ? "Agency, contact, city…" : "Name, job title, branch…"} label="Search learners" />
            <SelectFilter label="Status" value={status} onChange={setStatus} allLabel="Any status" options={["Behind", "On track", "Not started", "Completed"]} />
            <SelectFilter label={audience === "Agent" ? "Country" : "Branch"} value={place} onChange={setPlace} allLabel={audience === "Agent" ? "All countries" : "All branches"} options={[...new Set(rows.map((r) => r.w.place))].sort()} />
            {hasFilters && <ResetFilters onClick={() => { setSearch(""); setStatus(""); setPlace(""); }} />}
            <button type="button" onClick={() => downloadCsv(`${programme.id.toLowerCase()}-progress.csv`, shown.map((r) => ({ learner: r.w.name, details: r.w.sub, started: r.l.startDate, day: r.p.day, stepsDone: `${r.p.doneCount}/${r.p.steps.length}`, status: r.p.status, nextStep: r.p.next?.title ?? "", nextDue: r.p.next?.due ?? "", finished: r.p.finishedAt ?? "" })))} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground">Export</button>
          </FilterBar>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{audience === "Agent" ? "Agent partners" : "Counsellors"}</h3>
                <p className="text-xs text-muted-foreground">{shown.length} learners · behind schedule first</p>
              </div>
              {count("Behind") > 0 && <button type="button" onClick={() => remind(rows.filter((r) => r.p.status === "Behind").map((r) => r.l.learnerId))} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover"><BellRing className="size-3.5" /> Remind everyone behind</button>}
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2.5 pl-5 pr-3">{audience === "Agent" ? "Agent" : "Counsellor"}</th>
                    <th className="px-3 py-2.5">Started</th>
                    <th className="px-3 py-2.5">Progress</th>
                    <th className="px-3 py-2.5">Next step</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shown.map((r) => (
                    <tr key={r.l.learnerId} className="transition-colors hover:bg-surface-hover/60">
                      <td className="py-3 pl-5 pr-3">
                        <button type="button" onClick={() => setViewingId(r.l.learnerId)} className="flex items-center gap-2.5 text-left">
                          <Avatar name={r.w.name} size="sm" />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5"><span className="block truncate text-sm font-semibold text-foreground hover:text-primary">{r.w.name}</span>{r.w.agent && r.w.agent.status !== "Active" && <AgentStatusBadge status={r.w.agent.status} />}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">{r.w.sub}</span>
                          </span>
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <p className="text-foreground">{formatDay(r.l.startDate)}</p>
                        <p className="text-[11px] text-muted-foreground">{r.p.status === "Completed" ? `finished ${formatDay(r.p.finishedAt!)}` : r.p.status === "Not started" ? "starts soon" : r.p.day > programme.durationDays ? `ended ${formatDay(addDays(r.l.startDate, programme.durationDays))}` : `day ${r.p.day} of ${programme.durationDays}`}</p>
                      </td>
                      <td className="w-44 px-3 py-3">
                        <p className="mb-1 flex justify-between text-[11px]"><span className="font-semibold tabular-nums text-foreground">{r.p.doneCount}/{r.p.steps.length} steps</span><span className="text-muted-foreground">{r.p.percent}%</span></p>
                        <Bar value={r.p.percent} tone={r.p.status === "Completed" ? "bg-success" : r.p.status === "Behind" ? "bg-danger" : "bg-primary"} />
                      </td>
                      <td className="max-w-[240px] px-3 py-3">
                        {r.p.next ? (
                          <>
                            <p className="truncate text-foreground">{r.p.next.title}</p>
                            <p className={cn("text-[11px]", stepTone[r.p.next.status])}>{r.p.next.status === "Overdue" ? "Overdue since" : "Due"} {formatDay(r.p.next.due)}</p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3"><span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", learnerStatus[r.p.status])}>{r.p.status}</span>{r.l.reminders.length > 0 && <p className="mt-0.5 text-[11px] text-muted-foreground">reminded {formatDay(r.l.reminders.at(-1)!)}</p>}</td>
                      <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right">
                        <div className="inline-flex gap-1.5">
                          {r.p.status !== "Completed" && <button type="button" onClick={() => remind([r.l.learnerId])} aria-label={`Remind ${r.w.name}`} title="Send reminder" className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground"><BellRing className="size-3.5" /></button>}
                          <button type="button" onClick={() => setViewingId(r.l.learnerId)} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover">Record</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {shown.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                  <SearchX className="size-5 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">{rows.length ? "No one matches" : "No one enrolled yet"}</p>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {viewing && programme && (
        <SlideOver open onClose={() => setViewingId(null)} icon={Flag} title={viewing.w.name} subtitle={`${programme.name} · started ${formatDay(viewing.l.startDate)}`}>
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Steps done", `${viewing.p.doneCount}/${viewing.p.steps.length}`],
                ["Day", viewing.p.status === "Completed" ? "Done" : viewing.p.day > programme.durationDays ? "Ended" : `${viewing.p.day}/${programme.durationDays}`],
                ["Status", viewing.p.status],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-surface-muted px-3 py-2.5">
                  <p className="text-base font-bold text-foreground">{v}</p>
                  <p className="text-[11px] text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
            {viewing.w.agent && <p className="rounded-xl bg-surface-muted px-3 py-2 text-xs text-muted-foreground">Agents complete training in the agent portal. If they attended a live session instead, record the step here.</p>}
            <ol className="relative flex flex-col gap-3 border-l border-border pl-5">
              {viewing.p.steps.map((s) => (
                <li key={s.step.id} className="relative">
                  <span className={cn("absolute -left-[27px] top-0.5 flex size-4 items-center justify-center rounded-full bg-surface", stepTone[s.status])}>
                    {s.done ? <CheckCircle2 className="size-4" /> : <CircleDashed className="size-4" />}
                  </span>
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <p className={cn("text-[11px]", stepTone[s.status])}>
                    {s.done ? `Completed ${s.doneAt ? formatDay(s.doneAt) : ""}` : `${s.status === "Overdue" ? "Overdue — was due" : "Due"} ${formatDay(s.due)} (day ${s.step.dueDay})`} · {s.step.kind === "course" ? "course + quiz" : "video + questions"}
                  </p>
                  {!s.done && (
                    <button type="button" onClick={() => recordStep(viewing.l.learnerId, s.step)} className="mt-1 text-[11px] font-semibold text-primary hover:underline">Record as complete</button>
                  )}
                </li>
              ))}
            </ol>
            {viewing.p.status !== "Completed" && <button type="button" onClick={() => remind([viewing.l.learnerId])} className={buttonSecondary}><BellRing className="size-4" /> Send a reminder</button>}
          </div>
        </SlideOver>
      )}

      {editing && (
        <ProgrammeDialog
          key={editing === "new" ? "new" : editing.id}
          programme={editing === "new" ? undefined : editing}
          defaultAudience={audience}
          videos={videos}
          onClose={() => setEditing(null)}
          onSave={(p) => {
            const isNew = !programmes.some((x) => x.id === p.id);
            setProgrammes((prev) => (isNew ? [...prev, p] : prev.map((x) => (x.id === p.id ? p : x))));
            // New course steps become assignments for people already in this training period.
            setEnrolments((prev) => [...prev, ...learners.filter((l) => l.programmeId === p.id).flatMap((l) => assignCourses(p, l.learnerId, l.startDate, prev))]);
            setAudience(p.audience);
            setProgrammeId(p.id);
            notify(isNew ? `${p.name} created` : `${p.name} saved`);
            setEditing(null);
          }}
        />
      )}

      {enrolling && programme && (
        <EnrolDialog
          programme={programme}
          candidates={
            programme.audience === "Agent"
              ? agents.filter((a) => a.status === "Active" || a.status === "Pending").map((a) => ({ id: a.id, name: a.name, sub: `${a.country} · ${a.status}` }))
              : staff.filter((s) => ["counsellor", "senior-counsellor"].includes(s.roleId) && s.status !== "Inactive").map((s) => ({ id: s.id, name: s.name, sub: `${s.jobTitle} · ${s.branch}${s.status === "Invited" ? " · invited" : ""}` }))
          }
          enrolled={new Set(learners.filter((l) => l.programmeId === programme.id).map((l) => l.learnerId))}
          onClose={() => setEnrolling(false)}
          onEnrol={(ids, start) => {
            setLearners((prev) => [...prev, ...ids.map((learnerId) => ({ programmeId: programme.id, learnerId, startDate: start, reminders: [] }))]);
            setEnrolments((prev) => [...prev, ...ids.flatMap((id) => assignCourses(programme, id, start, prev))]);
            notify(`${ids.length} enrolled in ${programme.name} from ${formatDay(start)}`);
            setEnrolling(false);
          }}
        />
      )}
      {toast}
    </div>
  );
}

function ProgrammeDialog({ programme, defaultAudience, videos, onClose, onSave }: { programme?: Programme; defaultAudience: ProgrammeAudience; videos: VideoSession[]; onClose: () => void; onSave: (p: Programme) => void }) {
  const courses = getCourses().filter((c) => c.published);
  const [p, setP] = useState<Programme>(() => programme ?? { id: "", name: "", audience: defaultAudience, description: "", durationDays: 30, steps: [] });
  const [tried, setTried] = useState(false);
  const set = <K extends keyof Programme>(k: K, v: Programme[K]) => setP((x) => ({ ...x, [k]: v }));
  const setStep = (i: number, patch: Partial<ProgrammeStep>) => set("steps", p.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i: number, d: -1 | 1) => { const next = [...p.steps]; [next[i], next[i + d]] = [next[i + d], next[i]]; set("steps", next); };
  const addStep = (kind: "course" | "video") => {
    const refId = kind === "course" ? courses[0]?.id : videos[0]?.id;
    if (!refId) return;
    set("steps", [...p.steps, { id: `s${Math.max(0, ...p.steps.map((x) => Number(x.id.replace(/\D/g, "")) || 0)) + 1}`, kind, refId, dueDay: Math.min(p.durationDays, (p.steps.at(-1)?.dueDay ?? 0) + 7) }]);
  };
  const errors: string[] = [];
  if (p.name.trim().length < 3) errors.push("Give the training period a name");
  if (!(p.durationDays > 0)) errors.push("Set how many days it lasts");
  if (!p.steps.length) errors.push("Add at least one step");
  if (p.steps.some((s) => s.dueDay < 1 || s.dueDay > p.durationDays)) errors.push(`Step days must be between 1 and ${p.durationDays}`);
  const withoutQuiz = p.steps.filter((s) => s.kind === "video" && !videos.find((v) => v.id === s.refId)?.quiz.length).length;

  return (
    <Modal
      open
      onClose={onClose}
      icon={GraduationCap}
      size="lg"
      title={programme ? `Edit ${programme.name}` : "New training period"}
      subtitle="Each step has a deadline counted from the learner's start date."
      footer={<div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-danger">{tried ? errors[0] : ""}</span><div className="flex gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" onClick={() => { setTried(true); if (!errors.length) onSave({ ...p, id: p.id || `PRG-${p.audience.toUpperCase()}-${p.name.trim().replace(/[^A-Za-z0-9]+/g, "-").toUpperCase().slice(0, 24)}`, name: p.name.trim(), description: p.description.trim(), steps: [...p.steps].sort((a, b) => a.dueDay - b.dueDay) }); }} className={buttonPrimary}>{programme ? "Save" : "Create"}</button></div></div>}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Name" required className="sm:col-span-2">
            <TextInput value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Senior counsellor refresher" />
          </Field>
          <Field label="For">
            <Select value={p.audience} onChange={(e) => set("audience", e.target.value as ProgrammeAudience)} disabled={!!programme}>
              <option value="Counsellor">Counsellors</option>
              <option value="Agent">Agent partners</option>
            </Select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={2} value={p.description} onChange={(e) => set("description", e.target.value)} placeholder="What people should be able to do by the end." />
          </Field>
          <Field label="Length (days)" required>
            <TextInput inputMode="numeric" value={p.durationDays || ""} onChange={(e) => set("durationDays", Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0)} />
          </Field>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">Steps</p>
          <ul className="flex flex-col gap-2">
            {p.steps.map((s, i) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-2.5">
                <span className="flex w-16 items-center gap-1 text-[11px] text-muted-foreground">{s.kind === "course" ? <BookOpen className="size-3.5" /> : <Video className="size-3.5" />}{s.kind === "course" ? "Course" : "Video"}</span>
                <div className="min-w-0 flex-1 basis-56">
                  <Select value={s.refId} onChange={(e) => setStep(i, { refId: e.target.value })} aria-label="Step item">
                    {(s.kind === "course" ? courses.map((c) => ({ id: c.id, label: c.title })) : videos.map((v) => ({ id: v.id, label: `${v.title}${v.quiz.length ? "" : " (no questions)"}` }))).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </Select>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">Day <TextInput inputMode="numeric" value={s.dueDay || ""} onChange={(e) => setStep(i, { dueDay: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} className="w-16" aria-label="Due day" /></label>
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover disabled:opacity-30"><ArrowUp className="size-4" /></button>
                <button type="button" disabled={i === p.steps.length - 1} onClick={() => move(i, 1)} aria-label="Move down" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover disabled:opacity-30"><ArrowDown className="size-4" /></button>
                <button type="button" onClick={() => set("steps", p.steps.filter((_, j) => j !== i))} aria-label="Remove step" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger-soft hover:text-danger"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => addStep("course")} className={buttonSecondary}><BookOpen className="size-4" /> Add course</button>
            <button type="button" onClick={() => addStep("video")} disabled={!videos.length} className={buttonSecondary} title={videos.length ? undefined : "Add video sessions first"}><Video className="size-4" /> Add video session</button>
          </div>
          {!videos.length && <p className="mt-2 text-[11px] text-muted-foreground">Add your recordings in <Link href="/bhe-training/videos" className="font-semibold text-primary hover:underline">Video Sessions</Link> to use them as steps.</p>}
          {withoutQuiz > 0 && <p className="mt-2 flex items-center gap-1.5 text-[11px] text-warning"><X className="size-3" /> {withoutQuiz} video step{withoutQuiz === 1 ? " has" : "s have"} no questions yet — watching alone will count until you add them.</p>}
        </div>
      </div>
    </Modal>
  );
}

function EnrolDialog({ programme, candidates, enrolled, onClose, onEnrol }: { programme: Programme; candidates: { id: string; name: string; sub: string }[]; enrolled: Set<string>; onClose: () => void; onEnrol: (ids: string[], start: string) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [start, setStart] = useState(trainingToday);
  const [q, setQ] = useState("");
  const list = candidates.filter((c) => !q || `${c.name} ${c.sub}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal open onClose={onClose} icon={UserPlus} title={`Enrol in ${programme.name}`} subtitle={`${programme.durationDays} days · ${programme.steps.length} steps. Course steps are assigned with their deadlines.`}
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" disabled={!picked.length || !start} onClick={() => onEnrol(picked, start)} className={buttonPrimary}>Enrol {picked.length || ""}</button></div>}
    >
      <div className="flex flex-col gap-4">
        <Field label="Start date" hint={`Ends ${formatDay(addDays(start || trainingToday, programme.durationDays))}.`}>
          <TextInput type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label="Search people" />
        <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-border p-3">
          {list.map((c) => (
            <Checkbox key={c.id} checked={picked.includes(c.id) || enrolled.has(c.id)} onChange={(v) => !enrolled.has(c.id) && setPicked(v ? [...picked, c.id] : picked.filter((x) => x !== c.id))} label={<span className={cn(enrolled.has(c.id) && "text-muted-foreground")}>{c.name} <span className="text-xs text-muted-foreground">· {enrolled.has(c.id) ? "already enrolled" : c.sub}</span></span>} />
          ))}
          {list.length === 0 && <p className="text-xs text-muted-foreground">No one matches.</p>}
        </div>
      </div>
    </Modal>
  );
}
