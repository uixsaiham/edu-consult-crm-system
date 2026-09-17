import type { LucideIcon } from "lucide-react";
import { CalendarClock, CheckCircle2, FileText, UserPlus } from "lucide-react";

export interface NotificationItem {
  id: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export function getNotifications(): NotificationItem[] {
  return [
    {
      id: "ntf-1",
      icon: UserPlus,
      iconBg: "bg-primary-soft",
      iconColor: "text-primary",
      title: "New lead assigned",
      description: "Taimur Khan was assigned to Alif Tasnim",
      time: "5 min ago",
      read: false,
    },
    {
      id: "ntf-2",
      icon: CheckCircle2,
      iconBg: "bg-success-soft",
      iconColor: "text-success",
      title: "Application enrolled",
      description: "Tanvir Ahmed's application moved to Enrolled",
      time: "42 min ago",
      read: false,
    },
    {
      id: "ntf-3",
      icon: FileText,
      iconBg: "bg-sky-50 dark:bg-sky-500/10",
      iconColor: "text-sky-600 dark:text-sky-400",
      title: "Document uploaded",
      description: "Farzana Islam uploaded her passport copy",
      time: "1 hr ago",
      read: false,
    },
    {
      id: "ntf-4",
      icon: CalendarClock,
      iconBg: "bg-warning-soft",
      iconColor: "text-warning",
      title: "Follow-up due today",
      description: "Callback reminder for Nusrat Jahan Mim",
      time: "3 hrs ago",
      read: true,
    },
    {
      id: "ntf-5",
      icon: UserPlus,
      iconBg: "bg-primary-soft",
      iconColor: "text-primary",
      title: "12 new leads imported",
      description: "From \"BD to UK Student Fair\" campaign",
      time: "Yesterday",
      read: true,
    },
  ];
}

export interface ConversationItem {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread: boolean;
}

export function getConversations(): ConversationItem[] {
  return [
    { id: "cv-1", name: "Sheikh Hojaifa", initials: "SH", lastMessage: "Can I get the offer letter today?", time: "2 min ago", unread: true },
    { id: "cv-2", name: "Beverly Hange", initials: "BH", lastMessage: "Thanks for the prospectus!", time: "18 min ago", unread: true },
    { id: "cv-3", name: "Daniel Osei", initials: "DO", lastMessage: "Sent my bank statement.", time: "1 hr ago", unread: false },
    { id: "cv-4", name: "Rebeka Sultana", initials: "RS", lastMessage: "What's the next intake date?", time: "Yesterday", unread: false },
  ];
}
