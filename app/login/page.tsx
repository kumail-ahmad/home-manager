"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useApp, AdminUser } from "@/lib/AppContext";
import {
  checkAdminStatusInSupabase,
  registerAdminRequestInSupabase,
} from "@/lib/supabaseService";
import { Flower2, Lock, UserPlus, LogIn, CheckCircle2, Clock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const app = useApp();
  const [isSignUp,  setIsSignUp]  = useState(false);
  const [fullName,  setFullName]  = useState("");
  const [username,  setUsername]  = useState("");
  const [password,  setPassword]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [success,   setSuccess]   = useState<string | null>(null);

  const configured = isSupabaseConfigured();

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

          // Only attempt Supabase Auth if username is an email
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

        // 1. Check Primary Administrator credentials (admin / kumail12)
        const isAdminUser = (
          normUser === "admin" ||
          normUser === "admin@home.com"
        );
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

        // 2. Check Co-Administrator / User credentials (user / rameezahmad)
        const isNormalUser = (
          normUser === "user" ||
          normUser === "user@home.com" ||
          normUser === "rameez"
        );
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

        // 3. Fallback to Supabase Auth if an email was entered
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
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 relative z-10">
      <div className="w-full max-w-[420px]">
        {/* Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-xl relative overflow-hidden">
          {/* Subtle floral watermark top-right */}
          <div
            className="absolute -right-10 -bottom-10 w-36 h-36 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "url('/bg-floral.png')",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              mixBlendMode: "multiply",
            }}
            aria-hidden="true"
          />

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ display: "inline-flex", background: "var(--blush-100)", borderRadius: "14px", padding: "12px", marginBottom: "12px" }}>
              <Flower2 style={{ width: 28, height: 28, color: "var(--blush-500)" }} />
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--stone-800)" }}>Home Manager</h1>
            <p style={{ fontSize: "13px", color: "var(--stone-400)", marginTop: "4px" }}>
              {isSignUp ? "Request an administrator account" : "Sign in to manage your property"}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div style={{ display: "flex", background: "var(--stone-100)", padding: "3px", borderRadius: "8px", marginBottom: "20px" }}>
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(null); setPendingNotice(null); setSuccess(null); }}
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                background: !isSignUp ? "white" : "transparent",
                color: !isSignUp ? "var(--stone-800)" : "var(--stone-500)",
                boxShadow: !isSignUp ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(null); setPendingNotice(null); setSuccess(null); }}
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                background: isSignUp ? "white" : "transparent",
                color: isSignUp ? "var(--stone-800)" : "var(--stone-500)",
                boxShadow: isSignUp ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Create Account
            </button>
          </div>

          {/* Pending Approval Notice */}
          {pendingNotice && (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px", fontSize: "13px", color: "#1e40af", display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Clock style={{ width: 18, height: 18, flexShrink: 0, marginTop: "2px", color: "#2563eb" }} />
              <div>
                <strong style={{ display: "block", marginBottom: "3px" }}>Approval Required</strong>
                <p style={{ lineHeight: 1.5 }}>{pendingNotice}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#dc2626", display: "flex", alignItems: "center", gap: "8px" }}>
              <Lock style={{ width: 14, height: 14, flexShrink: 0 }} /> {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#16a34a", display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0 }} /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {isSignUp && (
              <div className="form-group">
                <label className="form-label" htmlFor="register-name">Full name</label>
                <input
                  id="register-name"
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Rameez Ahmad"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="login-username">Username or Email</label>
              <input
                id="login-username"
                type="text"
                className="form-input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin or user"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            {isSignUp && (
              <p style={{ fontSize: "12px", color: "var(--stone-500)", background: "#f8fafc", padding: "8px 10px", borderRadius: "6px" }}>
                🔒 <strong>Security Policy:</strong> Newly registered accounts remain pending until approved by an administrator.
              </p>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "10px", marginTop: "4px" }} disabled={loading}>
              {loading ? (
                <><span className="spinner" />{isSignUp ? "Submitting request…" : "Signing in…"}</>
              ) : isSignUp ? (
                <><UserPlus style={{ width: 16, height: 16 }} /> Request Account</>
              ) : (
                <><LogIn style={{ width: 16, height: 16 }} /> Sign In</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
