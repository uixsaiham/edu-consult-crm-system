"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Award, CheckCircle2, CircleHelp, GraduationCap, ListPlus, ListVideo, MoreHorizontal, PencilLine, PlayCircle, Plus, SearchX, Trash2, Users, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { AnchoredMenu, MenuDivider, MenuItem } from "@/components/applications/list/anchored-menu";
import { useUser } from "@/components/layout/user-context";
import { formatDay } from "@/components/people/people-ui";
import { ImportDialog, VideoDialog, VideoPlayer, VideoQuiz, VideoThumb, videoStatusStyle as statusStyle } from "@/components/training/video";
import { getStaff } from "@/lib/mock/staff";
import { Tabs } from "@/components/office/office-ui";
import { PlaylistDialog, PlaylistThumb } from "@/components/training/playlist";
import { ModuleCertificate } from "@/components/training/certificate";
import { crmAreas, getPlaylists, getVideos, nextPlaylistId, nextVideoId, parseVideo, playlistCategories, playlistCompletion, savePlaylists, saveVideos, trainingToday, videoStatus, type Playlist, type VideoSession } from "@/lib/mock/training";
import { cn } from "@/lib/utils";

type Sort = "" | "oldest" | "popular" | "title";

export default function VideoSessionsPage() {
  const { user } = useUser();
  const staff = useMemo(() => getStaff().filter((s) => s.status === "Active" || s.status === "On leave"), []);
  const me = staff.find((s) => s.name === user.name);
  const myId = me?.id ?? "";
  const [videos, setVideos] = useState<VideoSession[]>(getVideos);
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("");
  const [presenter, setPresenter] = useState("");
  const [mine, setMine] = useState("");
  const [sort, setSort] = useState<Sort>("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<VideoSession | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState<VideoSession | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>(getPlaylists);
  const [view, setView] = useState<"playlists" | "videos">("playlists");
  const [plSearch, setPlSearch] = useState("");
  const [plCategory, setPlCategory] = useState("");
  const [editingPl, setEditingPl] = useState<Playlist | "new" | null>(null);
  const [deletingPl, setDeletingPl] = useState<Playlist | null>(null);
  const [certFor, setCertFor] = useState<Playlist | null>(null);
  const [toast, notify] = useToast();

  useEffect(() => saveVideos(videos), [videos]);
  useEffect(() => savePlaylists(playlists), [playlists]);

  const plVideos = (p: Playlist) => p.videoIds.map((id) => videos.find((v) => v.id === id)).filter((v): v is VideoSession => !!v);
  const pq = plSearch.trim().toLowerCase();
  const shownPlaylists = playlists.filter((p) => (!plCategory || p.category === plCategory) && (!pq || `${p.title} ${p.description} ${plVideos(p).map((v) => v.title).join(" ")}`.toLowerCase().includes(pq)));

  const passedCount = (v: VideoSession) => Object.keys(v.results).filter((id) => videoStatus(v, id) === "Passed").length;
  const q = search.trim().toLowerCase();
  const shown = videos
    .filter((v) => (!area || v.area === area) && (!presenter || v.presenter === presenter) && (!mine || videoStatus(v, myId) === mine || (mine === "No questions" && !v.quiz.length)) && (!q || `${v.title} ${v.description} ${v.presenter} ${v.area}`.toLowerCase().includes(q)))
    .sort((a, b) => (sort === "oldest" ? a.recordedOn.localeCompare(b.recordedOn) : sort === "popular" ? passedCount(b) - passedCount(a) : sort === "title" ? a.title.localeCompare(b.title) : b.recordedOn.localeCompare(a.recordedOn) || b.id.localeCompare(a.id)));
  const hasFilters = !!(search || area || presenter || mine || sort);
  const presenters = [...new Set([user.name, ...staff.filter((s) => ["admissions-lead", "branch-manager", "senior-counsellor", "compliance"].includes(s.roleId)).map((s) => s.name)])];
  const playing = videos.find((v) => v.id === playingId);
  const noQuiz = videos.filter((v) => !v.quiz.length).length;

  const patchResult = (v: VideoSession, fn: (r: VideoSession["results"][string]) => VideoSession["results"][string]) =>
    setVideos((prev) => prev.map((x) => (x.id === v.id ? { ...x, results: { ...x.results, [myId]: fn(x.results[myId] ?? { attempts: [] }) } } : x)));

  const markWatched = (v: VideoSession) => {
    if (!myId) return;
    patchResult(v, (r) => ({ ...r, watchedAt: r.watchedAt ?? trainingToday, passedAt: r.passedAt ?? (v.quiz.length ? undefined : trainingToday) }));
    notify(v.quiz.length ? "Watched — now answer the questions below" : "Marked as complete");
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Video Sessions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Recorded training grouped into playlists. Watch, then answer the questions — a session counts once you pass.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/bhe-training/programmes" className={buttonSecondary}><GraduationCap className="size-4" /> Training periods</Link>
          <button type="button" onClick={() => setImporting(true)} className={buttonSecondary}><ListPlus className="size-4" /> Import links</button>
          <button type="button" onClick={() => setEditingPl("new")} className={buttonSecondary}><ListVideo className="size-4" /> New playlist</button>
          <button type="button" onClick={() => setEditing("new")} className={buttonPrimary}><Plus className="size-4" /> Add video</button>
        </div>
      </header>

      <StatGrid>
        <StatCard icon={Video} label="Video sessions" value={videos.length} note={noQuiz ? `${noQuiz} need questions` : `${videos.reduce((n, v) => n + v.minutes, 0)} min`} onClick={() => { if (noQuiz) { setView("videos"); setMine("No questions"); } }} />
        <StatCard icon={Award} tone="success" label="Completed by you" value={videos.filter((v) => videoStatus(v, myId) === "Passed").length} note={`of ${videos.length}`} onClick={() => { setView("videos"); setMine("Passed"); }} />
        <StatCard icon={CircleHelp} tone="warning" label="Quizzes to take" value={videos.filter((v) => ["Quiz due", "Failed"].includes(videoStatus(v, myId))).length} onClick={() => { setView("videos"); setMine("Quiz due"); }} />
        <StatCard icon={Users} tone="violet" label="Team completions" value={videos.reduce((n, v) => n + passedCount(v), 0)} note={`${staff.length} staff`} />
      </StatGrid>

      {videos.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Video className="size-7" /></span>
          <p className="text-base font-semibold text-foreground">Build your video library</p>
          <p className="max-w-lg text-sm text-muted-foreground">Add the sessions you&apos;ve recorded for staff and agents. Paste YouTube, Vimeo, Loom or Google Drive links — or upload files — then add a few questions to each so completion is checked, not just clicked.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => setImporting(true)} className={buttonSecondary}><ListPlus className="size-4" /> Import links</button>
            <button type="button" onClick={() => setEditing("new")} className={buttonPrimary}><Plus className="size-4" /> Add first video</button>
          </div>
        </Card>
      ) : (
        <>
          <Tabs label="Browse" value={view} onChange={setView} options={[{ value: "playlists", label: "Playlists", count: playlists.length }, { value: "videos", label: "All videos", count: videos.length }]} />
          {view === "playlists" ? (
            <>
              <FilterBar>
                <SearchField value={plSearch} onChange={setPlSearch} placeholder="Playlist or video title…" label="Search playlists" />
                <SelectFilter label="Category" value={plCategory} onChange={setPlCategory} allLabel="All categories" width="w-56" options={playlistCategories.map((c) => ({ value: c, label: c, hint: playlists.filter((p) => p.category === c).length }))} />
                {(plSearch || plCategory) && <ResetFilters onClick={() => { setPlSearch(""); setPlCategory(""); }} />}
              </FilterBar>
              {shownPlaylists.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border px-6 py-16 text-center">
                  <SearchX className="size-6 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">{playlists.length ? "No playlists match" : "No playlists yet"}</p>
                  {!playlists.length && <button type="button" onClick={() => setEditingPl("new")} className={cn(buttonPrimary, "mt-2")}><ListVideo className="size-4" /> Create a playlist</button>}
                </div>
              ) : (
                playlistCategories.filter((c) => shownPlaylists.some((p) => p.category === c)).map((c) => (
                  <section key={c} className="flex flex-col gap-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-base font-semibold tracking-tight text-foreground">{c}</h3>
                      <span className="text-xs text-muted-foreground">{shownPlaylists.filter((p) => p.category === c).length} playlist{shownPlaylists.filter((p) => p.category === c).length === 1 ? "" : "s"}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {shownPlaylists.filter((p) => p.category === c).map((p) => {
                        const list = plVideos(p);
                        const c = playlistCompletion(list, myId);
                        return (
                          <article key={p.id} className="card-shadow group flex flex-col gap-3 rounded-3xl border border-border bg-surface p-3 transition-shadow hover:shadow-lg">
                            <Link href={`/bhe-training/videos/playlist/${p.id}`} aria-label={`Open ${p.title}`}>
                              <PlaylistThumb videos={list} done={c.done} earned={c.earned} />
                            </Link>
                            <div className="flex items-start gap-2 px-1">
                              <Link href={`/bhe-training/videos/playlist/${p.id}`} className="min-w-0 flex-1">
                                <span className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-primary">{p.title}</span>
                                <span className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{p.description || `${list.length} videos`}</span>
                              </Link>
                              <AnchoredMenu label={`Actions for ${p.title}`} align="end" width={180} trigger={<MoreHorizontal className="size-4" />} triggerClassName="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground">
                                {(close) => (
                                  <>
                                    <MenuItem icon={PencilLine} onClick={() => { close(); setEditingPl(p); }}>Edit playlist</MenuItem>
                                    <MenuDivider />
                                    <MenuItem icon={Trash2} tone="danger" onClick={() => { close(); setDeletingPl(p); }}>Delete playlist</MenuItem>
                                  </>
                                )}
                              </AnchoredMenu>
                            </div>
                            <div className="mt-auto flex items-center justify-between gap-2 border-t border-border px-1 pt-2.5 text-[11px]">
                              <span className="font-semibold tabular-nums text-foreground">{c.done}/{c.total} completed</span>
                              {c.earned ? (
                                <button type="button" onClick={() => setCertFor(p)} className="inline-flex items-center gap-1 font-semibold text-amber-600 hover:underline dark:text-amber-400"><Award className="size-3.5" /> View certificate</button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-muted-foreground"><Award className="size-3.5" /> {c.total ? `${c.total - c.done} to go for your certificate` : "No videos yet"}</span>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </>
          ) : (
        <>
          <FilterBar>
            <SearchField value={search} onChange={setSearch} placeholder="Title, topic, presenter…" label="Search videos" />
            <SelectFilter label="CRM area" value={area} onChange={setArea} allLabel="All areas" width="w-64" options={crmAreas.map((a) => ({ value: a, label: a, hint: videos.filter((v) => v.area === a).length }))} />
            <SelectFilter label="Presenter" value={presenter} onChange={setPresenter} allLabel="Anyone" options={[...new Set(videos.map((v) => v.presenter))].sort()} />
            <SelectFilter label="My progress" value={mine} onChange={setMine} allLabel="All videos" options={[{ value: "Not watched", label: "Not watched" }, { value: "Quiz due", label: "Quiz to take" }, { value: "Failed", label: "Quiz not passed" }, { value: "Passed", label: "Completed" }, { value: "No questions", label: "No questions yet" }]} />
            <SelectFilter label="Sort" value={sort} onChange={(v) => setSort(v as Sort)} allLabel="Newest first" options={[{ value: "oldest", label: "Oldest first" }, { value: "popular", label: "Most completed" }, { value: "title", label: "Title A–Z" }]} />
            {hasFilters && <ResetFilters onClick={() => { setSearch(""); setArea(""); setPresenter(""); setMine(""); setSort(""); }} />}
          </FilterBar>

          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border px-6 py-16 text-center">
              <SearchX className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No videos match</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((v) => {
                const st = statusStyle[videoStatus(v, myId)];
                return (
                  <article key={v.id} className="card-shadow group flex flex-col gap-3 rounded-3xl border border-border bg-surface p-3">
                    <button type="button" onClick={() => setPlayingId(v.id)} className="block text-left" aria-label={`Play ${v.title}`}>
                      <VideoThumb video={v} />
                    </button>
                    <div className="flex items-start gap-2 px-1">
                      <button type="button" onClick={() => setPlayingId(v.id)} className="min-w-0 flex-1 text-left">
                        <span className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">{v.title}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">{v.area} · {v.presenter} · {formatDay(v.recordedOn)}</span>
                      </button>
                      <AnchoredMenu label={`Actions for ${v.title}`} align="end" width={190} trigger={<MoreHorizontal className="size-4" />} triggerClassName="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground">
                        {(close) => (
                          <>
                            <MenuItem icon={PencilLine} onClick={() => { close(); setEditing(v); }}>{v.quiz.length ? "Edit video & questions" : "Add questions"}</MenuItem>
                            <MenuDivider />
                            <MenuItem icon={Trash2} tone="danger" onClick={() => { close(); setDeleting(v); }}>Delete</MenuItem>
                          </>
                        )}
                      </AnchoredMenu>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-border px-1 pt-2.5 text-[11px]">
                      <span className="text-muted-foreground">{v.quiz.length ? `${v.quiz.length} questions · ${passedCount(v)} passed` : <button type="button" onClick={() => setEditing(v)} className="font-semibold text-warning hover:underline">Add questions</button>}</span>
                      <span className={cn("inline-flex items-center gap-1 font-semibold", st.cls)}><st.icon className="size-3.5" /> {st.label}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
          )}
        </>
      )}

      {playing && (
        <Modal open onClose={() => setPlayingId(null)} icon={PlayCircle} size="lg" title={playing.title} subtitle={`${playing.area} · ${playing.presenter} · recorded ${formatDay(playing.recordedOn)}${playing.minutes ? ` · ${playing.minutes} min` : ""}`}
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{parseVideo(playing.url).source}{playing.quiz.length ? ` · ${playing.quiz.length} questions, pass mark ${playing.passMark}%` : " · no questions"}</span>
              {videoStatus(playing, myId) === "Not watched" ? (
                <button type="button" onClick={() => markWatched(playing)} className={buttonPrimary}><CheckCircle2 className="size-4" /> {playing.quiz.length ? "I've watched it — take the quiz" : "Mark as complete"}</button>
              ) : (
                <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", statusStyle[videoStatus(playing, myId)].cls)}>{statusStyle[videoStatus(playing, myId)].label}</span>
              )}
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <VideoPlayer key={playing.id} url={playing.url} title={playing.title} onEnded={() => videoStatus(playing, myId) === "Not watched" && markWatched(playing)} />
            {playing.description && <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{playing.description}</p>}
            {playing.quiz.length > 0 && videoStatus(playing, myId) !== "Not watched" && (
              <VideoQuiz
                key={`${playing.id}-${videoStatus(playing, myId) === "Passed"}`}
                video={playing}
                passed={videoStatus(playing, myId) === "Passed"}
                attempts={playing.results[myId]?.attempts ?? []}
                onSubmit={(score) => {
                  const pass = score >= playing.passMark;
                  patchResult(playing, (r) => ({ ...r, attempts: [...r.attempts, { date: trainingToday, score }], passedAt: pass ? r.passedAt ?? trainingToday : r.passedAt }));
                  notify(pass ? `Passed with ${score}% — session complete` : `${score}% — you need ${playing.passMark}%. Rewatch the part you missed and try again.`, pass ? "success" : "error");
                }}
              />
            )}
            {(() => {
              const next = videos.filter((v) => v.id !== playing.id && v.area === playing.area && videoStatus(v, myId) !== "Passed").slice(0, 3);
              return next.length ? (
                <div>
                  <p className="mb-2 text-xs font-semibold text-foreground">Next on {playing.area}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {next.map((v) => (
                      <button key={v.id} type="button" onClick={() => setPlayingId(v.id)} className="group flex flex-col gap-1.5 text-left">
                        <VideoThumb video={v} className="rounded-xl" />
                        <span className="line-clamp-2 text-xs font-medium text-foreground group-hover:text-primary">{v.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </Modal>
      )}

      {editing && (
        <VideoDialog
          key={editing === "new" ? "new" : editing.id}
          video={editing === "new" ? undefined : editing}
          presenters={presenters}
          onClose={() => setEditing(null)}
          onSave={(d) => {
            if (editing === "new") {
              setVideos((prev) => [{ ...d, id: nextVideoId(prev), results: {}, addedBy: user.name, addedAt: trainingToday }, ...prev]);
              notify(`${d.title} added`);
            } else {
              setVideos((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...d } : x)));
              notify(d.quiz.length ? "Video and questions saved" : "Video saved");
            }
            setEditing(null);
          }}
        />
      )}

      {importing && (
        <ImportDialog
          presenter={user.name}
          onClose={() => setImporting(false)}
          onImport={(rows, a) => {
            setVideos((prev) => [
              ...rows.map((r, i) => ({ id: nextVideoId(prev, i), title: r.title, url: r.url, description: "", area: a, presenter: user.name, recordedOn: trainingToday, minutes: 0, quiz: [], passMark: 80, results: {}, addedBy: user.name, addedAt: trainingToday })),
              ...prev,
            ]);
            notify(`${rows.length} imported — add questions to each so completion is checked`);
            setImporting(false);
          }}
        />
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} icon={Trash2} size="sm" title={`Delete ${deleting?.title}?`} subtitle="It's removed from the library and any training period that uses it. The original video isn't affected."
        footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setDeleting(null)} className={buttonSecondary}>Cancel</button><button type="button" onClick={() => { const id = deleting!.id; setVideos((prev) => prev.filter((v) => v.id !== id)); setPlaylists((prev) => prev.map((p) => ({ ...p, videoIds: p.videoIds.filter((x) => x !== id) }))); notify("Video deleted"); setDeleting(null); }} className={buttonDanger}>Delete</button></div>}
      >
        <p className="text-sm text-muted-foreground">Quiz results for this session are lost{deleting && playlists.some((p) => p.videoIds.includes(deleting.id)) ? `, and it's taken out of ${playlists.filter((p) => p.videoIds.includes(deleting.id)).length} playlist(s)` : ""}.</p>
      </Modal>

      {editingPl && (
        <PlaylistDialog
          key={editingPl === "new" ? "new" : editingPl.id}
          playlist={editingPl === "new" ? undefined : editingPl}
          videos={videos}
          onClose={() => setEditingPl(null)}
          onSave={(d) => {
            if (editingPl === "new") {
              setPlaylists((prev) => [...prev, { ...d, id: nextPlaylistId(prev), createdBy: user.name, createdAt: trainingToday }]);
              notify(`${d.title} created`);
            } else {
              setPlaylists((prev) => prev.map((p) => (p.id === editingPl.id ? { ...p, ...d } : p)));
              notify("Playlist saved");
            }
            setView("playlists");
            setEditingPl(null);
          }}
        />
      )}

      <Modal open={!!deletingPl} onClose={() => setDeletingPl(null)} icon={Trash2} size="sm" title={`Delete ${deletingPl?.title}?`} subtitle="Only the playlist is removed — its videos and everyone's progress stay in the library."
        footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setDeletingPl(null)} className={buttonSecondary}>Cancel</button><button type="button" onClick={() => { setPlaylists((prev) => prev.filter((p) => p.id !== deletingPl!.id)); notify("Playlist deleted"); setDeletingPl(null); }} className={buttonDanger}>Delete</button></div>}
      >
        <p className="text-sm text-muted-foreground">{deletingPl?.videoIds.length} videos are in this playlist.</p>
      </Modal>
      {certFor && <ModuleCertificate playlist={certFor} list={plVideos(certFor)} learnerId={myId} name={user.name} onClose={() => setCertFor(null)} />}
      {toast}
    </div>
  );
}
