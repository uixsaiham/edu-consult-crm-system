"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/components/layout/user-context";
import { TargetForm, draftFrom } from "@/components/targets/target-form";
import { allIntakes, getTarget, intakeWindow, metrics, nextIntake, scopes, type Metric, type Scope } from "@/lib/mock/targets";

export default function AddTargetPage() {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading…</p>}>
      <AddTarget />
    </Suspense>
  );
}

/** Supports ?intake=&metric=&scope=&value= to pre-fill, and ?copy=<id> to copy a target to the next intake. */
function AddTarget() {
  const params = useSearchParams();
  const { user } = useUser();
  const copy = params.get("copy");
  const source = copy ? getTarget(copy) : undefined;
  const intake = params.get("intake");
  const metric = params.get("metric");
  const scope = params.get("scope");

  const initial = source
    ? (() => {
        const next = nextIntake(source.intake);
        const w = intakeWindow(next);
        return { ...draftFrom(source, user.name), intake: next, startDate: w.start, endDate: w.end, notes: `Copied from ${source.id} (${source.intake}).` };
      })()
    : draftFrom(
        {
          intake: intake && allIntakes.includes(intake) ? intake : undefined,
          metric: metric && (metrics as readonly string[]).includes(metric) ? (metric as Metric) : undefined,
          scope: scope && (scopes as readonly string[]).includes(scope) ? (scope as Scope) : undefined,
          scopeValue: params.get("value") ?? undefined,
        },
        user.name
      );

  return <TargetForm key={params.toString()} initial={initial} />;
}
