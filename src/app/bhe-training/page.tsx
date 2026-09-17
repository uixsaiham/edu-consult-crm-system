"use client";

import { useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  Clock,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { mockTrainingCourses, type TrainingCourse } from "@/lib/mock/insights";
import { cn } from "@/lib/utils";

export default function BheTrainingPage() {
  const [courses, setCourses] = useState<TrainingCourse[]>(mockTrainingCourses);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TrainingCourse["category"]>("UKVI Visa & Compliance");
  const [level, setLevel] = useState<TrainingCourse["level"]>("Mandatory Core");
  const [durationHours, setDurationHours] = useState(4);
  const [lessonCount, setLessonCount] = useState(8);
  const [instructor, setInstructor] = useState("David Miller (Compliance Lead)");
  const [badge, setBadge] = useState("Compliance Pro");

  const categories = [
    "All",
    "UKVI Visa & Compliance",
    "Admissions & Credibility",
    "Sales & Lead Conversion",
    "Institution Portals",
  ];

  const filtered = useMemo(() => {
    let list = courses;
    if (activeCategory !== "All") {
      list = list.filter((c) => c.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q) ||
          c.badge.toLowerCase().includes(q)
      );
    }
    return list;
  }, [courses, search, activeCategory]);

  const totalHours = courses.reduce((acc, c) => acc + c.durationHours, 0);
  const avgAcademyScore = (
    courses.reduce((acc, c) => acc + c.avgScore, 0) / courses.length
  ).toFixed(1);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !instructor) return;

    const newCourse: TrainingCourse = {
      id: `TRN-${Date.now().toString().slice(-4)}`,
      title,
      category,
      level,
      durationHours,
      lessonCount,
      certifiedCount: 0,
      totalCounselors: 48,
      avgScore: 90.0,
      instructor,
      lastUpdated: "Sep 2026",
      badge: badge || "Certified",
    };

    setCourses([newCourse, ...courses]);
    setTitle("");
    setAddModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            BHE Training & Certifications
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            UKVI compliance certifications, credibility interview coaching, and admissions accreditation modules for counselors.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95"
          >
            <Plus className="size-3.5" />
            <span>Add Training Module</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Certified Staff</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <ShieldCheck className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              96%
            </span>
            <span className="text-xs font-medium text-muted-foreground">46 / 48 Counselors</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Courses</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <BookOpen className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {courses.length} Modules
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Updated 2026</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Academy Avg Score</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Star className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {avgAcademyScore}%
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Pass Mark 85%</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Curriculum Volume</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
              <Clock className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {totalHours} Hours
            </span>
            <span className="text-xs font-medium text-muted-foreground">52 Total Lessons</span>
          </div>
        </Card>
      </div>

      {/* Category Pills & Search */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search training modules..."
              className="w-full rounded-full border border-border bg-background py-1.5 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </Card>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No training modules found in this category.
          </div>
        ) : (
          filtered.map((course) => {
            const completionPct = Math.round(
              (course.certifiedCount / course.totalCounselors) * 100
            );

            return (
              <Card key={course.id} className="flex flex-col justify-between p-5 hover:border-primary/50 transition-colors">
                <div>
                  {/* Card Header Tags */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      <Award className="size-3" />
                      {course.badge}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        course.level === "Mandatory Core"
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      )}
                    >
                      {course.level}
                    </span>
                  </div>

                  {/* Course Title */}
                  <h3 className="mt-3 text-base font-bold text-foreground line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Instructor: <span className="font-medium text-foreground">{course.instructor}</span>
                  </p>

                  {/* Meta Specs */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span>{course.durationHours} hrs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="size-3.5 text-muted-foreground" />
                      <span>{course.lessonCount} lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="size-3.5 text-amber-500 fill-amber-500" />
                      <span>{course.avgScore}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">
                        Counselor Completion
                      </span>
                      <span className="font-semibold text-foreground">
                        {course.certifiedCount} / {course.totalCounselors} ({completionPct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Updated {course.lastUpdated}
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <Play className="size-3 fill-current" />
                    <span>View Module</span>
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Add Training Course</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Publish a new training curriculum for BHE counselors.
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
              <div>
                <label className="text-xs font-medium text-foreground">Course Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CAS Financial Evidence Vetting Standard"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TrainingCourse["category"])}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="UKVI Visa & Compliance">UKVI Visa & Compliance</option>
                    <option value="Admissions & Credibility">Admissions & Credibility</option>
                    <option value="Sales & Lead Conversion">Sales & Lead Conversion</option>
                    <option value="Institution Portals">Institution Portals</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Curriculum Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as TrainingCourse["level"])}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="Mandatory Core">Mandatory Core</option>
                    <option value="Advanced Specialist">Advanced Specialist</option>
                    <option value="Annual Refresher">Annual Refresher</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Duration (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Lesson Count</label>
                  <input
                    type="number"
                    min={1}
                    value={lessonCount}
                    onChange={(e) => setLessonCount(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Lead Instructor</label>
                  <input
                    type="text"
                    required
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Certification Badge</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. CAS Specialist"
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
                  Publish Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
