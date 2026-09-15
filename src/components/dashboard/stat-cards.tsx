"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Minus,
  TrendingUp,
  UserCheck,
  Users2,
  type LucideIcon,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
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
  spark: number[];
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
    spark: [2, 4, 3, 5, 4, 6, 5, 3],
  },
  {
    id: "enrolled",
    label: "Enrolled Students",
    value: "2.7K",
    change: "-64.2%",
    trend: "down",
    share: 72,
    shareLabel: "BHE Direct",
    spark: [18, 16, 14, 12, 10, 8, 7, 6],
  },
  {
    id: "unconditional-offer",
    label: "Unconditional Offers",
    value: "504",
    change: "+87.7%",
    trend: "up",
    share: 68,
    shareLabel: "Verified",
    spark: [2, 3, 4, 6, 7, 9, 11, 12],
  },
  {
    id: "conditional-offer",
    label: "Conditional Offers",
    value: "499",
    change: "-46.2%",
    trend: "down",
    share: 73,
    shareLabel: "Pending Docs",
    spark: [5, 9, 12, 16, 14, 13, 11, 10],
  },
  {
    id: "new-apps",
    label: "New Applications",
    value: "411",
    change: "+47.6%",
    trend: "up",
    share: 71,
    shareLabel: "Campaign Inflow",
    spark: [4, 6, 5, 8, 7, 9, 10, 11],
  },
];

interface CardTheme {
  icon: LucideIcon;
  stroke: string;
  fillId: string;
  contextLabel: string;
  contextValue: string;
  contextSub: string;
}

const cardThemes: Record<string, CardTheme> = {
  leads: {
    icon: Users2,
    stroke: "#4f46e5",
    fillId: "sparkLinearLeads",
    contextLabel: "Qualified Rate",
    contextValue: "68%",
    contextSub: "(93.1K leads)",
  },
  "direct-applications": {
    icon: UserCheck,
    stroke: "#4f46e5",
    fillId: "sparkLinearDirect",
    contextLabel: "Self-Submitted",
    contextValue: "56%",
    contextSub: "(4.2K apps)",
  },
  "agent-applications": {
    icon: Handshake,
    stroke: "#f59e0b",
    fillId: "sparkLinearAgent",
    contextLabel: "Tier-1 Partners",
    contextValue: "64%",
    contextSub: "(1.9K apps)",
  },
  "cas-received": {
    icon: CheckCircle2,
    stroke: "#4f46e5",
    fillId: "sparkLinearCas",
    contextLabel: "Direct vs B2B",
    contextValue: "33%",
    contextSub: "(67% B2B)",
  },
};

const weekLabels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  strokeColor?: string;
}

function MiniChartTooltip({ active, payload, label, strokeColor }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs shadow-md card-shadow">
      <span className="size-1.5 rounded-full" style={{ backgroundColor: strokeColor || "#4f46e5" }} />
      <span className="text-[10px] font-medium text-muted-foreground">{label}:</span>
      <span className="font-bold text-foreground tabular-nums">{payload[0].value}</span>
    </div>
  );
}

export function StatCards() {
  const stats = getStatCards();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
      className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {/* Cards 1 to 3 */}
      {stats.slice(0, 3).map((stat) => {
        const theme = cardThemes[stat.id] || cardThemes.leads;
        const Icon = theme.icon;
        const sparkData = stat.spark.map((v, i) => ({
          period: weekLabels[i] || `W${i + 1}`,
          value: v,
        }));
        const isUp = stat.trend === "up";
        const isFlat = stat.trend === "flat";
        const TrendIcon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
        const isExpanded = !!expandedCards[stat.id];

        return (
          <article
            key={stat.id}
            aria-labelledby={`card-metric-${stat.id}`}
            className={cn(
              "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-surface p-5 card-shadow transition-all duration-300 hover:border-primary/40",
              isExpanded ? "shadow-md" : "hover:-translate-y-1 hover:shadow-lg"
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

                <div className="flex items-center gap-1.5">
                  <span className="hidden items-center gap-1 text-[11px] font-medium text-muted-foreground/70 sm:inline-flex">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: theme.stroke }} />
                    Live
                  </span>

                  {/* Expand Graph Button */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(stat.id)}
                    aria-label={isExpanded ? "Hide trend graph" : "Show trend graph"}
                    title={isExpanded ? "Hide trend graph" : "Show trend graph"}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-all duration-200 border active:scale-95",
                      isExpanded
                        ? "border-primary/40 bg-primary-soft text-primary shadow-2xs"
                        : "border-border/80 bg-surface-muted/80 text-muted-foreground hover:bg-surface hover:text-foreground"
                    )}
                  >
                    <TrendingUp className="size-3" />
                    <span>{isExpanded ? "Hide" : "Graph"}</span>
                    <ChevronDown
                      className={cn("size-3 transition-transform duration-200", isExpanded && "rotate-180")}
                    />
                  </button>
                </div>
              </div>

              {/* Row 2: Hero Number + Trend Badge (Grouped on Same Baseline) */}
              <div className="mt-4 flex items-baseline gap-2.5">
                <p className="text-3xl font-extrabold leading-none tracking-tight text-foreground tabular-nums sm:text-[34px]">
                  {stat.value}
                </p>

                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums shadow-2xs",
                    isFlat
                      ? "border-slate-200/80 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
                      : isUp
                      ? "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
                  )}
                >
                  <TrendIcon className="size-3 shrink-0" strokeWidth={2.5} />
                  {stat.deltaLabel}
                </span>
              </div>

              {/* Row 3: Subtitle Context Label */}
              <p className="mt-1.5 text-[11px] font-medium text-muted-foreground/90">
                vs. same period last year
              </p>

              {/* Clean Micro Divider */}
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

              {/* Expanded Graph Section (Revealed when card is expanded) */}
              {isExpanded && (
                <div className="mt-4 border-t border-border/70 pt-3.5 transition-all duration-300">
                  <div className="mb-2 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-foreground">8-Week Trend Trajectory</span>
                    <span className="text-muted-foreground">Weekly Performance</span>
                  </div>

                  <div className="h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparkData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                        <defs>
                          <linearGradient id={theme.fillId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={theme.stroke} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={theme.stroke} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="period"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        />
                        <Tooltip
                          content={<MiniChartTooltip strokeColor={theme.stroke} />}
                          cursor={{ stroke: theme.stroke, strokeWidth: 1, strokeDasharray: "2 2" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={theme.stroke}
                          strokeWidth={2.2}
                          fill={`url(#${theme.fillId})`}
                          activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
                          isAnimationActive={true}
                          animationDuration={600}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </article>
        );
      })}

      {/* Card 4: Interactive Lifecycle Pipeline Carousel */}
      {(() => {
        const theme = cardThemes["cas-received"];
        const sparkData = currentStatus.spark.map((v, i) => ({
          period: weekLabels[i] || `W${i + 1}`,
          value: v,
        }));
        const isUp = currentStatus.trend === "up";
        const isFlat = currentStatus.trend === "flat";
        const TrendIcon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
        const isExpanded = !!expandedCards["cas-carousel"];

        return (
          <article
            aria-label="Lifecycle Pipeline status"
            className={cn(
              "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-surface p-5 card-shadow transition-all duration-300 hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isExpanded ? "shadow-md" : "hover:-translate-y-1 hover:shadow-lg"
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

                  {/* Expand Graph Button */}
                  <button
                    type="button"
                    onClick={() => toggleExpand("cas-carousel")}
                    aria-label={isExpanded ? "Hide trend graph" : "Show trend graph"}
                    title={isExpanded ? "Hide trend graph" : "Show trend graph"}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-all duration-200 border active:scale-95",
                      isExpanded
                        ? "border-primary/40 bg-primary-soft text-primary shadow-2xs"
                        : "border-border/80 bg-surface-muted/80 text-muted-foreground hover:bg-surface hover:text-foreground"
                    )}
                  >
                    <TrendingUp className="size-3" />
                    <span>{isExpanded ? "Hide" : "Graph"}</span>
                    <ChevronDown
                      className={cn("size-3 transition-transform duration-200", isExpanded && "rotate-180")}
                    />
                  </button>
                </div>
              </div>

              {/* Row 2: Hero Number + Trend Badge (Grouped on Same Baseline) */}
              <div className="mt-4 flex items-baseline gap-2.5">
                <p
                  className={cn(
                    "text-3xl font-extrabold leading-none tracking-tight text-foreground tabular-nums transition-all duration-200 sm:text-[34px]",
                    isFading && "scale-95 opacity-50"
                  )}
                >
                  {currentStatus.value}
                </p>

                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums shadow-2xs transition-opacity duration-200",
                    isFading && "opacity-40",
                    isFlat
                      ? "border-slate-200/80 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
                      : isUp
                      ? "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
                  )}
                >
                  <TrendIcon className="size-3 shrink-0" strokeWidth={2.5} />
                  {currentStatus.change}
                </span>
              </div>

              {/* Row 3: Subtitle Context Label */}
              <p className="mt-1.5 text-[11px] font-medium text-muted-foreground/90">
                vs. same period last year
              </p>

              {/* Clean Micro Divider */}
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

              {/* Expanded Graph Section (Revealed when carousel card is expanded) */}
              {isExpanded && (
                <div className="mt-4 border-t border-border/70 pt-3.5 transition-all duration-300">
                  <div className="mb-2 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-foreground">{currentStatus.label} Trajectory</span>
                    <span className="text-muted-foreground">Weekly Performance</span>
                  </div>

                  <div className="h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparkData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                        <defs>
                          <linearGradient id="sparkLinearCasCarouselExp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="period"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        />
                        <Tooltip
                          content={<MiniChartTooltip strokeColor="#4f46e5" />}
                          cursor={{ stroke: "#4f46e5", strokeWidth: 1, strokeDasharray: "2 2" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#4f46e5"
                          strokeWidth={2.2}
                          fill="url(#sparkLinearCasCarouselExp)"
                          activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
                          isAnimationActive={true}
                          animationDuration={600}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </article>
        );
      })()}
    </section>
  );
}
