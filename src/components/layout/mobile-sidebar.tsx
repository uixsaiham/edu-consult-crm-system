"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { isNavItemActive } from "./nav-items";
import { useMenu } from "./use-menu";
import { AccountMenu } from "./account-menu";
import { cn } from "@/lib/utils";

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFullPath = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
  const sections = useMenu();
  const allNavItems = sections.flatMap((section) => section.items);

  const activeParentLabel =
    allNavItems.find(
      (item) => item.children && isNavItemActive(item, pathname)
    )?.label ?? null;

  const [manualExpanded, setManualExpanded] = useState<string | null>(activeParentLabel);
  const [syncedFor, setSyncedFor] = useState(activeParentLabel);
  let expanded = manualExpanded;
  if (activeParentLabel !== syncedFor) {
    setSyncedFor(activeParentLabel);
    if (activeParentLabel) {
      expanded = activeParentLabel;
      setManualExpanded(activeParentLabel);
    }
  }

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
            {sections.map((section) => (
              <div key={section.key}>
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.label}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {section.items.map((item) => {
                    const active = isNavItemActive(item, pathname);
                    const Icon = item.icon;
                    const hasChildren = !!item.children?.length;
                    const isOpen = hasChildren && expanded === item.label;

                    return (
                      <li key={item.href}>
                        <div className="flex items-center gap-0.5">
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            onClick={onClose}
                            className={cn(
                              "flex flex-1 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-all active:scale-[0.97]",
                              active
                                ? "bg-primary-soft text-primary"
                                : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                            )}
                          >
                            <Icon className="size-[18px] shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                          {hasChildren && (
                            <button
                              type="button"
                              onClick={() => setManualExpanded(isOpen ? null : item.label)}
                              aria-label={isOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
                              aria-expanded={isOpen}
                              className="flex size-7 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all active:scale-90 hover:bg-surface-hover hover:text-foreground"
                            >
                              <ChevronDown
                                className={cn("size-3.5 transition-transform duration-200", isOpen && "rotate-180")}
                              />
                            </button>
                          )}
                        </div>

                        {hasChildren && (
                          <div
                            className={cn(
                              "grid transition-[grid-template-rows] duration-300 ease-out",
                              isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                            )}
                          >
                            <div className="overflow-hidden">
                              <ul
                                className={cn(
                                  "ml-[26px] mt-1 mb-1 flex flex-col transition-opacity duration-200",
                                  isOpen ? "opacity-100 delay-100" : "opacity-0"
                                )}
                              >
                                {item.children!.map((sub, idx) => {
                                  const subActive = sub.href === currentFullPath;
                                  const isLast = idx === item.children!.length - 1;
                                  return (
                                    <li key={sub.href} className="relative">
                                      <span
                                        aria-hidden
                                        className={cn(
                                          "absolute left-2 top-0 w-3 rounded-bl-lg border-b border-l border-border",
                                          isLast ? "h-1/2" : "h-[calc(50%+1px)]"
                                        )}
                                      />
                                      {!isLast && (
                                        <span aria-hidden className="absolute left-2 top-1/2 h-1/2 w-px bg-border" />
                                      )}
                                      <Link
                                        href={sub.href}
                                        aria-current={subActive ? "page" : undefined}
                                        onClick={onClose}
                                        className={cn(
                                          "group ml-6 flex items-center gap-2 rounded-xl px-2.5 py-1.5 my-0.5 text-[13px] transition-all active:scale-[0.97]",
                                          subActive
                                            ? "bg-primary-soft font-semibold text-primary"
                                            : "font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                                        )}
                                      >
                                        <span className="flex-1 truncate">{sub.label}</span>
                                        {sub.badge && (
                                          <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                            {sub.badge}
                                          </span>
                                        )}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>
        <div className="border-t border-border p-3">
          <AccountMenu placement="sidebar" onNavigate={onClose} />
        </div>
      </aside>
    </div>
  );
}
