"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Camera, Lock, Save, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, Select, Textarea, TextInput } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { formatDay } from "@/components/people/people-ui";
import { UserAvatar } from "@/components/layout/avatar";
import { useUser } from "@/components/layout/user-context";
import { avatarColors, type CurrentUser } from "@/lib/mock/user";
import { getStaffMember } from "@/lib/mock/staff";
import { diff, logAudit } from "@/lib/settings/audit";
import { cn } from "@/lib/utils";

const languageOptions = ["Bengali", "English", "Hindi", "Urdu", "Sylheti", "Arabic", "Romanian", "Polish", "Yoruba", "Ukrainian"];
const timezoneOptions = ["Asia/Dhaka", "Europe/London", "Europe/Dublin", "Asia/Dubai", "Africa/Lagos"];
const labels: Partial<Record<keyof CurrentUser, string>> = { name: "Full name", preferredName: "Preferred name", email: "Work email", phone: "Phone", languages: "Languages", timezone: "Time zone", bio: "About me", avatarColor: "Avatar colour", photo: "Photo" };

/** Resizes a picked image to a 256px square JPEG so it's small enough to keep in the browser. */
function toAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const side = Math.min(img.width, img.height);
      canvas.getContext("2d")!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("unreadable"));
    img.src = URL.createObjectURL(file);
  });
}

export function ProfileDetails({ notify }: { notify: (t: string, tone?: "success" | "error") => void }) {
  const { user, updateUser } = useUser();
  const [draft, setDraft] = useState<CurrentUser | null>(null);
  const [tried, setTried] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const f = draft ?? user;
  const set = <K extends keyof CurrentUser>(k: K, v: CurrentUser[K]) => setDraft({ ...f, [k]: v });
  const staff = getStaffMember(user.staffId);
  const manager = staff?.reportsTo ? getStaffMember(staff.reportsTo) : undefined;

  const errors: Partial<Record<keyof CurrentUser, string>> = {};
  if (f.name.trim().split(/\s+/).length < 2) errors.name = "Enter your first and last name";
  if (!/^[^\s@]+@bheuni\.com$/i.test(f.email.trim())) errors.email = "Use your @bheuni.com work email";
  if (f.phone && !/^\+?[\d\s-]{8,18}$/.test(f.phone)) errors.phone = "Use international format, e.g. +44 7700 900123";
  if (!f.languages.length) errors.languages = "Pick at least one — it's used to match leads to you";
  const changes = diff(user, f, labels).map((c) => (c.field === "Photo" ? { ...c, from: user.photo ? "Photo" : "None", to: f.photo ? "New photo" : "Removed" } : c));

  const pick = async (fl?: File) => {
    if (!fl) return;
    if (!fl.type.startsWith("image/")) return notify("Choose an image file", "error");
    if (fl.size > 8 * 1024 * 1024) return notify("That image is over 8 MB", "error");
    try {
      set("photo", await toAvatar(fl));
    } catch {
      notify("Couldn't read that image", "error");
    }
  };

  const save = () => {
    setTried(true);
    if (Object.keys(errors).length) return notify("Check the highlighted fields", "error");
    updateUser({ ...f, name: f.name.trim(), email: f.email.trim().toLowerCase() });
    logAudit({ actor: f.name, role: user.role, module: "People", action: "Updated", entity: "My profile", entityId: user.staffId, summary: "Updated their profile", changes, severity: changes.some((c) => c.field === "Work email") ? "notice" : "info" });
    setDraft(null);
    setTried(false);
    notify("Profile saved");
  };
  const err = (k: keyof CurrentUser) => (tried && errors[k] ? <span className="text-[11px] font-medium text-danger">{errors[k]}</span> : null);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Personal details</h3>
        <p className="text-xs text-muted-foreground">What colleagues see on your profile, in notes and on assigned records.</p>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <UserAvatar user={f} size="xl" showStatus={false} />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => file.current?.click()} className={cn(buttonSecondary, "h-9")}><Camera className="size-4" /> {f.photo ? "Change photo" : "Upload photo"}</button>
              {f.photo && <button type="button" onClick={() => set("photo", undefined)} className={cn(buttonSecondary, "h-9 text-danger hover:bg-danger-soft")}><Trash2 className="size-4" /> Remove</button>}
              <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
            {!f.photo && (
              <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Avatar colour">
                {avatarColors.map((c) => <button key={c} type="button" role="radio" aria-checked={f.avatarColor === c} aria-label={c.replace("bg-", "")} onClick={() => set("avatarColor", c)} className={cn("size-6 rounded-full ring-offset-2 ring-offset-surface", c, f.avatarColor === c && "ring-2 ring-foreground")} />)}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">JPG or PNG, cropped to a square.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" required><TextInput value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />{err("name")}</Field>
          <Field label="Preferred name" hint="Used in greetings and templates"><TextInput value={f.preferredName} onChange={(e) => set("preferredName", e.target.value)} /></Field>
          <Field label="Work email" required><TextInput type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />{err("email")}</Field>
          <Field label="Phone" hint="Shown to colleagues; not to students"><TextInput value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />{err("phone")}</Field>
          <Field label="Time zone" hint="Your follow-up and reminder times use this">
            <Select value={f.timezone} onChange={(e) => set("timezone", e.target.value)}>{timezoneOptions.map((t) => <option key={t}>{t}</option>)}</Select>
          </Field>
          <Field label="Languages I counsel in">
            <div className="flex flex-wrap gap-1.5">
              {languageOptions.map((l) => {
                const on = f.languages.includes(l);
                return <button key={l} type="button" aria-pressed={on} onClick={() => set("languages", on ? f.languages.filter((x) => x !== l) : [...f.languages, l])} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground hover:bg-surface-hover")}>{l}</button>;
              })}
            </div>
            {err("languages")}
          </Field>
          <Field label="About me" className="sm:col-span-2" hint={`${f.bio.length}/280 · shown on your profile card`}>
            <Textarea rows={3} maxLength={280} value={f.bio} onChange={(e) => set("bio", e.target.value)} />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          {changes.length > 0 && <span className="mr-auto text-xs text-muted-foreground">{changes.length} unsaved change{changes.length === 1 ? "" : "s"}</span>}
          <button type="button" disabled={!changes.length} onClick={() => { setDraft(null); setTried(false); }} className={cn(buttonSecondary, "disabled:opacity-50")}>Discard</button>
          <button type="button" disabled={!changes.length} onClick={save} className={cn(buttonPrimary, "disabled:opacity-50")}><Save className="size-4" /> Save profile</button>
        </div>
      </Card>

      <Card className="h-fit p-5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><Lock className="size-3.5 text-muted-foreground" /> Managed by your admin</h3>
        <p className="text-xs text-muted-foreground">Ask an admin in People to change these — your role controls what you can see and do.</p>
        <dl className="mt-4 flex flex-col gap-3 text-xs">
          {[
            ["Role", user.role],
            ["Job title", user.jobTitle],
            ["Branch", user.branch],
            ["Staff ID", user.staffId],
            ["Reports to", manager?.name ?? "—"],
            ["Employment", staff?.employment ?? "—"],
            ["Joined", staff ? formatDay(staff.joined) : "—"],
            ["Case capacity", staff ? `${staff.capacity} open cases` : "—"],
          ].map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium text-foreground">{v}</dd></div>)}
        </dl>
        <Link href={`/people/${user.staffId}`} className="mt-4 inline-flex text-xs font-semibold text-primary hover:underline">Open my People record</Link>
      </Card>
    </div>
  );
}
