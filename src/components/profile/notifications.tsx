"use client";

import { Fragment, useState } from "react";
import { Bell, Mail, MessageCircle, RotateCcw, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PillGroup } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useUser } from "@/components/layout/user-context";
import { defaultNotificationPrefs, notificationChannels, notificationEvents, notificationStore, type NotificationChannel, type NotificationPrefs } from "@/lib/settings/account";
import { logAudit } from "@/lib/settings/audit";
import { useSettingsStore } from "@/lib/settings/store";
import { cn } from "@/lib/utils";

const channelIcon: Record<NotificationChannel, typeof Bell> = { "In-app": Bell, Email: Mail, WhatsApp: MessageCircle };

export function ProfileNotifications({ notify }: { notify: (t: string, tone?: "success" | "error") => void }) {
  const { user } = useUser();
  const saved = useSettingsStore(notificationStore);
  const [draft, setDraft] = useState<NotificationPrefs | null>(null);
  const p = draft ?? saved;
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(saved);
  const groups = [...new Set(notificationEvents.map((e) => e.group))];

  const toggle = (key: (typeof notificationEvents)[number]["key"], ch: NotificationChannel) => {
    const cur = p.matrix[key];
    setDraft({ ...p, matrix: { ...p.matrix, [key]: cur.includes(ch) ? cur.filter((c) => c !== ch) : [...cur, ch] } });
  };
  const column = (ch: NotificationChannel, on: boolean) => setDraft({ ...p, matrix: Object.fromEntries(notificationEvents.map((e) => [e.key, on ? [...new Set([...p.matrix[e.key], ch])] : p.matrix[e.key].filter((c) => c !== ch)])) as NotificationPrefs["matrix"] });

  const save = () => {
    notificationStore.set(p);
    const changed: { field: string; from: string; to: string }[] = notificationEvents.filter((e) => JSON.stringify(saved.matrix[e.key]) !== JSON.stringify(p.matrix[e.key])).map((e) => ({ field: e.label, from: saved.matrix[e.key].join(", ") || "Off", to: p.matrix[e.key].join(", ") || "Off" }));
    if (saved.digest !== p.digest) changed.push({ field: "Summary email", from: saved.digest, to: p.digest });
    logAudit({ actor: user.name, role: user.role, module: "Settings", action: "Updated", entity: "My notifications", entityId: user.staffId, summary: "Changed notification preferences", changes: changed, severity: "info" });
    setDraft(null);
    notify("Notification preferences saved");
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">What to notify me about</h3>
          <p className="text-xs text-muted-foreground">WhatsApp alerts go to {user.phone || "your phone number"}. Security alerts always reach you in the CRM.</p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2.5 pl-5 pr-3">Event</th>
                {notificationChannels.map((ch) => {
                  const Icon = channelIcon[ch];
                  const all = notificationEvents.every((e) => p.matrix[e.key].includes(ch));
                  return (
                    <th key={ch} className="w-24 px-3 py-2.5 text-center">
                      <button type="button" onClick={() => column(ch, !all)} title={all ? `Turn off all ${ch}` : `Turn on all ${ch}`} className="inline-flex flex-col items-center gap-0.5 hover:text-foreground"><Icon className="size-4" />{ch}</button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g}>
                  <tr><td colSpan={4} className="px-5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">{g}</td></tr>
                  {notificationEvents.filter((e) => e.group === g).map((e) => (
                    <tr key={e.key} className="border-b border-border last:border-0">
                      <td className="py-2.5 pl-5 pr-3 text-foreground">{e.label}</td>
                      {notificationChannels.map((ch) => {
                        const forced = e.key === "security" && ch === "In-app";
                        return (
                          <td key={ch} className="px-3 py-2.5 text-center">
                            <input type="checkbox" checked={forced || p.matrix[e.key].includes(ch)} disabled={forced} onChange={() => toggle(e.key, ch)} aria-label={`${e.label} by ${ch}`} className="size-4 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-60" />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground">Summary email</h3>
          <p className="mb-3 text-xs text-muted-foreground">One email with your follow-ups, deadlines and new leads.</p>
          <PillGroup options={(["Off", "Daily at 8am", "Weekly on Monday"] as const).map((v) => ({ value: v, label: v }))} value={p.digest} onChange={(v) => setDraft({ ...p, digest: v })} />
        </Card>
        <Card className="flex flex-col gap-3 p-5">
          <Switch label="Play a sound for new notifications" on={p.sound} onChange={(v) => setDraft({ ...p, sound: v })} />
          <Switch label="Mute everything but urgent alerts while my status is Do not disturb" on={p.muteWhenDnd} onChange={(v) => setDraft({ ...p, muteWhenDnd: v })} />
        </Card>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setDraft(defaultNotificationPrefs)} className={buttonSecondary}><RotateCcw className="size-4" /> Defaults</button>
          <button type="button" disabled={!dirty} onClick={() => setDraft(null)} className={cn(buttonSecondary, "disabled:opacity-50")}>Discard</button>
          <button type="button" disabled={!dirty} onClick={save} className={cn(buttonPrimary, "disabled:opacity-50")}><Save className="size-4" /> Save</button>
        </div>
      </div>
    </div>
  );
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-foreground">{label}</span>
      <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", on ? "bg-primary" : "bg-border-strong")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", on ? "translate-x-5" : "translate-x-0.5")} />
      </button>
    </div>
  );
}
