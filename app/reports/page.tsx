"use client";

import { useState } from "react";
import { useApp, formatRupee, exportCSV, currentMonthKey } from "@/lib/AppContext";
import { useToast } from "@/components/ToastProvider";
import { Download, BarChart2 } from "lucide-react";

export default function ReportsPage() {
  const app = useApp();
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonthKey());

  const activeResidents = app.residents.filter(r => r.status === "active");

  const exportResidents = () => {
    exportCSV(
      "home-residents.csv",
      ["Name", "Phone", "Guardian", "Guardian Phone", "Room", "College", "Course", "Monthly Rent", "Joining Date", "Status"],
      app.residents.map(r => [
        r.fullName, r.phone, r.guardianName, r.guardianPhone,
        r.roomNumber ?? "", r.college, r.course,
        String(r.monthlyRent / 100), r.joiningDate, r.status,
      ])
    );
    toast("Residents CSV downloaded.");
  };

  const exportRentPayments = () => {
    exportCSV(
      "home-rent-payments.csv",
      ["Resident", "Amount (₹)", "Payment Date", "Method", "Reference", "Notes"],
      app.rentPayments.map(p => {
        const r = app.residents.find(res => res.id === p.residentId);
        return [
          r?.fullName ?? "—", String(p.amountPaise / 100),
          p.paymentDate.slice(0, 10), p.method, p.reference, p.notes,
        ];
      })
    );
    toast("Rent payments CSV downloaded.");
  };

  const exportElectricityPayments = () => {
    exportCSV(
      "home-electricity-payments.csv",
      ["Resident", "Amount (₹)", "Payment Date", "Method", "Reference", "Notes"],
      app.electricityPayments.map(p => {
        const r = app.residents.find(res => res.id === p.residentId);
        return [
          r?.fullName ?? "—", String(p.amountPaise / 100),
          p.paymentDate.slice(0, 10), p.method, p.reference, p.notes,
        ];
      })
    );
    toast("Electricity payments CSV downloaded.");
  };

  const exportBalanceSummary = () => {
    exportCSV(
      "home-balance-summary.csv",
      ["Resident", "Room", "Monthly Rent", "Rent Charged", "Rent Paid", "Rent Outstanding", "Elec Billed", "Elec Paid", "Elec Outstanding"],
      activeResidents.map(r => {
        const rb = app.getResidentRentBalance(r.id);
        const eb = app.getResidentElectricityBalance(r.id);
        return [
          r.fullName, r.roomNumber ?? "—",
          String(r.monthlyRent / 100),
          String(rb.totalCharged / 100), String(rb.totalPaid / 100), String(rb.outstanding / 100),
          String(eb.totalBilled / 100), String(eb.totalPaid / 100), String(eb.outstanding / 100),
        ];
      })
    );
    toast("Balance summary CSV downloaded.");
  };

  const exportMonthlySummary = () => {
    const summary = app.getDashboardStatsForMonth(month);
    exportCSV(`home-monthly-summary-${month}.csv`, ["Month", "Rent charged", "Rent collected", "Rent outstanding", "Electricity billed", "Electricity collected", "Electricity outstanding"], [[month, String(summary.rentCharged / 100), String(summary.rentCollected / 100), String(summary.rentOutstanding / 100), String(summary.elecBilled / 100), String(summary.elecCollected / 100), String(summary.elecOutstanding / 100)]]);
    toast("Monthly summary CSV downloaded.");
  };

  const exportOccupancy = () => {
    exportCSV("home-room-occupancy.csv", ["Room", "Capacity", "Occupied", "Available", "Residents"], app.rooms.map(room => [room.roomNumber, String(room.capacity), String(room.residentIds.length), String(room.capacity - room.residentIds.length), room.residentIds.map(id => app.residents.find(r => r.id === id)?.fullName ?? "").join("; ")]));
    toast("Room occupancy CSV downloaded.");
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Exports</h1>
          <p className="page-desc">Monthly summaries, resident balances, and CSV exports</p>
        </div>
      </div>

      <div className="page-body">
        {/* Summary stats */}
        <div className="grid-cards grid-stats mb-6">
          {[
            { label: "Active Residents", value: activeResidents.length, color: "var(--blush-500)" },
            { label: "Rent Outstanding", value: formatRupee(app.dashboardStats.rentOutstanding), color: "#dc2626" },
            { label: "Elec Outstanding", value: formatRupee(app.dashboardStats.elecOutstanding), color: "#f59e0b" },
            { label: "Total Collected",  value: formatRupee(app.dashboardStats.rentCollected + app.dashboardStats.elecCollected), color: "var(--sage-500)" },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <span className="stat-label">{s.label}</span>
              <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Exports */}
         <div className="card mb-6">
           <div className="card-header"><h2 style={{ fontSize: "14px", fontWeight: 600 }}>CSV Exports</h2></div>
           <div className="filter-bar" style={{ marginBottom: "12px" }}><label className="form-label" htmlFor="report-month">Summary month</label><input id="report-month" type="month" className="form-input" style={{ width: "auto" }} value={month} onChange={e => setMonth(e.target.value)} /></div>
           <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {[
              { label: "Resident List",       fn: exportResidents },
              { label: "Rent Payments",        fn: exportRentPayments },
              { label: "Electricity Payments", fn: exportElectricityPayments },
              { label: "Balance Summary",      fn: exportBalanceSummary },
              { label: "Monthly Summary",      fn: exportMonthlySummary },
              { label: "Room Occupancy",       fn: exportOccupancy },
            ].map(e => (
              <button key={e.label} className="btn btn-secondary" onClick={e.fn}>
                <Download className="h-3.5 w-3.5" /> {e.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: "11px", color: "var(--stone-500)", marginTop: "10px" }}>
            Generated reports can be opened in Microsoft Excel, Google Sheets, or any accounting software.
          </p>
        </div>

        {/* Resident balance table */}
        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: "14px", fontWeight: 600 }}>Resident-wise Balance Summary</h2></div>
          {activeResidents.length === 0 ? (
            <div className="empty-state">
              <BarChart2 style={{ width: 32, height: 32 }} />
              <h3>No residents yet</h3>
              <p>Add residents to see their balance summary.</p>
            </div>
          ) : (
            <div className="overflow-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Resident</th><th>Room</th><th>Rent/mo</th><th>Rent Due</th><th>Rent Advance</th><th>Elec Due</th><th>Total Due</th></tr>
                </thead>
                <tbody>
                  {activeResidents.map(r => {
                    const rb = app.getResidentRentBalance(r.id);
                    const eb = app.getResidentElectricityBalance(r.id);
                    const totalDue = rb.outstanding + eb.outstanding;
                    return (
                      <tr key={r.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div className="avatar" style={{ width: 28, height: 28, fontSize: "11px" }}>
                              {r.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <span style={{ fontWeight: 500 }}>{r.fullName}</span>
                          </div>
                        </td>
                        <td>{r.roomNumber ? `Room ${r.roomNumber}` : "—"}</td>
                        <td>{formatRupee(r.monthlyRent)}</td>
                        <td style={{ color: rb.outstanding > 0 ? "#dc2626" : "var(--stone-300)", fontWeight: 500 }}>
                          {rb.outstanding > 0 ? formatRupee(rb.outstanding) : "—"}
                        </td>
                        <td style={{ color: rb.advance > 0 ? "#16a34a" : "var(--stone-300)", fontWeight: 500 }}>
                          {rb.advance > 0 ? formatRupee(rb.advance) : "—"}
                        </td>
                        <td style={{ color: eb.outstanding > 0 ? "#f59e0b" : "var(--stone-300)", fontWeight: 500 }}>
                          {eb.outstanding > 0 ? formatRupee(eb.outstanding) : "—"}
                        </td>
                        <td>
                          {totalDue > 0
                            ? <span className="badge badge-red">{formatRupee(totalDue)}</span>
                            : <span className="badge badge-green">Settled</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
