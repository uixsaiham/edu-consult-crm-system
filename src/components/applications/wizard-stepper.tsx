"use client";

import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStepMeta {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  optional?: boolean;
}

interface WizardStepperProps {
  steps: WizardStepMeta[];
  currentIndex: number;
  isValid: (index: number) => boolean;
  furthest: number;
  onSelect: (index: number) => void;
}

function stepState(index: number, currentIndex: number, valid: boolean, furthest: number) {
  if (index === currentIndex) return "current" as const;
  if (valid) return "done" as const;
  if (index <= furthest) return "reached" as const;
  return "upcoming" as const;
}

export function WizardStepper({ steps, currentIndex, isValid, furthest, onSelect }: WizardStepperProps) {
  return (
    <>
      {/* Desktop vertical rail */}
      <nav className="hidden flex-col md:flex" aria-label="Application steps">
        {steps.map((step, i) => {
          const state = stepState(i, currentIndex, isValid(i), furthest);
          const Icon = step.icon;
          const isLast = i === steps.length - 1;
          return (
            <button
              key={step.key}
              type="button"
              onClick={() => onSelect(i)}
              className="group flex gap-3 text-left"
            >
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
                    state === "done" && "border-primary bg-primary text-primary-foreground",
                    state === "current" && "border-primary bg-primary-soft text-primary ring-4 ring-primary/15",
                    state === "reached" && "border-border-strong bg-surface text-foreground",
                    state === "upcoming" &&
                      "border-border bg-surface text-muted-foreground group-hover:border-border-strong group-hover:text-foreground"
                  )}
                >
                  {state === "done" ? <Check className="size-4" strokeWidth={3} /> : <Icon className="size-4" />}
                </span>
                {!isLast && (
                  <span
                    className={cn("mt-1 w-0.5 flex-1 rounded-full", state === "done" ? "bg-primary" : "bg-border")}
                    style={{ minHeight: 30 }}
                  />
                )}
              </div>
              <div className={cn("min-w-0", !isLast && "pb-7")}>
                <p
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    state === "upcoming" ? "text-muted-foreground group-hover:text-foreground" : "text-foreground"
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                {step.optional && (
                  <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                    Optional
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Mobile compact scroller */}
      <nav className="flex gap-2 overflow-x-auto pb-1 md:hidden" aria-label="Application steps">
        {steps.map((step, i) => {
          const state = stepState(i, currentIndex, isValid(i), furthest);
          const Icon = step.icon;
          return (
            <button
              key={step.key}
              type="button"
              onClick={() => onSelect(i)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
                state === "current" && "border-primary bg-primary-soft text-primary",
                state === "done" && "border-primary/40 bg-primary text-primary-foreground",
                (state === "reached" || state === "upcoming") &&
                  "border-border bg-surface text-muted-foreground"
              )}
            >
              {state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : <Icon className="size-3.5" />}
              {step.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
