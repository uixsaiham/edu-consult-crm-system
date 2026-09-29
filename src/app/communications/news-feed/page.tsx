"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState } from "react";
import { Bookmark, CalendarDays, Clock, Flame, Hash, Newspaper, Trophy, X } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { SearchField } from "@/components/ui/filter-dropdown";
import { buttonPrimary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { Avatar, MetricToggle } from "@/components/performance/perf-ui";
import {
  DeadlineBadge,
  FeedPostCard,
  emptyPostState,
  topicTone,
  type PostState,
  type Reaction,
} from "@/components/communications/feed-post";
import { FeedAnnouncements } from "@/components/communications/feed-announcements";
import { daysUntil, dueLabel, shortDate } from "@/components/communications/time";
import { toneClass } from "@/components/performance/perf-ui";
import {
  commsNow,
  getFeedPosts,
  getUpcomingDeadlines,
  postTopics,
  type FeedPost,
  type PostTopic,
} from "@/lib/mock/communications";
import { getCounsellorPerformanceDetail } from "@/lib/mock/performance";
import { cn } from "@/lib/utils";

const deadlines = getUpcomingDeadlines();
const topPerformers = getCounsellorPerformanceDetail()
  .map((c) => ({ name: c.name, branch: c.branch, enrolled: c.series[c.series.length - 1].enrolled }))
  .sort((a, b) => b.enrolled - a.enrolled)
  .slice(0, 5);

type Filter = "all" | PostTopic | "saved";
type Sort = "latest" | "top";

const engagement = (p: FeedPost) => p.reactions.clap + p.reactions.heart + p.reactions.party + p.comments.length * 2;

export default function NewsFeedPage() {
  const { user } = useUser();
  const [posts, setPosts] = useState<FeedPost[]>(getFeedPosts);
  const [mine, setMine] = useState<Record<string, PostState>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("latest");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [toast, notify] = useToast();

  const stateOf = (id: string) => mine[id] ?? emptyPostState;
  const patchState = (id: string, fn: (s: PostState) => Partial<PostState>) =>
    setMine((m) => ({ ...m, [id]: { ...(m[id] ?? emptyPostState), ...fn(m[id] ?? emptyPostState) } }));
  const patchPost = (id: string, fn: (p: FeedPost) => Partial<FeedPost>) =>
    setPosts((list) => list.map((p) => (p.id === id ? { ...p, ...fn(p) } : p)));

  const react = (post: FeedPost, r: Reaction) => {
    const had = stateOf(post.id).reactions.includes(r);
    patchState(post.id, (s) => ({ reactions: had ? s.reactions.filter((x) => x !== r) : [...s.reactions, r] }));
    patchPost(post.id, (p) => ({ reactions: { ...p.reactions, [r]: p.reactions[r] + (had ? -1 : 1) } }));
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts
      .filter((p) => {
        if (filter === "saved" && !mine[p.id]?.bookmarked) return false;
        if (filter !== "all" && filter !== "saved" && p.topic !== filter) return false;
        if (tag && !p.tags.includes(tag)) return false;
        return !q || `${p.text} ${p.author.name} ${p.tags.join(" ")}`.toLowerCase().includes(q);
      })
      .sort((a, b) =>
        sort === "top"
          ? engagement(b) - engagement(a)
          : Number(!!b.pinned) - Number(!!a.pinned) || Date.parse(b.createdAt) - Date.parse(a.createdAt)
      );
  }, [posts, mine, filter, sort, search, tag]);

  const trending = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1 + engagement(p) / 100)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);
  }, [posts]);

  const events = posts
    .flatMap((p) => (p.attachment?.kind === "event" ? [{ post: p, event: p.attachment }] : []))
    .filter((e) => daysUntil(e.event.date) >= 0)
    .sort((a, b) => a.event.date.localeCompare(b.event.date));

  const savedCount = Object.values(mine).filter((s) => s.bookmarked).length;
  const filters: { key: Filter; label: string; count?: number }[] = [
    { key: "all", label: "All posts" },
    ...postTopics.map((t) => ({ key: t as Filter, label: t, count: posts.filter((p) => p.topic === t).length })),
    { key: "saved", label: "Saved", count: savedCount },
  ];

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">News Feed</h2>
          <p className="mt-1 text-sm text-muted-foreground">Wins, university updates, policy news and events from across BHE.</p>
        </div>
        <SearchField value={search} onChange={setSearch} placeholder="Search posts, people, #tags…" />
      </header>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <FeedAnnouncements />

          <Composer
            userName={user.name}
            onPost={(text, topic) => {
              const tags = [...text.matchAll(/#(\w+)/g)].map((m) => m[1]);
              setPosts((list) => [
                {
                  id: `P-${Date.now()}`,
                  author: { name: user.name, role: user.role, branch: "Dhaka HQ" },
                  topic,
                  createdAt: commsNow,
                  text: text.replace(/#(\w+)/g, "").trim(),
                  tags,
                  reactions: { clap: 0, heart: 0, party: 0 },
                  comments: [],
                },
                ...list,
              ]);
              setFilter("all");
              setSort("latest");
              notify("Posted to the news feed");
            }}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="no-scrollbar -mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1">
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={filter === f.key}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
                    filter === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  )}
                >
                  {f.key === "saved" && <Bookmark className="size-3.5" />}
                  {f.label}
                  {f.count !== undefined && f.count > 0 && <span className="opacity-60">{f.count}</span>}
                </button>
              ))}
            </div>
            <MetricToggle<Sort>
              value={sort}
              onChange={setSort}
              options={[
                { value: "latest", label: "Latest" },
                { value: "top", label: "Most engaged" },
              ]}
            />
          </div>

          {tag && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              Showing posts tagged
              <button
                type="button"
                onClick={() => setTag("")}
                className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 font-semibold text-primary"
              >
                #{tag}
                <X className="size-3" />
              </button>
            </div>
          )}

          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <Newspaper className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">{filter === "saved" ? "No saved posts yet" : "No posts match"}</p>
              <p className="text-xs text-muted-foreground">
                {filter === "saved" ? "Tap the bookmark on any post to save it for later." : "Try another topic or clear your search."}
              </p>
            </div>
          ) : (
            visible.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                state={stateOf(post.id)}
                user={user}
                onReact={(r) => react(post, r)}
                onBookmark={() => {
                  const saved = !stateOf(post.id).bookmarked;
                  patchState(post.id, () => ({ bookmarked: saved }));
                  notify(saved ? "Saved for later" : "Removed from saved");
                }}
                onVote={(i) => patchState(post.id, () => ({ vote: i }))}
                onRsvp={() => {
                  const going = !stateOf(post.id).going;
                  patchState(post.id, () => ({ going }));
                  notify(going ? "You're going — added to your calendar" : "RSVP cancelled");
                }}
                onComment={(text) =>
                  patchPost(post.id, (p) => ({
                    comments: [
                      ...p.comments,
                      { id: `c-${Date.now()}`, author: { name: user.name, role: user.role, branch: "Dhaka HQ" }, text, createdAt: commsNow },
                    ],
                  }))
                }
                onTag={(t) => {
                  setTag(t);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onNotify={notify}
              />
            ))
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader icon={CalendarDays} iconBg="bg-violet-500/10" iconColor="text-violet-600 dark:text-violet-400" title="Upcoming events" subtitle={`${events.length} coming up`} />
            <ul className="flex flex-col gap-1 p-3">
              {events.map(({ post, event }) => (
                <li key={post.id}>
                  <a href={`#${post.id}`} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface-hover">
                    <DeadlineBadge date={event.date} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-foreground">{event.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {event.time} · {event.going + (stateOf(post.id).going ? 1 : 0)} going
                      </span>
                    </span>
                    {stateOf(post.id).going && <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">Going</span>}
                  </a>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader icon={Clock} iconBg="bg-danger-soft" iconColor="text-danger" title="Key deadlines" subtitle="Intake and compliance dates" />
            <ul className="flex flex-col gap-1 p-3">
              {deadlines.map((d) => (
                <li key={d.label} className="flex items-center gap-3 rounded-xl p-2.5">
                  <DeadlineBadge date={d.date} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-foreground">{d.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{d.detail}</span>
                  </span>
                  <span className={cn("shrink-0 text-[10px] font-semibold", daysUntil(d.date) <= 7 ? "text-danger" : "text-muted-foreground")}>
                    {dueLabel(d.date).replace("Due ", "")}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader icon={Trophy} iconBg="bg-warning-soft" iconColor="text-warning" title="Top counsellors" subtitle={`Enrolments in ${shortDate(commsNow).split(" ")[1]}`} />
            <ol className="flex flex-col gap-1 p-3">
              {topPerformers.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 rounded-xl p-2">
                  <span className={cn("w-4 text-center text-xs font-bold", i === 0 ? "text-amber-500" : "text-muted-foreground")}>{i + 1}</span>
                  <Avatar name={p.name} className="size-8 text-[10px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-foreground">{p.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{p.branch}</span>
                  </span>
                  <span className="text-sm font-bold tabular-nums text-foreground">{p.enrolled}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <CardHeader icon={Flame} iconBg="bg-accent-soft" iconColor="text-accent" title="Trending" subtitle="Most-used tags this week" />
            <div className="flex flex-wrap gap-1.5 p-4 pt-3">
              {trending.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(tag === t ? "" : t)}
                  aria-pressed={tag === t}
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    tag === t ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Hash className="size-3" />
                  {t}
                </button>
              ))}
            </div>
          </Card>
        </aside>
      </div>
      {toast}
    </div>
  );
}

function Composer({ userName, onPost }: { userName: string; onPost: (text: string, topic: PostTopic) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [topic, setTopic] = useState<PostTopic>("Team");

  const post = () => {
    if (!text.trim()) return;
    onPost(text.trim(), topic);
    setText("");
    setOpen(false);
  };

  return (
    <div className="card-shadow rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <Avatar name={userName} className="size-10" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) post();
          }}
          rows={open ? 4 : 1}
          aria-label="Share an update"
          placeholder="Share a win, update or event…"
          className="min-h-10 flex-1 resize-none rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:bg-surface focus:outline-none"
        />
      </div>
      {open && (
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-[52px]">
          <span className="w-full text-[11px] text-muted-foreground">Add #tags so people can find it · ⌘/Ctrl + Enter to post</span>
          <span className="text-[11px] font-medium text-muted-foreground">Topic</span>
          {postTopics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTopic(t)}
              aria-pressed={topic === t}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                topic === t ? toneClass[topicTone[t]] : "text-muted-foreground hover:bg-surface-hover"
              )}
            >
              {t}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setText("");
              }}
              className="rounded-full px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button type="button" onClick={post} disabled={!text.trim()} className={buttonPrimary}>
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
