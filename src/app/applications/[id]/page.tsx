"use client";

export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SearchX } from "lucide-react";
import { ApplicationDetails } from "@/components/applications/detail/application-details";
import { buttonSecondary } from "@/components/ui/button-styles";
import { getApplication, getApplications } from "@/lib/mock/applications";

export default function ApplicationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const app = getApplication(decodeURIComponent(id));

  if (!app) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-hover text-muted-foreground">
          <SearchX className="size-6" />
        </span>
        <h2 className="text-lg font-semibold text-foreground">Application not found</h2>
        <p className="text-sm text-muted-foreground">It may have been deleted, or the link is incorrect.</p>
        <Link href="/applications" className={buttonSecondary}>
          Back to applications
        </Link>
      </div>
    );
  }

  const counsellors = [...new Set(getApplications().map((a) => a.counsellor))].sort();
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading application…</p>}>
      <ApplicationDetails key={app.id} initial={app} allCounsellors={counsellors} />
    </Suspense>
  );
}
