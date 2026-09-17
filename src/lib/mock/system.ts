export interface ArchivedRecord {
  id: string;
  originalId: string;
  entityType: "Lead" | "Application" | "Partner Agreement" | "Student Record";
  subjectName: string;
  associatedEntity: string;
  intakePeriod: string;
  archivedDate: string;
  archivedBy: string;
  reason: "Course Graduated" | "Intake Concluded" | "Student Withdrawn" | "Lead Inactive > 12M" | "Visa Refused & Closed";
  retentionUntil: string;
}

export const mockArchivedRecords: ArchivedRecord[] = [
  {
    id: "ARC-1001",
    originalId: "BHE-800192341",
    entityType: "Student Record",
    subjectName: "Tanvir Hasan Chowdhury",
    associatedEntity: "Coventry University (MSc Data Science)",
    intakePeriod: "September 2024",
    archivedDate: "2025-10-15",
    archivedBy: "System (Graduation Batch)",
    reason: "Course Graduated",
    retentionUntil: "2030-10-15",
  },
  {
    id: "ARC-1002",
    originalId: "BHE-800192892",
    entityType: "Application",
    subjectName: "Shabnam Mustari",
    associatedEntity: "University of Hertfordshire (MBA)",
    intakePeriod: "January 2025",
    archivedDate: "2025-03-30",
    archivedBy: "David Miller",
    reason: "Intake Concluded",
    retentionUntil: "2031-03-30",
  },
  {
    id: "ARC-1003",
    originalId: "LEAD-77491",
    entityType: "Lead",
    subjectName: "Arifur Rahman Joy",
    associatedEntity: "Unassigned Inquiry (Canada General)",
    intakePeriod: "Fall 2024",
    archivedDate: "2025-09-01",
    archivedBy: "System (Dormancy Sweep)",
    reason: "Lead Inactive > 12M",
    retentionUntil: "2027-09-01",
  },
  {
    id: "ARC-1004",
    originalId: "BHE-800201445",
    entityType: "Application",
    subjectName: "Samiul Alam",
    associatedEntity: "University of Greenwich (BSc Computing)",
    intakePeriod: "September 2025",
    archivedDate: "2025-11-12",
    archivedBy: "Ummay Saiha Limu",
    reason: "Student Withdrawn",
    retentionUntil: "2030-11-12",
  },
  {
    id: "ARC-1005",
    originalId: "BHE-800210982",
    entityType: "Application",
    subjectName: "Naznin Akter",
    associatedEntity: "BPP University (LLM)",
    intakePeriod: "January 2025",
    archivedDate: "2025-02-18",
    archivedBy: "Compliance Audit",
    reason: "Visa Refused & Closed",
    retentionUntil: "2032-02-18",
  },
  {
    id: "ARC-1006",
    originalId: "LEAD-79920",
    entityType: "Lead",
    subjectName: "Zubair Al Mahmud",
    associatedEntity: "Sylhet Zindabazar Branch Inquiry",
    intakePeriod: "September 2024",
    archivedDate: "2025-10-01",
    archivedBy: "System (Dormancy Sweep)",
    reason: "Lead Inactive > 12M",
    retentionUntil: "2027-10-01",
  },
];

export interface OrganizationSettings {
  orgName: string;
  portalUrl: string;
  supportEmail: string;
  defaultCurrency: string;
  primaryDestination: string;
  timezone: string;
  academicYear: string;
  autoAssignLeads: boolean;
  assignmentAlgorithm: "Round-Robin by Branch" | "Language & Country Matching" | "Equal Workload Capacity";
  dormancyThresholdDays: number;
  whatsAppWebhookUrl: string;
  whatsAppAutoGreeting: boolean;
  defaultGreetingText: string;
  twoFactorEnforced: boolean;
  sessionTimeoutMinutes: number;
}

export const defaultSettings: OrganizationSettings = {
  orgName: "BHE Student Consultancy Ltd",
  portalUrl: "https://portal.bhe-consultancy.co.uk",
  supportEmail: "compliance@bhe-consultancy.co.uk",
  defaultCurrency: "GBP (£)",
  primaryDestination: "United Kingdom",
  timezone: "Europe/London (GMT+1 / BST)",
  academicYear: "2026/2027 Academic Cycle",
  autoAssignLeads: true,
  assignmentAlgorithm: "Round-Robin by Branch",
  dormancyThresholdDays: 14,
  whatsAppWebhookUrl: "https://api.bhe-consultancy.co.uk/v1/webhooks/whatsapp",
  whatsAppAutoGreeting: true,
  defaultGreetingText: "Hello! Welcome to BHE Student Consultancy. A senior education counselor has been assigned to your profile and will connect shortly.",
  twoFactorEnforced: true,
  sessionTimeoutMinutes: 60,
};

