"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Award, CheckCircle2, ListVideo, Play, Search, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Field, PillGroup, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { parseVideo, playlistCategories, videoLength, type Playlist, type PlaylistCategory, type VideoSession } from "@/lib/mock/training";
import { VideoThumb } from "./video";
import { cn } from "@/lib/utils";

const glass = "rounded-full bg-black/35 text-white ring-1 ring-white/20 backdrop-blur-md";

/** Playlist cover: the first video full-bleed, a filmstrip of what follows, and the learner's progress along the bottom edge. */
export function PlaylistThumb({ videos, done = 0, earned, className }: { videos: VideoSession[]; done?: number; earned?: boolean; className?: string }) {
  const thumbs = videos.map((v) => parseVideo(v.url).thumb);
  const [cover, ...rest] = thumbs;
  const strip = rest.slice(0, 3);
  const pct = videos.length ? Math.round((done / videos.length) * 100) : 0;
  const secs = videos.reduce((n, v) => n + (v.seconds ?? v.minutes * 60), 0);
  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-[#17305c] via-primary to-violet-500 ring-1 ring-black/5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail */}
      {cover && <img src={cover} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" loading="lazy" />}
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/25" />

      <span className="absolute inset-x-2.5 top-2.5 flex items-center justify-between gap-2">
        <span className={cn(glass, "inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider")}><ListVideo className="size-3" /> {videos.length} {videos.length === 1 ? "lesson" : "lessons"}</span>
        {earned ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-lg shadow-amber-500/30"><Award className="size-3" /> Certified</span>
        ) : (
          <span className={cn(glass, "px-2.5 py-1 text-[10px] font-semibold tabular-nums")}>{videoLength({ minutes: 0, seconds: secs })}</span>
        )}
      </span>

      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-12 scale-90 items-center justify-center rounded-full bg-white/20 text-white opacity-0 ring-1 ring-white/40 backdrop-blur-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
          <Play className="ml-0.5 size-5 fill-current" />
        </span>
      </span>

      <span className="absolute inset-x-2.5 bottom-3.5 flex items-end justify-between gap-2">
        <span className="flex items-center">
          {strip.map((t, i) => (
            <span key={i} className={cn("relative aspect-video w-11 overflow-hidden rounded-md bg-slate-700 shadow-md ring-2 ring-white/80", i > 0 && "-ml-3")} style={{ zIndex: 3 - i }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail */}
              {t && <img src={t} alt="" className="size-full object-cover" loading="lazy" />}
            </span>
          ))}
          {rest.length > strip.length && <span className="ml-1.5 text-[10px] font-semibold text-white/85">+{rest.length - strip.length}</span>}
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-white drop-shadow">{earned ? "Complete" : pct ? `${pct}% done` : "Start module"}</span>
      </span>

      <span className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
        <span className={cn("block h-full transition-[width] duration-500", earned ? "bg-gradient-to-r from-amber-300 to-amber-500" : "bg-gradient-to-r from-sky-400 to-primary")} style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

type Draft = Pick<Playlist, "title" | "description" | "category" | "videoIds">;

export function PlaylistDialog({ playlist, videos, onClose, onSave }: { playlist?: Playlist; videos: VideoSession[]; onClose: () => void; onSave: (d: Draft) => void }) {
  const [f, setF] = useState<Draft>(() => playlist ? { title: playlist.title, description: playlist.description, category: playlist.category, videoIds: playlist.videoIds.filter((id) => videos.some((v) => v.id === id)) } : { title: "", description: "", category: "Counsellor Training", videoIds: [] });
  const [search, setSearch] = useState("");
  const [tried, setTried] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setF((p) => ({ ...p, [k]: v }));
  const byId = (id: string) => videos.find((v) => v.id === id);
  const errors: string[] = [];
  if (f.title.trim().length < 3) errors.push("Give the playlist a name");
  if (!f.videoIds.length) errors.push("Add at least one video");
  const q = search.trim().toLowerCase();
  const pool = videos.filter((v) => !q || `${v.title} ${v.area}`.toLowerCase().includes(q));
  const toggle = (id: string) => set("videoIds", f.videoIds.includes(id) ? f.videoIds.filter((x) => x !== id) : [...f.videoIds, id]);
  const move = (i: number, d: -1 | 1) => {
    const next = [...f.videoIds];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    set("videoIds", next);
  };

  return (
    <Modal open onClose={onClose} icon={ListVideo} size="lg" title={playlist ? "Edit playlist" : "New playlist"} subtitle="Group video sessions in the order they should be watched."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{tried && errors.length ? <span className="font-medium text-danger">{errors[0]}</span> : `${f.videoIds.length} video${f.videoIds.length === 1 ? "" : "s"} · ${videoLength({ minutes: 0, seconds: f.videoIds.reduce((n, id) => n + (byId(id)?.seconds ?? (byId(id)?.minutes ?? 0) * 60), 0) })}`}</span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
            <button type="button" onClick={() => { setTried(true); if (!errors.length) onSave({ ...f, title: f.title.trim(), description: f.description.trim() }); }} className={buttonPrimary}>{playlist ? "Save" : "Create playlist"}</button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Playlist name" required>
          <TextInput value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Counsellor Training" />
        </Field>
        <Field label="Category">
          <PillGroup<PlaylistCategory> options={playlistCategories.map((c) => ({ value: c, label: c }))} value={f.category} onChange={(c) => set("category", c)} />
        </Field>
        <Field label="Description">
          <Textarea rows={2} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Who it's for and what they'll learn" />
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-xs font-semibold text-foreground">Library</p>
            <label className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm focus-within:border-primary">
              <Search className="size-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search videos" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" aria-label="Search library" />
            </label>
            <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
              {pool.map((v) => {
                const on = f.videoIds.includes(v.id);
                return (
                  <li key={v.id}>
                    <button type="button" onClick={() => toggle(v.id)} aria-pressed={on} className={cn("flex w-full items-center gap-2.5 rounded-xl border p-1.5 text-left transition-colors", on ? "border-primary bg-primary-soft" : "border-transparent hover:bg-surface-hover")}>
                      <VideoThumb video={v} className="w-20 shrink-0 rounded-lg [&_svg]:size-5 [&>span:not(:first-child)]:hidden" />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-xs font-medium text-foreground">{v.title}</span>
                        <span className="text-[10px] text-muted-foreground">{videoLength(v)}</span>
                      </span>
                      {on && <CheckCircle2 className="size-4 shrink-0 text-primary" />}
                    </button>
                  </li>
                );
              })}
              {!pool.length && <li className="px-2 py-6 text-center text-xs text-muted-foreground">No videos match</li>}
            </ul>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-xs font-semibold text-foreground">Play order</p>
            {f.videoIds.length ? (
              <ol className="flex max-h-[20.5rem] flex-col gap-1 overflow-y-auto pr-1">
                {f.videoIds.map((id, i) => {
                  const v = byId(id);
                  if (!v) return null;
                  return (
                    <li key={id} className="flex items-center gap-2 rounded-xl border border-border px-2 py-1.5">
                      <span className="w-4 text-center text-[11px] font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                      <span className="line-clamp-1 min-w-0 flex-1 text-xs font-medium text-foreground">{v.title}</span>
                      <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover disabled:opacity-30"><ArrowUp className="size-3.5" /></button>
                      <button type="button" disabled={i === f.videoIds.length - 1} onClick={() => move(i, 1)} aria-label="Move down" className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover disabled:opacity-30"><ArrowDown className="size-3.5" /></button>
                      <button type="button" onClick={() => toggle(id)} aria-label="Remove" className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger-soft hover:text-danger"><X className="size-3.5" /></button>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="flex h-full min-h-32 items-center justify-center rounded-xl border border-dashed border-border px-4 text-center text-xs text-muted-foreground">Pick videos from the library — they play in the order you add them.</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
