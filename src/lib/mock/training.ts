// BHE Training: courses (modules → lessons → final quiz), who they're assigned
// to, and each person's progress. Assignments are built from the People
// directory; edits and progress are kept for the session until the backend exists.
import { getStaff, type StaffMember } from "./staff";

export const trainingToday = "2026-09-17";
const DAY = 86400000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (d: string, n: number) => iso(Date.parse(d) + n * DAY);
export const addMonths = (d: string, n: number) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCMonth(x.getUTCMonth() + n);
  return iso(x.getTime());
};

export const courseCategories = ["Visa & compliance", "Admissions", "Sales & conversion", "Data protection", "CRM & tools", "Partners"] as const;
export type CourseCategory = (typeof courseCategories)[number];
export type CourseLevel = "Mandatory" | "Recommended" | "Optional";

export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  body: string[];
  keyPoints: string[];
  /** Optional video shown above the lesson notes (YouTube, Vimeo, Loom, Drive or a file). */
  videoUrl?: string;
}
export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}
export interface Question {
  id: string;
  q: string;
  options: string[];
  answer: number;
  explain: string;
}
export interface Course {
  id: string;
  title: string;
  summary: string;
  category: CourseCategory;
  level: CourseLevel;
  /** Role ids that are assigned this course automatically ("all" = everyone). */
  audience: string[];
  instructor: string;
  modules: Module[];
  quiz: Question[];
  passMark: number;
  /** Days after assignment it must be finished. */
  dueDays: number;
  /** Certificate is valid this many months (0 = never expires). */
  refresherMonths: number;
  color: string;
  published: boolean;
  updatedAt: string;
}

export interface Attempt {
  date: string;
  score: number;
}
export interface Enrolment {
  staffId: string;
  courseId: string;
  assignedAt: string;
  dueDate: string;
  completedLessons: string[];
  attempts: Attempt[];
  completedAt?: string;
  reminders: string[];
}

export type LearnerStatus = "Not started" | "In progress" | "Overdue" | "Completed" | "Expiring" | "Expired";

// --- Course content ---------------------------------------------------------------

const L = (id: string, title: string, minutes: number, body: string[], keyPoints: string[]): Lesson => ({ id, title, minutes, body, keyPoints });
const Q = (id: string, q: string, options: string[], answer: number, explain: string): Question => ({ id, q, options, answer, explain });

const seedCourses: Course[] = [
  {
    id: "TRN-UKVI",
    title: "UKVI Student Route compliance",
    summary: "What every counsellor must check before a student applies for a UK Student visa — funds, documents, CAS and work rules.",
    category: "Visa & compliance",
    level: "Mandatory",
    audience: ["counsellor", "senior-counsellor", "branch-manager", "admissions-lead", "compliance"],
    instructor: "David Miller · Compliance Officer",
    passMark: 80,
    dueDays: 30,
    refresherMonths: 12,
    color: "bg-rose-500",
    published: true,
    updatedAt: "2026-08-28",
    modules: [
      {
        id: "m1",
        title: "The Student route",
        lessons: [
          L("l1", "Who needs a Student visa", 8, [
            "Anyone who isn't a UK or Irish citizen and doesn't have settled or pre-settled status needs permission to study in the UK for a course longer than six months. For degree-level study that's the Student route.",
            "The university sponsors the student by issuing a Confirmation of Acceptance for Studies (CAS). The visa application must use that CAS, and the details on it — course, dates, fees paid — must match what the student tells UKVI.",
          ], ["Home students with settled or pre-settled status don't need a visa", "The CAS is the university's sponsorship", "Details on the CAS must match the visa application"]),
          L("l2", "Timelines that catch students out", 10, [
            "Students can apply up to six months before the course starts from outside the UK. A CAS can only be used once, and a visa decision usually takes around three weeks outside the UK — longer at peak times.",
            "Work backwards from the course start date: offer accepted, deposit paid, CAS requested, funds held for 28 days, TB test done, then apply. Any gap in that chain is where January students miss their start date.",
          ], ["Apply up to 6 months before the course starts", "Plan the 28-day funds period before requesting the CAS", "Allow at least 3 weeks for a decision"]),
        ],
      },
      {
        id: "m2",
        title: "Money and documents",
        lessons: [
          L("l3", "The 28-day funds rule", 12, [
            "Students must show they hold enough money for unpaid first-year tuition plus living costs: £1,483 a month in London or £1,136 a month outside London, for up to nine months. The money has to be held for 28 consecutive days, and the closing balance must be dated within 31 days of the visa application.",
            "If the balance dips below the required amount on any single day in the 28 days, the evidence fails. Check every daily balance, not just the start and end — this is the most common refusal reason in BHE's data.",
          ], ["Unpaid tuition + £1,483/month London or £1,136/month elsewhere (max 9 months)", "Held for 28 consecutive days", "Statement dated within 31 days of applying"]),
          L("l4", "Other documents", 9, [
            "Most students need a valid passport, the CAS, evidence of funds, and the academic documents listed on the CAS. Students from listed countries — including Bangladesh, Nigeria and Pakistan — need a TB test certificate from an approved clinic.",
            "Some postgraduate courses in sensitive subjects need an ATAS certificate, which can take several weeks. Under-18s need parental consent. Check the CAS for anything the university says was assessed — those documents must be available if UKVI asks.",
          ], ["TB certificate for listed countries", "ATAS for some science and engineering courses", "Documents listed on the CAS must be available"]),
        ],
      },
      {
        id: "m3",
        title: "After the visa",
        lessons: [
          L("l5", "Work rights and conditions", 8, [
            "Students on degree-level courses can usually work up to 20 hours a week in term time and full time in official vacations; below degree level the limit is 10 hours. The exact limit is shown on the student's eVisa.",
            "Breaking visa conditions can lead to the visa being cut short and can affect the university's sponsor licence. Always tell students to check their conditions before accepting a job.",
          ], ["20 hours/week in term time at degree level", "10 hours below degree level", "Conditions are shown on the eVisa"]),
          L("l6", "Recording your checks", 6, [
            "Every check you make — funds, TB certificate, document review — must be logged as a note on the application in the CRM, with the date. Compliance audits these notes each month.",
            "If something doesn't look right, don't submit. Escalate to compliance using the Compliance & CAS team, and tell the student what's missing in writing.",
          ], ["Log every check as an application note", "Escalate doubts to compliance before submission"]),
        ],
      },
    ],
    quiz: [
      Q("q1", "How long must a student hold the required funds?", ["14 days", "28 consecutive days", "3 months", "Any 28 days in the last 6 months"], 1, "The money must be held for 28 consecutive days, ending within 31 days of the application."),
      Q("q2", "What is the monthly living-cost figure for study in London?", ["£1,023", "£1,136", "£1,334", "£1,483"], 3, "£1,483 a month for London; £1,136 elsewhere, for up to nine months."),
      Q("q3", "A student's balance dips below the required amount for one day. What happens?", ["Nothing, if the average is fine", "The evidence fails", "They can top up afterwards", "Only matters in the last week"], 1, "The balance must not fall below the required amount on any day in the 28-day period."),
      Q("q4", "How many hours a week can a degree-level student usually work in term time?", ["10", "15", "20", "Unlimited"], 2, "Degree-level students can usually work up to 20 hours a week in term time."),
      Q("q5", "Where do you record the checks you've made?", ["In your own notebook", "In a WhatsApp chat", "As a note on the application in the CRM", "Nowhere — just submit"], 2, "Compliance audits the notes on each application."),
    ],
  },
  {
    id: "TRN-CRED",
    title: "Credibility interview preparation",
    summary: "Help students pass pre-CAS and UKVI credibility interviews by understanding their own plans — not by memorising answers.",
    category: "Admissions",
    level: "Mandatory",
    audience: ["counsellor", "senior-counsellor", "compliance"],
    instructor: "Emma Watson · CAS & Visa Officer",
    passMark: 80,
    dueDays: 21,
    refresherMonths: 12,
    color: "bg-violet-500",
    published: true,
    updatedAt: "2026-09-14",
    modules: [
      {
        id: "m1",
        title: "What interviewers look for",
        lessons: [
          L("l1", "Why credibility interviews happen", 7, [
            "Universities run pre-CAS interviews to make sure a student is a genuine student who can explain why they chose the course, how they'll pay for it and what they'll do afterwards. UKVI can also interview students after they apply.",
            "A weak interview can mean no CAS, which means no visa. For South Asian applicants, most partner universities now interview every student.",
          ], ["Interviews test that the student is genuine", "No CAS without a pass", "Most partners interview every South Asian applicant"]),
          L("l2", "The four themes", 10, [
            "Nearly every question falls under four themes: the course and university, finances, previous study or work, and future plans. Students should be able to explain each in their own words.",
            "Scripted answers are a red flag. Interviewers are trained to ask follow-up questions that a memorised answer can't handle.",
          ], ["Course & university · finances · background · plans", "Own words, not scripts", "Expect follow-up questions"]),
        ],
      },
      {
        id: "m2",
        title: "Running a mock interview",
        lessons: [
          L("l3", "How to run a mock", 12, [
            "Book 20 minutes on a video call, camera on, as the real interview will be. Ask questions from the question bank in the Essential Folder, then follow up on anything vague.",
            "Give feedback on content and delivery, then log the mock as a meeting on the application with a pass/needs-work outcome. Students who need work get a second mock before the real interview.",
          ], ["Video call, camera on", "Use the question bank and follow up", "Log the outcome on the application"]),
          L("l4", "Red flags to fix", 8, [
            "Common red flags: not knowing module names, vague career plans, not knowing who is paying, and a course that doesn't connect to previous study. Each one should be fixed through better understanding — never coaching the student to say something untrue.",
          ], ["Know two or three modules", "A clear, specific career plan", "Know exactly who is paying and how"]),
        ],
      },
    ],
    quiz: [
      Q("q1", "What is the main purpose of a credibility interview?", ["To test English grammar", "To check the student is genuine", "To sell extra services", "To confirm accommodation"], 1, "It checks the student genuinely intends to study the course."),
      Q("q2", "Why are scripted answers a problem?", ["They take too long", "Interviewers spot them with follow-up questions", "They're too short", "They aren't a problem"], 1, "Follow-up questions expose memorised answers."),
      Q("q3", "Where should you record a mock interview?", ["As a meeting on the application", "Nowhere", "In the student's email", "On paper"], 0, "Log it as a meeting with the outcome."),
      Q("q4", "Which is a red flag?", ["Knowing module names", "A specific career plan", "Not knowing who is paying", "Asking a question at the end"], 2, "Students must understand how their studies are funded."),
      Q("q5", "A student needs work after their first mock interview. What happens next?", ["Nothing", "They book a second mock before the real interview", "They skip the interview", "They are withdrawn"], 1, "Students who need work get a second mock."),
    ],
  },
  {
    id: "TRN-GDPR",
    title: "Data protection for student records",
    summary: "How to handle passports, bank statements and other personal data safely — and what to do if something goes wrong.",
    category: "Data protection",
    level: "Mandatory",
    audience: ["all"],
    instructor: "Mahbuba Akhter · Finance Officer",
    passMark: 80,
    dueDays: 30,
    refresherMonths: 12,
    color: "bg-sky-500",
    published: true,
    updatedAt: "2026-06-10",
    modules: [
      {
        id: "m1",
        title: "Everyday rules",
        lessons: [
          L("l1", "What counts as personal data", 6, [
            "Personal data is anything that identifies a student: name, phone, passport, grades, bank statements, even a WhatsApp photo of a certificate. Some of it — health information, for example — is special category data and needs extra care.",
          ], ["Anything that identifies a person", "Passports and bank statements are high risk", "Health information needs extra care"]),
          L("l2", "Where data may live", 8, [
            "Student documents belong in the CRM, attached to the lead or application. Don't keep copies in personal email, phone galleries, WhatsApp chats or USB drives.",
            "Share documents with universities only through their portals, never by forwarding emails with attachments to unknown addresses.",
          ], ["Store documents in the CRM only", "Share through university portals", "No personal devices or USB drives"]),
        ],
      },
      {
        id: "m2",
        title: "When something goes wrong",
        lessons: [
          L("l3", "Spotting and reporting a breach", 7, [
            "A breach is any loss or unauthorised access to personal data — an email sent to the wrong student, a lost laptop, a document left in a meeting room. Report it to compliance@bhe-consultancy.co.uk within 24 hours, even if you're not sure.",
            "BHE may have to tell the regulator within 72 hours, so speed matters more than having every detail.",
          ], ["Report within 24 hours", "Report even if unsure", "BHE may need to notify within 72 hours"]),
        ],
      },
    ],
    quiz: [
      Q("q1", "Where should a student's passport scan be stored?", ["Your phone gallery", "Attached to the application in the CRM", "Your personal email", "A USB drive"], 1, "Documents belong in the CRM only."),
      Q("q2", "You emailed a bank statement to the wrong student. What now?", ["Ignore it", "Ask them to delete it and move on", "Report it to compliance within 24 hours", "Wait for a complaint"], 2, "Report every possible breach within 24 hours."),
      Q("q3", "Which is personal data?", ["A university's address", "A student's WhatsApp number", "The course list", "The BHE logo"], 1, "Anything that identifies an individual is personal data."),
      Q("q4", "How quickly must a possible data breach be reported to compliance?", ["Within 24 hours", "Within a week", "At the end of the month", "Only if the student complains"], 0, "Report within 24 hours."),
      Q("q5", "How should student documents be shared with universities?", ["Forwarded by personal email", "Through the university's portal", "On WhatsApp", "On a USB drive"], 1, "Share through university portals."),
    ],
  },
  {
    id: "TRN-SALES",
    title: "Consultative counselling & lead conversion",
    summary: "Turn enquiries into applications by listening first — first-call structure, follow-up cadence and handling objections.",
    category: "Sales & conversion",
    level: "Recommended",
    audience: ["counsellor", "senior-counsellor", "front-desk"],
    instructor: "Sadman Rahman · Admissions Lead",
    passMark: 70,
    dueDays: 45,
    refresherMonths: 0,
    color: "bg-amber-500",
    published: true,
    updatedAt: "2026-07-02",
    modules: [
      {
        id: "m1",
        title: "The first conversation",
        lessons: [
          L("l1", "The first call in 10 minutes", 9, [
            "Call new leads within two hours — conversion drops sharply after the first day. Introduce yourself, confirm what they enquired about, then ask open questions: what do they want to study, why, when, and how will they fund it?",
            "End every call with a clear next step and a date: an appointment, a document request or a shortlist you'll send.",
          ], ["Call within 2 hours", "Open questions: what, why, when, how funded", "Always agree a next step"]),
          L("l2", "Building a shortlist", 8, [
            "Offer three options: one aspirational, one realistic, one safe. Explain the trade-offs — fees, entry requirements, location and scholarships — so the student decides, not you.",
          ], ["Three options: aspirational, realistic, safe", "Explain trade-offs", "Let the student choose"]),
        ],
      },
      {
        id: "m2",
        title: "Keeping momentum",
        lessons: [
          L("l3", "Follow-up cadence", 7, [
            "Use the CRM follow-ups: day 1, day 3, day 7, then weekly. Mix channels — call, then WhatsApp, then email. Log every attempt so a colleague can pick it up if you're away.",
          ], ["Day 1 · 3 · 7 · weekly", "Mix call, WhatsApp and email", "Log every attempt"]),
          L("l4", "Handling objections", 10, [
            "Most objections are about money, time or confidence. Acknowledge the worry, ask a question to understand it, then answer with facts — scholarships, instalment plans, intake dates, or a talk with a current student ambassador.",
          ], ["Acknowledge, ask, answer", "Use scholarships and ambassadors", "Never promise visas or offers"]),
        ],
      },
    ],
    quiz: [
      Q("q1", "How quickly should you call a new lead?", ["Within 2 hours", "Within a week", "When convenient", "Only if they call again"], 0, "Conversion drops sharply after the first day."),
      Q("q2", "A good shortlist has…", ["One perfect option", "Three options with different risk", "Ten options", "Only the cheapest courses"], 1, "Aspirational, realistic and safe."),
      Q("q3", "What should you never promise?", ["A call back", "A visa or an offer", "A shortlist", "An appointment"], 1, "Outcomes are decided by universities and UKVI."),
      Q("q4", "What follow-up cadence does the course recommend?", ["Once, then stop", "Day 1, 3, 7, then weekly", "Every day for a month", "Only when the student calls"], 1, "Day 1, 3, 7 then weekly."),
      Q("q5", "Most student objections are about…", ["The weather", "Money, time or confidence", "The CRM", "The counsellor's accent"], 1, "Acknowledge, ask, then answer."),
    ],
  },
  {
    id: "TRN-CRM",
    title: "Getting started with the BHE CRM",
    summary: "The daily workflow in the CRM: leads, applications, follow-ups, WhatsApp and documents.",
    category: "CRM & tools",
    level: "Recommended",
    audience: ["all"],
    instructor: "Tanvir Ahmed · Branch Manager",
    passMark: 70,
    dueDays: 14,
    refresherMonths: 0,
    color: "bg-primary",
    published: true,
    updatedAt: "2026-09-01",
    modules: [
      {
        id: "m1",
        title: "Your day in the CRM",
        lessons: [
          L("l1", "Leads and follow-ups", 8, [
            "Start each day in Follow-ups: it lists every call and message due today. New leads assigned to you appear in Leads with a New status — contact them first.",
          ], ["Start in Follow-ups", "New leads first", "Update the status after every contact"]),
          L("l2", "Applications and documents", 10, [
            "Each application tracks one student and their course choices. Use Request documents to ask for what's missing — the student gets a WhatsApp and email with a secure upload link.",
            "Keep the stage up to date: it drives targets, finance and the dashboards everyone sees.",
          ], ["One application per student", "Request documents from the application", "Keep the stage current"]),
          L("l3", "WhatsApp Workspace", 6, [
            "All student WhatsApp conversations for your branch are in WhatsApp Workspace, so a colleague can reply if you're busy. Use the saved templates in the Essential Folder for common replies.",
          ], ["Shared inbox per branch", "Use saved templates"]),
        ],
      },
    ],
    quiz: [
      Q("q1", "Where should you start each day?", ["Finance", "Follow-ups", "Settings", "Archived"], 1, "Follow-ups lists everything due today."),
      Q("q2", "Why keep the application stage up to date?", ["It doesn't matter", "It drives targets, finance and dashboards", "Only for students", "For the website"], 1, "Many parts of the CRM read the stage."),
      Q("q3", "How do you ask a student for missing documents?", ["Personal email", "Request documents on the application", "Post", "Ask their agent"], 1, "It sends a secure upload link by WhatsApp and email."),
      Q("q4", "Where are your branch's student WhatsApp conversations?", ["On your personal phone", "WhatsApp Workspace", "In Finance", "In Settings"], 1, "A shared inbox per branch."),
      Q("q5", "Where are the saved reply templates kept?", ["Essential Folder", "Archived", "Target Setup", "Nowhere"], 0, "Use the saved templates in the Essential Folder."),
    ],
  },
  {
    id: "TRN-AGENT",
    title: "Working with agent partners",
    summary: "Agent onboarding checks, commission rules and spotting risky applications from partners.",
    category: "Partners",
    level: "Optional",
    audience: ["branch-manager", "admissions-lead", "compliance"],
    instructor: "Bickey Shah · Branch Manager",
    passMark: 70,
    dueDays: 60,
    refresherMonths: 0,
    color: "bg-teal-500",
    published: true,
    updatedAt: "2026-05-20",
    modules: [
      {
        id: "m1",
        title: "Partners",
        lessons: [
          L("l1", "Onboarding and KYC", 8, [
            "Every agent must pass KYC before submitting applications: trade licence, director ID, proof of address, bank confirmation and the signed agreement. Pending Agents in the CRM tracks each check.",
          ], ["Five KYC documents", "No applications before approval"]),
          L("l2", "Warning signs", 9, [
            "Watch for bank statements from the same branch across unrelated students, identical personal statements, and agents promising guaranteed visas. Suspend first, investigate with compliance, then decide.",
          ], ["Repeated documents across students", "Guaranteed-visa marketing", "Suspend, then investigate"]),
        ],
      },
    ],
    quiz: [
      Q("q1", "When can an agent submit applications?", ["Straight away", "After KYC approval", "After their first student enrols", "Any time"], 1, "Only approved agents can submit."),
      Q("q2", "An agent's students all have statements from one bank branch. What do you do?", ["Nothing", "Suspend and investigate with compliance", "Pay commission faster", "Delete the applications"], 1, "It's a warning sign — suspend and investigate."),
      Q("q3", "How many KYC documents must an agent provide?", ["Two", "Three", "Five", "Ten"], 2, "Five KYC documents."),
      Q("q4", "Which is a warning sign in agent applications?", ["Complete files", "Identical personal statements across students", "Colour scans", "Clear bank letters"], 1, "Repeated documents across students."),
      Q("q5", "What should you do first when you spot a warning sign?", ["Pay the agent", "Suspend, then investigate", "Ignore it", "Approve faster"], 1, "Suspend first, investigate with compliance, then decide."),
    ],
  },
  {
    id: "TRN-PARTNER",
    title: "BHE agent partner essentials",
    summary: "For agent partners: how to submit applications to BHE, document standards, commission and invoicing, and the lines you must never cross.",
    category: "Partners",
    level: "Mandatory",
    audience: ["agents"],
    instructor: "Bickey Shah · Branch Manager",
    passMark: 80,
    dueDays: 21,
    refresherMonths: 12,
    color: "bg-orange-500",
    published: true,
    updatedAt: "2026-08-15",
    modules: [
      {
        id: "m1",
        title: "Working with BHE",
        lessons: [
          L("l1", "Submitting an application", 10, [
            "Submit every student through the BHE agent portal with a complete file: passport, academic documents, English test result, personal statement and, for postgraduate courses, a CV. Incomplete files wait in a queue and lose their place for popular intakes.",
            "Your BHE relationship manager is your single point of contact. Don't contact universities directly about students you've submitted through BHE.",
          ], ["Submit through the agent portal only", "Complete files are processed first", "Go through your relationship manager"]),
          L("l2", "Document standards", 9, [
            "Upload clear colour scans of original documents. Bank statements must come directly from the bank or be verifiable online. BHE checks a sample of documents with issuing bodies every month.",
          ], ["Colour scans of originals", "Verifiable bank statements", "Random checks every month"]),
        ],
      },
      {
        id: "m2",
        title: "Money and compliance",
        lessons: [
          L("l3", "Commission and invoicing", 8, [
            "Commission becomes payable once the university has paid BHE for the student, usually after census. BHE pays your share within 30 days of receiving it, to the bank account verified at onboarding.",
            "No commission is paid for students who withdraw before census or whose application used misleading documents.",
          ], ["Payable after the university pays BHE", "Paid within 30 days", "No commission on withdrawals before census"]),
          L("l4", "Lines you must never cross", 7, [
            "Never promise a visa or an offer, never charge students hidden or refundable-only-on-visa fees, and never alter or supply documents. Any of these ends the partnership immediately.",
          ], ["No guaranteed visas", "No hidden fees", "Never alter documents"]),
        ],
      },
    ],
    quiz: [
      Q("q1", "How should you submit a student to BHE?", ["Email the university", "Through the BHE agent portal", "WhatsApp a counsellor", "Post the documents"], 1, "All submissions go through the agent portal."),
      Q("q2", "When is your commission payable?", ["When the student applies", "When the offer arrives", "After the university pays BHE", "Before the visa"], 2, "It follows the university's payment, usually after census."),
      Q("q3", "Which is never allowed?", ["Asking your relationship manager for help", "Promising a student a visa", "Uploading colour scans", "Submitting complete files"], 1, "Outcomes are decided by universities and UKVI."),
      Q("q4", "How soon does BHE pay your share once the university has paid?", ["Within 30 days", "Within a year", "Same day", "Only at the end of the intake"], 0, "Within 30 days."),
      Q("q5", "What kind of document scans should you upload?", ["Black-and-white photocopies", "Clear colour scans of originals", "Screenshots of WhatsApp", "Handwritten copies"], 1, "Colour scans of originals."),
    ],
  },
];

// --- Assignments ------------------------------------------------------------------

export function inAudience(c: Course, s: StaffMember) {
  return c.audience.includes("all") || c.audience.includes(s.roleId);
}

export const allLessons = (c: Course) => c.modules.flatMap((m) => m.lessons);
export const courseMinutes = (c: Course) => allLessons(c).reduce((n, l) => n + l.minutes, 0);

function rand(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

function seedEnrolments(courses: Course[]): Enrolment[] {
  const staff = getStaff().filter((s) => s.status === "Active" || s.status === "On leave");
  const out: Enrolment[] = [];
  for (const c of courses) {
    for (const s of staff) {
      if (!inAudience(c, s)) continue;
      const r = rand(`${c.id}${s.id}`);
      const joinedLate = s.joined > "2026-06-01";
      const lessons = allLessons(c).map((l) => l.id);
      let completed: string[] = [];
      const attempts: Attempt[] = [];
      let completedAt: string | undefined;
      let assignedAt: string;
      if (r < (joinedLate ? 0.25 : 0.8)) {
        // Finished: assigned earlier in the year and completed within a few weeks.
        assignedAt = joinedLate ? addDays(s.joined, 1) : addDays("2026-01-05", Math.round(r * 150));
        completed = lessons;
        // A few certificates were earned about a year ago, so they're expired or about to expire.
        completedAt = r < 0.1 && c.refresherMonths ? addDays(addMonths(trainingToday, -c.refresherMonths), Math.round(r * 500) - 25) : addDays(assignedAt, 4 + Math.round(r * 20));
        if (completedAt > trainingToday) completedAt = addDays(trainingToday, -3);
        if (completedAt < assignedAt) assignedAt = addDays(completedAt, -10);
        if (r > 0.55) attempts.push({ date: addDays(completedAt, -1), score: Math.max(40, c.passMark - 20) });
        attempts.push({ date: completedAt, score: Math.min(100, c.passMark + Math.round(r * 30)) });
      } else {
        // Still to do: mostly assigned recently, a few are past their due date.
        assignedAt = joinedLate ? addDays(s.joined, 1) : addDays(trainingToday, -Math.round((r - 0.8) * 250));
        if (r < 0.93) completed = lessons.slice(0, Math.max(1, Math.round(lessons.length * (r - 0.78) * 4)));
      }
      out.push({ staffId: s.id, courseId: c.id, assignedAt, dueDate: addDays(assignedAt, c.dueDays), completedLessons: completed, attempts, completedAt, reminders: [] });
    }
  }
  return out;
}

// --- Store ----------------------------------------------------------------------

let courses: Course[] = seedCourses;
let enrolments: Enrolment[] | null = null;

export function getCourses() {
  return courses;
}
export function saveCourses(next: Course[]) {
  courses = next;
}
export function getCourse(id: string) {
  return courses.find((c) => c.id === id);
}
export function getEnrolments() {
  return (enrolments ??= seedEnrolments(courses));
}
export function saveEnrolments(next: Enrolment[]) {
  enrolments = next;
}

// --- Derived ---------------------------------------------------------------------

export function progressOf(e: Enrolment, c: Course) {
  const total = allLessons(c).length;
  const done = e.completedLessons.filter((id) => allLessons(c).some((l) => l.id === id)).length;
  return total ? Math.round((done / total) * 100) : 0;
}

export function expiresAt(e: Enrolment, c: Course) {
  return e.completedAt && c.refresherMonths ? addMonths(e.completedAt, c.refresherMonths) : undefined;
}

export function statusOf(e: Enrolment, c: Course): LearnerStatus {
  if (e.completedAt) {
    const exp = expiresAt(e, c);
    if (exp && exp < trainingToday) return "Expired";
    if (exp && Date.parse(exp) - Date.parse(trainingToday) <= 30 * DAY) return "Expiring";
    return "Completed";
  }
  if (e.dueDate < trainingToday) return "Overdue";
  return e.completedLessons.length ? "In progress" : "Not started";
}

export const bestScore = (e: Enrolment) => (e.attempts.length ? Math.max(...e.attempts.map((a) => a.score)) : undefined);

export function daysUntil(d: string) {
  return Math.round((Date.parse(d) - Date.parse(trainingToday)) / DAY);
}

export function nextCourseId(title: string) {
  const base = `TRN-${title.replace(/[^A-Za-z]/g, "").slice(0, 5).toUpperCase() || "NEW"}`;
  return courses.some((c) => c.id === base) ? `${base}${courses.length}` : base;
}

// --- Video sessions --------------------------------------------------------------

export const crmAreas = ["Getting started", "Leads & follow-ups", "Applications", "WhatsApp & communications", "Agents & ambassadors", "Courses & institutions", "Finance", "Targets & reports", "People & settings", "Counselling knowledge", "Company & culture"] as const;
export type CrmArea = (typeof crmAreas)[number];
export type VideoSource = "YouTube" | "Vimeo" | "Loom" | "Google Drive" | "Video file" | "Other link";

export interface VideoSession {
  id: string;
  title: string;
  description: string;
  url: string;
  area: CrmArea;
  presenter: string;
  recordedOn: string;
  minutes: number;
  /** Exact length when known — shown as hh:mm:ss in playlists. */
  seconds?: number;
  /** Questions about the video; a learner completes the session by passing them. */
  quiz: Question[];
  passMark: number;
  /** Per learner (staff or agent id): when they watched and their quiz attempts. */
  results: Record<string, VideoResult>;
  addedBy: string;
  addedAt: string;
}

export interface VideoResult {
  watchedAt?: string;
  attempts: Attempt[];
  passedAt?: string;
  /** Set when an admin recorded completion on the learner's behalf. */
  recordedBy?: string;
}

export type VideoStatus = "Not watched" | "Quiz due" | "Failed" | "Passed";
export function videoStatus(v: VideoSession, learnerId: string): VideoStatus {
  const r = v.results[learnerId];
  if (r?.passedAt) return "Passed";
  if (!r?.watchedAt) return "Not watched";
  if (!v.quiz.length) return "Passed";
  return r.attempts.length ? "Failed" : "Quiz due";
}

/** Work out where a video link points and how to embed it. */
export function parseVideo(raw: string): { source: VideoSource; embed?: string; thumb?: string; file?: boolean } {
  const url = raw.trim();
  if (!url) return { source: "Other link" };
  if (url.startsWith("blob:") || /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url)) return { source: "Video file", embed: url, file: true };
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com") {
      const list = u.searchParams.get("list");
      const id = host === "youtu.be" ? u.pathname.slice(1) : u.pathname.startsWith("/shorts/") || u.pathname.startsWith("/embed/") || u.pathname.startsWith("/live/") ? u.pathname.split("/")[2] : u.searchParams.get("v");
      if (id) return { source: "YouTube", embed: `https://www.youtube-nocookie.com/embed/${id}${list ? `?list=${list}` : ""}`, thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
      if (list) return { source: "YouTube", embed: `https://www.youtube-nocookie.com/embed/videoseries?list=${list}` };
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean).find((x) => /^\d+$/.test(x));
      if (id) return { source: "Vimeo", embed: `https://player.vimeo.com/video/${id}` };
    }
    if (host === "loom.com") {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return { source: "Loom", embed: `https://www.loom.com/embed/${id}` };
    }
    if (host === "drive.google.com") {
      const id = u.pathname.match(/\/d\/([^/]+)/)?.[1] ?? u.searchParams.get("id");
      if (id) return { source: "Google Drive", embed: `https://drive.google.com/file/d/${id}/preview` };
    }
  } catch {
    return { source: "Other link" };
  }
  return { source: "Other link" };
}

// Sessions from the BHE UNI YouTube channel (youtube.com/@bheuni2). Questions are
// based on each video's published description — review them against the videos.
type VideoSeed = [id: string, youtubeId: string, title: string, area: CrmArea, recordedOn: string, seconds: number, description: string, quiz: Question[]];
const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const videoSeeds: VideoSeed[] = [
  ["VID-001", "3S08HXJZwgg", "Video 1 – BHE UNI CRM overview", "Getting started", "2025-12-07", 23, "A first look at the BHE UNI CRM: where leads, applications, follow-ups and communications live. Watch this before your first day on the system.", [
    Q("q1", "What is this video an overview of?", ["The BHE UNI CRM", "The student mobile app", "A university portal", "The payroll system"], 0, ""),
    Q("q2", "Where should student leads and applications be managed?", ["In personal spreadsheets", "In the BHE UNI CRM", "In WhatsApp chats only", "On paper files"], 1, ""),
    Q("q3", "Where should you start each working day in the CRM?", ["Finance", "Follow-ups", "Settings", "Archived"], 1, ""),
    Q("q4", "Why must the application stage always be kept up to date?", ["It isn't important", "Targets, finance and dashboards all rely on it", "Only students can see it", "It's only used for the website"], 1, ""),
    Q("q5", "How do you ask a student for missing documents?", ["From your personal email", "With Request documents on the application", "By post", "Through their agent only"], 1, ""),
  ]],
  ["VID-002", "kHL1wd4Yzzg", "Maximising your IELTS score: the 7 key scoring elements", "Counselling knowledge", "2023-10-14", 432, "The seven elements examiners score — grammar accuracy, grammatical precision, pronunciation range, fluency, vocabulary range, word choice and coherence. Use it when advising students preparing for IELTS.", [
    Q("q1", "How many key scoring elements does the video cover?", ["5", "6", "7", "9"], 2, ""),
    Q("q2", "Which of these is one of the scoring elements?", ["Handwriting", "Coherence", "Typing speed", "Regional accent"], 1, ""),
    Q("q3", "Which shorthand does the video use for pronunciation range?", ["C.A.V", "S.C.C", "P.R.S", "V.W.C"], 1, ""),
    Q("q4", "Which shorthand does the video use for grammar accuracy?", ["C.A.V", "S.C.C", "G.P.A", "F.L.U"], 0, ""),
    Q("q5", "Which of these is NOT one of the seven elements?", ["Fluency", "Vocabulary range", "Handwriting", "Word choice"], 2, ""),
    Q("q6", "Who does the video say it is useful for?", ["Only examiners", "Beginners and people fine-tuning their skills", "Only native speakers", "Only university staff"], 1, ""),
  ]],
  ["VID-003", "r6ENWnC-B4g", "IELTS Speaking – top tips, part 2", "Counselling knowledge", "2023-10-14", 323, "Six more speaking tips: explain foreign words, speak up, keep to time, avoid slang, don't memorise, and don't write full sentences in the preparation minute.", [
    Q("q1", "What does the video say about memorising answers?", ["Memorise model answers", "Do not memorise", "Memorise only the introduction", "It doesn't matter"], 1, ""),
    Q("q2", "Which should candidates avoid?", ["Slang", "Examples", "Full answers", "Eye contact"], 0, ""),
    Q("q3", "During the preparation minute, candidates should…", ["Write full sentences", "Not write full sentences", "Stay silent and not note anything", "Ask the examiner questions"], 1, ""),
    Q("q4", "If a candidate uses a word from their own language, they should…", ["Ignore it", "Explain it", "Repeat it louder", "Spell it out"], 1, ""),
    Q("q5", "How many tips does this part cover?", ["3", "4", "6", "10"], 2, ""),
    Q("q6", "What does the video advise about volume?", ["Whisper to sound calm", "Speak up", "Speak as fast as possible", "Volume doesn't matter"], 1, ""),
  ]],
  ["VID-004", "71072SmHjdM", "IELTS Speaking – part 3: aiming for band 8.0", "Counselling knowledge", "2023-10-14", 450, "Strategies for the three parts of the speaking test — the interview, the cue card and the discussion.", [
    Q("q1", "Which three parts of the speaking test does this episode cover?", ["Reading, writing, listening", "Interview, cue card and discussion", "Grammar, vocabulary and spelling", "Introduction, essay and summary"], 1, ""),
    Q("q2", "What band score is the series aiming for?", ["6.0", "7.0", "8.0", "9.0"], 2, ""),
    Q("q3", "In which part do candidates talk about a topic given on a card?", ["Interview", "Cue card", "Discussion", "Listening"], 1, ""),
    Q("q4", "Which part of the series is this?", ["Part 1", "Part 2", "Part 3", "Part 4"], 2, ""),
    Q("q5", "Which IELTS section is this series about?", ["Reading", "Writing", "Listening", "Speaking"], 3, ""),
  ]],
  ["VID-005", "Gq0tjGbjPyc", "IELTS Listening – 4 tips, part 2", "Counselling knowledge", "2023-10-02", 202, "Four listening tips: timing matters, read the upcoming questions, if you've missed it move on, and the questions are always in order.", [
    Q("q1", "If a candidate misses an answer, what should they do?", ["Stop and wait for a replay", "Move on", "Leave the test", "Guess every remaining answer"], 1, ""),
    Q("q2", "What order do the questions follow?", ["Random", "Reverse", "Always in order", "By difficulty"], 2, ""),
    Q("q3", "What should candidates do before the audio reaches a section?", ["Read the upcoming questions", "Write their name again", "Close the booklet", "Check the time only"], 0, ""),
    Q("q4", "How many tips does the video give?", ["2", "4", "6", "8"], 1, ""),
    Q("q5", "Which IELTS section is this video about?", ["Listening", "Reading", "Writing", "Speaking"], 0, ""),
    Q("q6", "What is the first tip about?", ["Spelling", "Timing", "Handwriting", "Grammar"], 1, ""),
  ]],
  ["VID-006", "9SbnyW3pKNs", "Best UK courses for a high-paying job", "Counselling knowledge", "2025-05-05", 37, "A top-10 of UK study fields with strong graduate prospects — from accounting and finance to engineering at number one. Useful when students ask which course leads to a good job.", [
    Q("q1", "Which field is number one in the list?", ["Medicine & Dentistry", "Engineering", "Architecture", "Data Science & Analytics"], 1, ""),
    Q("q2", "Which of these fields appears in the top 10?", ["Data Science & Analytics", "Fashion design", "Tourism", "Music"], 0, ""),
    Q("q3", "Which field is number two?", ["Medicine & Dentistry", "IT & Computer Science", "Architecture", "Healthcare & Social Care"], 0, ""),
    Q("q4", "Renewable energy is grouped with which field?", ["Architecture", "Geology & Earth Sciences", "Healthcare", "Economics"], 1, ""),
    Q("q5", "Which field is number ten?", ["Engineering", "Accounting, Banking & Finance", "Architecture", "Data Science"], 1, ""),
    Q("q6", "What does BHE UNI offer students choosing a course?", ["Guaranteed jobs", "Free expert guidance", "Paid consultations only", "Nothing"], 1, ""),
  ]],
  ["VID-007", "rJrRrH1gZsA", "Visa success: UK visa in 1 month 10 days + £2,000 scholarship", "Counselling knowledge", "2025-12-30", 67, "Prithi Zaglu's UK visa and £2,000 scholarship for the University of Hertfordshire — an example of fast-track visa and scholarship support to share with students.", [
    Q("q1", "How long did the UK visa take in this story?", ["2 weeks", "1 month 10 days", "3 months", "6 months"], 1, ""),
    Q("q2", "How much was the scholarship?", ["£500", "£1,000", "£2,000", "£5,000"], 2, ""),
    Q("q3", "Which university was it for?", ["Coventry University", "University of Greenwich", "University of Hertfordshire", "De Montfort University"], 2, ""),
    Q("q4", "What is the student's name?", ["Prithi Zaglu", "Anne Smith", "Salim Hossain", "Nabila Rahman"], 0, ""),
    Q("q5", "Which intake was announced as open for applications?", ["January 2026", "May 2026", "September 2027", "January 2028"], 1, ""),
    Q("q6", "Which is listed as a BHE UNI advantage?", ["Guaranteed visa", "Full end-to-end guidance", "No documents needed", "Free tuition"], 1, ""),
  ]],
  ["VID-008", "ypFZN06-soY", "Busy schedule? Flexible study for working students", "Counselling knowledge", "2026-01-08", 30, "The flexible 2-day study format for home students who work: one day online and one day on campus, with admissions and Student Finance support at no cost.", [
    Q("q1", "What is the flexible study format?", ["Fully online", "1 day online and 1 day on campus", "5 days on campus", "Evenings only, online"], 1, ""),
    Q("q2", "What does BHE charge for admissions and Student Finance support?", ["£99", "£250", "Nothing — no cost", "10% of tuition"], 2, ""),
    Q("q3", "How many study days a week does the format need?", ["1", "2", "3", "5"], 1, ""),
    Q("q4", "Which intake does the video advertise?", ["September 2025", "January 2026", "May 2026", "September 2026"], 1, ""),
    Q("q5", "Who is this format aimed at?", ["People with busy schedules", "Only school leavers", "Only international students", "Only postgraduates"], 0, ""),
    Q("q6", "When does the video suggest studying can fit in?", ["Weekends or evenings", "Only weekday mornings", "Only in summer", "Only online at night"], 0, ""),
  ]],
  ["VID-009", "jMvGH2Ey4sI", "Study & settle in Canada: your pathway", "Counselling knowledge", "2023-10-15", 34, "Canada as a study-and-settle destination, including post-graduate work permits. Check current immigration rules before quoting them to students.", [
    Q("q1", "How long a post-graduate work permit does the video mention?", ["6 months", "1 year", "2–3 years", "5 years"], 2, ""),
    Q("q2", "Which country is this video about?", ["Australia", "Canada", "Ireland", "United States"], 1, ""),
    Q("q3", "The video says students may be able to apply without which test?", ["IELTS", "SAT", "GMAT", "TOEFL Essentials"], 0, ""),
    Q("q4", "Why does the video urge students to act quickly?", ["Fees are rising tomorrow", "Canadian universities are closing admissions soon", "Visas stop next week", "Scholarships end today"], 1, ""),
    Q("q5", "Canada is presented as a pathway to…", ["Study only", "Study and settle", "Tourism", "Short courses only"], 1, ""),
  ]],
  ["VID-010", "_oN6gkt4Fac", "A message from our Director, Dr. Mohammad Shafiq", "Company & culture", "2025-11-15", 153, "Our Director's speech at the Banani Branch grand opening and 13 years of success celebration, on growth, vision and dedication.", [
    Q("q1", "Who gives the message in this video?", ["The London branch manager", "Dr. Mohammad Shafiq, our Director", "A visiting university representative", "A student ambassador"], 1, ""),
    Q("q2", "How many years of success were being celebrated?", ["5", "10", "13", "20"], 2, ""),
    Q("q3", "Which branch opening was it?", ["Sylhet", "Banani", "Manchester", "Milton Keynes"], 1, ""),
    Q("q4", "Where was the event held?", ["The London office", "Sheraton Hotel, Dhaka", "A university campus", "Online"], 1, ""),
    Q("q5", "Which themes did the speech focus on?", ["Growth, vision and dedication", "Fees and discounts", "Visa rules", "Exam results"], 0, ""),
  ]],
  ["VID-011", "ha_ej78kiF8", "Becoming BHE UNI: our new identity as an EdTech", "Company & culture", "2023-10-17", 36, "The CEO's speech from the London office at the rebranding ceremony, introducing the AI-based Instant Eligibility Check for courses, campuses and intakes.", [
    Q("q1", "What new tool was introduced at the rebrand?", ["A payment gateway", "An AI-based Instant Eligibility Check", "A visa application form", "A student loan calculator"], 1, ""),
    Q("q2", "Where did the CEO speak from?", ["The Dhaka office", "The London office", "A university campus", "An education fair"], 1, ""),
    Q("q3", "Who gave the speech?", ["The CEO", "A student", "A university dean", "A visa officer"], 0, ""),
    Q("q4", "Which of these can the eligibility check tell students?", ["Their visa decision", "Available courses, campuses and intakes", "Their exam score", "Their accommodation address"], 1, ""),
    Q("q5", "How quickly does the eligibility check give answers?", ["In seconds", "In a week", "After an interview", "After payment"], 0, ""),
    Q("q6", "What did BHE UNI become with the rebrand?", ["A university", "An EdTech", "A bank", "A travel agency"], 1, ""),
  ]],
  ["VID-012", "xKW8y9zi4Zg", "BHE UNI mobile app launch", "Company & culture", "2023-11-13", 50, "Our all-in-one mobile app for students. Point students to it after their first counselling session.", [
    Q("q1", "Where is the BHE UNI app available?", ["Only on the website", "Google Play Store", "Only in branches", "It isn't released yet"], 1, ""),
    Q("q2", "How is the app described?", ["A game", "An all-in-one solution for seamless education", "A payment-only tool", "A staff chat app"], 1, ""),
    Q("q3", "What kind of product was launched?", ["A mobile app", "A printed prospectus", "A TV channel", "A new branch"], 0, ""),
    Q("q4", "Who is the app mainly for?", ["Students", "University staff", "Visa officers", "Landlords"], 0, ""),
    Q("q5", "When should counsellors point students to the app?", ["Never", "After their first counselling session", "Only after enrolment", "Only if they ask twice"], 1, ""),
  ]],
  ["VID-013", "R3AkIl9MYDw", "Relive the BHE UNI Education Expo 2026", "Company & culture", "2026-04-25", 72, "Highlights from Education Expo 2026: direct interaction with international university representatives and expert study-abroad counselling.", [
    Q("q1", "What made the Expo special for students?", ["Free flights", "Direct interaction with international university representatives", "Guaranteed offers", "Visa decisions on the day"], 1, ""),
    Q("q2", "What kind of counselling was offered at the Expo?", ["Expert counselling on study-abroad pathways", "Tax advice", "Career coaching for staff", "None"], 0, ""),
    Q("q3", "Which year's Expo is shown?", ["2024", "2025", "2026", "2027"], 2, ""),
    Q("q4", "Which phrase closes the video?", ["From dreams to direction", "Study hard, play hard", "Apply today, fly tomorrow", "Your future, our fees"], 0, ""),
    Q("q5", "What else featured at the event?", ["Inspiring success stories", "A cooking contest", "Sports matches", "A job fair for staff"], 0, ""),
  ]],
  ["VID-014", "QRJvAxSdIWM", "Visa success stories | BHE UNI", "Counselling knowledge", "2026-01-22", 110, "Students share their visa success with BHE UNI. The questions check the visa basics every counsellor needs when talking about success stories.", [
    Q("q1", "How long must a student hold their visa funds?", ["14 days", "28 consecutive days", "3 months", "Any 28 days in 6 months"], 1, ""),
    Q("q2", "What is the monthly living-cost figure for study in London?", ["£1,023", "£1,136", "£1,334", "£1,483"], 3, ""),
    Q("q3", "Which certificate do students from Bangladesh need for the visa?", ["A driving licence", "A TB test certificate", "A police certificate from the UK", "A bank reference"], 1, ""),
    Q("q4", "What should counsellors never promise a student?", ["A call back", "A visa", "A shortlist", "An appointment"], 1, ""),
    Q("q5", "Where do you record the visa checks you've made?", ["In your notebook", "As a note on the application in the CRM", "In WhatsApp", "Nowhere"], 1, ""),
  ]],
];

function seedVideos(): VideoSession[] {
  const staff = getStaff().filter((s) => s.status === "Active" || s.status === "On leave");
  const passRate: Record<string, number> = { "Getting started": 0.8, "Counselling knowledge": 0.45, "Company & culture": 0.6 };
  return videoSeeds.map(([id, ytId, title, area, recordedOn, seconds, description, quiz]) => {
    const results: Record<string, VideoResult> = {};
    for (const s of staff) {
      const r = rand(`${id}${s.id}`);
      const rate = passRate[area] ?? 0.5;
      const from = recordedOn > s.joined ? recordedOn : s.joined;
      const at = addDays(from, 2 + Math.round(r * Math.max(1, Math.min(200, (Date.parse(trainingToday) - Date.parse(from)) / DAY - 3))));
      if (at > trainingToday) continue;
      if (r < rate) results[s.id] = { watchedAt: at, attempts: quiz.length ? [...(r > rate * 0.7 ? [{ date: at, score: 50 }] : []), { date: at, score: 100 }] : [], passedAt: at };
      else if (r < rate + 0.12) results[s.id] = { watchedAt: at, attempts: r < rate + 0.06 && quiz.length ? [{ date: at, score: 50 }] : [] };
    }
    // The signed-in demo user has watched the CRM overview and is part-way through the IELTS series.
    if (id === "VID-001") results["STF-001"] = { watchedAt: "2025-12-09", attempts: [{ date: "2025-12-09", score: 100 }], passedAt: "2025-12-09" };
    if (id === "VID-002") results["STF-001"] = { watchedAt: "2026-09-15", attempts: [] };
    if (id === "VID-005") delete results["STF-001"];
    return {
      id,
      title,
      description,
      url: yt(ytId),
      area,
      presenter: "BHE UNI media team",
      recordedOn,
      minutes: Math.max(1, Math.round(seconds / 60)),
      seconds,
      quiz,
      passMark: 80,
      results,
      addedBy: "Sadman Rahman",
      addedAt: "2026-09-01",
    };
  });
}

let videos: VideoSession[] | null = null;
export function getVideos() {
  return (videos ??= seedVideos());
}
export function saveVideos(next: VideoSession[]) {
  videos = next;
}
export function nextVideoId(list = getVideos(), offset = 0) {
  return `VID-${String(list.reduce((m, v) => Math.max(m, Number(v.id.slice(4)) || 0), 0) + 1 + offset).padStart(3, "0")}`;
}

/** Video length as hh:mm:ss. */
export function videoLength(v: Pick<VideoSession, "minutes" | "seconds">) {
  const t = v.seconds ?? v.minutes * 60;
  return [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60].map((n) => String(n).padStart(2, "0")).join(":");
}

/** A learner's progress through one video: 0 not watched, 50 watched with the quiz outstanding, 100 complete. */
export const videoProgress = (v: VideoSession, learnerId: string) => ({ "Not watched": 0, "Quiz due": 50, Failed: 50, Passed: 100 })[videoStatus(v, learnerId)];

// --- Playlists ----------------------------------------------------------------

export const playlistCategories = ["Counsellor Training", "Agent Training", "Knowledge & exams", "Company & culture"] as const;
export type PlaylistCategory = (typeof playlistCategories)[number];
export interface Playlist {
  id: string;
  title: string;
  description: string;
  category: PlaylistCategory;
  /** In play order. A video can sit in several playlists. */
  videoIds: string[];
  createdBy: string;
  createdAt: string;
}

const playlistSeeds: Playlist[] = [
  { id: "PL-001", title: "Counsellor Training", description: "Start here — the CRM, the courses students ask about and the visa basics every counsellor needs.", category: "Counsellor Training", videoIds: ["VID-001", "VID-006", "VID-007", "VID-014", "VID-008"], createdBy: "Sadman Rahman", createdAt: "2026-09-01" },
  { id: "PL-002", title: "Study destinations & courses", description: "UK courses with strong job prospects, flexible study for working students and the Canada pathway.", category: "Counsellor Training", videoIds: ["VID-006", "VID-008", "VID-009"], createdBy: "Sadman Rahman", createdAt: "2026-09-02" },
  { id: "PL-003", title: "Agent Training", description: "For new partner agents: the CRM, who BHE UNI is, and the tools students will use.", category: "Agent Training", videoIds: ["VID-001", "VID-011", "VID-012", "VID-007"], createdBy: "Sadman Rahman", createdAt: "2026-09-01" },
  { id: "PL-004", title: "IELTS preparation", description: "The IELTS series — scoring, speaking and listening tips to pass on to students preparing for the test.", category: "Knowledge & exams", videoIds: ["VID-002", "VID-003", "VID-004", "VID-005"], createdBy: "Sadman Rahman", createdAt: "2026-09-03" },
  { id: "PL-005", title: "Life at BHE UNI", description: "Our story, our Director's message, the rebrand, the app launch and Education Expo 2026.", category: "Company & culture", videoIds: ["VID-010", "VID-011", "VID-012", "VID-013"], createdBy: "Sadman Rahman", createdAt: "2026-09-04" },
];

let playlists: Playlist[] | null = null;
export function getPlaylists() {
  return (playlists ??= playlistSeeds.map((p) => ({ ...p, videoIds: [...p.videoIds] })));
}
export function savePlaylists(next: Playlist[]) {
  playlists = next;
}
export function getPlaylist(id: string) {
  return getPlaylists().find((p) => p.id === id);
}
export function nextPlaylistId(list = getPlaylists()) {
  return `PL-${String(list.reduce((m, p) => Math.max(m, Number(p.id.slice(3)) || 0), 0) + 1).padStart(3, "0")}`;
}

/** A readable title from a link, for bulk imports without titles. */
export function titleFromUrl(url: string) {
  try {
    const u = new URL(url);
    const last = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() ?? "");
    const clean = last.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim();
    return clean && !/^[A-Za-z0-9]{8,}$/.test(clean) && clean !== "watch" ? clean[0].toUpperCase() + clean.slice(1) : `${parseVideo(url).source} session`;
  } catch {
    return "Video session";
  }
}

// --- Training periods (programmes) -----------------------------------------------

export type ProgrammeAudience = "Counsellor" | "Agent";
export interface ProgrammeStep {
  id: string;
  kind: "course" | "video";
  refId: string;
  /** Days after the learner's start date the step should be finished. */
  dueDay: number;
}
export interface Programme {
  id: string;
  name: string;
  audience: ProgrammeAudience;
  description: string;
  durationDays: number;
  steps: ProgrammeStep[];
}
export interface ProgrammeLearner {
  programmeId: string;
  learnerId: string;
  startDate: string;
  reminders: string[];
}

const seedProgrammes: Programme[] = [
  {
    id: "PRG-COUNSELLOR",
    name: "New counsellor training period",
    audience: "Counsellor",
    description: "The first 30 days for every new counsellor: the CRM, data protection, UKVI compliance, credibility interviews and consultative counselling. Add your recorded video sessions as steps.",
    durationDays: 30,
    steps: [
      { id: "s6", kind: "video", refId: "VID-001", dueDay: 2 },
      { id: "s1", kind: "course", refId: "TRN-CRM", dueDay: 3 },
      { id: "s2", kind: "course", refId: "TRN-GDPR", dueDay: 7 },
      { id: "s7", kind: "video", refId: "VID-002", dueDay: 10 },
      { id: "s3", kind: "course", refId: "TRN-UKVI", dueDay: 14 },
      { id: "s4", kind: "course", refId: "TRN-CRED", dueDay: 21 },
      { id: "s8", kind: "video", refId: "VID-006", dueDay: 25 },
      { id: "s5", kind: "course", refId: "TRN-SALES", dueDay: 30 },
    ],
  },
  {
    id: "PRG-AGENT",
    name: "Agent partner onboarding",
    audience: "Agent",
    description: "What every agent partner completes in their first 21 days — before their first application is processed. Pending agents can start while KYC is reviewed.",
    durationDays: 21,
    steps: [
      { id: "s4", kind: "video", refId: "VID-001", dueDay: 3 },
      { id: "s1", kind: "course", refId: "TRN-PARTNER", dueDay: 7 },
      { id: "s5", kind: "video", refId: "VID-011", dueDay: 10 },
      { id: "s2", kind: "course", refId: "TRN-GDPR", dueDay: 14 },
      { id: "s3", kind: "course", refId: "TRN-UKVI", dueDay: 21 },
    ],
  },
];

let programmes: Programme[] = seedProgrammes;
let programmeLearners: ProgrammeLearner[] | null = null;

export function getProgrammes() {
  return programmes;
}
export function saveProgrammes(next: Programme[]) {
  programmes = next;
}

/** Counsellors who joined recently, and every approved or pending agent. */
function seedProgrammeLearners(agents: { id: string; status: string; approvedAt?: string; appliedAt: string }[]): ProgrammeLearner[] {
  const counsellors = getStaff().filter((s) => ["counsellor", "senior-counsellor"].includes(s.roleId) && s.status !== "Inactive" && s.status !== "Invited" && s.joined >= "2024-01-01");
  // Counsellors whose training period ended long ago finished it on time — except one, kept as a real follow-up.
  const programme = seedProgrammes.find((p) => p.id === "PRG-COUNSELLOR")!;
  const list = getEnrolments();
  const finished = counsellors.filter((s) => addDays(s.joined, programme.durationDays + 60) < trainingToday);
  const next = [...list];
  finished.forEach((s, i) => {
    if (i === finished.length - 1 && finished.length > 2) return;
    for (const st of programme.steps) {
      const c = courses.find((x) => x.id === st.refId);
      if (!c) continue;
      const at = addDays(s.joined, Math.max(1, st.dueDay - 1));
      const done = (e: Enrolment): Enrolment => (e.completedAt ? e : { ...e, completedLessons: allLessons(c).map((l) => l.id), completedAt: at, attempts: [...e.attempts, { date: at, score: Math.min(100, c.passMark + 10) }] });
      const idx = next.findIndex((e) => e.staffId === s.id && e.courseId === c.id);
      if (idx >= 0) next[idx] = done(next[idx]);
      else next.push(done({ staffId: s.id, courseId: c.id, assignedAt: s.joined, dueDate: addDays(s.joined, st.dueDay), completedLessons: [], attempts: [], reminders: [] }));
    }
  });
  saveEnrolments(next);
  return [
    ...counsellors.map((s) => ({ programmeId: "PRG-COUNSELLOR", learnerId: s.id, startDate: s.joined, reminders: [] })),
    ...agents.filter((a) => a.status !== "Rejected").map((a) => ({ programmeId: "PRG-AGENT", learnerId: a.id, startDate: a.approvedAt ?? a.appliedAt, reminders: [] })),
  ];
}

export function getProgrammeLearners(agents: { id: string; status: string; approvedAt?: string; appliedAt: string }[]) {
  if (!programmeLearners) {
    programmeLearners = seedProgrammeLearners(agents);
    seedAgentEnrolments(agents);
    syncVideoSteps(programmeLearners);
  }
  return programmeLearners;
}

/** Seeded learners who finished every course step also passed the video steps, on time. */
function syncVideoSteps(list: ProgrammeLearner[]) {
  const enrols = getEnrolments();
  const vids = getVideos().map((v) => ({ ...v, results: { ...v.results } }));
  for (const l of list) {
    const p = programmes.find((x) => x.id === l.programmeId);
    if (!p) continue;
    const courseSteps = p.steps.filter((st) => st.kind === "course");
    const finished = courseSteps.every((st) => enrols.some((e) => e.staffId === l.learnerId && e.courseId === st.refId && e.completedAt));
    for (const st of p.steps.filter((x) => x.kind === "video")) {
      const v = vids.find((x) => x.id === st.refId);
      if (!v) continue;
      const due = addDays(l.startDate, st.dueDay);
      const already = v.results[l.learnerId]?.passedAt;
      if (finished && !already) {
        const at = due > trainingToday ? trainingToday : addDays(due, -1);
        v.results[l.learnerId] = { watchedAt: at, attempts: v.quiz.length ? [{ date: at, score: 100 }] : [], passedAt: at };
      } else if (!finished && due >= trainingToday && already && already > trainingToday) {
        delete v.results[l.learnerId];
      }
    }
  }
  saveVideos(vids);
}
export function saveProgrammeLearners(next: ProgrammeLearner[]) {
  programmeLearners = next;
}

/** Course progress for agents, who train through the agent portal. */
export function seedAgentEnrolments(agents: { id: string; status: string; approvedAt?: string; appliedAt: string }[]) {
  const list = getEnrolments();
  if (list.some((e) => e.staffId.startsWith("AGT-"))) return list;
  const extra: Enrolment[] = [];
  const agentProgramme = seedProgrammes.find((p) => p.id === "PRG-AGENT")!;
  for (const a of agents) {
    if (a.status === "Rejected") continue;
    const start = a.approvedAt ?? a.appliedAt;
    for (const step of agentProgramme.steps) {
      const c = courses.find((x) => x.id === step.refId);
      if (!c) continue;
      const r = rand(`${a.id}${c.id}`);
      const due = addDays(start, step.dueDay);
      const old = start < "2026-06-01";
      const done = a.status === "Pending" ? r < 0.35 && step.dueDay <= 7 : r < (old ? 0.9 : 0.55);
      const completedAt = done ? (addDays(start, Math.min(step.dueDay, 3 + Math.round(r * step.dueDay))) > trainingToday ? addDays(trainingToday, -1) : addDays(start, Math.min(step.dueDay, 3 + Math.round(r * step.dueDay)))) : undefined;
      extra.push({
        staffId: a.id,
        courseId: c.id,
        assignedAt: start,
        dueDate: due,
        completedLessons: done ? allLessons(c).map((l) => l.id) : allLessons(c).slice(0, Math.round(r * allLessons(c).length)).map((l) => l.id),
        attempts: done ? [{ date: completedAt!, score: Math.min(100, c.passMark + Math.round(r * 20)) }] : [],
        completedAt,
        reminders: [],
      });
    }
  }
  const next = [...list, ...extra];
  saveEnrolments(next);
  return next;
}

export type StepStatus = "Done" | "Due soon" | "Overdue" | "Upcoming";
export type LearnerProgrammeStatus = "Not started" | "On track" | "Behind" | "Completed";

/** Where a learner is in a training period. */
export function programmeProgress(p: Programme, learner: ProgrammeLearner, enrols: Enrolment[], vids: VideoSession[]) {
  const steps = p.steps.map((st) => {
    const due = addDays(learner.startDate, st.dueDay);
    let done = false;
    let doneAt: string | undefined;
    let title = "";
    if (st.kind === "course") {
      const c = courses.find((x) => x.id === st.refId);
      title = c?.title ?? "Deleted course";
      const e = enrols.find((x) => x.staffId === learner.learnerId && x.courseId === st.refId);
      done = !!e?.completedAt;
      doneAt = e?.completedAt;
    } else {
      const v = vids.find((x) => x.id === st.refId);
      title = v?.title ?? "Deleted video";
      const r = v?.results[learner.learnerId];
      done = !!v && videoStatus(v, learner.learnerId) === "Passed";
      doneAt = r?.passedAt ?? r?.watchedAt;
    }
    const status: StepStatus = done ? "Done" : due < trainingToday ? "Overdue" : daysUntil(due) <= 7 ? "Due soon" : "Upcoming";
    return { step: st, title, due, done, doneAt, status };
  });
  const doneCount = steps.filter((s) => s.done).length;
  const day = Math.max(0, Math.round((Date.parse(trainingToday) - Date.parse(learner.startDate)) / DAY));
  const status: LearnerProgrammeStatus =
    learner.startDate > trainingToday ? "Not started" : doneCount === steps.length && steps.length ? "Completed" : steps.some((s) => s.status === "Overdue") ? "Behind" : "On track";
  const next = steps.find((s) => !s.done);
  const finishedAt = status === "Completed" ? steps.map((s) => s.doneAt ?? "").sort().at(-1) : undefined;
  return { steps, doneCount, percent: steps.length ? Math.round((doneCount / steps.length) * 100) : 0, day, status, next, finishedAt };
}
