"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { ConversationList } from "@/components/whatsapp/conversation-list";
import { ChatThread } from "@/components/whatsapp/chat-thread";
import { ContactPanel } from "@/components/whatsapp/contact-panel";
import {
  getConversations,
  type ChatMessage,
  type Conversation,
  type ConversationStatus,
} from "@/lib/mock/whatsapp";

export default function WhatsAppWorkspacePage() {
  const [conversations, setConversations] = useState<Conversation[]>(getConversations);
  const [selectedId, setSelectedId] = useState<string | null>(() => getConversations()[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | "">("");
  const [showInfo, setShowInfo] = useState(false);

  const filtered = useMemo(() => {
    let list = conversations;
    if (statusFilter) list = list.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) => c.contactName.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
      );
    }
    return list;
  }, [conversations, search, statusFilter]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  function selectConversation(id: string) {
    setSelectedId(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    setShowInfo(false);
  }

  function handleSend(text: string) {
    if (!selectedId) return;
    const message: ChatMessage = {
      id: `MSG-${Date.now()}`,
      direction: "out",
      text,
      time: new Date().toISOString(),
      sender: "You",
      status: "sent",
    };
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, messages: [...c.messages, message] } : c))
    );
  }

  function handleStatusChange(status: ConversationStatus) {
    if (!selectedId) return;
    setConversations((prev) => prev.map((c) => (c.id === selectedId ? { ...c, status } : c)));
  }

  function handleAssigneeChange(assignedTo: string) {
    if (!selectedId) return;
    setConversations((prev) => prev.map((c) => (c.id === selectedId ? { ...c, assignedTo } : c)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">WhatsApp Workspace</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Reply to leads and students across connected WhatsApp accounts.
        </p>
      </div>

      <div className="grid h-[calc(100dvh-13.5rem)] min-h-[520px] grid-cols-1 overflow-hidden rounded-3xl border border-border bg-surface card-shadow md:grid-cols-[300px_1fr] lg:grid-cols-[300px_1fr_280px]">
        <div className="min-h-0 border-b border-border md:border-b-0 md:border-r">
          <ConversationList
            conversations={filtered}
            selectedId={selectedId}
            onSelect={selectConversation}
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        <div className="min-h-0">
          {selected ? (
            <ChatThread
              key={selected.id}
              conversation={selected}
              onSend={handleSend}
              onToggleInfo={() => setShowInfo((v) => !v)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <MessageSquare className="size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">Select a conversation to start replying</p>
            </div>
          )}
        </div>

        {selected && (
          <div
            className={`min-h-0 border-t border-border md:border-t-0 md:border-l ${
              showInfo ? "block md:col-span-2 lg:col-span-1" : "hidden lg:block"
            }`}
          >
            <ContactPanel
              conversation={selected}
              onStatusChange={handleStatusChange}
              onAssigneeChange={handleAssigneeChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
