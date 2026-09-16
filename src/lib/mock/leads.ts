// Mock data & option lists for the Leads module (All Leads list + Add Lead panel)

import { branches, countries, counsellors, leadSources } from "@/lib/mock/applications";

export { branches, countries, counsellors, leadSources };

export type LeadStatus = "New" | "Contacted" | "Follow-up" | "Qualified" | "Converted" | "Lost";

export interface LeadRow {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  country: string;
  branch: string;
  counsellor: string;
  status: LeadStatus;
  leadNote: string;
  leadSource: string;
  createdDate: string;
}

export const leadStatuses: LeadStatus[] = ["New", "Contacted", "Follow-up", "Qualified", "Converted", "Lost"];

export const leadStatusStyles: Record<LeadStatus, { dot: string; text: string; bg: string }> = {
  New: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  Contacted: { dot: "bg-sky-500", text: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10" },
  "Follow-up": { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
  Qualified: { dot: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
  Converted: { dot: "bg-teal-500", text: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/10" },
  Lost: { dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10" },
};

export function makeLeadId() {
  return `LD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

export function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const rawLeads: Omit<LeadRow, "id" | "initials">[] = [
  { name: "Sufi Mahamud Dollar", phone: "+8801720377280", email: "mahamuddollar@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "BD | Can/NZ | Sep Intake", createdDate: "2026-09-16" },
  { name: "Bijan Roy", phone: "+8801943307992", email: "bijanroy6131@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "BD to UK Student Fair", createdDate: "2026-09-16" },
  { name: "Taimur Khan", phone: "+447818067290", email: "taimurkhan00075@gmail.com", country: "United Kingdom", branch: "London", counsellor: "Alif Tasnim", status: "Contacted", leadNote: "Requested prospectus", leadSource: "May 26 - Aug Campaign", createdDate: "2026-09-16" },
  { name: "Greatness Wurayayi", phone: "+447724654314", email: "gwurayayi80@gmail.com", country: "United Kingdom", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "UGM_SEP26 - Facebook", createdDate: "2026-09-16" },
  { name: "Md Asaduzzaman Alam", phone: "+8801710260582", email: "asaduzzamanalamin582@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "BD to UK Student Fair", createdDate: "2026-09-16" },
  { name: "Sajid Rohoman", phone: "+8801877752735", email: "sajidhosenpiyas@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "BD to UK Student Fair", createdDate: "2026-09-16" },
  { name: "Atiqur Rahman", phone: "+8801886314614", email: "jahedislam0011@gmail.com", country: "Bangladesh", branch: "Dhaka HQ", counsellor: "Harunor Rashid", status: "Qualified", leadNote: "Shortlisted 3 courses", leadSource: "BD | Europe | Direct", createdDate: "2026-09-16" },
  { name: "Beverly Hange", phone: "+447426399441", email: "bhange88@yahoo.com", country: "United Kingdom", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "August & Sep Campaign", createdDate: "2026-09-16" },
  { name: "Funmilayo Liadi", phone: "07575569208", email: "liadifunmilayor@gmail.com", country: "United Kingdom", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "Health & Care Campaign", createdDate: "2026-09-16" },
  { name: "Sheikh Hojaifa", phone: "+8801404930587", email: "sheikhhojaifa485@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "Expo | Oct26 Sylhet", createdDate: "2026-09-16" },
  { name: "Hridita Liva", phone: "+8801780418525", email: "hriditarubiyet197@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "BD | Can/NZ | Sep Intake", createdDate: "2026-09-16" },
  { name: "Mohammad Fahim", phone: "+8801617969337", email: "sun808117@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "Expo | Oct26 Sylhet", createdDate: "2026-09-16" },
  { name: "Al Mahafuzat", phone: "+8801745850443", email: "almahafuzat@gamil.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "BD | China - Direct", createdDate: "2026-09-16" },
  { name: "Nusrat Jahan Mim", phone: "+8801912384756", email: "nusratjmim@gmail.com", country: "Bangladesh", branch: "Sylhet", counsellor: "Bickey Shah", status: "Follow-up", leadNote: "Callback requested Fri", leadSource: "Referral - Agent Partner", createdDate: "2026-09-15" },
  { name: "Tanjil Ahmed", phone: "+8801556213487", email: "tanjil.ahmed021@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "Google Ads - UK Study", createdDate: "2026-09-15" },
  { name: "Priya Chowdhury", phone: "+8801711029384", email: "priya.chowdhury@yahoo.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "Facebook Ads - Sep Intake", createdDate: "2026-09-15" },
  { name: "Oluwaseun Adebayo", phone: "+447901223344", email: "seun.adebayo@gmail.com", country: "United Kingdom", branch: "Manchester", counsellor: "Nusrat Choudhury", status: "Converted", leadNote: "Enrolled - MSc Data Analytics", leadSource: "Walk-in", createdDate: "2026-09-15" },
  { name: "Rashedul Karim", phone: "+8801678123456", email: "rashedul.karim@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "UGM_SEP26 - Facebook", createdDate: "2026-09-15" },
  { name: "Isabella Marsh", phone: "+447712456789", email: "isabella.marsh@outlook.com", country: "United Kingdom", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "Health & Care Campaign", createdDate: "2026-09-15" },
  { name: "Mehedi Hasan Shovon", phone: "+8801933445566", email: "shovon.mehedi@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "BD to UK Student Fair", createdDate: "2026-09-14" },
  { name: "Chidera Okafor", phone: "+447534123987", email: "chidera.okafor@gmail.com", country: "United Kingdom", branch: "", counsellor: "", status: "Lost", leadNote: "Not responding to calls", leadSource: "August & Sep Campaign", createdDate: "2026-09-14" },
  { name: "Farhana Yeasmin", phone: "+8801812345098", email: "farhana.yeasmin@gmail.com", country: "Bangladesh", branch: "Dhaka HQ", counsellor: "Alif Tasnim", status: "Contacted", leadNote: "Sent IELTS guidance", leadSource: "Website Inquiry", createdDate: "2026-09-14" },
  { name: "Tahmid Islam Nafis", phone: "+8801678903456", email: "tahmid.nafis@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "Expo | Oct26 Sylhet", createdDate: "2026-09-14" },
  { name: "Grace Okonkwo", phone: "+447890112233", email: "grace.okonkwo@gmail.com", country: "United Kingdom", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "BD | Europe | Direct", createdDate: "2026-09-13" },
  { name: "Shamsul Arefin", phone: "+8801556789012", email: "shamsul.arefin@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "Google Ads - UK Study", createdDate: "2026-09-13" },
  { name: "Rebeka Sultana", phone: "+8801723456789", email: "rebeka.sultana@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "BD | China - Direct", createdDate: "2026-09-13" },
  { name: "Daniel Osei", phone: "+447645123890", email: "daniel.osei@gmail.com", country: "United Kingdom", branch: "Milton Keynes", counsellor: "Yuliana Prokipchak", status: "Qualified", leadNote: "Awaiting offer letter", leadSource: "Agent Partner", createdDate: "2026-09-12" },
  { name: "Jannatul Ferdous", phone: "+8801934567123", email: "jannatul.ferdous@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "UGM_SEP26 - Facebook", createdDate: "2026-09-12" },
  { name: "Kazi Nayeem Islam", phone: "+8801823456712", email: "nayeem.islam@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "BD to UK Student Fair", createdDate: "2026-09-12" },
  { name: "Amara Nwosu", phone: "+447556234789", email: "amara.nwosu@gmail.com", country: "United Kingdom", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "Health & Care Campaign", createdDate: "2026-09-11" },
  { name: "Mahfuzur Rahman Shanto", phone: "+8801678234561", email: "shanto.rahman@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "Expo | Oct26 Sylhet", createdDate: "2026-09-11" },
  { name: "Tasfia Anjum", phone: "+8801912763450", email: "tasfia.anjum@gmail.com", country: "Bangladesh", branch: "Sylhet", counsellor: "Bickey Shah", status: "Follow-up", leadNote: "Needs financial docs", leadSource: "Referral - Agent Partner", createdDate: "2026-09-10" },
  { name: "William Adeyemi", phone: "+447789012345", email: "william.adeyemi@gmail.com", country: "United Kingdom", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "August & Sep Campaign", createdDate: "2026-09-10" },
  { name: "Ismat Jerin", phone: "+8801723987654", email: "ismat.jerin@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "BD | Can/NZ | Sep Intake", createdDate: "2026-09-09" },
  { name: "Robiul Awal", phone: "+8801812098765", email: "robiul.awal@gmail.com", country: "Bangladesh", branch: "", counsellor: "", status: "New", leadNote: "", leadSource: "Facebook Ads - Sep Intake", createdDate: "2026-09-09" },
];

export function getLeads(): LeadRow[] {
  return rawLeads.map((lead, i) => ({
    ...lead,
    id: `LD-${(4820 - i).toString().padStart(4, "0")}`,
    initials: initialsFor(lead.name),
  }));
}
