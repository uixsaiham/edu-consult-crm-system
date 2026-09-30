"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Award, BookOpen, GraduationCap, LineChart, Plus, RotateCcw, SearchX, ShieldCheck, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { formatDay } from "@/components/people/people-ui";
import { ProgressRing } from "@/components/applications/progress-ring";
import { CourseCard, CourseDialog, LearnerStatusBadge, LevelBadge, durationText, learnerStatuses } from "@/components/training/training-ui";
import { getStaff } from "@/lib/mock/staff";
import {
  addDays,
  courseCategories,
  courseMinutes,
  daysUntil,
  expiresAt,
  getCourses,
  getEnrolments,
  getVideos,
  inAudience,
  nextCourseId,
  progressOf,
  saveCourses,
  saveEnrolments,
  statusOf,
  trainingToday,
  type Course,
  type Enrolment,
} from "@/lib/mock/training";
import { cn } from "@/lib/utils";

function TrainingHubPageInner() {
  const router = useRouter();
  const { user } = useUser();
  const me = getStaff().find((s) => s.name === user.name);
  const [courses, setCourses] = useState<Course[]>(getCourses);
  const [enrolments, setEnrolments] = useState<Enrolment[]>(getEnrolments);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [mine, setMine] = useState("");
  const [adding, setAdding] = useState(false);
  const [toast, notify] = useToast();

  useEffect(() => saveCourses(courses), [courses]);
  useEffect(() => saveEnrolments(enrolments), [enrolments]);

  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const myEnrolments = enrolments.filter((e) => e.staffId === me?.id && courseById.get(e.courseId)?.published);
  const myFor = (id: string) => myEnrolments.find((e) => e.courseId === id);
  const todo = myEnrolments
    .filter((e) => !e.completedAt || ["Expired", "Expiring"].includes(statusOf(e, courseById.get(e.courseId)!)))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const certificates = myEnrolments.filter((e) => e.completedAt);

  const stats = (c: Course) => {
    const list = enrolments.filter((e) => e.courseId === c.id);
    const done = list.filter((e) => ["Completed", "Expiring"].includes(statusOf(e, c))).length;
    return { learners: list.length, completion: list.length ? Math.round((done / list.length) * 100) : 0 };
  };

  const mandatory = enrolments.filter((e) => courseById.get(e.courseId)?.level === "Mandatory");
  const mandatoryDone = mandatory.filter((e) => ["Completed", "Expiring"].includes(statusOf(e, courseById.get(e.courseId)!))).length;
  const overdue = enrolments.filter((e) => { const c = courseById.get(e.courseId); return c && statusOf(e, c) === "Overdue"; }).length;
  const expiring = enrolments.filter((e) => { const c = courseById.get(e.courseId); return c && ["Expiring", "Expired"].includes(statusOf(e, c)); }).length;

  const q = search.trim().toLowerCase();
  const shown = courses.filter((c) => {
    const e = myFor(c.id);
    const st = e ? statusOf(e, c) : undefined;
    return (!category || c.category === category) && (!level || c.level === level) && (!mine || (mine === "Not assigned" ? !e : st === mine)) && (!q || `${c.title} ${c.summary} ${c.instructor} ${c.category}`.toLowerCase().includes(q));
  });
  const hasFilters = !!(search || category || level || mine);

  const addCourse = (draft: Omit<Course, "id" | "updatedAt">) => {
    const course: Course = { ...draft, id: nextCourseId(draft.title), updatedAt: trainingToday };
    setCourses((prev) => [course, ...prev]);
    const assigned = course.published
      ? getStaff().filter((s) => (s.status === "Active" || s.status === "On leave") && inAudience(course, s)).map((s) => ({ staffId: s.id, courseId: course.id, assignedAt: trainingToday, dueDate: addDays(trainingToday, course.dueDays), completedLessons: [], attempts: [], reminders: [] }))
      : [];
    setEnrolments((prev) => [...prev, ...assigned]);
    notify(course.published ? `${course.title} published and assigned to ${assigned.length} people` : `${course.title} saved as a draft`);
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Training Hub</h2>
          <p className="mt-1 text-sm text-muted-foreground">Short courses on visa compliance, admissions and the tools we use — with a quiz and certificate at the end of each.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/bhe-training/videos" className={buttonSecondary}><Video className="size-4" /> Video sessions{getVideos().length ? ` · ${getVideos().length}` : ""}</Link>
          <Link href="/bhe-training/progression" className={buttonSecondary}><LineChart className="size-4" /> Team progress</Link>
          <button type="button" onClick={() => setAdding(true)} className={buttonPrimary}><Plus className="size-4" /> Add course</button>
        </div>
      </header>

      {/* My learning */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="flex items-center gap-4 lg:w-72 lg:shrink-0 lg:flex-col lg:items-start">
            <ProgressRing percent={myEnrolments.length ? (certificates.filter((e) => statusOf(e, courseById.get(e.courseId)!) !== "Expired").length / myEnrolments.length) * 100 : 0} size={72} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">My learning</p>
              <p className="text-lg font-semibold text-foreground">{todo.length ? `${todo.length} course${todo.length === 1 ? "" : "s"} to do` : "You're all caught up"}</p>
              <p className="text-xs text-muted-foreground">{certificates.length} certificate{certificates.length === 1 ? "" : "s"} · {myEnrolments.length} assigned</p>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            {todo.length ? (
              <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {todo.slice(0, 4).map((e) => {
                  const c = courseById.get(e.courseId)!;
                  const st = statusOf(e, c);
                  const p = progressOf(e, c);
                  const d = st === "Expired" || st === "Expiring" ? expiresAt(e, c)! : e.dueDate;
                  return (
                    <li key={e.courseId}>
                      <Link href={`/bhe-training/${c.id}`} className="flex items-center gap-3 rounded-2xl border border-border p-3 transition-colors hover:border-border-strong">
                        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-white", c.color)}><GraduationCap className="size-5" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">{c.title}</span>
                          <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                            <LearnerStatusBadge status={st} />
                            <span className={cn(daysUntil(d) < 0 && "font-semibold text-danger")}>{st === "Expired" ? `Expired ${formatDay(d)}` : st === "Expiring" ? `Renew by ${formatDay(d)}` : daysUntil(d) < 0 ? `${-daysUntil(d)} days overdue` : `Due ${formatDay(d)}`}</span>
                          </span>
                        </span>
                        <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">{st === "Expired" || st === "Expiring" ? <RotateCcw className="ml-auto size-4 text-warning" /> : `${p}%`}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="flex items-center gap-2 rounded-2xl bg-success-soft px-4 py-3 text-sm text-foreground"><ShieldCheck className="size-4 text-success" /> Every course assigned to you is complete and in date.</p>
            )}
            {certificates.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground">Certificates:</span>
                {certificates.map((e) => {
                  const c = courseById.get(e.courseId)!;
                  const exp = expiresAt(e, c);
                  return (
                    <Link key={e.courseId} href={`/bhe-training/${c.id}`} className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] text-foreground hover:bg-surface-hover" title={exp ? `Valid until ${formatDay(exp)}` : "Doesn't expire"}>
                      <Award className="size-3 text-amber-500" /> {c.title.split(" ").slice(0, 3).join(" ")}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      <StatGrid>
        <StatCard icon={BookOpen} label="Courses" value={courses.filter((c) => c.published).length} note={`${courses.filter((c) => c.level === "Mandatory").length} mandatory`} />
        <StatCard icon={ShieldCheck} tone={mandatoryDone / Math.max(1, mandatory.length) >= 0.9 ? "success" : "warning"} label="Mandatory done" value={`${Math.round((mandatoryDone / Math.max(1, mandatory.length)) * 100)}%`} note="whole team" />
        <StatCard icon={AlertTriangle} tone={overdue ? "danger" : "success"} label="Overdue assignments" value={overdue} onClick={() => router.push("/bhe-training/progression?status=Overdue")} />
        <StatCard icon={RotateCcw} tone={expiring ? "warning" : "success"} label="Renewals due" value={expiring} note="≤30 days" onClick={() => router.push("/bhe-training/progression?status=Expiring")} />
      </StatGrid>

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Course, topic, instructor…" label="Search courses" />
        <SelectFilter label="Category" value={category} onChange={setCategory} allLabel="All categories" options={courseCategories.map((c) => ({ value: c, label: c, hint: courses.filter((x) => x.category === c).length }))} />
        <SelectFilter label="Requirement" value={level} onChange={setLevel} allLabel="Any requirement" options={["Mandatory", "Recommended", "Optional"]} />
        <SelectFilter label="My status" value={mine} onChange={setMine} allLabel="Any status" options={[...learnerStatuses, "Not assigned"]} />
        {hasFilters && <ResetFilters onClick={() => { setSearch(""); setCategory(""); setLevel(""); setMine(""); }} />}
      </FilterBar>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <SearchX className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No courses match</p>
          <p className="text-xs text-muted-foreground">Try another category or search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((c) => {
            const e = myFor(c.id);
            const s = stats(c);
            return <CourseCard key={c.id} course={c} progress={e ? progressOf(e, c) : undefined} status={e ? statusOf(e, c) : undefined} due={e ? formatDay(e.dueDate) : undefined} learners={s.learners} completion={s.completion} />;
          })}
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        {courses.length} courses · {durationText(courses.reduce((n, c) => n + courseMinutes(c), 0))} of learning · <LevelBadge level="Mandatory" /> courses are assigned automatically by role
      </p>

      {adding && <CourseDialog onClose={() => setAdding(false)} onSave={addCourse} />}
      {toast}
    </div>
  );
}

export default function TrainingHubPage() { return <Suspense><TrainingHubPageInner /></Suspense>; }
