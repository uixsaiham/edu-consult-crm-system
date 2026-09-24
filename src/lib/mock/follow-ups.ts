// Mock follow-ups, generated deterministically from the mock leads so names,
// phones, branches and counsellors match the Leads page.
import { counsellors, operationsSnapshotDate } from "@/lib/mock/applications";
import { getLeads } from "@/lib/mock/leads";

export type FollowUpStatus = "Pending" | "Completed" | "Cancelled";

export interface FollowUpRecord {
  id: string;
  leadId: string;
  leadName: string;
  phone: string;
  branch: string;
  counsellor: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  note: string;
  createdBy: string;
  status: FollowUpStatus;
}

/** "Today" for follow-ups — the same snapshot date the rest of the mock data uses. */
export const followUpToday = operationsSnapshotDate;

const notes = [
  "Call to confirm intake preference",
  "Send shortlist of universities",
  "Chase missing IELTS certificate",
  "Discuss tuition deposit and payment plan",
  "Check passport copy upload",
  "Book counselling session",
  "Follow up on offer letter questions",
  "Remind about visa document checklist",
  "Share scholarship options",
  "Confirm accommodation preference",
];
const times = ["09:30", "10:00", "11:15", "12:00", "14:00", "15:30", "16:45", "17:30"];
// Day offsets from "today": a mix of overdue, today and upcoming.
const offsets = [-4, -2, -1, 0, 0, 0, 1, 2, 3, 5, 0, -3, 7, 0, 1, -1];

function shift(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getFollowUps(): FollowUpRecord[] {
  return getLeads()
    .filter((lead) => lead.status !== "Converted" && lead.status !== "Lost")
    .flatMap((lead, i) => {
      const count = i % 3 === 0 ? 2 : 1;
      return Array.from({ length: count }, (_, k) => {
        const n = i * 2 + k;
        const offset = offsets[n % offsets.length] + k * 4;
        const date = shift(followUpToday, offset);
        const counsellor = lead.counsellor || counsellors[n % counsellors.length];
        // Past follow-ups are mostly done; a few were cancelled or left overdue.
        const status: FollowUpStatus =
          offset < 0 ? (n % 4 === 0 ? "Pending" : n % 7 === 0 ? "Cancelled" : "Completed") : "Pending";
        return {
          id: `FU-${(1000 + n).toString()}`,
          leadId: lead.id,
          leadName: lead.name,
          phone: lead.phone,
          branch: lead.branch,
          counsellor,
          date,
          time: times[n % times.length],
          note: notes[n % notes.length],
          createdBy: n % 5 === 0 ? "Sadman Rahman" : counsellor,
          status,
        };
      });
    });
}
