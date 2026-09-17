// Mock data for the WhatsApp Workspace module (conversation list + chat thread)

import { counsellors } from "@/lib/mock/applications";
import { initialsFor } from "@/lib/utils";

export { counsellors };

export type ConversationStatus = "Open" | "Pending" | "Resolved";

export const conversationStatuses: ConversationStatus[] = ["Open", "Pending", "Resolved"];

export const conversationStatusStyles: Record<ConversationStatus, { dot: string; text: string; bg: string }> = {
  Open: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  Pending: { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
  Resolved: { dot: "bg-slate-400", text: "text-muted-foreground", bg: "bg-surface-muted" },
};

export const whatsappAccounts = [
  "BD Admissions — +880 1729 000111",
  "UK Enquiries — +44 7700 900222",
  "General Support — +880 1888 333444",
] as const;

export type WhatsAppAccount = (typeof whatsappAccounts)[number];

export interface ChatMessage {
  id: string;
  direction: "in" | "out";
  text: string;
  time: string;
  sender?: string;
  status?: "sent" | "delivered" | "read";
}

export interface Conversation {
  id: string;
  contactName: string;
  initials: string;
  phone: string;
  account: WhatsAppAccount;
  status: ConversationStatus;
  assignedTo: string;
  leadSource: string;
  unreadCount: number;
  messages: ChatMessage[];
}

interface RawConversation {
  contactName: string;
  phone: string;
  account: WhatsAppAccount;
  status: ConversationStatus;
  assignedTo: string;
  leadSource: string;
  messages: Omit<ChatMessage, "id">[];
}

const rawConversations: RawConversation[] = [
  {
    contactName: "Sufi Mahamud Dollar",
    phone: "+8801720377280",
    account: "BD Admissions — +880 1729 000111",
    status: "Open",
    assignedTo: "Alif Tasnim",
    leadSource: "BD | Can/NZ | Sep Intake",
    messages: [
      { direction: "in", text: "Hi, I saw your ad about studying in Canada. Can you share the intake dates?", time: "2026-09-16T09:12:00" },
      { direction: "out", text: "Hello Sufi! Thanks for reaching out. The next intake is January 2027, applications close mid-October.", time: "2026-09-16T09:20:00", sender: "Alif Tasnim", status: "read" },
      { direction: "in", text: "Okay, what IELTS score do I need for a Bachelor's program?", time: "2026-09-16T09:22:00" },
      { direction: "out", text: "Most universities ask for an overall 6.0 with no band below 5.5. I can share a shortlist based on your grades if you send your SSC/HSC results.", time: "2026-09-16T09:25:00", sender: "Alif Tasnim", status: "delivered" },
      { direction: "in", text: "Sure, sending my transcripts now.", time: "2026-09-16T09:31:00" },
    ],
  },
  {
    contactName: "Taimur Khan",
    phone: "+447818067290",
    account: "UK Enquiries — +44 7700 900222",
    status: "Pending",
    assignedTo: "Alif Tasnim",
    leadSource: "May 26 - Aug Campaign",
    messages: [
      { direction: "in", text: "Hey, I requested a prospectus last week, any update?", time: "2026-09-15T14:02:00" },
      { direction: "out", text: "Hi Taimur, apologies for the delay — the prospectus is attached. Let me know if you'd like a call to walk through it.", time: "2026-09-15T14:40:00", sender: "Alif Tasnim", status: "read" },
      { direction: "in", text: "Thanks, I'll go through it and get back to you.", time: "2026-09-15T14:45:00" },
    ],
  },
  {
    contactName: "Atiqur Rahman",
    phone: "+8801886314614",
    account: "BD Admissions — +880 1729 000111",
    status: "Open",
    assignedTo: "Harunor Rashid",
    leadSource: "BD | Europe | Direct",
    messages: [
      { direction: "in", text: "Assalamu alaikum, I have shortlisted 3 courses from your website. Can we discuss fees?", time: "2026-09-16T11:05:00" },
      { direction: "out", text: "Walaikum salam Atiqur bhai! Sure, sending the fee breakdown for all three now.", time: "2026-09-16T11:10:00", sender: "Harunor Rashid", status: "read" },
      { direction: "out", text: "Also, do you already have a valid passport?", time: "2026-09-16T11:11:00", sender: "Harunor Rashid", status: "delivered" },
      { direction: "in", text: "Yes, valid till 2031.", time: "2026-09-16T11:15:00" },
      { direction: "in", text: "One more thing — is there a scholarship for merit students?", time: "2026-09-16T11:16:00" },
    ],
  },
  {
    contactName: "Oluwaseun Adebayo",
    phone: "+447901223344",
    account: "UK Enquiries — +44 7700 900222",
    status: "Resolved",
    assignedTo: "Nusrat Choudhury",
    leadSource: "Walk-in",
    messages: [
      { direction: "in", text: "Just confirming — my enrolment for MSc Data Analytics is finalised?", time: "2026-09-15T10:00:00" },
      { direction: "out", text: "Yes, confirmed! Welcome aboard. You'll receive the onboarding pack by email shortly.", time: "2026-09-15T10:05:00", sender: "Nusrat Choudhury", status: "read" },
      { direction: "in", text: "Brilliant, thank you for all the help!", time: "2026-09-15T10:06:00" },
      { direction: "out", text: "Our pleasure, Oluwaseun. All the best for the programme! 🎓", time: "2026-09-15T10:07:00", sender: "Nusrat Choudhury", status: "read" },
    ],
  },
  {
    contactName: "Nusrat Jahan Mim",
    phone: "+8801912384756",
    account: "BD Admissions — +880 1729 000111",
    status: "Pending",
    assignedTo: "Bickey Shah",
    leadSource: "Referral - Agent Partner",
    messages: [
      { direction: "out", text: "Hi Nusrat, following up on the callback you requested — are you free Friday afternoon?", time: "2026-09-16T08:00:00", sender: "Bickey Shah", status: "delivered" },
      { direction: "in", text: "Yes Friday works, please call after 3pm.", time: "2026-09-16T08:20:00" },
    ],
  },
  {
    contactName: "Tasfia Anjum",
    phone: "+8801912763450",
    account: "BD Admissions — +880 1729 000111",
    status: "Open",
    assignedTo: "Bickey Shah",
    leadSource: "Referral - Agent Partner",
    messages: [
      { direction: "in", text: "I still need to arrange my bank statement, will that delay my application?", time: "2026-09-14T16:30:00" },
      { direction: "out", text: "It's fine as long as it's ready before the visa stage. Application submission can go ahead without it.", time: "2026-09-14T16:40:00", sender: "Bickey Shah", status: "read" },
      { direction: "in", text: "That's a relief, thank you!", time: "2026-09-14T16:41:00" },
      { direction: "in", text: "I'll share the financial docs by next week then.", time: "2026-09-14T16:41:30" },
    ],
  },
  {
    contactName: "Daniel Osei",
    phone: "+447645123890",
    account: "UK Enquiries — +44 7700 900222",
    status: "Open",
    assignedTo: "Yuliana Prokipchak",
    leadSource: "Agent Partner",
    messages: [
      { direction: "in", text: "Any update on my offer letter from Milton Keynes campus?", time: "2026-09-16T13:00:00" },
      { direction: "out", text: "Hi Daniel, the university confirmed it's being processed — should land within 2 working days.", time: "2026-09-16T13:12:00", sender: "Yuliana Prokipchak", status: "delivered" },
    ],
  },
  {
    contactName: "Farhana Yeasmin",
    phone: "+8801812345098",
    account: "BD Admissions — +880 1729 000111",
    status: "Resolved",
    assignedTo: "Alif Tasnim",
    leadSource: "Website Inquiry",
    messages: [
      { direction: "out", text: "Hi Farhana, sharing the IELTS preparation guidance we discussed.", time: "2026-09-14T09:00:00", sender: "Alif Tasnim", status: "read" },
      { direction: "in", text: "Got it, thank you so much!", time: "2026-09-14T09:05:00" },
    ],
  },
];

export function getConversations(): Conversation[] {
  return rawConversations.map((c, i) => {
    const messages = c.messages.map((m, mi) => ({ ...m, id: `MSG-${i}-${mi}` }));
    const lastInboundUnread = c.status !== "Resolved" && messages.length > 0 && messages[messages.length - 1].direction === "in";
    return {
      id: `WA-${(3210 - i).toString().padStart(4, "0")}`,
      contactName: c.contactName,
      initials: initialsFor(c.contactName),
      phone: c.phone,
      account: c.account,
      status: c.status,
      assignedTo: c.assignedTo,
      leadSource: c.leadSource,
      unreadCount: lastInboundUnread ? 1 : 0,
      messages,
    };
  });
}

export function lastMessageOf(conversation: Conversation): ChatMessage | undefined {
  return conversation.messages[conversation.messages.length - 1];
}
