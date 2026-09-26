"use client";

import { useState, type FormEvent } from "react";
import {
  Bookmark,
  CalendarDays,
  Check,
  ExternalLink,
  GraduationCap,
  Landmark,
  Link2,
  MapPin,
  MessageSquare,
  Pin,
  SendHorizontal,
  TrendingUp,
  Trophy,
} from "lucide-react";
import type { FeedComment, FeedPost, PostAttachment, PostTopic } from "@/lib/mock/communications";
import type { CurrentUser } from "@/lib/mock/user";
import { Avatar, Pill, type Tone } from "@/components/performance/perf-ui";
import { cn } from "@/lib/utils";
import { daysUntil, relativeTime, shortDate } from "./time";

export const topicTone: Record<PostTopic, Tone> = {
  Wins: "success",
  "University updates": "primary",
  "Visa & policy": "danger",
  Events: "violet",
  Team: "warning",
};

export type Reaction = keyof FeedPost["reactions"];
export const reactionEmoji: Record<Reaction, { emoji: string; label: string }> = {
  clap: { emoji: "👏", label: "Applaud" },
  party: { emoji: "🎉", label: "Celebrate" },
  heart: { emoji: "❤️", label: "Love" },
};

/** What the current user has done on a post. */
export interface PostState {
  reactions: Reaction[];
  bookmarked: boolean;
  vote?: number;
  going: boolean;
}

export const emptyPostState: PostState = { reactions: [], bookmarked: false, going: false };

export function FeedPostCard({
  post,
  state,
  user,
  onReact,
  onBookmark,
  onVote,
  onRsvp,
  onComment,
  onTag,
  onNotify,
}: {
  post: FeedPost;
  state: PostState;
  user: CurrentUser;
  onReact: (r: Reaction) => void;
  onBookmark: () => void;
  onVote: (index: number) => void;
  onRsvp: () => void;
  onComment: (text: string) => void;
  onTag: (tag: string) => void;
  onNotify: (message: string) => void;
}) {
  const [showComments, setShowComments] = useState(post.comments.length > 0 && post.comments.length <= 2);
  const [draft, setDraft] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onComment(draft.trim());
    setDraft("");
    setShowComments(true);
  };

  return (
    <article id={post.id} className="card-shadow scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <header className="flex items-start gap-3">
          <Avatar name={post.author.name} className="size-10" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{post.author.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {post.author.role} · {post.author.branch} · {relativeTime(post.createdAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {post.pinned && (
              <Pill tone="primary">
                <Pin className="size-3" />
                Pinned
              </Pill>
            )}
            <Pill tone={topicTone[post.topic]}>{post.topic}</Pill>
          </div>
        </header>

        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{post.text}</p>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {post.tags.map((t) => (
              <button key={t} type="button" onClick={() => onTag(t)} className="text-xs font-medium text-primary hover:underline">
                #{t}
              </button>
            ))}
          </div>
        )}

        {post.attachment && (
          <Attachment attachment={post.attachment} state={state} onVote={onVote} onRsvp={onRsvp} onNotify={onNotify} />
        )}
      </div>

      <div className="flex items-center gap-1 border-t border-border px-2 py-2 sm:px-4">
        {(Object.keys(reactionEmoji) as Reaction[]).map((r) => {
          const mine = state.reactions.includes(r);
          const count = post.reactions[r];
          return (
            <button
              key={r}
              type="button"
              onClick={() => onReact(r)}
              aria-pressed={mine}
              aria-label={`${reactionEmoji[r].label} (${count})`}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold tabular-nums transition-all active:scale-95",
                mine ? "border-primary/40 bg-primary-soft text-primary" : "border-transparent text-muted-foreground hover:bg-surface-hover"
              )}
            >
              <span className="text-sm leading-none">{reactionEmoji[r].emoji}</span>
              {count > 0 && count}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        >
          <MessageSquare className="size-4" />
          {post.comments.length > 0 && post.comments.length}
          <span className="hidden sm:inline">
            {post.comments.length === 1 ? "comment" : post.comments.length > 1 ? "comments" : "Comment"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(`${window.location.origin}/communications/news-feed#${post.id}`);
            onNotify("Link copied");
          }}
          aria-label="Copy link"
          className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        >
          <Link2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={onBookmark}
          aria-pressed={state.bookmarked}
          aria-label={state.bookmarked ? "Remove bookmark" : "Save post"}
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-full hover:bg-surface-hover",
            state.bookmarked ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bookmark className={cn("size-4", state.bookmarked && "fill-current")} />
        </button>
      </div>

      {showComments && (
        <div className="flex flex-col gap-3 border-t border-border bg-surface-muted px-4 py-4 sm:px-5">
          {post.comments.map((c) => (
            <Comment key={c.id} comment={c} />
          ))}
          <form onSubmit={submit} className="flex items-center gap-2">
            <Avatar name={user.name} className="size-8 text-[10px]" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a comment…"
              aria-label="Write a comment"
              className="h-9 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Post comment"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <SendHorizontal className="size-4" />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

function Comment({ comment }: { comment: FeedComment }) {
  return (
    <div className="flex items-start gap-2.5">
      <Avatar name={comment.author.name} className="size-8 text-[10px]" />
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-surface px-3.5 py-2.5">
        <p className="text-xs">
          <span className="font-semibold text-foreground">{comment.author.name}</span>
          <span className="text-muted-foreground"> · {comment.author.branch} · {relativeTime(comment.createdAt)}</span>
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-foreground/90">{comment.text}</p>
      </div>
    </div>
  );
}

function Attachment({
  attachment: a,
  state,
  onVote,
  onRsvp,
  onNotify,
}: {
  attachment: PostAttachment;
  state: PostState;
  onVote: (i: number) => void;
  onRsvp: () => void;
  onNotify: (m: string) => void;
}) {
  switch (a.kind) {
    case "milestone":
      return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#2f4f86] p-5 text-white">
          <TrendingUp className="absolute -right-4 -top-4 size-28 opacity-10" />
          <p className="text-4xl font-bold tracking-tight tabular-nums">{a.value}</p>
          <p className="mt-1 text-sm text-white/85">{a.label}</p>
          <span className="mt-3 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">{a.delta}</span>
        </div>
      );
    case "win":
      return (
        <div className="flex gap-4 rounded-2xl border border-success/30 bg-success-soft p-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-success text-white">
            <Trophy className="size-5" />
          </span>
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-foreground">{a.outcome}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {a.student} · {a.course}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground">
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="size-3.5 text-success" />
                {a.university}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5 text-success" />
                {a.intake}
              </span>
            </p>
          </div>
        </div>
      );
    case "event": {
      const going = a.going + (state.going ? 1 : 0);
      const full = going >= a.capacity && !state.going;
      const d = new Date(`${a.date}T00:00:00Z`);
      return (
        <div className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:flex-row sm:items-center">
          <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <span className="text-[10px] font-bold uppercase">{d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}</span>
            <span className="text-xl font-bold leading-none">{d.getUTCDate()}</span>
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <p className="text-sm font-semibold text-foreground">{a.title}</p>
            <p className="mt-1 text-muted-foreground">
              {d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" })} · {a.time}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-muted-foreground">
              <MapPin className="size-3" />
              {a.location}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-hover">
                <span className="block h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, (going / a.capacity) * 100)}%` }} />
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{going}</span>/{a.capacity} going
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRsvp}
            disabled={full}
            className={cn(
              "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50",
              state.going ? "bg-success-soft text-success" : "bg-violet-600 text-white hover:bg-violet-700"
            )}
          >
            {state.going && <Check className="size-3.5" />}
            {state.going ? "Going" : full ? "Full" : "RSVP"}
          </button>
        </div>
      );
    }
    case "link":
      return (
        <button
          type="button"
          onClick={() => onNotify(`Opening ${a.source}`)}
          className="group flex w-full items-start gap-3 rounded-2xl border border-border p-4 text-left transition-colors hover:bg-surface-hover"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-hover text-[10px] font-bold uppercase text-muted-foreground">
            {a.source.split(".")[0].slice(0, 3)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] text-muted-foreground">{a.source}</span>
            <span className="block text-sm font-semibold text-foreground group-hover:text-primary">{a.title}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{a.summary}</span>
          </span>
          <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
        </button>
      );
    case "update":
      return (
        <div className="rounded-2xl border border-border">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <Landmark className="size-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">{a.institution}</span>
          </div>
          <dl className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0">
            {a.items.map((item) => (
              <div key={item.label} className="px-4 py-2.5 sm:border-b sm:border-border sm:odd:border-r sm:[&:nth-last-child(-n+2)]:border-b-0">
                <dt className="text-[11px] text-muted-foreground">{item.label}</dt>
                <dd className="text-xs font-semibold text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case "poll": {
      const votes = a.options.map((o, i) => o.votes + (state.vote === i ? 1 : 0));
      const total = votes.reduce((s, v) => s + v, 0);
      const voted = state.vote !== undefined;
      return (
        <div className="rounded-2xl border border-border p-4">
          <p className="text-sm font-semibold text-foreground">{a.question}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {a.options.map((o, i) => {
              const pct = total ? Math.round((votes[i] / total) * 100) : 0;
              return (
                <li key={o.label}>
                  <button
                    type="button"
                    onClick={() => onVote(i)}
                    className={cn(
                      "relative flex w-full items-center overflow-hidden rounded-xl border px-3.5 py-2.5 text-left text-xs transition-colors",
                      state.vote === i ? "border-primary/50" : "border-border hover:border-border-strong"
                    )}
                  >
                    {voted && (
                      <span
                        className={cn("absolute inset-y-0 left-0", state.vote === i ? "bg-primary-soft" : "bg-surface-hover")}
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <span className="relative flex-1 font-medium text-foreground">
                      {state.vote === i && <Check className="mr-1 inline size-3.5 text-primary" />}
                      {o.label}
                    </span>
                    {voted && <span className="relative font-semibold tabular-nums text-foreground">{pct}%</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {total} votes · {voted ? "Tap another option to change your vote" : "Vote to see results"}
          </p>
        </div>
      );
    }
  }
}

export function DeadlineBadge({ date }: { date: string }) {
  const d = daysUntil(date);
  return (
    <span
      className={cn(
        "flex w-12 shrink-0 flex-col items-center rounded-lg py-1 text-center",
        d <= 7 ? "bg-danger-soft text-danger" : d <= 30 ? "bg-warning-soft text-warning" : "bg-surface-hover text-muted-foreground"
      )}
    >
      <span className="text-[10px] font-semibold leading-tight">{shortDate(date).split(" ")[1]}</span>
      <span className="text-base font-bold leading-tight">{shortDate(date).split(" ")[0]}</span>
    </span>
  );
}
