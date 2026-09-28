// SMS contacts, consent records, message history and campaigns for the Communications › SMS screens.
// Session-only like the rest of the CRM's mock data; the Twilio side lives in /api/sms.

import { getLeads } from "@/lib/mock/leads";
import { getApplications, operationsSnapshotDate } from "@/lib/mock/applications";
import { getAmbassadors } from "@/lib/mock/agents";
import { initialsFor } from "@/lib/utils";
import { estimateCost, segmentInfo, toE164, type ConsentRecord, type ServiceTopic, type SmsCategory, type SmsStatus } from "@/lib/sms/rules";

export const smsToday = operationsSnapshotDate;

export type SmsContactType = "Lead" | "Applicant" | "Ambassador" | "Internal test";
export const smsContactTypes: SmsContactType[] = ["Lead", "Applicant", "Ambassador", "Internal test"];

export const subjects = ["Business & Management", "Computing & Data", "Health & Social Care", "Engineering", "Law", "Foundation & Pre-Master's"] as const;
export const intakesOffered = ["January 2027", "May 2027", "September 2027"] as const;

export interface ConsentEvent {
  at: string;
  text: string;
  by: string;
}

export interface SmsContact {
  id: string;
  type: SmsContactType;
  /** The CRM record this contact comes from (lead, application or ambassador ID). */
  ref: string;
  name: string;
  initials: string;
  phone: string;
  country: string;
  subject: string;
  intake: string;
  /** Applicants only. */
  course?: string;
  university?: string;
  stage?: string;
  counsellor: string;
  branch: string;
  consent: ConsentRecord;
  consentLog: ConsentEvent[];
}

export interface SmsMessage {
  id: string;
  /** Twilio message SID for real sends. */
  sid?: string;
  contactId: string;
  to: string;
  body: string;
  category: SmsCategory;
  topic: ServiceTopic | "Marketing";
  campaignId?: string;
  status: SmsStatus;
  errorCode?: string;
  /** Why the CRM refused to send it. */
  blockedReason?: string;
  segments: number;
  costGbp: number;
  sentAt: string;
  sentBy: string;
  /** live = real Twilio send, test = internal allowlist, simulated = Twilio not connected. */
  via: "twilio" | "simulated";
}

export interface SmsAudience {
  types: SmsContactType[];
  countries: string[];
  subjects: string[];
  intakes: string[];
}

export type CampaignStatus = "Draft" | "Scheduled" | "Sent" | "Test sent";
export interface SmsCampaign {
  id: string;
  name: string;
  purpose: "Courses & intakes" | "Ambassador programme" | "Events";
  audience: SmsAudience;
  body: string;
  status: CampaignStatus;
  createdBy: string;
  createdAt: string;
  scheduledFor?: string;
  sentAt?: string;
  recipients: number;
  excluded: number;
}

// --- Templates --------------------------------------------------------------------------------

export const serviceTemplates: Record<ServiceTopic, string> = {
  "Application status": "Hi {first_name}, update on your {university} application for {course}: it's now at \"{stage}\". {counsellor} will contact you about next steps. BHE Uni",
  "Document request": "Hi {first_name}, to keep your {university} application moving we need: {documents}. Please upload them in the BHE Uni portal by {due_date}. Questions? Reply to {counsellor}. BHE Uni",
  "Appointment reminder": "Hi {first_name}, reminder: your appointment with {counsellor} at BHE Uni {branch} is on {date} at {time}. Need to change it? Call us on {branch_phone}.",
  "Other service": "Hi {first_name}, ",
};

export const marketingTemplates: Record<SmsCampaign["purpose"], string> = {
  "Courses & intakes": "BHE Uni: Hi {first_name}, {intake} applications for {subject} courses are now open. Book a free consultation: bheuni.com/book Reply STOP to opt out",
  "Ambassador programme": "BHE Uni: Hi {first_name}, earn £150 for every friend you refer who enrols. Join our Student Ambassador programme: bheuni.com/ambassadors Reply STOP to opt out",
  Events: "BHE Uni: Education Expo 2026, Sylhet, {date}. Meet 20+ UK universities and get on-the-spot offers. Register free: bheuni.com/expo Reply STOP to opt out",
};

const branchPhones: Record<string, string> = { "Dhaka HQ": "+880 2 5504 1122", Sylhet: "+880 821 712 334", London: "+44 20 3984 5510", Manchester: "+44 161 820 4471", "Milton Keynes": "+44 1908 219 330" };

/** Values a template can fill in by itself for this contact. */
export function contactValues(c: SmsContact): Record<string, string | undefined> {
  return {
    first_name: c.name.split(" ")[0],
    name: c.name,
    course: c.course,
    university: c.university,
    stage: c.stage,
    counsellor: c.counsellor || "your counsellor",
    branch: c.branch || undefined,
    branch_phone: branchPhones[c.branch],
    intake: c.intake,
    subject: c.subject,
  };
}

// --- Seeding ------------------------------------------------------------------------------------

const hash = (s: string) => s.split("").reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
const addDays = (iso: string, n: number) => new Date(Date.parse(iso.slice(0, 10)) + n * 86_400_000).toISOString().slice(0, 10);
/** Seeded consent changes never land after the demo's "today". */
const notAfterToday = (iso: string) => (iso > smsToday ? smsToday : iso);
const subjectFor = (course: string) =>
  /business|mba|management|marketing|finance|account/i.test(course) ? "Business & Management"
  : /data|comput|cyber|software|information|ai\b/i.test(course) ? "Computing & Data"
  : /health|nurs|care|public/i.test(course) ? "Health & Social Care"
  : /engineer/i.test(course) ? "Engineering"
  : /law|llm/i.test(course) ? "Law"
  : "Foundation & Pre-Master's";

const optInSources = ["Website enquiry form", "Education Expo sign-up sheet", "Facebook lead form", "Consultation — verbal, noted by counsellor", "Student portal preferences"];

function seedConsent(key: string, created: string, owner: string): Pick<SmsContact, "consent" | "consentLog"> {
  const h = hash(key) % 100;
  const log: ConsentEvent[] = [{ at: created, text: "Service messages: active (enquiry opened)", by: "System" }];
  if (h < 3) {
    const at = notAfterToday(addDays(created, 9));
    log.unshift({ at, text: "Replied STOP — all SMS stopped", by: "Twilio" });
    return { consent: { service: "opted-out", marketing: "withdrawn", optedOutAt: at }, consentLog: log };
  }
  if (h < 52) {
    const source = optInSources[h % optInSources.length];
    log.unshift({ at: created, text: `Marketing opt-in recorded — ${source}`, by: source.startsWith("Consultation") ? owner || "Counsellor" : "System" });
    if (h < 9) {
      const at = notAfterToday(addDays(created, 20));
      log.unshift({ at, text: "Marketing consent withdrawn — replied STOP to marketing number", by: "Twilio" });
      return { consent: { service: "active", marketing: "withdrawn", marketingSource: source, marketingAt: created, optedOutAt: at }, consentLog: log };
    }
    return { consent: { service: "active", marketing: "granted", marketingSource: source, marketingAt: created }, consentLog: log };
  }
  return { consent: { service: "active", marketing: "not-asked" }, consentLog: log };
}

function buildContacts(): SmsContact[] {
  const leads = getLeads().map<SmsContact>((l) => ({
    id: `C-${l.id}`,
    type: "Lead",
    ref: l.id,
    name: l.name,
    initials: l.initials,
    phone: toE164(l.phone) || l.phone,
    country: l.country,
    subject: subjects[hash(l.id) % subjects.length],
    intake: intakesOffered[hash(l.email) % intakesOffered.length],
    counsellor: l.counsellor,
    branch: l.branch,
    ...seedConsent(l.id, l.createdDate, l.counsellor),
  }));

  const applicants = getApplications()
    .filter((a) => !["Rejected", "Withdrawn", "Enrolled"].includes(a.stage))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 90)
    .map<SmsContact>((a) => ({
      id: `C-${a.id}`,
      type: "Applicant",
      ref: a.id,
      name: a.applicant,
      initials: a.initials,
      phone: toE164(a.phone) || a.phone,
      country: a.phone.replace(/\s/g, "").startsWith("+880") ? "Bangladesh" : "United Kingdom",
      subject: subjectFor(a.course),
      intake: a.intake,
      course: a.course,
      university: a.university,
      stage: a.stage,
      counsellor: a.counsellor,
      branch: a.branch,
      ...seedConsent(a.id, a.createdAt.slice(0, 10), a.counsellor),
    }));

  const ambassadors = getAmbassadors().map<SmsContact>((a) => {
    const seeded = seedConsent(a.id, a.joined, a.manager);
    // Ambassadors agree to programme texts when they sign up.
    const consent: ConsentRecord = seeded.consent.service === "opted-out" ? seeded.consent : { service: "active", marketing: "granted", marketingSource: "Ambassador sign-up agreement", marketingAt: a.joined };
    return {
      id: `C-${a.id}`, type: "Ambassador", ref: a.id, name: a.name, initials: initialsFor(a.name), phone: toE164(a.phone) || a.phone,
      country: a.phone.startsWith("+44") ? "United Kingdom" : "Other", subject: subjects[hash(a.id) % subjects.length], intake: intakesOffered[0],
      counsellor: a.manager, branch: "London", consent,
      consentLog: [{ at: a.joined, text: "Marketing opt-in recorded — Ambassador sign-up agreement", by: a.manager }, { at: a.joined, text: "Service messages: active", by: "System" }],
    };
  });

  const staff: SmsContact[] = [
    ["Sadman Rahman", "+447700900001", "London"],
    ["Alif Tasnim", "+447700900002", "London"],
    ["Harunor Rashid", "+8801711000003", "Dhaka HQ"],
  ].map(([name, phone, branch], i) => ({
    id: `C-STAFF-${i + 1}`, type: "Internal test", ref: "Staff", name, initials: initialsFor(name), phone, country: phone.startsWith("+44") ? "United Kingdom" : "Bangladesh",
    subject: "Business & Management", intake: intakesOffered[0], course: "MSc International Business (test)", university: "University of Hertfordshire", stage: "Conditional offer",
    counsellor: "Sadman Rahman", branch,
    consent: { service: "active", marketing: "granted", marketingSource: "Internal test group", marketingAt: "2026-09-01" },
    consentLog: [{ at: "2026-09-01", text: "Added to the internal test group", by: "Sadman Rahman" }],
  }));

  return [...staff, ...applicants, ...leads, ...ambassadors];
}

const statusMix: [SmsStatus, string?][] = [["delivered"], ["delivered"], ["delivered"], ["delivered"], ["delivered"], ["delivered"], ["delivered"], ["delivered"], ["delivered"], ["undelivered", "30003"], ["delivered"], ["failed", "30007"], ["delivered"], ["delivered"], ["undelivered", "30005"]];

function buildMessages(contacts: SmsContact[]): SmsMessage[] {
  const out: SmsMessage[] = [];
  const cost = (to: string, body: string) => estimateCost([to], segmentInfo(body).segments).gbp;
  let n = 0;
  const push = (c: SmsContact, body: string, category: SmsCategory, topic: SmsMessage["topic"], at: string, by: string, campaignId?: string) => {
    const [status, errorCode] = c.consent.service === "opted-out" ? (["blocked"] as [SmsStatus]) : statusMix[n % statusMix.length];
    n++;
    out.push({
      id: `SMS-${String(n).padStart(5, "0")}`, sid: status === "blocked" ? undefined : `SM${hash(`${c.id}${n}`).toString(16).padStart(8, "0")}${"0".repeat(24)}`,
      contactId: c.id, to: c.phone, body, category, topic, campaignId, status, errorCode,
      blockedReason: status === "blocked" ? "Texted STOP — no SMS of any kind" : undefined,
      segments: segmentInfo(body).segments, costGbp: status === "blocked" ? 0 : cost(c.phone, body), sentAt: at, sentBy: by, via: "twilio",
    });
  };
  const fill = (t: string, c: SmsContact, extra: Record<string, string> = {}) => t.replace(/\{(\w+)\}/g, (m, k: string) => extra[k] ?? contactValues(c)[k] ?? m);

  contacts.filter((c) => c.type === "Applicant").slice(0, 60).forEach((c, i) => {
    const day = addDays(smsToday, -(i % 28));
    push(c, fill(serviceTemplates["Application status"], c), "service", "Application status", `${day}T${String(9 + (i % 8)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}:00Z`, c.counsellor);
    if (i % 3 === 0) push(c, fill(serviceTemplates["Document request"], c, { documents: i % 2 ? "bank statement (28 days) and passport" : "IELTS certificate", due_date: formatShort(addDays(day, 10)) }), "service", "Document request", `${day}T15:10:00Z`, c.counsellor);
    if (i % 4 === 1) push(c, fill(serviceTemplates["Appointment reminder"], c, { date: formatShort(addDays(day, 2)), time: "11:30am" }), "service", "Appointment reminder", `${day}T08:00:00Z`, "System (reminder)");
  });
  contacts.filter((c) => c.type !== "Internal test" && c.consent.marketing === "granted" && c.country === "United Kingdom").slice(0, 25).forEach((c) => {
    push(c, fill(marketingTemplates["Courses & intakes"], c, { intake: "January 2027" }), "marketing", "Marketing", "2026-09-03T10:00:00Z", "Sadman Rahman", "CMP-001");
  });
  return out.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

function formatShort(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

// --- Store ------------------------------------------------------------------------------------------

let contacts: SmsContact[] | null = null;
let messages: SmsMessage[] | null = null;
let campaigns: SmsCampaign[] | null = null;
let seq = 90000;

export function getSmsContacts() {
  return (contacts ??= buildContacts());
}
export function saveSmsContacts(next: SmsContact[]) {
  contacts = next;
}
export function getSmsMessages() {
  return (messages ??= buildMessages(getSmsContacts()));
}
export function saveSmsMessages(next: SmsMessage[]) {
  messages = next;
}
export const nextSmsId = () => `SMS-${++seq}`;

export function getCampaigns() {
  return (campaigns ??= [
    { id: "CMP-001", name: "January 2027 intake — UK", purpose: "Courses & intakes", audience: { types: ["Lead", "Applicant"], countries: ["United Kingdom"], subjects: [], intakes: [] }, body: marketingTemplates["Courses & intakes"], status: "Sent", createdBy: "Sadman Rahman", createdAt: "2026-09-01", sentAt: "2026-09-03", recipients: 25, excluded: 41 },
    { id: "CMP-002", name: "Ambassador referral push — autumn", purpose: "Ambassador programme", audience: { types: ["Ambassador"], countries: [], subjects: [], intakes: [] }, body: marketingTemplates["Ambassador programme"], status: "Draft", createdBy: "Sadman Rahman", createdAt: "2026-09-15", recipients: 0, excluded: 0 },
    { id: "CMP-003", name: "Education Expo Sylhet", purpose: "Events", audience: { types: ["Lead"], countries: ["Bangladesh"], subjects: [], intakes: [] }, body: marketingTemplates.Events.replace("{date}", "18 Oct"), status: "Scheduled", createdBy: "Bickey Shah", createdAt: "2026-09-12", scheduledFor: "2026-10-10T10:00", recipients: 0, excluded: 0 },
  ]);
}
export function saveCampaigns(next: SmsCampaign[]) {
  campaigns = next;
}
export const nextCampaignId = () => `CMP-${String(getCampaigns().reduce((m, c) => Math.max(m, Number(c.id.slice(4))), 0) + 1).padStart(3, "0")}`;

export function matchesAudience(c: SmsContact, a: SmsAudience) {
  return (!a.types.length || a.types.includes(c.type)) && (!a.countries.length || a.countries.includes(c.country)) && (!a.subjects.length || a.subjects.includes(c.subject)) && (!a.intakes.length || a.intakes.includes(c.intake));
}
