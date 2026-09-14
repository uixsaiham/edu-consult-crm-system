// Mock dashboard data, shaped like a future API response.
// Swap the functions below for real `fetch` calls once the backend
// endpoints are available — the shapes are the intended contract.

export type Trend = "up" | "down" | "flat";

export interface StatCardSplit {
  leftLabel: string;
  rightLabel: string;
  leftPercent: number;
}

export interface StatCardData {
  id: string;
  label: string;
  value: string;
  deltaLabel: string;
  trend: Trend;
  split?: StatCardSplit;
  spark: number[];
}

export interface FunnelStage {
  stage: string;
  count: number;
}

export interface ApplicationTrendPoint {
  month: string;
  direct: number;
  agent: number;
}

export interface IntakePeriod {
  id: string;
  label: string;
  month: string;
  applications: number;
  tag: "previous" | "current" | "upcoming" | "following";
}

export interface IntakeStageBreakdown {
  intake: string;
  submitted: number;
  offer: number;
  visaFiled: number;
  enrolled: number;
}

export interface OfficePerformance {
  office: string;
  country: string;
  applications: number;
  enrolled: number;
}

export interface PersonPerformance {
  name: string;
  applications: number;
  offers: number;
  enrolled: number;
  rejected: number;
  conversion: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  actor: string;
  time: string;
}

export interface LeadSource {
  source: string;
  value: number;
}

export function getStatCards(): StatCardData[] {
  return [
    {
      id: "leads",
      label: "Number of Leads",
      value: "137.0K",
      deltaLabel: "17.5% less",
      trend: "down",
      spark: [31, 24, 27, 19, 22, 14, 18, 12],
    },
    {
      id: "direct-applications",
      label: "Direct Applications",
      value: "7.6K",
      deltaLabel: "16.8% less",
      trend: "down",
      split: { leftLabel: "Added", rightLabel: "From Leads", leftPercent: 56 },
      spark: [17, 14, 15, 10, 13, 11, 9, 8],
    },
    {
      id: "agent-applications",
      label: "Agent Applications",
      value: "3.0K",
      deltaLabel: "49.1% less",
      trend: "down",
      spark: [14, 17, 13, 15, 10, 12, 9, 8],
    },
    {
      id: "cas-received",
      label: "Cas Received",
      value: "3",
      deltaLabel: "+0%",
      trend: "flat",
      split: { leftLabel: "From BHE Apps", rightLabel: "From B2B Apps", leftPercent: 33 },
      spark: [2, 4, 1, 3, 5, 2, 4, 3],
    },
  ];
}

export function getLeadFunnel(): FunnelStage[] {
  return [
    { stage: "New Lead", count: 18400 },
    { stage: "Contacted", count: 12850 },
    { stage: "Qualified", count: 8120 },
    { stage: "Application Started", count: 5230 },
    { stage: "Submitted", count: 3286 },
    { stage: "Offer Received", count: 1042 },
    { stage: "Visa Filed", count: 712 },
    { stage: "Enrolled", count: 486 },
  ];
}

export function getApplicationTrend(): ApplicationTrendPoint[] {
  return [
    { month: "Apr", direct: 210, agent: 140 },
    { month: "May", direct: 248, agent: 165 },
    { month: "Jun", direct: 232, agent: 190 },
    { month: "Jul", direct: 268, agent: 205 },
    { month: "Aug", direct: 301, agent: 228 },
    { month: "Sep", direct: 356, agent: 264 },
  ];
}

export function getIntakePeriods(): IntakePeriod[] {
  return [
    { id: "aug26", label: "Previous", month: "August 2026", applications: 214, tag: "previous" },
    { id: "sep26", label: "Current", month: "September 2026", applications: 1156, tag: "current" },
    { id: "oct26", label: "Upcoming", month: "October 2026", applications: 393, tag: "upcoming" },
    { id: "nov26", label: "Following", month: "November 2026", applications: 158, tag: "following" },
  ];
}

export function getIntakeBreakdown(): IntakeStageBreakdown[] {
  return [
    { intake: "Aug 2026", submitted: 60, offer: 34, visaFiled: 18, enrolled: 12 },
    { intake: "Sep 2026", submitted: 420, offer: 260, visaFiled: 190, enrolled: 140 },
    { intake: "Oct 2026", submitted: 180, offer: 88, visaFiled: 40, enrolled: 15 },
    { intake: "Nov 2026", submitted: 70, offer: 22, visaFiled: 8, enrolled: 3 },
  ];
}

export function getOfficePerformance(): OfficePerformance[] {
  return [
    { office: "Dhaka", country: "Bangladesh", applications: 2840, enrolled: 312 },
    { office: "London", country: "UK", applications: 1450, enrolled: 176 },
    { office: "Manchester", country: "UK", applications: 940, enrolled: 118 },
    { office: "Milton Keynes", country: "UK", applications: 610, enrolled: 74 },
    { office: "Sylhet", country: "Bangladesh", applications: 320, enrolled: 34 },
  ];
}

export function getCounsellorPerformance(): PersonPerformance[] {
  const rows: Omit<PersonPerformance, "conversion">[] = [
    { name: "Alif Tasnim", applications: 783, offers: 312, enrolled: 262, rejected: 39 },
    { name: "Harunor Rashid", applications: 467, offers: 210, enrolled: 180, rejected: 14 },
    { name: "Bickey Shah", applications: 464, offers: 198, enrolled: 170, rejected: 20 },
    { name: "Nusrat Choudhury", applications: 505, offers: 176, enrolled: 153, rejected: 7 },
    { name: "Yuliana Prokipchak", applications: 426, offers: 160, enrolled: 137, rejected: 4 },
  ];
  return rows.map((r) => ({ ...r, conversion: Math.round((r.enrolled / r.applications) * 100) }));
}

export function getAgentPerformance(): PersonPerformance[] {
  const rows: Omit<PersonPerformance, "conversion">[] = [
    { name: "Gunjon Education", applications: 655, offers: 280, enrolled: 249, rejected: 109 },
    { name: "Tarek Associates", applications: 480, offers: 150, enrolled: 122, rejected: 35 },
    { name: "BHE Uni Others", applications: 104, offers: 62, enrolled: 56, rejected: 1 },
    { name: "Kafleas Ltd", applications: 142, offers: 60, enrolled: 53, rejected: 19 },
    { name: "Albatross Education", applications: 45, offers: 30, enrolled: 27, rejected: 7 },
  ];
  return rows.map((r) => ({ ...r, conversion: Math.round((r.enrolled / r.applications) * 100) }));
}

export function getRecentActivity(): ActivityItem[] {
  return [
    { id: "1", title: "Status changed", description: "BHE-900247862 moved New → Not Interested", actor: "Rowshon Ara Hossain", time: "3m ago" },
    { id: "2", title: "Follow-up completed", description: "Call follow-up logged on BHE-900247609", actor: "Ummay Saiha Limu", time: "18m ago" },
    { id: "3", title: "Note added", description: "Document checklist updated on BHE-900244740", actor: "Md Sahed", time: "42m ago" },
    { id: "4", title: "Status changed", description: "BHE-900244740 moved No Response → Future Intake", actor: "Md Sahed", time: "1h ago" },
    { id: "5", title: "Note added", description: "IELTS score recorded on BHE-900247827", actor: "Ummay Saiha Limu", time: "2h ago" },
    { id: "6", title: "Status changed", description: "BHE-900247837 moved New → Not Interested", actor: "Tahsin Chowdhury", time: "3h ago" },
    { id: "7", title: "Follow-up completed", description: "Email follow-up logged on BHE-900246499", actor: "Tahsin Chowdhury", time: "5h ago" },
  ];
}

export function getTopLeadSources(): LeadSource[] {
  return [
    { source: "TikTok Ads", value: 98 },
    { source: "All Leads Import", value: 91 },
    { source: "Facebook Ads", value: 74 },
    { source: "CRM (Manual)", value: 61 },
    { source: "Consultation Form", value: 45 },
    { source: "Landing Page Form", value: 32 },
    { source: "WhatsApp", value: 21 },
    { source: "Others", value: 14 },
    { source: "Referral", value: 9 },
  ];
}
