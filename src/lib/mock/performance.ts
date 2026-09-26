// Mock performance data, shaped like a future reporting API.
// Every entity carries 24 months of funnel metrics so the UI can
// aggregate any period and compare it with the one before it.

export const performanceSnapshotDate = "2026-09-17";

export interface MonthPoint {
  /** ISO month, e.g. "2026-09". */
  key: string;
  /** Short axis label, e.g. "Sep". */
  label: string;
  leads: number;
  qualified: number;
  applications: number;
  offers: number;
  visas: number;
  enrolled: number;
  /** Commission revenue earned (GBP). */
  revenue: number;
  /** Marketing spend (GBP). */
  spend: number;
}

interface FunnelProfile {
  /** Monthly top-of-funnel volume before seasonality. */
  leads: number;
  qualify: number;
  apply: number;
  offer: number;
  visa: number;
  enrol: number;
  /** Commission per enrolment (GBP). */
  fee: number;
  /** Year-on-year growth, e.g. 0.12 = +12%. */
  growth: number;
  /** Monthly marketing spend (GBP). */
  spend?: number;
  volatility?: number;
}

const MONTH_COUNT = 24;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Demand peaks ahead of the September intake and dips over the holidays.
const SEASONALITY = [0.92, 0.82, 0.86, 0.9, 1.0, 1.14, 1.28, 1.3, 1.08, 0.98, 1.04, 0.78];

const months = Array.from({ length: MONTH_COUNT }, (_, i) => {
  const offset = MONTH_COUNT - 1 - i;
  const d = new Date(Date.UTC(2026, 8 - offset, 1));
  const month = d.getUTCMonth();
  return { key: d.toISOString().slice(0, 7), label: MONTH_LABELS[month], month, yearsAgo: offset / 12 };
});

function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function buildSeries(seed: string, p: FunnelProfile): MonthPoint[] {
  const random = seededRandom(seed);
  const noise = (amount = p.volatility ?? 0.12) => 1 + (random() - 0.5) * 2 * amount;
  const step = (count: number, rate: number) =>
    rate >= 1 ? count : Math.min(count, Math.round(count * Math.min(1, rate * noise(0.08))));

  return months.map((m) => {
    const volume = p.leads * SEASONALITY[m.month] * Math.pow(1 + p.growth, -m.yearsAgo) * noise();
    const leads = Math.max(1, Math.round(volume));
    const qualified = step(leads, p.qualify);
    const applications = step(qualified, p.apply);
    const offers = step(applications, p.offer);
    const visas = step(offers, p.visa);
    const enrolled = step(visas, p.enrol);
    return {
      key: m.key,
      label: m.label,
      leads,
      qualified,
      applications,
      offers,
      visas,
      enrolled,
      revenue: Math.round((enrolled * p.fee * noise(0.06)) / 10) * 10,
      spend: p.spend ? Math.round((p.spend * SEASONALITY[m.month] * noise(0.1)) / 10) * 10 : 0,
    };
  });
}

// --- Branches ----------------------------------------------------------

export interface BranchPerformance {
  id: string;
  name: string;
  city: string;
  country: string;
  manager: string;
  counsellors: number;
  opened: string;
  annualTarget: number;
  avgResponseHours: number;
  followUpRate: number;
  csat: number;
  topDestination: string;
  series: MonthPoint[];
}

export function getBranchPerformance(): BranchPerformance[] {
  const rows: (Omit<BranchPerformance, "series"> & { profile: FunnelProfile })[] = [
    {
      id: "dhaka-hq", name: "Dhaka HQ", city: "Dhanmondi, Dhaka", country: "Bangladesh", manager: "Tanvir Ahmed",
      counsellors: 14, opened: "2016", annualTarget: 820, avgResponseHours: 2.4, followUpRate: 0.91, csat: 4.6,
      topDestination: "United Kingdom",
      profile: { leads: 1150, qualify: 0.46, apply: 0.34, offer: 0.64, visa: 0.58, enrol: 0.9, fee: 1750, growth: 0.18 },
    },
    {
      id: "sylhet", name: "Sylhet", city: "Zindabazar, Sylhet", country: "Bangladesh", manager: "Kazi Rakib",
      counsellors: 6, opened: "2019", annualTarget: 240, avgResponseHours: 3.1, followUpRate: 0.86, csat: 4.5,
      topDestination: "United Kingdom",
      profile: { leads: 420, qualify: 0.42, apply: 0.3, offer: 0.6, visa: 0.55, enrol: 0.88, fee: 1700, growth: 0.26 },
    },
    {
      id: "london", name: "London", city: "Whitechapel, London", country: "United Kingdom", manager: "Youna",
      counsellors: 8, opened: "2014", annualTarget: 640, avgResponseHours: 1.6, followUpRate: 0.94, csat: 4.8,
      topDestination: "United Kingdom",
      profile: { leads: 380, qualify: 0.52, apply: 0.41, offer: 0.7, visa: 0.82, enrol: 0.92, fee: 2100, growth: 0.09 },
    },
    {
      id: "manchester", name: "Manchester", city: "Northern Quarter, Manchester", country: "United Kingdom",
      manager: "David Miller", counsellors: 5, opened: "2020", annualTarget: 330, avgResponseHours: 2.1,
      followUpRate: 0.89, csat: 4.7, topDestination: "United Kingdom",
      profile: { leads: 260, qualify: 0.5, apply: 0.38, offer: 0.68, visa: 0.8, enrol: 0.9, fee: 2000, growth: 0.05 },
    },
    {
      id: "milton-keynes", name: "Milton Keynes", city: "Central Milton Keynes", country: "United Kingdom",
      manager: "Emma Watson", counsellors: 3, opened: "2023", annualTarget: 210, avgResponseHours: 2.9,
      followUpRate: 0.81, csat: 4.4, topDestination: "Ireland",
      profile: { leads: 150, qualify: 0.47, apply: 0.35, offer: 0.66, visa: 0.78, enrol: 0.9, fee: 1950, growth: -0.04 },
    },
  ];
  return rows.map(({ profile, ...row }) => ({ ...row, series: buildSeries(row.id, profile) }));
}

// --- Counsellors -------------------------------------------------------

export interface CounsellorPerformance {
  id: string;
  name: string;
  role: "Senior Counsellor" | "Education Counsellor" | "Admissions Officer";
  branch: string;
  joined: string;
  activeCaseload: number;
  avgResponseHours: number;
  followUpRate: number;
  csat: number;
  monthlyTarget: number;
  focus: string[];
  series: MonthPoint[];
}

export function getCounsellorPerformanceDetail(): CounsellorPerformance[] {
  const rows: (Omit<CounsellorPerformance, "series"> & { profile: FunnelProfile })[] = [
    {
      id: "alif-tasnim", name: "Alif Tasnim", role: "Senior Counsellor", branch: "Dhaka HQ", joined: "Mar 2022",
      activeCaseload: 86, avgResponseHours: 1.8, followUpRate: 0.95, csat: 4.8, monthlyTarget: 10, focus: ["UK", "Canada"],
      profile: { leads: 150, qualify: 0.5, apply: 0.38, offer: 0.66, visa: 0.6, enrol: 0.92, fee: 1750, growth: 0.2 },
    },
    {
      id: "ummay-saiha-limu", name: "Ummay Saiha Limu", role: "Senior Counsellor", branch: "Dhaka HQ", joined: "Jan 2024",
      activeCaseload: 74, avgResponseHours: 2.2, followUpRate: 0.92, csat: 4.7, monthlyTarget: 8, focus: ["UK", "Ireland"],
      profile: { leads: 130, qualify: 0.48, apply: 0.36, offer: 0.64, visa: 0.58, enrol: 0.9, fee: 1750, growth: 0.15 },
    },
    {
      id: "md-shariful-islam", name: "Md. Shariful Islam", role: "Education Counsellor", branch: "Dhaka HQ",
      joined: "Jun 2023", activeCaseload: 69, avgResponseHours: 3.4, followUpRate: 0.84, csat: 4.4, monthlyTarget: 6,
      focus: ["UK", "Australia"],
      profile: { leads: 115, qualify: 0.44, apply: 0.31, offer: 0.6, visa: 0.55, enrol: 0.88, fee: 1750, growth: 0.1 },
    },
    {
      id: "harunor-rashid", name: "Harunor Rashid", role: "Senior Counsellor", branch: "Sylhet", joined: "Aug 2021",
      activeCaseload: 71, avgResponseHours: 2.6, followUpRate: 0.9, csat: 4.6, monthlyTarget: 6, focus: ["UK"],
      profile: { leads: 120, qualify: 0.45, apply: 0.33, offer: 0.62, visa: 0.57, enrol: 0.9, fee: 1700, growth: 0.24 },
    },
    {
      id: "sadia-afrin", name: "Sadia Afrin", role: "Education Counsellor", branch: "Sylhet", joined: "Feb 2025",
      activeCaseload: 52, avgResponseHours: 3.8, followUpRate: 0.8, csat: 4.3, monthlyTarget: 4, focus: ["UK", "Malaysia"],
      profile: { leads: 85, qualify: 0.4, apply: 0.28, offer: 0.58, visa: 0.52, enrol: 0.86, fee: 1700, growth: 0.3 },
    },
    {
      id: "bickey-shah", name: "Bickey Shah", role: "Senior Counsellor", branch: "London", joined: "Sep 2020",
      activeCaseload: 64, avgResponseHours: 1.4, followUpRate: 0.96, csat: 4.9, monthlyTarget: 12, focus: ["UK"],
      profile: { leads: 95, qualify: 0.55, apply: 0.44, offer: 0.72, visa: 0.84, enrol: 0.93, fee: 2100, growth: 0.08 },
    },
    {
      id: "farhan-kabir", name: "Farhan Kabir", role: "Education Counsellor", branch: "London", joined: "Apr 2024",
      activeCaseload: 48, avgResponseHours: 2.0, followUpRate: 0.9, csat: 4.6, monthlyTarget: 7, focus: ["UK", "USA"],
      profile: { leads: 70, qualify: 0.5, apply: 0.4, offer: 0.68, visa: 0.8, enrol: 0.9, fee: 2100, growth: 0.12 },
    },
    {
      id: "nusrat-choudhury", name: "Nusrat Choudhury", role: "Senior Counsellor", branch: "Manchester",
      joined: "Nov 2021", activeCaseload: 61, avgResponseHours: 1.9, followUpRate: 0.91, csat: 4.7, monthlyTarget: 10,
      focus: ["UK"],
      profile: { leads: 90, qualify: 0.52, apply: 0.4, offer: 0.7, visa: 0.8, enrol: 0.92, fee: 2000, growth: 0.06 },
    },
    {
      id: "priya-patel", name: "Priya Patel", role: "Admissions Officer", branch: "Manchester", joined: "Jul 2023",
      activeCaseload: 40, avgResponseHours: 2.7, followUpRate: 0.87, csat: 4.5, monthlyTarget: 5, focus: ["UK", "Ireland"],
      profile: { leads: 60, qualify: 0.49, apply: 0.36, offer: 0.66, visa: 0.78, enrol: 0.9, fee: 2000, growth: 0.02 },
    },
    {
      id: "yuliana-prokipchak", name: "Yuliana Prokipchak", role: "Education Counsellor", branch: "Milton Keynes",
      joined: "Oct 2022", activeCaseload: 45, avgResponseHours: 3.1, followUpRate: 0.83, csat: 4.4, monthlyTarget: 6,
      focus: ["UK", "Europe"],
      profile: { leads: 75, qualify: 0.46, apply: 0.35, offer: 0.65, visa: 0.78, enrol: 0.9, fee: 1950, growth: -0.03 },
    },
  ];
  return rows.map(({ profile, ...row }) => ({ ...row, series: buildSeries(row.id, profile) }));
}

// --- Agents ------------------------------------------------------------

export type AgentTier = "Gold" | "Silver" | "Bronze";
export type AgentCompliance = "Verified" | "Pending review" | "Contract expiring";

export interface AgentPerformance {
  id: string;
  name: string;
  tier: AgentTier;
  city: string;
  country: string;
  contact: string;
  compliance: AgentCompliance;
  /** Agent's share of the institution commission. */
  commissionShare: number;
  /** Share of earned commission already paid out. */
  paidRatio: number;
  lastSubmissionDays: number;
  subAgents: number;
  partnerSince: string;
  series: MonthPoint[];
}

export function getAgentPerformanceDetail(): AgentPerformance[] {
  // Agents submit applications directly, so the funnel starts there.
  const agent = (apps: number, offer: number, visa: number, enrol: number, fee: number, growth: number): FunnelProfile => ({
    leads: apps, qualify: 1, apply: 1, offer, visa, enrol, fee, growth, volatility: 0.18,
  });
  const rows: (Omit<AgentPerformance, "series"> & { profile: FunnelProfile })[] = [
    {
      id: "gunjon", name: "Gunjon Education", tier: "Gold", city: "Dhaka", country: "Bangladesh", contact: "Gunjon Roy",
      compliance: "Verified", commissionShare: 0.7, paidRatio: 0.82, lastSubmissionDays: 1, subAgents: 6, partnerSince: "2019",
      profile: agent(55, 0.52, 0.6, 0.88, 1800, 0.12),
    },
    {
      id: "apex", name: "Apex Global Edu Pathway", tier: "Gold", city: "Dhaka", country: "Bangladesh",
      contact: "Kamal Hossain", compliance: "Verified", commissionShare: 0.65, paidRatio: 0.9, lastSubmissionDays: 0,
      subAgents: 4, partnerSince: "2023",
      profile: agent(42, 0.6, 0.62, 0.9, 1800, 0.22),
    },
    {
      id: "tarek", name: "Tarek Associates", tier: "Silver", city: "Sylhet", country: "Bangladesh", contact: "Tarek Rahman",
      compliance: "Contract expiring", commissionShare: 0.6, paidRatio: 0.74, lastSubmissionDays: 3, subAgents: 2,
      partnerSince: "2020",
      profile: agent(38, 0.38, 0.5, 0.85, 1750, -0.08),
    },
    {
      id: "crown", name: "Crown British Education", tier: "Gold", city: "Lagos", country: "Nigeria", contact: "Adaeze Okafor",
      compliance: "Verified", commissionShare: 0.65, paidRatio: 0.88, lastSubmissionDays: 2, subAgents: 3, partnerSince: "2022",
      profile: agent(30, 0.58, 0.7, 0.9, 1900, 0.35),
    },
    {
      id: "beacon", name: "Beacon Overseas Studies", tier: "Silver", city: "Kathmandu", country: "Nepal",
      contact: "Suman Shrestha", compliance: "Verified", commissionShare: 0.6, paidRatio: 0.93, lastSubmissionDays: 4,
      subAgents: 1, partnerSince: "2022",
      profile: agent(24, 0.55, 0.6, 0.9, 1850, 0.18),
    },
    {
      id: "summit", name: "Summit Academic Network", tier: "Silver", city: "Lahore", country: "Pakistan",
      contact: "Ayesha Malik", compliance: "Pending review", commissionShare: 0.6, paidRatio: 0.61, lastSubmissionDays: 9,
      subAgents: 0, partnerSince: "2024",
      profile: agent(20, 0.5, 0.52, 0.87, 1850, 0.1),
    },
    {
      id: "kafleas", name: "Kafleas Ltd", tier: "Bronze", city: "Chattogram", country: "Bangladesh", contact: "Rafiq Kafle",
      compliance: "Verified", commissionShare: 0.55, paidRatio: 0.85, lastSubmissionDays: 12, subAgents: 0, partnerSince: "2021",
      profile: agent(14, 0.42, 0.58, 0.86, 1750, 0.05),
    },
    {
      id: "pioneer", name: "Pioneer UK Admissions", tier: "Silver", city: "London", country: "United Kingdom",
      contact: "James Whitmore", compliance: "Verified", commissionShare: 0.6, paidRatio: 0.95, lastSubmissionDays: 5,
      subAgents: 0, partnerSince: "2023",
      profile: agent(12, 0.66, 0.88, 0.92, 2100, 0.15),
    },
    {
      id: "horizon", name: "Horizon Student Solutions", tier: "Bronze", city: "Accra", country: "Ghana", contact: "Kwame Mensah",
      compliance: "Pending review", commissionShare: 0.55, paidRatio: 0.5, lastSubmissionDays: 21, subAgents: 0,
      partnerSince: "2025",
      profile: agent(9, 0.47, 0.55, 0.88, 1850, 0.4),
    },
    {
      id: "albatross", name: "Albatross Education", tier: "Bronze", city: "New Delhi", country: "India", contact: "Rohit Mehra",
      compliance: "Verified", commissionShare: 0.55, paidRatio: 0.97, lastSubmissionDays: 47, subAgents: 0, partnerSince: "2021",
      profile: agent(5, 0.62, 0.65, 0.9, 1800, -0.2),
    },
  ];
  return rows.map(({ profile, ...row }) => ({ ...row, series: buildSeries(row.id, profile) }));
}

// --- Institutions ------------------------------------------------------

export interface InstitutionPerformance {
  id: string;
  name: string;
  shortName: string;
  country: string;
  city: string;
  partnership: "Direct" | "Aggregator";
  commissionRate: number;
  avgDecisionDays: number;
  ranking: string;
  series: MonthPoint[];
}

export function getInstitutionPerformance(): InstitutionPerformance[] {
  const inst = (apps: number, offer: number, visa: number, enrol: number, fee: number, growth: number): FunnelProfile => ({
    leads: apps, qualify: 1, apply: 1, offer, visa, enrol, fee, growth, volatility: 0.16,
  });
  const rows: (Omit<InstitutionPerformance, "series"> & { profile: FunnelProfile })[] = [
    {
      id: "herts", name: "University of Hertfordshire", shortName: "UH", country: "United Kingdom", city: "Hatfield",
      partnership: "Direct", commissionRate: 0.17, avgDecisionDays: 9, ranking: "Top 75 UK",
      profile: inst(95, 0.68, 0.72, 0.9, 2100, 0.15),
    },
    {
      id: "coventry", name: "Coventry University", shortName: "CU", country: "United Kingdom", city: "Coventry",
      partnership: "Direct", commissionRate: 0.15, avgDecisionDays: 6, ranking: "Top 50 UK",
      profile: inst(120, 0.74, 0.7, 0.88, 1900, 0.08),
    },
    {
      id: "greenwich", name: "University of Greenwich", shortName: "UoG", country: "United Kingdom", city: "London",
      partnership: "Direct", commissionRate: 0.15, avgDecisionDays: 12, ranking: "Top 80 UK",
      profile: inst(88, 0.61, 0.68, 0.9, 2000, 0.1),
    },
    {
      id: "ulster", name: "Ulster University", shortName: "UU", country: "United Kingdom", city: "Birmingham",
      partnership: "Direct", commissionRate: 0.16, avgDecisionDays: 5, ranking: "Top 40 UK",
      profile: inst(70, 0.78, 0.75, 0.9, 1850, 0.2),
    },
    {
      id: "sunderland", name: "University of Sunderland", shortName: "UoS", country: "United Kingdom", city: "London",
      partnership: "Direct", commissionRate: 0.15, avgDecisionDays: 4, ranking: "Top 90 UK",
      profile: inst(75, 0.81, 0.7, 0.87, 1600, 0.25),
    },
    {
      id: "dmu", name: "De Montfort University", shortName: "DMU", country: "United Kingdom", city: "Leicester",
      partnership: "Direct", commissionRate: 0.14, avgDecisionDays: 14, ranking: "Top 70 UK",
      profile: inst(60, 0.55, 0.66, 0.88, 1800, -0.05),
    },
    {
      id: "teesside", name: "Teesside University", shortName: "TU", country: "United Kingdom", city: "Middlesbrough",
      partnership: "Aggregator", commissionRate: 0.12, avgDecisionDays: 10, ranking: "Top 85 UK",
      profile: inst(50, 0.66, 0.69, 0.9, 1700, 0.12),
    },
    {
      id: "aru", name: "Anglia Ruskin University", shortName: "ARU", country: "United Kingdom", city: "Cambridge",
      partnership: "Aggregator", commissionRate: 0.13, avgDecisionDays: 11, ranking: "Top 70 UK",
      profile: inst(45, 0.63, 0.7, 0.88, 1900, 0.05),
    },
    {
      id: "bpp", name: "BPP University", shortName: "BPP", country: "United Kingdom", city: "London",
      partnership: "Direct", commissionRate: 0.14, avgDecisionDays: 7, ranking: "Specialist",
      profile: inst(30, 0.7, 0.74, 0.9, 1750, 0.02),
    },
    {
      id: "deakin", name: "Deakin University", shortName: "DU", country: "Australia", city: "Melbourne",
      partnership: "Aggregator", commissionRate: 0.15, avgDecisionDays: 21, ranking: "Top 10 AU",
      profile: inst(22, 0.58, 0.78, 0.9, 2900, 0.3),
    },
    {
      id: "york", name: "York University", shortName: "YU", country: "Canada", city: "Toronto",
      partnership: "Aggregator", commissionRate: 0.12, avgDecisionDays: 28, ranking: "Top 15 CA",
      profile: inst(16, 0.45, 0.6, 0.92, 2600, 0.1),
    },
    {
      id: "nci", name: "National College of Ireland", shortName: "NCI", country: "Ireland", city: "Dublin",
      partnership: "Direct", commissionRate: 0.12, avgDecisionDays: 8, ranking: "Specialist",
      profile: inst(14, 0.72, 0.86, 0.92, 1500, 0.18),
    },
  ];
  return rows.map(({ profile, ...row }) => ({ ...row, series: buildSeries(row.id, profile) }));
}

// --- Lead sources ------------------------------------------------------

export type LeadChannel = "Paid social" | "Paid search" | "Organic" | "Direct" | "Referral" | "Events" | "Partner";

export interface LeadSourcePerformance {
  id: string;
  name: string;
  channel: LeadChannel;
  owner: string;
  avgDaysToConvert: number;
  series: MonthPoint[];
}

export function getLeadSourcePerformance(): LeadSourcePerformance[] {
  const src = (
    leads: number, qualify: number, apply: number, growth: number, spend = 0, volatility = 0.14
  ): FunnelProfile => ({ leads, qualify, apply, offer: 0.64, visa: 0.62, enrol: 0.9, fee: 1850, growth, spend, volatility });
  const rows: (Omit<LeadSourcePerformance, "series"> & { profile: FunnelProfile })[] = [
    { id: "tiktok", name: "TikTok Ads", channel: "Paid social", owner: "Marketing", avgDaysToConvert: 74, profile: src(620, 0.28, 0.18, 0.55, 9000) },
    { id: "facebook", name: "Facebook Ads", channel: "Paid social", owner: "Marketing", avgDaysToConvert: 68, profile: src(540, 0.34, 0.22, 0.05, 12000) },
    { id: "instagram", name: "Instagram Ads", channel: "Paid social", owner: "Marketing", avgDaysToConvert: 71, profile: src(260, 0.31, 0.21, 0.2, 5000) },
    { id: "google", name: "Google Ads", channel: "Paid search", owner: "Marketing", avgDaysToConvert: 52, profile: src(310, 0.48, 0.3, 0.1, 11000) },
    { id: "website", name: "Website & Landing Pages", channel: "Organic", owner: "Marketing", avgDaysToConvert: 49, profile: src(280, 0.52, 0.33, 0.22, 2500) },
    { id: "whatsapp", name: "WhatsApp Direct", channel: "Direct", owner: "Front Office", avgDaysToConvert: 41, profile: src(190, 0.55, 0.34, 0.3) },
    { id: "referral", name: "Student Referral", channel: "Referral", owner: "Counselling", avgDaysToConvert: 33, profile: src(120, 0.72, 0.48, 0.15, 1500) },
    { id: "fairs", name: "Education Fairs", channel: "Events", owner: "Marketing", avgDaysToConvert: 58, profile: src(150, 0.6, 0.36, 0, 7000, 0.35) },
    { id: "walk-in", name: "Walk-in", channel: "Direct", owner: "Front Office", avgDaysToConvert: 29, profile: src(90, 0.7, 0.46, -0.05) },
    { id: "agent-referral", name: "Agent Partner Referral", channel: "Partner", owner: "Partnerships", avgDaysToConvert: 37, profile: src(110, 0.8, 0.55, 0.12) },
  ];
  return rows.map(({ profile, ...row }) => ({ ...row, series: buildSeries(row.id, profile) }));
}
