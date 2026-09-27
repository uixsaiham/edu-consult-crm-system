"use client";

import { useState } from "react";
import { Building2, CircleAlert, Plus, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Field, PillGroup, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { getStaff } from "@/lib/mock/staff";
import { branchServices, weekDays, type Branch, type BranchStatus, type BranchType, type OpeningHours } from "@/lib/mock/office";
import { cn } from "@/lib/utils";

const blank = (): Branch => ({
  id: "",
  name: "",
  type: "Branch",
  city: "",
  country: "United Kingdom",
  address: "",
  phone: "",
  whatsapp: "",
  email: "",
  managerId: "",
  timezone: "Europe/London",
  hours: weekDays.map((day) => ({ day, open: "09:30", close: "18:00", closed: day === "Sun" })),
  services: ["Walk-in counselling", "Appointment counselling"],
  rooms: 2,
  status: "Open",
  openedOn: "2026-09-17",
  holidays: [],
});

export function BranchDialog({ branch, existing, onClose, onSave }: { branch?: Branch; existing: Branch[]; onClose: () => void; onSave: (b: Branch) => void }) {
  const [b, setB] = useState<Branch>(() => branch ?? blank());
  const [rooms, setRooms] = useState(String(b.rooms));
  const [holiday, setHoliday] = useState({ date: "", label: "" });
  const [tried, setTried] = useState(false);
  const set = <K extends keyof Branch>(k: K, v: Branch[K]) => setB((x) => ({ ...x, [k]: v }));
  const setDay = (i: number, patch: Partial<OpeningHours>) => set("hours", b.hours.map((h, j) => (j === i ? { ...h, ...patch } : h)));
  const managers = getStaff().filter((s) => s.status !== "Inactive" && s.status !== "Invited");

  const errors: Record<string, string> = {};
  if (!b.name.trim()) errors.name = "Enter a branch name";
  else if (existing.some((x) => x.id !== b.id && x.name.toLowerCase() === b.name.trim().toLowerCase())) errors.name = "A branch with this name exists";
  if (!b.city.trim()) errors.city = "Enter a city";
  if (!b.address.trim()) errors.address = "Enter the address";
  if (b.phone.replace(/\D/g, "").length < 8) errors.phone = "Enter a phone number";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email.trim())) errors.email = "Enter a valid email";
  if (b.hours.some((h) => !h.closed && h.open >= h.close)) errors.hours = "Closing time must be after opening time";
  if (b.hours.every((h) => h.closed)) errors.hours = "Open the branch on at least one day";
  const err = (k: string) => (tried ? errors[k] : undefined);

  const save = () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    const id = b.id || `BR-${String(existing.length + 1).padStart(2, "0")}`;
    onSave({ ...b, id, name: b.name.trim(), city: b.city.trim(), address: b.address.trim(), email: b.email.trim().toLowerCase(), rooms: Number(rooms) || 1 });
  };

  const input = (k: string) => ({ "aria-invalid": !!err(k), className: cn(err(k) && "border-danger") });

  return (
    <Modal
      open
      onClose={onClose}
      icon={Building2}
      size="lg"
      title={branch ? `Edit ${branch.name}` : "Add branch office"}
      subtitle="Contact details and hours appear on the website, WhatsApp auto-replies and appointment emails."
      footer={
        <div className="flex items-center justify-between gap-2">
          {tried && Object.keys(errors).length > 0 ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-danger"><CircleAlert className="size-3.5" /> Fix {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? "s" : ""}</span>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
            <button type="button" onClick={save} className={buttonPrimary}>{branch ? "Save changes" : "Add branch"}</button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Branch name" required>
            <TextInput value={b.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Birmingham" {...input("name")} />
            <Err msg={err("name")} />
          </Field>
          <Field label="Type">
            <PillGroup<BranchType> options={(["Head office", "Branch", "Satellite"] as BranchType[]).map((t) => ({ value: t, label: t }))} value={b.type} onChange={(v) => set("type", v)} />
          </Field>
          <Field label="City" required>
            <TextInput value={b.city} onChange={(e) => set("city", e.target.value)} {...input("city")} />
            <Err msg={err("city")} />
          </Field>
          <Field label="Country">
            <Select value={b.country} onChange={(e) => { set("country", e.target.value); set("timezone", e.target.value === "Bangladesh" ? "Asia/Dhaka" : "Europe/London"); }}>
              <option>United Kingdom</option>
              <option>Bangladesh</option>
            </Select>
          </Field>
          <Field label="Address" required className="sm:col-span-2">
            <TextInput value={b.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, area, postcode" {...input("address")} />
            <Err msg={err("address")} />
          </Field>
          <Field label="Phone" required>
            <TextInput type="tel" value={b.phone} onChange={(e) => set("phone", e.target.value)} {...input("phone")} />
            <Err msg={err("phone")} />
          </Field>
          <Field label="WhatsApp">
            <TextInput type="tel" value={b.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </Field>
          <Field label="Email" required>
            <TextInput type="email" value={b.email} onChange={(e) => set("email", e.target.value)} placeholder="branch@bheuni.com" {...input("email")} />
            <Err msg={err("email")} />
          </Field>
          <Field label="Branch manager">
            <Select value={b.managerId} onChange={(e) => set("managerId", e.target.value)}>
              <option value="">Not assigned</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.jobTitle}, {m.branch}</option>)}
            </Select>
          </Field>
          <Field label="Counselling rooms">
            <TextInput inputMode="numeric" value={rooms} onChange={(e) => setRooms(e.target.value.replace(/\D/g, "").slice(0, 2))} />
          </Field>
          <Field label="Status">
            <PillGroup<BranchStatus> options={(["Open", "Temporarily closed", "Inactive"] as BranchStatus[]).map((s) => ({ value: s, label: s }))} value={b.status} onChange={(v) => set("status", v)} />
          </Field>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold text-foreground">Opening hours <span className="font-normal text-muted-foreground">· {b.timezone === "Asia/Dhaka" ? "Bangladesh time" : "UK time"}</span></p>
          <div className="divide-y divide-border rounded-2xl border border-border">
            {b.hours.map((h, i) => (
              <div key={h.day} className="flex flex-wrap items-center gap-3 px-3.5 py-2">
                <span className="w-10 text-xs font-semibold text-foreground">{h.day}</span>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={!h.closed} onChange={(e) => setDay(i, { closed: !e.target.checked })} className="size-4 accent-primary" />
                  {h.closed ? "Closed" : "Open"}
                </label>
                {!h.closed && (
                  <div className="ml-auto flex items-center gap-2">
                    <input type="time" value={h.open} onChange={(e) => setDay(i, { open: e.target.value })} aria-label={`${h.day} opening time`} className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus:border-primary focus:outline-none" />
                    <span className="text-xs text-muted-foreground">to</span>
                    <input type="time" value={h.close} onChange={(e) => setDay(i, { close: e.target.value })} aria-label={`${h.day} closing time`} className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus:border-primary focus:outline-none" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <Err msg={err("hours")} />
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold text-foreground">Services offered</p>
          <div className="flex flex-wrap gap-1.5">
            {branchServices.map((s) => {
              const on = b.services.includes(s);
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => set("services", on ? b.services.filter((x) => x !== s) : [...b.services, s])} className={cn("h-8 rounded-full border px-3 text-xs font-medium transition-colors", on ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                  {s}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold text-foreground">Holidays & closures</p>
          {b.holidays.length > 0 && (
            <ul className="mb-2 flex flex-wrap gap-1.5">
              {[...b.holidays].sort((x, y) => x.date.localeCompare(y.date)).map((h) => (
                <li key={h.date + h.label} className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted py-1 pl-3 pr-1.5 text-xs text-foreground">
                  {new Date(`${h.date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })} · {h.label}
                  <button type="button" aria-label={`Remove ${h.label}`} onClick={() => set("holidays", b.holidays.filter((x) => x !== h))} className="rounded-full p-0.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"><X className="size-3" /></button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <input type="date" value={holiday.date} onChange={(e) => setHoliday({ ...holiday, date: e.target.value })} aria-label="Holiday date" className="h-9 rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus:border-primary focus:outline-none" />
            <input value={holiday.label} onChange={(e) => setHoliday({ ...holiday, label: e.target.value })} placeholder="e.g. Eid ul-Fitr" aria-label="Holiday name" className="h-9 min-w-40 flex-1 rounded-lg border border-border bg-surface px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
            <button type="button" disabled={!holiday.date || !holiday.label.trim()} onClick={() => { set("holidays", [...b.holidays, { date: holiday.date, label: holiday.label.trim() }]); setHoliday({ date: "", label: "" }); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover disabled:opacity-50">
              <Plus className="size-3.5" /> Add
            </button>
          </div>
        </section>

        <Field label="Notes shown to staff">
          <Textarea rows={2} value={b.notes ?? ""} onChange={(e) => set("notes", e.target.value || undefined)} placeholder="e.g. Closed for refurbishment until 28 Sep — appointments moved online." />
        </Field>
      </div>
    </Modal>
  );
}

function Err({ msg }: { msg?: string }) {
  return msg ? <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-danger"><CircleAlert className="size-3" /> {msg}</span> : null;
}
