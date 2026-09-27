// Courses module: the course catalogue with fees, intakes and entry
// requirements, plus the categories and study levels it is organised by.
// Seeded from the application course catalogue so both stay in step; edits are
// kept for the session until the backend exists.
import { getApplications } from "./applications";
import { catalog, catalogIntakes, deliveryModes, type CatalogUniversity, type CourseLevel, type DeliveryMode } from "./course-catalog";
import { getInstitutions } from "./institution-store";

export { catalogIntakes as courseIntakes, deliveryModes };
export type { DeliveryMode };

// --- Categories -------------------------------------------------------------------

export interface CourseCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  /** Words in a course title that place it in this category. */
  keywords: string[];
  createdAt: string;
  /** Inactive categories stay on existing courses but can't be picked for new ones. */
  active: boolean;
}

const seedCategories: CourseCategory[] = [
  { id: "business", name: "Business & Management", description: "Business, management, MBA, marketing, tourism and project management.", color: "bg-primary", keywords: ["business", "management", "mba", "marketing", "tourism", "administration"], createdAt: "2022-01-10", active: true },
  { id: "computing", name: "Computing & IT", description: "Computer science, cyber security, software and information technology.", color: "bg-sky-500", keywords: ["computer", "computing", "cyber", "information technology", "software", "electronic information"], createdAt: "2022-01-10", active: true },
  { id: "data", name: "Data Science & AI", description: "Data science, analytics, artificial intelligence and robotics.", color: "bg-violet-500", keywords: ["data", "analytics", "artificial intelligence", "robotics"], createdAt: "2023-06-14", active: true },
  { id: "finance", name: "Accounting, Finance & Economics", description: "Accounting, finance, fintech and economics.", color: "bg-emerald-500", keywords: ["accounting", "finance", "fintech", "economics"], createdAt: "2022-03-02", active: true },
  { id: "health", name: "Health & Social Care", description: "Public health, nursing, healthcare management and social care.", color: "bg-rose-500", keywords: ["health", "nursing", "care", "healthcare"], createdAt: "2022-05-19", active: true },
  { id: "engineering", name: "Engineering", description: "Civil, mechanical, electrical and electronic engineering.", color: "bg-amber-500", keywords: ["engineering", "beng"], createdAt: "2022-03-02", active: true },
  { id: "law", name: "Law", description: "LLB, LLM and legal studies.", color: "bg-slate-500", keywords: ["law", "llb", "llm"], createdAt: "2024-02-08", active: true },
  { id: "creative", name: "Art, Design & Media", description: "Graphic design, fashion, interior design and media.", color: "bg-pink-500", keywords: ["design", "fashion", "art", "media"], createdAt: "2024-09-23", active: false },
  { id: "foundation", name: "Foundation & Pathways", description: "Foundation years, CertHE, HND and pre-master's pathways.", color: "bg-teal-500", keywords: ["foundation", "certhe", "hnd", "pre-master"], createdAt: "2022-01-10", active: true },
];

// --- Levels --------------------------------------------------------------------

export interface StudyLevel {
  id: string;
  name: string;
  short: string;
  description: string;
  typicalDuration: string;
  academicRequirement: string;
  ieltsOverall: string;
  ieltsMin: string;
  documents: string[];
  color: string;
}

const seedLevels: StudyLevel[] = [
  {
    id: "foundation", name: "Foundation", short: "FY", color: "bg-teal-500",
    description: "Foundation years, CertHE and HND — a route into a degree for students who don't meet direct-entry requirements.",
    typicalDuration: "1 year", academicRequirement: "HSC / A-levels or equivalent, GPA 2.5+ (or UK Level 3 for home students)",
    ieltsOverall: "5.0", ieltsMin: "4.5", documents: ["Passport", "SSC and HSC certificates", "English test or MOI letter", "Personal statement"],
  },
  {
    id: "undergraduate", name: "Undergraduate", short: "UG", color: "bg-primary",
    description: "Bachelor's degrees (BA, BSc, BEng, LLB), usually 3 years in the UK.",
    typicalDuration: "3 years", academicRequirement: "HSC / A-levels with GPA 3.5/5 or equivalent",
    ieltsOverall: "6.0", ieltsMin: "5.5", documents: ["Passport", "SSC and HSC certificates and transcripts", "English test result", "Personal statement", "Reference letter"],
  },
  {
    id: "pre-masters", name: "Pre-Master's", short: "PM", color: "bg-amber-500",
    description: "One or two terms preparing graduates for a master's programme at the same university.",
    typicalDuration: "4–8 months", academicRequirement: "Bachelor's degree, CGPA 2.2/4 or equivalent",
    ieltsOverall: "5.5", ieltsMin: "5.0", documents: ["Passport", "Bachelor's certificate and transcript", "English test result", "CV"],
  },
  {
    id: "postgraduate", name: "Postgraduate", short: "PG", color: "bg-violet-500",
    description: "Taught master's degrees (MSc, MA, MBA, LLM), usually 1 year full time in the UK.",
    typicalDuration: "1 year", academicRequirement: "Bachelor's degree, 2:2 or CGPA 2.5/4 and above",
    ieltsOverall: "6.5", ieltsMin: "5.5", documents: ["Passport", "Bachelor's certificate and transcript", "English test result", "CV", "Personal statement", "Two references"],
  },
  {
    id: "phd", name: "PhD", short: "PhD", color: "bg-rose-500",
    description: "Doctoral research degrees, 3–4 years, with a supervisor-approved research proposal.",
    typicalDuration: "3–4 years", academicRequirement: "Master's degree with merit, or a first-class bachelor's",
    ieltsOverall: "7.0", ieltsMin: "6.5", documents: ["Passport", "Master's and bachelor's transcripts", "Research proposal", "CV", "Two academic references"],
  },
];

// --- Courses ------------------------------------------------------------------

export type CourseStatus = "Published" | "Draft" | "Closed";

export interface Course {
  id: string;
  code: string;
  name: string;
  institution: string;
  country: string;
  campuses: string[];
  level: string;
  categoryId: string;
  /** Duration in months. */
  duration: number;
  modes: DeliveryMode[];
  intakes: string[];
  deadline?: string;
  placement: boolean;
  currency: string;
  /** International tuition per year; 0 when the course is for home students only. */
  intlFee: number;
  /** UK home tuition per year; 0 when not offered to home students. */
  homeFee: number;
  deposit: number;
  scholarship: string;
  studentFinance: boolean;
  academicRequirement: string;
  ieltsOverall: string;
  ieltsMin: string;
  moiAccepted: boolean;
  workExperience: string;
  documents: string[];
  description: string;
  status: CourseStatus;
  onWebsite: boolean;
  featured: boolean;
  updatedAt: string;
  updatedBy: string;
}

export const currencyFor: Record<string, string> = {
  "United Kingdom": "GBP",
  Ireland: "EUR",
  Australia: "AUD",
  Canada: "CAD",
  "United States": "USD",
  China: "CNY",
};
export const currencySymbol: Record<string, string> = { GBP: "£", EUR: "€", AUD: "A$", CAD: "C$", USD: "$", CNY: "¥" };

export function formatFee(amount: number, currency: string) {
  return amount ? `${currencySymbol[currency] ?? ""}${amount.toLocaleString()}` : "—";
}

// UK providers whose courses are mainly for home students funded by Student Finance England.
const homeProviders = new Set([
  "UK Management College",
  "London School of Commerce",
  "University of the West of Scotland (London)",
  "London College of Contemporary Arts",
  "Anglia Ruskin University London",
  "Regent College London",
  "Oxford Business College",
]);

export function categoryFor(name: string, categories: CourseCategory[] = seedCategories) {
  const n = name.toLowerCase();
  // Pathways first, so "Business with Foundation Year" lands in Foundation & Pathways.
  const ordered = [...categories].sort((a, b) => Number(b.id === "foundation") - Number(a.id === "foundation"));
  return ordered.find((c) => c.keywords.some((k) => n.includes(k)))?.id ?? categories[0]?.id ?? "";
}

const initials = (s: string) => s.replace(/\(.*?\)/g, "").split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join("").slice(0, 4);

function seedCourses(): Course[] {
  const rows: Course[] = [];
  let n = 1;
  catalog.forEach((u: CatalogUniversity, ui) => {
    u.courses.forEach((c, ci) => {
      const level = c.level as CourseLevel;
      const levelInfo = seedLevels.find((l) => l.name === level)!;
      const home = homeProviders.has(u.name);
      const currency = currencyFor[u.country] ?? "GBP";
      const base = { Foundation: 9250, Undergraduate: 15500, "Pre-Master's": 8500, Postgraduate: 17000, PhD: 18500 }[level];
      const k = (ui * 7 + ci * 3) % 5;
      const scale = currency === "GBP" ? 1 : currency === "EUR" ? 1.1 : currency === "AUD" ? 2.2 : currency === "CAD" ? 1.9 : currency === "USD" ? 2.3 : 3.5;
      const intl = home ? 0 : Math.round(((base + k * 500) * scale) / 50) * 50;
      const duration = level === "Postgraduate" ? (/placement/i.test(c.name) ? 24 : 12) : level === "Undergraduate" ? (u.country === "Australia" ? 36 : u.country === "United States" || u.country === "China" ? 48 : 36) : level === "PhD" ? 36 : level === "Pre-Master's" ? 6 : 12;
      const pgMonths = level === "Postgraduate" && u.country === "United States" ? 24 : duration;
      rows.push({
        id: `CRS-${String(n++).padStart(3, "0")}`,
        code: `${initials(u.name)}-${initials(c.name) || "C"}${ci + 1}`.toUpperCase(),
        name: c.name,
        institution: u.name,
        country: u.country,
        campuses: u.campuses,
        level,
        categoryId: categoryFor(c.name),
        duration: pgMonths,
        modes: home ? (k % 2 ? ["Blended", "Weekend"] : ["Blended"]) : ["Full time"],
        intakes: u.country === "United Kingdom" ? (k % 3 === 0 ? ["Sep 2026", "Jan 2027", "May 2027"] : ["Jan 2027", "Sep 2027"]) : u.country === "Australia" ? ["Feb 2027", "Jul 2027"] : ["Jan 2027", "Sep 2027"],
        deadline: u.country === "United Kingdom" ? "2026-11-20" : undefined,
        placement: /placement|robotics|data science/i.test(c.name),
        currency,
        intlFee: intl,
        homeFee: u.country === "United Kingdom" && (home || level !== "Postgraduate") ? 9535 : 0,
        deposit: home ? 0 : currency === "GBP" ? (level === "Postgraduate" ? 4000 : 3000) : Math.round((intl * 0.25) / 100) * 100,
        scholarship: home ? "" : k < 2 ? `Up to ${currencySymbol[currency]}${(2000 * scale).toLocaleString()} merit scholarship` : "",
        studentFinance: home,
        academicRequirement: levelInfo.academicRequirement,
        ieltsOverall: levelInfo.ieltsOverall,
        ieltsMin: levelInfo.ieltsMin,
        moiAccepted: !home && level !== "PhD" && k % 2 === 0,
        workExperience: /mba/i.test(c.name) ? "2 years' professional experience" : "",
        documents: levelInfo.documents,
        description: `${c.name} at ${u.name}${u.campuses.length ? `, ${u.campuses.join(", ")} campus${u.campuses.length > 1 ? "es" : ""}` : ""}.`,
        status: "Published",
        onWebsite: true,
        featured: k === 0 && !home,
        updatedAt: `2026-0${7 + (k % 3)}-${String(3 + ((ui * 5 + ci) % 25)).padStart(2, "0")}T10:00:00Z`,
        updatedBy: ["Alif Tasnim", "Sadman Rahman", "Ummay Saiha Limu", "Bickey Shah"][(ui + ci) % 4],
      });
    });
  });
  // A few not-yet-live and closed courses for a realistic list.
  rows.push(
    { ...rows[21], id: `CRS-${String(n++).padStart(3, "0")}`, code: "UH-MSCCS", name: "MSc Cyber Security", categoryId: "computing", status: "Draft", onWebsite: false, featured: false, intakes: ["Sep 2027"], updatedAt: "2026-09-15T09:30:00Z", updatedBy: "Sadman Rahman", description: "New for September 2027 — awaiting fee confirmation from the university." },
    { ...rows[25], id: `CRS-${String(n++).padStart(3, "0")}`, code: "CU-MSCN", name: "MSc Nursing (Adult)", categoryId: "health", status: "Draft", onWebsite: false, featured: false, intakes: ["Jan 2027"], updatedAt: "2026-09-12T11:00:00Z", updatedBy: "Alif Tasnim", description: "Requires NMC-recognised nursing degree. Waiting for the entry requirement sheet." },
    { ...rows[33], id: `CRS-${String(n++).padStart(3, "0")}`, code: "DMU-LLMIBL", name: "LLM International Business Law", categoryId: "law", scholarship: "", featured: false, updatedAt: "2026-09-02T10:00:00Z", updatedBy: "Bickey Shah", description: "One-year LLM for law graduates covering international trade, commercial and corporate law." },
    { ...rows[26], id: `CRS-${String(n++).padStart(3, "0")}`, code: "CU-MSCEM", name: "MSc Engineering Management", categoryId: "engineering", status: "Closed", onWebsite: false, featured: false, intakes: ["Sep 2026"], updatedAt: "2026-08-01T10:00:00Z", updatedBy: "Bickey Shah", description: "Closed for international students for 2026/27 — reopening September 2027." },
  );
  return rows;
}

// --- Store ---------------------------------------------------------------------

let courses: Course[] | null = null;
let categories: CourseCategory[] = seedCategories;
let levels: StudyLevel[] = seedLevels;

export function getCourses() {
  return (courses ??= seedCourses());
}
export function saveCourses(next: Course[]) {
  courses = next;
}
export function getCourse(id: string) {
  return getCourses().find((c) => c.id === id);
}
export function nextCourseId() {
  const max = Math.max(0, ...getCourses().map((c) => Number(c.id.slice(4)) || 0));
  return `CRS-${String(max + 1).padStart(3, "0")}`;
}

export function getCategories() {
  return categories;
}
export function saveCategories(next: CourseCategory[]) {
  categories = next;
}
export function getLevels() {
  return levels;
}
export function saveLevels(next: StudyLevel[]) {
  levels = next;
}

/** The last add/edit, so the list it returns to can confirm it. */
let lastChange: { id: string; verb: "added" | "updated" } | null = null;
export function markCourseChange(id: string, verb: "added" | "updated") {
  lastChange = { id, verb };
}
export function getCourseChange() {
  return lastChange;
}
export function clearCourseChange() {
  lastChange = null;
}

/** Institutions a course can belong to, with their country and campuses. */
export function institutionOptions() {
  const map = new Map<string, { country: string; campuses: string[] }>();
  catalog.forEach((u) => map.set(u.name, { country: u.country, campuses: u.campuses }));
  getInstitutions().forEach((i) => {
    if (!map.has(i.name)) map.set(i.name, { country: i.country, campuses: i.city.split(/\s*[&,]\s*/).filter(Boolean) });
  });
  getCourses().forEach((c) => {
    const cur = map.get(c.institution);
    map.set(c.institution, { country: c.country, campuses: [...new Set([...(cur?.campuses ?? []), ...c.campuses])] });
  });
  return [...map.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => a.name.localeCompare(b.name));
}

/** Applications per course, keyed "institution|course". */
export function applicationCounts() {
  const map = new Map<string, { total: number; enrolled: number; open: number }>();
  for (const a of getApplications()) {
    const key = `${a.university}|${a.course}`;
    const m = map.get(key) ?? { total: 0, enrolled: 0, open: 0 };
    m.total++;
    if (a.stage === "Enrolled") m.enrolled++;
    else if (a.stage !== "Rejected" && a.stage !== "Withdrawn") m.open++;
    map.set(key, m);
  }
  return (c: Pick<Course, "institution" | "name">) => map.get(`${c.institution}|${c.name}`) ?? { total: 0, enrolled: 0, open: 0 };
}

/**
 * Published courses grouped by institution, in the shape the application
 * course picker uses — so a course added here can be chosen on an application.
 */
export function liveCatalog(): CatalogUniversity[] {
  const byUni = new Map<string, CatalogUniversity>();
  for (const c of getCourses()) {
    if (c.status !== "Published") continue;
    const u = byUni.get(c.institution) ?? { name: c.institution, country: c.country, campuses: [], courses: [] };
    u.campuses = [...new Set([...u.campuses, ...c.campuses])];
    u.courses.push({ name: c.name, level: (["Foundation", "Undergraduate", "Pre-Master's", "Postgraduate", "PhD"].includes(c.level) ? c.level : "Postgraduate") as CourseLevel });
    byUni.set(c.institution, u);
  }
  return [...byUni.values()];
}

export function durationLabel(months: number) {
  if (months % 12 === 0) return `${months / 12} year${months === 12 ? "" : "s"}`;
  if (months > 12) return `${(months / 12).toFixed(1).replace(/\.0$/, "")} years`;
  return `${months} months`;
}

/** Intakes still open for applications, relative to the demo's "today". */
export function openIntakes(c: Course) {
  const order = catalogIntakes;
  return c.intakes.filter((i) => order.indexOf(i) >= order.indexOf("Oct 2026")).sort((a, b) => order.indexOf(a) - order.indexOf(b));
}
