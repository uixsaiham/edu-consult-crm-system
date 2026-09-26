import {
  LayoutDashboard,
  MessageSquare,
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

export interface NavSubItem {
  label: string;
  href: string;
  badge?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavSubItem[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    label: "Main",
    items: [
      {
        label: "Admin Dashboard",
        href: "/",
        icon: LayoutDashboard,
        children: [
          { label: "Branch Performance", href: "/performance/branches" },
          { label: "Counsellor Performance", href: "/performance/counsellors" },
          { label: "Agent Performance", href: "/performance/agents" },
          { label: "Institutions Performance", href: "/performance/institutions" },
          { label: "Lead Source Performance", href: "/performance/lead-sources" },
        ],
      },
      {
        label: "Leads",
        href: "/leads",
        icon: Users2,
        children: [
          { label: "All Leads", href: "/leads" },
          { label: "Affiliate Leads", href: "/leads?source=affiliate", badge: "New" },
          { label: "Export Leads", href: "/leads/export" },
          { label: "Follow-ups", href: "/leads/follow-ups" },
          { label: "Leads Status", href: "/leads?tab=status" },
          { label: "Appointment", href: "/leads?tab=appointment" },
        ],
      },
      {
        label: "Applications",
        href: "/applications",
        icon: FileText,
        children: [
          { label: "Add New Application", href: "/applications?action=add" },
          { label: "Direct Applications", href: "/applications?source=direct" },
          { label: "Agent Applications", href: "/applications?source=agent" },
          { label: "Affiliate Applications", href: "/applications?source=affiliate", badge: "New" },
        ],
      },
      {
        label: "Communications",
        href: "/whatsapp-workspace",
        icon: MessageSquare,
        children: [
          { label: "WhatsApp Workspace", href: "/whatsapp-workspace" },
          { label: "WhatsApp Accounts", href: "/whatsapp-accounts" },
          { label: "Announcements", href: "/communications/announcements" },
          { label: "News Feed", href: "/communications/news-feed" },
        ],
      },
    ],
  },
  {
    label: "Directory",
    items: [
      {
        label: "Countries",
        href: "/countries",
        icon: Globe2,
        children: [
          { label: "Country Management", href: "/countries/management" },
          { label: "Add Represent Country", href: "/countries?action=add" },
          { label: "View Represent Country", href: "/countries?view=list" },
        ],
      },
      {
        label: "Institutions",
        href: "/institutions",
        icon: Landmark,
        children: [
          { label: "Add Institution", href: "/institutions/new" },
          { label: "View Institutions", href: "/institutions" },
        ],
      },
      {
        label: "Courses",
        href: "/courses",
        icon: BookOpen,
        children: [
          { label: "Add Courses", href: "/courses?action=add" },
          { label: "All Courses", href: "/courses" },
          { label: "Course Category", href: "/courses?view=category" },
          { label: "Course Level", href: "/courses?view=level" },
        ],
      },
      {
        label: "Office",
        href: "/office",
        icon: Building2,
        children: [
          { label: "Branch Office", href: "/office" },
          { label: "Front Office", href: "/office?view=front-office" },
          { label: "Essential Folder", href: "/office?view=essential-folder" },
          { label: "Add General Questions", href: "/office?action=add-questions" },
          { label: "News Feed", href: "/office?view=news-feed" },
        ],
      },
      {
        label: "People",
        href: "/people",
        icon: Users,
        children: [
          { label: "Add People", href: "/people/new" },
          { label: "View People", href: "/people" },
          { label: "Role", href: "/people/roles" },
          { label: "Task Setting", href: "/people/tasks" },
          { label: "Announcements", href: "/people/announcements" },
          { label: "Teams", href: "/people/teams" },
        ],
      },
      {
        label: "Agent Management",
        href: "/agent-management",
        icon: UserCog,
        children: [
          { label: "Add New Agent", href: "/agent-management?action=add" },
          { label: "Pending Agents", href: "/agent-management?status=pending" },
          { label: "View Agents", href: "/agent-management" },
          { label: "My Ambassadors", href: "/agent-management?view=ambassadors", badge: "New" },
        ],
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "Target Setup",
        href: "/target-setup",
        icon: Target,
        children: [
          { label: "Add Target", href: "/target-setup?action=add" },
          { label: "Target List", href: "/target-setup" },
          { label: "Target Overview", href: "/target-setup?view=overview" },
        ],
      },
      {
        label: "Finance",
        href: "/finance",
        icon: LineChart,
        children: [
          { label: "Finance Overview", href: "/finance" },
          { label: "Agent Commission", href: "/finance?view=agent-commission" },
          { label: "Counsellor Commission", href: "/finance?view=counsellor-commission" },
          { label: "Add New Commission", href: "/finance?action=add-commission" },
          { label: "University Commission List", href: "/finance?view=university-commission" },
          { label: "Total Commission Payments", href: "/finance?view=total-payments" },
        ],
      },
      {
        label: "BHE Training",
        href: "/bhe-training",
        icon: GraduationCap,
        children: [
          { label: "Training Hub", href: "/bhe-training" },
          { label: "Training Progression", href: "/bhe-training?view=progression" },
        ],
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Archived",
        href: "/archived",
        icon: Archive,
        children: [
          { label: "Archived Leads", href: "/archived?type=leads" },
          { label: "Archived Applications", href: "/archived?type=applications" },
          { label: "Archived Agent Applications", href: "/archived?type=agent-applications" },
        ],
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        children: [
          { label: "Menu Settings", href: "/settings?tab=menu" },
          { label: "Menu Permission Settings", href: "/settings?tab=menu-permissions" },
          { label: "Company Settings", href: "/settings?tab=company" },
          { label: "Audit Logs", href: "/settings?tab=audit-logs" },
        ],
      },
    ],
  },
];

export const navItems: NavItem[] = navSections.flatMap((section) => section.items);

/** True when the current path belongs to this item or one of its sub-pages. */
export function isNavItemActive(item: NavItem, pathname: string) {
  if (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) return true;
  return !!item.children?.some((child) => {
    const path = child.href.split("?")[0];
    return path !== "/" && path !== item.href && pathname.startsWith(path);
  });
}
