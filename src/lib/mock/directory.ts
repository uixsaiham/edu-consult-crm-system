export interface CountryRecord {
  id: string;
  name: string;
  code: string;
  flag: string;
  region: "Europe" | "North America" | "Oceania" | "Asia";
  currency: string;
  avgTuition: string;
  minIelts: string;
  visaSuccessRate: number;
  processingDays: string;
  partnerUniversities: number;
  popularIntakes: string[];
  status: "Active" | "Seasonal" | "Under Review" | "Inactive";
  directApplications: number;
  agentApplications: number;
  leadInProgress: number;
  completedLeads: number;
  rejectedLeads: number;
  isActive: boolean;
  // Destination profile, captured when a country is added.
  monthlyLivingCost?: number;
  flagImage?: string;
  bannerImage?: string;
  visaRequirements?: string;
  partTimeWork?: string;
  accommodation?: string;
  benefits?: string;
}

/** Full institution profile as captured by the Add / Edit Institution form. */
export interface InstitutionDetails {
  name: string;
  shortName: string;
  type: "University" | "College" | "Pathway provider" | "Language school";
  country: string;
  city: string;
  campuses: string;
  website: string;
  established: string;
  ranking: string;
  logo: string;
  agreementType: "Direct Agreement" | "Consortium / Aggregator";
  aggregator: string;
  commissionRate: string;
  paymentTerms: string;
  startDate: string;
  endDate: string;
  agreementDoc: string;
  intakes: string[];
  tat: string;
  levels: string[];
  ieltsMin: string;
  altTests: string[];
  applicationFee: string;
  deposit: string;
  scholarships: boolean;
  scholarshipMax: string;
  programsCount: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  admissionsEmail: string;
  status: "Active" | "Onboarding";
  featured: boolean;
  notes: string;
}

export interface InstitutionRecord {
  id: string;
  name: string;
  country: string;
  city: string;
  logoText: string;
  ranking: string;
  commissionTier: "Tier 1 (15-18%)" | "Tier 2 (12-15%)" | "Tier 3 (10-12%)";
  agreementType: "Direct Agreement" | "Consortium / Aggregator";
  tatDays: string;
  openIntakes: string[];
  programsCount: number;
  featured: boolean;
  // Captured by the Add Institution form.
  type?: InstitutionDetails["type"];
  website?: string;
  commissionRate?: number;
  status?: "Active" | "Onboarding";
  contactName?: string;
  contactEmail?: string;
  /** Hidden from counsellors and applications when false (default true). */
  active?: boolean;
  /** Courses published on the public BHE website (default true). */
  showOnWebsite?: boolean;
  /** Everything entered in the institution form, for viewing and editing. */
  details?: InstitutionDetails;
}

export interface PersonRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "Senior Counselor" | "Education Counselor" | "Admissions Officer" | "Branch Manager" | "Compliance Lead";
  office: string;
  activeLeads: number;
  enrolledCount: number;
  conversionRate: number;
  status: "Active" | "On Leave" | "In Training";
  joinedDate: string;
}

export const mockCountries: CountryRecord[] = [
  {
    id: "AU",
    name: "Australia",
    code: "AUS",
    flag: "🇦🇺",
    region: "Oceania",
    currency: "AUD ($)",
    avgTuition: "$24,000 – $34,000",
    minIelts: "6.5 overall",
    visaSuccessRate: 89.1,
    processingDays: "20-30 days",
    partnerUniversities: 28,
    popularIntakes: ["February", "July", "November"],
    status: "Active",
    directApplications: 142,
    agentApplications: 96,
    leadInProgress: 64,
    completedLeads: 154,
    rejectedLeads: 18,
    isActive: true,
  },
  {
    id: "CA",
    name: "Canada",
    code: "CAN",
    flag: "🇨🇦",
    region: "North America",
    currency: "CAD ($)",
    avgTuition: "$16,000 – $24,000",
    minIelts: "6.5 (6.0 each)",
    visaSuccessRate: 84.7,
    processingDays: "4-8 weeks",
    partnerUniversities: 31,
    popularIntakes: ["September", "January", "May"],
    status: "Active",
    directApplications: 188,
    agentApplications: 112,
    leadInProgress: 82,
    completedLeads: 195,
    rejectedLeads: 23,
    isActive: true,
  },
  {
    id: "CN",
    name: "China",
    code: "CHN",
    flag: "🇨🇳",
    region: "Asia",
    currency: "CNY (¥)",
    avgTuition: "¥20,000 – ¥40,000",
    minIelts: "5.5 overall",
    visaSuccessRate: 95.0,
    processingDays: "15-20 days",
    partnerUniversities: 12,
    popularIntakes: ["September", "March"],
    status: "Active",
    directApplications: 45,
    agentApplications: 30,
    leadInProgress: 22,
    completedLeads: 48,
    rejectedLeads: 5,
    isActive: true,
  },
  {
    id: "CY",
    name: "Cyprus",
    code: "CYP",
    flag: "🇨🇾",
    region: "Europe",
    currency: "EUR (€)",
    avgTuition: "€4,500 – €8,000",
    minIelts: "5.5 overall",
    visaSuccessRate: 93.4,
    processingDays: "2-3 weeks",
    partnerUniversities: 9,
    popularIntakes: ["October", "February"],
    status: "Active",
    directApplications: 38,
    agentApplications: 24,
    leadInProgress: 16,
    completedLeads: 42,
    rejectedLeads: 4,
    isActive: true,
  },
  {
    id: "FI",
    name: "Finland",
    code: "FIN",
    flag: "🇫🇮",
    region: "Europe",
    currency: "EUR (€)",
    avgTuition: "€8,000 – €14,000",
    minIelts: "6.0 overall",
    visaSuccessRate: 92.0,
    processingDays: "4-6 weeks",
    partnerUniversities: 8,
    popularIntakes: ["Autumn (September)", "Spring (January)"],
    status: "Active",
    directApplications: 52,
    agentApplications: 28,
    leadInProgress: 19,
    completedLeads: 55,
    rejectedLeads: 6,
    isActive: true,
  },
  {
    id: "DE",
    name: "Germany",
    code: "DEU",
    flag: "🇩🇪",
    region: "Europe",
    currency: "EUR (€)",
    avgTuition: "€3,000 – €11,000",
    minIelts: "6.0 overall",
    visaSuccessRate: 91.8,
    processingDays: "8-12 weeks",
    partnerUniversities: 14,
    popularIntakes: ["Winter (October)", "Summer (April)"],
    status: "Active",
    directApplications: 94,
    agentApplications: 62,
    leadInProgress: 41,
    completedLeads: 105,
    rejectedLeads: 10,
    isActive: true,
  },
  {
    id: "HU",
    name: "Hungary",
    code: "HUN",
    flag: "🇭🇺",
    region: "Europe",
    currency: "EUR (€)",
    avgTuition: "€3,500 – €7,500",
    minIelts: "5.5 overall",
    visaSuccessRate: 94.2,
    processingDays: "3-4 weeks",
    partnerUniversities: 7,
    popularIntakes: ["September", "February"],
    status: "Active",
    directApplications: 31,
    agentApplications: 19,
    leadInProgress: 14,
    completedLeads: 33,
    rejectedLeads: 3,
    isActive: true,
  },
  {
    id: "IE",
    name: "Ireland",
    code: "IRL",
    flag: "🇮🇪",
    region: "Europe",
    currency: "EUR (€)",
    avgTuition: "€12,000 – €17,000",
    minIelts: "6.0 overall",
    visaSuccessRate: 96.5,
    processingDays: "4-6 weeks",
    partnerUniversities: 18,
    popularIntakes: ["September", "January"],
    status: "Active",
    directApplications: 110,
    agentApplications: 75,
    leadInProgress: 48,
    completedLeads: 122,
    rejectedLeads: 11,
    isActive: true,
  },
  {
    id: "MY",
    name: "Malaysia",
    code: "MYS",
    flag: "🇲🇾",
    region: "Asia",
    currency: "MYR (RM)",
    avgTuition: "$6,000 – $10,000",
    minIelts: "5.5 overall",
    visaSuccessRate: 97.2,
    processingDays: "14-21 days",
    partnerUniversities: 19,
    popularIntakes: ["February", "July", "October"],
    status: "Active",
    directApplications: 85,
    agentApplications: 54,
    leadInProgress: 36,
    completedLeads: 92,
    rejectedLeads: 7,
    isActive: true,
  },
  {
    id: "MT",
    name: "Malta",
    code: "MLT",
    flag: "🇲🇹",
    region: "Europe",
    currency: "EUR (€)",
    avgTuition: "€6,000 – €9,500",
    minIelts: "5.5 overall",
    visaSuccessRate: 91.5,
    processingDays: "3-4 weeks",
    partnerUniversities: 6,
    popularIntakes: ["October", "February"],
    status: "Active",
    directApplications: 28,
    agentApplications: 17,
    leadInProgress: 12,
    completedLeads: 29,
    rejectedLeads: 4,
    isActive: true,
  },
  {
    id: "NZ",
    name: "New Zealand",
    code: "NZL",
    flag: "🇳🇿",
    region: "Oceania",
    currency: "NZD ($)",
    avgTuition: "$22,000 – $32,000",
    minIelts: "6.0 overall",
    visaSuccessRate: 90.4,
    processingDays: "25-35 days",
    partnerUniversities: 11,
    popularIntakes: ["February", "July"],
    status: "Active",
    directApplications: 68,
    agentApplications: 44,
    leadInProgress: 29,
    completedLeads: 74,
    rejectedLeads: 8,
    isActive: true,
  },
  {
    id: "KR",
    name: "South Korea",
    code: "KOR",
    flag: "🇰🇷",
    region: "Asia",
    currency: "KRW (₩)",
    avgTuition: "$4,000 – $9,000",
    minIelts: "5.5 overall",
    visaSuccessRate: 93.8,
    processingDays: "3-4 weeks",
    partnerUniversities: 9,
    popularIntakes: ["March", "September"],
    status: "Active",
    directApplications: 36,
    agentApplications: 22,
    leadInProgress: 15,
    completedLeads: 39,
    rejectedLeads: 4,
    isActive: true,
  },
  {
    id: "GB",
    name: "United Kingdom",
    code: "GBR",
    flag: "🇬🇧",
    region: "Europe",
    currency: "GBP (£)",
    avgTuition: "£13,500 – £18,000",
    minIelts: "6.0 (5.5 each)",
    visaSuccessRate: 98.4,
    processingDays: "15 working days",
    partnerUniversities: 68,
    popularIntakes: ["September", "January", "May"],
    status: "Active",
    directApplications: 412,
    agentApplications: 295,
    leadInProgress: 176,
    completedLeads: 485,
    rejectedLeads: 46,
    isActive: true,
  },
  {
    id: "US",
    name: "United States",
    code: "USA",
    flag: "🇺🇸",
    region: "North America",
    currency: "USD ($)",
    avgTuition: "$22,000 – $36,000",
    minIelts: "6.5 overall",
    visaSuccessRate: 88.2,
    processingDays: "30-45 days",
    partnerUniversities: 42,
    popularIntakes: ["Fall (August)", "Spring (January)"],
    status: "Active",
    directApplications: 265,
    agentApplications: 180,
    leadInProgress: 118,
    completedLeads: 290,
    rejectedLeads: 37,
    isActive: true,
  },
];

export const mockInstitutions: InstitutionRecord[] = [
  {
    id: "INS-01",
    name: "University of Hertfordshire",
    country: "United Kingdom",
    city: "Hatfield",
    logoText: "UH",
    ranking: "Top 75 UK (Guardian 2026)",
    commissionTier: "Tier 1 (15-18%)",
    agreementType: "Direct Agreement",
    tatDays: "48 hours",
    openIntakes: ["September 2026", "January 2027"],
    programsCount: 184,
    featured: true,
  },
  {
    id: "INS-02",
    name: "Coventry University",
    country: "United Kingdom",
    city: "Coventry & London",
    logoText: "CU",
    ranking: "Top 50 UK (Complete Univ Guide)",
    commissionTier: "Tier 1 (15-18%)",
    agreementType: "Direct Agreement",
    tatDays: "3-5 days",
    openIntakes: ["September 2026", "January 2027", "May 2027"],
    programsCount: 220,
    featured: true,
  },
  {
    id: "INS-03",
    name: "University of Greenwich",
    country: "United Kingdom",
    city: "London",
    logoText: "UOG",
    ranking: "Top 80 UK",
    commissionTier: "Tier 1 (15-18%)",
    agreementType: "Direct Agreement",
    tatDays: "3-4 days",
    openIntakes: ["September 2026", "January 2027"],
    programsCount: 160,
    featured: true,
  },
  {
    id: "INS-04",
    name: "Ulster University",
    country: "United Kingdom",
    city: "Belfast & London",
    logoText: "UU",
    ranking: "Top 60 UK",
    commissionTier: "Tier 2 (12-15%)",
    agreementType: "Direct Agreement",
    tatDays: "5 days",
    openIntakes: ["September 2026", "January 2027"],
    programsCount: 145,
    featured: false,
  },
  {
    id: "INS-05",
    name: "De Montfort University",
    country: "United Kingdom",
    city: "Leicester",
    logoText: "DMU",
    ranking: "Top 90 UK",
    commissionTier: "Tier 2 (12-15%)",
    agreementType: "Direct Agreement",
    tatDays: "3-5 days",
    openIntakes: ["September 2026", "January 2027"],
    programsCount: 170,
    featured: false,
  },
  {
    id: "INS-06",
    name: "BPP University",
    country: "United Kingdom",
    city: "London, Manchester, Birmingham",
    logoText: "BPP",
    ranking: "#1 UK Law & Business School",
    commissionTier: "Tier 1 (15-18%)",
    agreementType: "Direct Agreement",
    tatDays: "24-48 hours",
    openIntakes: ["September 2026", "November 2026", "January 2027", "May 2027"],
    programsCount: 95,
    featured: true,
  },
  {
    id: "INS-07",
    name: "Northeastern University",
    country: "United States",
    city: "Boston, MA",
    logoText: "NEU",
    ranking: "#44 US News National",
    commissionTier: "Tier 2 (12-15%)",
    agreementType: "Consortium / Aggregator",
    tatDays: "7-10 days",
    openIntakes: ["Fall 2026", "Spring 2027"],
    programsCount: 110,
    featured: false,
  },
  {
    id: "INS-08",
    name: "York University",
    country: "Canada",
    city: "Toronto, ON",
    logoText: "YU",
    ranking: "#4 Comprehensive in Canada",
    commissionTier: "Tier 2 (12-15%)",
    agreementType: "Direct Agreement",
    tatDays: "10-14 days",
    openIntakes: ["September 2026", "January 2027"],
    programsCount: 130,
    featured: false,
  },
  {
    id: "INS-09",
    name: "Deakin University",
    country: "Australia",
    city: "Melbourne, VIC",
    logoText: "DU",
    ranking: "Top 1% Worldwide",
    commissionTier: "Tier 2 (12-15%)",
    agreementType: "Direct Agreement",
    tatDays: "5-7 days",
    openIntakes: ["Trimester 3 2026", "Trimester 1 2027"],
    programsCount: 150,
    featured: false,
  },
  {
    id: "INS-10",
    name: "National College of Ireland",
    country: "Ireland",
    city: "Dublin",
    logoText: "NCI",
    ranking: "#1 Cloud Computing Hub",
    commissionTier: "Tier 1 (15-18%)",
    agreementType: "Direct Agreement",
    tatDays: "3-5 days",
    openIntakes: ["September 2026", "January 2027"],
    programsCount: 65,
    featured: true,
  },
];

export const mockPeople: PersonRecord[] = [
  {
    id: "USR-01",
    name: "Ummay Saiha Limu",
    email: "limu@bhe-consultancy.co.uk",
    phone: "+880 1711-892401",
    role: "Senior Counselor",
    office: "Dhaka Dhanmondi Flagship",
    activeLeads: 68,
    enrolledCount: 42,
    conversionRate: 31.2,
    status: "Active",
    joinedDate: "Jan 2024",
  },
  {
    id: "USR-02",
    name: "Md. Shariful Islam",
    email: "shariful@bhe-consultancy.co.uk",
    phone: "+880 1712-458902",
    role: "Branch Manager",
    office: "Dhaka Banani Executive Branch",
    activeLeads: 45,
    enrolledCount: 38,
    conversionRate: 28.5,
    status: "Active",
    joinedDate: "Mar 2023",
  },
  {
    id: "USR-03",
    name: "Youna",
    email: "youna@bhe-consultancy.co.uk",
    phone: "+44 7700 900341",
    role: "Branch Manager",
    office: "London Headquarters",
    activeLeads: 52,
    enrolledCount: 46,
    conversionRate: 35.8,
    status: "Active",
    joinedDate: "Aug 2022",
  },
  {
    id: "USR-04",
    name: "Tanvir Ahmed",
    email: "tanvir@bhe-consultancy.co.uk",
    phone: "+880 1819-445120",
    role: "Senior Counselor",
    office: "Sylhet Zindabazar Hub",
    activeLeads: 62,
    enrolledCount: 39,
    conversionRate: 29.1,
    status: "Active",
    joinedDate: "Jun 2024",
  },
  {
    id: "USR-05",
    name: "Sadia Afrin",
    email: "sadia@bhe-consultancy.co.uk",
    phone: "+880 1713-998811",
    role: "Education Counselor",
    office: "Sylhet Zindabazar Hub",
    activeLeads: 58,
    enrolledCount: 29,
    conversionRate: 24.8,
    status: "Active",
    joinedDate: "Nov 2024",
  },
  {
    id: "USR-06",
    name: "Emma Watson",
    email: "emma.w@bhe-consultancy.co.uk",
    phone: "+44 7700 900582",
    role: "Admissions Officer",
    office: "Manchester Northern Office",
    activeLeads: 35,
    enrolledCount: 28,
    conversionRate: 32.0,
    status: "Active",
    joinedDate: "Feb 2025",
  },
  {
    id: "USR-07",
    name: "David Miller",
    email: "david.m@bhe-consultancy.co.uk",
    phone: "+44 7700 900614",
    role: "Compliance Lead",
    office: "Milton Keynes Operations Desk",
    activeLeads: 24,
    enrolledCount: 21,
    conversionRate: 36.4,
    status: "Active",
    joinedDate: "Sep 2023",
  },
  {
    id: "USR-08",
    name: "Kazi Rakib",
    email: "rakib@bhe-consultancy.co.uk",
    phone: "+880 1912-789012",
    role: "Education Counselor",
    office: "Chittagong GEC Circle",
    activeLeads: 49,
    enrolledCount: 22,
    conversionRate: 23.5,
    status: "Active",
    joinedDate: "Jan 2025",
  },
  {
    id: "USR-09",
    name: "Nusrat Jahan",
    email: "nusrat@bhe-consultancy.co.uk",
    phone: "+880 1714-332211",
    role: "Education Counselor",
    office: "Dhaka Dhanmondi Flagship",
    activeLeads: 54,
    enrolledCount: 31,
    conversionRate: 26.2,
    status: "In Training",
    joinedDate: "May 2025",
  },
];
