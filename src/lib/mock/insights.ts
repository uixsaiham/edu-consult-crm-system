export interface TargetRecord {
  id: string;
  intakeName: string;
  year: number;
  entityType: "Branch" | "Counselor" | "Destination Country";
  entityName: string;
  targetCount: number;
  achievedCount: number;
  inPipeline: number;
  startDate: string;
  censusDate: string;
  status: "Exceeded" | "On Track" | "Needs Attention" | "Critical Risk";
}

export interface FinanceTransaction {
  id: string;
  ref: string;
  studentId: string;
  studentName: string;
  institution: string;
  country: string;
  tuitionFee: number;
  depositAmount: number;
  commissionRate: number;
  commissionAmount: number;
  subAgentPayout: number;
  netRevenue: number;
  currency: string;
  status: "Paid" | "Invoice Approved" | "Pending University Approval" | "Under Review";
  invoiceDate: string;
  paidDate?: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  category: "UKVI Visa & Compliance" | "Admissions & Credibility" | "Sales & Lead Conversion" | "Institution Portals";
  level: "Mandatory Core" | "Advanced Specialist" | "Annual Refresher";
  durationHours: number;
  lessonCount: number;
  certifiedCount: number;
  totalCounselors: number;
  avgScore: number;
  instructor: string;
  lastUpdated: string;
  badge: string;
}

export const mockTargets: TargetRecord[] = [
  {
    id: "TGT-SEP26-01",
    intakeName: "September 2026",
    year: 2026,
    entityType: "Branch",
    entityName: "Dhaka Dhanmondi Flagship",
    targetCount: 450,
    achievedCount: 382,
    inPipeline: 145,
    startDate: "2026-03-01",
    censusDate: "2026-10-15",
    status: "On Track",
  },
  {
    id: "TGT-SEP26-02",
    intakeName: "September 2026",
    year: 2026,
    entityType: "Branch",
    entityName: "Sylhet Zindabazar Hub",
    targetCount: 380,
    achievedCount: 310,
    inPipeline: 98,
    startDate: "2026-03-01",
    censusDate: "2026-10-15",
    status: "On Track",
  },
  {
    id: "TGT-SEP26-03",
    intakeName: "September 2026",
    year: 2026,
    entityType: "Branch",
    entityName: "Dhaka Banani Executive Branch",
    targetCount: 300,
    achievedCount: 245,
    inPipeline: 75,
    startDate: "2026-03-01",
    censusDate: "2026-10-15",
    status: "On Track",
  },
  {
    id: "TGT-SEP26-04",
    intakeName: "September 2026",
    year: 2026,
    entityType: "Branch",
    entityName: "London Headquarters",
    targetCount: 250,
    achievedCount: 185,
    inPipeline: 82,
    startDate: "2026-03-01",
    censusDate: "2026-10-15",
    status: "Needs Attention",
  },
  {
    id: "TGT-SEP26-05",
    intakeName: "September 2026",
    year: 2026,
    entityType: "Branch",
    entityName: "Chittagong GEC Circle",
    targetCount: 180,
    achievedCount: 135,
    inPipeline: 64,
    startDate: "2026-03-01",
    censusDate: "2026-10-15",
    status: "On Track",
  },
  {
    id: "TGT-SEP26-06",
    intakeName: "September 2026",
    year: 2026,
    entityType: "Counselor",
    entityName: "Ummay Saiha Limu",
    targetCount: 45,
    achievedCount: 42,
    inPipeline: 18,
    startDate: "2026-03-01",
    censusDate: "2026-10-15",
    status: "Exceeded",
  },
  {
    id: "TGT-SEP26-07",
    intakeName: "September 2026",
    year: 2026,
    entityType: "Counselor",
    entityName: "Md. Shariful Islam",
    targetCount: 40,
    achievedCount: 38,
    inPipeline: 14,
    startDate: "2026-03-01",
    censusDate: "2026-10-15",
    status: "On Track",
  },
  {
    id: "TGT-SEP26-08",
    intakeName: "September 2026",
    year: 2026,
    entityType: "Destination Country",
    entityName: "United Kingdom",
    targetCount: 1200,
    achievedCount: 1045,
    inPipeline: 340,
    startDate: "2026-03-01",
    censusDate: "2026-10-15",
    status: "On Track",
  },
  {
    id: "TGT-SEP26-09",
    intakeName: "September 2026",
    year: 2026,
    entityType: "Destination Country",
    entityName: "Canada",
    targetCount: 220,
    achievedCount: 154,
    inPipeline: 70,
    startDate: "2026-03-01",
    censusDate: "2026-10-15",
    status: "Needs Attention",
  },
];

export const mockFinanceTransactions: FinanceTransaction[] = [
  {
    id: "FTX-801",
    ref: "INV-2026-0941",
    studentId: "BHE-900239258",
    studentName: "Mahir Faysal",
    institution: "University of Hertfordshire",
    country: "United Kingdom",
    tuitionFee: 16500,
    depositAmount: 5000,
    commissionRate: 15,
    commissionAmount: 2475,
    subAgentPayout: 1237,
    netRevenue: 1238,
    currency: "GBP",
    status: "Paid",
    invoiceDate: "2026-08-12",
    paidDate: "2026-09-02",
  },
  {
    id: "FTX-802",
    ref: "INV-2026-0942",
    studentId: "BHE-900239266",
    studentName: "Tanzina Akter",
    institution: "Coventry University",
    country: "United Kingdom",
    tuitionFee: 17800,
    depositAmount: 8000,
    commissionRate: 16,
    commissionAmount: 2848,
    subAgentPayout: 0,
    netRevenue: 2848,
    currency: "GBP",
    status: "Paid",
    invoiceDate: "2026-08-15",
    paidDate: "2026-09-04",
  },
  {
    id: "FTX-803",
    ref: "INV-2026-0943",
    studentId: "BHE-900239280",
    studentName: "Rifat Hasan",
    institution: "University of Greenwich",
    country: "United Kingdom",
    tuitionFee: 15500,
    depositAmount: 4000,
    commissionRate: 15,
    commissionAmount: 2325,
    subAgentPayout: 1162,
    netRevenue: 1163,
    currency: "GBP",
    status: "Invoice Approved",
    invoiceDate: "2026-08-28",
  },
  {
    id: "FTX-804",
    ref: "INV-2026-0944",
    studentId: "BHE-900242445",
    studentName: "Shahriar Kabir",
    institution: "Ulster University",
    country: "United Kingdom",
    tuitionFee: 14500,
    depositAmount: 3000,
    commissionRate: 14,
    commissionAmount: 2030,
    subAgentPayout: 0,
    netRevenue: 2030,
    currency: "GBP",
    status: "Invoice Approved",
    invoiceDate: "2026-09-01",
  },
  {
    id: "FTX-805",
    ref: "INV-2026-0945",
    studentId: "BHE-900242435",
    studentName: "Farzana Chowdhury",
    institution: "BPP University",
    country: "United Kingdom",
    tuitionFee: 13900,
    depositAmount: 6950,
    commissionRate: 17.5,
    commissionAmount: 2432,
    subAgentPayout: 1216,
    netRevenue: 1216,
    currency: "GBP",
    status: "Pending University Approval",
    invoiceDate: "2026-09-06",
  },
  {
    id: "FTX-806",
    ref: "INV-2026-0946",
    studentId: "BHE-900242426",
    studentName: "Anik Barua",
    institution: "National College of Ireland",
    country: "Ireland",
    tuitionFee: 15000,
    depositAmount: 7500,
    commissionRate: 15,
    commissionAmount: 2250,
    subAgentPayout: 0,
    netRevenue: 2250,
    currency: "EUR",
    status: "Paid",
    invoiceDate: "2026-08-20",
    paidDate: "2026-09-10",
  },
  {
    id: "FTX-807",
    ref: "INV-2026-0947",
    studentId: "BHE-900229845",
    studentName: "Afsana Mimi",
    institution: "Deakin University",
    country: "Australia",
    tuitionFee: 33500,
    depositAmount: 12000,
    commissionRate: 12.5,
    commissionAmount: 4187,
    subAgentPayout: 2093,
    netRevenue: 2094,
    currency: "AUD",
    status: "Under Review",
    invoiceDate: "2026-09-08",
  },
];

export const mockTrainingCourses: TrainingCourse[] = [
  {
    id: "TRN-01",
    title: "UKVI Student Route Visa Compliance (2026 Edition)",
    category: "UKVI Visa & Compliance",
    level: "Mandatory Core",
    durationHours: 6.5,
    lessonCount: 12,
    certifiedCount: 46,
    totalCounselors: 48,
    avgScore: 94.2,
    instructor: "David Miller (Compliance Lead)",
    lastUpdated: "Aug 2026",
    badge: "UKVI Certified",
  },
  {
    id: "TRN-02",
    title: "Credibility Interview Preparation Masterclass",
    category: "Admissions & Credibility",
    level: "Mandatory Core",
    durationHours: 4.0,
    lessonCount: 8,
    certifiedCount: 44,
    totalCounselors: 48,
    avgScore: 91.5,
    instructor: "Youna (London MD)",
    lastUpdated: "Jul 2026",
    badge: "Interview Coach",
  },
  {
    id: "TRN-03",
    title: "CAS Issuance & Financial Document Vetting Protocols",
    category: "UKVI Visa & Compliance",
    level: "Mandatory Core",
    durationHours: 5.0,
    lessonCount: 10,
    certifiedCount: 42,
    totalCounselors: 48,
    avgScore: 93.8,
    instructor: "David Miller",
    lastUpdated: "Sep 2026",
    badge: "CAS Specialist",
  },
  {
    id: "TRN-04",
    title: "High-Conversion Student Consultation & Closing Techniques",
    category: "Sales & Lead Conversion",
    level: "Advanced Specialist",
    durationHours: 3.5,
    lessonCount: 7,
    certifiedCount: 38,
    totalCounselors: 48,
    avgScore: 89.6,
    instructor: "Ummay Saiha Limu",
    lastUpdated: "Jun 2026",
    badge: "Master Counselor",
  },
  {
    id: "TRN-05",
    title: "University Direct Portals & Fast-Track Application Submissions",
    category: "Institution Portals",
    level: "Annual Refresher",
    durationHours: 3.0,
    lessonCount: 6,
    certifiedCount: 45,
    totalCounselors: 48,
    avgScore: 96.0,
    instructor: "Md. Shariful Islam",
    lastUpdated: "Aug 2026",
    badge: "Portal Pro",
  },
  {
    id: "TRN-06",
    title: "Australia Genuine Student (GS) Requirement Protocols",
    category: "UKVI Visa & Compliance",
    level: "Advanced Specialist",
    durationHours: 4.5,
    lessonCount: 9,
    certifiedCount: 32,
    totalCounselors: 48,
    avgScore: 88.4,
    instructor: "Tanvir Ahmed",
    lastUpdated: "Jul 2026",
    badge: "GS Assessor",
  },
];

