// People module: staff, roles & permissions, teams, task settings and staff
// notices. Shaped like future API responses; edits are kept for the session.
import { getApplications } from "./applications";
import type { AnnouncementAttachment } from "./communications";

export const staffBranches = ["Dhaka HQ", "Sylhet", "London", "Manchester", "Milton Keynes"] as const;
export type StaffBranch = (typeof staffBranches)[number];
export type StaffStatus = "Active" | "On leave" | "Invited" | "Inactive";
export type EmploymentType = "Full time" | "Part time" | "Contractor";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  jobTitle: string;
  branch: StaffBranch;
  reportsTo?: string;
  employment: EmploymentType;
  status: StaffStatus;
  joined: string;
  lastActive: string;
  languages: string[];
  /** Open cases this person can hold before new ones stop auto-assigning to them. */
  capacity: number;
  monthlyTarget: number;
  twoFactor: boolean;
  notes?: string;
}

// --- Roles & permissions ----------------------------------------------------

export const permissionModules = [
  "Dashboard",
  "Leads",
  "Applications",
  "Communications",
  "Institutions & courses",
  "People",
  "Agents",
  "Finance",
  "Reports",
  "Settings",
] as const;
export type PermissionModule = (typeof permissionModules)[number];
export const permissionActions = ["View", "Create", "Edit", "Delete", "Export"] as const;
export type PermissionAction = (typeof permissionActions)[number];
export type DataScope = "All branches" | "Own branch" | "Own records";

export interface Role {
  id: string;
  name: string;
  description: string;
  scope: DataScope;
  system: boolean;
  color: string;
  permissions: Record<PermissionModule, PermissionAction[]>;
}

const all: PermissionAction[] = ["View", "Create", "Edit", "Delete", "Export"];
const ve: PermissionAction[] = ["View", "Create", "Edit"];
const v: PermissionAction[] = ["View"];
const none: PermissionAction[] = [];
const grant = (p: Partial<Record<PermissionModule, PermissionAction[]>>) =>
  Object.fromEntries(permissionModules.map((m) => [m, p[m] ?? none])) as Record<PermissionModule, PermissionAction[]>;

const seedRoles: Role[] = [
  {
    id: "super-admin",
    name: "Super Admin",
    description: "Full access to every branch, setting and record.",
    scope: "All branches",
    system: true,
    color: "bg-rose-500",
    permissions: grant(Object.fromEntries(permissionModules.map((m) => [m, all]))),
  },
  {
    id: "admissions-lead",
    name: "Admissions Lead",
    description: "Runs admissions across branches; approves offers, targets and staff changes.",
    scope: "All branches",
    system: false,
    color: "bg-primary",
    permissions: grant({ Dashboard: v, Leads: all, Applications: all, Communications: all, "Institutions & courses": ve, People: ve, Agents: ve, Finance: v, Reports: ["View", "Export"], Settings: v }),
  },
  {
    id: "branch-manager",
    name: "Branch Manager",
    description: "Manages one branch: its team, leads, applications and targets.",
    scope: "Own branch",
    system: false,
    color: "bg-violet-500",
    permissions: grant({ Dashboard: v, Leads: all, Applications: all, Communications: ve, "Institutions & courses": v, People: ve, Agents: v, Finance: v, Reports: ["View", "Export"] }),
  },
  {
    id: "senior-counsellor",
    name: "Senior Counsellor",
    description: "Owns a caseload and mentors counsellors; can reassign within the branch.",
    scope: "Own branch",
    system: false,
    color: "bg-teal-500",
    permissions: grant({ Dashboard: v, Leads: [...ve, "Export"], Applications: [...ve, "Export"], Communications: ve, "Institutions & courses": v, People: v, Reports: v }),
  },
  {
    id: "counsellor",
    name: "Counsellor",
    description: "Works their own leads and applications.",
    scope: "Own records",
    system: false,
    color: "bg-sky-500",
    permissions: grant({ Dashboard: v, Leads: ve, Applications: ve, Communications: ["View", "Create"], "Institutions & courses": v }),
  },
  {
    id: "compliance",
    name: "Compliance Officer",
    description: "Checks documents, CAS and visa files before submission.",
    scope: "All branches",
    system: false,
    color: "bg-amber-500",
    permissions: grant({ Dashboard: v, Leads: v, Applications: ["View", "Edit", "Export"], "Institutions & courses": v, Reports: ["View", "Export"] }),
  },
  {
    id: "marketing",
    name: "Marketing Executive",
    description: "Runs campaigns and lead sources; no access to student files.",
    scope: "All branches",
    system: false,
    color: "bg-pink-500",
    permissions: grant({ Dashboard: v, Leads: ["View", "Create", "Export"], Communications: all, Reports: ["View", "Export"] }),
  },
  {
    id: "finance",
    name: "Finance Officer",
    description: "Commissions, invoices and payments.",
    scope: "All branches",
    system: false,
    color: "bg-emerald-500",
    permissions: grant({ Dashboard: v, Applications: v, Agents: v, Finance: all, Reports: ["View", "Export"] }),
  },
  {
    id: "front-desk",
    name: "Front Desk",
    description: "Registers walk-ins and books appointments.",
    scope: "Own branch",
    system: false,
    color: "bg-slate-500",
    permissions: grant({ Dashboard: v, Leads: ["View", "Create"], Communications: v }),
  },
];

// --- Staff --------------------------------------------------------------------

type Seed = [id: string, name: string, roleId: string, jobTitle: string, branch: StaffBranch, joined: string, extra?: Partial<StaffMember>];
const seeds: Seed[] = [
  ["STF-001", "Sadman Rahman", "admissions-lead", "Admissions Lead", "Dhaka HQ", "2021-02-01", { capacity: 40, monthlyTarget: 12, languages: ["Bengali", "English"] }],
  ["STF-002", "Tanvir Ahmed", "branch-manager", "Branch Manager", "Dhaka HQ", "2020-06-15", { reportsTo: "STF-001", capacity: 30, monthlyTarget: 10 }],
  ["STF-003", "Alif Tasnim", "senior-counsellor", "Senior Counsellor", "Dhaka HQ", "2022-03-01", { reportsTo: "STF-002" }],
  ["STF-004", "Ummay Saiha Limu", "senior-counsellor", "Senior Counsellor", "Dhaka HQ", "2024-01-08", { reportsTo: "STF-002" }],
  ["STF-005", "Md. Shariful Islam", "counsellor", "Education Counsellor", "Dhaka HQ", "2023-03-12", { reportsTo: "STF-003" }],
  ["STF-006", "Youna", "counsellor", "Education Counsellor", "Dhaka HQ", "2024-09-02", { reportsTo: "STF-003", languages: ["Bengali", "English", "Mandarin"] }],
  ["STF-007", "Kazi Rakib", "branch-manager", "Branch Manager", "Sylhet", "2021-05-20", { reportsTo: "STF-001", capacity: 30, monthlyTarget: 8, languages: ["Bengali", "Sylheti", "English"] }],
  ["STF-008", "Harunor Rashid", "senior-counsellor", "Senior Counsellor", "Sylhet", "2021-08-16", { reportsTo: "STF-007", capacity: 70, monthlyTarget: 7, languages: ["Bengali", "Sylheti", "English"] }],
  ["STF-009", "Sadia Afrin", "counsellor", "Education Counsellor", "Sylhet", "2025-02-03", { reportsTo: "STF-008", languages: ["Bengali", "Sylheti", "English"] }],
  ["STF-010", "Bickey Shah", "branch-manager", "Branch Manager", "London", "2020-09-07", { reportsTo: "STF-001", capacity: 45, monthlyTarget: 6, languages: ["English", "Hindi", "Gujarati"] }],
  ["STF-011", "N. Bintay Zaman", "senior-counsellor", "Senior Counsellor", "London", "2022-11-14", { reportsTo: "STF-010", languages: ["English", "Bengali"] }],
  ["STF-012", "Farhan Kabir", "counsellor", "Education Counsellor", "London", "2024-04-22", { reportsTo: "STF-011", languages: ["English", "Bengali"] }],
  ["STF-013", "Nusrat Choudhury", "senior-counsellor", "Senior Counsellor", "Manchester", "2022-01-10", { reportsTo: "STF-015", capacity: 80, monthlyTarget: 7, languages: ["English", "Bengali", "Urdu"] }],
  ["STF-014", "S. Parappadan Sankaran", "counsellor", "Education Counsellor", "Manchester", "2023-07-03", { reportsTo: "STF-013", languages: ["English", "Malayalam", "Tamil"] }],
  ["STF-015", "Priya Patel", "branch-manager", "Branch Manager", "Manchester", "2023-07-17", { reportsTo: "STF-001", languages: ["English", "Gujarati"] }],
  ["STF-016", "Yuliana Prokipchak", "counsellor", "Education Counsellor", "Milton Keynes", "2023-10-02", { reportsTo: "STF-010", languages: ["English", "Ukrainian", "Russian", "Romanian"] }],
  ["STF-017", "David Miller", "compliance", "Compliance Officer", "Milton Keynes", "2023-09-11", { capacity: 60, monthlyTarget: 0 }],
  ["STF-018", "Emma Watson", "compliance", "CAS & Visa Officer", "London", "2025-02-17", { reportsTo: "STF-017", capacity: 60, monthlyTarget: 0 }],
  ["STF-019", "Rumana Akter", "marketing", "Digital Marketing Executive", "Dhaka HQ", "2024-06-03", { capacity: 0, monthlyTarget: 0 }],
  ["STF-020", "Joseph Adeyemi", "marketing", "Campaign Coordinator", "London", "2025-05-12", { capacity: 0, monthlyTarget: 0, employment: "Part time" }],
  ["STF-021", "Mahbuba Akhter", "finance", "Finance Officer", "Dhaka HQ", "2022-08-01", { capacity: 0, monthlyTarget: 0 }],
  ["STF-022", "Shirin Sultana", "front-desk", "Front Desk Executive", "Dhaka HQ", "2025-01-06", { capacity: 0, monthlyTarget: 0 }],
  ["STF-023", "Elena Popescu", "front-desk", "Receptionist", "London", "2025-03-03", { capacity: 0, monthlyTarget: 0, employment: "Part time", languages: ["English", "Romanian"] }],
  ["STF-024", "Nusrat Jahan Mim", "counsellor", "Trainee Counsellor", "Dhaka HQ", "2026-08-18", { reportsTo: "STF-004", status: "Active", capacity: 15, monthlyTarget: 2 }],
  ["STF-025", "Rahim Uddin", "counsellor", "Education Counsellor", "Sylhet", "2024-02-12", { reportsTo: "STF-008", status: "On leave", notes: "Parental leave until 6 Oct 2026" }],
  ["STF-026", "Tasnia Haque", "counsellor", "Education Counsellor", "London", "2026-09-15", { reportsTo: "STF-011", status: "Invited", capacity: 20, monthlyTarget: 3 }],
  ["STF-027", "Kevin Brown", "counsellor", "Education Counsellor", "Manchester", "2022-04-04", { reportsTo: "STF-013", status: "Inactive", notes: "Left the company on 31 Jul 2026" }],
];

const emailFor = (name: string) =>
  `${name.toLowerCase().replace(/^(md\.|s\.|n\.)\s*/, "").replace(/[^a-z\s]/g, "").trim().split(/\s+/).slice(0, 2).join(".")}@bheuni.com`;
const phoneFor = (branch: StaffBranch, i: number) =>
  branch === "Dhaka HQ" || branch === "Sylhet"
    ? `+880 17${String(10 + (i * 7) % 89).padStart(2, "0")}-${String(400000 + i * 13579).slice(0, 6)}`
    : `+44 7${String(700 + (i * 37) % 299)} ${String(900000 + i * 4211).slice(0, 6)}`;
const lastActiveFor = (i: number, status: StaffStatus) =>
  status === "Invited" ? "" : status === "Inactive" ? "2026-07-31T16:40:00Z" : status === "On leave" ? "2026-08-29T12:10:00Z" : new Date(Date.parse("2026-09-17T10:45:00Z") - ((i * 97) % 600) * 60000).toISOString().replace(/\.\d{3}Z$/, "Z");

function buildStaff(): StaffMember[] {
  return seeds.map(([id, name, roleId, jobTitle, branch, joined, extra = {}], i) => {
    const status = extra.status ?? "Active";
    const bd = branch === "Dhaka HQ" || branch === "Sylhet";
    return {
      id,
      name,
      email: id === "STF-001" ? "sadman.rahman@bheuni.com" : emailFor(name),
      phone: id === "STF-001" ? "+880 1711 223344" : phoneFor(branch, i + 1),
      roleId,
      jobTitle,
      branch,
      employment: "Full time",
      status,
      joined,
      lastActive: lastActiveFor(i, status),
      languages: bd ? ["Bengali", "English"] : ["English"],
      capacity: 60,
      monthlyTarget: 5,
      twoFactor: i % 5 !== 3 && status !== "Invited",
      ...extra,
    };
  });
}

// --- Teams --------------------------------------------------------------------

export interface Team {
  id: string;
  name: string;
  description: string;
  branch: StaffBranch | "All branches";
  leadId: string;
  memberIds: string[];
  focus: string[];
  monthlyTarget: number;
  color: string;
  createdAt: string;
}

const seedTeams: Team[] = [
  { id: "TM-01", name: "Dhaka International Desk", description: "Bangladeshi students applying to the UK, Ireland and Australia.", branch: "Dhaka HQ", leadId: "STF-003", memberIds: ["STF-003", "STF-004", "STF-005", "STF-006", "STF-024"], focus: ["Postgraduate", "UK universities", "Australia"], monthlyTarget: 16, color: "bg-primary", createdAt: "2023-01-10" },
  { id: "TM-02", name: "Sylhet Student Hub", description: "Sylhet walk-ins, fairs and agent referrals.", branch: "Sylhet", leadId: "STF-008", memberIds: ["STF-007", "STF-008", "STF-009", "STF-025"], focus: ["Student fairs", "Agent partners"], monthlyTarget: 9, color: "bg-teal-500", createdAt: "2023-04-03" },
  { id: "TM-03", name: "London Home Admissions", description: "UK home and EU-settled students for London partner providers.", branch: "London", leadId: "STF-011", memberIds: ["STF-010", "STF-011", "STF-012", "STF-026"], focus: ["Student Finance", "Foundation year", "Business"], monthlyTarget: 6, color: "bg-violet-500", createdAt: "2022-09-01" },
  { id: "TM-04", name: "Northern Home Admissions", description: "Manchester and Milton Keynes home students.", branch: "Manchester", leadId: "STF-013", memberIds: ["STF-013", "STF-014", "STF-015", "STF-016"], focus: ["Student Finance", "Weekend study"], monthlyTarget: 10, color: "bg-amber-500", createdAt: "2023-07-20" },
  { id: "TM-05", name: "Health & Care Campaign", description: "Cross-branch squad for health and social care courses.", branch: "All branches", leadId: "STF-013", memberIds: ["STF-013", "STF-011", "STF-016", "STF-020"], focus: ["Health & social care", "Campaign leads"], monthlyTarget: 11, color: "bg-rose-500", createdAt: "2025-03-14" },
  { id: "TM-06", name: "Compliance & CAS", description: "Document checks, CAS interviews and visa files.", branch: "All branches", leadId: "STF-017", memberIds: ["STF-017", "STF-018"], focus: ["CAS", "Visa", "Credibility interviews"], monthlyTarget: 0, color: "bg-sky-500", createdAt: "2023-09-11" },
];

// --- Task settings ------------------------------------------------------------

export type TaskPriority = "Low" | "Normal" | "High" | "Urgent";
export type AssignRule = "Record owner" | "Round robin in team" | "Team lead" | "Least busy in branch";

export interface TaskType {
  id: string;
  name: string;
  category: "Leads" | "Applications" | "Compliance" | "Admin";
  dueIn: number;
  dueUnit: "hours" | "days";
  priority: TaskPriority;
  assign: AssignRule;
  reminderMins: number;
  active: boolean;
}

export interface AutomationRule {
  id: string;
  trigger: string;
  condition: string;
  taskTypeId: string;
  active: boolean;
  runs30d: number;
}

export interface WorkingHours {
  branch: StaffBranch;
  timezone: string;
  start: string;
  end: string;
  days: string[];
}

export interface TaskSettings {
  types: TaskType[];
  rules: AutomationRule[];
  hours: WorkingHours[];
  escalateAfterHours: number;
  escalateTo: "Team lead" | "Branch manager";
  digestTime: string;
  pauseOnLeave: boolean;
  countWorkingHoursOnly: boolean;
}

const seedTaskSettings: TaskSettings = {
  types: [
    { id: "TT-01", name: "First contact call", category: "Leads", dueIn: 2, dueUnit: "hours", priority: "Urgent", assign: "Record owner", reminderMins: 30, active: true },
    { id: "TT-02", name: "Qualification follow-up", category: "Leads", dueIn: 2, dueUnit: "days", priority: "High", assign: "Record owner", reminderMins: 60, active: true },
    { id: "TT-03", name: "Document chase", category: "Applications", dueIn: 3, dueUnit: "days", priority: "Normal", assign: "Record owner", reminderMins: 120, active: true },
    { id: "TT-04", name: "Offer acceptance call", category: "Applications", dueIn: 1, dueUnit: "days", priority: "High", assign: "Record owner", reminderMins: 60, active: true },
    { id: "TT-05", name: "Deposit payment check", category: "Applications", dueIn: 5, dueUnit: "days", priority: "Normal", assign: "Record owner", reminderMins: 1440, active: true },
    { id: "TT-06", name: "CAS interview preparation", category: "Compliance", dueIn: 2, dueUnit: "days", priority: "High", assign: "Round robin in team", reminderMins: 120, active: true },
    { id: "TT-07", name: "Visa file review", category: "Compliance", dueIn: 1, dueUnit: "days", priority: "Urgent", assign: "Team lead", reminderMins: 60, active: true },
    { id: "TT-08", name: "Enrolment check-in", category: "Applications", dueIn: 7, dueUnit: "days", priority: "Low", assign: "Record owner", reminderMins: 1440, active: true },
    { id: "TT-09", name: "Reassign unattended lead", category: "Admin", dueIn: 4, dueUnit: "hours", priority: "High", assign: "Least busy in branch", reminderMins: 30, active: false },
  ],
  rules: [
    { id: "AR-01", trigger: "Lead created", condition: "Any source", taskTypeId: "TT-01", active: true, runs30d: 412 },
    { id: "AR-02", trigger: "Lead status changed", condition: "Status is Qualified", taskTypeId: "TT-02", active: true, runs30d: 138 },
    { id: "AR-03", trigger: "Document requested", condition: "Not received after due date", taskTypeId: "TT-03", active: true, runs30d: 96 },
    { id: "AR-04", trigger: "Application status changed", condition: "Status is Conditional or Unconditional offer", taskTypeId: "TT-04", active: true, runs30d: 71 },
    { id: "AR-05", trigger: "Application status changed", condition: "Status is Unconditional offer and funding is not SFE", taskTypeId: "TT-05", active: true, runs30d: 33 },
    { id: "AR-06", trigger: "Application status changed", condition: "Status is CAS issued", taskTypeId: "TT-06", active: true, runs30d: 19 },
    { id: "AR-07", trigger: "Application status changed", condition: "Status is Visa filed", taskTypeId: "TT-07", active: true, runs30d: 14 },
    { id: "AR-08", trigger: "Lead not contacted", condition: "No activity for 24 working hours", taskTypeId: "TT-09", active: false, runs30d: 0 },
  ],
  hours: [
    { branch: "Dhaka HQ", timezone: "Asia/Dhaka (GMT+6)", start: "10:00", end: "19:00", days: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu"] },
    { branch: "Sylhet", timezone: "Asia/Dhaka (GMT+6)", start: "10:00", end: "18:30", days: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu"] },
    { branch: "London", timezone: "Europe/London (GMT+1)", start: "09:00", end: "17:30", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
    { branch: "Manchester", timezone: "Europe/London (GMT+1)", start: "09:00", end: "17:30", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
    { branch: "Milton Keynes", timezone: "Europe/London (GMT+1)", start: "09:30", end: "17:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
  ],
  escalateAfterHours: 24,
  escalateTo: "Team lead",
  digestTime: "09:00",
  pauseOnLeave: true,
  countWorkingHoursOnly: true,
};

// --- Staff notices (internal announcements with acknowledgement) ----------------

export type NoticeCategory = "Policy" | "HR" | "Training" | "IT & security" | "Compliance" | "Celebration";
export interface NoticeAudience {
  type: "Everyone" | "Branch" | "Team" | "Role";
  value?: string;
}
export interface StaffNotice {
  id: string;
  title: string;
  body: string;
  category: NoticeCategory;
  audience: NoticeAudience;
  requireAck: boolean;
  ackDue?: string;
  pinned: boolean;
  publishedAt: string;
  byId: string;
  acks: Record<string, string>;
  reads: string[];
  attachments?: AnnouncementAttachment[];
}

const seedNotices: Omit<StaffNotice, "acks" | "reads">[] = [
  {
    id: "NT-01",
    title: "Updated UKVI credibility interview guidance",
    body: "UKVI has updated its credibility interview checklist for January 2027 intakes. Before booking any CAS interview, run the student through the new 12-question mock script in the Essential Folder and log it as a Meeting on the application.\n\nFiles without a logged mock interview will be returned by Compliance.",
    category: "Compliance",
    audience: { type: "Everyone" },
    requireAck: true,
    ackDue: "2026-09-20",
    pinned: true,
    publishedAt: "2026-09-15T08:30:00Z",
    byId: "STF-017",
    attachments: [
      { name: "UKVI_credibility_mock_script_Jan2027.pdf", size: "412 KB" },
      { name: "CAS_interview_checklist.docx", size: "86 KB" },
    ],
  },
  {
    id: "NT-02",
    title: "Two-factor sign-in becomes mandatory on 1 October",
    body: "From 1 October 2026 every CRM account must use two-factor sign-in. Turn it on under Settings → Security. Accounts without it will be locked until IT resets them.",
    category: "IT & security",
    audience: { type: "Everyone" },
    requireAck: true,
    ackDue: "2026-09-30",
    pinned: true,
    publishedAt: "2026-09-12T10:00:00Z",
    byId: "STF-001",
    attachments: [{ name: "How_to_turn_on_two_factor.pdf", size: "1.2 MB" }],
  },
  {
    id: "NT-03",
    title: "Student Finance England: 2026/27 evidence changes",
    body: "SFE now asks for share codes to be at least 30 days valid when the application is submitted. Please check share codes on all Home/EU applications in 'App submitted' this week.",
    category: "Policy",
    audience: { type: "Team", value: "TM-03" },
    requireAck: true,
    ackDue: "2026-09-19",
    pinned: false,
    publishedAt: "2026-09-16T09:15:00Z",
    byId: "STF-010",
  },
  {
    id: "NT-04",
    title: "Sylhet office closed on 21 September",
    body: "The Sylhet branch will be closed for electrical works. Appointments have been moved to Dhaka HQ video calls. Counsellors, please confirm with your students.",
    category: "HR",
    audience: { type: "Branch", value: "Sylhet" },
    requireAck: false,
    pinned: false,
    publishedAt: "2026-09-14T06:00:00Z",
    byId: "STF-007",
  },
  {
    id: "NT-05",
    title: "Counsellor training: handling SFE refusals",
    body: "Join the 45-minute session on Thursday 24 Sep at 14:00 UK / 19:00 BD. We'll cover common refusal reasons and how to prepare appeals. Recording will be in BHE Training.",
    category: "Training",
    audience: { type: "Role", value: "counsellor" },
    requireAck: false,
    pinned: false,
    publishedAt: "2026-09-11T11:00:00Z",
    byId: "STF-001",
  },
  {
    id: "NT-06",
    title: "Congratulations, London team — 50 enrolments for 2026!",
    body: "The London Home Admissions team passed 50 enrolments for 2026 intakes, ahead of target. Thank you all — lunch is on us on Friday.",
    category: "Celebration",
    audience: { type: "Everyone" },
    requireAck: false,
    pinned: false,
    publishedAt: "2026-09-09T15:30:00Z",
    byId: "STF-001",
  },
];

// --- Store --------------------------------------------------------------------

let staff: StaffMember[] | null = null;
let roles: Role[] = seedRoles;
let teams: Team[] = seedTeams;
let taskSettings: TaskSettings = seedTaskSettings;
let notices: StaffNotice[] | null = null;

export function getStaff(): StaffMember[] {
  return (staff ??= buildStaff());
}
export function saveStaff(next: StaffMember[]) {
  staff = next;
}
export function getStaffMember(id: string) {
  return getStaff().find((s) => s.id === id);
}
export function nextStaffId() {
  const max = Math.max(...getStaff().map((s) => Number(s.id.slice(4))));
  return `STF-${String(max + 1).padStart(3, "0")}`;
}

export function getRoles() {
  return roles;
}
export function saveRoles(next: Role[]) {
  roles = next;
}
export function roleName(id: string) {
  return roles.find((r) => r.id === id)?.name ?? "No role";
}

export function getTeams() {
  return teams;
}
export function saveTeams(next: Team[]) {
  teams = next;
}

export function getTaskSettings() {
  return taskSettings;
}
export function saveTaskSettings(next: TaskSettings) {
  taskSettings = next;
}

/** Who a notice is meant for. */
export function audienceOf(n: Pick<StaffNotice, "audience">, list = getStaff()) {
  const active = list.filter((s) => s.status !== "Inactive" && s.status !== "Invited");
  const a = n.audience;
  if (a.type === "Branch") return active.filter((s) => s.branch === a.value);
  if (a.type === "Role") return active.filter((s) => s.roleId === a.value);
  if (a.type === "Team") return active.filter((s) => teams.find((t) => t.id === a.value)?.memberIds.includes(s.id));
  return active;
}

function buildNotices(): StaffNotice[] {
  return seedNotices.map((n, k) => {
    const people = audienceOf(n);
    const acks: Record<string, string> = {};
    const reads: string[] = [];
    people.forEach((s, i) => {
      const seen = (i * 7 + k * 3) % 10 < (k === 0 ? 7 : k === 2 ? 5 : 8);
      if (!seen) return;
      reads.push(s.id);
      if (n.requireAck && (i + k) % 6 !== 0) acks[s.id] = new Date(Date.parse(n.publishedAt) + (i + 1) * 3.3 * 3600000).toISOString().replace(/\.\d{3}Z$/, "Z");
    });
    return { ...n, acks, reads };
  });
}

export function getNotices(): StaffNotice[] {
  return (notices ??= buildNotices());
}
export function saveNotices(next: StaffNotice[]) {
  notices = next;
}

/** Caseload numbers from the applications data, keyed by counsellor name. */
export function caseloads() {
  const map = new Map<string, { open: number; enrolled: number; total: number; thisMonth: number }>();
  for (const a of getApplications()) {
    const m = map.get(a.counsellor) ?? { open: 0, enrolled: 0, total: 0, thisMonth: 0 };
    m.total++;
    if (a.stage === "Enrolled") m.enrolled++;
    else if (a.stage !== "Rejected" && a.stage !== "Withdrawn") m.open++;
    if (a.createdAt.startsWith("2026-09")) m.thisMonth++;
    map.set(a.counsellor, m);
  }
  return map;
}

/** The last add/edit, so the list can confirm it after navigating back. */
let lastChange: { id: string; verb: "added" | "updated" | "invited" } | null = null;
export function markStaffChange(id: string, verb: "added" | "updated" | "invited") {
  lastChange = { id, verb };
}
export function getStaffChange() {
  return lastChange;
}
export function clearStaffChange() {
  lastChange = null;
}
