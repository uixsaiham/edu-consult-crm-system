"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff, Lock, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { navSections } from "@/components/layout/nav-items";
import { childKey, emptyMenuConfig, itemKey, menuStore, resolveMenu, type MenuConfig } from "@/lib/settings/menu";
import { logAudit } from "@/lib/settings/audit";
import { useSettingsStore } from "@/lib/settings/store";
import { cn } from "@/lib/utils";

/** Entries that can't be hidden, so nobody removes the way back to this page. */
const locked = new Set(["/settings", childKey({ href: "/settings" }, { href: "/settings/menu" })]);

const defaults = new Map<string, { label: string; badge?: string }>();
navSections.forEach((s) => s.items.forEach((i) => { defaults.set(itemKey(i), { label: i.label }); i.children?.forEach((c) => defaults.set(childKey(i, c), { label: c.label, badge: c.badge })); }));

const swap = <T,>(list: T[], i: number, d: -1 | 1) => { const n = [...list]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; };

function countChanges(a: MenuConfig, b: MenuConfig) {
  const keys = Object.keys(emptyMenuConfig) as (keyof MenuConfig)[];
  return keys.filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])).length;
}

export default function MenuSettingsPage() {
  const { user } = useUser();
  const saved = useSettingsStore(menuStore);
  const [draft, setDraft] = useState<MenuConfig | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, notify] = useToast();

  const c = draft ?? saved;
  const tree = useMemo(() => resolveMenu(c, {}, undefined, { includeHidden: true }), [c]);
  const preview = useMemo(() => resolveMenu(c, {}), [c]);
  const hidden = new Set(c.hidden);
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(saved);
  const edit = (fn: (x: MenuConfig) => MenuConfig) => setDraft(fn(structuredClone(c)));

  const rename = (key: string, label: string) => edit((x) => { if (label.trim() && label !== defaults.get(key)?.label) x.labels[key] = label; else delete x.labels[key]; return x; });
  const toggle = (key: string) => edit((x) => ({ ...x, hidden: hidden.has(key) ? x.hidden.filter((k) => k !== key) : [...x.hidden, key] }));

  const save = () => {
    menuStore.set(c);
    const hiddenNow = c.hidden.filter((k) => !saved.hidden.includes(k)).map((k) => defaults.get(k)?.label ?? k);
    const shownNow = saved.hidden.filter((k) => !c.hidden.includes(k)).map((k) => defaults.get(k)?.label ?? k);
    logAudit({
      actor: user.name, role: user.role, module: "Settings", action: "Settings changed", entity: "Menu settings",
      summary: "Updated the sidebar menu",
      changes: [
        ...(hiddenNow.length ? [{ field: "Hidden", from: "Visible", to: hiddenNow.join(", ") }] : []),
        ...(shownNow.length ? [{ field: "Shown again", from: "Hidden", to: shownNow.join(", ") }] : []),
        ...Object.entries(c.labels).filter(([k, v]) => saved.labels[k] !== v).map(([k, v]) => ({ field: "Renamed", from: saved.labels[k] ?? defaults.get(k)?.label ?? k, to: v })),
        ...Object.entries(c.sectionLabels).filter(([k, v]) => saved.sectionLabels[k] !== v).map(([k, v]) => ({ field: "Section renamed", from: saved.sectionLabels[k] ?? k, to: v })),
        ...(JSON.stringify([c.sectionOrder, c.itemOrder, c.childOrder]) !== JSON.stringify([saved.sectionOrder, saved.itemOrder, saved.childOrder]) ? [{ field: "Order", from: "Previous order", to: "Reordered" }] : []),
        ...(JSON.stringify(c.badges) !== JSON.stringify(saved.badges) ? [{ field: "Badges", from: "Previous badges", to: "Updated" }] : []),
      ],
    });
    setDraft(null);
    notify("Menu saved — the sidebar has updated");
  };

  return (
    <div className="flex flex-col gap-4 pb-20">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Menu Settings</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Rename, reorder and hide sidebar entries for everyone. To choose which roles see which entries, use Menu Permission Settings.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/settings/menu-permissions" className={buttonSecondary}><ShieldCheck className="size-4" /> Menu permissions</Link>
          <button type="button" onClick={() => setConfirmReset(true)} className={buttonSecondary}><RotateCcw className="size-4" /> Reset to default</button>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-4">
          {tree.map((section, si) => (
            <Card key={section.key} className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-surface-muted px-4 py-3">
                <LabelInput
                  value={c.sectionLabels[section.key] ?? ""}
                  placeholder={section.key}
                  className="text-xs font-semibold uppercase tracking-wider"
                  onChange={(v) => edit((x) => { if (v && v !== section.key) x.sectionLabels[section.key] = v; else delete x.sectionLabels[section.key]; return x; })}
                />
                <Mover label={`section ${section.label}`} first={si === 0} last={si === tree.length - 1} onMove={(d) => edit((x) => ({ ...x, sectionOrder: swap(tree.map((s) => s.key), si, d) }))} />
              </div>
              <ul className="divide-y divide-border">
                {section.items.map((item, ii) => {
                  const key = itemKey(item);
                  const off = hidden.has(key);
                  const expanded = open === key;
                  const Icon = item.icon;
                  return (
                    <li key={key}>
                      <div className={cn("flex items-center gap-2 px-4 py-2.5", off && "bg-surface-muted/60")}>
                        <Icon className={cn("size-4 shrink-0", off ? "text-muted-foreground/50" : "text-muted-foreground")} />
                        <LabelInput value={c.labels[key] ?? ""} placeholder={defaults.get(key)?.label ?? ""} dim={off} onChange={(v) => rename(key, v)} />
                        {item.children?.length ? (
                          <button type="button" onClick={() => setOpen(expanded ? null : key)} aria-expanded={expanded} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground">
                            {item.children.filter((ch) => !hidden.has(childKey(item, ch))).length}/{item.children.length}<span className="hidden sm:inline"> pages</span> <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
                          </button>
                        ) : null}
                        <Visibility on={!off} locked={locked.has(key)} label={item.label} onToggle={() => toggle(key)} />
                        <Mover label={item.label} first={ii === 0} last={ii === section.items.length - 1} onMove={(d) => edit((x) => ({ ...x, itemOrder: { ...x.itemOrder, [section.key]: swap(section.items.map(itemKey), ii, d) } }))} />
                      </div>
                      {expanded && item.children && (
                        <ul className="border-t border-border bg-surface-muted/40 py-1 pl-10 pr-4">
                          {item.children.map((ch, ci) => {
                            const k = childKey(item, ch);
                            const chOff = hidden.has(k) || off;
                            const badge = k in c.badges ? c.badges[k] : defaults.get(k)?.badge ?? "";
                            return (
                              <li key={k} className="flex items-center gap-2 py-1.5">
                                <LabelInput value={c.labels[k] ?? ""} placeholder={defaults.get(k)?.label ?? ""} dim={chOff} small onChange={(v) => rename(k, v)} />
                                <select value={badge} onChange={(e) => edit((x) => { if (e.target.value === (defaults.get(k)?.badge ?? "")) delete x.badges[k]; else x.badges[k] = e.target.value; return x; })} aria-label={`Badge for ${ch.label}`} className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground">
                                  <option value="">No badge</option>
                                  <option value="New">New</option>
                                  <option value="Beta">Beta</option>
                                  <option value="Updated">Updated</option>
                                </select>
                                <Visibility on={!hidden.has(k)} locked={locked.has(k)} label={ch.label} onToggle={() => toggle(k)} />
                                <Mover label={ch.label} first={ci === 0} last={ci === item.children!.length - 1} onMove={(d) => edit((x) => ({ ...x, childOrder: { ...x.childOrder, [key]: swap(item.children!.map((z) => childKey(item, z)), ci, d) } }))} />
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>

        <aside className="xl:sticky xl:top-4">
          <Card className="p-4">
            <p className="text-xs font-semibold text-foreground">Preview</p>
            <p className="mb-3 text-[11px] text-muted-foreground">Everything a Super Admin would see. Other roles see less — set that in Menu Permission Settings.</p>
            <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-border p-2">
              {preview.map((s) => (
                <div key={s.key} className="mb-3">
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{s.label}</p>
                  {s.items.map((i) => (
                    <div key={i.href}>
                      <p className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-foreground"><i.icon className="size-3.5 text-muted-foreground" />{i.label}</p>
                      {i.children?.map((ch) => (
                        <p key={ch.href} className="ml-7 flex items-center gap-1.5 py-0.5 text-[11px] text-muted-foreground">{ch.label}{ch.badge && <span className="rounded-full bg-accent px-1.5 text-[8px] font-bold uppercase text-white">{ch.badge}</span>}</p>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.25)] backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Unsaved menu changes</span> — {countChanges(saved, c)} area{countChanges(saved, c) === 1 ? "" : "s"} changed. The sidebar updates when you save.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDraft(null)} className={buttonSecondary}>Discard</button>
              <button type="button" onClick={save} className={buttonPrimary}><Save className="size-4" /> Save menu</button>
            </div>
          </div>
        </div>
      )}

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} icon={RotateCcw} size="sm" title="Reset the menu to default?" subtitle="All names, order, badges and hidden entries go back to the original menu."
        footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setConfirmReset(false)} className={buttonSecondary}>Cancel</button><button type="button" onClick={() => { setDraft(emptyMenuConfig); setConfirmReset(false); }} className={buttonPrimary}>Load default</button></div>}
      >
        <p className="text-sm text-muted-foreground">Review the default in the preview, then save. Role permissions aren&apos;t affected.</p>
      </Modal>
      {toast}
    </div>
  );
}

function LabelInput({ value, placeholder, dim, small, className, onChange }: { value: string; placeholder: string; dim?: boolean; small?: boolean; className?: string; onChange: (v: string) => void }) {
  // While typing, show exactly what's typed (even empty); outside, show the custom name or the default.
  const [text, setText] = useState<string | null>(null);
  const custom = !!value && value !== placeholder;
  return (
    <input
      value={text ?? (value || placeholder)}
      onFocus={() => setText(value || placeholder)}
      onChange={(e) => { setText(e.target.value); onChange(e.target.value.trim() ? e.target.value : ""); }}
      onBlur={() => setText(null)}
      aria-label={`Name for ${placeholder}`}
      title={custom ? `Default: ${placeholder}` : "Click to rename"}
      className={cn(
        "min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1 outline-none hover:bg-surface-hover focus:bg-surface focus:ring-2 focus:ring-primary/20",
        className ?? (small ? "text-[13px]" : "text-sm font-medium"),
        dim ? "text-muted-foreground line-through decoration-muted-foreground/40" : "text-foreground",
        custom && "italic"
      )}
    />
  );
}

function Visibility({ on, locked, label, onToggle }: { on: boolean; locked?: boolean; label: string; onToggle: () => void }) {
  if (locked) return <span title="Always shown so this page stays reachable" className="flex size-8 items-center justify-center text-muted-foreground/60"><Lock className="size-3.5" /></span>;
  return (
    <button type="button" onClick={onToggle} aria-pressed={!on} aria-label={on ? `Hide ${label}` : `Show ${label}`} title={on ? "Hide" : "Show"} className={cn("flex size-8 items-center justify-center rounded-lg transition-colors", on ? "text-muted-foreground hover:bg-surface-hover hover:text-foreground" : "bg-warning-soft text-warning")}>
      {on ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
    </button>
  );
}

function Mover({ label, first, last, onMove }: { label: string; first: boolean; last: boolean; onMove: (d: -1 | 1) => void }) {
  return (
    <span className="flex">
      <button type="button" disabled={first} onClick={() => onMove(-1)} aria-label={`Move ${label} up`} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover disabled:opacity-30"><ArrowUp className="size-3.5" /></button>
      <button type="button" disabled={last} onClick={() => onMove(1)} aria-label={`Move ${label} down`} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover disabled:opacity-30"><ArrowDown className="size-3.5" /></button>
    </span>
  );
}
