"use client";

// Adds courses picked in the course finder to the CRM as Drafts, creating the institution first
// (as Onboarding) when it isn't in Institutions yet. Found lists are cached per university.

import type { InstitutionRecord } from "@/lib/mock/directory";
import { addInstitution, getInstitutions, nextInstitutionId } from "@/lib/mock/institution-store";
import { categoryFor, currencyFor, getCourses, saveCourses, type Course } from "@/lib/mock/courses";
import { createSettingsStore } from "@/lib/settings/store";
import type { CourseList, FoundCourse, ResearchFocus } from "./types";

export interface CachedList extends CourseList {
  focus: ResearchFocus;
  at: string;
}

/** The last 40 course lists found, so picking a university again is instant. */
export const courseListStore = createSettingsStore<CachedList[]>("bhe-crm:course-finder", []);

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const initials = (s: string) => s.replace(/\(.*?\)/g, "").split(/\s+/).filter((w) => /^[A-Z]/.test(w) && !/^(Of|The|And)$/.test(w)).map((w) => w[0]).join("").slice(0, 4) || s.slice(0, 2).toUpperCase();
const defaultMonths: Record<FoundCourse["level"], number> = { Foundation: 12, "Pre-Master's": 6, Undergraduate: 36, Postgraduate: 12, PhD: 36 };

export function institutionFor(name: string) {
  return getInstitutions().find((i) => norm(i.name) === norm(name));
}

/** Course names this university already has in the CRM. */
export function existingCourseNames(university: string) {
  const u = norm(university);
  return new Set(getCourses().filter((c) => norm(c.institution) === u).map((c) => norm(c.name)));
}
export const isExisting = (names: Set<string>, course: string) => names.has(norm(course));

export function addCourses(list: CourseList, picked: FoundCourse[], by: string) {
  let institution = institutionFor(list.university);
  let createdInstitution = false;
  if (!institution) {
    const record: InstitutionRecord = {
      id: nextInstitutionId(),
      name: list.university,
      country: list.country,
      city: "",
      logoText: initials(list.university),
      ranking: "—",
      commissionTier: "Tier 3 (10-12%)",
      agreementType: "Direct Agreement",
      tatDays: "To confirm",
      openIntakes: [],
      programsCount: 0,
      featured: false,
      type: "University",
      website: list.website,
      status: "Onboarding",
      active: true,
      showOnWebsite: false,
    };
    addInstitution(record);
    institution = record;
    createdInstitution = true;
  }

  const existing = getCourses();
  const have = existingCourseNames(list.university);
  let n = existing.reduce((m, c) => Math.max(m, Number(c.id.slice(4)) || 0), 0);
  const code = initials(list.university);
  const now = new Date().toISOString();
  const fresh = picked.filter((c) => !have.has(norm(c.name)));
  const courses: Course[] = fresh.map((c, i) => ({
    id: `CRS-${String(++n).padStart(3, "0")}`,
    code: `${code}-${initials(c.name) || "C"}${existing.length + i + 1}`.toUpperCase(),
    name: c.name,
    institution: institution!.name,
    country: list.country,
    campuses: [],
    level: c.level,
    categoryId: categoryFor(c.name),
    duration: defaultMonths[c.level],
    modes: ["Full time"],
    intakes: [],
    placement: /placement|sandwich/i.test(c.name),
    currency: currencyFor[list.country] ?? "GBP",
    intlFee: 0,
    homeFee: 0,
    deposit: 0,
    scholarship: "",
    studentFinance: false,
    academicRequirement: "",
    ieltsOverall: "",
    ieltsMin: "",
    moiAccepted: false,
    workExperience: "",
    documents: [],
    description: "Added from the course finder — add fees, intakes and entry requirements before publishing.",
    status: "Draft",
    onWebsite: false,
    featured: false,
    updatedAt: now,
    updatedBy: by,
  }));
  saveCourses([...courses, ...existing]);
  return { added: courses.length, skipped: picked.length - fresh.length, institutionId: institution.id, createdInstitution };
}
