"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Award, CheckCircle2, ChevronLeft, CircleDashed, Clock3, Lightbulb, Lock, PencilLine, Printer, RotateCcw, SearchX, UserPlus, Users, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { formatDay } from "@/components/people/people-ui";
import { AssignDialog, Bar, CourseDialog, LearnerStatusBadge, LevelBadge, durationText } from "@/components/training/training-ui";
import { VideoPlayer } from "@/components/training/video";
import { getStaff } from "@/lib/mock/staff";
import {
  addDays,
  allLessons,
  bestScore,
  courseMinutes,
  expiresAt,
  getCourses,
  getEnrolments,
  progressOf,
  saveCourses,
  saveEnrolments,
  statusOf,
  trainingToday,
  type Course,
  type Enrolment,
} from "@/lib/mock/training";
import { cn } from "@/lib/utils";

const QUIZ = "quiz";

export default function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const me = getStaff().find((s) => s.name === user.name);
  const [courses, setCourses] = useState<Course[]>(getCourses);
  const [enrolments, setEnrolments] = useState<Enrolment[]>(getEnrolments);
  const course = courses.find((c) => c.id === id);
  const lessons = useMemo(() => (course ? allLessons(course) : []), [course]);
  const mine = enrolments.find((e) => e.courseId === id && e.staffId === me?.id);
  const firstOpen = lessons.find((l) => !mine?.completedLessons.includes(l.id))?.id ?? (lessons.length ? QUIZ : "");
  const [current, setCurrent] = useState<string>(firstOpen);
  const [editing, setEditing] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [certificate, setCertificate] = useState(false);
  const [toast, notify] = useToast();

  useEffect(() => saveCourses(courses), [courses]);
  useEffect(() => saveEnrolments(enrolments), [enrolments]);

  if (!course) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-hover text-muted-foreground"><SearchX className="size-6" /></span>
        <h2 className="text-lg font-semibold text-foreground">Course not found</h2>
        <Link href="/bhe-training" className={buttonSecondary}>Back to Training Hub</Link>
      </div>
    );
  }

  const learners = enrolments.filter((e) => e.courseId === course.id);
  const done = learners.filter((e) => ["Completed", "Expiring"].includes(statusOf(e, course))).length;
  const allDone = !!mine && lessons.every((l) => mine.completedLessons.includes(l.id));
  const lessonIndex = lessons.findIndex((l) => l.id === current);
  const lesson = lessons[lessonIndex];
  const status = mine ? statusOf(mine, course) : undefined;
  const refresher = status === "Expired" || status === "Expiring";

  const patchMine = (fn: (e: Enrolment) => Enrolment) => setEnrolments((prev) => prev.map((e) => (e.courseId === course.id && e.staffId === me?.id ? fn(e) : e)));

  const enrolSelf = () => {
    if (!me) return;
    setEnrolments((prev) => [...prev, { staffId: me.id, courseId: course.id, assignedAt: trainingToday, dueDate: addDays(trainingToday, course.dueDays), completedLessons: [], attempts: [], reminders: [] }]);
    notify("Course added to your learning");
  };

  const completeLesson = () => {
    if (!mine || !lesson) return;
    if (!mine.completedLessons.includes(lesson.id)) patchMine((e) => ({ ...e, completedLessons: [...e.completedLessons, lesson.id] }));
    const next = lessons[lessonIndex + 1];
    setCurrent(next ? next.id : QUIZ);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restart = () => {
    patchMine((e) => ({ ...e, completedLessons: [], completedAt: undefined, dueDate: addDays(trainingToday, 30) }));
    setCurrent(lessons[0]?.id ?? QUIZ);
    notify("Refresher started — work through the lessons again");
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3">
        <Link href="/bhe-training" className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Training Hub</Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <LevelBadge level={course.level} />
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">{course.category}</span>
              {status && <LearnerStatusBadge status={status} />}
              {!course.published && <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Draft</span>}
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{course.title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{course.summary}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{course.instructor}</span>
              <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> {durationText(courseMinutes(course))} · {lessons.length} lessons · quiz pass mark {course.passMark}%</span>
              <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {learners.length} assigned · {done} complete</span>
              <span>Updated {formatDay(course.updatedAt)}</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href={`/bhe-training/progression?course=${course.id}`} className={buttonSecondary}><Users className="size-4" /> Progress</Link>
            <button type="button" onClick={() => setAssigning(true)} className={buttonSecondary}><UserPlus className="size-4" /> Assign</button>
            <button type="button" onClick={() => setEditing(true)} className={buttonSecondary}><PencilLine className="size-4" /> Edit</button>
          </div>
        </div>
      </header>

      {!mine ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-foreground">This course isn&apos;t assigned to you</p>
          <p className="max-w-md text-xs text-muted-foreground">You can still take it — it&apos;ll appear in your learning with a {course.dueDays}-day due date.</p>
          <button type="button" onClick={enrolSelf} className={buttonPrimary}>Start course</button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-3 lg:sticky lg:top-0">
            <Card className="p-4">
              <p className="mb-1 flex justify-between text-xs"><span className="font-semibold text-foreground">Your progress</span><span className="tabular-nums text-muted-foreground">{progressOf(mine, course)}%</span></p>
              <Bar value={progressOf(mine, course)} tone={mine.completedAt ? "bg-success" : "bg-primary"} />
              <p className="mt-2 text-[11px] text-muted-foreground">
                {mine.completedAt ? `Completed ${formatDay(mine.completedAt)}${expiresAt(mine, course) ? ` · valid until ${formatDay(expiresAt(mine, course)!)}` : ""}` : `Due ${formatDay(mine.dueDate)}`}
              </p>
            </Card>
            <Card className="p-2">
              <nav aria-label="Lessons">
                {course.modules.map((m, mi) => (
                  <div key={m.id} className="mb-1">
                    <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{mi + 1}. {m.title}</p>
                    {m.lessons.map((l) => {
                      const ok = mine.completedLessons.includes(l.id);
                      return (
                        <button key={l.id} type="button" onClick={() => setCurrent(l.id)} aria-current={current === l.id ? "step" : undefined} className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-colors", current === l.id ? "bg-primary-soft font-semibold text-primary" : "text-foreground hover:bg-surface-hover")}>
                          {ok ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <CircleDashed className="size-4 shrink-0 text-muted-foreground" />}
                          <span className="min-w-0 flex-1 truncate">{l.title}</span>
                          <span className="text-[11px] font-normal text-muted-foreground">{l.minutes}m</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
                <button type="button" onClick={() => setCurrent(QUIZ)} className={cn("mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-colors", current === QUIZ ? "bg-primary-soft font-semibold text-primary" : "text-foreground hover:bg-surface-hover")}>
                  {mine.completedAt ? <Award className="size-4 shrink-0 text-amber-500" /> : allDone ? <CircleDashed className="size-4 shrink-0 text-primary" /> : <Lock className="size-4 shrink-0 text-muted-foreground" />}
                  <span className="flex-1">Final quiz</span>
                  <span className="text-[11px] font-normal text-muted-foreground">{course.quiz.length} Qs</span>
                </button>
              </nav>
            </Card>
          </aside>

          <div className="min-w-0">
            {refresher && (
              <p className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-warning-soft px-4 py-3 text-sm text-foreground">
                <RotateCcw className="size-4 text-warning" /> Your certificate {status === "Expired" ? "has expired" : "expires soon"} — retake the course to renew it.
                <button type="button" onClick={restart} className="ml-auto text-xs font-semibold text-primary hover:underline">Start refresher</button>
              </p>
            )}
            {current === QUIZ ? (
              <Quiz key={`${course.id}-${allDone}`} course={course} enrolment={mine} unlocked={allDone} onCertificate={() => setCertificate(true)} onSubmit={(score) => {
                const passed = score >= course.passMark;
                patchMine((e) => ({ ...e, attempts: [...e.attempts, { date: trainingToday, score }], completedAt: passed ? trainingToday : e.completedAt }));
                notify(passed ? `Passed with ${score}% — certificate earned` : `${score}% — you need ${course.passMark}% to pass. Review and try again.`, passed ? "success" : "error");
              }} />
            ) : lesson ? (
              <Card className="p-6 sm:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Lesson {lessonIndex + 1} of {lessons.length} · {lesson.minutes} min</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{lesson.title}</h3>
                {lesson.videoUrl && <VideoPlayer key={lesson.id} url={lesson.videoUrl} title={lesson.title} className="mt-4 max-w-3xl" onEnded={() => !mine.completedLessons.includes(lesson.id) && notify("Video finished — mark the lesson complete when you're ready")} />}
                <div className="mt-4 flex max-w-3xl flex-col gap-4 text-[15px] leading-relaxed text-foreground">
                  {lesson.body.map((p, i) => <p key={i}>{p}</p>)}
                </div>
                {lesson.keyPoints.length > 0 && (
                  <div className="mt-6 max-w-3xl rounded-2xl bg-primary-soft/60 p-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary"><Lightbulb className="size-3.5" /> Key points</p>
                    <ul className="flex flex-col gap-1.5 text-sm text-foreground">
                      {lesson.keyPoints.map((k) => <li key={k} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />{k}</li>)}
                    </ul>
                  </div>
                )}
                <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                  <button type="button" disabled={lessonIndex === 0} onClick={() => setCurrent(lessons[lessonIndex - 1].id)} className={buttonSecondary}><ChevronLeft className="size-4" /> Previous</button>
                  <button type="button" onClick={completeLesson} className={buttonPrimary}>
                    {mine.completedLessons.includes(lesson.id) ? "Next" : "Mark complete"}{lessonIndex === lessons.length - 1 ? " · go to quiz" : ""} <ArrowRight className="size-4" />
                  </button>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      )}

      {editing && (
        <CourseDialog
          course={course}
          onClose={() => setEditing(false)}
          onSave={(c) => {
            setCourses((prev) => prev.map((x) => (x.id === course.id ? { ...x, ...c, updatedAt: trainingToday } : x)));
            notify("Course saved");
            setEditing(false);
          }}
        />
      )}
      {assigning && (
        <AssignDialog
          course={course}
          assigned={new Set(learners.map((e) => e.staffId))}
          onClose={() => setAssigning(false)}
          onAssign={(ids, due) => {
            setEnrolments((prev) => [...prev, ...ids.map((staffId) => ({ staffId, courseId: course.id, assignedAt: trainingToday, dueDate: due, completedLessons: [], attempts: [], reminders: [] }))]);
            notify(`Assigned to ${ids.length} ${ids.length === 1 ? "person" : "people"}, due ${formatDay(due)}`);
            setAssigning(false);
          }}
        />
      )}
      {certificate && mine?.completedAt && <Certificate course={course} enrolment={mine} name={user.name} onClose={() => setCertificate(false)} />}
      {toast}
    </div>
  );
}

function Quiz({ course, enrolment, unlocked, onSubmit, onCertificate }: { course: Course; enrolment: Enrolment; unlocked: boolean; onSubmit: (score: number) => void; onCertificate: () => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<number | null>(null);
  const best = bestScore(enrolment);
  const passed = !!enrolment.completedAt;

  if (!unlocked && !passed) {
    return (
      <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center">
        <Lock className="size-6 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Finish every lesson to unlock the quiz</p>
        <p className="text-xs text-muted-foreground">{course.quiz.length} questions · pass mark {course.passMark}%</p>
      </Card>
    );
  }

  const answeredAll = course.quiz.every((q) => answers[q.id] !== undefined);
  const submit = () => {
    const score = Math.round((course.quiz.filter((q) => answers[q.id] === q.answer).length / course.quiz.length) * 100);
    setSubmitted(score);
    onSubmit(score);
  };

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Final quiz · pass mark {course.passMark}%</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Check what you&apos;ve learned</h3>
          <p className="mt-1 text-xs text-muted-foreground">{enrolment.attempts.length ? `${enrolment.attempts.length} attempt${enrolment.attempts.length === 1 ? "" : "s"} · best ${best}%` : "Unlimited attempts."}</p>
        </div>
        {passed && <button type="button" onClick={onCertificate} className={buttonPrimary}><Award className="size-4" /> View certificate</button>}
      </div>

      {submitted !== null && (
        <p className={cn("mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium", submitted >= course.passMark ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
          {submitted >= course.passMark ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {submitted >= course.passMark ? `You scored ${submitted}% — passed.` : `You scored ${submitted}%. Revisit the lessons and try again.`}
        </p>
      )}

      <ol className="mt-6 flex flex-col gap-5">
        {course.quiz.map((q, i) => {
          const chosen = answers[q.id];
          return (
            <li key={q.id} className="rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold text-foreground">{i + 1}. {q.q}</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label={q.q}>
                {q.options.map((o, oi) => {
                  const isChosen = chosen === oi;
                  const reveal = submitted !== null;
                  return (
                    <button
                      key={oi}
                      type="button"
                      role="radio"
                      aria-checked={isChosen}
                      disabled={reveal}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                        isChosen ? "border-primary bg-primary-soft text-foreground" : "border-border text-foreground", !reveal && !isChosen && "hover:bg-surface-hover"
                      )}
                    >
                      <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-full border", isChosen ? "border-primary" : "border-border-strong")}>{isChosen && <span className="size-2 rounded-full bg-primary" />}</span>
                      {o}
                    </button>
                  );
                })}
              </div>
              {submitted !== null && <p className={cn("mt-2 flex items-center gap-1 text-xs font-medium", chosen === q.answer ? "text-success" : "text-danger")}>{chosen === q.answer ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}{chosen === q.answer ? "Correct" : "Incorrect"}</p>}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        {submitted !== null ? (
          <button type="button" onClick={() => { setAnswers({}); setSubmitted(null); }} className={buttonSecondary}><RotateCcw className="size-4" /> Try again</button>
        ) : (
          <>
            {!answeredAll && <span className="text-xs text-muted-foreground">Answer every question to submit.</span>}
            <button type="button" disabled={!answeredAll} onClick={submit} className={buttonPrimary}>Submit answers</button>
          </>
        )}
      </div>
    </Card>
  );
}

function Certificate({ course, enrolment, name, onClose }: { course: Course; enrolment: Enrolment; name: string; onClose: () => void }) {
  const exp = expiresAt(enrolment, course);
  const score = bestScore(enrolment);
  const print = () => {
    const w = window.open("", "_blank", "width=1000,height=720");
    if (!w) return;
    const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Certificate</title><style>@page{size:A4 landscape;margin:0}body{margin:0;font-family:Georgia,serif;color:#1f2937}.c{margin:28px;border:6px double #3b5bdb;padding:56px;text-align:center;height:calc(100vh - 180px)}.b{font-family:Helvetica,Arial,sans-serif;color:#3b5bdb;font-weight:800;letter-spacing:.08em;font-size:14px}h1{font-size:40px;margin:18px 0 6px}.n{font-size:34px;margin:28px 0 8px;border-bottom:1px solid #cbd5e1;display:inline-block;padding:0 40px 8px}.t{font-size:22px;margin:10px 0 28px}.m{font-family:Helvetica,Arial,sans-serif;color:#6b7280;font-size:13px}</style></head><body><div class="c"><div class="b">BHE STUDENT CONSULTANCY LTD</div><h1>Certificate of completion</h1><div class="m">This certifies that</div><div class="n">${esc(name)}</div><div class="m">has successfully completed</div><div class="t">${esc(course.title)}</div><div class="m">Completed ${esc(formatDay(enrolment.completedAt!))}${score !== undefined ? ` · score ${score}%` : ""}${exp ? ` · valid until ${esc(formatDay(exp))}` : ""}<br>${esc(course.instructor)}</div></div><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };
  return (
    <Modal open onClose={onClose} icon={Award} title="Certificate of completion" subtitle={course.title}
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Close</button><button type="button" onClick={print} className={buttonPrimary}><Printer className="size-4" /> Print or save PDF</button></div>}
    >
      <div className="rounded-2xl border-4 border-double border-primary/60 p-8 text-center">
        <p className="text-[11px] font-bold tracking-widest text-primary">BHE STUDENT CONSULTANCY LTD</p>
        <p className="mt-3 font-serif text-2xl text-foreground">Certificate of completion</p>
        <p className="mt-5 text-xs text-muted-foreground">This certifies that</p>
        <p className="mt-1 font-serif text-xl font-semibold text-foreground">{name}</p>
        <p className="mt-3 text-xs text-muted-foreground">has successfully completed</p>
        <p className="mt-1 text-base font-semibold text-foreground">{course.title}</p>
        <p className="mt-5 text-xs text-muted-foreground">Completed {formatDay(enrolment.completedAt!)}{score !== undefined ? ` · score ${score}%` : ""}{exp ? ` · valid until ${formatDay(exp)}` : ""}</p>
      </div>
    </Modal>
  );
}
