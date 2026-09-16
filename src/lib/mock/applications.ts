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

export interface ApplicationRow {
  id: string;
  applicant: string;
  initials: string;
  course: string;
  university: string;
  branch: string;
  counsellor: string;
  intake: string;
  stage: "New" | "Submitted" | "Offer Received" | "Visa Filed" | "Enrolled" | "Rejected";
  updatedAt: string;
}

export function getApplications(): ApplicationRow[] {
  return [
    {
      id: "APP-2026-0481",
      applicant: "Tanvir Ahmed",
      initials: "TA",
      course: "BSc Computer Science",
      university: "Coventry University",
      branch: "Dhaka HQ",
      counsellor: "Alif Tasnim",
      intake: "September 2026",
      stage: "Enrolled",
      updatedAt: "2026-09-12",
    },
    {
      id: "APP-2026-0482",
      applicant: "Farzana Islam",
      initials: "FI",
      course: "MSc Data Analytics",
      university: "University of Greenwich",
      branch: "Sylhet",
      counsellor: "Harunor Rashid",
      intake: "January 2027",
      stage: "Visa Filed",
      updatedAt: "2026-09-11",
    },
    {
      id: "APP-2026-0483",
      applicant: "Kamrul Hasan",
      initials: "KH",
      course: "BA Arabic",
      university: "Cleveland State University",
      branch: "London",
      counsellor: "Bickey Shah",
      intake: "July 2027",
      stage: "Submitted",
      updatedAt: "2026-09-10",
    },
    {
      id: "APP-2026-0484",
      applicant: "Nusrat Jahan",
      initials: "NJ",
      course: "MBA",
      university: "Anglia Ruskin University",
      branch: "Manchester",
      counsellor: "Nusrat Choudhury",
      intake: "September 2026",
      stage: "Offer Received",
      updatedAt: "2026-09-09",
    },
    {
      id: "APP-2026-0485",
      applicant: "Rakibul Hasan",
      initials: "RH",
      course: "BSc Civil Engineering",
      university: "Teesside University",
      branch: "Milton Keynes",
      counsellor: "Yuliana Prokipchak",
      intake: "January 2027",
      stage: "New",
      updatedAt: "2026-09-08",
    },
    {
      id: "APP-2026-0486",
      applicant: "Shamima Akter",
      initials: "SA",
      course: "MSc International Business",
      university: "University of Sunderland",
      branch: "Dhaka HQ",
      counsellor: "Alif Tasnim",
      intake: "May 2027",
      stage: "Rejected",
      updatedAt: "2026-09-05",
    },
  ];
}

export const applicationStageStyles: Record<
  ApplicationRow["stage"],
  { dot: string; text: string; bg: string }
> = {
  New: { dot: "bg-slate-400", text: "text-slate-600 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-500/10" },
  Submitted: { dot: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
  "Offer Received": { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
  "Visa Filed": { dot: "bg-sky-500", text: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10" },
  Enrolled: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  Rejected: { dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10" },
};
