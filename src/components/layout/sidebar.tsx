"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, Settings } from "lucide-react";
import { navSections } from "./nav-items";
import { useUser } from "./user-context";
import { cn, initialsFor } from "@/lib/utils";

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { user, openProfile } = useUser();

  return (
    <aside
      className={cn(
        "hidden md:flex h-full shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 ease-out",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className={cn("flex shrink-0 items-center gap-2.5", collapsed ? "flex-col px-3 py-4" : "h-20 px-5")}>
        {collapsed ? (
          <Image width={33} height={49} src="/logo-icon.svg" alt="Lead2Enrolment CRM" className="h-8 w-auto shrink-0" />
        ) : (
          <Image width={106} height={48} src="/logo.svg" alt="Lead2Enrolment CRM" className="h-8 w-auto shrink-0" />
        )}
        <button
          onClick={onToggle}
          className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground", !collapsed && "ml-auto")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          <ChevronsLeft
            className={cn("size-4 transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-6">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.label}
                </p>
              )}
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href} className="relative">
                      {active && (
                        <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                      )}
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary-soft text-primary"
                            : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-[18px] shrink-0",
                            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={openProfile}
          title={collapsed ? "My Profile" : undefined}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left transition-colors hover:bg-surface-hover",
            collapsed && "justify-center"
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initialsFor(user.name)}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{user.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{user.role}</span>
              </span>
              <Settings className="size-4 shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
