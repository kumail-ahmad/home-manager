import Link from "next/link";
import { Flower2, Shield, Users, CreditCard, Zap, BarChart2 } from "lucide-react";

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", justifyContent: "center", alignItems: "center", padding: "24px" }}>
      <div style={{ maxWidth: "520px", width: "100%", textAlign: "center" }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <div style={{ background: "var(--blush-100)", borderRadius: "20px", padding: "16px" }}>
            <Flower2 style={{ width: 36, height: 36, color: "var(--blush-500)" }} />
          </div>
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--stone-800)", marginBottom: "8px" }}>
          Home Manager
        </h1>
        <p style={{ fontSize: "15px", color: "var(--stone-500)", marginBottom: "32px", lineHeight: 1.6 }}>
          Private rent and expense management for Home — residents, rooms, billing, and reports for authorized administrators.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8 text-left">
          {[
            { icon: Users,      label: "Resident Management", desc: "Profiles, guardian details, rooms" },
            { icon: CreditCard, label: "Rent Tracking",       desc: "Charges, payments, balances" },
            { icon: Zap,        label: "Electricity Bills",   desc: "Bills, allocations, meter readings" },
            { icon: BarChart2,  label: "Reports & Exports",   desc: "CSV exports, monthly summaries" },
          ].map(f => (
            <div key={f.label} className="bg-white border border-[var(--stone-200)] rounded-xl p-3.5 shadow-xs">
              <f.icon style={{ width: 18, height: 18, color: "var(--blush-500)", marginBottom: "6px" }} />
              <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--stone-800)" }}>{f.label}</p>
              <p style={{ fontSize: "12px", color: "var(--stone-400)" }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link
            href="/login"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 24px", background: "var(--blush-500)", color: "white", borderRadius: "10px", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}
          >
            <Shield style={{ width: 16, height: 16 }} /> Sign In / Administrator Access
          </Link>
          <Link
            href="/dashboard"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 24px", background: "white", border: "1px solid var(--stone-200)", color: "var(--stone-700)", borderRadius: "10px", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}
          >
            Open Dashboard
          </Link>
        </div>

        <p style={{ marginTop: "20px", fontSize: "12px", color: "var(--stone-400)" }}>
          Full-Stack Enabled · Supabase PostgreSQL Database & Auth Ready
        </p>
      </div>
    </div>
  );
}
