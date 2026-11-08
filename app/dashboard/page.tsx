"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Users, BedDouble, CreditCard, AlertCircle, Zap,
  TrendingUp, Plus, ClipboardList, RefreshCw
} from "lucide-react";
import { useApp, formatRupee, formatDateTime, currentMonthKey, rupeeToInt } from "@/lib/AppContext";
import ResidentFormDialog from "@/components/ResidentFormDialog";
import PaymentDialog from "@/components/PaymentDialog";
import MeterReadingDialog from "@/components/MeterReadingDialog";
import { useToast } from "@/components/ToastProvider";
import type { ResidentFormData } from "@/components/ResidentFormDialog";
import type { PaymentFormData } from "@/components/PaymentDialog";

export default function DashboardPage() {
  const app = useApp();
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonthKey());
  const s = app.getDashboardStatsForMonth(month);
  const monthOptions = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const date = new Date(`${currentMonthKey()}-01T12:00:00`);
    date.setMonth(date.getMonth() - index);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }), []);

  const [showAddResident, setShowAddResident] = useState(false);
  const [showPayment, setShowPayment]         = useState(false);
  const [showMeter, setShowMeter]             = useState(false);

  const handleAddResident = (data: ResidentFormData) => {
    app.addResident({
      fullName: data.fullName,
      phone: data.phone.replace(/\s/g, ""),
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      roomNumber: data.roomNumber || null,
      college: data.college,
      course: data.course,
      monthlyRent: Math.round(Number(data.monthlyRent) * 100),
      joiningDate: data.joiningDate,
      status: data.status,
      notes: data.notes,
    });
    toast(`${data.fullName} added as a new resident.`);
    setShowAddResident(false);
  };

  const handlePayment = (data: PaymentFormData) => {
    const paise = rupeeToInt(data.amountStr);
    if (data.category === "rent") {
      app.addRentPayment({
        residentId: data.residentId,
        chargeId: null,
        billingPeriod: data.billingPeriod,
        amountPaise: paise,
        paymentDate: new Date(data.paymentDate).toISOString(),
        method: data.method,
        reference: data.reference,
        notes: data.notes,
      });
    } else {
      // Electricity payment — link to first unpaid allocation if any
      const alloc = app.electricityAllocations.find(a => a.residentId === data.residentId);
      app.addElectricityPayment({
        allocationId: alloc?.id ?? "",
        residentId: data.residentId,
        amountPaise: paise,
        paymentDate: new Date(data.paymentDate).toISOString(),
        method: data.method,
        reference: data.reference,
        notes: data.notes,
      });
    }
    toast(`Payment of ${formatRupee(paise)} recorded.`);
    setShowPayment(false);
  };

  const statCards = [
    {
      label: "Active Residents",
      value: s.activeResidents,
      sub: `of ~25 capacity`,
      icon: Users,
      color: "var(--blush-500)",
      bg: "var(--blush-50)",
    },
    {
      label: "Occupied Beds",
      value: `${s.occupiedBeds} / ${s.totalBeds}`,
      sub: `${s.availableBeds} bed${s.availableBeds !== 1 ? "s" : ""} available`,
      icon: BedDouble,
      color: "var(--sage-500)",
      bg: "var(--sage-50)",
    },
    {
      label: "Rent Collected",
      value: formatRupee(s.rentCollected),
      sub: `Outstanding: ${formatRupee(s.rentOutstanding)}`,
      icon: CreditCard,
      color: "#3b82f6",
      bg: "#eff6ff",
    },
    {
      label: "Electricity Collected",
      value: formatRupee(s.elecCollected),
      sub: `Outstanding: ${formatRupee(s.elecOutstanding)}`,
      icon: Zap,
      color: "#f59e0b",
      bg: "#fffbeb",
    },
  ];

  const recentActivity = app.activityLog.slice(0, 8);

  return (
    <>
      {/* Page header */}
      <div className="page-header relative z-10">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-desc">{month} · Home Operations &amp; Financial Overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <label className="sr-only" htmlFor="dashboard-month">Dashboard month</label>
          <select id="dashboard-month" className="form-select w-full sm:w-auto" value={month} onChange={e => setMonth(e.target.value)}>
            {monthOptions.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm flex-1 sm:flex-none justify-center" onClick={() => setShowMeter(true)}>
            <Zap className="h-3.5 w-3.5" /> Log Meter Reading
          </button>
          <button className="btn btn-secondary btn-sm flex-1 sm:flex-none justify-center" onClick={() => setShowPayment(true)}>
            <CreditCard className="h-3.5 w-3.5" /> Record Payment
          </button>
          <button className="btn btn-primary btn-sm w-full sm:w-auto justify-center" onClick={() => setShowAddResident(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Resident
          </button>
        </div>
      </div>

      <div className="page-body relative z-10" style={{ flexGrow: 1 }}>

        {/* Ambient Floral Watermark Background */}
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.06] bg-repeat"
          style={{
            backgroundImage: "url('/dashboard-flower-bg.png')",
            backgroundSize: "680px auto",
            backgroundPosition: "top right",
          }}
          aria-hidden="true"
        />

        {/* Welcome Hero Banner with Decorative Floral Artwork */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#fdf4f4] via-[#faf8f5] to-[#f2f6ef] border border-[#f8d0ce] p-5 sm:p-6 mb-6 shadow-xs">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-[var(--blush-600)] border border-[var(--blush-200)] mb-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[var(--blush-500)] animate-pulse" />
              Home Management Live
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--stone-800)]">
              Welcome back, {app.currentUser?.fullName || "Administrator"}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--stone-500)] mt-1.5 leading-relaxed">
              Real-time room occupancy, rent collections, and electricity allocations synchronized across all devices.
            </p>
          </div>
          <div
            className="absolute right-[-10px] top-[-10px] bottom-[-10px] w-48 sm:w-80 pointer-events-none opacity-25 sm:opacity-35 bg-no-repeat bg-contain bg-right-center"
            style={{ backgroundImage: "url('/dashboard-flower-bg.png')" }}
            aria-hidden="true"
          />
        </div>

        {/* Primary Stat cards: Straight line on mobile (grid-cols-1), responsive grid on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
          {statCards.map(c => (
            <div key={c.label} className="stat-card w-full" style={{ borderTop: `3px solid ${c.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="stat-label">{c.label}</span>
                <div style={{ background: c.bg, borderRadius: "8px", padding: "6px" }}>
                  <c.icon className="h-4 w-4" style={{ color: c.color }} />
                </div>
              </div>
              <div className="stat-value">{c.value}</div>
              <div className="stat-sub">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Secondary stats row: Straight line on mobile, 3 columns on tablet/desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
          {[
            { label: "Total Rent Charged", value: formatRupee(s.rentCharged), icon: TrendingUp, color: "#3b82f6" },
            { label: "Total Electricity Billed", value: formatRupee(s.elecBilled), icon: Zap, color: "#f59e0b" },
            { label: "Total Outstanding", value: formatRupee(s.rentOutstanding + s.elecOutstanding), icon: AlertCircle, color: "#ef4444" },
          ].map(c => (
            <div key={c.label} className="card w-full" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: `${c.color}18`, borderRadius: "8px", padding: "9px" }}>
                <c.icon className="h-4 w-4" style={{ color: c.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="stat-label truncate">{c.label}</p>
                <p style={{ fontWeight: 700, fontSize: "16px", color: "var(--stone-800)" }}>{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Lower section: activity + quick actions: Stacks in straight cards one by one on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">

          {/* Recent activity */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <ClipboardList className="h-4 w-4" style={{ color: "var(--stone-400)" }} />
                <h2 style={{ fontSize: "14px", fontWeight: 600 }}>Recent Activity</h2>
              </div>
              <Link href="/activity" className="btn btn-ghost btn-sm" style={{ fontSize: "12px" }}>View all</Link>
            </div>

            {recentActivity.length === 0 ? (
              <div className="empty-state" style={{ padding: "32px" }}>
                <ClipboardList style={{ width: 32, height: 32 }} />
                <h3>No activity yet</h3>
                <p>Actions you take will appear here in real time.</p>
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {recentActivity.map((a, i) => (
                  <li key={a.id} style={{
                    display: "flex", alignItems: "flex-start", gap: "10px",
                    padding: "10px 0",
                    borderBottom: i < recentActivity.length - 1 ? "1px solid var(--stone-100)" : "none",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "8px",
                      background: "var(--blush-50)", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontSize: "11px", color: "var(--blush-500)", fontWeight: 700,
                    }}>
                      {a.action.slice(0, 1)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--stone-700)" }}>
                        <span style={{ color: "var(--blush-600)" }}>{a.action}</span> · {a.entityLabel}
                      </p>
                      {a.details && <p style={{ fontSize: "12px", color: "var(--stone-400)" }}>{a.details}</p>}
                      <p style={{ fontSize: "11px", color: "var(--stone-300)", marginTop: "2px" }}>{formatDateTime(a.timestamp)} IST</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: "14px", fontWeight: 600 }}>Quick Actions</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { label: "+ Add Resident",    fn: () => setShowAddResident(true), cls: "btn-primary" },
                  { label: "₹ Record Payment",  fn: () => setShowPayment(true),     cls: "btn-sage" },
                  { label: "⚡ Log Meter Reading", fn: () => setShowMeter(true),     cls: "btn-secondary" },
                ].map(a => (
                  <button key={a.label} className={`btn ${a.cls}`} style={{ justifyContent: "flex-start" }} onClick={a.fn}>
                    {a.label}
                  </button>
                ))}
                <div className="divider" />
                <Link href="/residents" className="btn btn-ghost" style={{ justifyContent: "flex-start", fontSize: "13px" }}>
                  → View Residents
                </Link>
                <Link href="/rent" className="btn btn-ghost" style={{ justifyContent: "flex-start", fontSize: "13px" }}>
                  → Rent Management
                </Link>
                <Link href="/reports" className="btn btn-ghost" style={{ justifyContent: "flex-start", fontSize: "13px" }}>
                  → Reports & Exports
                </Link>
              </div>
            </div>

            {/* Generate charges card */}
            <div className="card" style={{ background: "var(--blush-50)", border: "1px solid var(--blush-200)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <RefreshCw className="h-4 w-4" style={{ color: "var(--blush-500)" }} />
                <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--blush-700, #9f1239)" }}>Monthly Charges</h3>
              </div>
              <p style={{ fontSize: "12px", color: "var(--stone-500)", marginBottom: "10px" }}>
                 Automatically generate rent charges for all active residents for the selected month.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                   const created = app.generateMonthlyRentCharges(month);
                  toast(created.length > 0
                   ? `Generated ${created.length} rent charge(s) for ${month}.`
                    : "All charges for this month are already generated."
                  );
                }}
                disabled={app.residents.filter(r => r.status === "active").length === 0}
              >
                Generate This Month&apos;s Charges
              </button>
            </div>

            {/* Pending dues summary */}
            {(s.rentOutstanding > 0 || s.elecOutstanding > 0) && (
              <div className="card" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <AlertCircle className="h-4 w-4" style={{ color: "#ea580c" }} />
                  <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#9a3412" }}>Pending Dues</h3>
                </div>
                {s.rentOutstanding > 0 && (
                  <p style={{ fontSize: "13px", color: "#9a3412" }}>Rent due: <strong>{formatRupee(s.rentOutstanding)}</strong></p>
                )}
                {s.elecOutstanding > 0 && (
                  <p style={{ fontSize: "13px", color: "#9a3412" }}>Electricity due: <strong>{formatRupee(s.elecOutstanding)}</strong></p>
                )}
                <Link href="/payments" className="btn btn-sm" style={{ marginTop: "8px", background: "#ea580c", color: "white", display: "inline-flex" }}>
                  View Payment History
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ResidentFormDialog
        open={showAddResident}
        onClose={() => setShowAddResident(false)}
        onSave={handleAddResident}
        existingPhones={app.residents.map(r => r.phone)}
      />
      <PaymentDialog
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSave={handlePayment}
        residents={app.residents}
      />
      <MeterReadingDialog
        open={showMeter}
        onClose={() => setShowMeter(false)}
        onSave={(d) => {
          app.addMeterReading(d);
          toast(`Meter reading logged for Room ${d.roomNumber}: ${d.units} units.`);
          setShowMeter(false);
        }}
        rooms={app.rooms}
      />
    </>
  );
}
