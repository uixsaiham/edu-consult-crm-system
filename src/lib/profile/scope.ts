"use client";

import type { CurrentUser } from "@/lib/mock/user";
import type { DataScope } from "@/lib/mock/staff";
import { roleForName } from "@/lib/settings/menu";

/** Which records count as "mine": everything, my branch, or only records I own — from my role's data scope. */
export function scopeFor(user: Pick<CurrentUser, "role" | "branch" | "name">) {
  const scope: DataScope = roleForName(user.role)?.scope ?? "Own records";
  const match = (branch: string, owner: string) => scope === "All branches" || (scope === "Own branch" ? branch === user.branch : owner === user.name);
  const label = scope === "All branches" ? "across all branches" : scope === "Own branch" ? `in ${user.branch}` : "assigned to you";
  return { scope, match, label };
}
