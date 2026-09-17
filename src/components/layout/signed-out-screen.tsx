"use client";

import Image from "next/image";
import { LogIn } from "lucide-react";
import { useUser } from "@/components/layout/user-context";
import { initialsFor } from "@/lib/utils";

export function SignedOutScreen() {
  const { user, signIn } = useUser();

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <Image width={106} height={48} src="/logo.svg" alt="Lead2Enrolment CRM" className="h-10 w-auto" />

      <div className="flex flex-col items-center gap-2">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary">
          {initialsFor(user.name)}
        </span>
        <h1 className="text-lg font-bold tracking-tight text-foreground">You&apos;ve signed out</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          {user.name}, you&apos;ll need to sign back in to access L2E CRM.
        </p>
      </div>

      <button
        type="button"
        onClick={signIn}
        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary-hover active:scale-95"
      >
        <LogIn className="size-4" />
        Sign back in
      </button>
    </div>
  );
}
