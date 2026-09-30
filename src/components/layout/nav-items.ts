import { navIcons, type NavIcon } from "./nav-icons";

export interface NavSubItem {
  label: string;
  href: string;
  badge?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: NavIcon;
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
        icon: navIcons.dashboard,
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
        icon: navIcons.leads,
        children: [
          { label: "All Leads", href: "/leads" },
          { label: "Affiliate Leads", href: "/leads?source=affiliate", badge: "New" },
          { label: "Export Leads", href: "/leads/export" },
          { label: "Follow-ups", href: "/leads/follow-ups" },
          { label: "Leads Status", href: "/leads/statuses" },
          { label: "Appointment", href: "/leads?tab=appointment" },
        ],
      },
      {
        label: "Applications",
        href: "/applications",
        icon: navIcons.applications,
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
        icon: navIcons.communications,
        children: [
          { label: "WhatsApp Workspace", href: "/whatsapp-workspace" },
          { label: "WhatsApp Accounts", href: "/whatsapp-accounts" },
          { label: "SMS Messages", href: "/communications/sms", badge: "New" },
          { label: "SMS Campaigns", href: "/communications/sms/campaigns" },
          { label: "SMS Consent", href: "/communications/sms/consent" },
          { label: "SMS Setup", href: "/communications/sms/setup" },
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
        icon: navIcons.countries,
        children: [
          { label: "Country Management", href: "/countries/management" },
          { label: "Add Represent Country", href: "/countries?action=add" },
          { label: "View Represent Country", href: "/countries?view=list" },
          { label: "Application Process", href: "/countries/application-process" },
        ],
      },
      {
        label: "Institutions",
        href: "/institutions",
        icon: navIcons.institutions,
        children: [
          { label: "Add Institution", href: "/institutions/new" },
          { label: "View Institutions", href: "/institutions" },
          { label: "AI Course Finder", href: "/institutions/research", badge: "AI" },
        ],
      },
      {
        label: "Courses",
        href: "/courses",
        icon: navIcons.courses,
        children: [
          { label: "Add Courses", href: "/courses/new" },
          { label: "All Courses", href: "/courses" },
          { label: "Course Category", href: "/courses/categories" },
          { label: "Course Level", href: "/courses/levels" },
        ],
      },
      {
        label: "Office",
        href: "/office",
        icon: navIcons.office,
        children: [
          { label: "Branch Office", href: "/office" },
          { label: "Front Office", href: "/office/front-office" },
          { label: "Essential Folder", href: "/office/essential-folder" },
          { label: "Add General Questions", href: "/office/general-questions" },
          { label: "News Feed", href: "/office/news-feed" },
        ],
      },
      {
        label: "People",
        href: "/people",
        icon: navIcons.people,
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
        icon: navIcons.agents,
        children: [
          { label: "Add New Agent", href: "/agent-management/new" },
          { label: "Pending Agents", href: "/agent-management/pending" },
          { label: "View Agents", href: "/agent-management" },
          { label: "My Ambassadors", href: "/agent-management/ambassadors", badge: "New" },
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
        icon: navIcons.targets,
        children: [
          { label: "Add Target", href: "/target-setup/new" },
          { label: "Target List", href: "/target-setup" },
          { label: "Target Overview", href: "/target-setup/overview" },
        ],
      },
      {
        label: "Finance",
        href: "/finance",
        icon: navIcons.finance,
        children: [
          { label: "Finance Overview", href: "/finance" },
          { label: "Agent Commission", href: "/finance/agent-commission" },
          { label: "Counsellor Commission", href: "/finance/counsellor-commission" },
          { label: "Add New Commission", href: "/finance/new" },
          { label: "University Commission List", href: "/finance/universities" },
          { label: "Total Commission Payments", href: "/finance/payments" },
        ],
      },
      {
        label: "BHE Training",
        href: "/bhe-training",
        icon: navIcons.training,
        children: [
          { label: "Training Hub", href: "/bhe-training" },
          { label: "Training Periods", href: "/bhe-training/programmes" },
          { label: "Video Sessions", href: "/bhe-training/videos" },
          { label: "Training Progression", href: "/bhe-training/progression" },
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
        icon: navIcons.archived,
        children: [
          { label: "Archived Leads", href: "/archived/leads" },
          { label: "Archived Applications", href: "/archived/applications" },
          { label: "Archived Agent Applications", href: "/archived/agent-applications" },
        ],
      },
      {
        label: "Settings",
        href: "/settings",
        icon: navIcons.settings,
        children: [
          { label: "Menu Settings", href: "/settings/menu" },
          { label: "Menu Permission Settings", href: "/settings/menu-permissions" },
          { label: "Company Settings", href: "/settings/company" },
          { label: "Audit Logs", href: "/settings/audit-logs" },
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
