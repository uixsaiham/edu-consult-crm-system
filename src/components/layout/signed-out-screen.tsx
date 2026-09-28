"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useUser } from "@/components/layout/user-context";
import { UserAvatar } from "./avatar";
import { buttonPrimary } from "@/components/ui/button-styles";
import { fieldClass } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

/**
 * Shown after logging out. The CRM has no real authentication yet, so any password signs
 * back in as the same person — the form is here so the flow matches what staff will use.
 */
export function SignedOutScreen() {
  const { user, signIn } = useUser();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [tried, setTried] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (password) signIn();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="card-shadow flex w-full max-w-sm flex-col gap-5 rounded-3xl border border-border bg-surface p-7">
        <Image width={106} height={48} src="/logo.svg" alt="BHE Uni CRM" className="h-9 w-auto self-center" />
        <div className="flex flex-col items-center gap-2 text-center">
          <UserAvatar user={user} size="lg" showStatus={false} />
          <h1 className="text-lg font-semibold tracking-tight text-foreground">You&apos;ve logged out</h1>
          <p className="text-sm text-muted-foreground">Sign back in as <span className="font-medium text-foreground">{user.email}</span></p>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-foreground">Password</span>
          <span className="relative">
            <input type={show ? "text" : "password"} autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={cn(fieldClass, "pr-10")} />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </span>
          {tried && !password && <span className="text-[11px] font-medium text-danger">Enter your password</span>}
        </label>
        <button type="submit" className={cn(buttonPrimary, "w-full justify-center")}><LogIn className="size-4" /> Sign in</button>
        <p className="text-center text-[11px] text-muted-foreground">Demo build: any password signs you back in. Real sign-in with two-factor codes arrives with the CRM backend.</p>
      </form>
    </div>
  );
}
