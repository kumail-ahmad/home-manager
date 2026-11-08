"use client";

import { useState } from "react";
import { Plus, Zap, CreditCard } from "lucide-react";
import { useApp, formatRupee, formatDate, currentMonthLabel } from "@/lib/AppContext";
import { useToast } from "@/components/ToastProvider";
import Dialog from "@/components/Dialog";
import PaymentDialog from "@/components/PaymentDialog";
import type { PaymentFormData } from "@/components/PaymentDialog";

function AddBillDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const app  = useApp();
  const { toast } = useToast();
  const activeResidents = app.residents.filter(r => r.status === "active");

  const [periodLabel, setPeriodLabel] = useState(currentMonthLabel());
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().slice(0, 7) + "-01");
  const [periodEnd,   setPeriodEnd]   = useState(new Date().toISOString().slice(0, 10));
  const [totalStr,    setTotalStr]    = useState("");
  const [dueDate,     setDueDate]     = useState("");
  const [method,      setMethod]      = useState<"individual" | "shared">("shared");
  const [selected,    setSelected]    = useState<string[]>(activeResidents.map(r => r.id));
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [saving,      setSaving]      = useState(false);

  const toggleResident = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const totalPaise = totalStr && Number.isFinite(Number(totalStr)) ? Math.round(Number(totalStr) * 100) : 0;
  const perHead = selected.length > 0 ? Math.floor(totalPaise / selected.length) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!totalStr || isNaN(Number(totalStr)) || Number(totalStr) <= 0) errs.total = "Enter a valid total amount";
    if (selected.length === 0) errs.residents = "Select at least one resident";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    const remainder = totalPaise - perHead * selected.length;
    const allocations = selected.map((id, index) => ({ residentId: id, sharePaise: perHead + (index < remainder ? 1 : 0) }));
    try {
      app.addElectricityBill(
        { periodLabel, periodStart, periodEnd, totalAmountPaise: totalPaise, allocationMethod: method, residentIds: selected, dueDate: dueDate || new Date().toISOString().slice(0, 10) },
        allocations
      );
      toast(`Electricity bill created: ${formatRupee(totalPaise)} for ${selected.length} resident(s).`);
    } catch (error) { toast(error instanceof Error ? error.message : "Could not create electricity bill.", "error"); setSaving(false); return; }
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Create Electricity Bill" size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="elec-bill-form" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner" />Saving…</> : "Create Bill"}
          </button>
        </>
      }
    >
      <form id="elec-bill-form" onSubmit={handleSubmit} noValidate className="space-y-3">
        <div className="form-group">
          <label className="form-label">Period Label</label>
          <input className="form-input" value={periodLabel} onChange={e => setPeriodLabel(e.target.value)} placeholder="e.g. October 2026" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="form-group">
            <label className="form-label">Period Start</label>
            <input type="date" className="form-input" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Period End</label>
            <input type="date" className="form-input" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="form-group">
            <label className="form-label">Total Amount (₹) *</label>
            <input type="number" className={`form-input ${errors.total ? "error" : ""}`} value={totalStr} onChange={e => setTotalStr(e.target.value)} placeholder="e.g. 3200" min="1" />
            {errors.total && <span className="form-error">{errors.total}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Allocation Method</label>
            <select className="form-select" value={method} onChange={e => setMethod(e.target.value as "individual"|"shared")}>
              <option value="shared">Equally shared</option>
              <option value="individual">Individual</option>
            </select>
          </div>
        </div>

        <div className="form-group">
           <label className="form-label">Residents to include * {selected.length > 0 && perHead > 0 && `(₹${(perHead/100).toLocaleString("en-IN")} base share)`}</label>
           {selected.length > 0 && totalPaise % selected.length > 0 && <span style={{ fontSize: "11px", color: "var(--stone-400)" }}>Rounding adjustment of {totalPaise % selected.length} paise is added to the first resident shares.</span>}
          {errors.residents && <span className="form-error">{errors.residents}</span>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
            {activeResidents.map(r => (
              <label key={r.id} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", border: `1px solid ${selected.includes(r.id) ? "var(--blush-400)" : "var(--stone-200)"}`, borderRadius: "6px", cursor: "pointer", fontSize: "12px", background: selected.includes(r.id) ? "var(--blush-50)" : "white" }}>
                <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleResident(r.id)} style={{ accentColor: "var(--blush-500)" }} />
                {r.fullName}
              </label>
            ))}
          </div>
        </div>
      </form>
    </Dialog>
  );
}

export default function ElectricityPage() {
  const app = useApp();
  const { toast } = useToast();
  const [showBill,    setShowBill]    = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [payResidentId, setPayResidentId] = useState<string | undefined>();

  const totalBilled = app.electricityAllocations.reduce((s, a) => s + a.sharePaise, 0);
  const totalPaid   = app.electricityPayments.reduce((s, p) => s + p.amountPaise, 0);
  const outstanding = Math.max(0, totalBilled - totalPaid);

  const handlePayment = (data: PaymentFormData) => {
    const paise = Math.round(Number(data.amountStr) * 100);
    const alloc = app.electricityAllocations.find(a => a.residentId === data.residentId);
    app.addElectricityPayment({
      allocationId: alloc?.id ?? "",
      residentId: data.residentId,
      amountPaise: paise,
      paymentDate: new Date(data.paymentDate).toISOString(),
      method: data.method, reference: data.reference, notes: data.notes,
    });
    toast(`Electricity payment of ${formatRupee(paise)} recorded.`);
    setShowPayment(false);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Electricity Management</h1>
          <p className="page-desc">Bills, meter readings, allocations, and payments</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowPayment(true)}>
            <CreditCard className="h-3.5 w-3.5" /> Record Payment
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowBill(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Bill
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="grid-cards grid-stats mb-6">
          {[
            { label: "Total Billed",  value: formatRupee(totalBilled), color: "#f59e0b" },
            { label: "Collected",     value: formatRupee(totalPaid),   color: "var(--sage-500)" },
            { label: "Outstanding",   value: formatRupee(outstanding), color: "#ef4444" },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <span className="stat-label">{s.label}</span>
              <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Bills table */}
        <div className="card mb-4">
          <div className="card-header">
            <h2 style={{ fontSize: "14px", fontWeight: 600 }}>Electricity Bills</h2>
          </div>
          {app.electricityBills.length === 0 ? (
            <div className="empty-state">
              <Zap style={{ width: 32, height: 32 }} />
              <h3>No electricity bills yet</h3>
              <p>Create a bill to start tracking electricity expenses.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: "12px" }} onClick={() => setShowBill(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Bill
              </button>
            </div>
          ) : (
            <div className="overflow-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Period</th><th>Total Amount</th><th>Residents</th><th>Method</th><th>Due</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {app.electricityBills.map(bill => {
                    const allocs = app.electricityAllocations.filter(a => a.billId === bill.id);
                    const paid   = allocs.reduce((s, a) => {
                      return s + app.electricityPayments.filter(p => p.allocationId === a.id).reduce((x, p) => x + p.amountPaise, 0);
                    }, 0);
                    const status = paid >= bill.totalAmountPaise ? "paid" : paid > 0 ? "partial" : "unpaid";
                    return (
                      <tr key={bill.id}>
                        <td style={{ fontWeight: 500 }}>{bill.periodLabel}</td>
                        <td style={{ fontWeight: 600 }}>{formatRupee(bill.totalAmountPaise)}</td>
                        <td>{bill.residentIds.length}</td>
                        <td><span className="badge badge-blue">{bill.allocationMethod === "shared" ? "Equally shared" : "Individual"}</span></td>
                        <td style={{ fontSize: "12px" }}>{formatDate(bill.dueDate)}</td>
                        <td>
                          {status === "paid"    && <span className="badge badge-green">Paid</span>}
                          {status === "partial" && <span className="badge badge-amber">Partial</span>}
                          {status === "unpaid"  && <span className="badge badge-red">Unpaid</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resident-wise allocation table */}
        {app.electricityAllocations.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: "14px", fontWeight: 600 }}>Resident-wise Balances</h2>
            </div>
            <div className="overflow-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Resident</th><th>Billed</th><th>Paid</th><th>Outstanding</th><th></th></tr>
                </thead>
                <tbody>
                  {app.residents.filter(r => r.status === "active").map(r => {
                    const bal = app.getResidentElectricityBalance(r.id);
                    if (bal.totalBilled === 0) return null;
                    return (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 500 }}>{r.fullName}</td>
                        <td>{formatRupee(bal.totalBilled)}</td>
                        <td style={{ color: "var(--sage-600, #537c48)" }}>{formatRupee(bal.totalPaid)}</td>
                        <td style={{ color: bal.outstanding > 0 ? "#dc2626" : "var(--stone-300)", fontWeight: 500 }}>
                          {bal.outstanding > 0 ? formatRupee(bal.outstanding) : "—"}
                        </td>
                        <td>
                          {bal.outstanding > 0 && (
                            <button className="btn btn-sage btn-sm" onClick={() => { setPayResidentId(r.id); setShowPayment(true); }}>Pay</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="card" style={{ marginTop: "16px" }}>
          <div className="card-header"><h2 style={{ fontSize: "14px", fontWeight: 600 }}>Meter Readings</h2></div>
          {app.meterReadings.length === 0 ? <div className="empty-state" style={{ padding: "24px" }}><p>No meter readings logged yet.</p></div> : <div className="overflow-table-wrap"><table className="data-table"><thead><tr><th>Room</th><th>Reading date</th><th>Units (kWh)</th><th>Notes</th></tr></thead><tbody>{app.meterReadings.map(reading => <tr key={reading.id}><td>Room {reading.roomNumber}</td><td>{formatDate(reading.readingDate)}</td><td>{reading.units.toLocaleString("en-IN")}</td><td>{reading.notes || "—"}</td></tr>)}</tbody></table></div>}
        </div>
      </div>

      <AddBillDialog open={showBill} onClose={() => setShowBill(false)} />
      <PaymentDialog
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSave={handlePayment}
        residents={app.residents}
        defaultResidentId={payResidentId}
        defaultCategory="electricity"
      />
    </>
  );
}
