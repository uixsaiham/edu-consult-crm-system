"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Bell, Check, GraduationCap, LifeBuoy, ListChecks, LogOut, Monitor, Moon, Settings, ShieldCheck, Sun, UserRound } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useUser } from "./user-context";
import { UserAvatar } from "./avatar";
import { presenceStatuses } from "@/lib/mock/user";
import { getFollowUps, followUpToday } from "@/lib/mock/follow-ups";
import { companyStore, withDefaults } from "@/lib/settings/company";
import { useSettingsStore } from "@/lib/settings/store";
import { scopeFor } from "@/lib/profile/scope";
import { useClickOutside } from "@/lib/use-click-outside";
import { cn } from "@/lib/utils";

type Placement = "sidebar" | "sidebar-collapsed" | "topbar";

/** The account button and its menu — in the sidebar footer, collapsed sidebar and top bar. */
export function AccountMenu({ placement, onNavigate }: { placement: Placement; onNavigate?: () => void }) {
  const { user, updateUser, signOut } = useUser();
  const company = withDefaults(useSettingsStore(companyStore));
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const [everywhere, setEverywhere] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open && !confirmOut);

  const { role, branch, name } = user;
  const due = useMemo(() => {
    const { match } = scopeFor({ role, branch, name });
    return getFollowUps().filter((f) => f.status === "Pending" && f.date <= followUpToday && match(f.branch, f.counsellor)).length;
  }, [role, branch, name]);

  const go = () => {
    setOpen(false);
    onNavigate?.();
  };

  const links = [
    { href: "/profile", icon: UserRound, label: "My profile", hint: "Details, performance and activity" },
    { href: "/leads/follow-ups", icon: ListChecks, label: "My follow-ups", badge: due || undefined },
    { href: "/bhe-training", icon: GraduationCap, label: "My training" },
    { href: "/profile?tab=notifications", icon: Bell, label: "Notification settings" },
    { href: "/profile?tab=security", icon: ShieldCheck, label: "Password & security" },
  ];

  return (
    <div ref={ref} className={cn("relative", placement === "sidebar" && "w-full")}>
      {placement === "sidebar" ? (
        <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} className={cn("flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left transition-colors hover:bg-surface-hover", open && "bg-surface-hover")}>
          <UserAvatar user={user} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">{user.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.statusMessage || user.role}</span>
          </span>
          <Settings className="size-4 shrink-0 text-muted-foreground" />
        </button>
      ) : (
        <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" title={placement === "sidebar-collapsed" ? user.name : undefined} className={cn("flex items-center justify-center rounded-full transition-transform active:scale-95", placement === "sidebar-collapsed" && "mx-auto py-1")}>
          <UserAvatar user={user} />
        </button>
      )}

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 w-72 overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-fade-in",
            placement === "sidebar" && "bottom-full left-0 mb-2",
            placement === "sidebar-collapsed" && "bottom-0 left-full ml-3",
            placement === "topbar" && "right-0 top-full mt-2"
          )}
        >
          <div className="flex items-center gap-3 px-4 pb-3 pt-4">
            <UserAvatar user={user} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.jobTitle} · {user.branch}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div role="radiogroup" aria-label="Status" className="space-y-1 border-t border-border p-1.5">
            <div className="grid grid-cols-2 gap-0.5">
              {presenceStatuses.map((p) => (
                <button key={p.value} type="button" role="menuitemradio" aria-checked={user.status === p.value} title={p.hint} onClick={() => updateUser({ status: p.value })} className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors", user.status === p.value ? "bg-surface-hover font-semibold text-foreground" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground")}>
                  <span className={cn("size-2 shrink-0 rounded-full", p.dot)} />
                  <span className="truncate">{p.value}</span>
                </button>
              ))}
            </div>
            <input
              value={user.statusMessage}
              onChange={(e) => updateUser({ statusMessage: e.target.value.slice(0, 60) })}
              placeholder="Set a status message…"
              aria-label="Status message"
              className="h-8 w-full rounded-xl bg-surface-muted px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="border-t border-border p-1.5">
            {links.map((l) => (
              <Link key={l.href} href={l.href} role="menuitem" onClick={go} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-hover">
                <l.icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1">{l.label}</span>
                {l.badge ? <span className="rounded-full bg-danger px-1.5 text-[10px] font-bold tabular-nums text-white">{l.badge}</span> : null}
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
            <span className="text-xs text-muted-foreground">Theme</span>
            <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-full border border-border bg-surface-muted p-0.5">
              {([["light", Sun], ["dark", Moon], ["system", Monitor]] as const).map(([t, Icon]) => (
                <button key={t} type="button" role="radio" aria-checked={theme === t} aria-label={`${t} theme`} title={t[0].toUpperCase() + t.slice(1)} onClick={() => setTheme(t)} className={cn("flex size-7 items-center justify-center rounded-full transition-colors", theme === t ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}>
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border p-1.5">
            <a href={`mailto:${company.supportEmail}?subject=${encodeURIComponent("CRM help request")}`} role="menuitem" onClick={go} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-hover">
              <LifeBuoy className="size-4 text-muted-foreground" /> Help & support
            </a>
            <button type="button" role="menuitem" onClick={() => setConfirmOut(true)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-soft">
              <LogOut className="size-4" /> Log out
            </button>
          </div>
        </div>
      )}

      <Modal open={confirmOut} onClose={() => setConfirmOut(false)} icon={LogOut} size="sm" title="Log out of BHE CRM?" subtitle={`Signed in as ${user.email}`}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmOut(false)} className={buttonSecondary}>Cancel</button>
            <button type="button" onClick={() => { setConfirmOut(false); setOpen(false); signOut({ everywhere }); }} className={cn(buttonPrimary, "bg-danger hover:bg-danger/90")}><LogOut className="size-4" /> Log out</button>
          </div>
        }
      >
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3">
          <input type="checkbox" checked={everywhere} onChange={(e) => setEverywhere(e.target.checked)} className="mt-0.5 size-4 accent-primary" />
          <span>
            <span className="block text-sm font-medium text-foreground">Log out on all my devices</span>
            <span className="block text-xs text-muted-foreground">Use this if you signed in on a shared or lost device.</span>
          </span>
        </label>
        {user.status !== "Away" && (
          <button type="button" onClick={() => updateUser({ status: "Away" })} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><Check className="size-3.5" /> Set my status to Away first</button>
        )}
      </Modal>
    </div>
  );
}
