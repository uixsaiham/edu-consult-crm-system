// Mock data for the top bar's Follow up, Meeting and Notes menus.
// Dates are relative to the same snapshot date the dashboard uses.

export interface FollowUp {
  id: string;
  lead: string;
  note: string;
  due: string; // YYYY-MM-DD
  done: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  attendee: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export interface QuickNote {
  id: string;
  text: string;
  created: string;
}

export function getFollowUps(): FollowUp[] {
  return [
    { id: "fu-1", lead: "Ismat Jerin", note: "Call about September intake options", due: "2026-09-15", done: false },
    { id: "fu-2", lead: "Robiul Awal", note: "Send course shortlist", due: "2026-09-17", done: false },
    { id: "fu-3", lead: "William Adeyemi", note: "Chase missing IELTS certificate", due: "2026-09-17", done: false },
    { id: "fu-4", lead: "Amara Nwosu", note: "Confirm tuition deposit received", due: "2026-09-19", done: false },
    { id: "fu-5", lead: "Rakibul Hasan", note: "Check passport copy upload", due: "2026-09-22", done: false },
  ];
}

export function getMeetings(): Meeting[] {
  return [
    { id: "mt-1", title: "Visa interview prep", attendee: "Farzana Islam", date: "2026-09-17", time: "11:00" },
    { id: "mt-2", title: "Counselling session", attendee: "Nusrat Jahan", date: "2026-09-17", time: "15:30" },
    { id: "mt-3", title: "Partner review", attendee: "Gunjon Education", date: "2026-09-18", time: "10:00" },
    { id: "mt-4", title: "Offer walkthrough", attendee: "Taimur Khan", date: "2026-09-21", time: "14:00" },
  ];
}

export function getQuickNotes(): QuickNote[] {
  return [
    { id: "nt-1", text: "Teesside has extended the September deadline to 30 Sep.", created: "2h ago" },
    { id: "nt-2", text: "Ask finance about the London office commission report.", created: "Yesterday" },
    { id: "nt-3", text: "Update the CAS checklist template before Monday.", created: "2 days ago" },
  ];
}
