"use client";

export const dynamic = 'force-dynamic';

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Info, Lock, MoreHorizontal, RotateCcw, Save, Search, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { AnchoredMenu, MenuDivider, MenuItem, MenuLabel } from "@/components/applications/list/anchored-menu";
import { getRoles, getStaff, type Role } from "@/lib/mock/staff";
import { canSee, childKey, defaultVisible, itemKey, lockedFor, menuPermissionStore, menuStore, moduleOfKey, resolveMenu, roleForName, type MenuPermissions } from "@/lib/settings/menu";
import { logAudit } from "@/lib/settings/audit";
import { useSettingsStore } from "@/lib/settings/store";
import { cn } from "@/lib/utils";
import type { NavIcon } from "@/components/layout/nav-icons";

export default function MenuPermissionsPage() {
  const { user } = useUser();
  const roles = useMemo(() => getRoles(), []);
  const staffCount = useMemo(() => { const m = new Map<string, number>(); getStaff().forEach((s) => m.set(s.roleId, (m.get(s.roleId) ?? 0) + 1)); return m; }, []);
  const config = useSettingsStore(menuStore);
  const saved = useSettingsStore(menuPermissionStore);
  const [draft, setDraft] = useState<MenuPermissions | null>(null);
  const [search, setSearch] = useState("");
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [previewRole, setPreviewRole] = useState(roles[0].id);
  const [toast, notify] = useToast();

  const perms = draft ?? saved;
  const myRole = roleForName(user.role);
  const tree = useMemo(() => resolveMenu(config, {}, undefined, { includeHidden: true }), [config]);
  const globallyHidden = new Set(config.hidden);
  const selfKey = childKey({ href: "/settings" }, { href: "/settings/menu-permissions" });
  /** Your own role keeps this page and its parent, so you can't lock yourself out. */
  const isLocked = (role: Role, key: string) => lockedFor(role, key) || (role.id === myRole?.id && (key === "/settings" || key === selfKey));

  const set = (role: Role, keys: string[], visible: boolean) => {
    const next: MenuPermissions = structuredClone(perms);
    const r = (next[role.id] ??= {});
    for (const k of keys) {
      if (isLocked(role, k)) continue;
      if (visible === defaultVisible(role, k)) delete r[k];
      else r[k] = visible;
    }
    if (!Object.keys(r).length) delete next[role.id];
    setDraft(next);
  };
  const resetRole = (role: Role) => { const next = structuredClone(perms); delete next[role.id]; setDraft(next); };
  const copyRole = (to: Role, from: Role) => {
    const keys = tree.flatMap((s) => s.items.flatMap((i) => [itemKey(i), ...(i.children ?? []).map((c) => childKey(i, c))]));
    const next: MenuPermissions = structuredClone(perms);
    next[to.id] = {};
    for (const k of keys) { const v = canSee(from, k, perms); if (v !== defaultVisible(to, k) && !isLocked(to, k)) next[to.id][k] = v; }
    if (!Object.keys(next[to.id]).length) delete next[to.id];
    setDraft(next);
  };

  const q = search.trim().toLowerCase();
  const overridden = (key: string) => roles.some((r) => perms[r.id]?.[key] !== undefined);
  const rows = tree
    .map((s) => ({
      ...s,
      items: s.items
        .map((i) => ({ item: i, children: (i.children ?? []).filter((c) => (!q || `${i.label} ${c.label}`.toLowerCase().includes(q)) && (!onlyChanged || overridden(childKey(i, c)))) }))
        .filter(({ item, children }) => children.length > 0 || ((!q || item.label.toLowerCase().includes(q)) && (!onlyChanged || overridden(itemKey(item))))),
    }))
    .filter((s) => s.items.length);

  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(saved);
  const changeCount = roles.reduce((n, r) => n + Object.keys(perms[r.id] ?? {}).length, 0);

  const save = () => {
    const changes = roles.flatMap((r) => {
      const keys = new Set([...Object.keys(saved[r.id] ?? {}), ...Object.keys(perms[r.id] ?? {})]);
      return [...keys].filter((k) => canSee(r, k, saved) !== canSee(r, k, perms)).map((k) => ({ field: `${r.name} · ${labelFor(k)}`, from: canSee(r, k, saved) ? "Shown" : "Hidden", to: canSee(r, k, perms) ? "Shown" : "Hidden" }));
    });
    menuPermissionStore.set(perms);
    logAudit({ actor: user.name, role: user.role, module: "Settings", action: "Permission changed", entity: "Menu permissions", summary: `Changed menu access for ${new Set(changes.map((c) => c.field.split(" · ")[0])).size} role(s)`, changes, severity: "notice" });
    setDraft(null);
    notify(`${changes.length} menu permission${changes.length === 1 ? "" : "s"} saved`);
  };

  const labelFor = (key: string) => {
    for (const s of tree) for (const i of s.items) {
      if (itemKey(i) === key) return i.label;
      for (const c of i.children ?? []) if (childKey(i, c) === key) return `${i.label} › ${c.label}`;
    }
    return key;
  };

  const preview = resolveMenu(config, perms, roles.find((r) => r.id === previewRole));

  return (
    <div className="flex flex-col gap-4 pb-20">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Menu Permission Settings</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Choose which sidebar entries each role sees. Defaults follow each role&apos;s module access; ticks that differ from the default are marked. What a role can do inside a page is set in <Link href="/people/roles" className="font-semibold text-primary hover:underline">People › Role</Link>.</p>
        </div>
        <Link href="/settings/menu" className={buttonSecondary}><SlidersHorizontal className="size-4" /> Menu settings</Link>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 card-shadow">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a menu entry…" aria-label="Find a menu entry" className="h-9 w-60 rounded-lg border border-border bg-surface pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
        </label>
        <button type="button" aria-pressed={onlyChanged} onClick={() => setOnlyChanged(!onlyChanged)} className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium", onlyChanged ? "border-primary bg-primary-soft text-primary" : "border-border text-foreground hover:bg-surface-hover")}>
          Only changed from default <span className="rounded-full bg-surface-hover px-1.5 text-[10px] tabular-nums">{changeCount}</span>
        </button>
        {(search || onlyChanged) && <button type="button" onClick={() => { setSearch(""); setOnlyChanged(false); }} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground"><RotateCcw className="size-3.5" /> Reset</button>}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="overflow-hidden">
          <div className="max-h-[calc(100vh-14rem)] overflow-auto">
            <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-left text-xs">
              <thead className="text-[11px] font-semibold text-muted-foreground">
                <tr>
                  <th className="sticky left-0 top-0 z-30 min-w-64 border-b border-border bg-surface-muted px-4 py-2.5 uppercase tracking-wide">Menu entry</th>
                  {roles.map((r) => (
                    <th key={r.id} className="sticky top-0 z-20 border-b border-border bg-surface-muted px-2 py-2 text-center align-bottom">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn("size-2 rounded-full", r.color)} />
                        <span className="w-20 text-[11px] font-semibold leading-tight text-foreground">{r.name}</span>
                        <span className="text-[10px] font-normal text-muted-foreground">{staffCount.get(r.id) ?? 0} staff</span>
                        <AnchoredMenu label={`Options for ${r.name}`} align="end" width={200} trigger={<MoreHorizontal className="size-3.5" />} triggerClassName="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-hover hover:text-foreground">
                          {(close) => (
                            <>
                              <MenuItem icon={Eye} onClick={() => { close(); setPreviewRole(r.id); }}>Preview menu</MenuItem>
                              <MenuItem icon={RotateCcw} onClick={() => { close(); resetRole(r); }}>Reset to role default</MenuItem>
                              <MenuDivider />
                              <MenuLabel>Copy menu from</MenuLabel>
                              {roles.filter((x) => x.id !== r.id).map((x) => <MenuItem key={x.id} onClick={() => { close(); copyRole(r, x); }}>{x.name}</MenuItem>)}
                            </>
                          )}
                        </AnchoredMenu>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <Fragment key={s.key}>
                    <tr>
                      <td colSpan={roles.length + 1} className="sticky left-0 border-b border-border bg-surface px-4 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">{s.label}</td>
                    </tr>
                    {s.items.map(({ item, children }) => {
                      const k = itemKey(item);
                      const allKeys = [k, ...(item.children ?? []).map((c) => childKey(item, c))];
                      return (
                        <Fragment key={k}>
                          <Row
                            label={item.label}
                            icon={item.icon}
                            note={globallyHidden.has(k) ? "Hidden for everyone in Menu Settings" : `Module: ${moduleOfKey(k)}`}
                            dim={globallyHidden.has(k)}
                            roles={roles}
                            state={(r) => ({ on: canSee(r, k, perms), changed: perms[r.id]?.[k] !== undefined, locked: isLocked(r, k) })}
                            onToggle={(r, v) => set(r, v ? [k] : allKeys, v)}
                            strong
                          />
                          {children.map((c) => {
                            const ck = childKey(item, c);
                            return (
                              <Row
                                key={ck}
                                label={c.label}
                                note={globallyHidden.has(ck) ? "Hidden for everyone" : undefined}
                                dim={globallyHidden.has(ck) || globallyHidden.has(k)}
                                roles={roles}
                                state={(r) => ({ on: canSee(r, ck, perms), changed: perms[r.id]?.[ck] !== undefined, locked: isLocked(r, ck), parentOff: !canSee(r, k, perms) })}
                                onToggle={(r, v) => set(r, v ? [k, ck] : [ck], v)}
                              />
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {!rows.length && <p className="px-6 py-14 text-center text-sm text-muted-foreground">No menu entries match.</p>}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent" /> Changed from the role&apos;s default</span>
            <span className="inline-flex items-center gap-1.5"><Lock className="size-3" /> Can&apos;t be removed (Super Admin&apos;s Settings, and your own access to this page)</span>
          </div>
        </Card>

        <aside className="2xl:sticky 2xl:top-4">
          <Card className="p-4">
            <p className="text-xs font-semibold text-foreground">Preview as</p>
            <select value={previewRole} onChange={(e) => setPreviewRole(e.target.value)} aria-label="Preview role" className="mt-2 h-9 w-full rounded-lg border border-border bg-surface px-2 text-xs text-foreground">
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <div className="mt-3 max-h-[60vh] overflow-y-auto rounded-2xl border border-border p-2">
              {preview.map((s) => (
                <div key={s.key} className="mb-3">
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{s.label}</p>
                  {s.items.map((i) => (
                    <div key={i.href}>
                      <p className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-foreground"><i.icon className="size-3.5 text-muted-foreground" />{i.label}</p>
                      {i.children?.map((ch) => <p key={ch.href} className="ml-7 py-0.5 text-[11px] text-muted-foreground">{ch.label}</p>)}
                    </div>
                  ))}
                </div>
              ))}
              {!preview.length && <p className="px-2 py-6 text-center text-xs text-muted-foreground">This role would see an empty menu.</p>}
            </div>
            <p className="mt-3 flex gap-1.5 text-[11px] text-muted-foreground"><Info className="mt-0.5 size-3 shrink-0" />Hiding a menu entry isn&apos;t a security control on its own — page access is also checked against the role&apos;s module permissions.</p>
          </Card>
        </aside>
      </div>

      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.25)] backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Unsaved permission changes.</span> Staff see the new menu the next time their sidebar loads.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDraft(null)} className={buttonSecondary}>Discard</button>
              <button type="button" onClick={save} className={buttonPrimary}><Save className="size-4" /> Save permissions</button>
            </div>
          </div>
        </div>
      )}
      {toast}
    </div>
  );
}

function Row({ label, icon: Icon, note, dim, strong, roles, state, onToggle }: {
  label: string; icon?: NavIcon; note?: string; dim?: boolean; strong?: boolean; roles: Role[];
  state: (r: Role) => { on: boolean; changed: boolean; locked: boolean; parentOff?: boolean }; onToggle: (r: Role, v: boolean) => void;
}) {
  return (
    <tr className="group">
      <td className={cn("sticky left-0 z-10 border-b border-border bg-surface px-4 py-2 group-hover:bg-surface-muted", !strong && "pl-11")}>
        <span className={cn("flex items-center gap-2", dim && "opacity-50")}>
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
          <span>
            <span className={cn("block", strong ? "text-sm font-medium text-foreground" : "text-[13px] text-foreground")}>{label}</span>
            {note && <span className="block text-[10px] text-muted-foreground">{note}</span>}
          </span>
        </span>
      </td>
      {roles.map((r) => {
        const st = state(r);
        return (
          <td key={r.id} className="border-b border-border px-2 py-2 text-center group-hover:bg-surface-muted">
            <span className="relative inline-flex">
              {st.locked ? (
                <span title="Can't be removed" className="flex size-5 items-center justify-center text-muted-foreground"><Lock className="size-3.5" /></span>
              ) : (
                <input type="checkbox" checked={st.on} disabled={st.parentOff} onChange={(e) => onToggle(r, e.target.checked)} aria-label={`${label} for ${r.name}`} className={cn("size-4 cursor-pointer rounded accent-primary disabled:cursor-not-allowed disabled:opacity-30")} />
              )}
              {st.changed && !st.locked && <span className="absolute -right-1.5 -top-1 size-1.5 rounded-full bg-accent" />}
            </span>
          </td>
        );
      })}
    </tr>
  );
}
