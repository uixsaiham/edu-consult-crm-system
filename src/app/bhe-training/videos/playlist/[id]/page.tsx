"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Award, Check, ChevronLeft, ChevronRight, Clock3, ListVideo, PencilLine, Plus, Search, SearchX, Trash2, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { formatDay } from "@/components/people/people-ui";
import { VideoDialog, VideoPlayer, VideoQuiz, videoStatusStyle } from "@/components/training/video";
import { PlaylistDialog } from "@/components/training/playlist";
import { ModuleCertificate } from "@/components/training/certificate";
import { getStaff } from "@/lib/mock/staff";
import { getPlaylists, getVideos, nextVideoId, parseVideo, playlistCompletion, savePlaylists, saveVideos, trainingToday, videoLength, videoProgress, videoStatus, type Playlist, type VideoSession } from "@/lib/mock/training";
import { cn } from "@/lib/utils";

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const staff = useMemo(() => getStaff().filter((s) => s.status === "Active" || s.status === "On leave"), []);
  const myId = staff.find((s) => s.name === user.name)?.id ?? "";
  const [videos, setVideos] = useState<VideoSession[]>(getVideos);
  const [playlists, setPlaylists] = useState<Playlist[]>(getPlaylists);
  const playlist = playlists.find((p) => p.id === id);
  const list = (playlist?.videoIds ?? []).map((vid) => videos.find((v) => v.id === vid)).filter((v): v is VideoSession => !!v);
  const [playingId, setPlayingId] = useState<string | undefined>(() => (list.find((v) => videoStatus(v, myId) !== "Passed") ?? list[0])?.id);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<VideoSession | "new" | null>(null);
  const [editingPl, setEditingPl] = useState(false);
  const [deleting, setDeleting] = useState<VideoSession | null>(null);
  const [cert, setCert] = useState<"view" | "celebrate" | null>(null);
  const [toast, notify] = useToast();

  useEffect(() => saveVideos(videos), [videos]);
  useEffect(() => savePlaylists(playlists), [playlists]);

  if (!playlist) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border px-6 py-20 text-center">
        <SearchX className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">This playlist doesn&apos;t exist or was deleted</p>
        <Link href="/bhe-training/videos" className={buttonSecondary}><ChevronLeft className="size-4" /> Video Sessions</Link>
      </div>
    );
  }

  const index = Math.max(0, list.findIndex((v) => v.id === playingId));
  const playing = list[index];
  const status = playing ? videoStatus(playing, myId) : undefined;
  const completion = playlistCompletion(list, myId);
  const done = completion.done;
  /** Passing `v` is the last step when every other video in the module is already passed. */
  const finishesModule = (v: VideoSession) => !!myId && list.every((x) => x.id === v.id || videoStatus(x, myId) === "Passed");
  const q = search.trim().toLowerCase();
  const shown = list.filter((v) => !q || `${v.title} ${v.description}`.toLowerCase().includes(q));
  const presenters = [...new Set([user.name, ...videos.map((v) => v.presenter)])];

  const updatePlaylist = (fn: (p: Playlist) => Playlist) => setPlaylists((prev) => prev.map((p) => (p.id === playlist.id ? fn(p) : p)));
  const patchResult = (v: VideoSession, fn: (r: VideoSession["results"][string]) => VideoSession["results"][string]) =>
    setVideos((prev) => prev.map((x) => (x.id === v.id ? { ...x, results: { ...x.results, [myId]: fn(x.results[myId] ?? { attempts: [] }) } } : x)));
  const markWatched = (v: VideoSession) => {
    if (!myId) return;
    patchResult(v, (r) => ({ ...r, watchedAt: r.watchedAt ?? trainingToday, passedAt: r.passedAt ?? (v.quiz.length ? undefined : trainingToday) }));
    notify(v.quiz.length ? "Watched — now answer the questions below" : "Marked as complete");
    if (!v.quiz.length && !completion.earned && finishesModule(v)) setCert("celebrate");
  };
  const go = (d: -1 | 1) => setPlayingId(list[index + d]?.id);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link href="/bhe-training/videos" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"><ChevronLeft className="size-3.5" /> Video Sessions · {playlist.category}</Link>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{playlist.title}</h2>
          {playlist.description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{playlist.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setEditingPl(true)} className={buttonSecondary}><PencilLine className="size-4" /> Edit playlist</button>
          <button type="button" onClick={() => setEditing("new")} className={buttonPrimary}><Plus className="size-4" /> Add video or resource</button>
        </div>
      </header>

      {list.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><ListVideo className="size-7" /></span>
          <p className="text-base font-semibold text-foreground">This playlist is empty</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => setEditingPl(true)} className={buttonSecondary}>Pick from the library</button>
            <button type="button" onClick={() => setEditing("new")} className={buttonPrimary}><Plus className="size-4" /> Add video</button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
          <Card className="flex flex-col gap-4 p-4 sm:p-5">
            <VideoPlayer key={playing.id} url={playing.url} title={playing.title} onEnded={() => { if (status === "Not watched") markWatched(playing); }} />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">{playing.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{playing.area} · {playing.presenter} · recorded {formatDay(playing.recordedOn)} · {videoLength(playing)}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(playing)} className={cn(buttonSecondary, "h-9 px-4")}><PencilLine className="size-4" /> Edit</button>
                <button type="button" onClick={() => setDeleting(playing)} className={cn(buttonSecondary, "h-9 px-4 text-danger hover:bg-danger-soft")}><Trash2 className="size-4" /> Delete</button>
              </div>
            </div>
            {playing.description && <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{playing.description}</p>}

            {status === "Not watched" ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface-muted px-4 py-3">
                <span className="text-xs text-muted-foreground">{playing.quiz.length ? `${playing.quiz.length} questions after this video · pass mark ${playing.passMark}%` : "No questions — watching completes it"}</span>
                <button type="button" onClick={() => markWatched(playing)} className={buttonPrimary}>{playing.quiz.length ? "I've watched it — take the quiz" : "Mark as complete"}</button>
              </div>
            ) : playing.quiz.length > 0 ? (
              <VideoQuiz
                key={`${playing.id}-${status === "Passed"}`}
                video={playing}
                passed={status === "Passed"}
                attempts={playing.results[myId]?.attempts ?? []}
                onSubmit={(score) => {
                  const pass = score >= playing.passMark;
                  patchResult(playing, (r) => ({ ...r, attempts: [...r.attempts, { date: trainingToday, score }], passedAt: pass ? r.passedAt ?? trainingToday : r.passedAt }));
                  notify(pass ? `Passed with ${score}% — session complete` : `${score}% — you need ${playing.passMark}%. Rewatch and try again.`, pass ? "success" : "error");
                  if (pass && !completion.earned && finishesModule(playing)) setCert("celebrate");
                }}
              />
            ) : null}

            <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
              <button type="button" disabled={index === 0} onClick={() => go(-1)} className={buttonSecondary}><ChevronLeft className="size-4" /> Previous</button>
              <span className="text-xs tabular-nums text-muted-foreground">{index + 1} of {list.length}</span>
              <button type="button" disabled={index === list.length - 1} onClick={() => go(1)} className={buttonSecondary}>Next <ChevronRight className="size-4" /></button>
            </div>
          </Card>

          <Card className="flex flex-col gap-3 p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]">
            <div>
              <h3 className="text-base font-semibold leading-snug text-foreground">{playlist.title} – Video and Resource Playlist</h3>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted"><div className={cn("h-full rounded-full", done === list.length ? "bg-success" : "bg-primary")} style={{ width: `${Math.round((done / list.length) * 100)}%` }} /></div>
                <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">{done}/{list.length} completed</span>
              </div>
            </div>
            {completion.earned ? (
              <button type="button" onClick={() => setCert("view")} className="group/cert flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100 p-3 text-left ring-1 ring-amber-300/60 transition-shadow hover:shadow-md dark:from-amber-500/10 dark:to-amber-500/5 dark:ring-amber-400/30">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-md shadow-amber-500/30"><Award className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">BHE UNI certificate earned</span>
                  <span className="block text-[11px] text-muted-foreground">Completed {completion.completedAt ? formatDay(completion.completedAt) : ""}{completion.score !== undefined ? ` · avg. score ${completion.score}%` : ""}</span>
                </span>
                <span className="text-xs font-semibold text-amber-700 group-hover/cert:underline dark:text-amber-400">View</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted-foreground"><Award className="size-5" /></span>
                <span className="min-w-0 text-[11px] leading-snug text-muted-foreground"><span className="block text-xs font-semibold text-foreground">Earn your BHE UNI certificate</span>Pass the {list.length - done} remaining session{list.length - done === 1 ? "" : "s"} in this module to unlock it.</span>
              </div>
            )}
            <label className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm focus-within:border-primary">
              <Search className="size-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search here" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" aria-label="Search this playlist" />
            </label>
            <p className="text-xs font-semibold text-muted-foreground">Next playing video</p>
            <ol className="-mx-1 flex min-h-0 flex-col gap-1 overflow-y-auto px-1">
              {shown.map((v) => {
                const pct = videoProgress(v, myId);
                const st = videoStatus(v, myId);
                const active = v.id === playing.id;
                const thumb = parseVideo(v.url).thumb;
                return (
                  <li key={v.id}>
                    <button type="button" onClick={() => setPlayingId(v.id)} aria-current={active} className={cn("flex w-full items-center gap-2.5 rounded-xl border p-2 text-left transition-colors", active ? "border-primary/40 bg-primary-soft" : "border-transparent hover:bg-surface-hover")}>
                      <span title={videoStatusStyle[st].label} className={cn("flex size-4 shrink-0 items-center justify-center rounded border", st === "Passed" ? "border-success bg-success text-white" : "border-border-strong bg-surface")}>{st === "Passed" && <Check className="size-3" strokeWidth={3} />}</span>
                      <span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary to-violet-500">
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail */}
                        {thumb && <img src={thumb} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />}
                        {active && <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white"><Volume2 className="size-4" /></span>}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className={cn("line-clamp-2 text-xs font-medium", active ? "text-primary" : "text-foreground")}>{v.title}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-muted"><span className={cn("block h-full rounded-full", pct === 100 ? "bg-success" : "bg-warning")} style={{ width: `${pct}%` }} /></span>
                          <span className="w-7 text-right text-[10px] tabular-nums text-muted-foreground">{pct}%</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 self-start pt-0.5 text-[10px] tabular-nums text-muted-foreground"><Clock3 className="size-3" />{videoLength(v)}</span>
                    </button>
                  </li>
                );
              })}
              {!shown.length && <li className="px-2 py-8 text-center text-xs text-muted-foreground">No videos match “{search}”</li>}
            </ol>
          </Card>
        </div>
      )}

      {editing && (
        <VideoDialog
          key={editing === "new" ? "new" : editing.id}
          video={editing === "new" ? undefined : editing}
          presenters={presenters}
          onClose={() => setEditing(null)}
          onSave={(d) => {
            if (editing === "new") {
              const newId = nextVideoId(videos);
              setVideos((prev) => [{ ...d, id: newId, results: {}, addedBy: user.name, addedAt: trainingToday }, ...prev]);
              updatePlaylist((p) => ({ ...p, videoIds: [...p.videoIds, newId] }));
              setPlayingId(newId);
              notify(`${d.title} added to ${playlist.title}`);
            } else {
              setVideos((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...d } : x)));
              notify("Video saved");
            }
            setEditing(null);
          }}
        />
      )}

      {editingPl && (
        <PlaylistDialog
          playlist={playlist}
          videos={videos}
          onClose={() => setEditingPl(false)}
          onSave={(d) => {
            updatePlaylist((p) => ({ ...p, ...d }));
            if (playingId && !d.videoIds.includes(playingId)) setPlayingId(d.videoIds[0]);
            notify("Playlist saved");
            setEditingPl(false);
          }}
        />
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} icon={Trash2} size="sm" title={`Delete ${deleting?.title}?`} subtitle="Take it out of this playlist only, or delete it from the whole library."
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setDeleting(null)} className={buttonSecondary}>Cancel</button>
            <button type="button" onClick={() => { const vid = deleting!.id; updatePlaylist((p) => ({ ...p, videoIds: p.videoIds.filter((x) => x !== vid) })); setPlayingId(list.find((v) => v.id !== vid)?.id); notify("Removed from playlist"); setDeleting(null); }} className={buttonSecondary}>Remove from playlist</button>
            <button type="button" onClick={() => { const vid = deleting!.id; setVideos((prev) => prev.filter((v) => v.id !== vid)); setPlaylists((prev) => prev.map((p) => ({ ...p, videoIds: p.videoIds.filter((x) => x !== vid) }))); setPlayingId(list.find((v) => v.id !== vid)?.id); notify("Video deleted"); setDeleting(null); }} className={buttonDanger}>Delete everywhere</button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">Deleting everywhere removes it from every playlist and training period, and its quiz results are lost.</p>
      </Modal>
      {cert && completion.earned && <ModuleCertificate playlist={playlist} list={list} learnerId={myId} name={user.name} celebrate={cert === "celebrate"} onClose={() => setCert(null)} />}
      {toast}
    </div>
  );
}
