"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { CurrentUser } from "@/lib/mock/user";
import { profileStore, securityStore, withProfileDefaults } from "@/lib/settings/account";
import { logAudit } from "@/lib/settings/audit";
import { useSettingsStore } from "@/lib/settings/store";

interface UserContextValue {
  user: CurrentUser;
  updateUser: (patch: Partial<CurrentUser>) => void;
  signedIn: boolean;
  signOut: (opts?: { everywhere?: boolean }) => void;
  signIn: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const user = withProfileDefaults(useSettingsStore(profileStore));
  const [signedIn, setSignedIn] = useState(true);

  const value: UserContextValue = {
    user,
    updateUser: (patch) => profileStore.set({ ...user, ...patch }),
    signedIn,
    signOut: (opts) => {
      if (opts?.everywhere) {
        const s = securityStore.get();
        securityStore.set({ ...s, sessions: s.sessions.filter((x) => x.current) });
      }
      logAudit({ actor: user.name, role: user.role, module: "Security", action: "Signed out", entity: "CRM", summary: opts?.everywhere ? "Signed out on every device" : "Signed out", severity: opts?.everywhere ? "notice" : "info" });
      setSignedIn(false);
    },
    signIn: () => {
      logAudit({ actor: user.name, role: user.role, module: "Security", action: "Signed in", entity: "CRM", summary: "Signed in", severity: "info" });
      setSignedIn(true);
    },
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
