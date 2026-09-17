"use client";

import { useState } from "react";
import { User } from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import { Field, TextInput } from "@/components/ui/form-controls";
import { useUser } from "@/components/layout/user-context";
import { initialsFor } from "@/lib/utils";

export function ProfilePanel() {
  const { user, updateUser, profileOpen, closeProfile } = useUser();
  const [form, setForm] = useState(user);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleClose() {
    setForm(user);
    closeProfile();
  }

  function handleSave() {
    if (!form.name.trim() || !form.email.trim()) return;
    updateUser(form);
    closeProfile();
  }

  return (
    <SlideOver
      open={profileOpen}
      onClose={handleClose}
      icon={User}
      title="My Profile"
      subtitle="Update your account details"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary-hover active:scale-95"
          >
            Save Changes
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
            {initialsFor(form.name || "—")}
          </span>
          <p className="text-xs text-muted-foreground">
            Your initials avatar updates automatically from your name.
          </p>
        </div>

        <Field label="Full Name" required>
          <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your full name" />
        </Field>

        <Field label="Email" required>
          <TextInput
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="name@example.com"
          />
        </Field>

        <Field label="Phone">
          <TextInput value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+880 1XXX XXXXXX" />
        </Field>

        <Field label="Role">
          <TextInput value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. Admissions Lead" />
        </Field>
      </div>
    </SlideOver>
  );
}
