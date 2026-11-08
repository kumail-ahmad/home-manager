"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppSidebar from "@/components/Sidebar";
import { useApp } from "@/lib/AppContext";

const emptySubscribe = () => () => {};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAuthChecking } = useApp();

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isPublicPage = pathname === "/" || pathname === "/login";

  // Route protection
  useEffect(() => {
    if (!isMounted || isAuthChecking) return;

    if (!isPublicPage && !currentUser) {
      router.replace("/login");
    }
  }, [isMounted, isAuthChecking, isPublicPage, currentUser, router]);

  // If on a public page (/login or /), render without sidebar or offset
  if (isPublicPage) {
    return (
      <main style={{ minHeight: "100vh", width: "100%", background: "var(--ivory)" }}>
        {children}
      </main>
    );
  }

  // If loading authentication on a protected route, show a sleek loading screen
  if (!isMounted || isAuthChecking || !currentUser) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          background: "var(--ivory)",
        }}
      >
        <div className="spinner" style={{ width: "32px", height: "32px", borderWidth: "3px" }} />
        <p style={{ fontSize: "14px", color: "var(--stone-500)", fontWeight: 500 }}>
          Verifying authorization...
        </p>
      </div>
    );
  }

  // Authenticated user on protected page: render sidebar, mobile spacer, and main offset
  return (
    <div className="min-h-screen flex flex-col w-full bg-[var(--ivory)] text-[var(--stone-800)]">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 w-full md:pl-[252px]">
        {/* 56px spacer for mobile fixed topbar */}
        <div className="h-14 md:hidden shrink-0" aria-hidden="true" />
        <main className="flex-1 w-full min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
