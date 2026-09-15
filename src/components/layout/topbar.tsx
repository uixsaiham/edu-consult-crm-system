"use client";

import { useTheme } from "next-themes";
import { Bell, Menu, MessageCircle, Moon, Search, Sun } from "lucide-react";

export function Topbar({ onMobileMenu }: { onMobileMenu: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();

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
          Welcome back, Sadman
        </h1>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="relative hidden lg:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            aria-label="Search leads and applications"
            placeholder="Search leads, applications..."
            className="w-64 rounded-full border border-border bg-surface-muted py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>

        <div className="flex items-center gap-0.5 rounded-full border border-border bg-surface-muted p-1">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            aria-label="Toggle theme"
          >
            <Sun className="theme-icon-dark size-[17px]" />
            <Moon className="theme-icon-light size-[17px]" />
          </button>

          <button
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            aria-label="Messages"
          >
            <MessageCircle className="size-[17px]" />
          </button>

          <button
            className="relative flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-[17px]" />
            <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-danger ring-2 ring-surface-muted" />
          </button>
        </div>
      </div>
    </header>
  );
}
