"use client";

import { useTheme } from "next-themes";
import { Bell, Menu, MessageCircle, Moon, Search, Sun } from "lucide-react";

export function Topbar({ onMobileMenu }: { onMobileMenu: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={onMobileMenu}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground md:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <div>
        <h1 className="text-base font-semibold leading-tight tracking-tight sm:text-lg">
          Welcome back, Sadman
        </h1>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Here&apos;s what&apos;s happening across your pipeline today.
        </p>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="relative hidden lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads, applications..."
            className="w-64 rounded-lg border border-border bg-surface-muted py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          aria-label="Toggle theme"
        >
          <Sun className="theme-icon-dark size-[18px]" />
          <Moon className="theme-icon-light size-[18px]" />
        </button>

        <button
          className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          aria-label="Messages"
        >
          <MessageCircle className="size-[18px]" />
        </button>

        <button
          className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-[18px]" />
          <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-danger ring-2 ring-surface" />
        </button>

        <div className="ml-1 flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          SR
        </div>
      </div>
    </header>
  );
}
