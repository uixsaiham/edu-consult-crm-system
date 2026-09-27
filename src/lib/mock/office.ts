// Office module: branches, front-desk visits, the shared essential folder,
// general questions (FAQ) and the branch notice board. Edits are kept for the
// session until the backend exists.
import { getStaff, staffBranches } from "./staff";

// --- Branches -----------------------------------------------------------------------

export const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type WeekDay = (typeof weekDays)[number];
export type BranchStatus = "Open" | "Temporarily closed" | "Inactive";
export type BranchType = "Head office" | "Branch" | "Satellite";

export interface OpeningHours {
  day: WeekDay;
  open: string;
  close: string;
  closed: boolean;
}

export interface Branch {
  id: string;
  name: string;
  type: BranchType;
  city: string;
  country: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  managerId: string;
  timezone: "Asia/Dhaka" | "Europe/London";
  hours: OpeningHours[];
  services: string[];
  rooms: number;
  status: BranchStatus;
  openedOn: string;
  holidays: { date: string; label: string }[];
  notes?: string;
}

export const branchServices = [
  "Walk-in counselling",
  "Appointment counselling",
  "IELTS / PTE mock tests",
  "Visa file review",
  "Student Finance help",
  "Document certification",
  "Pre-departure briefing",
  "Agent partner support",
];

const hours = (open: string, close: string, closedDays: WeekDay[], short?: { day: WeekDay; close: string }): OpeningHours[] =>
  weekDays.map((day) => ({ day, open, close: short?.day === day ? short.close : close, closed: closedDays.includes(day) }));

const seedBranches: Branch[] = [
  {
    id: "BR-DHK", name: "Dhaka HQ", type: "Head office", city: "Dhaka", country: "Bangladesh",
    address: "House 42, Road 11, Banani, Dhaka 1213", phone: "+880 2 5504 1122", whatsapp: "+880 1711-223344", email: "dhaka@bheuni.com",
    managerId: "STF-002", timezone: "Asia/Dhaka", hours: hours("10:00", "19:00", ["Fri"], { day: "Sat", close: "17:00" }),
    services: ["Walk-in counselling", "Appointment counselling", "IELTS / PTE mock tests", "Visa file review", "Document certification", "Pre-departure briefing", "Agent partner support"],
    rooms: 8, status: "Open", openedOn: "2018-03-01",
    holidays: [{ date: "2026-10-01", label: "Durga Puja" }, { date: "2026-10-02", label: "Durga Puja" }, { date: "2026-12-16", label: "Victory Day" }],
  },
  {
    id: "BR-SYL", name: "Sylhet", type: "Branch", city: "Sylhet", country: "Bangladesh",
    address: "Level 4, Al-Hamra Shopping City, Zindabazar, Sylhet 3100", phone: "+880 821 712 334", whatsapp: "+880 1819-445120", email: "sylhet@bheuni.com",
    managerId: "STF-007", timezone: "Asia/Dhaka", hours: hours("10:00", "18:30", ["Fri"]),
    services: ["Walk-in counselling", "Appointment counselling", "IELTS / PTE mock tests", "Visa file review", "Agent partner support"],
    rooms: 4, status: "Open", openedOn: "2021-05-20",
    holidays: [{ date: "2026-10-01", label: "Durga Puja" }, { date: "2026-10-02", label: "Durga Puja" }, { date: "2026-12-16", label: "Victory Day" }],
  },
  {
    id: "BR-LON", name: "London", type: "Branch", city: "London", country: "United Kingdom",
    address: "Suite 3.02, 1 Whitechapel High Street, London E1 7PT", phone: "+44 20 3984 5510", whatsapp: "+44 7700 900120", email: "london@bheuni.com",
    managerId: "STF-010", timezone: "Europe/London", hours: hours("09:30", "18:00", ["Sun"], { day: "Sat", close: "14:00" }),
    services: ["Walk-in counselling", "Appointment counselling", "Student Finance help", "Visa file review", "Document certification"],
    rooms: 5, status: "Open", openedOn: "2020-09-07",
    holidays: [{ date: "2026-12-25", label: "Christmas Day" }, { date: "2026-12-26", label: "Boxing Day" }],
  },
  {
    id: "BR-MAN", name: "Manchester", type: "Branch", city: "Manchester", country: "United Kingdom",
    address: "Floor 2, 55 Oldham Street, Manchester M1 1JR", phone: "+44 161 820 4471", whatsapp: "+44 7700 900233", email: "manchester@bheuni.com",
    managerId: "STF-015", timezone: "Europe/London", hours: hours("09:30", "17:30", ["Sun"], { day: "Sat", close: "13:00" }),
    services: ["Walk-in counselling", "Appointment counselling", "Student Finance help"],
    rooms: 3, status: "Open", openedOn: "2022-01-10",
    holidays: [{ date: "2026-12-25", label: "Christmas Day" }, { date: "2026-12-26", label: "Boxing Day" }],
  },
  {
    id: "BR-MK", name: "Milton Keynes", type: "Satellite", city: "Milton Keynes", country: "United Kingdom",
    address: "Unit 12, Bradbourne Drive, Tilbrook, Milton Keynes MK7 8AT", phone: "+44 1908 889 120", whatsapp: "+44 7700 900344", email: "mk@bheuni.com",
    managerId: "STF-016", timezone: "Europe/London", hours: hours("10:00", "17:00", ["Sat", "Sun"]),
    services: ["Appointment counselling", "Student Finance help", "Visa file review"],
    rooms: 2, status: "Temporarily closed", openedOn: "2023-10-02",
    holidays: [{ date: "2026-12-25", label: "Christmas Day" }],
    notes: "Closed for refurbishment until 28 Sep — appointments moved online.",
  },
];

let branches: Branch[] = seedBranches;
export function getBranches() {
  return branches;
}
export function saveBranches(next: Branch[]) {
  branches = next;
}

/** All branch names, including ones the staff directory doesn't know yet. */
export function branchNames() {
  return [...new Set([...staffBranches, ...branches.map((b) => b.name)])];
}

/** Live open/closed state in the branch's own time zone. */
export function openState(b: Branch, at = new Date()) {
  if (b.status !== "Open") return { open: false, label: b.status };
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: b.timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = get("weekday") as WeekDay;
  const time = `${get("hour")}:${get("minute")}`;
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  const holiday = b.holidays.find((h) => h.date === date);
  if (holiday) return { open: false, label: `Closed · ${holiday.label}` };
  const today = b.hours.find((h) => h.day === day);
  if (!today || today.closed) return { open: false, label: "Closed today" };
  if (time < today.open) return { open: false, label: `Opens ${today.open}` };
  if (time >= today.close) return { open: false, label: "Closed for the day" };
  return { open: true, label: `Open · closes ${today.close}` };
}

export function localTime(b: Branch, at = new Date()) {
  return at.toLocaleTimeString("en-GB", { timeZone: b.timezone, hour: "2-digit", minute: "2-digit" });
}

// --- Front office -------------------------------------------------------------------

export const visitPurposes = [
  "New enquiry",
  "Counselling appointment",
  "Document submission",
  "Visa query",
  "Payment / deposit",
  "IELTS / PTE mock test",
  "Collect documents",
  "Other",
] as const;
export type VisitPurpose = (typeof visitPurposes)[number];
export type VisitStatus = "Expected" | "Waiting" | "In session" | "Done" | "No-show" | "Left";

export interface Visit {
  id: string;
  token: string;
  branch: string;
  name: string;
  phone: string;
  email: string;
  purpose: VisitPurpose;
  kind: "Walk-in" | "Appointment";
  /** Booked time for appointments. */
  scheduledAt?: number;
  counsellor: string;
  status: VisitStatus;
  checkedInAt?: number;
  startedAt?: number;
  endedAt?: number;
  notes: string;
  leadId?: string;
}

let visits: Visit[] | null = null;

/** Seeded around the moment the page first loads so the queue looks live. */
function seedVisits(): Visit[] {
  const now = Date.now();
  const m = (mins: number) => now + mins * 60000;
  type Seed = Omit<Visit, "id" | "email" | "notes"> & Partial<Pick<Visit, "email" | "notes">>;
  const rows: Seed[] = [
    { token: "A-001", branch: "Dhaka HQ", name: "Rafiul Hasan", phone: "+880 1712-450981", purpose: "Counselling appointment", kind: "Appointment", scheduledAt: m(-150), counsellor: "Alif Tasnim", status: "Done", checkedInAt: m(-155), startedAt: m(-148), endedAt: m(-110), notes: "Shortlisted Coventry and Greenwich for Jan 2027." },
    { token: "A-002", branch: "Dhaka HQ", name: "Sumaiya Akter", phone: "+880 1819-220145", purpose: "Document submission", kind: "Walk-in", counsellor: "Md. Shariful Islam", status: "Done", checkedInAt: m(-120), startedAt: m(-112), endedAt: m(-98), notes: "Submitted HSC transcript and passport copy." },
    { token: "A-003", branch: "Dhaka HQ", name: "Tanzim Chowdhury", phone: "+880 1911-334509", purpose: "Visa query", kind: "Walk-in", counsellor: "Ummay Saiha Limu", status: "In session", checkedInAt: m(-34), startedAt: m(-18) },
    { token: "A-004", branch: "Dhaka HQ", name: "Nabila Rahman", phone: "+880 1716-908712", email: "nabila.r@gmail.com", purpose: "New enquiry", kind: "Walk-in", counsellor: "", status: "Waiting", checkedInAt: m(-22), notes: "Interested in MSc Public Health, UK." },
    { token: "A-005", branch: "Dhaka HQ", name: "Mahin Islam", phone: "+880 1612-554390", purpose: "Payment / deposit", kind: "Walk-in", counsellor: "", status: "Waiting", checkedInAt: m(-9) },
    { token: "A-006", branch: "Dhaka HQ", name: "Ayesha Siddiqua", phone: "+880 1733-778120", email: "ayesha.sid@gmail.com", purpose: "Counselling appointment", kind: "Appointment", scheduledAt: m(-5), counsellor: "Youna", status: "Expected" },
    { token: "A-007", branch: "Dhaka HQ", name: "Imtiaz Karim", phone: "+880 1815-662013", purpose: "IELTS / PTE mock test", kind: "Appointment", scheduledAt: m(40), counsellor: "Nusrat Jahan Mim", status: "Expected" },
    { token: "A-008", branch: "Dhaka HQ", name: "Farzana Haque", phone: "+880 1918-003477", purpose: "Counselling appointment", kind: "Appointment", scheduledAt: m(95), counsellor: "Alif Tasnim", status: "Expected" },
    { token: "A-009", branch: "Dhaka HQ", name: "Sabbir Hossain", phone: "+880 1721-448805", purpose: "Counselling appointment", kind: "Appointment", scheduledAt: m(-70), counsellor: "Md. Shariful Islam", status: "No-show" },
    { token: "B-001", branch: "Sylhet", name: "Jubair Ahmed", phone: "+880 1716-112098", purpose: "New enquiry", kind: "Walk-in", counsellor: "", status: "Waiting", checkedInAt: m(-14) },
    { token: "B-002", branch: "Sylhet", name: "Tahmina Begum", phone: "+880 1817-556210", purpose: "Counselling appointment", kind: "Appointment", scheduledAt: m(30), counsellor: "Harunor Rashid", status: "Expected" },
    { token: "C-001", branch: "London", name: "Andrei Popescu", phone: "+44 7700 900871", email: "andrei.p@gmail.com", purpose: "Counselling appointment", kind: "Appointment", scheduledAt: m(-20), counsellor: "N. Bintay Zaman", status: "In session", checkedInAt: m(-24), startedAt: m(-19) },
    { token: "C-002", branch: "London", name: "Chioma Eze", phone: "+44 7700 900612", purpose: "New enquiry", kind: "Walk-in", counsellor: "", status: "Waiting", checkedInAt: m(-6) },
    { token: "D-001", branch: "Manchester", name: "Bilal Hussain", phone: "+44 7700 900455", purpose: "Counselling appointment", kind: "Appointment", scheduledAt: m(60), counsellor: "Nusrat Choudhury", status: "Expected" },
  ];
  return rows.map((v, i) => ({ id: `VIS-${1000 + i}`, email: "", notes: "", ...v }));
}

export function getVisits() {
  return (visits ??= seedVisits());
}
export function saveVisits(next: Visit[]) {
  visits = next;
}

/** Next queue token for a branch: A-… for Dhaka, B-… for Sylhet and so on. */
export function nextToken(branch: string, list: Visit[]) {
  const letter = String.fromCharCode(65 + Math.max(0, branchNames().indexOf(branch)));
  const n = list.filter((v) => v.branch === branch).reduce((max, v) => Math.max(max, Number(v.token.split("-")[1]) || 0), 0);
  return `${letter}-${String(n + 1).padStart(3, "0")}`;
}

const roleOrder = ["counsellor", "senior-counsellor", "compliance", "branch-manager", "admissions-lead"];

/** Staff who can see visitors at a branch today — counsellors first, managers last. */
export function branchCounsellors(branch: string) {
  return getStaff()
    .filter((s) => s.branch === branch && s.status === "Active" && s.capacity > 0)
    .sort((a, b) => roleOrder.indexOf(a.roleId) - roleOrder.indexOf(b.roleId))
    .map((s) => s.name);
}

// --- Essential folder ------------------------------------------------------------

export interface Folder {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface OfficeFile {
  id: string;
  folderId: string;
  name: string;
  size: number;
  updatedAt: string;
  updatedBy: string;
  tags: string[];
  starred: boolean;
  /** Public URL (bundled file or an upload from this session). */
  url?: string;
  /** Text content for templates and checklists, shown in the preview. */
  content?: string;
}

const seedFolders: Folder[] = [
  { id: "visa", name: "Visa & compliance", description: "UKVI guidance, CAS checklists, credibility interview prep", color: "bg-rose-500" },
  { id: "agreements", name: "Agreements & policies", description: "Agent agreement, university contracts, company policies", color: "bg-primary" },
  { id: "forms", name: "Forms & templates", description: "Intake forms, email and WhatsApp templates", color: "bg-teal-500" },
  { id: "universities", name: "University guides", description: "Entry requirements, fees and scholarship sheets", color: "bg-violet-500" },
  { id: "marketing", name: "Marketing & brand", description: "Logos, brochure copy, social media guidelines", color: "bg-amber-500" },
  { id: "admin", name: "Office admin", description: "Opening procedures, IT, health & safety", color: "bg-sky-500" },
];

const text = (lines: string[]) => lines.join("\n");
const sizeOf = (s: string) => new Blob([s]).size;

const fileSeeds: Omit<OfficeFile, "size">[] = [
  {
    id: "F-001", folderId: "visa", name: "UK Student visa document checklist.txt", updatedAt: "2026-09-12T10:20:00Z", updatedBy: "Emma Watson", tags: ["UKVI", "Checklist"], starred: true,
    content: text([
      "UK STUDENT VISA — DOCUMENT CHECKLIST (BHE, Sept 2026)",
      "",
      "1. Valid passport (and any previous passports)",
      "2. CAS number from the university",
      "3. Proof of funds — held for 28 consecutive days, ending no more than 31 days before applying",
      "   • London: £1,483 per month for up to 9 months",
      "   • Outside London: £1,136 per month for up to 9 months",
      "   • Plus any unpaid first-year tuition fees",
      "4. Academic documents listed on the CAS",
      "5. English language evidence (if listed on the CAS)",
      "6. TB test certificate (Bangladesh, Nigeria, Pakistan and other listed countries)",
      "7. ATAS certificate (if the course requires it)",
      "8. Parental consent letter and birth certificate if under 18",
      "",
      "Counsellor check: log the 28-day funds review as a note on the application before submission.",
    ]),
  },
  {
    id: "F-002", folderId: "visa", name: "Credibility interview question bank.txt", updatedAt: "2026-09-14T09:00:00Z", updatedBy: "Emma Watson", tags: ["CAS", "Interview"], starred: false,
    content: text([
      "PRE-CAS CREDIBILITY INTERVIEW — PRACTICE QUESTIONS",
      "",
      "About the course",
      "• Why did you choose this course and this university?",
      "• Name two modules and explain how they relate to your career plan.",
      "• How does this course build on your previous studies or work?",
      "",
      "About finances",
      "• Who is paying for your studies and what do they do?",
      "• How much are your tuition fees and living costs?",
      "",
      "About plans",
      "• What will you do after you finish the course?",
      "• Why not study this course in your home country?",
      "",
      "Tip: students should answer in their own words — scripted answers are a red flag.",
    ]),
  },
  {
    id: "F-003", folderId: "visa", name: "Refusal reasons tracker 2026.csv", updatedAt: "2026-09-02T15:40:00Z", updatedBy: "David Miller", tags: ["Visa", "Report"], starred: false,
    content: text([
      "Month,Applications,Refusals,Top reason",
      "Jan,142,6,Funds held under 28 days",
      "Feb,98,4,Credibility interview",
      "Mar,77,3,Missing TB certificate",
      "Apr,64,2,Funds held under 28 days",
      "May,81,5,Credibility interview",
      "Jun,120,4,Incorrect bank letter",
      "Jul,188,7,Funds held under 28 days",
      "Aug,236,9,Credibility interview",
    ]),
  },
  { id: "F-004", folderId: "agreements", name: "BHE Agent Agreement & Partner Policy.pdf", updatedAt: "2026-09-01T09:00:00Z", updatedBy: "Sadman Rahman", tags: ["Agents", "Policy"], starred: true, url: "/docs/bhe-agent-agreement-and-policy.pdf" },
  {
    id: "F-005", folderId: "agreements", name: "Data protection policy (staff summary).txt", updatedAt: "2026-06-10T11:00:00Z", updatedBy: "Mahbuba Akhter", tags: ["GDPR", "Policy"], starred: false,
    content: text([
      "DATA PROTECTION — WHAT EVERY BHE STAFF MEMBER MUST DO",
      "",
      "• Only store student documents in the CRM — never in personal email, WhatsApp galleries or USB drives.",
      "• Share passports and bank statements with universities through their portals only.",
      "• Lock your screen whenever you leave your desk.",
      "• Report a suspected data breach to compliance@bhe-consultancy.co.uk within 24 hours.",
      "• Delete paper copies in the confidential shredding bin, not the general bin.",
    ]),
  },
  {
    id: "F-006", folderId: "forms", name: "Walk-in enquiry form.txt", updatedAt: "2026-08-20T08:30:00Z", updatedBy: "Shirin Sultana", tags: ["Front desk", "Form"], starred: true,
    content: text([
      "BHE — WALK-IN ENQUIRY FORM",
      "",
      "Full name: ______________________   Date: ___________",
      "Phone / WhatsApp: ______________   Email: ___________________",
      "Highest qualification: __________   Year: _____   Result: _____",
      "English test: IELTS / PTE / Duolingo / None   Score: _____",
      "Preferred country: UK / Ireland / Canada / Australia / Other",
      "Preferred intake: Jan / May / Sep   Year: _____",
      "Budget for tuition (per year): __________",
      "How did you hear about us? Facebook / Google / Fair / Friend / Agent",
      "",
      "Consent: I agree BHE may contact me about study options. Signature: __________",
    ]),
  },
  {
    id: "F-007", folderId: "forms", name: "WhatsApp reply templates.txt", updatedAt: "2026-09-10T13:15:00Z", updatedBy: "Rumana Akter", tags: ["WhatsApp", "Template"], starred: false,
    content: text([
      "FIRST REPLY",
      "Hi {name}, thanks for contacting BHE! I'm {counsellor}, your education counsellor. When would be a good time for a 10-minute call about your study plans?",
      "",
      "DOCUMENT REMINDER",
      "Hi {name}, just a reminder that we still need your {document} to submit your application to {university}. You can reply here with a clear photo or PDF.",
      "",
      "APPOINTMENT CONFIRMATION",
      "Hi {name}, your appointment at BHE {branch} is confirmed for {date} at {time}. Please bring your passport and academic certificates.",
    ]),
  },
  {
    id: "F-008", folderId: "forms", name: "Offer acceptance email template.txt", updatedAt: "2026-07-28T10:00:00Z", updatedBy: "N. Bintay Zaman", tags: ["Email", "Template"], starred: false,
    content: text([
      "Subject: Congratulations on your offer from {university}!",
      "",
      "Dear {name},",
      "",
      "Great news — {university} has made you a {offer type} offer for {course}, starting {intake}.",
      "",
      "Next steps:",
      "1. Accept the offer on the university portal by {deadline}.",
      "2. Pay the tuition deposit of {amount} to receive your CAS.",
      "3. Start preparing your visa funds (28 days).",
      "",
      "Kind regards,",
      "{counsellor}",
      "BHE Student Consultancy",
    ]),
  },
  {
    id: "F-009", folderId: "universities", name: "Jan 2027 entry requirements — partner universities.csv", updatedAt: "2026-09-08T09:45:00Z", updatedBy: "Alif Tasnim", tags: ["Jan 2027", "Entry requirements"], starred: true,
    content: text([
      "University,Level,Academic minimum,IELTS overall,Deposit,Deadline",
      "University of Hertfordshire,PG,2:2 or CGPA 2.5/4,6.5 (5.5 each),£4000,15 Nov 2026",
      "Coventry University,PG,2:2 or CGPA 2.5/4,6.5 (5.5 each),£5000,1 Dec 2026",
      "University of Greenwich,PG,2:2 or CGPA 2.5/4,6.5 (5.5 each),£4000,20 Nov 2026",
      "De Montfort University,UG,HSC GPA 3.5/5,6.0 (5.5 each),£3000,1 Dec 2026",
      "Teesside University,PG,2:2 or CGPA 2.5/4,6.0 (5.5 each),£3000,10 Dec 2026",
      "Ulster University (Birmingham),PG,2:2 or CGPA 2.5/4,6.0 (5.5 each),£3000,1 Dec 2026",
    ]),
  },
  {
    id: "F-010", folderId: "universities", name: "Scholarships summary 2026-27.txt", updatedAt: "2026-08-30T12:00:00Z", updatedBy: "Ummay Saiha Limu", tags: ["Scholarships"], starred: false,
    content: text([
      "SCHOLARSHIPS FOR BHE STUDENTS — 2026/27",
      "",
      "• University of Hertfordshire — up to £3,000 automatic international merit award",
      "• Coventry University — £2,000 early-payment discount if deposit paid 60 days before start",
      "• University of Greenwich — £1,500–£3,000 based on previous grades",
      "• De Montfort University — £2,000 DMU Global Scholarship (limited places)",
      "",
      "Always confirm the current amounts on the university website before quoting a student.",
    ]),
  },
  {
    id: "F-011", folderId: "marketing", name: "Brand and social media guidelines.txt", updatedAt: "2026-05-14T09:00:00Z", updatedBy: "Joseph Adeyemi", tags: ["Brand"], starred: false,
    content: text([
      "BHE BRAND BASICS",
      "",
      "• Primary colour: BHE Blue #3B5BDB. Accent: Orange #F59F00.",
      "• Always write 'BHE' in capitals. Never 'Bhe' or 'B.H.E.'.",
      "• Never promise guaranteed visas or admissions in any post.",
      "• University logos only with written permission from the university.",
      "• Student success posts need the student's written consent.",
    ]),
  },
  {
    id: "F-012", folderId: "admin", name: "Office opening and closing checklist.txt", updatedAt: "2026-04-02T08:00:00Z", updatedBy: "Tanvir Ahmed", tags: ["Front desk", "Procedure"], starred: false,
    content: text([
      "OPENING (first person in)",
      "☐ Disarm alarm and switch on lights and AC",
      "☐ Switch on the queue screen and reception PC",
      "☐ Check today's appointments in Front Office",
      "☐ Put brochures and forms on the reception desk",
      "",
      "CLOSING (last person out)",
      "☐ Mark every remaining visitor as done or left in Front Office",
      "☐ Lock the document cabinet and take the key to the manager",
      "☐ Shred confidential papers",
      "☐ Switch off AC, lights and set the alarm",
    ]),
  },
  {
    id: "F-013", folderId: "admin", name: "IT and Wi-Fi guide.txt", updatedAt: "2026-02-18T14:30:00Z", updatedBy: "Sadman Rahman", tags: ["IT"], starred: false,
    content: text([
      "IT QUICK GUIDE",
      "",
      "• Staff Wi-Fi: BHE-Staff (ask your branch manager for the password — never share it with visitors)",
      "• Visitor Wi-Fi: BHE-Guest, password on the reception card",
      "• Printer: send to 'Reception-Printer' and collect with your PIN",
      "• Two-factor sign-in is required on the CRM from 1 October",
      "• IT problems: email it@bheuni.com with a screenshot",
    ]),
  },
];

let folders: Folder[] = seedFolders;
let files: OfficeFile[] = fileSeeds.map((f) => ({ ...f, size: f.content ? sizeOf(f.content) : 98_788 }));

export function getFolders() {
  return folders;
}
export function saveFolders(next: Folder[]) {
  folders = next;
}
export function getFiles() {
  return files;
}
export function saveFiles(next: OfficeFile[]) {
  files = next;
}

export function extOf(name: string) {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// --- General questions ---------------------------------------------------------------

export const faqCategories = [
  "Admissions",
  "Visa & immigration",
  "Fees & funding",
  "English tests",
  "Documents",
  "Accommodation & arrival",
  "Office & appointments",
] as const;
export type FaqCategory = (typeof faqCategories)[number];
export type FaqAudience = "Students" | "Staff only";

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  audience: FaqAudience;
  published: boolean;
  onWebsite: boolean;
  pinned: boolean;
  tags: string[];
  helpful: number;
  notHelpful: number;
  views: number;
  updatedAt: string;
  updatedBy: string;
}

const faqSeeds: Omit<Faq, "helpful" | "notHelpful" | "views">[] = [
  { id: "Q-01", category: "Admissions", question: "Which intakes can I apply for in the UK?", answer: "Most UK universities have a September intake and many also have January. Some offer May. For January 2027 most partner universities close applications between mid-November and early December, so we recommend applying at least 10 weeks before the course starts.", audience: "Students", published: true, onWebsite: true, pinned: true, tags: ["Intake", "UK"], updatedAt: "2026-09-10T10:00:00Z", updatedBy: "Alif Tasnim" },
  { id: "Q-02", category: "Admissions", question: "Can I apply with a study gap?", answer: "Yes. Most universities accept gaps if you can explain them — for example with work experience letters, training certificates or a short gap explanation letter. Gaps over 5 years for postgraduate courses usually need a stronger explanation. Your counsellor will tell you which universities are best for your profile.", audience: "Students", published: true, onWebsite: true, pinned: false, tags: ["Gap", "Eligibility"], updatedAt: "2026-08-22T09:00:00Z", updatedBy: "Harunor Rashid" },
  { id: "Q-03", category: "Visa & immigration", question: "How much money do I need to show for a UK Student visa?", answer: "You need your unpaid first-year tuition fees plus living costs: £1,483 per month in London or £1,136 per month outside London, for up to 9 months. The money must be held for 28 consecutive days, and the statement must be dated within 31 days of your visa application.", audience: "Students", published: true, onWebsite: true, pinned: true, tags: ["Funds", "28-day rule"], updatedAt: "2026-09-17T08:30:00Z", updatedBy: "Emma Watson" },
  { id: "Q-04", category: "Visa & immigration", question: "Can I work while studying in the UK?", answer: "Students on a degree-level course can usually work up to 20 hours a week during term time and full-time during official vacations. Below degree level the limit is 10 hours. The exact limit is printed on your visa (BRP or eVisa) — always check it before accepting a job.", audience: "Students", published: true, onWebsite: true, pinned: false, tags: ["Work rights"], updatedAt: "2026-07-15T12:00:00Z", updatedBy: "Emma Watson" },
  { id: "Q-05", category: "Visa & immigration", question: "Can my spouse or children come with me?", answer: "Only students on postgraduate research courses (such as a PhD) or government-sponsored courses longer than 6 months can bring dependants. Students on taught master's courses cannot bring dependants.", audience: "Students", published: true, onWebsite: true, pinned: false, tags: ["Dependants"], updatedAt: "2026-06-02T09:00:00Z", updatedBy: "David Miller" },
  { id: "Q-06", category: "Fees & funding", question: "How much deposit do I need to pay to get my CAS?", answer: "It depends on the university — usually between £3,000 and £5,000 for international students. Some universities ask for 50% of the first-year fee. Your counsellor will confirm the exact amount and deadline on your offer letter.", audience: "Students", published: true, onWebsite: true, pinned: false, tags: ["Deposit", "CAS"], updatedAt: "2026-09-01T10:00:00Z", updatedBy: "Ummay Saiha Limu" },
  { id: "Q-07", category: "Fees & funding", question: "Do I pay BHE a service charge?", answer: "No. BHE's counselling and application service is free for students applying to our partner universities — we are paid by the universities. You only pay the university's own fees (tuition, deposit) and government fees such as the visa fee and Immigration Health Surcharge.", audience: "Students", published: true, onWebsite: true, pinned: true, tags: ["Free service"], updatedAt: "2026-05-11T09:00:00Z", updatedBy: "Sadman Rahman" },
  { id: "Q-08", category: "Fees & funding", question: "Can UK home students get Student Finance for partner college courses?", answer: "Yes, if the course is approved for Student Finance England and the student meets the residency rules (usually settled or pre-settled status with 3 years' residence). Help them apply on gov.uk as soon as they have an offer — applications take 6–8 weeks.", audience: "Staff only", published: true, onWebsite: false, pinned: false, tags: ["SFE", "Home students"], updatedAt: "2026-08-05T13:00:00Z", updatedBy: "Bickey Shah" },
  { id: "Q-09", category: "English tests", question: "Which English tests are accepted?", answer: "Most partner universities accept IELTS Academic, PTE Academic and TOEFL iBT, and many accept Duolingo for undergraduate courses. Some accept an English medium of instruction (MOI) letter from your previous university. For courses below degree level, the visa needs an IELTS for UKVI or another UKVI-approved test.", audience: "Students", published: true, onWebsite: true, pinned: false, tags: ["IELTS", "PTE", "MOI"], updatedAt: "2026-08-18T09:00:00Z", updatedBy: "Alif Tasnim" },
  { id: "Q-10", category: "English tests", question: "Does BHE run IELTS mock tests?", answer: "Yes — free mock tests run at Dhaka HQ and Sylhet every Saturday at 10:00. Book through the front desk or your counsellor; results are ready the same afternoon.", audience: "Students", published: true, onWebsite: true, pinned: false, tags: ["Mock test"], updatedAt: "2026-09-03T09:00:00Z", updatedBy: "Shirin Sultana" },
  { id: "Q-11", category: "Documents", question: "Which documents do I need to start an application?", answer: "Passport, academic certificates and transcripts (SSC/HSC and bachelor's if applicable), English test result or MOI letter, CV, and a personal statement. Some courses also need reference letters or a portfolio.", audience: "Students", published: true, onWebsite: true, pinned: false, tags: ["Checklist"], updatedAt: "2026-07-30T09:00:00Z", updatedBy: "Md. Shariful Islam" },
  { id: "Q-12", category: "Documents", question: "How should front desk handle original certificates?", answer: "Never keep originals overnight. Scan them at reception, upload the scans to the student's application, give the originals back the same day and note 'originals seen' on the application.", audience: "Staff only", published: true, onWebsite: false, pinned: false, tags: ["Front desk", "Originals"], updatedAt: "2026-04-12T09:00:00Z", updatedBy: "Tanvir Ahmed" },
  { id: "Q-13", category: "Accommodation & arrival", question: "Will BHE help me find accommodation?", answer: "Yes. Once you have your CAS we share university halls and trusted private options near your campus, and help you book an airport pick-up where the university offers one.", audience: "Students", published: true, onWebsite: true, pinned: false, tags: ["Housing"], updatedAt: "2026-06-20T09:00:00Z", updatedBy: "N. Bintay Zaman" },
  { id: "Q-14", category: "Office & appointments", question: "Do I need an appointment to visit a BHE office?", answer: "No — walk-ins are welcome at Dhaka HQ, Sylhet, London and Manchester during opening hours. Booking an appointment guarantees a counsellor is free for you, so we recommend it for detailed counselling.", audience: "Students", published: true, onWebsite: true, pinned: false, tags: ["Walk-in"], updatedAt: "2026-09-05T09:00:00Z", updatedBy: "Shirin Sultana" },
  { id: "Q-15", category: "Office & appointments", question: "What should front desk do if a visitor waits more than 20 minutes?", answer: "Offer water, apologise, and message the branch manager on WhatsApp. If no counsellor is free within 10 more minutes, the manager should see the visitor or book them a call-back slot the same day.", audience: "Staff only", published: false, onWebsite: false, pinned: false, tags: ["Front desk", "Waiting time"], updatedAt: "2026-09-16T15:00:00Z", updatedBy: "Sadman Rahman" },
];

let faqs: Faq[] = faqSeeds.map((f, i) => ({ ...f, helpful: 40 - i * 2 + (i % 3) * 5, notHelpful: i % 4, views: 320 - i * 17 }));
export function getFaqs() {
  return faqs;
}
export function saveFaqs(next: Faq[]) {
  faqs = next;
}

// --- Branch notice board ------------------------------------------------------------

export const noticeCategories = ["Office update", "Closure", "Facilities", "Event", "Visitor", "Celebration", "Reminder"] as const;
export type NoticeCategory = (typeof noticeCategories)[number];

export interface OfficeNotice {
  id: string;
  branch: string;
  category: NoticeCategory;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  pinned: boolean;
  eventAt?: string;
  expiresOn?: string;
  seenBy: string[];
  likes: string[];
  comments: { id: string; author: string; text: string; at: string }[];
}

const noticeSeeds: OfficeNotice[] = [
  { id: "N-01", branch: "Dhaka HQ", category: "Closure", title: "Office closed 1–2 October for Durga Puja", body: "Dhaka HQ will be closed on Thursday 1 and Friday 2 October. Please move any appointments booked for those days by Friday 26 September. The London team will cover urgent visa queries.", author: "Tanvir Ahmed", createdAt: "2026-09-15T09:10:00Z", pinned: true, expiresOn: "2026-10-03", seenBy: ["Alif Tasnim", "Youna", "Shirin Sultana", "Md. Shariful Islam"], likes: ["Alif Tasnim"], comments: [{ id: "c1", author: "Shirin Sultana", text: "I've moved the 3 appointments on the 1st to Saturday.", at: "2026-09-15T11:32:00Z" }] },
  { id: "N-02", branch: "All branches", category: "Event", title: "University of Hertfordshire on-site visit", body: "Admissions officers from the University of Hertfordshire will run spot assessments for January 2027 postgraduate applicants. Invite students with complete documents — each slot is 20 minutes.", author: "Sadman Rahman", createdAt: "2026-09-16T08:00:00Z", pinned: false, eventAt: "2026-09-24T10:00:00Z", expiresOn: "2026-09-24", seenBy: ["Bickey Shah", "Kazi Rakib", "Alif Tasnim"], likes: ["Bickey Shah", "Kazi Rakib"], comments: [] },
  { id: "N-03", branch: "London", category: "Facilities", title: "Meeting room 2 projector replaced", body: "The new projector in meeting room 2 connects over HDMI or wireless casting (BHE-Room2). Please don't unplug it from the wall socket.", author: "Elena Popescu", createdAt: "2026-09-14T13:45:00Z", pinned: false, seenBy: ["Farhan Kabir"], likes: [], comments: [] },
  { id: "N-04", branch: "Sylhet", category: "Visitor", title: "Agent partners visiting on Tuesday", body: "Tarek Associates and Study Bridge Sylhet will visit on Tuesday at 3pm for the quarterly review. Please keep the meeting room free and prepare their application status reports.", author: "Kazi Rakib", createdAt: "2026-09-13T10:00:00Z", pinned: false, eventAt: "2026-09-22T09:00:00Z", expiresOn: "2026-09-22", seenBy: ["Harunor Rashid", "Sadia Afrin"], likes: [], comments: [] },
  { id: "N-05", branch: "All branches", category: "Celebration", title: "Welcome Nusrat Jahan Mim 🎉", body: "Please welcome Nusrat, our new trainee counsellor at Dhaka HQ. She'll shadow Ummay for the first month — say hello!", author: "Tanvir Ahmed", createdAt: "2026-09-12T07:30:00Z", pinned: false, seenBy: ["Alif Tasnim", "Youna", "Bickey Shah", "Kazi Rakib", "Emma Watson"], likes: ["Alif Tasnim", "Youna", "Bickey Shah", "Emma Watson"], comments: [{ id: "c2", author: "Youna", text: "Welcome Nusrat! 👋", at: "2026-09-12T08:02:00Z" }] },
  { id: "N-06", branch: "Milton Keynes", category: "Closure", title: "Refurbishment — office closed until 28 September", body: "Milton Keynes is closed for refurbishment. All appointments are running online through Teams. Post is being redirected to London.", author: "Bickey Shah", createdAt: "2026-09-08T09:00:00Z", pinned: true, expiresOn: "2026-09-28", seenBy: ["Yuliana Prokipchak", "David Miller"], likes: [], comments: [] },
  { id: "N-07", branch: "All branches", category: "Reminder", title: "Fire drill on Friday at 11:30", body: "Every branch will run its quarterly fire drill on Friday at 11:30 local time. Please guide any visitors to the assembly point and log the drill time with your branch manager.", author: "Sadman Rahman", createdAt: "2026-09-11T12:00:00Z", pinned: false, eventAt: "2026-09-18T11:30:00Z", expiresOn: "2026-09-18", seenBy: ["Tanvir Ahmed", "Kazi Rakib"], likes: [], comments: [] },
  { id: "N-08", branch: "Manchester", category: "Office update", title: "New parking arrangement", body: "Staff parking has moved to the Thomas Street car park. Collect your permit from Priya — visitor parking stays at the front of the building.", author: "Priya Patel", createdAt: "2026-09-09T08:15:00Z", pinned: false, seenBy: ["Nusrat Choudhury"], likes: [], comments: [] },
];

let notices: OfficeNotice[] = noticeSeeds;
export function getOfficeNotices() {
  return notices;
}
export function saveOfficeNotices(next: OfficeNotice[]) {
  notices = next;
}

/** Demo "today" shared with the rest of the CRM's mock data. */
export const officeToday = "2026-09-17";
export const officeNow = "2026-09-17T11:00:00Z";
