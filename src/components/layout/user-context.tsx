"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { defaultUser, type CurrentUser } from "@/lib/mock/user";

interface UserContextValue {
  user: CurrentUser;
  updateUser: (patch: Partial<CurrentUser>) => void;
  profileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
  signedIn: boolean;
  signOut: () => void;
  signIn: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(defaultUser);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(true);

  const value: UserContextValue = {
    user,
    updateUser: (patch) => setUser((u) => ({ ...u, ...patch })),
    profileOpen,
    openProfile: () => setProfileOpen(true),
    closeProfile: () => setProfileOpen(false),
    signedIn,
    signOut: () => {
      setProfileOpen(false);
      setSignedIn(false);
    },
    signIn: () => setSignedIn(true),
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
