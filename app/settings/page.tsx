"use client";

import { useState } from "react";
import { Check, Settings, Sparkles, Database, RefreshCw, AlertCircle, CheckCircle2, Copy, Shield, UserCheck, UserX, LogOut } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useApp } from "@/lib/AppContext";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { toast } = useToast();
  const app = useApp();
  const router = useRouter();
  const [compact, setCompact] = useState(false);
  const [showCents, setShowCents] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const configured = isSupabaseConfigured();

  const savePreferences = () => {
    setSaved(true);
    toast("Display preferences updated for this session.");
    window.setTimeout(() => setSaved(false), 2200);
  };

  const testSupabaseConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      if (!configured) {
        setTestResult({
          success: false,
          message: "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured with valid credentials in .env.local.",
        });
        return;
      }
      const { error } = await supabase.from("rooms").select("id").limit(1);
      if (error) {
        setTestResult({
          success: false,
          message: `Connected to Supabase, but query failed: ${error.message}. Have you run supabase/schema.sql in your Supabase SQL Editor?`,
        });
      } else {
        setTestResult({
          success: true,
          message: "Successfully connected to Supabase PostgreSQL database!",
        });
        await app.refreshBackend();
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: `Connection test error: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleApprove = async (adminId: string, email: string) => {
    try {
      await app.approveAdmin(adminId);
      toast(`Admin "${email}" has been approved.`);
    } catch {
      toast("Failed to approve administrator.", "error");
    }
  };

  const handleReject = async (adminId: string, email: string) => {
    try {
      await app.rejectAdmin(adminId);
      toast(`Admin request for "${email}" was rejected.`, "error");
    } catch {
      toast("Failed to reject administrator.", "error");
    }
  };

  const handleSignOut = async () => {
    await app.logout();
    router.replace("/login");
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-desc">System configuration, administrator approvals, and workspace preferences</p>
        </div>
        <button
          onClick={handleSignOut}
          className="btn btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>

      <div className="page-body">
        <div className="settings-grid">
          {/* Administrator Approvals & Access Control */}
          <section className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="settings-heading">
              <div className="icon-tile blush">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2>Administrator Accounts & Access Control</h2>
                <p>New user registrations require administrator approval before gaining access</p>
              </div>
            </div>
            <div className="divider" />

            <div style={{ overflowX: "auto" }}>
              <table className="table" style={{ width: "100%", fontSize: "13px" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--stone-500)", borderBottom: "1px solid var(--stone-200)" }}>
                    <th style={{ padding: "10px 12px" }}>Administrator</th>
                    <th style={{ padding: "10px 12px" }}>Role</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                    <th style={{ padding: "10px 12px" }}>Approval Info</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {app.admins.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "16px", textAlign: "center", color: "var(--stone-400)" }}>
                        No administrator accounts found.
                      </td>
                    </tr>
                  ) : (
                    app.admins.map(admin => (
                      <tr key={admin.id} style={{ borderBottom: "1px solid var(--stone-100)" }}>
                        <td style={{ padding: "12px" }}>
                          <strong style={{ color: "var(--stone-800)" }}>{admin.fullName}</strong>
                          <div style={{ fontSize: "12px", color: "var(--stone-400)" }}>{admin.email}</div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ fontSize: "12px", textTransform: "capitalize", color: "var(--stone-600)" }}>
                            {admin.role.replace("_", " ")}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          {admin.status === "approved" && (
                            <span className="badge badge-green">
                              <Check className="h-3 w-3" /> Approved
                            </span>
                          )}
                          {admin.status === "pending" && (
                            <span className="badge badge-amber">
                              <AlertCircle className="h-3 w-3" /> Pending Approval
                            </span>
                          )}
                          {admin.status === "rejected" && (
                            <span className="badge badge-red">
                              Rejected
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px", fontSize: "12px", color: "var(--stone-500)" }}>
                          {admin.approvedBy ? `Approved by ${admin.approvedBy}` : "Awaiting review"}
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          {admin.status === "pending" ? (
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                className="btn btn-primary"
                                style={{ padding: "5px 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                onClick={() => handleApprove(admin.id, admin.email)}
                              >
                                <UserCheck className="h-3.5 w-3.5" /> Approve
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: "5px 10px", fontSize: "12px", color: "#dc2626", borderColor: "#fecaca" }}
                                onClick={() => handleReject(admin.id, admin.email)}
                              >
                                <UserX className="h-3.5 w-3.5" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "12px", color: "var(--stone-400)" }}>Active</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Database Connectivity Card */}
          <section className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="settings-heading">
              <div className="icon-tile sage">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2>Backend & Database Status</h2>
                <p>PostgreSQL Cloud Database powered by Supabase</p>
              </div>
            </div>
            <div className="divider" />

            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
              <div style={{ flex: 1, minWidth: "240px", background: "var(--stone-50)", padding: "16px", borderRadius: "10px", border: "1px solid var(--stone-200)" }}>
                <span style={{ fontSize: "12px", color: "var(--stone-500)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Backend Mode</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: app.isLiveBackend ? "#22c55e" : "#f59e0b",
                    }}
                  />
                  <strong style={{ fontSize: "15px", color: "var(--stone-800)" }}>
                    {app.isLiveBackend ? "Connected to Supabase (Cloud Live)" : "Local Storage Mode (Pending Cloud Connection)"}
                  </strong>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: "240px", background: "var(--stone-50)", padding: "16px", borderRadius: "10px", border: "1px solid var(--stone-200)" }}>
                <span style={{ fontSize: "12px", color: "var(--stone-500)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Supabase Configuration</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  {configured ? (
                    <span className="badge badge-green"><Check className="h-3 w-3" /> Credentials Set</span>
                  ) : (
                    <span className="badge badge-amber"><AlertCircle className="h-3 w-3" /> Needs Configuration</span>
                  )}
                </div>
              </div>
            </div>

            {testResult && (
              <div
                style={{
                  background: testResult.success ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${testResult.success ? "#bbf7d0" : "#fecaca"}`,
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: testResult.success ? "#16a34a" : "#dc2626",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                {testResult.success ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
                <div>{testResult.message}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                onClick={testSupabaseConnection}
                disabled={testing}
              >
                {testing ? <><span className="spinner" /> Testing Connection…</> : <><RefreshCw className="h-4 w-4" /> Test Supabase Connection</>}
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText("supabase/schema.sql");
                  toast("Path copied: supabase/schema.sql");
                }}
              >
                <Copy className="h-4 w-4" /> Copy SQL Schema Path
              </button>
            </div>
          </section>

          {/* Workspace Preferences */}
          <section className="card">
            <div className="settings-heading">
              <div className="icon-tile blush">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h2>Workspace preferences</h2>
                <p>These settings apply to your current session.</p>
              </div>
            </div>
            <div className="divider" />
            <div className="preference-row">
              <div>
                <strong>Currency display</strong>
                <p>Indian Rupee with en-IN number formatting</p>
              </div>
              <span className="badge badge-green"><Check className="h-3 w-3" /> INR ₹</span>
            </div>
            <div className="preference-row">
              <div>
                <strong>Time zone</strong>
                <p>Dates and activity timestamps use India Standard Time</p>
              </div>
              <span className="badge badge-blue">Asia/Kolkata</span>
            </div>
            <label className="toggle-row">
              <span>
                <strong>Compact tables</strong>
                <small>Use tighter rows when reviewing larger datasets.</small>
              </span>
              <input type="checkbox" checked={compact} onChange={e => setCompact(e.target.checked)} />
            </label>
            <label className="toggle-row">
              <span>
                <strong>Show paise</strong>
                <small>Display decimal paise in financial amounts where available.</small>
              </span>
              <input type="checkbox" checked={showCents} onChange={e => setShowCents(e.target.checked)} />
            </label>
            <button className="btn btn-primary" onClick={savePreferences}>
              {saved ? <><Check className="h-4 w-4" /> Saved</> : "Save preferences"}
            </button>
          </section>

          {/* About Home */}
          <section className="card settings-about">
            <div className="settings-heading">
              <div className="icon-tile sage">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2>About Home</h2>
                <p>Calm, focused workspace for hostel operations.</p>
              </div>
            </div>
            <div className="divider" />
            <InfoRow label="App name" value="Home Manager" />
            <InfoRow label="Access Mode" value="Authenticated Admin Portal" />
            <InfoRow label="Account Security" value="Strict Admin Approval Enforced" />
            <InfoRow label="Database Engine" value="Supabase PostgreSQL" />
            <InfoRow label="Current User" value={app.currentUser?.email || "Not signed in"} />
          </section>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
