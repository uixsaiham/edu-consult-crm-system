"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coins,
  GraduationCap,
  Plus,
  X,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { mockCourses, type CourseRecord } from "@/lib/mock/directory";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseRecord[]>(mockCourses);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [facultyFilter, setFacultyFilter] = useState<string>("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("University of Hertfordshire");
  const [level, setLevel] = useState<CourseRecord["level"]>("Postgraduate");
  const [faculty, setFaculty] = useState<CourseRecord["faculty"]>("Computing & IT");
  const [duration, setDuration] = useState("1 Year Full-time");
  const [annualFee, setAnnualFee] = useState("16500");
  const [ieltsReq, setIeltsReq] = useState("6.5 overall");

  const filtered = useMemo(() => {
    let list = courses;
    if (levelFilter) list = list.filter((c) => c.level === levelFilter);
    if (facultyFilter) list = list.filter((c) => c.faculty === facultyFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.institution.toLowerCase().includes(q) ||
          c.faculty.toLowerCase().includes(q)
      );
    }
    return list;
  }, [courses, search, levelFilter, facultyFilter]);

  const pgCount = courses.filter((c) => c.level === "Postgraduate").length;
  const ugCount = courses.filter((c) => c.level === "Undergraduate").length;
  const avgFee = Math.round(courses.reduce((acc, c) => acc + c.annualFee, 0) / courses.length);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    const newCourse: CourseRecord = {
      id: `CRS-${courses.length + 101}`,
      name,
      institution,
      country: "United Kingdom",
      level,
      faculty,
      duration,
      annualFee: Number(annualFee) || 16000,
      currency: "GBP",
      intakes: ["September 2026", "January 2027"],
      ieltsReq,
    };

    setCourses([newCourse, ...courses]);
    setName("");
    setAddModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Courses & Programs
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search undergraduate, postgraduate, and foundation degrees with fees, intakes, and IELTS criteria.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className={buttonPrimary}
          >
            <Plus className="size-4" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <StatGrid>
        <StatCard icon={BookOpen} tone="violet" label="Total catalog" value={courses.length} note="Active degrees" />
        <StatCard icon={GraduationCap} label="Postgraduate" value={pgCount} note="MSc · MBA · LLM" />
        <StatCard icon={CheckCircle2} tone="success" label="Undergraduate" value={ugCount} note="BSc · BEng · BA" />
        <StatCard icon={Coins} tone="warning" label="Avg annual tuition" value={`£${avgFee.toLocaleString()}`} />
      </StatGrid>

      {/* Filter Bar */}
      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search course or university…" label="Search courses" />
        <SelectFilter
          label="Level"
          allLabel="All levels"
          value={levelFilter}
          onChange={setLevelFilter}
          options={["Postgraduate", "Undergraduate", "Foundation"].map((l) => ({
            value: l,
            label: l,
            hint: courses.filter((c) => c.level === l).length,
          }))}
        />
        <SelectFilter
          label="Faculty"
          allLabel="All faculties"
          value={facultyFilter}
          onChange={setFacultyFilter}
          options={["Computing & IT", "Business & Management", "Engineering", "Law", "Health Sciences"].map((f) => ({
            value: f,
            label: f,
            hint: courses.filter((c) => c.faculty === f).length,
          }))}
        />
        {(search || levelFilter || facultyFilter) && (
          <ResetFilters
            onClick={() => {
              setSearch("");
              setLevelFilter("");
              setFacultyFilter("");
            }}
          />
        )}
      </FilterBar>

      {/* Course Catalog Table Card */}
      <Card className="flex flex-col">
        <CardHeader
          icon={BookOpen}
          title="Degree & Course Catalog"
          subtitle={`${filtered.length} course${filtered.length === 1 ? "" : "s"} match your filters`}
        />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-surface-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 pl-6 pr-3 font-semibold">Course & Level</th>
                <th className="px-3 py-3 font-semibold">Institution</th>
                <th className="px-3 py-3 font-semibold">Faculty</th>
                <th className="px-3 py-3 font-semibold">Duration</th>
                <th className="px-3 py-3 font-semibold">Tuition Fee</th>
                <th className="px-3 py-3 font-semibold">IELTS Requirement</th>
                <th className="py-3 pl-3 pr-6 text-right font-semibold">Intakes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((crs) => (
                <tr key={crs.id} className="group transition-colors hover:bg-surface-muted/40">
                  <td className="py-3.5 pl-6 pr-3 align-middle max-w-[280px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-foreground leading-snug">{crs.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-muted-foreground">{crs.id}</span>
                        <span className="rounded-full bg-primary-soft px-2 py-0.2 text-[10px] font-semibold text-primary">
                          {crs.level}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3.5 align-middle">
                    <span className="font-semibold text-foreground">{crs.institution}</span>
                    <p className="text-[11px] text-muted-foreground">{crs.country}</p>
                  </td>

                  <td className="px-3 py-3.5 align-middle">
                    <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-foreground">
                      {crs.faculty}
                    </span>
                  </td>

                  <td className="px-3 py-3.5 align-middle text-muted-foreground text-[11px]">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3 text-muted-foreground" />
                      <span>{crs.duration}</span>
                    </div>
                  </td>

                  <td className="px-3 py-3.5 align-middle font-bold text-foreground tabular-nums">
                    {crs.currency === "GBP" ? "£" : crs.currency === "EUR" ? "€" : "$"}
                    {crs.annualFee.toLocaleString()}
                    <span className="text-[10px] font-normal text-muted-foreground ml-0.5">/yr</span>
                  </td>

                  <td className="px-3 py-3.5 align-middle text-muted-foreground text-[11px]">
                    {crs.ieltsReq}
                  </td>

                  <td className="py-3.5 pl-3 pr-6 align-middle text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {crs.intakes.map((intake) => (
                        <span
                          key={intake}
                          className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {intake}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Course Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 card-shadow">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Add Degree Course</h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Course Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. MSc Artificial Intelligence"
                  className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Partner Institution</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Study Level</label>
                  <div className="relative mt-1">
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value as CourseRecord["level"])}
                      className="h-9 w-full appearance-none rounded-xl border border-border bg-surface px-3 pr-8 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Undergraduate">Undergraduate</option>
                      <option value="Foundation">Foundation</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Faculty</label>
                  <div className="relative mt-1">
                    <select
                      value={faculty}
                      onChange={(e) => setFaculty(e.target.value as CourseRecord["faculty"])}
                      className="h-9 w-full appearance-none rounded-xl border border-border bg-surface px-3 pr-8 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="Computing & IT">Computing & IT</option>
                      <option value="Business & Management">Business & Management</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Law">Law</option>
                      <option value="Health Sciences">Health Sciences</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Annual Fee (GBP)</label>
                  <input
                    type="number"
                    value={annualFee}
                    onChange={(e) => setAnnualFee(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="1 Year Full-time"
                    className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">IELTS Req</label>
                  <input
                    type="text"
                    value={ieltsReq}
                    onChange={(e) => setIeltsReq(e.target.value)}
                    placeholder="6.5 overall"
                    className="mt-1 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
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
                  Save Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
