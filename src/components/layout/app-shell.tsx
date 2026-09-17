"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { MobileSidebar } from "./mobile-sidebar";
import { Topbar } from "./topbar";
import { UserProvider, useUser } from "./user-context";
import { ProfilePanel } from "./profile-panel";
import { SignedOutScreen } from "./signed-out-screen";

function AppShellInner({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signedIn } = useUser();

  return (
    <div className="flex h-dvh overflow-hidden">
      {!signedIn && <SignedOutScreen />}

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 pt-3 pb-4 sm:px-6 sm:pt-4 sm:pb-6">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>

      <ProfilePanel />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <AppShellInner>{children}</AppShellInner>
    </UserProvider>
  );
}
