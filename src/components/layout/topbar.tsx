"use client";

import { useTheme } from "next-themes";
import { Menu, Moon, Sun } from "lucide-react";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MessagesDropdown } from "@/components/layout/messages-dropdown";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { useUser } from "@/components/layout/user-context";

export function Topbar({ onMobileMenu }: { onMobileMenu: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { user } = useUser();
  const firstName = user.name.split(" ")[0];

  return (
    <header className="sticky top-0 z-20 flex min-h-20 shrink-0 items-center gap-2 border-b border-border bg-surface/70 px-4 py-3 backdrop-blur-xl sm:gap-3 sm:px-6">
      <button
        onClick={onMobileMenu}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground md:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Overview
        </p>
        <h1 className="text-base font-bold leading-tight tracking-tight sm:text-2xl">
          Welcome back, {firstName}
        </h1>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <GlobalSearch />

        <div className="flex items-center gap-0.5 rounded-full border border-border bg-surface-muted p-1">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            aria-label="Toggle theme"
          >
            <Sun className="theme-icon-dark size-[17px]" />
            <Moon className="theme-icon-light size-[17px]" />
          </button>

          <MessagesDropdown />
          <NotificationBell />
        </div>

        <ProfileMenu />
      </div>
    </header>
  );
}
