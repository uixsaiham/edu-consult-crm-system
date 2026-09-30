"use client";

import { useTheme } from "next-themes";
import { Menu, Moon, Sun } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MessagesDropdown } from "@/components/layout/messages-dropdown";
import { AccountMenu } from "@/components/layout/account-menu";
import { FollowUpMenu, MeetingMenu, NotesMenu } from "@/components/layout/quick-actions";
import { useUser } from "@/components/layout/user-context";

export function Topbar({ onMobileMenu }: { onMobileMenu: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { user } = useUser();
  const firstName = user.name.split(" ")[0];

  return (
    <header className="sticky top-0 z-20 flex min-h-16 shrink-0 items-center gap-2 border-b border-border bg-surface/70 px-4 py-2 sm:min-h-20 sm:py-3 backdrop-blur-xl sm:gap-3 sm:px-6">
      <button
        onClick={onMobileMenu}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground md:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0">
        <p className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 sm:block">
          Overview
        </p>
        <h1 className="truncate text-base font-bold leading-tight tracking-tight sm:text-2xl">
          <span className="sm:hidden">Hi, {firstName}</span>
          <span className="hidden sm:inline">Welcome back, {firstName}</span>
        </h1>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <GlobalSearch />

        <div className="hidden items-center gap-0.5 rounded-full border border-border bg-surface-muted p-1 sm:flex">
          <FollowUpMenu />
          <MeetingMenu />
          <NotesMenu />
        </div>

        <div className="flex items-center gap-0.5 rounded-full border border-border bg-surface-muted p-1">
          <Tooltip label="Toggle theme">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              aria-label="Toggle theme"
            >
              <Sun className="theme-icon-dark size-[17px]" />
              <Moon className="theme-icon-light size-[17px]" />
            </button>
          </Tooltip>

          <MessagesDropdown />
          <NotificationBell />
        </div>

        <AccountMenu placement="topbar" />
      </div>
    </header>
  );
}
