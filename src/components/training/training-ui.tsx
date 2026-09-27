"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleDashed, Clock3, GraduationCap, Hourglass, ListChecks, Plus, RotateCcw, Trash2, UserPlus, X, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Checkbox, Field, PillGroup, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { getRoles, getStaff, staffBranches } from "@/lib/mock/staff";
import {
  addDays,
  allLessons,
  courseCategories,
  courseMinutes,
  trainingToday,
  type Course,
  type CourseCategory,
  type CourseLevel,
  type LearnerStatus,
  type Lesson,
  type Module,
  type Question,
} from "@/lib/mock/training";
import { cn } from "@/lib/utils";

const statusStyle: Record<LearnerStatus, { cls: string; icon: typeof CheckCircle2 }> = {
  "Not started": { cls: "bg-surface-hover text-muted-foreground", icon: CircleDashed },
  "In progress": { cls: "bg-primary-soft text-primary", icon: Hourglass },
  Overdue: { cls: "bg-danger-soft text-danger", icon: AlertTriangle },
  Completed: { cls: "bg-success-soft text-success", icon: CheckCircle2 },
  Expiring: { cls: "bg-warning-soft text-warning", icon: RotateCcw },
  Expired: { cls: "bg-danger-soft text-danger", icon: XCircle },
};
export const learnerStatuses: LearnerStatus[] = ["Overdue", "Expired", "Expiring", "In progress", "Not started", "Completed"];

export function LearnerStatusBadge({ status }: { status: LearnerStatus }) {
  const { cls, icon: Icon } = statusStyle[status];
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", cls)}>
      <Icon className="size-3" />
      {status}
    </span>
  );
}

const levelStyle: Record<CourseLevel, string> = {
  Mandatory: "bg-danger-soft text-danger",
  Recommended: "bg-primary-soft text-primary",
  Optional: "bg-surface-hover text-muted-foreground",
};
export function LevelBadge({ level }: { level: CourseLevel }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", levelStyle[level])}>{level}</span>;
}

export function Bar({ value, tone = "bg-primary", className }: { value: number; tone?: string; className?: string }) {
  return (
    <span className={cn("block h-1.5 overflow-hidden rounded-full bg-surface-hover", className)}>
      <span className={cn("block h-full rounded-full", tone)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </span>
  );
}

export function durationText(min: number) {
  return min >= 60 ? `${Math.floor(min / 60)}h ${min % 60 ? `${min % 60}m` : ""}`.trim() : `${min} min`;
}

export function CourseCard({ course: c, progress, status, due, learners, completion }: { course: Course; progress?: number; status?: LearnerStatus; due?: string; learners: number; completion: number }) {
  const lessons = allLessons(c).length;
  return (
    <Link href={`/bhe-training/${c.id}`} className="card-shadow group flex flex-col overflow-hidden rounded-3xl border border-border bg-surface transition-colors hover:border-border-strong">
      <div className={cn("relative flex h-24 items-end p-4", c.color)}>
        <GraduationCap className="absolute right-4 top-4 size-10 text-white/25" />
        <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-800">{c.category}</span>
        {!c.published && <span className="ml-1.5 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-semibold text-white">Draft</span>}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <LevelBadge level={c.level} />
            {status && <LearnerStatusBadge status={status} />}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">{c.title}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.summary}</p>
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><ListChecks className="size-3" />{lessons} lessons</span>
          <span className="inline-flex items-center gap-1"><Clock3 className="size-3" />{durationText(courseMinutes(c))}</span>
          <span>{learners} assigned · {completion}% complete</span>
        </p>
        {progress !== undefined && (
          <div className="mt-auto">
            <p className="mb-1 flex justify-between text-[11px]">
              <span className="font-semibold text-foreground">{progress}%</span>
              {due && status !== "Completed" && status !== "Expiring" && <span className={cn(status === "Overdue" ? "font-semibold text-danger" : "text-muted-foreground")}>{status === "Overdue" ? "Overdue" : "Due"} {due}</span>}
            </p>
            <Bar value={progress} tone={status === "Overdue" ? "bg-danger" : progress === 100 ? "bg-success" : "bg-primary"} />
          </div>
        )}
      </div>
    </Link>
  );
}

// --- Course editor -------------------------------------------------------------------

const colors = ["bg-rose-500", "bg-violet-500", "bg-sky-500", "bg-amber-500", "bg-primary", "bg-teal-500", "bg-emerald-500", "bg-pink-500"];
const uid = () => Math.random().toString(36).slice(2, 8);

export function CourseDialog({ course, onClose, onSave }: { course?: Course; onClose: () => void; onSave: (c: Omit<Course, "id" | "updatedAt">) => void }) {
  const [f, setF] = useState<Omit<Course, "id" | "updatedAt">>(
    () =>
      course ?? {
        title: "",
        summary: "",
        category: "Admissions",
        level: "Recommended",
        audience: ["counsellor"],
        instructor: "",
        modules: [{ id: uid(), title: "Module 1", lessons: [{ id: uid(), title: "", minutes: 10, body: [""], keyPoints: [] }] }],
        quiz: [{ id: uid(), q: "", options: ["", "", "", ""], answer: 0, explain: "" }],
        passMark: 80,
        dueDays: 30,
        refresherMonths: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        published: true,
      }
  );
  const [tab, setTab] = useState<"details" | "lessons" | "quiz">("details");
  const [tried, setTried] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const setModule = (mi: number, patch: Partial<Module>) => set("modules", f.modules.map((m, i) => (i === mi ? { ...m, ...patch } : m)));
  const setLesson = (mi: number, li: number, patch: Partial<Lesson>) => setModule(mi, { lessons: f.modules[mi].lessons.map((l, i) => (i === li ? { ...l, ...patch } : l)) });
  const roles = getRoles();

  const errors: string[] = [];
  if (f.title.trim().length < 5) errors.push("Give the course a title");
  if (!f.audience.length) errors.push("Choose who it's for");
  if (!f.modules.some((m) => m.lessons.some((l) => l.title.trim()))) errors.push("Add at least one lesson with a title");
  if (f.modules.some((m) => m.lessons.some((l) => l.title.trim() && !l.body.join("").trim() && !l.videoUrl))) errors.push("Every lesson needs a video or some notes");
  const qs = f.quiz.filter((q) => q.q.trim());
  if (qs.length < MIN_QUESTIONS) errors.push(`Add at least ${MIN_QUESTIONS} quiz questions`);
  if (qs.some((q) => q.options.filter((o) => o.trim()).length < 2 || !q.options[q.answer]?.trim())) errors.push("Each question needs at least two options and a correct answer");

  const save = () => {
    setTried(true);
    if (errors.length) return;
    onSave({
      ...f,
      title: f.title.trim(),
      summary: f.summary.trim(),
      modules: f.modules
        .map((m) => ({ ...m, title: m.title.trim() || "Module", lessons: m.lessons.filter((l) => l.title.trim()).map((l) => ({ ...l, body: l.body.join("\n").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) })) }))
        .filter((m) => m.lessons.length),
      quiz: cleanQuiz(f.quiz),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      icon={GraduationCap}
      size="lg"
      title={course ? `Edit ${course.title}` : "Add course"}
      subtitle={`${f.modules.reduce((n, m) => n + m.lessons.length, 0)} lessons · ${f.quiz.length} quiz questions`}
      footer={
        <div className="flex items-center justify-between gap-2">
          {tried && errors.length ? <span className="text-xs font-medium text-danger">{errors[0]}</span> : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
            <button type="button" onClick={save} className={buttonPrimary}>{course ? "Save course" : "Add course"}</button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <PillGroup<"details" | "lessons" | "quiz"> options={[{ value: "details", label: "Details" }, { value: "lessons", label: "Lessons" }, { value: "quiz", label: "Quiz" }]} value={tab} onChange={setTab} />

        {tab === "details" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Title" required className="sm:col-span-2">
              <TextInput value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Student Finance England for home students" />
            </Field>
            <Field label="Summary" className="sm:col-span-2">
              <Textarea rows={2} value={f.summary} onChange={(e) => set("summary", e.target.value)} placeholder="What people will be able to do afterwards." />
            </Field>
            <Field label="Category">
              <Select value={f.category} onChange={(e) => set("category", e.target.value as CourseCategory)}>
                {courseCategories.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Instructor">
              <TextInput value={f.instructor} onChange={(e) => set("instructor", e.target.value)} placeholder="e.g. Emma Watson · CAS & Visa Officer" />
            </Field>
            <Field label="Requirement" className="sm:col-span-2">
              <PillGroup<CourseLevel> options={[{ value: "Mandatory", label: "Mandatory" }, { value: "Recommended", label: "Recommended" }, { value: "Optional", label: "Optional" }]} value={f.level} onChange={(v) => set("level", v)} />
            </Field>
            <Field label="Assigned automatically to" className="sm:col-span-2" hint="Everyone with these roles gets the course, including new starters.">
              <div className="flex flex-wrap gap-1.5">
                {[{ id: "all", name: "Everyone" }, ...roles].map((r) => {
                  const on = f.audience.includes(r.id);
                  return (
                    <button key={r.id} type="button" aria-pressed={on} onClick={() => set("audience", r.id === "all" ? (on ? [] : ["all"]) : on ? f.audience.filter((x) => x !== r.id) : [...f.audience.filter((x) => x !== "all"), r.id])} className={cn("h-8 rounded-full border px-3 text-xs font-medium transition-colors", on ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Days to complete">
              <TextInput inputMode="numeric" value={f.dueDays} onChange={(e) => set("dueDays", Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0)} />
            </Field>
            <Field label="Quiz pass mark (%)">
              <TextInput inputMode="numeric" value={f.passMark} onChange={(e) => set("passMark", Math.min(100, Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0))} />
            </Field>
            <Field label="Certificate valid for" hint="Months before a refresher is needed. 0 = never expires.">
              <TextInput inputMode="numeric" value={f.refresherMonths} onChange={(e) => set("refresherMonths", Number(e.target.value.replace(/\D/g, "").slice(0, 2)) || 0)} />
            </Field>
            <Field label="Colour">
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => <button key={c} type="button" aria-label={c.replace("bg-", "")} aria-pressed={f.color === c} onClick={() => set("color", c)} className={cn("size-7 rounded-full ring-offset-2 ring-offset-surface", c, f.color === c && "ring-2 ring-foreground")} />)}
              </div>
            </Field>
            <div className="sm:col-span-2">
              <Checkbox checked={f.published} onChange={(v) => set("published", v)} label={<span><span className="font-semibold">Published</span><span className="block text-xs text-muted-foreground">Drafts are only visible to admins and aren&apos;t assigned yet.</span></span>} />
            </div>
          </div>
        )}

        {tab === "lessons" && (
          <div className="flex flex-col gap-4">
            {f.modules.map((m, mi) => (
              <div key={m.id} className="rounded-2xl border border-border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <TextInput value={m.title} onChange={(e) => setModule(mi, { title: e.target.value })} className="font-semibold" aria-label="Module title" />
                  {f.modules.length > 1 && <button type="button" onClick={() => set("modules", f.modules.filter((_, i) => i !== mi))} aria-label="Remove module" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger-soft hover:text-danger"><Trash2 className="size-4" /></button>}
                </div>
                <div className="flex flex-col gap-3">
                  {m.lessons.map((l, li) => (
                    <div key={l.id} className="rounded-xl bg-surface-muted p-3">
                      <div className="flex gap-2">
                        <TextInput value={l.title} onChange={(e) => setLesson(mi, li, { title: e.target.value })} placeholder={`Lesson ${li + 1} title`} aria-label="Lesson title" />
                        <TextInput inputMode="numeric" value={l.minutes} onChange={(e) => setLesson(mi, li, { minutes: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} className="w-20" aria-label="Minutes" />
                        <button type="button" onClick={() => setModule(mi, { lessons: m.lessons.filter((_, i) => i !== li) })} aria-label="Remove lesson" className="flex size-[42px] shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-danger-soft hover:text-danger"><X className="size-4" /></button>
                      </div>
                      <TextInput value={l.videoUrl ?? ""} onChange={(e) => setLesson(mi, li, { videoUrl: e.target.value.trim() || undefined })} placeholder="Video link (optional) — YouTube, Vimeo, Loom or Google Drive" className="mt-2" aria-label="Lesson video link" />
                      <Textarea rows={4} value={l.body.join("\n\n")} onChange={(e) => setLesson(mi, li, { body: [e.target.value] })} placeholder="Lesson content. Leave a blank line between paragraphs." className="mt-2 resize-y" aria-label="Lesson content" />
                      <TextInput value={l.keyPoints.join("; ")} onChange={(e) => setLesson(mi, li, { keyPoints: e.target.value.split(";").map((k) => k.trim()).filter(Boolean) })} placeholder="Key points, separated by semicolons" className="mt-2" aria-label="Key points" />
                    </div>
                  ))}
                  <button type="button" onClick={() => setModule(mi, { lessons: [...m.lessons, { id: uid(), title: "", minutes: 10, body: [""], keyPoints: [] }] })} className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><Plus className="size-3.5" /> Add lesson</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => set("modules", [...f.modules, { id: uid(), title: `Module ${f.modules.length + 1}`, lessons: [{ id: uid(), title: "", minutes: 10, body: [""], keyPoints: [] }] }])} className={cn(buttonSecondary, "w-fit")}><Plus className="size-4" /> Add module</button>
          </div>
        )}

        {tab === "quiz" && <QuizBuilder quiz={f.quiz} onChange={(quiz) => set("quiz", quiz)} />}
      </div>
    </Modal>
  );
}

/** Edit a list of multiple-choice questions (used by courses and video sessions). */
export function QuizBuilder({ quiz, onChange }: { quiz: Question[]; onChange: (q: Question[]) => void }) {
  const setQuestion = (qi: number, patch: Partial<Question>) => onChange(quiz.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  return (
    <div className="flex flex-col gap-3">
      {quiz.map((q, qi) => (
        <div key={q.id} className="rounded-2xl border border-border p-4">
          <div className="flex gap-2">
            <TextInput value={q.q} onChange={(e) => setQuestion(qi, { q: e.target.value })} placeholder={`Question ${qi + 1}`} aria-label={`Question ${qi + 1}`} />
            {quiz.length > 1 && <button type="button" onClick={() => onChange(quiz.filter((_, i) => i !== qi))} aria-label="Remove question" className="flex size-[42px] shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-danger-soft hover:text-danger"><Trash2 className="size-4" /></button>}
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {q.options.map((o, oi) => (
              <label key={oi} className={cn("flex items-center gap-2 rounded-xl border px-2.5", q.answer === oi ? "border-success/50 bg-success-soft" : "border-border")}>
                <input type="radio" name={`ans-${q.id}`} checked={q.answer === oi} onChange={() => setQuestion(qi, { answer: oi })} className="accent-success" aria-label={`Mark option ${oi + 1} correct`} />
                <input value={o} onChange={(e) => setQuestion(qi, { options: q.options.map((x, i) => (i === oi ? e.target.value : x)) })} placeholder={`Option ${oi + 1}`} className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
              </label>
            ))}
          </div>
          <TextInput value={q.explain} onChange={(e) => setQuestion(qi, { explain: e.target.value })} placeholder="Why this is the answer (shown after the quiz)" className="mt-2" />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...quiz, { id: uid(), q: "", options: ["", "", "", ""], answer: 0, explain: "" }])} className={cn(buttonSecondary, "w-fit")}><Plus className="size-4" /> Add question</button>
      <p className="text-[11px] text-muted-foreground">Select the circle next to the correct answer. Empty options are ignored.</p>
    </div>
  );
}

export const MIN_QUESTIONS = 5;

/** Problems with a quiz, or [] if it's usable. */
export function quizProblems(quiz: Question[]) {
  const qs = quiz.filter((q) => q.q.trim());
  if (qs.length < MIN_QUESTIONS) return [`Add at least ${MIN_QUESTIONS} questions (${qs.length} so far)`];
  if (qs.some((q) => q.options.filter((o) => o.trim()).length < 2 || !q.options[q.answer]?.trim())) return ["Each question needs at least two options and a correct answer"];
  return [];
}
export const cleanQuiz = (quiz: Question[]) =>
  quiz.filter((q) => q.q.trim()).map((q) => {
    const kept = q.options.map((o, i) => ({ o: o.trim(), i })).filter((x) => x.o);
    return { ...q, options: kept.map((x) => x.o), answer: Math.max(0, kept.findIndex((x) => x.i === q.answer)) };
  });

// --- Assign -----------------------------------------------------------------------

export function AssignDialog({ course, assigned, onClose, onAssign }: { course: Course; assigned: Set<string>; onClose: () => void; onAssign: (staffIds: string[], dueDate: string) => void }) {
  const staff = getStaff().filter((s) => s.status === "Active" || s.status === "On leave");
  const [by, setBy] = useState<"role" | "branch" | "people">("role");
  const [role, setRole] = useState(getRoles()[3]?.id ?? "counsellor");
  const [branch, setBranch] = useState<string>(staffBranches[0]);
  const [people, setPeople] = useState<string[]>([]);
  const [due, setDue] = useState(addDays(trainingToday, course.dueDays || 30));
  const picked = (by === "role" ? staff.filter((s) => s.roleId === role) : by === "branch" ? staff.filter((s) => s.branch === branch) : staff.filter((s) => people.includes(s.id))).filter((s) => !assigned.has(s.id));
  return (
    <Modal
      open
      onClose={onClose}
      icon={UserPlus}
      title={`Assign ${course.title}`}
      subtitle="People already assigned are skipped."
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" disabled={!picked.length || due < trainingToday} onClick={() => onAssign(picked.map((s) => s.id), due)} className={buttonPrimary}>Assign {picked.length || ""}</button></div>}
    >
      <div className="flex flex-col gap-4">
        <PillGroup<"role" | "branch" | "people"> options={[{ value: "role", label: "By role" }, { value: "branch", label: "By branch" }, { value: "people", label: "Pick people" }]} value={by} onChange={setBy} />
        {by === "role" && (
          <Field label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value)}>{getRoles().map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select>
          </Field>
        )}
        {by === "branch" && (
          <Field label="Branch">
            <Select value={branch} onChange={(e) => setBranch(e.target.value)}>{staffBranches.map((b) => <option key={b}>{b}</option>)}</Select>
          </Field>
        )}
        {by === "people" && (
          <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-border p-3 sm:grid-cols-2">
            {staff.map((s) => (
              <Checkbox key={s.id} checked={people.includes(s.id) || assigned.has(s.id)} onChange={(v) => !assigned.has(s.id) && setPeople(v ? [...people, s.id] : people.filter((x) => x !== s.id))} label={<span className={cn(assigned.has(s.id) && "text-muted-foreground")}>{s.name} <span className="text-xs text-muted-foreground">· {assigned.has(s.id) ? "assigned" : s.branch}</span></span>} />
            ))}
          </div>
        )}
        <Field label="Due date">
          <TextInput type="date" min={trainingToday} value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <p className="text-xs text-muted-foreground">{picked.length ? `${picked.length} ${picked.length === 1 ? "person" : "people"} will get this course and a notification.` : "No one new to assign with this selection."}</p>
      </div>
    </Modal>
  );
}
