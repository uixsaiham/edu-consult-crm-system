"use client";

// Sidebar menu configuration (Settings › Menu Settings) and which roles see which entries
// (Settings › Menu Permission Settings). The sidebar renders resolveMenu(...) for the signed-in role.

import { navSections, type NavItem, type NavSection, type NavSubItem } from "@/components/layout/nav-items";
import { getRoles, type PermissionModule, type Role } from "@/lib/mock/staff";
import { createSettingsStore } from "./store";

/** Stable keys: a top-level item is its href; a sub-item is "parentHref > childHref". */
export const itemKey = (item: Pick<NavItem, "href">) => item.href;
export const childKey = (item: Pick<NavItem, "href">, sub: Pick<NavSubItem, "href">) => `${item.href} > ${sub.href}`;

export interface MenuConfig {
  sectionOrder: string[];
  sectionLabels: Record<string, string>;
  /** Item keys per (original) section label, in display order. */
  itemOrder: Record<string, string[]>;
  /** Sub-item keys per item key, in display order. */
  childOrder: Record<string, string[]>;
  labels: Record<string, string>;
  hidden: string[];
  /** Badge override per sub-item key; "" removes the default badge. */
  badges: Record<string, string>;
}

export const emptyMenuConfig: MenuConfig = { sectionOrder: [], sectionLabels: {}, itemOrder: {}, childOrder: {}, labels: {}, hidden: [], badges: {} };
export const menuStore = createSettingsStore<MenuConfig>("bhe-crm:menu-config", emptyMenuConfig);

/** Orders `list` by `order` (keys), keeping anything new at its default position at the end. */
function ordered<T>(list: T[], key: (t: T) => string, order?: string[]) {
  if (!order?.length) return list;
  const rank = new Map(order.map((k, i) => [k, i]));
  return [...list].sort((a, b) => (rank.get(key(a)) ?? 999 + list.indexOf(a)) - (rank.get(key(b)) ?? 999 + list.indexOf(b)));
}

/** Default menu entries mapped to the role permission module that governs them. */
const moduleFor: Record<string, PermissionModule> = {
  "/": "Dashboard",
  "/leads": "Leads",
  "/applications": "Applications",
  "/whatsapp-workspace": "Communications",
  "/countries": "Institutions & courses",
  "/institutions": "Institutions & courses",
  "/courses": "Institutions & courses",
  "/office": "Dashboard",
  "/people": "People",
  "/agent-management": "Agents",
  "/target-setup": "Reports",
  "/finance": "Finance",
  "/bhe-training": "Dashboard",
  "/archived": "Leads",
  "/settings": "Settings",
};
const childModule: Record<string, PermissionModule> = {
  "/performance/branches": "Reports",
  "/performance/counsellors": "Reports",
  "/performance/agents": "Reports",
  "/performance/institutions": "Reports",
  "/performance/lead-sources": "Reports",
  "/archived/applications": "Applications",
  "/archived/agent-applications": "Agents",
  "/leads/export": "Leads",
};

export const moduleOfKey = (key: string): PermissionModule => {
  const [parent, child] = key.split(" > ");
  return (child && childModule[child]) || moduleFor[parent] || "Dashboard";
};

/** Visible to a role by default when the role can view the module behind the entry. */
export const defaultVisible = (role: Role, key: string) => role.id === "super-admin" || role.permissions[moduleOfKey(key)].includes("View");

/** Entries a role can never lose — so nobody locks the Super Admin out of Settings. */
export const lockedFor = (role: Role, key: string) => role.id === "super-admin" && key.startsWith("/settings");

/** Per role: explicit show (true) / hide (false) overrides on top of the defaults. */
export type MenuPermissions = Record<string, Record<string, boolean>>;
export const menuPermissionStore = createSettingsStore<MenuPermissions>("bhe-crm:menu-permissions", {});

export function canSee(role: Role | undefined, key: string, perms: MenuPermissions) {
  if (!role) return true;
  if (lockedFor(role, key)) return true;
  return perms[role.id]?.[key] ?? defaultVisible(role, key);
}

export const roleForName = (name: string) => getRoles().find((r) => r.name === name);

/**
 * The sidebar as configured: order, labels, badges and hidden entries from Menu Settings,
 * then filtered to what `role` may see. An item whose sub-items are all hidden is dropped.
 */
export function resolveMenu(config: MenuConfig, perms: MenuPermissions, role?: Role, opts: { includeHidden?: boolean } = {}): (NavSection & { key: string })[] {
  const hidden = new Set(config.hidden);
  return ordered(navSections, (s) => s.label, config.sectionOrder)
    .map((section) => {
      const items = ordered(section.items, itemKey, config.itemOrder[section.label])
        .filter((item) => opts.includeHidden || (!hidden.has(itemKey(item)) && canSee(role, itemKey(item), perms)))
        .map((item) => {
          const children = item.children
            ? ordered(item.children, (c) => childKey(item, c), config.childOrder[itemKey(item)])
                .filter((c) => opts.includeHidden || (!hidden.has(childKey(item, c)) && canSee(role, childKey(item, c), perms)))
                .map((c) => {
                  const k = childKey(item, c);
                  const badge = k in config.badges ? config.badges[k] || undefined : c.badge;
                  return { ...c, label: config.labels[k] || c.label, badge };
                })
            : undefined;
          return { ...item, label: config.labels[itemKey(item)] || item.label, children };
        })
        .filter((item) => opts.includeHidden || !item.children || item.children.length > 0);
      return { key: section.label, label: config.sectionLabels[section.label] || section.label, items };
    })
    .filter((s) => opts.includeHidden || s.items.length > 0);
}
