"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import {
  LayoutDashboard, Users, Building2, CreditCard, Zap, Receipt,
  FileText, BarChart2, ClipboardList, Settings, LogOut, Menu, X,
  Flower2, RefreshCw
} from "lucide-react";

const sections = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard",     icon: LayoutDashboard },
    ],
  },
  {
    label: "People & Rooms",
    items: [
      { href: "/residents", label: "Residents",     icon: Users },
      { href: "/rooms",     label: "Rooms & Occupancy", icon: Building2 },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/rent",        label: "Rent Management",    icon: CreditCard },
      { href: "/electricity", label: "Electricity",        icon: Zap },
      { href: "/payments",    label: "Payment History",    icon: Receipt },
      { href: "/invoices",    label: "Invoices",           icon: FileText },
    ],
  },
  {
    label: "Reporting",
    items: [
      { href: "/reports",   label: "Reports & Exports",  icon: BarChart2 },
      { href: "/activity",  label: "Activity Log",       icon: ClipboardList },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/settings",  label: "Settings",           icon: Settings },
    ],
  },
];

function NavLink({ href, label, icon: Icon, onClick }: { href: string; label: string; icon: React.ElementType; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`nav-item ${active ? "active" : ""}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function SidebarContent({
  closeFn,
  onSignOut,
  currentUser,
  isLiveBackend,
  isLoadingBackend,
  onRefresh,
}: {
  closeFn?: () => void;
  onSignOut: () => void;
  currentUser: ReturnType<typeof useApp>["currentUser"];
  isLiveBackend: boolean;
  isLoadingBackend: boolean;
  onRefresh: () => void;
}) {
  return (
    <>
      <div className="px-5 py-5 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div style={{ background: "var(--blush-100)", padding: "7px", borderRadius: "10px" }}>
            <Flower2 className="h-5 w-5" style={{ color: "var(--blush-500)" }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--stone-800)" }}>Home</p>
            <p className="text-xs" style={{ color: "var(--stone-400)" }}>Manager</p>
          </div>
        </div>
        {isLiveBackend && (
          <button
            onClick={onRefresh}
            disabled={isLoadingBackend}
            title="Refresh database state"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingBackend ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {sections.map(section => (
          <div key={section.label} className="mb-2">
            <p className="nav-section-label">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map(item => <NavLink key={item.href} {...item} onClick={closeFn} />)}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-3 py-3 border-t border-stone-100 space-y-2">
        <div className="px-2.5 py-2 rounded-lg bg-stone-50 border border-stone-100 text-xs">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 font-medium text-stone-700">
              <span className={`h-2 w-2 rounded-full ${isLiveBackend ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
              <span>{isLiveBackend ? "Database Connected" : "Local Mode"}</span>
            </div>
            {isLiveBackend && <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-medium">Live</span>}
          </div>
          {currentUser && (
            <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 mt-1">
              <span className="text-[11px] font-semibold text-stone-800 truncate">
                {currentUser.email === "admin" || currentUser.role === "super_admin" ? "admin" : "user"}
              </span>
              <span className={`badge ${currentUser.email === "admin" || currentUser.role === "super_admin" ? "badge-blush" : "badge-stone"} text-[10px] py-0 px-1.5`}>
                {currentUser.email === "admin" || currentUser.role === "super_admin" ? "Admin" : "User"}
              </span>
            </div>
          )}
        </div>
        <button onClick={onSignOut} className="nav-item w-full text-red-500 hover:bg-red-50">
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );
}

export default function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const app = useApp();

  const handleSignOut = async () => {
    await app.logout();
    router.push("/login");
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="sidebar hidden md:flex flex-col"
        aria-label="Main navigation"
      >
        <SidebarContent
          onSignOut={handleSignOut}
          currentUser={app.currentUser}
          isLiveBackend={app.isLiveBackend}
          isLoadingBackend={app.isLoadingBackend}
          onRefresh={app.refreshBackend}
        />
      </aside>

      {/* Mobile: top bar with hamburger */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-stone-200"
        style={{ height: "56px" }}
      >
        <div className="flex items-center gap-2.5">
          <div style={{ background: "var(--blush-100)", padding: "5px", borderRadius: "8px" }}>
            <Flower2 className="h-4 w-4" style={{ color: "var(--blush-500)" }} />
          </div>
          <span className="font-semibold text-sm" style={{ color: "var(--stone-800)" }}>Home Manager</span>
        </div>
        <div className="flex items-center gap-2">
          {app.isLiveBackend && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          )}
          <button
            onClick={() => setMobileOpen(true)}
            className="btn btn-ghost btn-icon"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <aside
            className="absolute top-0 left-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl"
            style={{ animation: "slideRight 0.22s ease" }}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Flower2 className="h-5 w-5" style={{ color: "var(--blush-500)" }} />
                <span className="font-semibold text-sm">Home Manager</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="btn btn-ghost btn-icon" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              closeFn={() => setMobileOpen(false)}
              onSignOut={handleSignOut}
              currentUser={app.currentUser}
              isLiveBackend={app.isLiveBackend}
              isLoadingBackend={app.isLoadingBackend}
              onRefresh={app.refreshBackend}
            />
          </aside>
        </div>
      )}

      <style>{`@keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
    </>
  );
}
