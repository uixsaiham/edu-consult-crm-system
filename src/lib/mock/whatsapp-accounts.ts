export interface WhatsAppAccount {
  id: string;
  name: string;
  phone: string;
  country: "UK" | "Bangladesh";
  status: "connected" | "disconnected" | "qr_required" | "syncing";
  assignedCounselors: string[];
  messagesToday: number;
  totalConversations: number;
  lastSync: string;
  isDefault: boolean;
  qualityRating: "High" | "Medium" | "Low";
}

export const mockWhatsAppAccounts: WhatsAppAccount[] = [
  {
    id: "WA-01",
    name: "BHE Dhaka Admissions Hub",
    phone: "+880 1711-892401",
    country: "Bangladesh",
    status: "connected",
    assignedCounselors: ["Ummay Saiha Limu", "Md. Shariful Islam"],
    messagesToday: 342,
    totalConversations: 1240,
    lastSync: "Just now",
    isDefault: true,
    qualityRating: "High",
  },
  {
    id: "WA-02",
    name: "BHE London Headquarters",
    phone: "+44 7700 900341",
    country: "UK",
    status: "connected",
    assignedCounselors: ["Youna", "David Miller"],
    messagesToday: 189,
    totalConversations: 860,
    lastSync: "3m ago",
    isDefault: false,
    qualityRating: "High",
  },
  {
    id: "WA-03",
    name: "BHE Sylhet Student Desk",
    phone: "+880 1819-445120",
    country: "Bangladesh",
    status: "qr_required",
    assignedCounselors: ["Tanvir Ahmed", "Sadia Afrin"],
    messagesToday: 0,
    totalConversations: 512,
    lastSync: "2h ago",
    isDefault: false,
    qualityRating: "Medium",
  },
  {
    id: "WA-04",
    name: "BHE Manchester Visa Line",
    phone: "+44 7700 900582",
    country: "UK",
    status: "connected",
    assignedCounselors: ["Emma Watson", "Alex Carter"],
    messagesToday: 114,
    totalConversations: 430,
    lastSync: "12m ago",
    isDefault: false,
    qualityRating: "High",
  },
  {
    id: "WA-05",
    name: "BHE Chittagong Regional Line",
    phone: "+880 1912-789012",
    country: "Bangladesh",
    status: "disconnected",
    assignedCounselors: ["Kazi Rakib"],
    messagesToday: 0,
    totalConversations: 290,
    lastSync: "Yesterday",
    isDefault: false,
    qualityRating: "Low",
  },
];

export function getWhatsAppAccounts(): WhatsAppAccount[] {
  return mockWhatsAppAccounts;
}

