"use client";

import { useMemo } from "react";
import { useUser } from "./user-context";
import { menuPermissionStore, menuStore, resolveMenu, roleForName } from "@/lib/settings/menu";
import { useSettingsStore } from "@/lib/settings/store";

/** The sidebar sections for the signed-in user, after Menu Settings and Menu Permission Settings. */
export function useMenu() {
  const { user } = useUser();
  const config = useSettingsStore(menuStore);
  const perms = useSettingsStore(menuPermissionStore);
  return useMemo(() => resolveMenu(config, perms, roleForName(user.role)), [config, perms, user.role]);
}
