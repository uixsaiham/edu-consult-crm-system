"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronsLeft, ChevronsRight } from "lucide-react";
import { isNavItemActive } from "./nav-items";
import { useMenu } from "./use-menu";
import { AccountMenu } from "./account-menu";
import { cn } from "@/lib/utils";

type SidebarProps = { collapsed: boolean; onToggle: () => void };

// useSearchParams needs a Suspense boundary for static prerendering. The fallback is the same
// sidebar without the query string, so the server HTML still has the full navigation.
export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<SidebarView {...props} search="" />}>
      <SidebarWithSearch {...props} />
    </Suspense>
  );
}

function SidebarWithSearch(props: SidebarProps) {
  return <SidebarView {...props} search={useSearchParams().toString()} />;
}

function SidebarView({ collapsed, onToggle, search }: SidebarProps & { search: string }) {
  const pathname = usePathname();
  const currentFullPath = search ? `${pathname}?${search}` : pathname;
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

  return (
    <aside
      className={cn(
        "relative z-30 hidden md:flex h-full shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 ease-out",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {collapsed ? (
        <>
          <div className="flex h-16 shrink-0 items-center justify-center">
            <Image width={33} height={49} src="/logo-icon.svg" alt="Lead2Enrolment CRM" className="h-8 w-auto shrink-0" />
          </div>
          <button
            onClick={onToggle}
            className="absolute -right-3.5 top-[18px] z-10 flex size-7 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-sm transition-all hover:scale-105 hover:bg-surface-hover active:scale-95"
            aria-label="Expand sidebar"
            aria-expanded={false}
          >
            <ChevronsRight className="size-3.5" />
          </button>
        </>
      ) : (
      <div className="flex h-20 shrink-0 items-center gap-2.5 px-5">
        <Image width={106} height={48} src="/logo.svg" alt="Lead2Enrolment CRM" className="h-8 w-auto shrink-0" />
        <button
          onClick={onToggle}
          className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          aria-label="Collapse sidebar"
          aria-expanded
        >
          <ChevronsLeft className="size-4" />
        </button>
      </div>
      )}

      <nav className={cn("flex-1 overflow-y-auto", collapsed ? "no-scrollbar py-1" : "px-3 py-3")}>
        <div className={cn("flex flex-col", collapsed ? "gap-1" : "gap-6")}>
          {sections.map((section) => (
            <div key={section.key}>
              {!collapsed && (
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.label}
                </p>
              )}
              <ul className={cn("flex flex-col", collapsed ? "items-center gap-1" : "gap-0.5")}>
                {section.items.map((item) => {
                  const active = isNavItemActive(item, pathname);
                  const Icon = item.icon;
                  const hasChildren = !collapsed && !!item.children?.length;
                  const isOpen = hasChildren && expanded === item.label;

                  return (
                    <li key={item.href} className="relative">
                      {active && !collapsed && (
                        <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all" />
                      )}
                      <div className="flex items-center gap-0.5">
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            "group flex items-center text-sm font-medium transition-all active:scale-[0.97]",
                            collapsed
                              ? "size-10 justify-center rounded-xl"
                              : "flex-1 gap-3 rounded-2xl px-3 py-2",
                            active
                              ? "bg-primary-soft text-primary"
                              : collapsed
                                ? "text-foreground/70 hover:bg-surface-hover hover:text-foreground"
                                : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-[18px] shrink-0",
                              collapsed && "size-5 stroke-[1.6]",
                              active
                                ? "text-primary"
                                : collapsed
                                  ? "text-foreground/70 group-hover:text-foreground"
                                  : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                        {hasChildren && (
                          <button
                            type="button"
                            onClick={() => setManualExpanded(isOpen ? null : item.label)}
                            aria-label={isOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
                            aria-expanded={isOpen}
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-xl transition-all active:scale-90",
                              active
                                ? "text-primary hover:bg-primary-soft"
                                : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                            )}
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

      <div className={cn("p-3", !collapsed && "border-t border-border")}>
        <AccountMenu placement={collapsed ? "sidebar-collapsed" : "sidebar"} />
      </div>
    </aside>
  );
}
