"use client";

import { useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  ChevronDown,
  Clock,
  Play,
  Plus,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { mockTrainingCourses, type TrainingCourse } from "@/lib/mock/insights";
import { cn } from "@/lib/utils";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";

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
            className={buttonPrimary}
          >
            <Plus className="size-4" />
            <span>Add Training Module</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <StatGrid>
        <StatCard icon={ShieldCheck} label="Certified staff" value="96%" note="46 / 48" />
        <StatCard icon={BookOpen} tone="teal" label="Active modules" value={courses.length} note="Updated 2026" />
        <StatCard icon={Star} tone="warning" label="Academy avg score" value={`${avgAcademyScore}%`} note="Pass 85%" />
        <StatCard icon={Clock} tone="violet" label="Curriculum hours" value={totalHours} note="52 lessons" />
      </StatGrid>

      {/* Category & Search */}
      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search training modules…" label="Search training" />
        <SelectFilter
          label="Category"
          allLabel="All categories"
          width="w-64"
          value={activeCategory === "All" ? "" : activeCategory}
          onChange={(v) => setActiveCategory(v || "All")}
          options={categories
            .filter((c) => c !== "All")
            .map((c) => ({ value: c, label: c, hint: courses.filter((course) => course.category === c).length }))}
        />
        {(search || activeCategory !== "All") && (
          <ResetFilters
            onClick={() => {
              setSearch("");
              setActiveCategory("All");
            }}
          />
        )}
      </FilterBar>

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
                          ? "bg-rose-700/10 text-rose-700 dark:bg-rose-300/10 dark:text-rose-300"
                          : "bg-blue-700/10 text-blue-700 dark:bg-blue-300/10 dark:text-blue-300"
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
                        className="h-full bg-success rounded-full"
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
                <label className="text-xs font-semibold text-foreground">
                  Course Title <span className="text-danger">*</span>
                </label>
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
                  <label className="text-xs font-semibold text-foreground">Category</label>
                  <div className="relative mt-1">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TrainingCourse["category"])}
                      className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2 pr-8 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    >
                      <option value="UKVI Visa & Compliance">UKVI Visa & Compliance</option>
                      <option value="Admissions & Credibility">Admissions & Credibility</option>
                      <option value="Sales & Lead Conversion">Sales & Lead Conversion</option>
                      <option value="Institution Portals">Institution Portals</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Curriculum Level</label>
                  <div className="relative mt-1">
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value as TrainingCourse["level"])}
                      className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2 pr-8 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    >
                      <option value="Mandatory Core">Mandatory Core</option>
                      <option value="Advanced Specialist">Advanced Specialist</option>
                      <option value="Annual Refresher">Annual Refresher</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Duration (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Lesson Count</label>
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
                  <label className="text-xs font-semibold text-foreground">
                    Lead Instructor <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Certification Badge</label>
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
                  className={buttonSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={buttonPrimary}
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
