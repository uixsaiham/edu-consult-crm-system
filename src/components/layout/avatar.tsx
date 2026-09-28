"use client";

import { presenceStatuses, type CurrentUser } from "@/lib/mock/user";
import { cn, initialsFor } from "@/lib/utils";

const sizes = { sm: "size-9 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg", xl: "size-24 text-3xl" };
const dots = { sm: "size-2.5", md: "size-3", lg: "size-3.5", xl: "size-5 border-[3px]" };

/** The signed-in person's photo (or initials) with their presence dot. */
export function UserAvatar({ user, size = "sm", showStatus = true, className }: { user: Pick<CurrentUser, "name" | "photo" | "avatarColor" | "status">; size?: keyof typeof sizes; showStatus?: boolean; className?: string }) {
  const dot = presenceStatuses.find((p) => p.value === user.status)?.dot ?? "bg-success";
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {user.photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- local data URL
        <img src={user.photo} alt="" className={cn("rounded-full object-cover", sizes[size])} />
      ) : (
        <span className={cn("flex items-center justify-center rounded-full font-semibold text-white", sizes[size], user.avatarColor)}>{initialsFor(user.name)}</span>
      )}
      {showStatus && <span title={user.status} className={cn("absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-surface", dots[size], dot)} />}
    </span>
  );
}
