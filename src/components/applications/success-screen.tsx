"use client";

import Link from "next/link";
import { CheckCircle2, FilePlus2, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";

export function SuccessScreen({
  referenceId,
  applicantName,
  onReset,
}: {
  referenceId: string;
  applicantName: string;
  onReset: () => void;
}) {
  return (
    <Card className="flex flex-col items-center gap-5 px-6 py-16 text-center sm:px-10">
      <span className="flex size-16 items-center justify-center rounded-full bg-success text-white shadow-[0_10px_30px_-8px_rgba(69,195,72,0.55)]">
        <CheckCircle2 className="size-8" />
      </span>
      <div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">Application Submitted!</h3>
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
          {applicantName ? `${applicantName}'s` : "The"} application has been created and sent into the intake
          pipeline for review.
        </p>
      </div>

      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-4 py-1.5 text-xs font-semibold text-foreground">
        Reference
        <span className="font-mono text-primary">{referenceId}</span>
      </span>

      <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
        <Link
          href="/applications"
          className={buttonPrimary}
        >
          <ListChecks className="size-4" />
          View Applications
        </Link>
        <button
          type="button"
          onClick={onReset}
          className={buttonSecondary}
        >
          <FilePlus2 className="size-4" />
          Add Another Application
        </button>
      </div>
    </Card>
  );
}
