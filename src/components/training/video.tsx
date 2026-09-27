"use client";

import { useRef, useState } from "react";
import { Award, CheckCircle2, CircleHelp, ExternalLink, FileVideo, Link2, ListPlus, PlayCircle, RotateCcw, UploadCloud, Video, X, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Field, PillGroup, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { crmAreas, parseVideo, titleFromUrl, trainingToday, type CrmArea, type VideoSession, type VideoStatus } from "@/lib/mock/training";
import { QuizBuilder, cleanQuiz, quizProblems } from "./training-ui";
import { cn } from "@/lib/utils";

/** Plays a YouTube, Vimeo, Loom or Drive link in an embed, a video file natively, or links out. */
export function VideoPlayer({ url, title, onEnded, className }: { url: string; title: string; onEnded?: () => void; className?: string }) {
  const v = parseVideo(url);
  if (v.file) {
    return <video src={v.embed} controls preload="metadata" onEnded={onEnded} className={cn("aspect-video w-full rounded-2xl bg-black", className)} />;
  }
  if (v.embed) {
    return (
      <iframe
        src={v.embed}
        title={title}
        className={cn("aspect-video w-full rounded-2xl border-0 bg-black", className)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }
  return (
    <div className={cn("flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl bg-surface-muted text-center", className)}>
      <Link2 className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">This link can&apos;t be played inside the CRM</p>
      <a href={url} target="_blank" rel="noreferrer" className={cn(buttonSecondary, "mt-1")}><ExternalLink className="size-4" /> Open video</a>
    </div>
  );
}

const areaTone: Record<CrmArea, string> = {
  "Getting started": "from-primary to-sky-500",
  "Leads & follow-ups": "from-emerald-500 to-teal-500",
  Applications: "from-violet-500 to-primary",
  "WhatsApp & communications": "from-green-500 to-emerald-600",
  "Agents & ambassadors": "from-amber-500 to-orange-500",
  "Courses & institutions": "from-sky-500 to-cyan-500",
  Finance: "from-teal-500 to-emerald-500",
  "Targets & reports": "from-rose-500 to-pink-500",
  "People & settings": "from-slate-500 to-slate-700",
  "Counselling knowledge": "from-indigo-500 to-violet-500",
  "Company & culture": "from-orange-500 to-rose-500",
};

export function VideoThumb({ video, className }: { video: Pick<VideoSession, "url" | "area" | "title" | "minutes">; className?: string }) {
  const v = parseVideo(video.url);
  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br", areaTone[video.area], className)}>
      {v.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail
        <img src={v.thumb} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
      ) : (
        <Video className="absolute right-3 top-3 size-8 text-white/30" />
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/25">
        <PlayCircle className="size-12 text-white drop-shadow-lg" />
      </span>
      <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">{v.source}</span>
      {video.minutes > 0 && <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">{video.minutes} min</span>}
    </div>
  );
}

type Draft = Omit<VideoSession, "id" | "results" | "addedBy" | "addedAt">;
const newQuestion = () => ({ id: Math.random().toString(36).slice(2, 8), q: "", options: ["", "", "", ""], answer: 0, explain: "" });

export function VideoDialog({ video, presenters, onClose, onSave }: { video?: VideoSession; presenters: string[]; onClose: () => void; onSave: (d: Draft) => void }) {
  const [f, setF] = useState<Draft>(() =>
    video
      ? { ...video, quiz: video.quiz.length ? video.quiz : [newQuestion()] }
      : { title: "", description: "", url: "", area: "Getting started", presenter: presenters[0] ?? "", recordedOn: trainingToday, minutes: 0, quiz: [newQuestion()], passMark: 80 }
  );
  const [tab, setTab] = useState<"video" | "questions">("video");
  const [mode, setMode] = useState<"link" | "file">(video?.url.startsWith("blob:") ? "file" : "link");
  const [fileName, setFileName] = useState("");
  const [tried, setTried] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setF((x) => ({ ...x, [k]: v }));
  const parsed = parseVideo(f.url);

  const errors: Record<string, string> = {};
  if (!f.url.trim()) errors.url = mode === "link" ? "Paste the video link" : "Choose a video file";
  else if (mode === "link" && !/^https?:\/\//.test(f.url.trim())) errors.url = "Links start with https://";
  if (f.title.trim().length < 3) errors.title = "Give the session a title";
  const hasQuestions = f.quiz.some((q) => q.q.trim());
  if (hasQuestions && quizProblems(f.quiz).length) errors.quiz = quizProblems(f.quiz)[0];
  const err = (k: string) => (tried ? errors[k] : undefined);

  const pickFile = (file: File) => {
    if (!file.type.startsWith("video/")) return;
    setFileName(file.name);
    setF((x) => ({ ...x, url: URL.createObjectURL(file), title: x.title || file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ") }));
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => setF((x) => ({ ...x, minutes: x.minutes || Math.max(1, Math.round(probe.duration / 60)) }));
    probe.src = URL.createObjectURL(file);
  };

  return (
    <Modal
      open
      onClose={onClose}
      icon={Video}
      size="lg"
      title={video ? "Edit video session" : "Add video session"}
      subtitle="YouTube (videos or playlists), Vimeo, Loom and Google Drive links play inside the CRM."
      footer={
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{tried && Object.keys(errors).length ? <span className="font-medium text-danger">{Object.values(errors)[0]}</span> : hasQuestions ? `${f.quiz.filter((q) => q.q.trim()).length} questions · pass mark ${f.passMark}%` : "No questions yet — watching alone will count as complete"}</span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
            <button type="button" onClick={() => { setTried(true); if (errors.url || errors.title) setTab("video"); else if (errors.quiz) setTab("questions"); if (!Object.keys(errors).length) onSave({ ...f, title: f.title.trim(), url: f.url.trim(), description: f.description.trim(), quiz: cleanQuiz(f.quiz) }); }} className={buttonPrimary}>{video ? "Save" : "Add session"}</button>
          </div>
        </div>
      }
    >
      <div className="mb-4">
        <PillGroup<"video" | "questions"> options={[{ value: "video", label: "Video" }, { value: "questions", label: `Questions${hasQuestions ? ` (${f.quiz.filter((q) => q.q.trim()).length})` : ""}` }]} value={tab} onChange={setTab} />
      </div>
      {tab === "questions" ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-xl bg-primary-soft/60 px-3.5 py-2.5 text-xs text-foreground">Ask about what the video shows. Add at least 5. Learners answer after watching and must reach the pass mark for the session to count — they see their score, never the correct answers.</p>
          <Field label="Pass mark (%)" className="sm:max-w-40">
            <TextInput inputMode="numeric" value={f.passMark} onChange={(e) => set("passMark", Math.min(100, Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0))} />
          </Field>
          <QuizBuilder quiz={f.quiz} onChange={(quiz) => set("quiz", quiz)} />
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <PillGroup<"link" | "file"> options={[{ value: "link", label: "Paste a link" }, { value: "file", label: "Upload a file" }]} value={mode} onChange={(m) => { setMode(m); set("url", ""); setFileName(""); }} />
        </div>
        {mode === "link" ? (
          <Field label="Video link" required className="sm:col-span-2" hint={f.url && !err("url") ? `Detected: ${parsed.source}${parsed.embed ? " — plays in the CRM" : " — opens in a new tab"}` : "e.g. https://youtu.be/… or a Loom / Drive share link"}>
            <TextInput value={f.url} onChange={(e) => { const url = e.target.value; setF((x) => ({ ...x, url, title: x.title || (/^https?:\/\//.test(url) ? titleFromUrl(url) : "") })); }} placeholder="https://" aria-invalid={!!err("url")} className={cn(err("url") && "border-danger")} />
            {err("url") && <span className="text-[11px] font-medium text-danger">{err("url")}</span>}
          </Field>
        ) : (
          <Field label="Video file" required className="sm:col-span-2" hint="MP4, WebM or MOV. Uploads are kept for this session until storage is connected.">
            <input ref={input} type="file" accept="video/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) pickFile(file); e.target.value = ""; }} />
            {fileName ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-foreground"><FileVideo className="size-4 shrink-0 text-primary" /><span className="truncate">{fileName}</span></span>
                <button type="button" onClick={() => { set("url", ""); setFileName(""); }} aria-label="Remove file" className="rounded-md p-1 text-muted-foreground hover:bg-danger-soft hover:text-danger"><X className="size-4" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) pickFile(file); }} className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-border px-4 py-6 text-center transition-colors hover:border-primary hover:bg-primary-soft/30">
                <UploadCloud className="size-5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Click to upload or drag a video here</span>
              </button>
            )}
            {err("url") && <span className="text-[11px] font-medium text-danger">{err("url")}</span>}
          </Field>
        )}
        {f.url && /^(https?:|blob:)/.test(f.url) && <div className="sm:col-span-2"><VideoPlayer url={f.url} title={f.title || "Preview"} /></div>}
        <Field label="Title" required className="sm:col-span-2">
          <TextInput value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Adding a new application step by step" aria-invalid={!!err("title")} className={cn(err("title") && "border-danger")} />
          {err("title") && <span className="text-[11px] font-medium text-danger">{err("title")}</span>}
        </Field>
        <Field label="CRM area">
          <Select value={f.area} onChange={(e) => set("area", e.target.value as CrmArea)}>{crmAreas.map((a) => <option key={a}>{a}</option>)}</Select>
        </Field>
        <Field label="Presenter">
          <Select value={f.presenter} onChange={(e) => set("presenter", e.target.value)}>{[...new Set([f.presenter, ...presenters])].filter(Boolean).map((p) => <option key={p}>{p}</option>)}</Select>
        </Field>
        <Field label="Recorded on">
          <TextInput type="date" max={trainingToday} value={f.recordedOn} onChange={(e) => set("recordedOn", e.target.value)} />
        </Field>
        <Field label="Length (minutes)">
          <TextInput inputMode="numeric" value={f.minutes || ""} onChange={(e) => set("minutes", Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0)} placeholder="e.g. 18" />
        </Field>
        <Field label="What it covers" className="sm:col-span-2">
          <Textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Topics and timestamps, e.g. 02:10 adding a course choice · 07:45 requesting documents" />
        </Field>
      </div>
      )}
    </Modal>
  );
}

/** Paste many links at once: "Title | link" or just the link, one per line. */
export function ImportDialog({ presenter, onClose, onImport }: { presenter: string; onClose: () => void; onImport: (rows: { title: string; url: string }[], area: CrmArea) => void }) {
  const [text, setText] = useState("");
  const [area, setArea] = useState<CrmArea>("Getting started");
  const rows = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [a, b] = line.includes("|") ? line.split("|").map((x) => x.trim()) : ["", line];
      const url = b || a;
      return { title: (b ? a : "") || titleFromUrl(url), url, ok: /^https?:\/\//.test(url) };
    });
  const good = rows.filter((r) => r.ok);
  return (
    <Modal
      open
      onClose={onClose}
      icon={ListPlus}
      size="lg"
      title="Import video sessions"
      subtitle={`One per line. Presenter is set to ${presenter}; edit any session afterwards.`}
      footer={<div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{rows.length ? `${good.length} ready${rows.length - good.length ? ` · ${rows.length - good.length} not a link` : ""}` : ""}</span><div className="flex gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" disabled={!good.length} onClick={() => onImport(good, area)} className={buttonPrimary}>Import {good.length || ""}</button></div></div>}
    >
      <div className="flex flex-col gap-4">
        <Field label="Links" hint="Format: Title | https://link — or just the link and we'll name it from the URL. A YouTube playlist link imports as one session that plays the whole playlist.">
          <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} className="resize-y font-mono text-xs" placeholder={"Leads module walkthrough | https://youtu.be/…\nApplications: adding course choices | https://www.loom.com/share/…\nhttps://drive.google.com/file/d/…/view"} />
        </Field>
        <Field label="CRM area for all of them">
          <Select value={area} onChange={(e) => setArea(e.target.value as CrmArea)}>{crmAreas.map((a) => <option key={a}>{a}</option>)}</Select>
        </Field>
        {rows.length > 0 && (
          <ul className="max-h-48 overflow-y-auto rounded-xl border border-border text-xs">
            {rows.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 last:border-0">
                <span className={cn("min-w-0 truncate", r.ok ? "text-foreground" : "text-danger line-through")}>{r.title}</span>
                <span className={cn("shrink-0 text-[11px]", r.ok ? "text-muted-foreground" : "text-danger")}>{r.ok ? parseVideo(r.url).source : "not a link"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

export const videoStatusStyle: Record<VideoStatus, { cls: string; icon: typeof CheckCircle2; label: string }> = {
  "Not watched": { cls: "text-primary", icon: PlayCircle, label: "New for you" },
  "Quiz due": { cls: "text-warning", icon: CircleHelp, label: "Quiz to take" },
  Failed: { cls: "text-danger", icon: XCircle, label: "Quiz not passed" },
  Passed: { cls: "text-success", icon: CheckCircle2, label: "Completed" },
};

/** Right/wrong marker for a submitted question — never reveals the correct option. */
function QuestionMark({ right }: { right: boolean }) {
  return <p className={cn("mt-1.5 flex items-center gap-1 text-xs font-medium", right ? "text-success" : "text-danger")}>{right ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}{right ? "Correct" : "Incorrect"}</p>;
}

export function VideoQuiz({ video, passed, attempts, onSubmit }: { video: VideoSession; passed: boolean; attempts: { score: number }[]; onSubmit: (score: number) => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const best = attempts.length ? Math.max(...attempts.map((a) => a.score)) : undefined;
  if (passed && score === null) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-success-soft px-4 py-3 text-sm font-medium text-success">
        <Award className="size-4" /> Completed — best score {best ?? 100}%.
      </p>
    );
  }
  const all = video.quiz.every((q) => answers[q.id] !== undefined);
  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="text-sm font-semibold text-foreground">Questions on this session</p>
      <p className="text-xs text-muted-foreground">Pass mark {video.passMark}%{attempts.length ? ` · ${attempts.length} attempt${attempts.length === 1 ? "" : "s"}, best ${best}%` : ""}</p>
      {score !== null && (
        <p className={cn("mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium", score >= video.passMark ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
          {score >= video.passMark ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {score >= video.passMark ? `${score}% — passed. This session now counts in your training.` : `${score}% — not quite. Rewatch the session and try again.`}
        </p>
      )}
      <ol className="mt-3 flex flex-col gap-3">
        {video.quiz.map((q, i) => (
          <li key={q.id}>
            <p className="text-sm font-medium text-foreground">{i + 1}. {q.q}</p>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2" role="radiogroup" aria-label={q.q}>
              {q.options.map((o, oi) => {
                const chosen = answers[q.id] === oi;
                const reveal = score !== null;
                return (
                  <button key={oi} type="button" role="radio" aria-checked={chosen} disabled={reveal} onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))} className={cn("rounded-xl border px-3 py-2 text-left text-sm transition-colors", chosen ? "border-primary bg-primary-soft" : "border-border", !reveal && !chosen && "hover:bg-surface-hover")}>
                    {o}
                  </button>
                );
              })}
            </div>
            {score !== null && <QuestionMark right={answers[q.id] === q.answer} />}
          </li>
        ))}
      </ol>
      <div className="mt-4 flex justify-end">
        {score !== null && score < video.passMark ? (
          <button type="button" onClick={() => { setAnswers({}); setScore(null); }} className={buttonSecondary}><RotateCcw className="size-4" /> Try again</button>
        ) : score === null ? (
          <button type="button" disabled={!all} onClick={() => { const s = Math.round((video.quiz.filter((x) => answers[x.id] === x.answer).length / video.quiz.length) * 100); setScore(s); onSubmit(s); }} className={buttonPrimary}>Submit answers</button>
        ) : null}
      </div>
    </div>
  );
}
