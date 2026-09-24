"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Minus,
  UserCheck,
  Users2,
  type LucideIcon,
} from "lucide-react";
import { getStatCards } from "@/lib/mock/dashboard";
import { cn } from "@/lib/utils";

interface StatusItem {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "flat";
  share: number;
  shareLabel: string;
}

const carouselStatuses: StatusItem[] = [
  {
    id: "cas-received",
    label: "CAS Received",
    value: "3",
    change: "+0%",
    trend: "flat",
    share: 33,
    shareLabel: "BHE Apps",
  },
  {
    id: "enrolled",
    label: "Enrolled Students",
    value: "2.7K",
    change: "-64.2%",
    trend: "down",
    share: 72,
    shareLabel: "BHE Direct",
  },
  {
    id: "unconditional-offer",
    label: "Unconditional Offers",
    value: "504",
    change: "+87.7%",
    trend: "up",
    share: 68,
    shareLabel: "Verified",
  },
  {
    id: "conditional-offer",
    label: "Conditional Offers",
    value: "499",
    change: "-46.2%",
    trend: "down",
    share: 73,
    shareLabel: "Pending Docs",
  },
  {
    id: "new-apps",
    label: "New Applications",
    value: "411",
    change: "+47.6%",
    trend: "up",
    share: 71,
    shareLabel: "Campaign Inflow",
  },
];

interface CardTheme {
  icon: LucideIcon;
  stroke: string;
  contextLabel: string;
  contextValue: string;
  contextSub: string;
}

const cardThemes: Record<string, CardTheme> = {
  leads: {
    icon: Users2,
    stroke: "var(--primary)",
    contextLabel: "Qualified Rate",
    contextValue: "68%",
    contextSub: "(93.1K leads)",
  },
  "direct-applications": {
    icon: UserCheck,
    stroke: "var(--primary)",
    contextLabel: "Self-Submitted",
    contextValue: "56%",
    contextSub: "(4.2K apps)",
  },
  "agent-applications": {
    icon: Handshake,
    stroke: "#f59e0b",
    contextLabel: "Tier-1 Partners",
    contextValue: "64%",
    contextSub: "(1.9K apps)",
  },
  "cas-received": {
    icon: CheckCircle2,
    stroke: "var(--primary)",
    contextLabel: "Direct vs B2B",
    contextValue: "33%",
    contextSub: "(67% B2B)",
  },
};

// Expand short values ("137.0K") to the full figure with Indian grouping ("1,37,000").
function formatFull(value: string) {
  const match = value.trim().match(/^([\d.,]+)\s*([KkMm]?)$/);
  if (!match) return value;
  const multiplier = { k: 1_000, m: 1_000_000 }[match[2].toLowerCase()] ?? 1;
  return Math.round(Number(match[1].replace(/,/g, "")) * multiplier).toLocaleString("en-IN");
}

// Show changes as a plain percentage; the arrow and colour carry the direction.
function formatChange(label: string) {
  return label.replace(/\s*less$/i, "").replace(/^[+-]/, "");
}

function trendClass(isUp: boolean, isFlat: boolean) {
  return isFlat ? "text-muted-foreground" : isUp ? "text-success" : "text-danger";
}

export function StatCards() {
  const stats = getStatCards();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const changeSlide = (newIndex: number) => {
    setIsFading(true);
    setCarouselIndex(newIndex);
    setTimeout(() => setIsFading(false), 180);
  };

  const prevSlide = () => {
    const nextIdx = carouselIndex === 0 ? carouselStatuses.length - 1 : carouselIndex - 1;
    changeSlide(nextIdx);
  };

  const nextSlide = () => {
    const nextIdx = carouselIndex === carouselStatuses.length - 1 ? 0 : carouselIndex + 1;
    changeSlide(nextIdx);
  };

  const currentStatus = carouselStatuses[carouselIndex];

  return (
    <section
      aria-label="Key performance indicators"
      className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {/* Cards 1 to 3 */}
      {stats.slice(0, 3).map((stat) => {
        const theme = cardThemes[stat.id] || cardThemes.leads;
        const Icon = theme.icon;
        const isUp = stat.trend === "up";
        const isFlat = stat.trend === "flat";
        const TrendIcon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;

        return (
          <article
            key={stat.id}
            aria-labelledby={`card-metric-${stat.id}`}
            className={cn(
              "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-surface p-5 card-shadow transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg"
            )}
          >
            {/* Ambient Top Glow Line on Hover */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Foreground Content */}
            <div className="relative z-10 flex flex-col">
              {/* Row 1: Header (Equal Height & Baseline Alignment) */}
              <div className="flex h-7 items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-muted-foreground transition-colors group-hover:bg-primary-soft group-hover:text-primary">
                    <Icon className="size-3.5" strokeWidth={2} />
                  </span>
                  <h2
                    id={`card-metric-${stat.id}`}
                    className="text-[13px] font-semibold text-muted-foreground transition-colors group-hover:text-foreground"
                  >
                    {stat.label}
                  </h2>
                </div>
              </div>

              {/* Row 2: Hero number + change vs same period last year */}
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatFull(stat.value)}
                </p>
                <span
                  title="vs. same period last year"
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums transition-opacity duration-200",
                    trendClass(isUp, isFlat)
                  )}
                >
                  <TrendIcon className="size-3.5 shrink-0" aria-hidden="true" />
                  {formatChange(stat.deltaLabel)}
                </span>
              </div>

              <div className="my-3.5 h-px w-full bg-border/60" />

              {/* Row 4: Crisp Context Detail */}
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: theme.stroke }}
                  />
                  {theme.contextLabel}
                </span>
                <span className="font-semibold text-foreground tabular-nums">
                  <span style={{ color: theme.stroke }}>{theme.contextValue}</span>{" "}
                  <span className="font-normal text-muted-foreground">{theme.contextSub}</span>
                </span>
              </div>
            </div>
          </article>
        );
      })}

      {/* Card 4: Interactive Lifecycle Pipeline Carousel */}
      {(() => {
        const theme = cardThemes["cas-received"];
        const isUp = currentStatus.trend === "up";
        const isFlat = currentStatus.trend === "flat";
        const TrendIcon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;

        return (
          <article
            aria-label="Lifecycle Pipeline status"
            className={cn(
              "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-surface p-5 card-shadow transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            )}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") prevSlide();
              if (e.key === "ArrowRight") nextSlide();
            }}
            tabIndex={0}
          >
            {/* Ambient Top Glow Line on Hover */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Foreground Content */}
            <div className="relative z-10 flex flex-col">
              {/* Row 1: Header (Equal Height & Baseline Alignment) */}
              <div className="flex h-7 items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-muted-foreground transition-colors group-hover:bg-primary-soft group-hover:text-primary">
                    <CheckCircle2 className="size-3.5" strokeWidth={2} />
                  </span>
                  <h2
                    className={cn(
                      "truncate text-[13px] font-semibold text-muted-foreground transition-all duration-200 group-hover:text-foreground",
                      isFading && "opacity-40"
                    )}
                    title={currentStatus.label}
                  >
                    {currentStatus.label}
                  </h2>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {/* Carousel Controls */}
                  <div className="flex items-center gap-0.5 rounded-md border border-border/80 bg-surface-muted/70 p-0.5">
                    <button
                      type="button"
                      onClick={prevSlide}
                      aria-label="Previous lifecycle stage"
                      className="flex size-5 items-center justify-center rounded text-muted-foreground transition-all hover:bg-surface hover:text-foreground active:scale-90"
                    >
                      <ChevronLeft className="size-3" />
                    </button>
                    <span className="px-1 text-[10px] font-bold text-muted-foreground tabular-nums">
                      {carouselIndex + 1}/{carouselStatuses.length}
                    </span>
                    <button
                      type="button"
                      onClick={nextSlide}
                      aria-label="Next lifecycle stage"
                      className="flex size-5 items-center justify-center rounded text-muted-foreground transition-all hover:bg-surface hover:text-foreground active:scale-90"
                    >
                      <ChevronRight className="size-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Hero number + change vs same period last year */}
              <div className="mt-3 flex items-baseline gap-2">
                <p
                  className={cn(
                    "text-3xl font-bold tracking-tight text-foreground tabular-nums transition-opacity duration-200",
                    isFading && "opacity-50"
                  )}
                >
                  {formatFull(currentStatus.value)}
                </p>
                <span
                  title="vs. same period last year"
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums transition-opacity duration-200",
                    isFading && "opacity-40",
                    trendClass(isUp, isFlat)
                  )}
                >
                  <TrendIcon className="size-3.5 shrink-0" aria-hidden="true" />
                  {formatChange(currentStatus.change)}
                </span>
              </div>

              <div className="my-3.5 h-px w-full bg-border/60" />

              {/* Row 4: Crisp Context Detail */}
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: theme.stroke }}
                  />
                  {currentStatus.shareLabel}
                </span>
                <span className="font-semibold text-foreground tabular-nums">
                  <span style={{ color: theme.stroke }}>{currentStatus.share}%</span>{" "}
                  <span className="font-normal text-muted-foreground">({100 - currentStatus.share}% B2B)</span>
                </span>
              </div>
            </div>
          </article>
        );
      })()}
    </section>
  );
}
