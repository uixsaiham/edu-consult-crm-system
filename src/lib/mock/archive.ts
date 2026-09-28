// Archive for leads, student applications and agent (partner) applications.
// Archiving takes a record out of every active list but keeps the whole record, so it can be
// restored exactly as it was, or deleted permanently once its retention period has passed.

import { hideArchivedLeads, restoreArchivedLeads, type LeadRow } from "@/lib/mock/leads";
import { getApplications, operationsSnapshotDate, saveApplications, takeArchivedApplicationSeed, type ApplicationRow } from "@/lib/mock/applications";
import { getAgents, getArchivedAgentApplicationSeed, saveAgents, type Agent } from "@/lib/mock/agents";
import { initialsFor } from "@/lib/utils";

export const archiveToday = operationsSnapshotDate;

export type ArchiveKind = "leads" | "applications" | "agent-applications";

export const archiveKinds: Record<ArchiveKind, { label: string; singular: string; href: string; retentionYears: number; policy: string }> = {
  leads: {
    label: "Archived Leads",
    singular: "lead",
    href: "/archived/leads",
    retentionYears: 2,
    policy: "Enquiries that never became applications are kept for 2 years, then deleted under UK GDPR data minimisation.",
  },
  applications: {
    label: "Archived Applications",
    singular: "application",
    href: "/archived/applications",
    retentionYears: 6,
    policy: "Student files are kept for 6 years after closing, to cover university audits and UKVI compliance checks.",
  },
  "agent-applications": {
    label: "Archived Agent Applications",
    singular: "agent application",
    href: "/archived/agent-applications",
    retentionYears: 6,
    policy: "Partner KYC records are kept for 6 years for anti-money-laundering and anti-fraud checks.",
  },
};

export const archiveReasons: Record<ArchiveKind, string[]> = {
  leads: ["No response after repeated contact", "Not eligible", "Chose another agency", "Intake missed", "Duplicate record", "Invalid contact details", "Asked not to be contacted"],
  applications: ["Intake concluded", "Student withdrew", "Refused by university", "Visa refused", "Deferred to a later intake", "Enrolled — file closed", "Duplicate application"],
  "agent-applications": ["Application rejected", "Failed KYC checks", "Withdrawn by applicant", "No response to document requests", "Agreement never signed", "Duplicate application"],
};

export interface ArchiveMeta {
  archivedAt: string;
  archivedBy: string;
  reason: string;
  note: string;
}

export interface ArchivedEntry<T> extends ArchiveMeta {
  id: string;
  record: T;
}

export interface ArchiveEvent {
  id: string;
  at: string;
  kind: ArchiveKind;
  action: "Archived" | "Restored" | "Deleted permanently" | "Reason updated";
  names: string[];
  by: string;
}

const addYears = (iso: string, n: number) => `${Number(iso.slice(0, 4)) + n}${iso.slice(4, 10)}`;
export const retentionUntil = (kind: ArchiveKind, archivedAt: string) => addYears(archivedAt, archiveKinds[kind].retentionYears);

const DAY = 86_400_000;
const days = (from: string, to: string) => Math.round((Date.parse(to.slice(0, 10)) - Date.parse(from.slice(0, 10))) / DAY);
export const daysSince = (iso: string) => days(iso, archiveToday);

export type RetentionState = "due" | "soon" | "kept";
/** "due" once the retention period has passed, "soon" within 90 days of it. */
export function retentionState(kind: ArchiveKind, archivedAt: string): RetentionState {
  const left = days(archiveToday, retentionUntil(kind, archivedAt));
  return left <= 0 ? "due" : left <= 90 ? "soon" : "kept";
}

// --- Activity log ----------------------------------------------------------------

let events: ArchiveEvent[] = [];
let eventSeq = 0;
function log(kind: ArchiveKind, action: ArchiveEvent["action"], names: string[], by: string, at = archiveToday) {
  if (!names.length) return;
  events = [{ id: `EV-${++eventSeq}`, at, kind, action, names, by }, ...events];
}
export function getArchiveEvents() {
  ensureSeeded();
  return [...events].sort((a, b) => b.at.localeCompare(a.at) || Number(b.id.slice(3)) - Number(a.id.slice(3)));
}

// --- Stores ----------------------------------------------------------------------

interface Store<T extends { id: string }> {
  list: () => ArchivedEntry<T>[];
  get: (id: string) => ArchivedEntry<T> | undefined;
  archive: (rows: T[], meta: Omit<ArchiveMeta, "archivedAt">) => void;
  restore: (ids: string[], by: string) => T[];
  purge: (ids: string[], by: string) => void;
  update: (id: string, meta: Pick<ArchiveMeta, "reason" | "note">, by: string) => void;
}

function makeStore<T extends { id: string }>(
  kind: ArchiveKind,
  name: (row: T) => string,
  seed: () => ArchivedEntry<T>[],
  removeFromActive: (rows: T[]) => void,
  returnToActive: (rows: T[]) => void
): Store<T> {
  let items: ArchivedEntry<T>[] | null = null;
  const all = () => {
    if (!items) {
      items = seed();
      [...items].reverse().forEach((e) => log(kind, "Archived", [name(e.record)], e.archivedBy, e.archivedAt));
    }
    return items;
  };
  return {
    list: () => [...all()].sort((a, b) => b.archivedAt.localeCompare(a.archivedAt)),
    get: (id) => all().find((e) => e.id === id),
    archive(rows, meta) {
      const ids = new Set(rows.map((r) => r.id));
      items = [...rows.map((record) => ({ ...meta, archivedAt: archiveToday, id: record.id, record })), ...all().filter((e) => !ids.has(e.id))];
      removeFromActive(rows);
      log(kind, "Archived", rows.map(name), meta.archivedBy);
    },
    restore(ids, by) {
      const set = new Set(ids);
      const back = all().filter((e) => set.has(e.id)).map((e) => e.record);
      items = all().filter((e) => !set.has(e.id));
      returnToActive(back);
      log(kind, "Restored", back.map(name), by);
      return back;
    },
    purge(ids, by) {
      const set = new Set(ids);
      log(kind, "Deleted permanently", all().filter((e) => set.has(e.id)).map((e) => name(e.record)), by);
      items = all().filter((e) => !set.has(e.id));
    },
    update(id, meta, by) {
      const entry = all().find((e) => e.id === id);
      if (!entry) return;
      items = all().map((e) => (e.id === id ? { ...e, ...meta } : e));
      log(kind, "Reason updated", [name(entry.record)], by);
    },
  };
}

// --- Seeds -------------------------------------------------------------------------

type LeadSeed = [name: string, phone: string, email: string, country: string, branch: string, counsellor: string, status: LeadRow["status"], note: string, source: string, created: string, archivedAt: string, archivedBy: string, reason: string, archiveNote: string];

const leadSeeds: LeadSeed[] = [
  ["Rakibul Hasan", "+8801711456230", "rakib.hasan94@gmail.com", "Bangladesh", "Dhaka HQ", "Harunor Rashid", "Lost", "Called 6 times, no answer", "BD to UK Student Fair", "2024-02-11", "2024-06-20", "Harunor Rashid", "No response after repeated contact", "Six calls and three WhatsApp messages over 8 weeks."],
  ["Ayesha Siddika", "+8801819203344", "ayesha.siddika@yahoo.com", "Bangladesh", "Sylhet", "Bickey Shah", "Lost", "Wants Canada only", "Expo | Oct24 Sylhet", "2024-10-19", "2024-11-02", "Bickey Shah", "Chose another agency", "Signed with a Canada-only agency after the expo."],
  ["Emeka Obi", "+447700112398", "emeka.obi@gmail.com", "United Kingdom", "London", "Alif Tasnim", "Contacted", "No UK qualifications recognised", "Health & Care Campaign", "2024-05-03", "2024-07-15", "Alif Tasnim", "Not eligible", "Needs a Level 3 access course first — referred to local college."],
  ["Sabbir Ahmed", "+8801556443211", "sabbir.a@gmail.com", "Bangladesh", "", "", "New", "", "Facebook Ads - Sep Intake", "2024-08-01", "2024-08-03", "System", "Duplicate record", "Same person as LD-3712 — merged."],
  ["Hannah Clarke", "+447912003344", "hannah.clarke@outlook.com", "United Kingdom", "Milton Keynes", "Yuliana Prokipchak", "Follow-up", "Interested in Jan intake", "August & Sep Campaign", "2025-09-02", "2026-02-10", "Yuliana Prokipchak", "Intake missed", "Missed the January deadline; said she'd come back for September but hasn't replied."],
  ["Mahmudul Hasan Rony", "+8801912000000", "rony.test@mail.com", "Bangladesh", "", "", "New", "", "BD | Europe | Direct", "2025-11-14", "2025-11-15", "Sadman Rahman", "Invalid contact details", "Phone number unreachable and email bounced."],
  ["Precious Adeyemi", "+447401234567", "precious.adeyemi@gmail.com", "United Kingdom", "Manchester", "Nusrat Choudhury", "Lost", "", "UGM_SEP26 - Facebook", "2026-03-05", "2026-04-18", "Nusrat Choudhury", "Asked not to be contacted", "Requested no further contact by email — marketing consent withdrawn."],
  ["Nazmul Karim", "+8801677889900", "nazmul.karim@gmail.com", "Bangladesh", "Dhaka HQ", "Alif Tasnim", "Qualified", "IELTS 5.0 — needs 6.0", "Google Ads - UK Study", "2025-12-01", "2026-05-22", "Alif Tasnim", "Not eligible", "IELTS retake score still below 6.0; suggested pre-sessional route for 2027."],
  ["Fatima Begum", "+447822334455", "fatima.begum@hotmail.co.uk", "United Kingdom", "London", "Alif Tasnim", "Contacted", "Part-time study only", "Website Inquiry", "2026-01-20", "2026-06-30", "Alif Tasnim", "No response after repeated contact", ""],
  ["Tanvir Alam", "+8801555667788", "tanvir.alam.bd@gmail.com", "Bangladesh", "Sylhet", "Bickey Shah", "Follow-up", "Waiting for HSC result", "Expo | Oct26 Sylhet", "2026-04-11", "2026-08-29", "Bickey Shah", "Intake missed", "HSC result came too late for September; follow up for January 2027."],
  ["Kofi Asante", "+447733221100", "kofi.asante@gmail.com", "United Kingdom", "", "", "New", "", "Health & Care Campaign", "2026-07-08", "2026-09-05", "Sadman Rahman", "Duplicate record", "Submitted the form twice."],
  ["Shirin Akter", "+8801999887766", "shirin.akter@gmail.com", "Bangladesh", "Dhaka HQ", "Harunor Rashid", "Lost", "Budget too low", "BD | Can/NZ | Sep Intake", "2026-06-02", "2026-09-12", "Harunor Rashid", "Not eligible", "Can't show the required funds for 28 days."],
];

function seedLeads(): ArchivedEntry<LeadRow>[] {
  return leadSeeds.map(([name, phone, email, country, branch, counsellor, status, leadNote, leadSource, createdDate, archivedAt, archivedBy, reason, note], i) => ({
    id: `LD-${(3790 - i * 7).toString().padStart(4, "0")}`,
    archivedAt,
    archivedBy,
    reason,
    note,
    record: { id: `LD-${(3790 - i * 7).toString().padStart(4, "0")}`, name, initials: initialsFor(name), phone, email, country, branch, counsellor, status, leadNote, leadSource, createdDate },
  }));
}

function seedApplications(): ArchivedEntry<ApplicationRow>[] {
  return takeArchivedApplicationSeed().map((a) => {
    // Closed files are archived a few months after applying, once their intake has passed.
    const at = new Date(Math.min(Date.parse(a.createdAt) + (a.stage === "Enrolled" ? 200 : 120) * DAY, Date.parse(archiveToday))).toISOString().slice(0, 10);
    const reason =
      a.stage === "Enrolled" ? "Enrolled — file closed" : a.stage === "Withdrawn" ? (a.notes[0]?.text.includes("deferred") ? "Deferred to a later intake" : "Student withdrew") : a.notes[0]?.text.startsWith("Refused") || a.notes[0]?.text.includes("requirement") ? "Refused by university" : "Intake concluded";
    return { id: a.id, archivedAt: at, archivedBy: a.stage === "Enrolled" ? "System (intake close)" : a.counsellor, reason, note: a.notes[0]?.text ?? "", record: a };
  });
}

const agentSeedMeta: Record<string, Omit<ArchiveMeta, "note"> & { note?: string }> = {
  "AGT-901": { archivedAt: "2025-11-20", archivedBy: "Sadman Rahman", reason: "Failed KYC checks" },
  "AGT-902": { archivedAt: "2026-01-15", archivedBy: "Nusrat Choudhury", reason: "No response to document requests" },
  "AGT-903": { archivedAt: "2025-09-01", archivedBy: "Alif Tasnim", reason: "Application rejected" },
  "AGT-904": { archivedAt: "2026-03-10", archivedBy: "Bickey Shah", reason: "Withdrawn by applicant" },
  "AGT-905": { archivedAt: "2026-02-02", archivedBy: "Nusrat Choudhury", reason: "Failed KYC checks", note: "Reported to compliance — do not re-onboard without director sign-off." },
  "AGT-906": { archivedAt: "2024-06-25", archivedBy: "Harunor Rashid", reason: "Duplicate application" },
  "AGT-907": { archivedAt: "2025-08-30", archivedBy: "Bickey Shah", reason: "Agreement never signed" },
};

function seedAgentApplications(): ArchivedEntry<Agent>[] {
  return getArchivedAgentApplicationSeed().map((a) => {
    const m = agentSeedMeta[a.id];
    return { id: a.id, ...m, note: m.note ?? a.notes ?? a.rejectionReason ?? "", record: a };
  });
}

// --- Public stores -----------------------------------------------------------------

export const leadArchive = makeStore<LeadRow>(
  "leads",
  (l) => l.name,
  seedLeads,
  (rows) => hideArchivedLeads(rows.map((r) => r.id)),
  restoreArchivedLeads
);

export const applicationArchive = makeStore<ApplicationRow>(
  "applications",
  (a) => a.applicant,
  seedApplications,
  (rows) => {
    const ids = new Set(rows.map((r) => r.id));
    saveApplications(getApplications().filter((a) => !ids.has(a.id)));
  },
  (rows) => saveApplications([...rows, ...getApplications().filter((a) => !rows.some((r) => r.id === a.id))])
);

export const agentApplicationArchive = makeStore<Agent>(
  "agent-applications",
  (a) => a.name,
  seedAgentApplications,
  (rows) => {
    const ids = new Set(rows.map((r) => r.id));
    saveAgents(getAgents().filter((a) => !ids.has(a.id)));
  },
  (rows) => saveAgents([...getAgents().filter((a) => !rows.some((r) => r.id === a.id)), ...rows])
);

/** Seeds every store so the activity log and overview counts are complete. */
function ensureSeeded() {
  leadArchive.get("");
  applicationArchive.get("");
  agentApplicationArchive.get("");
}

export function archiveSummary() {
  ensureSeeded();
  const sum = <T,>(kind: ArchiveKind, list: ArchivedEntry<T>[]) => ({
    kind,
    total: list.length,
    last30: list.filter((e) => daysSince(e.archivedAt) <= 30).length,
    due: list.filter((e) => retentionState(kind, e.archivedAt) === "due").length,
    soon: list.filter((e) => retentionState(kind, e.archivedAt) === "soon").length,
  });
  return [sum("leads", leadArchive.list()), sum("applications", applicationArchive.list()), sum("agent-applications", agentApplicationArchive.list())];
}
