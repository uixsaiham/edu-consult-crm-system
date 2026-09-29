"use client";

export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useParams } from "next/navigation";
import { SearchX } from "lucide-react";
import { StaffForm } from "@/components/people/staff-form";
import { buttonSecondary } from "@/components/ui/button-styles";
import { getStaffMember } from "@/lib/mock/staff";

export default function EditPersonPage() {
  const { id } = useParams<{ id: string }>();
  const person = getStaffMember(id);

  if (!person) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-hover text-muted-foreground">
          <SearchX className="size-6" />
        </span>
        <h2 className="text-lg font-semibold text-foreground">Person not found</h2>
        <p className="text-sm text-muted-foreground">They may have been removed, or the link is incorrect.</p>
        <Link href="/people" className={buttonSecondary}>
          Back to people
        </Link>
      </div>
    );
  }

  return <StaffForm key={person.id} person={person} />;
}
