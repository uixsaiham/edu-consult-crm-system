"use client";

import { createSettingsStore } from "./store";

/** Which students a status applies to. "Both" shows for EU/Home and International applications. */
export type ProcessTrack = "International" | "EU/Home" | "Both";
/** What a status means for the application — drives its colour everywhere it's shown. */
export type ProcessOutcome = "waiting" | "active" | "done" | "stopped";

export interface ProcessStage {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export interface ProcessStatus {
  id: string;
  stageId: string;
  name: string;
  track: ProcessTrack;
  outcome: ProcessOutcome;
  active: boolean;
  createdAt: string;
}

export interface ApplicationProcess {
  /** In pipeline order. */
  stages: ProcessStage[];
  statuses: ProcessStatus[];
}

export const processTracks: ProcessTrack[] = ["International", "EU/Home", "Both"];

export const processOutcomes: Record<ProcessOutcome, { label: string; hint: string; dot: string; text: string; bg: string }> = {
  waiting: { label: "Waiting", hint: "On hold for the student, university or embassy", dot: "bg-warning", text: "text-warning", bg: "bg-warning-soft" },
  active: { label: "In progress", hint: "Moving forward, action under way", dot: "bg-primary", text: "text-primary", bg: "bg-primary-soft" },
  done: { label: "Completed", hint: "This step finished successfully", dot: "bg-success", text: "text-success", bg: "bg-success-soft" },
  stopped: { label: "Stopped", hint: "Rejected, refused or cancelled", dot: "bg-danger", text: "text-danger", bg: "bg-danger-soft" },
};

const seedDate = "2026-09-10";
const stage = (id: string, name: string, description: string): ProcessStage => ({ id, name, description, active: true });
const status = (stageId: string, name: string, outcome: ProcessOutcome): ProcessStatus => ({
  id: `${stageId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  stageId,
  name,
  outcome,
  track: "International",
  active: true,
  createdAt: seedDate,
});

export const defaultApplicationProcess: ApplicationProcess = {
  stages: [
    stage("application", "Application", "Submitting to the university and hearing back"),
    stage("interview", "Interview", "University or credibility interview"),
    stage("assessment", "Assessment", "University's assessment of the student"),
    stage("tuition", "Tuition fees", "Deposit and tuition payments"),
    stage("visa-documents", "Visa documents", "Preparing and submitting the visa file"),
    stage("visa-appointment", "Visa appointment", "Biometrics or embassy appointment"),
    stage("visa-decision", "Visa decision", "Outcome of the visa application"),
  ],
  statuses: [
    status("application", "Application submitted", "active"),
    status("application", "Application accepted", "done"),
    status("application", "Application rejected", "stopped"),
    status("interview", "Interview pending", "waiting"),
    status("interview", "Interview invite sent", "active"),
    status("interview", "Interview completed", "done"),
    status("interview", "Interview cancelled", "stopped"),
    status("assessment", "Assessment approved", "done"),
    status("assessment", "Assessment declined", "stopped"),
    status("tuition", "Deposit paid", "active"),
    status("tuition", "Paid in full", "done"),
    status("visa-documents", "Documents pending", "waiting"),
    status("visa-documents", "Documents submitted", "done"),
    status("visa-documents", "Submission cancelled", "stopped"),
    status("visa-appointment", "Appointment pending", "waiting"),
    status("visa-appointment", "Appointment booked", "active"),
    status("visa-appointment", "Appointment cancelled", "stopped"),
    status("visa-decision", "Visa granted", "done"),
    status("visa-decision", "Visa cancelled", "stopped"),
  ],
};

export const applicationProcessStore = createSettingsStore<ApplicationProcess>("bhe-crm:application-process", defaultApplicationProcess);

/** True when a status shows for the given track filter ("Both" statuses match either track). */
export const matchesTrack = (s: ProcessStatus, track: string) => !track || s.track === track || s.track === "Both";

export const newProcessId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
