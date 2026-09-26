// Mock internal communications: management announcements and the staff news feed.
// Timestamps are relative to `commsNow` so "2h ago" labels stay stable.

export const commsNow = "2026-09-17T11:00:00Z";

export interface StaffRef {
  name: string;
  role: string;
  branch?: string;
}

// --- Announcements -----------------------------------------------------

export type AnnouncementCategory = "Visa & Compliance" | "Intake" | "Operations" | "Training" | "Partners" | "Celebration";
export type AnnouncementPriority = "Urgent" | "Important" | "Normal";
export type AnnouncementStatus = "Published" | "Scheduled" | "Draft" | "Inactive" | "Archived";
export type DeliveryChannel = "In-app" | "Email" | "WhatsApp";

export interface AnnouncementAttachment {
  name: string;
  size: string;
  /** Object URL for files uploaded in this session. */
  url?: string;
}

export interface Announcement {
  id: string;
  title: string;
  summary: string;
  body: string[];
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  author: StaffRef;
  audience: string[];
  channels: DeliveryChannel[];
  /** Publish time (or scheduled time). */
  publishedAt: string;
  /** Action deadline, if any. */
  dueDate?: string;
  pinned: boolean;
  requiresAck: boolean;
  readByMe: boolean;
  acknowledgedByMe: boolean;
  recipients: number;
  read: number;
  acknowledged: number;
  byBranch: { branch: string; read: number; total: number }[];
  /** A few recipients who have not acknowledged yet. */
  pendingAck: string[];
  attachments: AnnouncementAttachment[];
  /** Last edit time, when changed after creation. */
  editedAt?: string;
}

export const announcementCategories: AnnouncementCategory[] = [
  "Visa & Compliance",
  "Intake",
  "Operations",
  "Training",
  "Partners",
  "Celebration",
];

/** Audience groups and how many people each reaches. */
export const audienceSizes: Record<string, number> = {
  "All staff": 64,
  "All counsellors": 48,
  "Branch managers": 5,
  "Admissions team": 12,
  "Finance team": 8,
  "Agent partners": 122,
  "Dhaka HQ": 26,
  Sylhet: 10,
  London: 12,
  Manchester: 9,
  "Milton Keynes": 7,
};

export const audienceOptions = Object.keys(audienceSizes);

export function getAnnouncements(): Announcement[] {
  return [
    {
      id: "ANN-2041",
      title: "UKVI financial evidence checks tighten from 1 October",
      summary: "Re-verify maintenance funds for every January 2027 CAS applicant before submission.",
      body: [
        "From 1 October 2026, UKVI caseworkers will apply stricter checks on the 28-day maintenance rule for all Student route applications. Statements that dip below the required balance on any single day in the 28-day window will be refused without a request for further information.",
        "Current maintenance requirements: £1,483 per month for study in London and £1,136 per month outside London, for up to 9 months, on top of any outstanding first-year tuition fees.",
        "Action for counsellors: review the bank statements of every applicant with a January 2027 CAS request, flag anyone whose funds are held for fewer than 28 consecutive days, and log the check as a note on the application. Education loan letters must be dated within 6 months of the visa application.",
      ],
      category: "Visa & Compliance",
      priority: "Urgent",
      status: "Published",
      author: { name: "Youna", role: "Managing Director", branch: "London" },
      audience: ["All counsellors", "Admissions team"],
      channels: ["In-app", "Email", "WhatsApp"],
      publishedAt: "2026-09-17T08:15:00Z",
      dueDate: "2026-09-30",
      pinned: true,
      requiresAck: true,
      readByMe: false,
      acknowledgedByMe: false,
      recipients: 64,
      read: 52,
      acknowledged: 38,
      byBranch: [
        { branch: "Dhaka HQ", read: 22, total: 26 },
        { branch: "Sylhet", read: 7, total: 10 },
        { branch: "London", read: 11, total: 12 },
        { branch: "Manchester", read: 8, total: 9 },
        { branch: "Milton Keynes", read: 4, total: 7 },
      ],
      pendingAck: ["Md. Shariful Islam", "Sadia Afrin", "Priya Patel", "Yuliana Prokipchak", "Farhan Kabir"],
      attachments: [
        { name: "UKVI-financial-evidence-guidance-Oct26.pdf", size: "1.2 MB" },
        { name: "28-day-rule-checklist.pdf", size: "96 KB" },
      ],
    },
    {
      id: "ANN-2038",
      title: "January 2027 intake: university application deadlines",
      summary: "Final submission dates for our top partner universities. Prioritise conditional offers now.",
      body: [
        "The January 2027 intake is filling faster than last year: we have 393 applications in progress, 21% ahead of the same point in 2025.",
        "Final deadlines for new applications: Coventry University 15 Nov, University of Greenwich 20 Nov, University of Hertfordshire 1 Dec, Ulster University (Birmingham & London) 5 Dec, University of Sunderland London 8 Dec. CAS requests must be made at least 3 weeks before each university's CAS cut-off.",
        "Please move students holding conditional offers to unconditional as early as possible. Anyone still waiting on English test results should be booked onto IELTS UKVI or PTE Academic before 31 October.",
      ],
      category: "Intake",
      priority: "Important",
      status: "Published",
      author: { name: "Tanvir Ahmed", role: "Branch Manager", branch: "Dhaka HQ" },
      audience: ["All staff", "Agent partners"],
      channels: ["In-app", "Email"],
      publishedAt: "2026-09-16T10:00:00Z",
      dueDate: "2026-11-15",
      pinned: true,
      requiresAck: false,
      readByMe: true,
      acknowledgedByMe: false,
      recipients: 186,
      read: 141,
      acknowledged: 0,
      byBranch: [
        { branch: "Dhaka HQ", read: 24, total: 26 },
        { branch: "Sylhet", read: 9, total: 10 },
        { branch: "London", read: 12, total: 12 },
        { branch: "Manchester", read: 8, total: 9 },
        { branch: "Milton Keynes", read: 6, total: 7 },
        { branch: "Agent partners", read: 82, total: 122 },
      ],
      pendingAck: [],
      attachments: [{ name: "Jan-2027-deadline-calendar.pdf", size: "320 KB" }],
    },
    {
      id: "ANN-2036",
      title: "Log every follow-up in the CRM within 24 hours",
      summary: "Follow-ups recorded late are hiding overdue leads. New rule starts Monday 21 September.",
      body: [
        "Our audit of August follow-ups showed 18% were logged more than 24 hours after the call, and 6% were never logged at all. Those leads show as overdue and get re-assigned, which frustrates students and wastes counsellor time.",
        "From Monday 21 September, every call, WhatsApp conversation or meeting with a lead must be logged in the CRM within 24 hours, with the outcome and the next follow-up date. Branch managers will review the Follow-ups page every Friday.",
      ],
      category: "Operations",
      priority: "Important",
      status: "Published",
      author: { name: "Sadman Rahman", role: "Admissions Lead", branch: "Dhaka HQ" },
      audience: ["All counsellors"],
      channels: ["In-app", "WhatsApp"],
      publishedAt: "2026-09-15T12:30:00Z",
      dueDate: "2026-09-21",
      pinned: false,
      requiresAck: true,
      readByMe: true,
      acknowledgedByMe: true,
      recipients: 48,
      read: 46,
      acknowledged: 43,
      byBranch: [
        { branch: "Dhaka HQ", read: 20, total: 20 },
        { branch: "Sylhet", read: 8, total: 8 },
        { branch: "London", read: 9, total: 9 },
        { branch: "Manchester", read: 6, total: 6 },
        { branch: "Milton Keynes", read: 3, total: 5 },
      ],
      pendingAck: ["Yuliana Prokipchak", "Sadia Afrin", "Kazi Rakib", "Emma Watson", "Farhan Kabir"],
      attachments: [],
    },
    {
      id: "ANN-2033",
      title: "Mandatory training: credibility interview preparation",
      summary: "Live session on Thursday 25 September, 3:00 pm BST. Required for all counsellors.",
      body: [
        "Universities are running more pre-CAS credibility interviews for South Asian applicants. This session covers the most common questions, red flags that lead to CAS refusals, and how to run mock interviews with students.",
        "The session runs on Microsoft Teams, Thursday 25 September, 3:00–4:30 pm BST (8:00–9:30 pm in Dhaka). The recording and the question bank will be added to BHE Training afterwards, and completion counts towards your Q3 training hours.",
      ],
      category: "Training",
      priority: "Normal",
      status: "Published",
      author: { name: "Emma Watson", role: "Compliance Lead", branch: "Milton Keynes" },
      audience: ["All counsellors"],
      channels: ["In-app", "Email"],
      publishedAt: "2026-09-14T09:00:00Z",
      dueDate: "2026-09-25",
      pinned: false,
      requiresAck: false,
      readByMe: false,
      acknowledgedByMe: false,
      recipients: 48,
      read: 39,
      acknowledged: 0,
      byBranch: [
        { branch: "Dhaka HQ", read: 16, total: 20 },
        { branch: "Sylhet", read: 6, total: 8 },
        { branch: "London", read: 8, total: 9 },
        { branch: "Manchester", read: 6, total: 6 },
        { branch: "Milton Keynes", read: 3, total: 5 },
      ],
      pendingAck: [],
      attachments: [{ name: "Credibility-interview-question-bank.docx", size: "86 KB" }],
    },
    {
      id: "ANN-2029",
      title: "New commission payout schedule for agent partners",
      summary: "Payouts move from quarterly to monthly for Gold and Silver partners from October.",
      body: [
        "Starting with September 2026 enrolments, commission for Gold and Silver partners will be paid monthly, 30 days after the university confirms enrolment. Bronze partners stay on the quarterly schedule.",
        "Invoices must be raised through the partner portal with the student ID and university reference. Invoices without a confirmed enrolment will be held until the university confirms.",
      ],
      category: "Partners",
      priority: "Normal",
      status: "Published",
      author: { name: "David Miller", role: "Branch Manager", branch: "Manchester" },
      audience: ["Agent partners", "Finance team"],
      channels: ["In-app", "Email"],
      publishedAt: "2026-09-11T14:00:00Z",
      pinned: false,
      requiresAck: true,
      readByMe: true,
      acknowledgedByMe: false,
      recipients: 130,
      read: 97,
      acknowledged: 71,
      byBranch: [
        { branch: "Finance team", read: 8, total: 8 },
        { branch: "Agent partners", read: 89, total: 122 },
      ],
      pendingAck: ["Horizon Student Solutions", "Summit Academic Network", "Kafleas Ltd", "Albatross Education"],
      attachments: [{ name: "Partner-commission-policy-v3.pdf", size: "540 KB" }],
    },
    {
      id: "ANN-2027",
      title: "Record September intake: 1,156 applications 🎉",
      summary: "Our biggest intake ever, up 34% on September 2025. Thank you, everyone.",
      body: [
        "We closed the September 2026 intake with 1,156 applications, 612 unconditional offers and 486 enrolments so far, our strongest intake since BHE was founded.",
        "Special mention to London and Dhaka HQ for the highest conversion rates, and to the Sylhet team for growing applications by 41%. Team lunches are on us this Friday at every branch.",
      ],
      category: "Celebration",
      priority: "Normal",
      status: "Published",
      author: { name: "Youna", role: "Managing Director", branch: "London" },
      audience: ["All staff"],
      channels: ["In-app"],
      publishedAt: "2026-09-09T16:00:00Z",
      pinned: false,
      requiresAck: false,
      readByMe: true,
      acknowledgedByMe: false,
      recipients: 64,
      read: 61,
      acknowledged: 0,
      byBranch: [
        { branch: "Dhaka HQ", read: 26, total: 26 },
        { branch: "Sylhet", read: 10, total: 10 },
        { branch: "London", read: 12, total: 12 },
        { branch: "Manchester", read: 8, total: 9 },
        { branch: "Milton Keynes", read: 5, total: 7 },
      ],
      pendingAck: [],
      attachments: [],
    },
    {
      id: "ANN-2025",
      title: "Dhaka and Sylhet offices closed for Durga Puja",
      summary: "Both Bangladesh offices are closed on Thursday 1 and Friday 2 October.",
      body: [
        "Dhaka HQ and Sylhet will be closed on 1–2 October for Durga Puja. The WhatsApp auto-reply will tell students when we reopen, and urgent visa queries will be handled by the London team.",
        "Please reschedule any appointments booked for those days by Friday 26 September.",
      ],
      category: "Operations",
      priority: "Normal",
      status: "Published",
      author: { name: "Kazi Rakib", role: "Branch Manager", branch: "Sylhet" },
      audience: ["Dhaka HQ", "Sylhet"],
      channels: ["In-app", "WhatsApp"],
      publishedAt: "2026-09-08T07:30:00Z",
      dueDate: "2026-09-26",
      pinned: false,
      requiresAck: false,
      readByMe: true,
      acknowledgedByMe: false,
      recipients: 36,
      read: 34,
      acknowledged: 0,
      byBranch: [
        { branch: "Dhaka HQ", read: 25, total: 26 },
        { branch: "Sylhet", read: 9, total: 10 },
      ],
      pendingAck: [],
      attachments: [],
    },
    {
      id: "ANN-2044",
      title: "Q4 enrolment targets published",
      summary: "Branch and counsellor targets for October–December are live in Target Setup.",
      body: [
        "Q4 targets are set 12% above Q4 2025, weighted towards the January 2027 intake. Individual counsellor targets are visible in Target Setup and on your performance page.",
        "Branch managers: please hold one-to-ones with each counsellor in the first week of October to agree how they will reach their target.",
      ],
      category: "Operations",
      priority: "Important",
      status: "Scheduled",
      author: { name: "Sadman Rahman", role: "Admissions Lead", branch: "Dhaka HQ" },
      audience: ["All counsellors", "Branch managers"],
      channels: ["In-app", "Email"],
      publishedAt: "2026-10-01T03:00:00Z",
      pinned: false,
      requiresAck: true,
      readByMe: true,
      acknowledgedByMe: false,
      recipients: 53,
      read: 0,
      acknowledged: 0,
      byBranch: [],
      pendingAck: [],
      attachments: [{ name: "Q4-2026-targets.pdf", size: "210 KB" }],
    },
    {
      id: "ANN-2045",
      title: "Milton Keynes office moving to Station Square",
      summary: "Draft: new address and move date to be confirmed with the landlord.",
      body: [
        "The Milton Keynes Operations Desk is moving to a larger space at Station Square in November. We will share the confirmed date and new address once the lease is signed.",
      ],
      category: "Operations",
      priority: "Normal",
      status: "Draft",
      author: { name: "Sadman Rahman", role: "Admissions Lead", branch: "Dhaka HQ" },
      audience: ["All staff"],
      channels: ["In-app"],
      publishedAt: "2026-09-16T15:20:00Z",
      pinned: false,
      requiresAck: false,
      readByMe: true,
      acknowledgedByMe: false,
      recipients: 64,
      read: 0,
      acknowledged: 0,
      byBranch: [],
      pendingAck: [],
      attachments: [],
    },
    {
      id: "ANN-1998",
      title: "Summer opening hours have ended",
      summary: "All branches are back to 9:00 am – 6:00 pm local time from 1 September.",
      body: ["Summer extended hours ended on 31 August. All branches are back to standard opening hours, 9:00 am – 6:00 pm local time, Sunday–Thursday in Bangladesh and Monday–Friday in the UK."],
      category: "Operations",
      priority: "Normal",
      status: "Archived",
      author: { name: "Tanvir Ahmed", role: "Branch Manager", branch: "Dhaka HQ" },
      audience: ["All staff"],
      channels: ["In-app"],
      publishedAt: "2026-08-28T09:00:00Z",
      pinned: false,
      requiresAck: false,
      readByMe: true,
      acknowledgedByMe: false,
      recipients: 64,
      read: 63,
      acknowledged: 0,
      byBranch: [],
      pendingAck: [],
      attachments: [],
    },
  ];
}

// --- News feed ---------------------------------------------------------

export type PostTopic = "Wins" | "University updates" | "Visa & policy" | "Events" | "Team";

export type PostAttachment =
  | { kind: "win"; student: string; outcome: string; university: string; course: string; intake: string }
  | { kind: "event"; title: string; date: string; time: string; location: string; going: number; capacity: number }
  | { kind: "link"; source: string; title: string; summary: string }
  | { kind: "milestone"; value: string; label: string; delta: string }
  | { kind: "poll"; question: string; options: { label: string; votes: number }[] }
  | { kind: "update"; institution: string; items: { label: string; value: string }[] };

export interface FeedComment {
  id: string;
  author: StaffRef;
  text: string;
  createdAt: string;
}

export interface FeedPost {
  id: string;
  author: StaffRef;
  topic: PostTopic;
  createdAt: string;
  text: string;
  tags: string[];
  attachment?: PostAttachment;
  reactions: { clap: number; heart: number; party: number };
  comments: FeedComment[];
  pinned?: boolean;
}

export const postTopics: PostTopic[] = ["Wins", "University updates", "Visa & policy", "Events", "Team"];

export function getFeedPosts(): FeedPost[] {
  return [
    {
      id: "P-918",
      author: { name: "Youna", role: "Managing Director", branch: "London" },
      topic: "Team",
      createdAt: "2026-09-17T09:40:00Z",
      pinned: true,
      text: "September 2026 is officially our biggest intake ever. Every branch beat last September — thank you all for the late nights and weekend calls. Team lunches are on us this Friday! 🎉",
      tags: ["Sep2026", "RecordIntake"],
      attachment: { kind: "milestone", value: "1,156", label: "applications for the September 2026 intake", delta: "+34% vs Sep 2025" },
      reactions: { clap: 48, heart: 22, party: 37 },
      comments: [
        { id: "c1", author: { name: "Tanvir Ahmed", role: "Branch Manager", branch: "Dhaka HQ" }, text: "Proud of the Dhaka team — 38% of the network's enrolments!", createdAt: "2026-09-17T09:52:00Z" },
        { id: "c2", author: { name: "Harunor Rashid", role: "Senior Counsellor", branch: "Sylhet" }, text: "Sylhet up 41% 💪 Let's go for January!", createdAt: "2026-09-17T10:05:00Z" },
      ],
    },
    {
      id: "P-917",
      author: { name: "Bickey Shah", role: "Senior Counsellor", branch: "London" },
      topic: "Wins",
      createdAt: "2026-09-17T08:10:00Z",
      text: "Visa approved in 11 days for a student who was refused last year on financial grounds. We rebuilt the funds evidence from scratch and prepared her for the credibility interview. Never give up on a strong applicant!",
      tags: ["VisaApproved", "Reapplication"],
      attachment: { kind: "win", student: "Farzana A.", outcome: "Student visa granted", university: "University of Hertfordshire", course: "MSc Data Science", intake: "September 2026" },
      reactions: { clap: 31, heart: 18, party: 12 },
      comments: [
        { id: "c3", author: { name: "Emma Watson", role: "Compliance Lead", branch: "Milton Keynes" }, text: "Great case study for the training hub — can we write it up?", createdAt: "2026-09-17T08:40:00Z" },
      ],
    },
    {
      id: "P-915",
      author: { name: "Emma Watson", role: "Compliance Lead", branch: "Milton Keynes" },
      topic: "Visa & policy",
      createdAt: "2026-09-16T15:30:00Z",
      text: "Heads-up: the Home Office has confirmed that physical BRPs are fully replaced by eVisas for new Student route grants. Please update your pre-departure briefings — students must create a UKVI account and link their passport before travel.",
      tags: ["eVisa", "UKVI", "PreDeparture"],
      attachment: { kind: "link", source: "gov.uk", title: "Online immigration status (eVisa): guidance for students", summary: "How to create a UKVI account, link a new passport and prove immigration status to universities and landlords." },
      reactions: { clap: 14, heart: 3, party: 0 },
      comments: [
        { id: "c4", author: { name: "Nusrat Choudhury", role: "Senior Counsellor", branch: "Manchester" }, text: "I've added a slide to the Manchester briefing deck, happy to share.", createdAt: "2026-09-16T16:02:00Z" },
        { id: "c5", author: { name: "Md. Shariful Islam", role: "Education Counsellor", branch: "Dhaka HQ" }, text: "Does this apply to dependants who already hold a BRP?", createdAt: "2026-09-16T17:15:00Z" },
        { id: "c6", author: { name: "Emma Watson", role: "Compliance Lead", branch: "Milton Keynes" }, text: "Yes, existing BRP holders also need to switch to an eVisa. I'll add an FAQ.", createdAt: "2026-09-16T17:40:00Z" },
      ],
    },
    {
      id: "P-914",
      author: { name: "Tanvir Ahmed", role: "Branch Manager", branch: "Dhaka HQ" },
      topic: "Events",
      createdAt: "2026-09-16T11:00:00Z",
      text: "Our UK Education Expo is back! 22 universities have confirmed, including Coventry, Hertfordshire and Ulster. We need 12 counsellors on the floor on both days — please RSVP so we can plan the rota.",
      tags: ["Expo", "Jan2027"],
      attachment: { kind: "event", title: "BHE UK Education Expo — Dhaka", date: "2026-10-10", time: "10:00 am – 6:00 pm", location: "Radisson Blu Water Garden, Dhaka", going: 9, capacity: 12 },
      reactions: { clap: 20, heart: 6, party: 9 },
      comments: [],
    },
    {
      id: "P-912",
      author: { name: "Alif Tasnim", role: "Senior Counsellor", branch: "Dhaka HQ" },
      topic: "University updates",
      createdAt: "2026-09-15T13:20:00Z",
      text: "Coventry has released its January 2027 scholarship and deposit details. The early-bird scholarship is worth mentioning to every student with a first-class or 3.5+ CGPA.",
      tags: ["Coventry", "Scholarships", "Jan2027"],
      attachment: {
        kind: "update",
        institution: "Coventry University",
        items: [
          { label: "Application deadline", value: "15 Nov 2026" },
          { label: "Early-bird scholarship", value: "£2,000 (apply by 31 Oct)" },
          { label: "Tuition deposit", value: "£4,000 for CAS" },
          { label: "English requirement", value: "IELTS 6.5 (no band < 5.5)" },
        ],
      },
      reactions: { clap: 11, heart: 4, party: 2 },
      comments: [
        { id: "c7", author: { name: "Ummay Saiha Limu", role: "Senior Counsellor", branch: "Dhaka HQ" }, text: "Is the scholarship automatic or does the student need to write a statement?", createdAt: "2026-09-15T14:05:00Z" },
      ],
    },
    {
      id: "P-910",
      author: { name: "Sadman Rahman", role: "Admissions Lead", branch: "Dhaka HQ" },
      topic: "Team",
      createdAt: "2026-09-14T10:30:00Z",
      text: "Quick poll: which day works best for the monthly admissions review? We'll lock it in on Friday.",
      tags: ["Poll"],
      attachment: {
        kind: "poll",
        question: "Best day for the monthly admissions review?",
        options: [
          { label: "First Monday of the month", votes: 14 },
          { label: "First Wednesday of the month", votes: 22 },
          { label: "Last Thursday of the month", votes: 9 },
        ],
      },
      reactions: { clap: 5, heart: 1, party: 0 },
      comments: [],
    },
    {
      id: "P-908",
      author: { name: "Harunor Rashid", role: "Senior Counsellor", branch: "Sylhet" },
      topic: "Wins",
      createdAt: "2026-09-13T12:45:00Z",
      text: "Unconditional offer plus a 30% international scholarship from Ulster for one of our Sylhet students. Offer letter came back in just 4 working days!",
      tags: ["Scholarship", "Ulster"],
      attachment: { kind: "win", student: "Tahmid R.", outcome: "Unconditional offer + 30% scholarship", university: "Ulster University (Birmingham)", course: "MSc International Business", intake: "January 2027" },
      reactions: { clap: 26, heart: 9, party: 15 },
      comments: [],
    },
    {
      id: "P-905",
      author: { name: "Nusrat Choudhury", role: "Senior Counsellor", branch: "Manchester" },
      topic: "Events",
      createdAt: "2026-09-12T09:15:00Z",
      text: "Pre-departure briefing for all September arrivals in the North West. We'll cover eVisa setup, NHS GP registration, bank accounts and part-time work rules.",
      tags: ["PreDeparture", "Manchester"],
      attachment: { kind: "event", title: "Pre-departure & arrival briefing", date: "2026-09-24", time: "5:30 pm – 7:00 pm", location: "BHE Manchester, Northern Quarter", going: 34, capacity: 40 },
      reactions: { clap: 8, heart: 5, party: 2 },
      comments: [],
    },
    {
      id: "P-902",
      author: { name: "Priya Patel", role: "Admissions Officer", branch: "Manchester" },
      topic: "University updates",
      createdAt: "2026-09-10T16:00:00Z",
      text: "Greenwich now accepts the Oxford Test of English for postgraduate taught courses (overall 6.5). A cheaper and faster option for students who struggle to book IELTS slots.",
      tags: ["Greenwich", "EnglishTests"],
      attachment: { kind: "link", source: "gre.ac.uk", title: "English language requirements for international students", summary: "Accepted tests and minimum scores for undergraduate and postgraduate programmes from January 2027." },
      reactions: { clap: 12, heart: 2, party: 1 },
      comments: [],
    },
  ];
}

export interface UpcomingDeadline {
  label: string;
  detail: string;
  date: string;
}

export function getUpcomingDeadlines(): UpcomingDeadline[] {
  return [
    { label: "Durga Puja reschedules", detail: "Move Dhaka & Sylhet appointments", date: "2026-09-26" },
    { label: "Financial evidence re-check", detail: "All Jan 2027 CAS applicants", date: "2026-09-30" },
    { label: "Coventry early-bird scholarship", detail: "£2,000 · Jan 2027", date: "2026-10-31" },
    { label: "Coventry application deadline", detail: "January 2027 intake", date: "2026-11-15" },
    { label: "Greenwich application deadline", detail: "January 2027 intake", date: "2026-11-20" },
  ];
}
