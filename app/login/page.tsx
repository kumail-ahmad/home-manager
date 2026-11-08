"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useApp, AdminUser } from "@/lib/AppContext";
import {
  checkAdminStatusInSupabase,
  registerAdminRequestInSupabase,
} from "@/lib/supabaseService";
import {
  Flower2, Lock, UserPlus, LogIn, CheckCircle2, Clock,
  Sparkles, ArrowRight, ShieldCheck, Database, Layers
} from "lucide-react";

const ROTATING_HEADLINES = [
  "household name.",
  "smartest property.",
  "seamless hostel.",
  "modern residency.",
];

const THINKING_STREAM = [
  "Auditing 7 room inventories & bed vacancies...",
  "Auto-calculating monthly rent charges in ₹ INR...",
  "Splitting electricity sub-meter units across residents...",
  "Synchronizing multi-device database state with Supabase...",
  "Zero paperwork. 100% operational transparency.",
];

export default function LoginPage() {
  const router = useRouter();
  const app = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Animated thinking and rotating hero text
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [thinkingIndex, setThinkingIndex] = useState(0);

  useEffect(() => {
    const headlineInterval = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % ROTATING_HEADLINES.length);
    }, 2800);

    const thinkingInterval = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % THINKING_STREAM.length);
    }, 3600);

    return () => {
      clearInterval(headlineInterval);
      clearInterval(thinkingInterval);
    };
  }, []);

  const configured = isSupabaseConfigured();

  const handlePrefill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPendingNotice(null);
    setSuccess(null);

    const normUser = username.toLowerCase().trim();

    try {
      if (isSignUp) {
        // ── Registration Flow ──
        if (configured) {
          const adminRecord = await registerAdminRequestInSupabase(normUser, fullName);

          if (normUser.includes("@")) {
            const { error: authErr } = await supabase.auth.signUp({
              email: normUser,
              password,
            });
            if (authErr && !authErr.message.includes("already registered")) {
              throw new Error(authErr.message);
            }
          }

          if (adminRecord.status === "approved") {
            app.setCurrentUser(adminRecord);
            setSuccess("Administrator account created and approved! Redirecting...");
            setTimeout(() => router.push("/dashboard"), 1000);
          } else {
            setPendingNotice(
              "Registration submitted! Your account is pending administrator approval before you can access the dashboard."
            );
            setIsSignUp(false);
          }
        } else {
          const newAdmin = app.registerLocalAdmin(normUser, fullName);
          if (newAdmin.status === "approved") {
            app.setCurrentUser(newAdmin);
            setSuccess("Administrator account created! Redirecting...");
            setTimeout(() => router.push("/dashboard"), 1000);
          } else {
            setPendingNotice(
              `Registration requested for "${normUser}". An administrator must approve your account in Settings.`
            );
            setIsSignUp(false);
          }
        }
      } else {
        // ── Sign In Flow ──

        // 1. Primary Administrator (admin / kumail12)
        const isAdminUser = normUser === "admin" || normUser === "admin@home.com";
        if (isAdminUser) {
          if (password === "kumail12") {
            const adminUser: AdminUser = {
              id: "6ab75d02-4565-41b1-96f8-003b4481228d",
              email: "admin",
              fullName: "Administrator",
              role: "super_admin",
              status: "approved",
              approvedBy: "system",
              createdAt: new Date().toISOString(),
            };
            app.setCurrentUser(adminUser);
            router.push("/dashboard");
            return;
          } else {
            setError("Invalid password for admin.");
            setLoading(false);
            return;
          }
        }

        // 2. Co-Administrator (user / rameezahmad)
        const isNormalUser = normUser === "user" || normUser === "user@home.com" || normUser === "rameez";
        if (isNormalUser) {
          if (password === "rameezahmad") {
            const fullControlUser: AdminUser = {
              id: "c8d90f12-bc23-4811-a95b-f9148eede78f",
              email: "user",
              fullName: "Rameez Ahmad",
              role: "admin",
              status: "approved",
              approvedBy: "admin",
              createdAt: new Date().toISOString(),
            };
            app.setCurrentUser(fullControlUser);
            router.push("/dashboard");
            return;
          } else {
            setError("Invalid password for user.");
            setLoading(false);
            return;
          }
        }

        // 3. Fallback to Supabase Auth if email
        if (configured && normUser.includes("@")) {
          const { error: authErr } = await supabase.auth.signInWithPassword({
            email: normUser,
            password,
          });

          if (authErr) {
            setError(authErr.message ?? "Invalid username or password.");
            setLoading(false);
            return;
          }

          const admin = await checkAdminStatusInSupabase(normUser);
          if (!admin || admin.status === "pending") {
            await supabase.auth.signOut();
            setPendingNotice(
              "Account Pending Approval: Your account requires approval from an active administrator."
            );
            setLoading(false);
            return;
          }

          if (admin.status === "rejected") {
            await supabase.auth.signOut();
            setError("Access Denied: Your administrator access was declined.");
            setLoading(false);
            return;
          }

          app.setCurrentUser(admin);
          router.push("/dashboard");
        } else {
          setError("Invalid username or password.");
          setLoading(false);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#140b20] text-white flex flex-col selection:bg-purple-500 selection:text-white">
      {/* Top Navbar inspired by Shopify layout */}
      <header className="w-full border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between z-20 bg-[#140b20]/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-400/30">
            <Flower2 className="h-5 w-5 text-purple-300" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white">Home</span>
            <span className="text-xs text-purple-300 font-mono ml-1.5 px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-400/20">Manager</span>
          </div>
        </div>

        {/* Center Pill Badge */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-900/40 border border-purple-400/30 text-xs font-medium text-purple-200">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          <span>Fall &apos;26 Edition</span>
          <span className="text-purple-400/60">·</span>
          <span>Supabase Live</span>
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handlePrefill("admin", "kumail12")}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-purple-200 hover:text-white transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>admin / kumail12</span>
          </button>
          <a
            href="#auth-card"
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-purple-950 hover:bg-purple-100 transition-all shadow-sm"
          >
            Start for free
          </a>
        </div>
      </header>

      {/* Main Hero & Auth Split Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column: Bold Shopify-Style Hero Banner with Animated Thinking */}
        <div className="lg:col-span-7 flex flex-col gap-6 relative">
          
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-12 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Edition Pill (Mobile) */}
          <div className="md:hidden inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-400/30 text-xs text-purple-200 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span>Fall &apos;26 Edition · Home Manager</span>
          </div>

          {/* Hero Headline with Animated Thinking Text */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
              Be the next <br />
              <span className="inline-block bg-gradient-to-r from-purple-300 via-pink-200 to-amber-200 bg-clip-text text-transparent transition-all duration-300">
                {ROTATING_HEADLINES[headlineIndex]}
              </span>
            </h1>
            <p className="text-base sm:text-lg text-purple-200/80 max-w-xl font-normal leading-relaxed pt-2">
              Dream big and operate seamlessly on Home Manager. The modern hostel and rental property operations platform with real-time multi-device cloud synchronization.
            </p>
          </div>

          {/* Dual Shopify-Style Pill Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="#auth-card"
              className="px-6 py-3 rounded-full text-sm font-semibold bg-white text-purple-950 hover:bg-purple-50 transition-all shadow-md inline-flex items-center gap-2"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            <button
              type="button"
              onClick={() => handlePrefill("user", "rameezahmad")}
              className="px-5 py-3 rounded-full text-sm font-medium bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all backdrop-blur-md inline-flex items-center gap-2"
            >
              <span className="flex items-center -space-x-1">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-[10px] font-bold flex items-center justify-center text-white ring-2 ring-[#140b20]">R</span>
                <span className="w-5 h-5 rounded-full bg-purple-500 text-[10px] font-bold flex items-center justify-center text-white ring-2 ring-[#140b20]">K</span>
              </span>
              <span>Start with user: rameezahmad</span>
            </button>
          </div>

          {/* Animated Thinking Context Box */}
          <div className="mt-4 p-4 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md max-w-lg shadow-inner">
            <div className="flex items-center gap-2 mb-2 text-xs font-mono text-purple-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="uppercase tracking-wider font-semibold">Engine Thinking</span>
              <span className="text-white/30">|</span>
              <span className="text-white/60">Live Property Telemetry</span>
            </div>
            <p className="text-sm font-mono text-stone-200 transition-opacity duration-300 min-h-[22px]">
              &gt; {THINKING_STREAM[thinkingIndex]}
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs text-purple-200/70">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
              <Database className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Supabase PostgreSQL</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
              <Layers className="h-4 w-4 text-purple-300 shrink-0" />
              <span>Realtime Sync</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/5 col-span-2 sm:col-span-1">
              <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
              <span>Zero Calculation Lag</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sleek Frosted Auth Card */}
        <div id="auth-card" className="lg:col-span-5 w-full">
          <div className="relative rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
            
            {/* Ambient accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300" />

            <div className="mb-6 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-white/10 border border-white/15 mb-3 text-purple-200 shadow-sm">
                <Flower2 className="h-6 w-6 text-purple-300" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                {isSignUp ? "Request Access" : "Sign In to Home"}
              </h2>
              <p className="text-xs text-purple-200/70 mt-1">
                {isSignUp
                  ? "Admin approval required for authorization"
                  : "Enter your administrator credentials below"}
              </p>
            </div>

            {/* Auth Switch Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-white/5 border border-white/10 mb-5">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                  setPendingNotice(null);
                  setSuccess(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  !isSignUp
                    ? "bg-white text-purple-950 shadow-sm"
                    : "text-purple-200/70 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                  setPendingNotice(null);
                  setSuccess(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  isSignUp
                    ? "bg-white text-purple-950 shadow-sm"
                    : "text-purple-200/70 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Pending Notice */}
            {pendingNotice && (
              <div className="mb-4 p-3.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-xs text-blue-200 flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-blue-300 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="block mb-1 text-blue-100">Approval Queued</strong>
                  <p className="leading-relaxed">{pendingNotice}</p>
                </div>
              </div>
            )}

            {/* Error Notice */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-xs text-red-200 flex items-center gap-2">
                <Lock className="h-4 w-4 text-red-300 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Notice */}
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-purple-200/80 block" htmlFor="reg-name">
                    Full Name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kumail Ahmad"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-purple-200/80 block" htmlFor="login-username">
                  Username or Email
                </label>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or user"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-purple-200/80 block" htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
              </div>

              {/* Quick prefill chips */}
              {!isSignUp && (
                <div className="pt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-purple-300/60">Quick fill:</span>
                  <button
                    type="button"
                    onClick={() => handlePrefill("admin", "kumail12")}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-purple-200 border border-white/10 transition-colors"
                  >
                    admin (Super Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrefill("user", "rameezahmad")}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-purple-200 border border-white/10 transition-colors"
                  >
                    user (Admin)
                  </button>
                </div>
              )}

              {isSignUp && (
                <p className="text-[11px] text-purple-200/60 bg-white/5 p-2.5 rounded-lg border border-white/10 leading-relaxed">
                  🔒 New administrator requests require manual verification and approval by the primary administrator.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <span className="spinner border-2" />
                    <span>{isSignUp ? "Submitting request…" : "Signing in…"}</span>
                  </>
                ) : isSignUp ? (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Request Administrator Account</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 px-4 sm:px-8 py-5 text-center text-xs text-purple-200/50">
        <p>© 2026 Home Manager. Built for high-efficiency property operations with real-time Supabase synchronization.</p>
      </footer>
    </div>
  );
}
