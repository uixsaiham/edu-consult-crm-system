"use client";

import { useRef, useState } from "react";
import { LogOut, User } from "lucide-react";
import { useUser } from "@/components/layout/user-context";
import { Tooltip } from "@/components/ui/tooltip";
import { useClickOutside } from "@/lib/use-click-outside";
import { initialsFor } from "@/lib/utils";

export function ProfileMenu() {
  const { user, openProfile, signOut } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div ref={ref} className="relative">
      <Tooltip label="Account" hidden={open} align="end">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Account menu"
          aria-expanded={open}
          className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground transition-transform active:scale-95"
        >
          {initialsFor(user.name)}
          <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-surface bg-success" />
        </button>
      </Tooltip>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl animate-fade-in">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {initialsFor(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="p-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openProfile();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              <User className="size-4 text-muted-foreground" />
              My Profile
            </button>
          </div>

          <div className="border-t border-border p-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
