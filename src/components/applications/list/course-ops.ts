import type { ApplicationRow, CourseOption } from "@/lib/mock/applications";
import { MAIN } from "./course-manager";

// Pure updates for an application's course choices, shared by the list and details pages.

export type CourseDraft = Omit<CourseOption, "id" | "stage" | "funding">;

export function saveCourse(a: ApplicationRow, draft: CourseDraft, courseId?: string): Partial<ApplicationRow> {
  if (courseId === MAIN) return draft;
  if (courseId) return { courseOptions: a.courseOptions.map((c) => (c.id === courseId ? { ...c, ...draft } : c)) };
  return { courseOptions: [...a.courseOptions, { ...draft, id: `${a.id}-${Date.now().toString(36)}`, stage: "New", funding: "N/A" }] };
}

export function deleteCourse(a: ApplicationRow, courseId: string): Partial<ApplicationRow> {
  return { courseOptions: a.courseOptions.filter((c) => c.id !== courseId) };
}

/** Swap an alternative with the main course (including its stage and funding). */
export function makeMain(a: ApplicationRow, courseId: string): Partial<ApplicationRow> {
  const pick = a.courseOptions.find((c) => c.id === courseId);
  if (!pick) return {};
  const previous: CourseOption = {
    id: courseId,
    country: a.country,
    university: a.university,
    course: a.course,
    level: a.level,
    mode: a.mode,
    campus: a.campus,
    intake: a.intake,
    stage: a.stage,
    funding: a.funding,
  };
  const { id: _drop, ...main } = pick;
  void _drop;
  return { ...main, courseOptions: a.courseOptions.map((c) => (c.id === courseId ? previous : c)) };
}

export function patchCourse(a: ApplicationRow, courseId: string, patch: Partial<Pick<CourseOption, "stage" | "funding">>): Partial<ApplicationRow> {
  return courseId === MAIN ? patch : { courseOptions: a.courseOptions.map((c) => (c.id === courseId ? { ...c, ...patch } : c)) };
}
