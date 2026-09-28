"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Copy, Download, Eye, EyeOff, KeyRound, LogOut, Monitor, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { fieldClass } from "@/components/ui/form-controls";
import { formatDay } from "@/components/people/people-ui";
import { useUser } from "@/components/layout/user-context";
import { makeRecoveryCodes, passwordStrength, securityStore } from "@/lib/settings/account";
import { companyStore, withDefaults } from "@/lib/settings/company";
import { allAuditEvents, auditStore, logAudit } from "@/lib/settings/audit";
import { useSettingsStore } from "@/lib/settings/store";
import { cn } from "@/lib/utils";

const ago = (iso: string) => {
  if (iso === "Now") return "Active now";
  const h = Math.round((Date.now() - Date.parse(iso)) / 3_600_000);
  return h < 24 ? `${h}h ago` : `${formatDay(iso)}`;
};

export function ProfileSecurity({ notify }: { notify: (t: string, tone?: "success" | "error") => void }) {
  const { user } = useUser();
  const sec = useSettingsStore(securityStore);
  const company = withDefaults(useSettingsStore(companyStore));
  const recorded = useSettingsStore(auditStore);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [confirm2fa, setConfirm2fa] = useState(false);
  const signIns = useMemo(() => allAuditEvents(recorded).filter((e) => (e.actor === user.name || e.summary.includes(user.email.split("@")[0])) && ["Signed in", "Sign-in failed", "Signed out"].includes(e.action)).slice(0, 8), [recorded, user.name, user.email]);
  const audit = (summary: string, severity: "notice" | "critical" = "critical", changes?: { field: string; from: string; to: string }[]) => logAudit({ actor: user.name, role: user.role, module: "Security", action: "Updated", entity: "My account", entityId: user.staffId, summary, severity, changes });

  const endSession = (id: string) => {
    const s = sec.sessions.find((x) => x.id === id);
    securityStore.set({ ...sec, sessions: sec.sessions.filter((x) => x.id !== id) });
    audit(`Signed out ${s?.device ?? "a device"} remotely`, "notice");
    notify("Device signed out");
  };
  const endOthers = () => {
    const n = sec.sessions.filter((x) => !x.current).length;
    securityStore.set({ ...sec, sessions: sec.sessions.filter((x) => x.current) });
    audit(`Signed out ${n} other device${n === 1 ? "" : "s"}`, "notice");
    notify(`${n} other device${n === 1 ? "" : "s"} signed out`);
  };
  const newCodes = () => {
    const c = makeRecoveryCodes();
    securityStore.set({ ...sec, recoveryCodesGeneratedAt: new Date().toISOString() });
    audit("Generated new two-factor recovery codes — old codes no longer work");
    setCodes(c);
  };
  const policyForces2fa = company.twoFactor === "Everyone" || (company.twoFactor === "Admins only" && /admin|lead|manager/i.test(user.role));

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ChangePassword minLength={company.passwordMinLength} changedAt={sec.passwordChangedAt} onChanged={() => { securityStore.set({ ...sec, passwordChangedAt: new Date().toISOString() }); audit("Changed their password"); notify("Password changed — other devices will need it next time"); }} notify={notify} />

      <div className="flex flex-col gap-4">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", sec.twoFactor ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}><ShieldCheck className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Two-factor sign-in</h3>
              <p className="text-xs text-muted-foreground">{sec.twoFactor ? `On · ${sec.twoFactorMethod}` : "Off — anyone with your password can sign in"}</p>
            </div>
            {sec.twoFactor ? (
              <button type="button" disabled={policyForces2fa} title={policyForces2fa ? "Required by company policy" : undefined} onClick={() => setConfirm2fa(true)} className={cn(buttonSecondary, "h-9 disabled:opacity-50")}>Turn off</button>
            ) : (
              <button type="button" onClick={() => { securityStore.set({ ...sec, twoFactor: true }); audit("Turned on two-factor sign-in", "notice"); notify("Two-factor sign-in is on"); }} className={cn(buttonPrimary, "h-9")}>Turn on</button>
            )}
          </div>
          {policyForces2fa && <p className="mt-3 text-[11px] text-muted-foreground">Company policy requires two-factor sign-in for {company.twoFactor === "Everyone" ? "everyone" : "admins and managers"}.</p>}
          {sec.twoFactor && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 py-2.5 text-xs">
              <span className="text-muted-foreground">Recovery codes generated {formatDay(sec.recoveryCodesGeneratedAt)}. Use one if you lose your phone.</span>
              <button type="button" onClick={newCodes} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"><RefreshCw className="size-3.5" /> New codes</button>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Where you&apos;re signed in</h3>
            {sec.sessions.some((s) => !s.current) && <button type="button" onClick={endOthers} className="text-xs font-semibold text-danger hover:underline">Sign out all others</button>}
          </div>
          <ul className="mt-3 divide-y divide-border">
            {sec.sessions.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground">{/iphone|android|app/i.test(s.device) ? <Smartphone className="size-4" /> : <Monitor className="size-4" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{s.device}{s.current && <span className="ml-2 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">This device</span>}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{s.location} · {s.ip} · {ago(s.lastActive)}</span>
                </span>
                {!s.current && <button type="button" onClick={() => endSession(s.id)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-danger-soft hover:text-danger"><LogOut className="size-3.5" /> Sign out</button>}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Recent sign-ins</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {signIns.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 text-xs">
                <span><span className={cn("font-medium", e.action === "Sign-in failed" ? "text-danger" : "text-foreground")}>{e.action}</span><span className="block text-[11px] text-muted-foreground">{e.device} · {e.ip}</span></span>
                <span className="shrink-0 text-muted-foreground">{formatDay(e.at)} {e.at.slice(11, 16)}</span>
              </li>
            ))}
            {!signIns.length && <li className="text-xs text-muted-foreground">No sign-ins recorded yet.</li>}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">Don&apos;t recognise one? Change your password and sign out all other devices.</p>
        </Card>
      </div>

      <Modal open={!!codes} onClose={() => setCodes(null)} icon={KeyRound} title="Your new recovery codes" subtitle="Each code works once. Store them somewhere safe — they won't be shown again."
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => { void navigator.clipboard?.writeText(codes!.join("\n")); notify("Codes copied"); }} className={buttonSecondary}><Copy className="size-4" /> Copy</button>
            <button type="button" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([`BHE Uni CRM recovery codes for ${user.email}\n\n${codes!.join("\n")}\n`], { type: "text/plain" })); a.download = "bhe-crm-recovery-codes.txt"; a.click(); URL.revokeObjectURL(a.href); }} className={buttonSecondary}><Download className="size-4" /> Download</button>
            <button type="button" onClick={() => setCodes(null)} className={buttonPrimary}>I&apos;ve saved them</button>
          </div>
        }
      >
        <ul className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-muted p-4 font-mono text-sm text-foreground">{codes?.map((c) => <li key={c}>{c}</li>)}</ul>
      </Modal>

      <Modal open={confirm2fa} onClose={() => setConfirm2fa(false)} icon={ShieldCheck} size="sm" title="Turn off two-factor sign-in?" subtitle="Your account will be protected by your password alone."
        footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setConfirm2fa(false)} className={buttonSecondary}>Keep it on</button><button type="button" onClick={() => { securityStore.set({ ...sec, twoFactor: false }); audit("Turned off two-factor sign-in"); setConfirm2fa(false); notify("Two-factor sign-in is off"); }} className={cn(buttonPrimary, "bg-danger hover:bg-danger/90")}>Turn off</button></div>}
      >
        <p className="text-sm text-muted-foreground">You can see passports, bank statements and visa files. We strongly recommend keeping it on.</p>
      </Modal>
    </div>
  );
}

function ChangePassword({ minLength, changedAt, onChanged, notify }: { minLength: number; changedAt: string; onChanged: () => void; notify: (t: string, tone?: "success" | "error") => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState(false);
  const [tried, setTried] = useState(false);
  const strength = passwordStrength(next);
  const errors = {
    current: !current ? "Enter your current password" : "",
    next: next.length < minLength ? `At least ${minLength} characters` : !/[A-Za-z]/.test(next) || !/\d/.test(next) ? "Mix letters and numbers" : next === current ? "Choose a different password" : strength.score < 2 ? "Too easy to guess — make it longer or less predictable" : "",
    again: again !== next ? "Passwords don't match" : "",
  };
  const ok = !errors.current && !errors.next && !errors.again;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!ok) return notify("Check the password fields", "error");
    onChanged();
    setCurrent(""); setNext(""); setAgain(""); setTried(false);
  };
  const input = (label: string, value: string, set: (v: string) => void, err: string, auto: string) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <input type={show ? "text" : "password"} value={value} onChange={(e) => set(e.target.value)} autoComplete={auto} className={fieldClass} />
      {tried && err && <span className="text-[11px] font-medium text-danger">{err}</span>}
    </label>
  );
  return (
    <Card className="h-fit p-5">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Change password</h3>
            <p className="text-xs text-muted-foreground">Last changed {formatDay(changedAt)}. At least {minLength} characters, per company policy.</p>
          </div>
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide passwords" : "Show passwords"} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
        </div>
        {input("Current password", current, setCurrent, errors.current, "current-password")}
        {input("New password", next, setNext, errors.next, "new-password")}
        {next && (
          <div className="-mt-2 flex items-center gap-2">
            <span className="grid flex-1 grid-cols-4 gap-1">{[1, 2, 3, 4].map((i) => <span key={i} className={cn("h-1.5 rounded-full", strength.score >= i ? (strength.score <= 1 ? "bg-danger" : strength.score === 2 ? "bg-warning" : "bg-success") : "bg-surface-hover")} />)}</span>
            <span className="w-16 text-right text-[11px] font-medium text-muted-foreground">{strength.label}</span>
          </div>
        )}
        {input("Confirm new password", again, setAgain, errors.again, "new-password")}
        <button type="submit" className={cn(buttonPrimary, "self-start")}><KeyRound className="size-4" /> Update password</button>
        <p className="text-[11px] text-muted-foreground">Demo build: passwords aren&apos;t stored or checked yet — this records the change in the audit log.</p>
      </form>
    </Card>
  );
}
