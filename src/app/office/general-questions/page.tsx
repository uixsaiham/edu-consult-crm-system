"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  BookOpenCheck,
  ChevronDown,
  CircleAlert,
  Copy,
  Download,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
  Lock,
  PencilLine,
  Pin,
  Plus,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { Modal } from "@/components/ui/modal";
import { Checkbox, Field, PillGroup, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { formatDay } from "@/components/people/people-ui";
import { EmptyState } from "@/components/office/office-ui";
import { faqCategories, getFaqs, saveFaqs, type Faq, type FaqAudience, type FaqCategory } from "@/lib/mock/office";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const MAX_ANSWER = 800;
const stop = new Set(["the", "a", "an", "i", "can", "do", "to", "for", "of", "in", "is", "my", "how", "what", "which", "does", "are", "and", "or", "with", "should", "need", "you", "be", "it"]);
const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2 && !stop.has(w)));

interface Draft {
  id?: string;
  question: string;
  answer: string;
  category: FaqCategory;
  audience: FaqAudience;
  tags: string;
  published: boolean;
  onWebsite: boolean;
  pinned: boolean;
}
const emptyDraft: Draft = { question: "", answer: "", category: "Admissions", audience: "Students", tags: "", published: true, onWebsite: true, pinned: false };

export default function GeneralQuestionsPage() {
  const { user } = useUser();
  const [faqs, setFaqs] = useState<Faq[]>(getFaqs);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FaqCategory | "">("");
  const [audience, setAudience] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState<Set<string>>(() => new Set(["Q-03"]));
  const [voted, setVoted] = useState<Record<string, "up" | "down">>({});
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [tried, setTried] = useState(false);
  const [deleting, setDeleting] = useState<Faq | null>(null);
  const [toast, notify] = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => saveFaqs(faqs), [faqs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return faqs
      .filter(
        (f) =>
          (!category || f.category === category) &&
          (!audience || f.audience === audience) &&
          (!status || (status === "Published" ? f.published : !f.published)) &&
          (!q || `${f.question} ${f.answer} ${f.tags.join(" ")}`.toLowerCase().includes(q))
      )
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || faqCategories.indexOf(a.category) - faqCategories.indexOf(b.category) || b.helpful - a.helpful);
  }, [faqs, search, category, audience, status]);

  const groups = faqCategories.map((c) => ({ category: c, items: filtered.filter((f) => f.category === c) })).filter((g) => g.items.length);
  const published = faqs.filter((f) => f.published);
  const helpfulRate = (() => {
    const up = faqs.reduce((n, f) => n + f.helpful, 0);
    const down = faqs.reduce((n, f) => n + f.notHelpful, 0);
    return up + down ? Math.round((up / (up + down)) * 100) : 0;
  })();

  // Similar questions while typing, to avoid duplicates.
  const similar = useMemo(() => {
    const w = words(draft.question);
    if (w.size < 2) return [];
    return faqs
      .filter((f) => f.id !== draft.id)
      .map((f) => {
        const other = words(f.question);
        const overlap = [...w].filter((x) => other.has(x)).length;
        return { f, score: overlap / Math.min(w.size, other.size || 1) };
      })
      .filter((x) => x.score >= 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.f);
  }, [draft.question, draft.id, faqs]);

  const errors: Record<string, string> = {};
  if (draft.question.trim().length < 10) errors.question = "Write the question in full (at least 10 characters)";
  else if (!draft.question.trim().endsWith("?")) errors.question = "End the question with a question mark";
  if (draft.answer.trim().length < 20) errors.answer = "Write a helpful answer (at least 20 characters)";
  if (draft.answer.length > MAX_ANSWER) errors.answer = `Keep answers under ${MAX_ANSWER} characters`;
  const err = (k: string) => (tried ? errors[k] : undefined);

  const setD = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.keys(errors).length) return;
    const now = new Date().toISOString();
    const base = {
      question: draft.question.trim(),
      answer: draft.answer.trim(),
      category: draft.category,
      audience: draft.audience,
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      published: draft.published,
      onWebsite: draft.audience === "Students" && draft.published && draft.onWebsite,
      pinned: draft.pinned,
      updatedAt: now,
      updatedBy: user.name,
    };
    if (draft.id) {
      setFaqs((prev) => prev.map((f) => (f.id === draft.id ? { ...f, ...base } : f)));
      notify("Question updated");
    } else {
      const id = `Q-${Date.now().toString(36).toUpperCase()}`;
      setFaqs((prev) => [{ id, ...base, helpful: 0, notHelpful: 0, views: 0 }, ...prev]);
      setOpen((s) => new Set(s).add(id));
      setCategory("");
      notify(draft.published ? "Question published" : "Saved as draft");
    }
    setDraft(emptyDraft);
    setTried(false);
  };

  const edit = (f: Faq) => {
    setDraft({ id: f.id, question: f.question, answer: f.answer, category: f.category, audience: f.audience, tags: f.tags.join(", "), published: f.published, onWebsite: f.onWebsite, pinned: f.pinned });
    setTried(false);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const patch = (id: string, p: Partial<Faq>) => setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...p } : f)));
  const toggle = (f: Faq) => {
    const next = new Set(open);
    if (next.has(f.id)) next.delete(f.id);
    else {
      next.add(f.id);
      patch(f.id, { views: f.views + 1 });
    }
    setOpen(next);
  };
  const vote = (f: Faq, dir: "up" | "down") => {
    const prev = voted[f.id];
    if (prev === dir) return;
    patch(f.id, {
      helpful: f.helpful + (dir === "up" ? 1 : 0) - (prev === "up" ? 1 : 0),
      notHelpful: f.notHelpful + (dir === "down" ? 1 : 0) - (prev === "down" ? 1 : 0),
    });
    setVoted((v) => ({ ...v, [f.id]: dir }));
    if (dir === "down") notify("Thanks — the answer's author will review it");
  };
  const copy = async (f: Faq) => {
    try {
      await navigator.clipboard.writeText(f.answer);
      notify("Answer copied — paste it into WhatsApp or email");
    } catch {
      notify("Couldn't copy the answer", "error");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">General Questions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Approved answers to the questions students ask most — for the front desk, counsellors, WhatsApp replies and the website FAQ.</p>
        </div>
        <button
          type="button"
          onClick={() => downloadCsv("general-questions.csv", filtered.map((f) => ({ id: f.id, category: f.category, audience: f.audience, question: f.question, answer: f.answer, status: f.published ? "Published" : "Draft", website: f.onWebsite ? "Yes" : "No", tags: f.tags.join("; "), helpful: f.helpful, notHelpful: f.notHelpful, views: f.views, updated: f.updatedAt.slice(0, 10), updatedBy: f.updatedBy })))}
          className={buttonSecondary}
        >
          <Download className="size-4" /> Export
        </button>
      </header>

      <StatGrid>
        <StatCard icon={BookOpenCheck} label="Published answers" value={published.length} note={`${faqs.length - published.length} draft`} onClick={() => setStatus("Published")} />
        <StatCard icon={Globe} tone="primary" label="On the website" value={faqs.filter((f) => f.onWebsite).length} />
        <StatCard icon={Lock} tone="violet" label="Staff-only guidance" value={faqs.filter((f) => f.audience === "Staff only").length} onClick={() => setAudience("Staff only")} />
        <StatCard icon={ThumbsUp} tone={helpfulRate >= 85 ? "success" : "warning"} label="Rated helpful" value={`${helpfulRate}%`} />
      </StatGrid>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 card-shadow">
            <SearchField value={search} onChange={setSearch} placeholder="Search questions and answers…" label="Search questions" />
            <SelectFilter label="Audience" value={audience} onChange={setAudience} allLabel="Everyone" options={["Students", "Staff only"]} />
            <SelectFilter label="Status" value={status} onChange={setStatus} allLabel="Any status" options={["Published", "Draft"]} />
            {(search || audience || status || category) && <ResetFilters onClick={() => { setSearch(""); setAudience(""); setStatus(""); setCategory(""); }} />}
          </div>

          <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
            {(["", ...faqCategories] as const).map((c) => (
              <button key={c || "all"} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors", category === c ? "bg-foreground text-background" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground")}>
                {c || "All topics"}
                <span className="opacity-60">{c ? faqs.filter((f) => f.category === c).length : faqs.length}</span>
              </button>
            ))}
          </div>

          {groups.length === 0 ? (
            <EmptyState icon={HelpCircle} title="No questions match" body="Try different words, or add this question with the form so the next person finds it." />
          ) : (
            groups.map((g) => (
              <section key={g.category}>
                <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.category} · {g.items.length}</h3>
                <Card className="overflow-hidden">
                  <ul className="divide-y divide-border">
                    {g.items.map((f) => {
                      const isOpen = open.has(f.id);
                      return (
                        <li key={f.id} className={cn(!f.published && "bg-surface-muted/50")}>
                          <button type="button" onClick={() => toggle(f)} aria-expanded={isOpen} className="flex w-full items-start gap-3 px-5 py-3.5 text-left">
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-1.5">
                                {f.pinned && <Pin className="size-3.5 fill-current text-primary" />}
                                <span className="text-sm font-semibold text-foreground">{f.question}</span>
                              </span>
                              <span className="mt-1 flex flex-wrap gap-1">
                                {!f.published && <Badge tone="warning">Draft</Badge>}
                                {f.audience === "Staff only" && <Badge tone="violet"><Lock className="size-3" /> Staff only</Badge>}
                                {f.onWebsite && <Badge tone="primary"><Globe className="size-3" /> Website</Badge>}
                              </span>
                            </span>
                            <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                          </button>
                          {isOpen && (
                            <div className="animate-fade-in px-5 pb-4">
                              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{f.answer}</p>
                              {f.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {f.tags.map((t) => <button key={t} type="button" onClick={() => setSearch(t)} className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground">#{t}</button>)}
                                </div>
                              )}
                              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                                <span className="text-[11px] text-muted-foreground">Helpful?</span>
                                <VoteButton active={voted[f.id] === "up"} onClick={() => vote(f, "up")} label="Yes" count={f.helpful} icon={ThumbsUp} />
                                <VoteButton active={voted[f.id] === "down"} onClick={() => vote(f, "down")} label="No" count={f.notHelpful} icon={ThumbsDown} />
                                <span className="text-[11px] text-muted-foreground">· {f.views} views · updated {formatDay(f.updatedAt)} by {f.updatedBy}</span>
                                <div className="ml-auto flex items-center gap-0.5">
                                  <Action label="Copy answer" onClick={() => copy(f)}><Copy className="size-3.5" /></Action>
                                  <Action label={f.pinned ? "Unpin" : "Pin to top"} onClick={() => { patch(f.id, { pinned: !f.pinned }); notify(f.pinned ? "Unpinned" : "Pinned to the top"); }}><Pin className={cn("size-3.5", f.pinned && "fill-current text-primary")} /></Action>
                                  <Action label={f.published ? "Unpublish" : "Publish"} onClick={() => { patch(f.id, { published: !f.published, onWebsite: f.published ? false : f.onWebsite }); notify(f.published ? "Moved to drafts" : "Published"); }}>{f.published ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}</Action>
                                  <Action label="Edit" onClick={() => edit(f)}><PencilLine className="size-3.5" /></Action>
                                  <Action label="Delete" danger onClick={() => setDeleting(f)}><Trash2 className="size-3.5" /></Action>
                                </div>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </section>
            ))
          )}
        </div>

        <form ref={formRef} onSubmit={submit} noValidate className="scroll-mt-4 xl:sticky xl:top-0">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                  {draft.id ? <PencilLine className="size-4 text-primary" /> : <Plus className="size-4 text-primary" />}
                  {draft.id ? "Edit question" : "Add a question"}
                </h3>
                <p className="text-xs text-muted-foreground">{draft.id ? "Changes show everywhere this answer is used." : "Asked something twice? Add it here."}</p>
              </div>
              {draft.id && (
                <button type="button" onClick={() => { setDraft(emptyDraft); setTried(false); }} aria-label="Cancel editing" className="rounded-full p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"><X className="size-4" /></button>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <Field label="Topic">
                <Select value={draft.category} onChange={(e) => setD("category", e.target.value as FaqCategory)}>
                  {faqCategories.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Who is it for?">
                <PillGroup<FaqAudience> options={[{ value: "Students", label: "Students" }, { value: "Staff only", label: "Staff only" }]} value={draft.audience} onChange={(v) => setD("audience", v)} />
              </Field>
              <Field label="Question" required>
                <TextInput value={draft.question} onChange={(e) => setD("question", e.target.value)} placeholder="e.g. Can I switch courses after arriving?" aria-invalid={!!err("question")} className={cn(err("question") && "border-danger")} />
                <Err msg={err("question")} />
              </Field>
              {similar.length > 0 && (
                <div className="rounded-xl bg-warning-soft px-3 py-2.5 text-xs">
                  <p className="font-semibold text-foreground">Similar questions already exist</p>
                  <ul className="mt-1 flex flex-col gap-1">
                    {similar.map((f) => (
                      <li key={f.id}>
                        <button type="button" onClick={() => { setCategory(""); setSearch(""); setOpen((s) => new Set(s).add(f.id)); edit(f); }} title="Edit this one instead" className="text-left text-primary hover:underline">{f.question}</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Field label="Answer" required hint={`${draft.answer.length}/${MAX_ANSWER} · plain, friendly language; no promises about visas or offers.`}>
                <Textarea rows={7} value={draft.answer} onChange={(e) => setD("answer", e.target.value)} placeholder="Write the answer as you'd say it to a student." aria-invalid={!!err("answer")} className={cn("resize-y", err("answer") && "border-danger")} />
                <Err msg={err("answer")} />
              </Field>
              <Field label="Tags" hint="Separate with commas.">
                <TextInput value={draft.tags} onChange={(e) => setD("tags", e.target.value)} placeholder="e.g. Transfer, Course change" />
              </Field>
              <div className="flex flex-col gap-2.5">
                <Checkbox checked={draft.published} onChange={(v) => setD("published", v)} label="Publish now" />
                {draft.audience === "Students" && <Checkbox checked={draft.onWebsite && draft.published} onChange={(v) => { setD("onWebsite", v); if (v) setD("published", true); }} label="Show on the website FAQ" />}
                <Checkbox checked={draft.pinned} onChange={(v) => setD("pinned", v)} label="Pin to the top of its topic" />
              </div>
              <div className="flex gap-2">
                {draft.id && <button type="button" onClick={() => { setDraft(emptyDraft); setTried(false); }} className={cn(buttonSecondary, "flex-1")}>Cancel</button>}
                <button type="submit" className={cn(buttonPrimary, "flex-1")}>{draft.id ? "Save changes" : draft.published ? "Publish question" : "Save draft"}</button>
              </div>
            </div>
          </Card>
        </form>
      </div>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} icon={Trash2} size="sm" title="Delete this question?" subtitle={deleting?.question}
        footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setDeleting(null)} className={buttonSecondary}>Cancel</button><button type="button" onClick={() => { setFaqs((prev) => prev.filter((f) => f.id !== deleting!.id)); if (draft.id === deleting!.id) setDraft(emptyDraft); notify("Question deleted"); setDeleting(null); }} className={buttonDanger}>Delete</button></div>}
      >
        <p className="text-sm text-muted-foreground">{deleting?.onWebsite ? "It will also disappear from the website FAQ. " : ""}To keep it but hide it, unpublish it instead.</p>
      </Modal>
      {toast}
    </div>
  );
}

function Badge({ tone, children }: { tone: "warning" | "violet" | "primary"; children: ReactNode }) {
  const tones = { warning: "bg-warning-soft text-warning", violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400", primary: "bg-primary-soft text-primary" };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", tones[tone])}>{children}</span>;
}

function VoteButton({ active, onClick, label, count, icon: Icon }: { active: boolean; onClick: () => void; label: string; count: number; icon: typeof ThumbsUp }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn("inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-semibold transition-colors", active ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
      <Icon className="size-3" /> {label} <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );
}

function Action({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={cn("flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors", danger ? "hover:bg-danger-soft hover:text-danger" : "hover:bg-surface-hover hover:text-foreground")}>
      {children}
    </button>
  );
}

function Err({ msg }: { msg?: string }) {
  return msg ? <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-danger"><CircleAlert className="size-3" /> {msg}</span> : null;
}
