import {
  LayoutDashboard,
  MessageSquare,
  Link2,
  Globe2,
  Landmark,
  BookOpen,
  Building2,
  Users,
  UserCog,
  Users2,
  FileText,
  Target,
  LineChart,
  GraduationCap,
  Archive,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    label: "Main",
    items: [
      { label: "Admin Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Leads", href: "/leads", icon: Users2 },
      { label: "Applications", href: "/applications", icon: FileText },
      { label: "WhatsApp Workspace", href: "/whatsapp-workspace", icon: MessageSquare },
      { label: "WhatsApp Accounts", href: "/whatsapp-accounts", icon: Link2 },
    ],
  },
  {
    label: "Directory",
    items: [
      { label: "Countries", href: "/countries", icon: Globe2 },
      { label: "Institutions", href: "/institutions", icon: Landmark },
      { label: "Courses", href: "/courses", icon: BookOpen },
      { label: "Office", href: "/office", icon: Building2 },
      { label: "People", href: "/people", icon: Users },
      { label: "Agent Management", href: "/agent-management", icon: UserCog },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Target Setup", href: "/target-setup", icon: Target },
      { label: "Finance", href: "/finance", icon: LineChart },
      { label: "BHE Training", href: "/bhe-training", icon: GraduationCap },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Archived", href: "/archived", icon: Archive },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const navItems: NavItem[] = navSections.flatMap((section) => section.items);
