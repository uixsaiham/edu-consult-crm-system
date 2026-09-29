"use client";

export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useParams } from "next/navigation";
import { SearchX } from "lucide-react";
import { InstitutionForm } from "@/components/institutions/institution-form";
import { buttonSecondary } from "@/components/ui/button-styles";
import { getInstitution } from "@/lib/mock/institution-store";

export default function EditInstitutionPage() {
  const { id } = useParams<{ id: string }>();
  const record = getInstitution(id);

  if (!record) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-hover text-muted-foreground">
          <SearchX className="size-6" />
        </span>
        <h2 className="text-lg font-semibold text-foreground">Institution not found</h2>
        <p className="text-sm text-muted-foreground">It may have been removed, or the link is incorrect.</p>
        <Link href="/institutions" className={buttonSecondary}>
          Back to institutions
        </Link>
      </div>
    );
  }

  return <InstitutionForm key={record.id} record={record} />;
}
