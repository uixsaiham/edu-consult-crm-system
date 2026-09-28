export type PresenceStatus = "Available" | "In a meeting" | "Away" | "Do not disturb";
export const presenceStatuses: { value: PresenceStatus; dot: string; hint: string }[] = [
  { value: "Available", dot: "bg-success", hint: "New leads can be auto-assigned to you" },
  { value: "In a meeting", dot: "bg-warning", hint: "Colleagues see you're busy" },
  { value: "Away", dot: "bg-slate-400", hint: "Auto-assignment pauses" },
  { value: "Do not disturb", dot: "bg-danger", hint: "Mutes notifications except urgent ones" },
];

export const avatarColors = ["bg-primary", "bg-violet-500", "bg-teal-500", "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-slate-600"];

export interface CurrentUser {
  /** Links the signed-in person to their People record. */
  staffId: string;
  name: string;
  preferredName: string;
  email: string;
  phone: string;
  /** Set by an admin in People; drives menu permissions, so not editable from the profile. */
  role: string;
  jobTitle: string;
  branch: string;
  languages: string[];
  timezone: string;
  bio: string;
  avatarColor: string;
  /** Small JPEG data URL, resized in the browser. */
  photo?: string;
  status: PresenceStatus;
  statusMessage: string;
}

export const defaultUser: CurrentUser = {
  staffId: "STF-001",
  name: "Sadman Rahman",
  preferredName: "Sadman",
  email: "sadman.rahman@bheuni.com",
  phone: "+880 1711 223344",
  role: "Admissions Lead",
  jobTitle: "Admissions Lead",
  branch: "Dhaka HQ",
  languages: ["Bengali", "English"],
  timezone: "Asia/Dhaka",
  bio: "Leads admissions across all BHE Uni branches. Ask me about UK university partnerships, CAS and complex visa cases.",
  avatarColor: "bg-primary",
  status: "Available",
  statusMessage: "",
};
