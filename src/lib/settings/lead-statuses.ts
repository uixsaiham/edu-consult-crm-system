"use client";

import type { LeadStatus } from "@/lib/mock/leads";
import { createSettingsStore } from "./store";

/**
 * A detailed status counsellors can set on a lead. Each one sits under one of the six
 * pipeline stages (`LeadStatus`), so reports and filters still roll up cleanly.
 */
export interface LeadStatusOption {
  id: string;
  name: string;
  group: LeadStatus;
  active: boolean;
  /** ISO date-time. */
  createdAt: string;
}

export const leadStatusGroupHints: Record<LeadStatus, string> = {
  New: "Just came in, not contacted yet",
  Contacted: "Reached out, waiting on the student",
  "Follow-up": "Interested, needs another conversation later",
  Qualified: "Eligible and ready to apply",
  Converted: "An application has been made",
  Lost: "Won't go ahead",
};

const option = (id: string, name: string, group: LeadStatus, active: boolean, createdAt: string): LeadStatusOption => ({ id, name, group, active, createdAt });

export const defaultLeadStatuses: LeadStatusOption[] = [
  option("event", "From an event", "New", true, "2026-05-26T16:26:38"),
  option("expo", "From an expo", "New", true, "2025-12-23T09:30:12"),
  option("no-answer", "No answer", "Contacted", false, "2026-07-27T14:29:46"),
  option("ielts-preparation", "Preparing for IELTS", "Follow-up", true, "2026-08-09T07:53:30"),
  option("future-intake", "Future intake", "Follow-up", true, "2025-08-06T13:46:53"),
  option("bad-timing", "Bad timing", "Follow-up", true, "2022-08-08T14:14:48"),
  option("missing-documents", "Documents missing", "Follow-up", false, "2023-07-23T11:48:34"),
  option("qualified", "Qualified", "Qualified", false, "2026-07-22T11:29:17"),
  option("documents-received", "Documents received", "Qualified", false, "2023-07-23T11:48:22"),
  option("apply-done", "Application made", "Converted", false, "2023-03-25T08:00:10"),
  option("not-interested", "Not interested", "Lost", true, "2022-08-25T13:37:05"),
  option("unreachable", "Unreachable", "Lost", true, "2022-08-08T14:14:48"),
  option("not-eligible", "Not eligible", "Lost", true, "2023-07-23T11:50:00"),
  option("not-potential", "Low potential", "Lost", true, "2022-03-06T10:30:31"),
  option("duplicated", "Duplicate lead", "Lost", true, "2024-02-08T15:34:44"),
  option("others-country", "Other country", "Lost", true, "2025-12-03T11:11:02"),
  option("incorrect-details", "Incorrect contact details", "Lost", false, "2026-07-27T12:04:17"),
  option("not-eligible-sfe", "Not eligible for SFE", "Lost", false, "2023-07-23T11:49:49"),
  option("sfe-taken", "SFE already used (1–3 years)", "Lost", false, "2023-12-28T12:13:59"),
  option("eu-family-under-3", "EU family, under 3 years", "Lost", false, "2023-08-08T11:24:36"),
];

export const leadStatusStore = createSettingsStore<LeadStatusOption[]>("bhe-crm:lead-statuses", defaultLeadStatuses);
