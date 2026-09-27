"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { SearchX } from "lucide-react";
import { AgentForm } from "@/components/agents/agent-form";
import { buttonSecondary } from "@/components/ui/button-styles";
import { getAgent } from "@/lib/mock/agents";

export default function EditAgentPage() {
  const { id } = useParams<{ id: string }>();
  const agent = getAgent(id);

  if (!agent) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-hover text-muted-foreground">
          <SearchX className="size-6" />
        </span>
        <h2 className="text-lg font-semibold text-foreground">Agent not found</h2>
        <p className="text-sm text-muted-foreground">They may have been removed, or the link is incorrect.</p>
        <Link href="/agent-management" className={buttonSecondary}>
          Back to agents
        </Link>
      </div>
    );
  }

  return <AgentForm key={agent.id} agent={agent} />;
}
