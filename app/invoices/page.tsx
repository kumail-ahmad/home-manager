"use client";

import { useState, useMemo } from "react";
import { FileText, Printer } from "lucide-react";
import { useApp, formatRupee, formatDate } from "@/lib/AppContext";

export default function InvoicesPage() {
  const app = useApp();
  const [residentId, setResidentId] = useState("");
  const [month,      setMonth]      = useState(new Date().toISOString().slice(0, 7));
  const [preview,    setPreview]    = useState(false);

  const resident    = app.residents.find(r => r.id === residentId);
  const rentCharges = app.rentCharges.filter(c => c.residentId === residentId && c.month === month);
  const rentChargeIds = new Set(rentCharges.map(c => c.id));
  const rentPaid    = app.rentPayments.filter(p => !p.voidedAt && p.residentId === residentId && (p.billingPeriod === month || (p.chargeId !== null && rentChargeIds.has(p.chargeId)))).reduce((s, p) => s + p.amountPaise, 0);
  const rentCharged = rentCharges.reduce((s, c) => s + c.amountPaise, 0);
  const monthBills = app.electricityBills.filter(b => b.periodStart.startsWith(month));
  const monthBillIds = new Set(monthBills.map(b => b.id));
  const elecAllocs  = app.electricityAllocations.filter(a => a.residentId === residentId && monthBillIds.has(a.billId));
  const elecAllocationIds = new Set(elecAllocs.map(a => a.id));
  const elecBilled  = elecAllocs.reduce((s, a) => s + a.sharePaise, 0);
  const elecPaid    = app.electricityPayments.filter(p => !p.voidedAt && elecAllocationIds.has(p.allocationId)).reduce((s, p) => s + p.amountPaise, 0);
  const previousRent = app.rentCharges.filter(c => c.residentId === residentId && c.month < month).reduce((s, c) => s + c.amountPaise, 0);
  const previousRentPaid = app.rentPayments.filter(p => !p.voidedAt && p.residentId === residentId && p.billingPeriod < month).reduce((s, p) => s + p.amountPaise, 0);
  const previousElec = app.electricityAllocations.filter(a => a.residentId === residentId && (app.electricityBills.find(b => b.id === a.billId)?.periodStart?.slice(0, 7) ?? "") < month).reduce((s, a) => s + a.sharePaise, 0);
  const previousElecIds = new Set(app.electricityAllocations.filter(a => a.residentId === residentId && (app.electricityBills.find(b => b.id === a.billId)?.periodStart?.slice(0, 7) ?? "") < month).map(a => a.id));
  const previousElecPaid = app.electricityPayments.filter(p => !p.voidedAt && previousElecIds.has(p.allocationId)).reduce((s, p) => s + p.amountPaise, 0);
  const previousBalance = Math.max(0, previousRent + previousElec - previousRentPaid - previousElecPaid);
  const totalDue    = Math.max(0, previousBalance + rentCharged + elecBilled - rentPaid - elecPaid);

  const activeResidents = app.residents.filter(r => r.status === "active");

  const months = useMemo(() => {
    const set = new Set<string>();
    app.rentCharges.forEach(c => set.add(c.month));
    set.add(new Date().toISOString().slice(0, 7));
    return [...set].sort().reverse();
  }, [app.rentCharges]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-desc">Generate and preview resident invoices</p>
        </div>
        {preview && resident && (
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print Invoice
          </button>
        )}
      </div>

      <div className="page-body">
        {/* Selector */}
        <div className="card mb-4">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px", alignItems: "flex-end" }}>
            <div className="form-group">
              <label className="form-label">Resident</label>
              <select className="form-select" value={residentId} onChange={e => { setResidentId(e.target.value); setPreview(false); }}>
                <option value="">— Select resident —</option>
                {activeResidents.map(r => <option key={r.id} value={r.id}>{r.fullName}{r.roomNumber ? ` (Room ${r.roomNumber})` : ""}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Billing Period</label>
              <select className="form-select" value={month} onChange={e => { setMonth(e.target.value); setPreview(false); }}>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={() => setPreview(true)} disabled={!residentId}>
              <FileText className="h-4 w-4" /> Preview Invoice
            </button>
          </div>
        </div>

        {/* Invoice preview */}
        {preview && resident ? (
          <div className="card" style={{ maxWidth: "680px", margin: "0 auto" }} id="invoice-print">
            <div style={{ borderBottom: "2px solid var(--blush-200)", paddingBottom: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--blush-600)" }}>🌸 Home</h2>
                  <p style={{ fontSize: "12px", color: "var(--stone-400)" }}>Private Girls&apos; Hostel</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600 }}>INVOICE</p>
                  <p style={{ fontSize: "12px", color: "var(--stone-400)" }}>Period: {month}</p>
                  <p style={{ fontSize: "12px", color: "var(--stone-400)" }}>Date: {formatDate(new Date().toISOString())}</p>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--stone-400)", marginBottom: "6px" }}>Bill To</p>
                <p style={{ fontWeight: 600, fontSize: "15px" }}>{resident.fullName}</p>
                <p style={{ fontSize: "12px", color: "var(--stone-500)" }}>{resident.phone}</p>
                {resident.roomNumber && <p style={{ fontSize: "12px", color: "var(--stone-500)" }}>Room {resident.roomNumber}</p>}
                {resident.college && <p style={{ fontSize: "12px", color: "var(--stone-500)" }}>{resident.college}</p>}
              </div>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--stone-400)", marginBottom: "6px" }}>Guardian</p>
                <p style={{ fontSize: "13px" }}>{resident.guardianName || "—"}</p>
                <p style={{ fontSize: "12px", color: "var(--stone-500)" }}>{resident.guardianPhone || ""}</p>
              </div>
            </div>

            <table className="data-table" style={{ marginBottom: "16px" }}>
              <thead>
                <tr><th>Description</th><th style={{ textAlign: "right" }}>Amount</th></tr>
              </thead>
              <tbody>
                {rentCharged > 0 && (
                  <tr>
                    <td>Monthly Rent — {month}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{formatRupee(rentCharged)}</td>
                  </tr>
                )}
                {elecBilled > 0 && (
                  <tr>
                    <td>Electricity Charges — {month}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{formatRupee(elecBilled)}</td>
                  </tr>
                )}
                {rentCharged === 0 && elecBilled === 0 && (
                  <tr><td colSpan={2} style={{ textAlign: "center", color: "var(--stone-300)" }}>No charges for this period</td></tr>
                )}
              </tbody>
            </table>

            <div style={{ borderTop: "1px solid var(--stone-200)", paddingTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", color: "var(--stone-500)" }}>Previous balance</span>
                <span style={{ fontWeight: 600 }}>{formatRupee(previousBalance)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", color: "var(--stone-500)" }}>Total Charged</span>
                <span style={{ fontWeight: 600 }}>{formatRupee(rentCharged + elecBilled)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", color: "var(--stone-500)" }}>Payments applied this period</span>
                <span style={{ fontWeight: 600, color: "var(--sage-600, #537c48)" }}>− {formatRupee(rentPaid + elecPaid)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: "2px solid var(--stone-200)" }}>
                <span style={{ fontWeight: 700, fontSize: "16px" }}>Amount Due</span>
                <span style={{ fontWeight: 700, fontSize: "18px", color: totalDue > 0 ? "#dc2626" : "var(--sage-600, #537c48)" }}>
                  {totalDue > 0 ? formatRupee(totalDue) : "Fully Paid ✓"}
                </span>
              </div>
            </div>

            <p style={{ marginTop: "20px", fontSize: "11px", color: "var(--stone-400)", textAlign: "center" }}>
              Official invoice generated by Home Management System. Contact administration for inquiries.
            </p>
          </div>
        ) : !preview && residentId ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--stone-400)" }}>Click &quot;Preview Invoice&quot; to generate.</div>
        ) : !residentId ? (
          <div className="card"><div className="empty-state">
            <FileText style={{ width: 36, height: 36 }} />
            <h3>Select a resident</h3>
            <p>Choose a resident and billing period to preview their invoice.</p>
          </div></div>
        ) : null}
      </div>

      <style>{`@media print { .page-header, .sidebar, #main-content > div:first-child { display: none !important; } #invoice-print { box-shadow: none !important; border: none !important; } }`}</style>
    </>
  );
}
