// Organisation-wide settings (Settings › Company Settings).

export type TwoFactorPolicy = "Everyone" | "Admins only" | "Off";
export type AssignmentAlgorithm = "Round-robin by branch" | "Language & country match" | "Least busy counsellor";

export interface CompanySettings {
  // Profile
  legalName: string;
  tradingName: string;
  companyNumber: string;
  icoNumber: string;
  website: string;
  portalUrl: string;
  supportEmail: string;
  supportPhone: string;
  registeredAddress: string;
  // Branding
  brandColor: string;
  emailFromName: string;
  emailSignature: string;
  // Regional
  currency: "GBP" | "BDT" | "USD" | "EUR";
  timezone: string;
  dateFormat: "DD/MM/YYYY" | "D MMM YYYY" | "YYYY-MM-DD";
  primaryDestination: string;
  academicCycle: string;
  intakes: string[];
  // Leads & applications
  autoAssignLeads: boolean;
  assignmentAlgorithm: AssignmentAlgorithm;
  firstContactHours: number;
  dormancyDays: number;
  duplicateCheck: "Phone or email" | "Email only" | "Off";
  applicationPrefix: string;
  // Communications
  whatsappGreeting: string;
  smsSenderId: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  // Security
  twoFactor: TwoFactorPolicy;
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  ipAllowlist: string;
  // Privacy
  dpoEmail: string;
  privacyNoticeUrl: string;
  marketingConsentText: string;
}

export const allIntakes = ["January", "March", "May", "September", "October"];
export const timezones = ["Europe/London", "Asia/Dhaka", "Europe/Dublin", "Asia/Dubai", "Africa/Lagos"];

export const defaultCompanySettings: CompanySettings = {
  legalName: "BHE Student Consultancy Ltd",
  tradingName: "BHE Uni",
  companyNumber: "11482937",
  icoNumber: "ZA482716",
  website: "https://bheuni.com",
  portalUrl: "https://portal.bheuni.com",
  supportEmail: "hello@bheuni.com",
  supportPhone: "+44 20 3984 5510",
  registeredAddress: "Suite 3.02, 1 Whitechapel High Street, London E1 7PT",
  brandColor: "#4d76bb",
  emailFromName: "BHE Uni Admissions",
  emailSignature: "Kind regards,\n{sender_name}\n{sender_role}, BHE Uni\n{branch_phone} · bheuni.com",
  currency: "GBP",
  timezone: "Europe/London",
  dateFormat: "D MMM YYYY",
  primaryDestination: "United Kingdom",
  academicCycle: "2026/27",
  intakes: ["January", "May", "September"],
  autoAssignLeads: true,
  assignmentAlgorithm: "Round-robin by branch",
  firstContactHours: 24,
  dormancyDays: 14,
  duplicateCheck: "Phone or email",
  applicationPrefix: "APP",
  whatsappGreeting: "Hello! Thanks for contacting BHE Uni. A counsellor has been assigned to you and will reply shortly.",
  smsSenderId: "BHEUni",
  quietHoursStart: "20:00",
  quietHoursEnd: "09:00",
  twoFactor: "Everyone",
  sessionTimeoutMinutes: 60,
  passwordMinLength: 12,
  ipAllowlist: "",
  dpoEmail: "privacy@bheuni.com",
  privacyNoticeUrl: "https://bheuni.com/privacy",
  marketingConsentText: "Yes, text and email me about courses, intakes and events. I can opt out at any time.",
};

export const companySettingLabels: Partial<Record<keyof CompanySettings, string>> = {
  legalName: "Legal name", tradingName: "Trading name", companyNumber: "Company number", icoNumber: "ICO registration", website: "Website", portalUrl: "Student portal",
  supportEmail: "Support email", supportPhone: "Support phone", registeredAddress: "Registered address", brandColor: "Brand colour", emailFromName: "Email sender name",
  emailSignature: "Email signature", currency: "Currency", timezone: "Time zone", dateFormat: "Date format", primaryDestination: "Primary destination", academicCycle: "Academic cycle",
  intakes: "Intakes offered", autoAssignLeads: "Auto-assign leads", assignmentAlgorithm: "Assignment rule", firstContactHours: "First contact target", dormancyDays: "Dormancy threshold",
  duplicateCheck: "Duplicate check", applicationPrefix: "Application ID prefix", whatsappGreeting: "WhatsApp greeting", smsSenderId: "SMS sender ID", quietHoursStart: "Quiet hours from",
  quietHoursEnd: "Quiet hours until", twoFactor: "Require 2FA", sessionTimeoutMinutes: "Session timeout", passwordMinLength: "Minimum password length", ipAllowlist: "IP allowlist",
  dpoEmail: "Data protection contact", privacyNoticeUrl: "Privacy notice", marketingConsentText: "Marketing consent wording",
};
