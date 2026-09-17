"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { navSections } from "./nav-items";
import { useUser } from "./user-context";
import { cn, initialsFor } from "@/lib/utils";

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, openProfile } = useUser();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-surface shadow-xl">
        <div className="flex h-20 shrink-0 items-center gap-2.5 px-5">
          <Image width={106} height={48} src="/logo.svg" alt="Lead2Enrolment CRM" className="h-8 w-auto shrink-0" />
          <button
            onClick={onClose}
            className="ml-auto flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <div className="flex flex-col gap-5">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.label}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {section.items.map((item) => {
                    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
                            active
                              ? "bg-primary-soft text-primary"
                              : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                          )}
                        >
                          <Icon className="size-[18px] shrink-0" />
                          <span className="truncate">{item.label}</span>
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
            onClick={() => {
              onClose();
              openProfile();
            }}
            className="flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left transition-colors hover:bg-surface-hover"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initialsFor(user.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user.role}</span>
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
}
