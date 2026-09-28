"use client";

// Audit trail for Settings › Audit Logs: who did what, to which record, and what changed.
// Seeded history + the archive's own activity + everything recorded on the Settings pages.

import { getArchiveEvents, archiveKinds } from "@/lib/mock/archive";
import { createSettingsStore } from "./store";

export const auditModules = ["Security", "Settings", "Leads", "Applications", "Agents", "People", "Finance", "Communications", "Archive", "Training"] as const;
export type AuditModule = (typeof auditModules)[number];
export const auditActions = ["Signed in", "Signed out", "Sign-in failed", "Created", "Updated", "Deleted", "Approved", "Archived", "Restored", "Exported", "Sent", "Permission changed", "Settings changed"] as const;
export type AuditAction = (typeof auditActions)[number];
export type AuditSeverity = "info" | "notice" | "critical";

export interface AuditChange {
  field: string;
  from: string;
  to: string;
}

export interface AuditEvent {
  id: string;
  /** ISO date-time. */
  at: string;
  actor: string;
  role: string;
  module: AuditModule;
  action: AuditAction;
  entity: string;
  entityId?: string;
  summary: string;
  changes?: AuditChange[];
  ip: string;
  device: string;
  severity: AuditSeverity;
}

/** How long the audit trail is kept (shown on the page; enforced once there's a backend). */
export const AUDIT_RETENTION_YEARS = 7;

type Seed = [at: string, actor: string, role: string, module: AuditModule, action: AuditAction, entity: string, entityId: string, summary: string, severity?: AuditSeverity, changes?: AuditChange[], ip?: string, device?: string];

const DHAKA = "103.4.145.22";
const LONDON = "81.2.69.160";
const SYLHET = "103.230.104.7";
const MANC = "86.12.40.201";

const seeds: Seed[] = [
  ["2026-09-17T08:02:11Z", "Sadman Rahman", "Admissions Lead", "Security", "Signed in", "CRM", "", "Signed in with password + authenticator app", "info", undefined, DHAKA, "Chrome · macOS"],
  ["2026-09-17T08:14:40Z", "Sadman Rahman", "Admissions Lead", "Applications", "Updated", "Application", "APP-2026-1791", "Stage changed for Sophie Robinson", "info", [{ field: "Stage", from: "App submitted", to: "Conditional offer" }], DHAKA, "Chrome · macOS"],
  ["2026-09-17T08:31:02Z", "Nusrat Choudhury", "Senior Counsellor", "Communications", "Sent", "SMS", "SMS-00001", "Document request texted to Sophie Robinson", "info", undefined, LONDON, "Edge · Windows"],
  ["2026-09-17T09:05:44Z", "Bickey Shah", "Branch Manager", "Leads", "Exported", "Leads", "", "Exported 212 leads (Sylhet, Sept intake) to CSV", "notice", undefined, SYLHET, "Chrome · Windows"],
  ["2026-09-17T09:40:19Z", "Unknown", "—", "Security", "Sign-in failed", "CRM", "", "5 failed password attempts for harunor.rashid@bheuni.com — account locked for 15 minutes", "critical", undefined, "185.220.101.4", "Unknown · Linux"],
  ["2026-09-17T10:12:55Z", "Harunor Rashid", "Senior Counsellor", "Security", "Signed in", "CRM", "", "Signed in after password reset", "notice", undefined, DHAKA, "Chrome · Android"],
  ["2026-09-17T11:26:30Z", "Sadman Rahman", "Admissions Lead", "Agents", "Approved", "Agent", "AGT-015", "Approved Lagos Scholars Ltd as Silver partner", "notice", [{ field: "Status", from: "Pending", to: "Active" }, { field: "Commission share", from: "—", to: "55%" }], DHAKA, "Chrome · macOS"],
  ["2026-09-17T12:03:18Z", "Mahbuba Akhter", "Finance Officer", "Finance", "Updated", "Commission", "COM-2026-0412", "Marked University of Hertfordshire invoice as paid", "info", [{ field: "Status", from: "Invoiced", to: "Paid" }], LONDON, "Safari · macOS"],
  ["2026-09-17T13:47:09Z", "Tanvir Ahmed", "Branch Manager", "People", "Permission changed", "Staff", "STF-009", "Changed role for Sadia Afrin", "notice", [{ field: "Role", from: "Counsellor", to: "Senior Counsellor" }], DHAKA, "Chrome · Windows"],
  ["2026-09-16T07:55:02Z", "Tanvir Ahmed", "Branch Manager", "Security", "Signed in", "CRM", "", "Signed in", "info", undefined, DHAKA, "Chrome · Windows"],
  ["2026-09-16T09:18:36Z", "Alif Tasnim", "Senior Counsellor", "Leads", "Updated", "Lead", "LD-4818", "Assigned Taimur Khan", "info", [{ field: "Counsellor", from: "Unassigned", to: "Alif Tasnim" }, { field: "Branch", from: "—", to: "London" }], LONDON, "Chrome · macOS"],
  ["2026-09-16T10:40:51Z", "Alif Tasnim", "Senior Counsellor", "Leads", "Created", "Lead", "LD-4820", "Walk-in lead Sufi Mahamud Dollar added at front desk", "info", undefined, LONDON, "Chrome · macOS"],
  ["2026-09-16T11:02:14Z", "Sadman Rahman", "Admissions Lead", "Settings", "Settings changed", "Company settings", "", "Changed lead dormancy threshold", "notice", [{ field: "Dormancy threshold", from: "21 days", to: "14 days" }], DHAKA, "Chrome · macOS"],
  ["2026-09-16T14:22:47Z", "Nusrat Choudhury", "Senior Counsellor", "Applications", "Deleted", "Application", "APP-2026-1702", "Deleted duplicate application for Kofi Asante", "notice", undefined, MANC, "Edge · Windows"],
  ["2026-09-16T15:30:00Z", "Sadman Rahman", "Admissions Lead", "Training", "Created", "Video session", "VID-014", "Added video session “UK visa basics for counsellors”", "info", undefined, DHAKA, "Chrome · macOS"],
  ["2026-09-15T08:10:33Z", "Yuliana Prokipchak", "Counsellor", "Security", "Signed in", "CRM", "", "Signed in", "info", undefined, "31.94.18.77", "Firefox · Windows"],
  ["2026-09-15T09:44:12Z", "Yuliana Prokipchak", "Counsellor", "Applications", "Updated", "Application", "APP-2026-1688", "Uploaded CAS for Daniel Osei", "info", [{ field: "Stage", from: "Unconditional offer", to: "CAS issued" }], "31.94.18.77", "Firefox · Windows"],
  ["2026-09-15T12:05:27Z", "Sadman Rahman", "Admissions Lead", "People", "Created", "Staff", "STF-027", "Invited Kevin Brown (Counsellor, London)", "notice", undefined, DHAKA, "Chrome · macOS"],
  ["2026-09-15T16:48:03Z", "Mahbuba Akhter", "Finance Officer", "Finance", "Exported", "Commission report", "", "Exported Q3 agent commission report", "notice", undefined, LONDON, "Safari · macOS"],
  ["2026-09-14T10:20:15Z", "Sadman Rahman", "Admissions Lead", "Settings", "Permission changed", "Role", "marketing", "Marketing Executive can now export leads", "notice", [{ field: "Leads", from: "View, Create", to: "View, Create, Export" }], DHAKA, "Chrome · macOS"],
  ["2026-09-14T11:31:40Z", "Bickey Shah", "Branch Manager", "Agents", "Updated", "Agent", "AGT-008", "Suspended Summit Academic Network", "critical", [{ field: "Status", from: "Active", to: "Suspended" }], SYLHET, "Chrome · Windows"],
  ["2026-09-13T09:02:08Z", "Sadman Rahman", "Admissions Lead", "Security", "Updated", "Security policy", "", "Two-factor sign-in made mandatory for all staff", "critical", [{ field: "Require 2FA", from: "Admins only", to: "Everyone" }], DHAKA, "Chrome · macOS"],
  ["2026-09-12T13:15:49Z", "Nusrat Choudhury", "Senior Counsellor", "Leads", "Exported", "Leads", "", "Exported 38 leads (Manchester, Health & Care campaign)", "notice", undefined, MANC, "Edge · Windows"],
  ["2026-09-11T15:40:22Z", "Tanvir Ahmed", "Branch Manager", "People", "Deleted", "Staff", "STF-019", "Deactivated account for a leaver", "notice", [{ field: "Status", from: "Active", to: "Inactive" }], DHAKA, "Chrome · Windows"],
  ["2026-09-10T08:30:00Z", "System", "Automation", "Leads", "Updated", "Leads", "", "Nightly sweep: 17 leads with no activity for 14 days flagged as dormant", "info", undefined, "—", "Scheduled job"],
];

function seedEvents(): AuditEvent[] {
  return seeds.map(([at, actor, role, module, action, entity, entityId, summary, severity = "info", changes, ip = DHAKA, device = "Chrome · macOS"], i) => ({
    id: `AUD-${String(9000 - i)}`, at, actor, role, module, action, entity, entityId: entityId || undefined, summary, severity, changes, ip, device,
  }));
}

function archiveAsAudit(): AuditEvent[] {
  return getArchiveEvents().map((e) => ({
    id: `AUD-${e.id}`,
    at: `${e.at}T12:00:00Z`,
    actor: e.by,
    role: e.by.startsWith("System") ? "Automation" : "Staff",
    module: "Archive",
    action: e.action === "Deleted permanently" ? "Deleted" : e.action === "Reason updated" ? "Updated" : e.action,
    entity: archiveKinds[e.kind].singular.replace(/^\w/, (c) => c.toUpperCase()),
    summary: `${e.action} ${e.names.length === 1 ? e.names[0] : `${e.names.length} ${archiveKinds[e.kind].singular}s`} (${archiveKinds[e.kind].label})`,
    severity: e.action === "Deleted permanently" ? "critical" : "info",
    ip: "—",
    device: "CRM",
  }));
}

/** Events recorded in this browser (Settings changes), newest first. */
export const auditStore = createSettingsStore<AuditEvent[]>("bhe-crm:audit-events", []);

function deviceName() {
  if (typeof navigator === "undefined") return "Browser";
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "Browser";
  const os = /Mac OS/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : "Linux";
  return `${browser} · ${os}`;
}

export function logAudit(e: Omit<AuditEvent, "id" | "at" | "ip" | "device" | "severity"> & { severity?: AuditSeverity }) {
  const events = auditStore.get();
  const next: AuditEvent = { severity: "notice", ...e, id: `AUD-L${Date.now().toString(36)}`, at: new Date().toISOString(), ip: "This device", device: deviceName() };
  auditStore.set([next, ...events].slice(0, 300));
}

export function allAuditEvents(recorded: AuditEvent[]) {
  return [...recorded, ...seedEvents(), ...archiveAsAudit()].sort((a, b) => b.at.localeCompare(a.at));
}

/** Field-by-field differences between two flat objects, for the audit trail. */
export function diff<T extends object>(before: T, after: T, labels: Partial<Record<keyof T, string>>): AuditChange[] {
  const show = (v: unknown) => (Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "On" : "Off") : String(v ?? "")) || "—";
  return (Object.keys(after) as (keyof T)[])
    .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    .map((k) => ({ field: labels[k] ?? String(k), from: show(before[k]), to: show(after[k]) }));
}
