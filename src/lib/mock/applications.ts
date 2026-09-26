import { findUniversity, levelFor, type CourseLevel, type DeliveryMode } from "./course-catalog";
import { initialsFor } from "@/lib/utils";
import { generateApplications } from "./application-generator";

// Mock data & option lists for the Applications module (list page + New Application wizard)

export interface AddressData {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface PersonalDetailsData {
  branch: string;
  counsellor: string;
  leadSource: string;
  applicationType: string;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  email: string;
  gender: string;
  dob: string;
  nationality: string;
  maritalStatus: string;
  firstLanguage: string;
  passportNo: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  sameAsPresent: boolean;
  presentAddress: AddressData;
  permanentAddress: AddressData;
}

export interface CourseEntry {
  id: string;
  country: string;
  university: string;
  courseName: string;
  courseLevel: string;
  deliveryMode: string;
  intake: string;
  campus: string;
}

export interface EducationEntry {
  id: string;
  level: string;
  status: string;
  institute: string;
  specialisation: string;
  qualification: string;
  gradeScheme: string;
  gradeAverage: string;
}

export interface WorkExperienceEntry {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  employer: string;
  employerEmail: string;
  designation: string;
  workType: string;
  responsibilities: string;
}

export interface DocumentEntry {
  id: string;
  type: string;
  title: string;
  fileName: string;
}

export interface LanguageEntry {
  id: string;
  testType: string;
  testStatus: string;
  overallScore: string;
  completionDate: string;
  fileName: string;
}

export type YesNo = "yes" | "no" | "";

export interface DeclarationData {
  visaRefusal: YesNo;
  studiedAbroad: YesNo;
  appliedOtherUniversities: YesNo;
  fundsArranged: YesNo;
  feesPayment: string;
  feesPaymentOther: string;
  dependents: YesNo;
  livedInUkEu: YesNo;
  disabilities: YesNo;
  criminalConvictions: YesNo;
  acceptStatement: boolean;
  confirmAccurate: boolean;
  confirmQualifications: boolean;
  sendConsent: boolean;
}

export const emptyAddress = (): AddressData => ({
  line1: "",
  line2: "",
  city: "",
  state: "",
  postcode: "",
  country: "",
});

export const emptyPersonalDetails = (): PersonalDetailsData => ({
  branch: "",
  counsellor: "",
  leadSource: "",
  applicationType: "",
  title: "",
  firstName: "",
  middleName: "",
  lastName: "",
  phone: "",
  email: "",
  gender: "",
  dob: "",
  nationality: "",
  maritalStatus: "",
  firstLanguage: "",
  passportNo: "",
  passportIssueDate: "",
  passportExpiryDate: "",
  sameAsPresent: false,
  presentAddress: emptyAddress(),
  permanentAddress: emptyAddress(),
});

export const emptyDeclaration = (): DeclarationData => ({
  visaRefusal: "",
  studiedAbroad: "",
  appliedOtherUniversities: "",
  fundsArranged: "",
  feesPayment: "",
  feesPaymentOther: "",
  dependents: "",
  livedInUkEu: "",
  disabilities: "",
  criminalConvictions: "",
  acceptStatement: false,
  confirmAccurate: false,
  confirmQualifications: false,
  sendConsent: false,
});

export function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// --- Option lists -----------------------------------------------------

export const branches = ["Dhaka HQ", "Sylhet", "London", "Manchester", "Milton Keynes"];

export const counsellors = [
  "Alif Tasnim",
  "Harunor Rashid",
  "Bickey Shah",
  "Nusrat Choudhury",
  "Yuliana Prokipchak",
];

export const leadSources = [
  "Walk-in",
  "Referral",
  "Facebook Ads",
  "Google Ads",
  "Education Fair",
  "Agent Partner",
  "Website Inquiry",
];

export const applicationTypes = ["Direct", "Agent-Referred", "Transfer", "Progression"];

export const titles = ["Mr", "Mrs", "Ms", "Mx", "Dr"];

export const genders = ["Male", "Female", "Other", "Prefer not to say"];

export const maritalStatuses = ["Single", "Married", "Divorced", "Widowed"];

export const nationalities = [
  "Bangladeshi",
  "British",
  "Indian",
  "Pakistani",
  "Nepalese",
  "Nigerian",
  "Ghanaian",
  "Other",
];

export const countries = [
  "United Kingdom",
  "Bangladesh",
  "United States",
  "Canada",
  "Australia",
  "Ireland",
  "India",
];

export const universities = [
  "Cleveland State University",
  "University of Greenwich",
  "Coventry University",
  "University of Sunderland",
  "Teesside University",
  "Anglia Ruskin University",
];

export const courseLevels = ["Foundation", "Undergraduate", "Postgraduate", "PhD", "Diploma"];

export const deliveryModes = ["On Campus", "Online", "Blended", "Weekdays Evening", "Weekend"];

export const intakes = ["January 2027", "May 2027", "September 2027", "January 2028"];

export const educationLevels = [
  "Secondary",
  "Higher Secondary",
  "Undergraduate Degree",
  "Postgraduate Degree",
  "Diploma",
];

export const educationStatuses = ["Completed", "Ongoing", "Awaiting Result"];

export const gradeSchemes = [
  "Percentage",
  "GPA 0-4",
  "GPA 0-5",
  "Grade Scale 0-10",
  "CGPA",
  "UK Honours Classification",
];

export const workStatuses = ["Employed", "Self-Employed", "Unemployed", "Not Applicable"];

export const workTypes = ["Full-time", "Part-time", "Internship", "Freelance", "Contract"];

export const documentTypes = [
  "Passport",
  "Academic Transcript",
  "Degree Certificate",
  "English Test Certificate",
  "CV / Resume",
  "Bank Statement",
  "Reference Letter",
  "Photo",
];

export const testTypes = ["IELTS", "TOEFL", "PTE", "Duolingo", "Not Required"];

export const testStatuses = ["Booked", "Completed", "Withdrawn", "Awaiting Result"];

export const fundingSources = [
  "Self-Financing",
  "Family",
  "Student Finance Loan",
  "Scholarship by Government/NGO",
  "Other",
];

// --- Applications list (for /applications) -----------------------------

export const operationsSnapshotDate = "2026-09-17";

export interface ApplicationDeadline {
  type: "Application" | "Deposit" | "CAS" | "Visa";
  dueDate: string;
}

export interface ApplicationBlocker {
  category: "Documents" | "Payment" | "University response";
  reason: string;
  since: string;
}

export type ApplicationStage =
  | "New"
  | "App submitted"
  | "Conditional offer"
  | "Unconditional offer"
  | "CAS issued"
  | "Visa filed"
  | "Enrolled"
  | "Rejected"
  | "Withdrawn";

export type FundingStatus = "N/A" | "SFE applied" | "SFE approved" | "Self-funded" | "Deposit paid" | "Scholarship";
export type ApplicationChannel = "Direct" | "Agent" | "Affiliate";

/** An additional course the student is applying to alongside the main one. */
export interface CourseOption {
  id: string;
  country: string;
  university: string;
  course: string;
  level: CourseLevel;
  mode: DeliveryMode;
  campus: string;
  intake: string;
  stage: ApplicationStage;
  funding: FundingStatus;
}

export interface FollowUp {
  id: string;
  at: string;
  channel: "Call" | "WhatsApp" | "Email" | "In person";
  notes: string;
  by: string;
  done: boolean;
}

export interface Meeting {
  id: string;
  at: string;
  counsellor: string;
  format: "In person" | "Video call" | "Phone";
  durationMins: number;
  notes: string;
}

export interface DocumentRequest {
  id: string;
  title: string;
  description: string;
  count: number;
  dueDate: string;
  channels: ("Email" | "WhatsApp" | "Student portal")[];
  requestedAt: string;
  by: string;
  status: "Requested" | "Received";
}

export interface ApplicationNote {
  text: string;
  author: string;
  at: string;
}

export interface ApplicationRow {
  id: string;
  applicant: string;
  initials: string;
  phone: string;
  email: string;
  /** Issued by the university once enrolled; empty until then. */
  studentId: string;
  course: string;
  university: string;
  campus: string;
  intake: string;
  stage: ApplicationStage;
  funding: FundingStatus;
  branch: string;
  counsellor: string;
  source: string;
  channel: ApplicationChannel;
  /** Partner agent or affiliate who referred the student. */
  partner?: string;
  notes: ApplicationNote[];
  /** Destination country, level and delivery mode of the main course. */
  country: string;
  level: CourseLevel;
  mode: DeliveryMode;
  /** Alternative course choices, in the student's order of preference. */
  courseOptions: CourseOption[];
  followUps: FollowUp[];
  meetings: Meeting[];
  documentRequests: DocumentRequest[];
  /** ISO date-time the application was created. */
  createdAt: string;
  updatedAt: string;
  deadlines?: ApplicationDeadline[];
  blockers?: ApplicationBlocker[];
}

export const applicationStages: ApplicationStage[] = [
  "New",
  "App submitted",
  "Conditional offer",
  "Unconditional offer",
  "CAS issued",
  "Visa filed",
  "Enrolled",
  "Rejected",
  "Withdrawn",
];

export const fundingStatuses: FundingStatus[] = ["N/A", "SFE applied", "SFE approved", "Self-funded", "Deposit paid", "Scholarship"];

type Raw = [
  applicant: string,
  phone: string,
  email: string,
  university: string,
  course: string,
  campus: string,
  intake: string,
  stage: ApplicationStage,
  funding: FundingStatus,
  branch: string,
  counsellor: string,
  source: string,
  channel: ApplicationChannel,
  createdAt: string,
  note?: string,
  partner?: string,
];

const raw: Raw[] = [
  ["Tanvir Hossen", "+880 1613-831558", "tanvir.hossen@gmail.com", "Nanjing University of Information Science & Technology", "BSc in Computer Science and Technology", "China", "Mar 2027", "New", "N/A", "Dhaka HQ", "Youna", "Boost Website", "Direct", "2026-08-23T05:44:04Z"],
  ["Anhar Hamid Rahman", "07888 868088", "anhar.rahman@outlook.com", "UK Management College", "BA (Hons) Digital Marketing", "Manchester", "Sep 2026", "App submitted", "SFE applied", "Manchester", "S. Parappadan Sankaran", "Personal Referral", "Direct", "2026-08-21T17:01:37Z"],
  ["Kevin Ramos Dacosta", "07471 589920", "kevin.dacosta@gmail.com", "London School of Commerce", "CertHE Business with Foundation Year", "Manchester", "Oct 2026", "App submitted", "SFE applied", "Manchester", "S. Parappadan Sankaran", "Personal Referral", "Direct", "2026-08-21T16:19:33Z", "19 years old, LRS request sent — waiting for share code"],
  ["Victor Sinkamba", "+44 7749 461434", "victor.sinkamba@yahoo.com", "UK Management College", "BA (Hons) Business Management", "Newcastle", "Sep 2026", "App submitted", "N/A", "London", "Alif Tasnim", "Health & Care Campaign", "Direct", "2026-08-21T17:55:47Z", "Health & social care background, wants Newcastle campus"],
  ["Sina Abubakr Mohammed", "07575 877151", "sina.abubakr@gmail.com", "University of the West of Scotland (London)", "CertHE Business", "London", "Sep 2026", "Conditional offer", "SFE applied", "London", "Nusrat Choudhury", "BHE UNI_UK_Website", "Direct", "2026-08-21T10:55:37Z", "Offer conditional on Level 3 certificate"],
  ["Vanya Boyanova Petrova", "+44 7782 958545", "vanya.petrova@gmail.com", "London College of Contemporary Arts", "BA (Hons) Graphic Design", "London", "Oct 2026", "App submitted", "Self-funded", "London", "N. Bintay Zaman", "BHE UNI_UK_Website", "Direct", "2026-08-21T10:40:47Z", "Graphic design, London — portfolio uploaded"],
  ["Aijaz Anwer", "+44 7957 122066", "aijaz.anwer@hotmail.com", "London School of Commerce", "CertHE Business with Foundation Year", "London", "Sep 2026", "Unconditional offer", "SFE approved", "London", "Bickey Shah", "Facebook Ads", "Direct", "2026-08-20T14:12:09Z"],
  ["Ahlam Mohamed Ali", "+44 7305 360198", "ahlam.ali@gmail.com", "Anglia Ruskin University London", "LLB (Hons) Law with Foundation Year", "London", "Sep 2026", "App submitted", "SFE applied", "London", "Bickey Shah", "Walk-in", "Direct", "2026-08-20T11:30:22Z", "Needs interview slot next week"],
  ["Farzana Islam", "+880 1712-440921", "farzana.islam@gmail.com", "University of Hertfordshire", "MSc Data Science", "Hatfield", "Jan 2027", "Visa filed", "Deposit paid", "Sylhet", "Harunor Rashid", "BD to UK Student Fair", "Direct", "2026-08-19T09:14:00Z", "Updated bank statement requested by UKVI"],
  ["Kamrul Hasan", "+880 1819-552310", "kamrul.hasan@yahoo.com", "Coventry University", "BSc (Hons) Computer Science", "Coventry", "Jan 2027", "App submitted", "Self-funded", "Dhaka HQ", "Alif Tasnim", "Agent Partner", "Agent", "2026-08-19T08:02:41Z", "", "Gunjon Education"],
  ["Nusrat Jahan", "+880 1911-770215", "nusrat.jahan@gmail.com", "Anglia Ruskin University", "MBA International Business", "Cambridge", "Sep 2026", "Conditional offer", "Deposit paid", "Manchester", "Nusrat Choudhury", "Agent Partner", "Agent", "2026-08-18T13:45:10Z", "Tuition deposit £4,000 paid — awaiting CAS", "Apex Global Edu Pathway"],
  ["Rakibul Hasan", "+880 1552-903817", "rakibul.h@gmail.com", "Teesside University", "BEng (Hons) Civil Engineering", "Middlesbrough", "Jan 2027", "New", "N/A", "Milton Keynes", "Yuliana Prokipchak", "TikTok Ads", "Direct", "2026-08-18T10:20:55Z", "Passport copy and transcript missing"],
  ["Shamima Akter", "+880 1673-118420", "shamima.akter@gmail.com", "University of Sunderland in London", "MSc International Business", "London", "May 2027", "Rejected", "N/A", "Dhaka HQ", "Alif Tasnim", "Facebook Ads", "Direct", "2026-08-17T15:05:31Z", "Refused: academic gap not explained"],
  ["Tanvir Ahmed", "+880 1788-204455", "tanvir.ahmed@gmail.com", "Coventry University", "BSc (Hons) Computer Science", "Coventry", "Sep 2026", "Enrolled", "Deposit paid", "Dhaka HQ", "Alif Tasnim", "BD to UK Student Fair", "Direct", "2026-08-16T09:40:12Z", "Enrolled and arrived 12 Sep"],
  ["Grace Owusu", "+44 7418 330912", "grace.owusu@gmail.com", "Regent College London", "BSc (Hons) Health and Social Care with Foundation Year", "London", "Oct 2026", "Unconditional offer", "SFE approved", "London", "Bickey Shah", "Health & Care Campaign", "Direct", "2026-08-16T12:18:44Z"],
  ["Mohammed Abdul Karim", "+44 7922 185530", "m.abdulkarim@gmail.com", "Oxford Business College", "BA (Hons) Business and Management", "Manchester", "Sep 2026", "CAS issued", "SFE approved", "Manchester", "S. Parappadan Sankaran", "Personal Referral", "Affiliate", "2026-08-15T16:40:02Z", "", "Ambassador: Rahim Uddin"],
  ["Priyanka Das", "+880 1715-661203", "priyanka.das@gmail.com", "Ulster University (Birmingham)", "MSc Data Science", "Birmingham", "Jan 2027", "Conditional offer", "Self-funded", "Dhaka HQ", "Ummay Saiha Limu", "Boost Website", "Direct", "2026-08-15T11:02:37Z", "IELTS 6.5 due 28 Sep"],
  ["Daniel Mensah", "+44 7550 219873", "daniel.mensah@outlook.com", "UK Management College", "BA (Hons) Business Management", "Birmingham", "Sep 2026", "Enrolled", "SFE approved", "London", "N. Bintay Zaman", "BHE UNI_UK_Website", "Direct", "2026-08-14T09:25:18Z"],
  ["Sadia Rahman", "+880 1830-447129", "sadia.rahman@gmail.com", "University of Greenwich", "MSc Project Management", "London", "Jan 2027", "App submitted", "Self-funded", "Sylhet", "Harunor Rashid", "Agent Partner", "Agent", "2026-08-14T07:58:40Z", "", "Tarek Associates"],
  ["Olena Kovalenko", "+44 7384 902117", "olena.kovalenko@gmail.com", "London School of Commerce", "BSc (Hons) Business and Tourism", "London", "Oct 2026", "Withdrawn", "N/A", "Milton Keynes", "Yuliana Prokipchak", "Facebook Ads", "Direct", "2026-08-13T13:33:06Z", "Withdrew — moving back to Ukraine"],
  ["Imran Chowdhury", "+880 1956-338702", "imran.chowdhury@gmail.com", "De Montfort University", "MSc Cyber Security", "Leicester", "Jan 2027", "Unconditional offer", "Deposit paid", "Dhaka HQ", "Md. Shariful Islam", "WhatsApp", "Direct", "2026-08-12T10:47:15Z"],
  ["Amina Yusuf", "+44 7465 718820", "amina.yusuf@gmail.com", "Regent College London", "BSc (Hons) Health and Social Care with Foundation Year", "Newcastle", "Sep 2026", "App submitted", "SFE applied", "London", "Alif Tasnim", "Health & Care Campaign", "Direct", "2026-08-12T15:20:51Z", "Health, Newcastle — prefers evening classes"],
  ["Joseph Adeyemi", "+44 7710 443659", "joseph.adeyemi@yahoo.com", "Oxford Business College", "BA (Hons) Business and Management", "Nottingham", "Sep 2026", "Conditional offer", "SFE applied", "Manchester", "Nusrat Choudhury", "Personal Referral", "Affiliate", "2026-08-11T12:05:29Z", "", "Ambassador: Kemi Ade"],
  ["Mahmudul Hasan", "+880 1720-915388", "mahmudul.hasan@gmail.com", "University of Hertfordshire", "MSc Artificial Intelligence and Robotics", "Hatfield", "Jan 2027", "CAS issued", "Deposit paid", "Dhaka HQ", "Alif Tasnim", "BD to UK Student Fair", "Direct", "2026-08-10T08:12:47Z", "CAS received — visa appointment 2 Oct"],
  ["Laura Popescu", "+44 7823 106754", "laura.popescu@gmail.com", "University of the West of Scotland (London)", "CertHE Business", "London", "Sep 2026", "Enrolled", "SFE approved", "London", "N. Bintay Zaman", "Boost Website", "Direct", "2026-08-09T14:48:03Z"],
  ["Rashed Karim", "+880 1611-280456", "rashed.karim@gmail.com", "National College of Ireland", "MSc Fintech", "Dublin", "Jan 2027", "App submitted", "Self-funded", "Sylhet", "Sadia Afrin", "Agent Partner", "Agent", "2026-08-08T11:36:19Z", "", "Beacon Overseas Studies"],
  ["Hannah Osei", "+44 7446 915302", "hannah.osei@gmail.com", "Anglia Ruskin University London", "BSc (Hons) Accounting and Finance", "London", "Oct 2026", "Unconditional offer", "SFE applied", "London", "Bickey Shah", "Walk-in", "Direct", "2026-08-07T16:02:44Z"],
  ["Tahmid Rahman", "+880 1733-509184", "tahmid.rahman@gmail.com", "Ulster University (Birmingham)", "MSc International Business", "Birmingham", "Jan 2027", "Unconditional offer", "Scholarship", "Sylhet", "Harunor Rashid", "BD to UK Student Fair", "Direct", "2026-08-06T09:15:33Z", "30% international scholarship awarded"],
  ["Ahmed Farah", "+44 7939 422617", "ahmed.farah@hotmail.com", "UK Management College", "BA (Hons) Digital Marketing", "London", "Sep 2026", "Rejected", "N/A", "London", "Farhan Kabir", "TikTok Ads", "Direct", "2026-08-05T13:24:58Z", "Did not meet English requirement"],
  ["Farhana Akter", "+880 1845-603317", "farhana.akter@gmail.com", "Coventry University", "MSc Global Healthcare Management", "London", "Jan 2027", "Visa filed", "Deposit paid", "Dhaka HQ", "Ummay Saiha Limu", "Agent Partner", "Agent", "2026-08-04T10:10:10Z", "Biometrics done 10 Sep", "Crown British Education"],
];

// Deadlines and blockers feed the dashboard's operations overview.
const extras: Record<string, Pick<ApplicationRow, "deadlines" | "blockers">> = {
  "Farzana Islam": {
    deadlines: [{ type: "Visa", dueDate: "2026-09-20" }],
    blockers: [{ category: "Documents", reason: "Updated bank statement required", since: "2026-09-11" }],
  },
  "Kamrul Hasan": {
    deadlines: [{ type: "Application", dueDate: "2026-10-05" }],
    blockers: [{ category: "University response", reason: "Awaiting admissions decision", since: "2026-09-10" }],
  },
  "Nusrat Jahan": {
    deadlines: [{ type: "Deposit", dueDate: "2026-09-15" }, { type: "CAS", dueDate: "2026-09-24" }],
    blockers: [{ category: "Payment", reason: "Tuition deposit outstanding", since: "2026-09-09" }],
  },
  "Rakibul Hasan": {
    deadlines: [{ type: "Application", dueDate: "2026-09-17" }],
    blockers: [{ category: "Documents", reason: "Passport copy and transcript missing", since: "2026-09-08" }],
  },
  "Priyanka Das": { deadlines: [{ type: "Application", dueDate: "2026-09-28" }] },
  "Mahmudul Hasan": { deadlines: [{ type: "Visa", dueDate: "2026-10-02" }] },
};

type OptionSeed = [university: string, course: string, campus: string, intake: string, stage?: ApplicationStage];
const courseOptionSeeds: Record<string, OptionSeed[]> = {
  "Anhar Hamid Rahman": [["London School of Commerce", "BSc (Hons) Business and Tourism", "Manchester", "Oct 2026"]],
  "Kevin Ramos Dacosta": [
    ["UK Management College", "BA (Hons) Business Management", "Manchester", "Sep 2026", "App submitted"],
    ["Oxford Business College", "BA (Hons) Business and Management", "Manchester", "Oct 2026"],
  ],
  "Priyanka Das": [["University of Hertfordshire", "MSc Data Science", "Hatfield", "Jan 2027", "App submitted"]],
  "Kamrul Hasan": [["University of Greenwich", "BSc (Hons) Computer Science", "London", "Jan 2027"]],
  "Sadia Rahman": [["Anglia Ruskin University London", "MSc Project Management", "London", "Jan 2027"]],
};

function makeOption(seed: OptionSeed, key: string): CourseOption {
  const [university, course, campus, intake, stage = "New"] = seed;
  return {
    id: key,
    country: findUniversity(university)?.country ?? "United Kingdom",
    university,
    course,
    level: levelFor(course),
    mode: "Full time",
    campus,
    intake,
    stage,
    funding: "N/A",
  };
}

const activity: Record<string, Pick<ApplicationRow, "followUps" | "meetings" | "documentRequests">> = {
  "Farzana Islam": {
    followUps: [],
    meetings: [],
    documentRequests: [
      {
        id: "DOC-seed-1",
        title: "Bank statement",
        description: "Updated statement covering the last 28 days, requested by UKVI.",
        count: 1,
        dueDate: "2026-09-19",
        channels: ["Email", "WhatsApp"],
        requestedAt: "2026-09-11T10:00:00Z",
        by: "Harunor Rashid",
        status: "Requested",
      },
    ],
  },
  "Nusrat Jahan": {
    followUps: [],
    meetings: [
      { id: "MT-seed-1", at: "2026-09-19T14:00:00Z", counsellor: "Nusrat Choudhury", format: "Video call", durationMins: 30, notes: "CAS interview preparation" },
    ],
    documentRequests: [],
  },
  "Priyanka Das": {
    followUps: [{ id: "FU-seed-1", at: "2026-09-18T10:00:00Z", channel: "WhatsApp", notes: "Confirm IELTS test date", by: "Ummay Saiha Limu", done: false }],
    meetings: [],
    documentRequests: [],
  },
};

const enrolledIds = new Set(["Tanvir Ahmed", "Daniel Mensah", "Laura Popescu"]);

const studentIdFor = (university: string, n: number) =>
  `${university.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase()}${2600000 + n * 137}`;

/** Bulk sample records, numbered per year in creation order. */
function generatedRows(): ApplicationRow[] {
  const rows = generateApplications(1050).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const perYear: Record<string, number> = {};
  return rows.map((g) => {
    const year = g.createdAt.slice(0, 4);
    perYear[year] = (perYear[year] ?? 1000) + 1;
    const n = perYear[year];
    return {
      id: `APP-${year}-${n}`,
      applicant: g.applicant,
      initials: initialsFor(g.applicant),
      phone: g.phone,
      email: g.email,
      studentId: g.stage === "Enrolled" ? studentIdFor(g.university, n + (year === "2025" ? 5000 : 0)) : "",
      course: g.course,
      university: g.university,
      campus: g.campus,
      intake: g.intake,
      stage: g.stage,
      funding: g.funding,
      branch: g.branch,
      counsellor: g.counsellor,
      source: g.source,
      channel: g.channel,
      partner: g.partner || undefined,
      notes: g.note ? [{ text: g.note, author: g.counsellor, at: g.createdAt }] : [],
      country: findUniversity(g.university)?.country ?? "United Kingdom",
      level: levelFor(g.course),
      mode: g.mode,
      courseOptions: g.courseOptions.map((o, k) => ({ ...o, id: `${year}-${n}-${k}` })),
      followUps: [],
      meetings: [],
      documentRequests: [],
      createdAt: g.createdAt,
      updatedAt: g.createdAt.slice(0, 10),
      deadlines: g.deadlines,
      blockers: g.blockers,
    };
  });
}

let cache: ApplicationRow[] | null = null;

export function getApplications(): ApplicationRow[] {
  cache ??= [...handcrafted(), ...generatedRows()];
  return [...cache];
}

export function getApplication(id: string): ApplicationRow | undefined {
  cache ??= [...handcrafted(), ...generatedRows()];
  return cache.find((a) => a.id === id);
}

/** Keeps in-session edits so the list and the details page stay in step (no backend yet). */
export function saveApplications(rows: ApplicationRow[]) {
  cache = rows;
}

export function saveApplication(row: ApplicationRow) {
  cache = (cache ?? getApplications()).map((a) => (a.id === row.id ? row : a));
}

function handcrafted(): ApplicationRow[] {
  return raw.map((r, i) => {
    const [applicant, phone, email, university, course, campus, intake, stage, funding, branch, counsellor, source, channel, createdAt, note, partner] = r;
    const n = raw.length - i;
    return {
      id: `APP-2026-${String(480 + n).padStart(4, "0")}`,
      applicant,
      initials: initialsFor(applicant),
      phone,
      email,
      studentId: enrolledIds.has(applicant) ? studentIdFor(university, n) : "",
      course,
      university,
      campus,
      intake,
      stage,
      funding,
      branch,
      counsellor,
      source,
      channel,
      partner: partner || undefined,
      notes: note ? [{ text: note, author: counsellor, at: createdAt }] : [],
      country: findUniversity(university)?.country ?? "United Kingdom",
      level: levelFor(course),
      mode: "Full time",
      courseOptions: (courseOptionSeeds[applicant] ?? []).map((seed, k) => makeOption(seed, `${n}-${k}`)),
      followUps: activity[applicant]?.followUps ?? [],
      meetings: activity[applicant]?.meetings ?? [],
      documentRequests: activity[applicant]?.documentRequests ?? [],
      createdAt,
      updatedAt: createdAt.slice(0, 10),
      ...extras[applicant],
    };
  });
}

export const applicationStageStyles: Record<ApplicationStage, { dot: string; text: string; bg: string }> = {
  New: { dot: "bg-slate-400", text: "text-slate-600 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-500/10" },
  "App submitted": { dot: "bg-primary", text: "text-primary", bg: "bg-primary-soft" },
  "Conditional offer": { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
  "Unconditional offer": { dot: "bg-violet-500", text: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
  "CAS issued": { dot: "bg-teal-500", text: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/10" },
  "Visa filed": { dot: "bg-sky-500", text: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10" },
  Enrolled: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  Rejected: { dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10" },
  Withdrawn: { dot: "bg-zinc-400", text: "text-zinc-500 dark:text-zinc-400", bg: "bg-zinc-100 dark:bg-zinc-500/10" },
};

export const fundingStyles: Record<FundingStatus, string> = {
  "N/A": "bg-surface-hover text-muted-foreground",
  "SFE applied": "bg-warning-soft text-warning",
  "SFE approved": "bg-success-soft text-success",
  "Self-funded": "bg-primary-soft text-primary",
  "Deposit paid": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  Scholarship: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};
