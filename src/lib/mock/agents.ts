// Agent Management: partner agencies (with their onboarding review) and
// ambassadors. Referral numbers come from the applications data; edits are
// kept for the session until the backend exists.
import { getApplications, type ApplicationRow } from "./applications";

export type AgentTier = "Gold" | "Silver" | "Bronze";
export type AgentStatus = "Pending" | "Active" | "Suspended" | "Inactive" | "Rejected";
export type AgentType = "Company" | "Individual";
export type AgentSource = "Website form" | "Partner referral" | "Education fair" | "Direct outreach";
export type DocStatus = "Missing" | "Uploaded" | "Verified" | "Rejected";

export const agentTiers: AgentTier[] = ["Gold", "Silver", "Bronze"];
export const agentSources: AgentSource[] = ["Website form", "Partner referral", "Education fair", "Direct outreach"];
export const destinationOptions = ["United Kingdom", "Ireland", "Canada", "Australia", "United States", "Europe"];
export const relationshipManagers = ["Sadman Rahman", "Alif Tasnim", "Bickey Shah", "Harunor Rashid", "Nusrat Choudhury"];

/** Default agent share of the institution commission for each tier. */
export const tierShare: Record<AgentTier, number> = { Gold: 65, Silver: 55, Bronze: 45 };

/** KYC documents every agency must supply before approval. */
export const requiredDocs = [
  { key: "licence", label: "Trade licence / company registration" },
  { key: "id", label: "Owner or director photo ID" },
  { key: "address", label: "Proof of office address" },
  { key: "bank", label: "Bank account confirmation" },
  { key: "agreement", label: "Signed agent agreement" },
] as const;
export type DocKey = (typeof requiredDocs)[number]["key"];

export interface AgentDocument {
  status: DocStatus;
  fileName?: string;
  note?: string;
}

export interface AgentActivity {
  at: string;
  text: string;
  by: string;
}

export interface Agent {
  id: string;
  name: string;
  legalName: string;
  type: AgentType;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  country: string;
  /** Countries the agency recruits students from. */
  markets: string[];
  /** Study destinations they send students to. */
  destinations: string[];
  tier: AgentTier;
  /** Agent's share of the institution commission, in %. */
  commissionShare: number;
  status: AgentStatus;
  source: AgentSource;
  manager: string;
  /** Students the agency expects to send per year (from their application). */
  expectedStudents: number;
  appliedAt: string;
  approvedAt?: string;
  agreementEnd?: string;
  bankName: string;
  accountName: string;
  accountLast4: string;
  docs: Record<DocKey, AgentDocument>;
  rejectionReason?: string;
  notes?: string;
  /** Agent portal login; the password itself is never stored in the CRM. */
  login?: { createdAt: string; passwordChangedAt: string };
  activity: AgentActivity[];
}

export type AmbassadorKind = "Student" | "Alumni" | "Community";
export type AmbassadorStatus = "Active" | "Invited" | "Paused";

export interface Ambassador {
  id: string;
  name: string;
  email: string;
  phone: string;
  kind: AmbassadorKind;
  /** University and course for student and alumni ambassadors; organisation for community ones. */
  affiliation: string;
  city: string;
  code: string;
  /** Reward paid per enrolled student, in GBP. */
  reward: number;
  manager: string;
  status: AmbassadorStatus;
  joined: string;
  paid: number;
  payouts: { at: string; amount: number; by: string }[];
}

// --- Seed data -----------------------------------------------------------------

const allVerified = (): Record<DocKey, AgentDocument> => ({
  licence: { status: "Verified", fileName: "trade-licence.pdf" },
  id: { status: "Verified", fileName: "director-passport.pdf" },
  address: { status: "Verified", fileName: "utility-bill.pdf" },
  bank: { status: "Verified", fileName: "bank-letter.pdf" },
  agreement: { status: "Verified", fileName: "bhe-agent-agreement-signed.pdf" },
});

const docs = (s: Partial<Record<DocKey, DocStatus>>): Record<DocKey, AgentDocument> =>
  Object.fromEntries(
    requiredDocs.map((d) => {
      const status = s[d.key] ?? "Missing";
      return [d.key, { status, fileName: status === "Missing" ? undefined : `${d.key}-${d.label.split(" ")[0].toLowerCase()}.pdf` }];
    })
  ) as Record<DocKey, AgentDocument>;

type Seed = Omit<Agent, "docs" | "activity" | "website" | "address" | "bankName" | "accountName" | "accountLast4" | "legalName" | "contactRole" | "type"> &
  Partial<Pick<Agent, "docs" | "activity" | "website" | "address" | "bankName" | "accountName" | "accountLast4" | "legalName" | "contactRole" | "type">>;

const seeds: Seed[] = [
  { id: "AGT-001", name: "Gunjon Education", contactName: "Gunjon Roy", email: "gunjon@gunjonedu.com", phone: "+880 1711-203040", city: "Dhaka", country: "Bangladesh", markets: ["Bangladesh"], destinations: ["United Kingdom", "Ireland"], tier: "Gold", commissionShare: 70, status: "Active", source: "Direct outreach", manager: "Sadman Rahman", expectedStudents: 200, appliedAt: "2019-03-02", approvedAt: "2019-03-20", agreementEnd: "2027-03-31" },
  { id: "AGT-002", name: "Apex Global Edu Pathway", contactName: "Kamal Hossain", email: "kamal@apexglobaledu.com", phone: "+880 1715-112233", city: "Dhaka", country: "Bangladesh", markets: ["Bangladesh"], destinations: ["United Kingdom", "Canada"], tier: "Gold", commissionShare: 65, status: "Active", source: "Education fair", manager: "Sadman Rahman", expectedStudents: 150, appliedAt: "2023-01-10", approvedAt: "2023-01-24", agreementEnd: "2026-10-31" },
  { id: "AGT-003", name: "Tarek Associates", contactName: "Tarek Rahman", email: "tarek@tarekassociates.com", phone: "+880 1819-445120", city: "Sylhet", country: "Bangladesh", markets: ["Bangladesh"], destinations: ["United Kingdom"], tier: "Silver", commissionShare: 60, status: "Active", source: "Partner referral", manager: "Harunor Rashid", expectedStudents: 80, appliedAt: "2020-06-15", approvedAt: "2020-07-01", agreementEnd: "2026-10-12" },
  { id: "AGT-004", name: "Beacon Overseas Studies", contactName: "Suman Shrestha", email: "info@beaconoverseas.com", phone: "+977 1-4412233", city: "Kathmandu", country: "Nepal", markets: ["Nepal"], destinations: ["United Kingdom", "Australia"], tier: "Silver", commissionShare: 60, status: "Active", source: "Website form", manager: "Alif Tasnim", expectedStudents: 60, appliedAt: "2022-02-01", approvedAt: "2022-02-18", agreementEnd: "2027-02-28" },
  { id: "AGT-005", name: "Crown British Education", contactName: "Adaeze Okafor", email: "adaeze@crownbritishedu.com", phone: "+234 803 555 0142", city: "Lagos", country: "Nigeria", markets: ["Nigeria", "Ghana"], destinations: ["United Kingdom", "Canada"], tier: "Gold", commissionShare: 65, status: "Active", source: "Education fair", manager: "Bickey Shah", expectedStudents: 120, appliedAt: "2022-04-05", approvedAt: "2022-04-22", agreementEnd: "2027-04-30" },
  { id: "AGT-006", name: "Study Bridge Sylhet", contactName: "Rumana Chowdhury", email: "rumana@studybridge.com.bd", phone: "+880 1712-908877", city: "Sylhet", country: "Bangladesh", markets: ["Bangladesh"], destinations: ["United Kingdom"], tier: "Bronze", commissionShare: 50, status: "Active", source: "Partner referral", manager: "Harunor Rashid", expectedStudents: 40, appliedAt: "2024-05-12", approvedAt: "2024-05-30", agreementEnd: "2027-05-31" },
  { id: "AGT-007", name: "NextStep Consultancy", contactName: "Imran Qureshi", email: "imran@nextstepconsult.pk", phone: "+92 42 3577 8812", city: "Lahore", country: "Pakistan", markets: ["Pakistan"], destinations: ["United Kingdom", "Ireland"], tier: "Silver", commissionShare: 55, status: "Active", source: "Website form", manager: "Nusrat Choudhury", expectedStudents: 70, appliedAt: "2023-08-01", approvedAt: "2023-08-16", agreementEnd: "2027-08-31" },
  { id: "AGT-008", name: "Summit Academic Network", contactName: "Ayesha Malik", email: "ayesha@summitacademic.pk", phone: "+92 300 441 2290", city: "Lahore", country: "Pakistan", markets: ["Pakistan"], destinations: ["United Kingdom"], tier: "Bronze", commissionShare: 45, status: "Suspended", source: "Website form", manager: "Nusrat Choudhury", expectedStudents: 30, appliedAt: "2024-01-20", approvedAt: "2024-02-05", agreementEnd: "2026-12-31", notes: "Suspended 2 Sep — two applications submitted with unverified bank statements. Review with compliance before reinstating." },
  { id: "AGT-009", name: "Pioneer UK Admissions", contactName: "James Whitmore", email: "admissions@pioneeruk.co.uk", phone: "+44 20 7946 0321", city: "London", country: "United Kingdom", markets: ["United Kingdom"], destinations: ["United Kingdom"], tier: "Silver", commissionShare: 55, status: "Active", source: "Direct outreach", manager: "Bickey Shah", expectedStudents: 50, appliedAt: "2023-03-01", approvedAt: "2023-03-14", agreementEnd: "2027-03-31" },
  { id: "AGT-010", name: "Horizon Student Solutions", contactName: "Rashid Al-Mansoor", email: "rashid@horizonstudent.ae", phone: "+971 4 332 9988", city: "Dubai", country: "United Arab Emirates", markets: ["United Arab Emirates", "India"], destinations: ["United Kingdom", "Canada", "Australia"], tier: "Bronze", commissionShare: 45, status: "Inactive", source: "Education fair", manager: "Alif Tasnim", expectedStudents: 25, appliedAt: "2024-02-11", approvedAt: "2024-03-01", agreementEnd: "2026-03-01", notes: "Agreement lapsed in March; they have not responded to renewal emails." },
  // Onboarding queue
  { id: "AGT-011", name: "Silk Route Education", contactName: "Farid Alimov", contactRole: "Managing Director", email: "farid@silkrouteedu.uz", phone: "+998 71 200 4411", city: "Tashkent", country: "Uzbekistan", markets: ["Uzbekistan", "Kazakhstan"], destinations: ["United Kingdom"], tier: "Silver", commissionShare: 55, status: "Pending", source: "Education fair", manager: "Sadman Rahman", expectedStudents: 60, appliedAt: "2026-09-02", docs: docs({ licence: "Verified", id: "Verified", address: "Uploaded", bank: "Uploaded", agreement: "Uploaded" }), notes: "Met at the Tashkent fair in August — strong foundation-year pipeline." },
  { id: "AGT-012", name: "Accra Study Hub", contactName: "Kwame Mensah", contactRole: "Founder", email: "kwame@accrastudyhub.com", phone: "+233 24 455 7788", city: "Accra", country: "Ghana", markets: ["Ghana"], destinations: ["United Kingdom", "Canada"], tier: "Bronze", commissionShare: 45, status: "Pending", source: "Website form", manager: "Bickey Shah", expectedStudents: 35, appliedAt: "2026-09-09", docs: docs({ licence: "Uploaded", id: "Uploaded", bank: "Uploaded" }) },
  { id: "AGT-013", name: "Chattogram Career Point", contactName: "Rafiq Kafle", contactRole: "Director", email: "rafiq@ctgcareerpoint.com", phone: "+880 1816-330021", city: "Chattogram", country: "Bangladesh", markets: ["Bangladesh"], destinations: ["United Kingdom"], tier: "Silver", commissionShare: 55, status: "Pending", source: "Partner referral", manager: "Alif Tasnim", expectedStudents: 90, appliedAt: "2026-08-27", docs: docs({ licence: "Verified", id: "Rejected", address: "Verified", bank: "Verified", agreement: "Uploaded" }), notes: "Referred by Gunjon Education." },
  { id: "AGT-014", name: "Priya Nair (Freelance)", type: "Individual", contactName: "Priya Nair", contactRole: "Independent counsellor", email: "priya.nair.edu@gmail.com", phone: "+91 98470 22314", city: "Kochi", country: "India", markets: ["India"], destinations: ["United Kingdom", "Ireland"], tier: "Bronze", commissionShare: 45, status: "Pending", source: "Website form", manager: "Nusrat Choudhury", expectedStudents: 15, appliedAt: "2026-09-15", docs: docs({ id: "Uploaded" }) },
  { id: "AGT-015", name: "Lagos Scholars Ltd", contactName: "Tunde Balogun", contactRole: "CEO", email: "tunde@lagosscholars.ng", phone: "+234 802 311 9044", city: "Lagos", country: "Nigeria", markets: ["Nigeria"], destinations: ["United Kingdom"], tier: "Silver", commissionShare: 55, status: "Pending", source: "Direct outreach", manager: "Bickey Shah", expectedStudents: 70, appliedAt: "2026-09-12", docs: docs({ licence: "Verified", id: "Verified", address: "Verified", bank: "Verified", agreement: "Verified" }) },
  { id: "AGT-016", name: "QuickVisa Consultants", contactName: "Omar Siddiqui", contactRole: "Owner", email: "omar@quickvisa.biz", phone: "+880 1600-000111", city: "Dhaka", country: "Bangladesh", markets: ["Bangladesh"], destinations: ["United Kingdom"], tier: "Bronze", commissionShare: 45, status: "Rejected", source: "Website form", manager: "Sadman Rahman", expectedStudents: 300, appliedAt: "2026-08-20", docs: docs({ licence: "Rejected", id: "Uploaded" }), rejectionReason: "Trade licence could not be verified with RJSC; website advertises guaranteed visas." },
];

function build(s: Seed): Agent {
  const domain = s.email.split("@")[1];
  const approved = s.status !== "Pending" && s.status !== "Rejected";
  const activity: AgentActivity[] = [{ at: `${s.appliedAt}T09:00:00Z`, text: `Application received via ${s.source.toLowerCase()}`, by: "System" }];
  if (s.approvedAt) activity.unshift({ at: `${s.approvedAt}T10:30:00Z`, text: `Approved as ${s.tier} partner at ${s.commissionShare}% share`, by: s.manager });
  if (s.status === "Rejected") activity.unshift({ at: `${new Date(Date.parse(s.appliedAt) + 8 * 86400000).toISOString().slice(0, 10)}T11:00:00Z`, text: `Rejected — ${s.rejectionReason}`, by: s.manager });
  if (s.status === "Suspended") activity.unshift({ at: "2026-09-02T14:10:00Z", text: "Suspended pending compliance review", by: "Sadman Rahman" });
  return {
    type: "Company",
    legalName: s.type === "Individual" ? s.contactName : `${s.name} Ltd`,
    contactRole: "Director",
    website: s.type === "Individual" ? "" : `www.${domain}`,
    address: `${s.city}, ${s.country}`,
    bankName: approved ? "Standard Chartered" : "",
    accountName: approved ? `${s.name} Ltd` : "",
    accountLast4: approved ? String(1000 + ((s.id.charCodeAt(6) * 397) % 9000)).slice(-4) : "",
    docs: approved ? allVerified() : docs({}),
    login: s.approvedAt ? { createdAt: s.approvedAt, passwordChangedAt: s.approvedAt } : undefined,
    activity,
    ...s,
  };
}

/** Agent applications closed in earlier review cycles — they start the session in the archive. */
const archivedApplicationSeeds: Seed[] = [
  { id: "AGT-901", name: "Global Dream Visa Services", contactName: "Mizanur Rahman", contactRole: "Owner", email: "info@globaldreamvisa.com", phone: "+880 1911-220045", city: "Dhaka", country: "Bangladesh", markets: ["Bangladesh"], destinations: ["United Kingdom", "Canada"], tier: "Bronze", commissionShare: 45, status: "Rejected", source: "Website form", manager: "Sadman Rahman", expectedStudents: 400, appliedAt: "2025-11-04", docs: docs({ licence: "Rejected", id: "Uploaded" }), rejectionReason: "Advertises 'guaranteed visa' packages; trade licence registered to a travel agency." },
  { id: "AGT-902", name: "EduLink Punjab", contactName: "Harpreet Singh", contactRole: "Director", email: "harpreet@edulinkpunjab.in", phone: "+91 98140 55321", city: "Amritsar", country: "India", markets: ["India"], destinations: ["United Kingdom", "Canada", "Australia"], tier: "Silver", commissionShare: 55, status: "Pending", source: "Education fair", manager: "Nusrat Choudhury", expectedStudents: 80, appliedAt: "2025-10-12", docs: docs({ licence: "Verified", id: "Verified" }), notes: "Stopped replying after the October fair — four document reminders sent." },
  { id: "AGT-903", name: "Kandy Education Centre", contactName: "Nimal Perera", contactRole: "Principal", email: "nimal@kandyedu.lk", phone: "+94 81 222 7788", city: "Kandy", country: "Sri Lanka", markets: ["Sri Lanka"], destinations: ["United Kingdom"], tier: "Bronze", commissionShare: 45, status: "Rejected", source: "Partner referral", manager: "Alif Tasnim", expectedStudents: 20, appliedAt: "2025-08-18", docs: docs({ licence: "Verified", id: "Verified", address: "Verified", bank: "Rejected" }), rejectionReason: "Bank account held in a personal name that doesn't match the registered company." },
  { id: "AGT-904", name: "Abuja Future Scholars", contactName: "Chinedu Eze", contactRole: "CEO", email: "chinedu@abujafuture.ng", phone: "+234 809 441 2200", city: "Abuja", country: "Nigeria", markets: ["Nigeria"], destinations: ["United Kingdom"], tier: "Silver", commissionShare: 55, status: "Pending", source: "Direct outreach", manager: "Bickey Shah", expectedStudents: 60, appliedAt: "2026-02-03", docs: docs({ licence: "Verified", id: "Verified", address: "Verified", bank: "Verified" }), notes: "Withdrew in March — signed an exclusive deal with another UK recruiter." },
  { id: "AGT-905", name: "Karachi Study Abroad", contactName: "Bilal Ahmed", contactRole: "Managing Partner", email: "bilal@karachistudyabroad.pk", phone: "+92 21 3456 7788", city: "Karachi", country: "Pakistan", markets: ["Pakistan"], destinations: ["United Kingdom"], tier: "Silver", commissionShare: 55, status: "Rejected", source: "Website form", manager: "Nusrat Choudhury", expectedStudents: 90, appliedAt: "2026-01-15", docs: docs({ licence: "Uploaded", id: "Rejected", address: "Uploaded" }), rejectionReason: "Director's passport copy was altered; flagged to compliance." },
  { id: "AGT-906", name: "Sylhet Student Care", contactName: "Jubayer Hossain", contactRole: "Director", email: "jubayer@sylhetstudentcare.com", phone: "+880 1720-778899", city: "Sylhet", country: "Bangladesh", markets: ["Bangladesh"], destinations: ["United Kingdom"], tier: "Bronze", commissionShare: 45, status: "Pending", source: "Partner referral", manager: "Harunor Rashid", expectedStudents: 25, appliedAt: "2024-06-10", docs: docs({ licence: "Verified" }), notes: "Duplicate of Study Bridge Sylhet's application — same directors." },
  { id: "AGT-907", name: "Nairobi Pathways", contactName: "Grace Wanjiru", contactRole: "Founder", email: "grace@nairobipathways.co.ke", phone: "+254 722 440 118", city: "Nairobi", country: "Kenya", markets: ["Kenya", "Uganda"], destinations: ["United Kingdom", "Canada"], tier: "Silver", commissionShare: 55, status: "Pending", source: "Education fair", manager: "Bickey Shah", expectedStudents: 45, appliedAt: "2025-05-20", docs: docs({ licence: "Verified", id: "Verified", address: "Verified", bank: "Verified", agreement: "Missing" }), notes: "All KYC verified but never returned the signed agreement." },
];
export const getArchivedAgentApplicationSeed = () => archivedApplicationSeeds.map(build);

const ambassadorSeeds: Ambassador[] = [
  { id: "AMB-01", name: "Rahim Uddin", email: "rahim.uddin@student.gre.ac.uk", phone: "+44 7700 900411", kind: "Student", affiliation: "University of Greenwich · BSc Business", city: "London", code: "RAHIM25", reward: 150, manager: "Sadman Rahman", status: "Active", joined: "2025-10-02", paid: 450, payouts: [{ at: "2026-06-30", amount: 300, by: "Sadman Rahman" }, { at: "2026-02-28", amount: 150, by: "Sadman Rahman" }] },
  { id: "AMB-02", name: "Kemi Ade", email: "kemi.ade@gmail.com", phone: "+44 7700 900528", kind: "Alumni", affiliation: "Coventry University · MSc Public Health (2024)", city: "Manchester", code: "KEMI24", reward: 200, manager: "Sadman Rahman", status: "Active", joined: "2025-03-14", paid: 800, payouts: [{ at: "2026-07-31", amount: 400, by: "Sadman Rahman" }, { at: "2026-01-31", amount: 400, by: "Sadman Rahman" }] },
  { id: "AMB-03", name: "Sorin Pavel", email: "sorin.pavel@outlook.com", phone: "+44 7700 900633", kind: "Community", affiliation: "Romanian Community Centre, Harrow", city: "London", code: "SORIN", reward: 150, manager: "Sadman Rahman", status: "Active", joined: "2025-06-20", paid: 300, payouts: [{ at: "2026-05-31", amount: 300, by: "Bickey Shah" }] },
  { id: "AMB-04", name: "Abdi Warsame", email: "abdi.w@student.anglia.ac.uk", phone: "+44 7700 900742", kind: "Student", affiliation: "Anglia Ruskin University London · BA Business Management", city: "London", code: "ABDI26", reward: 150, manager: "Bickey Shah", status: "Active", joined: "2026-01-09", paid: 0, payouts: [] },
  { id: "AMB-05", name: "Priya Nair", email: "priya.nair.edu@gmail.com", phone: "+91 98470 22314", kind: "Alumni", affiliation: "University of Hertfordshire · MSc Data Science (2023)", city: "Kochi", code: "PRIYA", reward: 200, manager: "Nusrat Choudhury", status: "Paused", joined: "2024-11-01", paid: 600, payouts: [{ at: "2026-03-31", amount: 600, by: "Nusrat Choudhury" }] },
  { id: "AMB-06", name: "Marta Nowak", email: "marta.nowak@wp.pl", phone: "+44 7700 900815", kind: "Community", affiliation: "Polish Saturday School, Milton Keynes", city: "Milton Keynes", code: "MARTA", reward: 150, manager: "Sadman Rahman", status: "Active", joined: "2025-09-05", paid: 150, payouts: [{ at: "2026-04-30", amount: 150, by: "Sadman Rahman" }] },
  { id: "AMB-07", name: "Tanvir Ahmed", email: "tanvir.ahmed@student.herts.ac.uk", phone: "+44 7700 900902", kind: "Student", affiliation: "University of Hertfordshire · MSc Cyber Security", city: "Hatfield", code: "TANVIR", reward: 150, manager: "Sadman Rahman", status: "Invited", joined: "2026-09-15", paid: 0, payouts: [] },
];

// --- Store ---------------------------------------------------------------------

let agents: Agent[] | null = null;
let ambassadors: Ambassador[] = ambassadorSeeds;

export function getAgents(): Agent[] {
  return (agents ??= seeds.map(build));
}
export function saveAgents(next: Agent[]) {
  agents = next;
}
export function getAgent(id: string) {
  return getAgents().find((a) => a.id === id);
}
export function nextAgentId() {
  // AGT-9xx numbers belong to archived applications from earlier review cycles.
  const max = Math.max(...getAgents().map((a) => Number(a.id.slice(4))).filter((n) => n < 900));
  return `AGT-${String(max + 1).padStart(3, "0")}`;
}

export function getAmbassadors() {
  return ambassadors;
}
export function saveAmbassadors(next: Ambassador[]) {
  ambassadors = next;
}

/** The last add/edit, so the list it returns to can confirm it. */
let lastChange: { id: string; verb: "added" | "updated" | "submitted" } | null = null;
export function markAgentChange(id: string, verb: "added" | "updated" | "submitted") {
  lastChange = { id, verb };
}
export function getAgentChange() {
  return lastChange;
}
export function clearAgentChange() {
  lastChange = null;
}

// --- Derived numbers -------------------------------------------------------------

export interface ReferralStats {
  total: number;
  open: number;
  offers: number;
  enrolled: number;
  lost: number;
  thisMonth: number;
  lastAt: string;
  recent: ApplicationRow[];
}

const offerStages = new Set(["Conditional offer", "Unconditional offer", "CAS issued", "Visa filed", "Enrolled"]);

function statsFor(rows: ApplicationRow[]): ReferralStats {
  const sorted = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    total: rows.length,
    open: rows.filter((a) => a.stage !== "Enrolled" && a.stage !== "Rejected" && a.stage !== "Withdrawn").length,
    offers: rows.filter((a) => offerStages.has(a.stage)).length,
    enrolled: rows.filter((a) => a.stage === "Enrolled").length,
    lost: rows.filter((a) => a.stage === "Rejected" || a.stage === "Withdrawn").length,
    thisMonth: rows.filter((a) => a.createdAt.startsWith(today.slice(0, 7))).length,
    lastAt: sorted[0]?.createdAt ?? "",
    recent: sorted.slice(0, 5),
  };
}

/** Applications referred by each agent, keyed by agent name. */
export function agentReferrals() {
  const byName = new Map<string, ApplicationRow[]>();
  for (const a of getApplications()) {
    if (a.channel !== "Agent" || !a.partner) continue;
    byName.set(a.partner, [...(byName.get(a.partner) ?? []), a]);
  }
  return (name: string) => statsFor(byName.get(name) ?? []);
}

/** Applications referred by each ambassador, keyed by ambassador name. */
export function ambassadorReferrals() {
  const byName = new Map<string, ApplicationRow[]>();
  for (const a of getApplications()) {
    if (!a.partner?.startsWith("Ambassador: ")) continue;
    const name = a.partner.slice("Ambassador: ".length);
    byName.set(name, [...(byName.get(name) ?? []), a]);
  }
  return (name: string) => statsFor(byName.get(name) ?? []);
}

/** The demo's "today"; matches the rest of the mock data. */
export const today = "2026-09-17";

export function daysBetween(fromIso: string, toIso = today) {
  return Math.round((Date.parse(toIso.slice(0, 10)) - Date.parse(fromIso.slice(0, 10))) / 86400000);
}

export function docProgress(agent: Agent) {
  const list = requiredDocs.map((d) => agent.docs[d.key]);
  return {
    verified: list.filter((d) => d.status === "Verified").length,
    uploaded: list.filter((d) => d.status !== "Missing").length,
    rejected: list.filter((d) => d.status === "Rejected").length,
    total: list.length,
  };
}

export function agreementState(agent: Agent): "Valid" | "Expiring" | "Expired" | "None" {
  if (!agent.agreementEnd) return "None";
  const left = daysBetween(today, agent.agreementEnd);
  return left < 0 ? "Expired" : left <= 60 ? "Expiring" : "Valid";
}

/** Standard agent agreement and partner policy, served from /public. */
export const agreementPdf = "/docs/bhe-agent-agreement-and-policy.pdf";

export function referralLink(code: string) {
  return `https://bheuni.com/apply?ref=${code}`;
}
