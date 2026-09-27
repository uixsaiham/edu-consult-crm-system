"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, ListVideo, Play, Search, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Field, PillGroup, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { parseVideo, playlistCategories, videoLength, type Playlist, type PlaylistCategory, type VideoSession } from "@/lib/mock/training";
import { VideoThumb } from "./video";
import { cn } from "@/lib/utils";

/** YouTube-style playlist cover: the first video's thumbnail with a stack behind it and a video-count panel. */
export function PlaylistThumb({ videos, className }: { videos: VideoSession[]; className?: string }) {
  const [first, second] = videos;
  const thumb = first ? parseVideo(first.url).thumb : undefined;
  const secondThumb = second ? parseVideo(second.url).thumb : undefined;
  return (
    <div className={cn("relative pt-2.5", className)}>
      <div className="absolute inset-x-5 top-0 h-4 overflow-hidden rounded-t-xl bg-surface-muted opacity-60">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail */}
        {secondThumb && <img src={secondThumb} alt="" className="size-full object-cover" loading="lazy" />}
      </div>
      <div className="absolute inset-x-2.5 top-1.5 h-4 rounded-t-xl border-t border-white/40 bg-slate-400/70 dark:bg-slate-600/70" />
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-violet-500">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail */}
        {thumb && <img src={thumb} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />}
        <span className="absolute inset-y-0 right-0 flex w-[34%] flex-col items-center justify-center gap-1 bg-black/70 text-white backdrop-blur-[2px]">
          <span className="text-lg font-semibold tabular-nums">{videos.length}</span>
          <ListVideo className="size-5" />
        </span>
        <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/0 text-sm font-semibold text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
          <Play className="size-4 fill-current" /> Play all
        </span>
      </div>
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
