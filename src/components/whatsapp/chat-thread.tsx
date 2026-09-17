"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Info, Paperclip, Send, Smile } from "lucide-react";
import { conversationStatusStyles, type ChatMessage, type Conversation } from "@/lib/mock/whatsapp";
import { cn } from "@/lib/utils";

function formatBubbleTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDayLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function groupByDay(messages: ChatMessage[]) {
  const groups: { label: string; messages: ChatMessage[] }[] = [];
  for (const m of messages) {
    const label = formatDayLabel(m.time);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) lastGroup.messages.push(m);
    else groups.push({ label, messages: [m] });
  }
  return groups;
}

export function ChatThread({
  conversation,
  onSend,
  onToggleInfo,
}: {
  conversation: Conversation;
  onSend: (text: string) => void;
  onToggleInfo?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [conversation.id, conversation.messages.length]);

  const status = conversationStatusStyles[conversation.status];

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
            {conversation.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{conversation.contactName}</p>
            <p className="truncate text-[11px] text-muted-foreground">{conversation.phone}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", status.bg, status.text)}>
            <span className={cn("size-1.5 rounded-full", status.dot)} />
            {conversation.status}
          </span>
          {onToggleInfo && (
            <button
              type="button"
              onClick={onToggleInfo}
              aria-label="Toggle contact details"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground lg:hidden"
            >
              <Info className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          {groupByDay(conversation.messages).map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <div className="flex justify-center">
                <span className="rounded-full bg-surface-muted px-3 py-1 text-[10px] font-semibold text-muted-foreground">
                  {group.label}
                </span>
              </div>
              {group.messages.map((m) => (
                <div key={m.id} className={cn("flex", m.direction === "out" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs",
                      m.direction === "out"
                        ? "rounded-br-md bg-success-soft text-foreground"
                        : "rounded-bl-md bg-surface-muted text-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      {m.direction === "out" && m.sender && (
                        <span className="text-[10px] text-muted-foreground/70">{m.sender} · </span>
                      )}
                      <span className="text-[10px] text-muted-foreground/70">{formatBubbleTime(m.time)}</span>
                      {m.direction === "out" &&
                        (m.status === "read" ? (
                          <CheckCheck className="size-3 text-primary" />
                        ) : m.status === "delivered" ? (
                          <CheckCheck className="size-3 text-muted-foreground/70" />
                        ) : (
                          <Check className="size-3 text-muted-foreground/70" />
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-end gap-2">
          <button
            type="button"
            aria-label="Attach file"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <Paperclip className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Insert emoji"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <Smile className="size-4" />
          </button>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="max-h-28 min-h-9 flex-1 resize-none rounded-2xl border border-border bg-surface-muted px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            aria-label="Send message"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs transition-all hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
