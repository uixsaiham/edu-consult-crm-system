"use client";

// The signed-in person's own account: profile, notification preferences and sign-in security.
// Per browser until the CRM has a backend, like the other settings stores.

import { defaultUser, type CurrentUser } from "@/lib/mock/user";
import { createSettingsStore } from "./store";

export const profileStore = createSettingsStore<CurrentUser>("bhe-crm:my-profile", defaultUser);
export const withProfileDefaults = (u: Partial<CurrentUser>): CurrentUser => ({ ...defaultUser, ...u });

// --- Notifications --------------------------------------------------------------------------

export const notificationChannels = ["In-app", "Email", "WhatsApp"] as const;
export type NotificationChannel = (typeof notificationChannels)[number];

export const notificationEvents = [
  { key: "lead-assigned", label: "A lead is assigned to me", group: "Leads & follow-ups" },
  { key: "follow-up-due", label: "A follow-up is due or overdue", group: "Leads & follow-ups" },
  { key: "appointment", label: "Appointment booked or changed", group: "Leads & follow-ups" },
  { key: "stage-change", label: "An application I own changes stage", group: "Applications" },
  { key: "document", label: "A student uploads a document", group: "Applications" },
  { key: "deadline", label: "CAS or visa deadline within 7 days", group: "Applications" },
  { key: "mention", label: "Someone mentions me in a note", group: "Team" },
  { key: "announcement", label: "New announcement", group: "Team" },
  { key: "training", label: "Training assigned or due", group: "Team" },
  { key: "agent", label: "Agent application needs review", group: "Admin" },
  { key: "security", label: "New sign-in to my account", group: "Admin" },
] as const;
export type NotificationEventKey = (typeof notificationEvents)[number]["key"];

export interface NotificationPrefs {
  matrix: Record<NotificationEventKey, NotificationChannel[]>;
  digest: "Off" | "Daily at 8am" | "Weekly on Monday";
  sound: boolean;
  muteWhenDnd: boolean;
}

export const defaultNotificationPrefs: NotificationPrefs = {
  matrix: {
    "lead-assigned": ["In-app", "Email"],
    "follow-up-due": ["In-app", "WhatsApp"],
    appointment: ["In-app", "Email"],
    "stage-change": ["In-app"],
    document: ["In-app"],
    deadline: ["In-app", "Email", "WhatsApp"],
    mention: ["In-app", "Email"],
    announcement: ["In-app"],
    training: ["In-app", "Email"],
    agent: ["In-app", "Email"],
    security: ["In-app", "Email"],
  },
  digest: "Daily at 8am",
  sound: true,
  muteWhenDnd: true,
};
export const notificationStore = createSettingsStore<NotificationPrefs>("bhe-crm:my-notifications", defaultNotificationPrefs);

// --- Security -----------------------------------------------------------------------------------

export interface Session {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  current?: boolean;
}

export interface SecurityState {
  passwordChangedAt: string;
  twoFactor: boolean;
  twoFactorMethod: "Authenticator app" | "SMS code";
  recoveryCodesGeneratedAt: string;
  sessions: Session[];
}

export const defaultSecurity: SecurityState = {
  passwordChangedAt: "2026-06-02",
  twoFactor: true,
  twoFactorMethod: "Authenticator app",
  recoveryCodesGeneratedAt: "2026-06-02",
  sessions: [
    { id: "current", device: "This browser", location: "Dhaka, Bangladesh", ip: "This device", lastActive: "Now", current: true },
    { id: "S-2", device: "Chrome · Windows", location: "Dhaka HQ office", ip: "103.4.145.22", lastActive: "2026-09-17T08:02:11Z" },
    { id: "S-3", device: "BHE CRM app · iPhone", location: "Dhaka, Bangladesh (mobile data)", ip: "37.111.203.9", lastActive: "2026-09-16T19:40:00Z" },
  ],
};
export const securityStore = createSettingsStore<SecurityState>("bhe-crm:my-security", defaultSecurity);

/** Rough strength score 0–4 for the password meter. */
export function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  if (/(.)\1{2,}|password|bheuni|123456|qwerty/i.test(pw)) score = Math.max(0, score - 2);
  return { score, label: ["Very weak", "Weak", "Fair", "Good", "Strong"][score] };
}

export function makeRecoveryCodes() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(80);
  crypto.getRandomValues(bytes);
  return Array.from({ length: 8 }, (_, i) => {
    const chunk = [...bytes.slice(i * 10, i * 10 + 10)].map((b) => alphabet[b % alphabet.length]).join("");
    return `${chunk.slice(0, 5)}-${chunk.slice(5)}`;
  });
}
