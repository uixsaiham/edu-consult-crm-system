"use client";

import { Phone, Radio, Tag, UserCog } from "lucide-react";
import { Select } from "@/components/ui/form-controls";
import {
  conversationStatuses,
  conversationStatusStyles,
  counsellors,
  type Conversation,
  type ConversationStatus,
} from "@/lib/mock/whatsapp";
import { cn } from "@/lib/utils";

export function ContactPanel({
  conversation,
  onStatusChange,
  onAssigneeChange,
}: {
  conversation: Conversation;
  onStatusChange: (status: ConversationStatus) => void;
  onAssigneeChange: (assignee: string) => void;
}) {
  const status = conversationStatusStyles[conversation.status];

  return (
    <div className="flex h-full min-w-0 flex-col overflow-y-auto">
      <div className="flex flex-col items-center gap-2 border-b border-border px-4 py-6 text-center">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary">
          {conversation.initials}
        </span>
        <p className="text-sm font-semibold text-foreground">{conversation.contactName}</p>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", status.bg, status.text)}>
          <span className={cn("size-1.5 rounded-full", status.dot)} />
          {conversation.status}
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
            <Phone className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Phone</p>
            <p className="truncate text-xs font-medium text-foreground">{conversation.phone}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
            <Radio className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">WhatsApp Account</p>
            <p className="truncate text-xs font-medium text-foreground">{conversation.account}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
            <Tag className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Lead Source</p>
            <p className="truncate text-xs font-medium text-foreground">{conversation.leadSource}</p>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
            <UserCog className="size-3.5 text-muted-foreground" />
            Assigned Counsellor
          </label>
          <Select value={conversation.assignedTo} onChange={(e) => onAssigneeChange(e.target.value)} className="text-xs">
            {counsellors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold text-foreground">Conversation Status</label>
          <div className="flex flex-wrap gap-1.5">
            {conversationStatuses.map((s) => {
              const active = conversation.status === s;
              const sStyle = conversationStatusStyles[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(s)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-all",
                    active ? cn(sStyle.bg, sStyle.text, "border-transparent") : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", sStyle.dot)} />
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
