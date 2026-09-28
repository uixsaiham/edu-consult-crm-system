// Course finder: the list of course names the AI agent returns for one university, the live
// progress events streamed while it works, and a validator for the model's output.

export const researchLevels = ["Foundation", "Undergraduate", "Pre-Master's", "Postgraduate", "PhD"] as const;
export type ResearchLevel = (typeof researchLevels)[number];
export type ResearchFocus = "All levels" | "Undergraduate" | "Postgraduate";

export interface FoundCourse {
  name: string;
  level: ResearchLevel;
}

export interface CourseList {
  university: string;
  country: string;
  domain: string;
  website: string;
  courses: FoundCourse[];
  sources: string[];
}

export type FinderEvent =
  | { type: "status"; message: string }
  | { type: "search"; query: string }
  | { type: "fetch"; url: string }
  | { type: "result"; courses: FoundCourse[]; sources: string[] }
  | { type: "error"; message: string };

export const courseListSchema = {
  type: "object",
  additionalProperties: false,
  required: ["courses", "sources"],
  properties: {
    courses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "level"],
        properties: {
          name: { type: "string", description: "Full course title including the award, exactly as the university writes it, e.g. 'MSc Data Science', 'BA (Hons) Business Management'" },
          level: { type: "string", enum: [...researchLevels] },
        },
      },
    },
    sources: { type: "array", items: { type: "string" }, description: "Official course-list page URLs used" },
  },
} as const;

/** Keeps only well-formed, de-duplicated course names from the model's tool input. */
export function sanitizeCourses(input: unknown): { courses: FoundCourse[]; sources: string[] } {
  const root = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const seen = new Set<string>();
  const courses = (Array.isArray(root.courses) ? root.courses : [])
    .map((c): FoundCourse | null => {
      const x = c && typeof c === "object" ? (c as Record<string, unknown>) : {};
      const name = typeof x.name === "string" ? x.name.replace(/\s+/g, " ").trim().slice(0, 200) : "";
      if (name.length < 3) return null;
      const level = researchLevels.includes(x.level as ResearchLevel) ? (x.level as ResearchLevel) : "Undergraduate";
      return { name, level };
    })
    .filter((c): c is FoundCourse => !!c && !seen.has(c.name.toLowerCase()) && !!seen.add(c.name.toLowerCase()))
    .slice(0, 300);
  const sources = (Array.isArray(root.sources) ? root.sources : []).filter((s): s is string => typeof s === "string" && /^https?:\/\/\S+$/i.test(s)).slice(0, 10);
  return { courses, sources };
}
