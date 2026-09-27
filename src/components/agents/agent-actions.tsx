"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Mail,
  MoreHorizontal,
  Paperclip,
  PencilLine,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Checkbox, Field, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { AnchoredMenu, MenuDivider, MenuItem } from "@/components/applications/list/anchored-menu";
import { useUser } from "@/components/layout/user-context";
import { formatDay } from "@/components/people/people-ui";
import { agreementPdf, getAgents, requiredDocs, today, type Agent } from "@/lib/mock/agents";
import { cn } from "@/lib/utils";

export type AgentDialog = "login" | "email" | "agreement" | "delete";

const stamp = () => `${today}T${new Date().toISOString().slice(11, 19)}Z`;

/** Edit, email, login, agreement and delete — shown at the top of an agent's details. */
export function AgentTopActions({ agent, onAction }: { agent: Agent; onAction: (d: AgentDialog) => void }) {
  const chip =
    "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-hover";
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link href={`/agent-management/${agent.id}/edit`} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover">
        <PencilLine className="size-3.5" /> Edit
      </Link>
      <button type="button" onClick={() => onAction("email")} className={chip}>
        <Mail className="size-3.5" /> Email
      </button>
      <button type="button" onClick={() => onAction("login")} className={chip}>
        <KeyRound className="size-3.5" /> {agent.login ? "Change password" : "Create login"}
      </button>
      <button type="button" onClick={() => onAction("agreement")} className={chip}>
        <FileText className="size-3.5" /> Agreement
      </button>
      <button
        type="button"
        onClick={() => onAction("delete")}
        aria-label={`Delete ${agent.name}`}
        title="Delete agent"
        className="ml-auto flex size-8 items-center justify-center rounded-full border border-danger/30 text-danger transition-colors hover:bg-danger-soft"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

/** "⋯" menu for a table row. */
export function AgentRowMenu({ agent, onAction }: { agent: Agent; onAction: (d: AgentDialog) => void }) {
  return (
    <AnchoredMenu
      label={`More actions for ${agent.name}`}
      align="end"
      width={200}
      trigger={<MoreHorizontal className="size-4" />}
      triggerClassName="flex size-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground shadow-xs transition-colors hover:bg-primary-soft hover:text-primary"
    >
      {(close) => (
        <>
          <MenuItem icon={Mail} onClick={() => { close(); onAction("email"); }}>Email agent</MenuItem>
          <MenuItem icon={KeyRound} onClick={() => { close(); onAction("login"); }}>{agent.login ? "Change password" : "Create login"}</MenuItem>
          <MenuItem icon={FileText} onClick={() => { close(); onAction("agreement"); }}>Agreement & policy</MenuItem>
          <MenuDivider />
          <MenuItem icon={Trash2} tone="danger" onClick={() => { close(); onAction("delete"); }}>Delete agent</MenuItem>
        </>
      )}
    </AnchoredMenu>
  );
}

/**
 * Renders whichever agent dialog is open.
 * `onChange` applies an edit to the agent and shows `message`; `onDelete` removes it.
 */
export function AgentDialogs({
  agent,
  dialog,
  applications,
  onClose,
  onChange,
  onDelete,
}: {
  agent: Agent;
  dialog: AgentDialog;
  applications: number;
  onClose: () => void;
  onChange: (fn: (a: Agent) => Agent, message: string) => void;
  onDelete: () => void;
}) {
  if (dialog === "login") return <LoginDialog agent={agent} onClose={onClose} onChange={onChange} />;
  if (dialog === "email") return <EmailDialog agent={agent} onClose={onClose} onChange={onChange} />;
  if (dialog === "agreement") return <AgreementViewer agent={agent} onClose={onClose} />;
  return <DeleteDialog agent={agent} applications={applications} onClose={onClose} onDelete={onDelete} />;
}

// --- Login / password -------------------------------------------------------------

function strength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score <= 2 ? { label: "Weak", tone: "bg-danger", width: "33%" } : score <= 3 ? { label: "Fair", tone: "bg-warning", width: "66%" } : { label: "Strong", tone: "bg-success", width: "100%" };
}

function generatePassword() {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "!@#$%&*?"];
  const all = sets.join("");
  const rand = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  const chars = [...sets.map((s) => s[rand(s.length)]), ...Array.from({ length: 10 }, () => all[rand(all.length)])];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function LoginDialog({ agent, onClose, onChange }: { agent: Agent; onClose: () => void; onChange: (fn: (a: Agent) => Agent, message: string) => void }) {
  const { user } = useUser();
  const [company, setCompany] = useState(agent.name);
  const [name, setName] = useState(agent.contactName);
  const [email, setEmail] = useState(agent.email);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [tried, setTried] = useState(false);
  const hasLogin = !!agent.login;

  const errors: Record<string, string> = {};
  if (!company.trim()) errors.company = "Enter the company name";
  if (!name.trim()) errors.name = "Enter the agent's name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email";
  else if (getAgents().some((a) => a.id !== agent.id && a.email.toLowerCase() === email.trim().toLowerCase())) errors.email = "Another agent already signs in with this email";
  if (password.length < 8) errors.password = "Use at least 8 characters";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = "Include letters and numbers";
  if (confirm !== password) errors.confirm = "Passwords don't match";
  const err = (k: string) => (tried ? errors[k] : undefined);
  const meter = strength(password);

  const save = () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    const at = stamp();
    const cleanEmail = email.trim().toLowerCase();
    onChange(
      (a) => ({
        ...a,
        name: company.trim(),
        contactName: name.trim(),
        email: cleanEmail,
        login: { createdAt: a.login?.createdAt ?? today, passwordChangedAt: today },
        activity: [{ at, text: `${hasLogin ? "Portal password changed" : "Portal login created"}${sendEmail ? ` — details emailed to ${cleanEmail}` : ""}`, by: user.name }, ...a.activity],
      }),
      hasLogin ? `Password changed for ${name.trim()}` : `Login created for ${name.trim()}`
    );
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      icon={KeyRound}
      size="lg"
      title={hasLogin ? "Change agent password" : "Create agent login"}
      subtitle={hasLogin ? `Login created ${formatDay(agent.login!.createdAt)} · password last changed ${formatDay(agent.login!.passwordChangedAt)}` : "Gives the agent access to the BHE agent portal."}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button type="button" onClick={save} className={buttonPrimary}>
            <KeyRound className="size-4" /> {hasLogin ? "Update password" : "Create login"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <section>
          <h4 className="mb-3 text-sm font-bold text-foreground">Company information</h4>
          <Field label="Company name" required className="sm:max-w-sm">
            <TextInput value={company} onChange={(e) => setCompany(e.target.value)} aria-invalid={!!err("company")} className={cn(err("company") && "border-danger")} />
            <Hint msg={err("company")} />
          </Field>
        </section>

        <section>
          <h4 className="mb-3 text-sm font-bold text-foreground">Agent login information</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Agent name" required>
              <TextInput value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!err("name")} className={cn(err("name") && "border-danger")} />
              <Hint msg={err("name")} />
            </Field>
            <Field label="Email" required hint="Used to sign in.">
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!err("email")} className={cn(err("email") && "border-danger")} />
              <Hint msg={err("email")} />
            </Field>
            <Field label={hasLogin ? "New password" : "Password"} required>
              <div className="relative">
                <TextInput
                  type={visible ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!err("password")}
                  className={cn("pr-10", err("password") && "border-danger")}
                />
                <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground">
                  {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <Hint msg={err("password")} />
            </Field>
            <Field label="Confirm password" required>
              <TextInput type={visible ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={!!err("confirm")} className={cn(err("confirm") && "border-danger")} />
              <Hint msg={err("confirm")} />
            </Field>
            <div className="flex flex-col justify-end gap-2 sm:col-span-2">
              {password && (
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-hover">
                    <span className={cn("block h-full rounded-full", meter.tone)} style={{ width: meter.width }} />
                  </span>
                  <span className="font-semibold text-muted-foreground">{meter.label}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  const pw = generatePassword();
                  setPassword(pw);
                  setConfirm(pw);
                  setVisible(true);
                }}
                className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <Sparkles className="size-3.5" /> Generate a strong password
              </button>
            </div>
          </div>
        </section>

        <Checkbox
          checked={sendEmail}
          onChange={setSendEmail}
          label={
            <span>
              <span className="font-semibold">Email the login details to the agent</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">They&apos;ll be asked to choose their own password when they first sign in.</span>
            </span>
          }
        />
      </div>
    </Modal>
  );
}

// --- Email -----------------------------------------------------------------------------

function templatesFor(agent: Agent, sender: string) {
  const hi = `Dear ${agent.contactName},`;
  const sign = `\n\nKind regards,\n${sender}\nBHE Student Consultancy Ltd`;
  const missing = requiredDocs.filter((d) => agent.docs[d.key].status === "Missing" || agent.docs[d.key].status === "Rejected");
  return [
    { id: "blank", label: "Blank email", subject: "", body: `${hi}\n\n${sign.trimStart()}`, attach: false },
    {
      id: "documents",
      label: "Request missing documents",
      subject: "Documents needed to complete your BHE partner application",
      body: `${hi}\n\nThank you for applying to become a BHE recruitment partner. To finish our checks we still need:\n\n${(missing.length ? missing : requiredDocs).map((d) => `• ${d.label}${agent.docs[d.key].note ? ` (${agent.docs[d.key].note})` : ""}`).join("\n")}\n\nPlease reply to this email with clear scans or upload them in the agent portal.${sign}`,
      attach: false,
    },
    {
      id: "agreement",
      label: "Send agreement & policy",
      subject: "BHE Agent Agreement & Partner Policy",
      body: `${hi}\n\nPlease find attached our Agent Agreement and Partner Policy. Kindly read it, complete the schedule on the final page, sign, and return a copy to us.\n\nYour proposed terms: ${agent.tier} partner at ${agent.commissionShare}% of institution commission.${sign}`,
      attach: true,
    },
    {
      id: "renewal",
      label: "Agreement renewal",
      subject: "Renewing your BHE agent agreement",
      body: `${hi}\n\nYour agent agreement with BHE ${agent.agreementEnd ? `ends on ${formatDay(agent.agreementEnd)}` : "is due for renewal"}. We'd be glad to continue working together — please review the attached agreement and let us know if you have any questions before signing.${sign}`,
      attach: true,
    },
    {
      id: "welcome",
      label: "Welcome to BHE",
      subject: "Welcome to the BHE partner network",
      body: `${hi}\n\nWelcome aboard! Your account is now active as a ${agent.tier} partner. Your relationship manager is ${agent.manager}, who will be in touch to arrange portal training.\n\nYou can start submitting applications straight away through the BHE agent portal.${sign}`,
      attach: false,
    },
  ];
}

function EmailDialog({ agent, onClose, onChange }: { agent: Agent; onClose: () => void; onChange: (fn: (a: Agent) => Agent, message: string) => void }) {
  const { user } = useUser();
  const templates = templatesFor(agent, user.name);
  const initial = agent.status === "Pending" ? templates[1] : templates[0];
  const [template, setTemplate] = useState(initial.id);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [attach, setAttach] = useState(initial.attach);
  const [tried, setTried] = useState(false);

  const ccList = cc.split(/[,;\s]+/).filter(Boolean);
  const errors: Record<string, string> = {};
  if (!subject.trim()) errors.subject = "Add a subject";
  if (!body.trim()) errors.body = "Write a message";
  if (ccList.some((c) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c))) errors.cc = "Check the CC addresses";
  const err = (k: string) => (tried ? errors[k] : undefined);

  const pick = (id: string) => {
    const t = templates.find((x) => x.id === id)!;
    setTemplate(id);
    setSubject(t.subject);
    setBody(t.body);
    setAttach(t.attach);
  };

  const send = () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    const at = stamp();
    onChange(
      (a) => ({ ...a, activity: [{ at, text: `Email sent — "${subject.trim()}"${attach ? " (agreement attached)" : ""}`, by: user.name }, ...a.activity] }),
      `Email sent to ${agent.email}`
    );
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      icon={Mail}
      size="lg"
      title={`Email ${agent.name}`}
      subtitle="Sent from the CRM and saved to the agent's history."
      footer={
        <div className="flex items-center justify-between gap-2">
          <a href={`mailto:${agent.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}${cc ? `&cc=${encodeURIComponent(cc)}` : ""}`} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
            Open in my mail app
          </a>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
            <button type="button" onClick={send} className={buttonPrimary}><Send className="size-4" /> Send email</button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="To">
            <div className="flex min-h-[42px] items-center gap-2 rounded-xl border border-border bg-surface-muted px-3.5 text-sm">
              <span className="font-medium text-foreground">{agent.contactName}</span>
              <span className="truncate text-muted-foreground">&lt;{agent.email}&gt;</span>
            </div>
          </Field>
          <Field label="Template">
            <Select value={template} onChange={(e) => pick(e.target.value)}>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="CC" className="sm:col-span-2">
            <TextInput value={cc} onChange={(e) => setCc(e.target.value)} placeholder="Optional — separate addresses with commas" aria-invalid={!!err("cc")} className={cn(err("cc") && "border-danger")} />
            <Hint msg={err("cc")} />
          </Field>
          <Field label="Subject" required className="sm:col-span-2">
            <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} aria-invalid={!!err("subject")} className={cn(err("subject") && "border-danger")} />
            <Hint msg={err("subject")} />
          </Field>
          <Field label="Message" required className="sm:col-span-2">
            <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} aria-invalid={!!err("body")} className={cn("resize-y", err("body") && "border-danger")} />
            <Hint msg={err("body")} />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3.5 py-2.5">
          <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} className="size-4 accent-primary" />
          <Paperclip className="size-4 text-muted-foreground" />
          <span className="min-w-0 flex-1 text-sm text-foreground">Attach Agent Agreement &amp; Partner Policy <span className="text-xs text-muted-foreground">· PDF</span></span>
          <a href={agreementPdf} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline" onClick={(e) => e.stopPropagation()}>Preview</a>
        </label>
      </div>
    </Modal>
  );
}

// --- Agreement viewer ---------------------------------------------------------------

function AgreementViewer({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const signed = agent.docs.agreement;
  return (
    <Modal
      open
      onClose={onClose}
      icon={FileText}
      size="lg"
      title="Agent Agreement & Partner Policy"
      subtitle={`v2026.1 · ${agent.name} · ${signed.status === "Verified" ? "signed copy verified" : signed.status === "Missing" ? "not signed yet" : `signed copy ${signed.status.toLowerCase()}`}`}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Terms for this agent: <span className="font-semibold text-foreground">{agent.tier}, {agent.commissionShare}% share</span>
            {agent.agreementEnd && <> · ends {formatDay(agent.agreementEnd)}</>}
          </p>
          <div className="flex gap-2">
            <a href={agreementPdf} download className={buttonSecondary}><Download className="size-4" /> Download</a>
            <a href={agreementPdf} target="_blank" rel="noreferrer" className={buttonPrimary}><ExternalLink className="size-4" /> Open in new tab</a>
          </div>
        </div>
      }
    >
      <iframe src={`${agreementPdf}#view=FitH`} title="Agent Agreement & Partner Policy PDF" className="h-[65vh] w-full rounded-xl border border-border bg-surface-muted" />
    </Modal>
  );
}

// --- Delete ---------------------------------------------------------------------------

function DeleteDialog({ agent, applications, onClose, onDelete }: { agent: Agent; applications: number; onClose: () => void; onDelete: () => void }) {
  const [typed, setTyped] = useState("");
  const match = typed.trim().toLowerCase() === agent.name.toLowerCase();
  return (
    <Modal
      open
      onClose={onClose}
      icon={Trash2}
      size="sm"
      title={`Delete ${agent.name}?`}
      subtitle="This can't be undone."
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button type="button" disabled={!match} onClick={onDelete} className={buttonDanger}><Trash2 className="size-4" /> Delete agent</button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-sm">
        <ul className="flex list-disc flex-col gap-1 pl-5 text-xs text-muted-foreground">
          <li>Their portal login stops working immediately.</li>
          <li>Their KYC documents, bank details and history are removed.</li>
          <li>
            {applications > 0
              ? `Their ${applications} application${applications === 1 ? "" : "s"} stay in the CRM and still show the agent's name.`
              : "They have no applications, so nothing else is affected."}
          </li>
        </ul>
        {agent.status === "Active" && (
          <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs text-foreground">To keep their records, suspend or deactivate the agent instead.</p>
        )}
        <Field label={`Type "${agent.name}" to confirm`}>
          <TextInput value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </Field>
      </div>
    </Modal>
  );
}

function Hint({ msg }: { msg?: string }) {
  return msg ? <span className="text-[11px] font-medium text-danger">{msg}</span> : null;
}
