// Course catalogue used by the application course manager:
// country → university → courses (with level), campuses and intakes.

export type CourseLevel = "Foundation" | "Undergraduate" | "Pre-Master's" | "Postgraduate" | "PhD";
export type DeliveryMode = "Full time" | "Part time" | "Blended" | "Online" | "Weekend";

export const courseLevels: CourseLevel[] = ["Foundation", "Undergraduate", "Pre-Master's", "Postgraduate", "PhD"];
export const deliveryModes: DeliveryMode[] = ["Full time", "Part time", "Blended", "Online", "Weekend"];
export const catalogIntakes = ["Sep 2026", "Oct 2026", "Jan 2027", "Feb 2027", "Mar 2027", "May 2027", "Jul 2027", "Sep 2027"];

export interface CatalogUniversity {
  name: string;
  country: string;
  campuses: string[];
  courses: { name: string; level: CourseLevel }[];
}

const ug = (name: string) => ({ name, level: "Undergraduate" as const });
const pg = (name: string) => ({ name, level: "Postgraduate" as const });
const fd = (name: string) => ({ name, level: "Foundation" as const });

export const catalog: CatalogUniversity[] = [
  // United Kingdom — private and partner providers
  { name: "UK Management College", country: "United Kingdom", campuses: ["London", "Manchester", "Birmingham", "Newcastle"], courses: [ug("BA (Hons) Business Management"), ug("BA (Hons) Digital Marketing"), fd("CertHE Business")] },
  { name: "London School of Commerce", country: "United Kingdom", campuses: ["London", "Manchester"], courses: [fd("CertHE Business with Foundation Year"), ug("BSc (Hons) Business and Tourism"), ug("BA (Hons) Business Management")] },
  { name: "University of the West of Scotland (London)", country: "United Kingdom", campuses: ["London"], courses: [fd("CertHE Business"), pg("MSc Project Management"), pg("MBA")] },
  { name: "London College of Contemporary Arts", country: "United Kingdom", campuses: ["London"], courses: [ug("BA (Hons) Graphic Design"), ug("BA (Hons) Fashion Business"), pg("MA Interior Design")] },
  { name: "Anglia Ruskin University London", country: "United Kingdom", campuses: ["London"], courses: [ug("LLB (Hons) Law with Foundation Year"), ug("BSc (Hons) Accounting and Finance"), pg("MSc Project Management")] },
  { name: "Anglia Ruskin University", country: "United Kingdom", campuses: ["Cambridge", "Chelmsford"], courses: [pg("MBA International Business"), pg("MSc Public Health")] },
  { name: "Regent College London", country: "United Kingdom", campuses: ["London", "Newcastle", "Birmingham"], courses: [fd("BSc (Hons) Health and Social Care with Foundation Year"), ug("BSc (Hons) Business Management")] },
  { name: "Oxford Business College", country: "United Kingdom", campuses: ["Manchester", "Nottingham", "London"], courses: [ug("BA (Hons) Business and Management"), fd("HND Business")] },
  // United Kingdom — universities
  { name: "University of Hertfordshire", country: "United Kingdom", campuses: ["Hatfield"], courses: [pg("MSc Data Science"), pg("MSc Artificial Intelligence and Robotics"), fd("International Foundation Programme")] },
  { name: "Coventry University", country: "United Kingdom", campuses: ["Coventry", "London"], courses: [ug("BSc (Hons) Computer Science"), pg("MSc Global Healthcare Management"), pg("MBA Global")] },
  { name: "University of Greenwich", country: "United Kingdom", campuses: ["London"], courses: [pg("MSc Project Management"), ug("BSc (Hons) Computer Science"), pg("MSc Data Analytics")] },
  { name: "Ulster University (Birmingham)", country: "United Kingdom", campuses: ["Birmingham", "London"], courses: [pg("MSc Data Science"), pg("MSc International Business"), { name: "Pre-Master's Business", level: "Pre-Master's" }] },
  { name: "De Montfort University", country: "United Kingdom", campuses: ["Leicester"], courses: [pg("MSc Cyber Security"), ug("BEng (Hons) Mechanical Engineering")] },
  { name: "Teesside University", country: "United Kingdom", campuses: ["Middlesbrough", "London"], courses: [ug("BEng (Hons) Civil Engineering"), pg("MSc Computer Science")] },
  { name: "University of Sunderland in London", country: "United Kingdom", campuses: ["London"], courses: [pg("MSc International Business"), ug("BA (Hons) Business and Management")] },
  // Other destinations
  { name: "National College of Ireland", country: "Ireland", campuses: ["Dublin"], courses: [pg("MSc Fintech"), pg("MSc Data Analytics")] },
  { name: "Australian Catholic University", country: "Australia", campuses: ["Sydney", "Melbourne", "Brisbane"], courses: [pg("Master of Business Administration"), ug("Bachelor of Nursing"), pg("Master of Information Technology")] },
  { name: "Deakin University", country: "Australia", campuses: ["Melbourne", "Geelong"], courses: [pg("Master of Information Technology"), pg("Master of Public Health")] },
  { name: "York University", country: "Canada", campuses: ["Toronto"], courses: [pg("MSc Computer Science"), ug("BA Economics")] },
  { name: "Northeastern University", country: "United States", campuses: ["Boston", "Seattle"], courses: [pg("MS Project Management"), pg("MS Data Analytics Engineering")] },
  { name: "Nanjing University of Information Science & Technology", country: "China", campuses: ["Nanjing"], courses: [ug("BSc in Computer Science and Technology"), ug("BEng Electronic Information Engineering")] },
];

export const catalogCountries = [...new Set(catalog.map((u) => u.country))].sort();

export function findUniversity(name: string) {
  return catalog.find((u) => u.name === name);
}

/** Best-guess level from a course title, for records without one. */
export function levelFor(course: string): CourseLevel {
  const c = course.toLowerCase();
  if (/foundation|certhe|hnd|pre-master/.test(c)) return c.includes("pre-master") ? "Pre-Master's" : "Foundation";
  if (/^(msc|ms |ma |mba|llm|master|pg)/.test(c)) return "Postgraduate";
  if (/phd|doctor/.test(c)) return "PhD";
  return "Undergraduate";
}
