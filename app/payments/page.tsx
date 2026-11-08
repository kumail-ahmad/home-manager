"use client";

import { useState, useMemo } from "react";
import { Receipt, Search, Plus, Filter, ArrowUpDown, RotateCcw } from "lucide-react";
import { useApp, formatRupee, formatDateTime } from "@/lib/AppContext";
import PaymentDialog from "@/components/PaymentDialog";
import Dialog from "@/components/Dialog";
import { useToast } from "@/components/ToastProvider";
import type { PaymentFormData } from "@/components/PaymentDialog";

export default function PaymentsPage() {
  const app = useApp();
  const { toast } = useToast();
  const [showPayment, setShowPayment] = useState(false);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<PaymentRow | null>(null);
  const [correcting, setCorrecting] = useState(false);
  const [correctionReason, setCorrectionReason] = useState("");
  const [filterCat,      setFilterCat]      = useState<"all" | "rent" | "electricity">("all");
  const [filterResident, setFilterResident] = useState("all");
  const [filterMonth,    setFilterMonth]    = useState("all");
  const [filterMethod,   setFilterMethod]   = useState("all");
  const [sortBy,         setSortBy]         = useState<"newest" | "oldest" | "amount-desc" | "amount-asc">("newest");

  const months = useMemo(() => {
    const set = new Set<string>();
    [...app.rentPayments, ...app.electricityPayments].forEach(p => {
      set.add(p.paymentDate.slice(0, 7));
    });
    return ["all", ...([...set].sort().reverse())];
  }, [app.rentPayments, app.electricityPayments]);

  const combined = useMemo(() => {
    const rent = app.rentPayments.map(p => ({
      id: p.id, type: "rent" as const, residentId: p.residentId, amount: p.amountPaise,
       date: p.paymentDate, method: p.method, reference: p.reference, notes: p.notes, voidedAt: p.voidedAt,
    }));
    const elec = app.electricityPayments.map(p => ({
      id: p.id, type: "electricity" as const, residentId: p.residentId, amount: p.amountPaise,
       date: p.paymentDate, method: p.method, reference: p.reference, notes: p.notes, voidedAt: p.voidedAt,
    }));
    return [...rent, ...elec]
      .filter(p => filterCat === "all" || p.type === filterCat)
      .filter(p => filterResident === "all" || p.residentId === filterResident)
      .filter(p => filterMonth === "all" || p.date.startsWith(filterMonth))
      .filter(p => filterMethod === "all" || p.method === filterMethod)
      .filter(p => !search || app.residents.find(r => r.id === p.residentId)?.fullName.toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase()) || (p.notes && p.notes.toLowerCase().includes(search.toLowerCase())))
      .sort((a, b) => {
        if (sortBy === "newest") return b.date.localeCompare(a.date);
        if (sortBy === "oldest") return a.date.localeCompare(b.date);
        if (sortBy === "amount-desc") return b.amount - a.amount;
        if (sortBy === "amount-asc") return a.amount - b.amount;
        return 0;
      });
  }, [app.rentPayments, app.electricityPayments, app.residents, filterCat, filterResident, filterMonth, filterMethod, search, sortBy]);

  const totalShown = combined.filter(p => !p.voidedAt).reduce((s, p) => s + p.amount, 0);
  const hasActiveFilters = search || filterCat !== "all" || filterResident !== "all" || filterMonth !== "all" || filterMethod !== "all" || sortBy !== "newest";

  const methodBadge = (m: string) => {
    const map: Record<string, string> = { cash: "badge-stone", upi: "badge-blue", bank_transfer: "badge-green", cheque: "badge-amber", other: "badge-stone" };
    return map[m] ?? "badge-stone";
  };

  const handlePayment = (data: PaymentFormData) => {
    const amountPaise = Math.round(Number(data.amountStr) * 100);
    if (data.category === "rent") app.addRentPayment({ residentId: data.residentId, chargeId: null, billingPeriod: data.billingPeriod, amountPaise, paymentDate: new Date(data.paymentDate).toISOString(), method: data.method, reference: data.reference, notes: data.notes });
    else {
      const allocation = app.electricityAllocations.find(a => a.residentId === data.residentId);
      app.addElectricityPayment({ allocationId: allocation?.id ?? "", residentId: data.residentId, amountPaise, paymentDate: new Date(data.paymentDate).toISOString(), method: data.method, reference: data.reference, notes: data.notes });
    }
    toast(`${data.category === "rent" ? "Rent" : "Electricity"} payment of ${formatRupee(amountPaise)} recorded.`);
    setShowPayment(false);
  };

  const correctPayment = () => {
    if (!viewing || !correctionReason.trim()) return;
    const changed = viewing.type === "rent" ? app.voidRentPayment(viewing.id, correctionReason.trim()) : app.voidElectricityPayment(viewing.id, correctionReason.trim());
    if (changed) toast("Payment corrected. The original record remains in session history.");
    setCorrecting(false); setCorrectionReason(""); setViewing(null);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment History</h1>
          <p className="page-desc">{combined.length} payment{combined.length !== 1 ? "s" : ""} · {formatRupee(totalShown)} total</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowPayment(true)}><Plus className="h-3.5 w-3.5" /> Record Payment</button>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="card mb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  className="form-input w-full"
                  style={{ paddingLeft: "34px" }}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search resident, notes, reference…"
                  aria-label="Search payments"
                />
              </div>

              <div className="flex gap-1.5 w-full sm:w-auto">
                {(["all", "rent", "electricity"] as const).map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`btn btn-sm flex-1 sm:flex-initial ${filterCat === c ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setFilterCat(c)}
                  >
                    {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center justify-between pt-2.5 border-t border-stone-100 text-xs">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 text-stone-500 font-medium">
                  <Filter className="h-3.5 w-3.5 text-stone-400" />
                  <span>Filters:</span>
                </div>

                <select
                  className="form-select flex-1 sm:w-auto text-xs py-1 px-2.5"
                  value={filterResident}
                  onChange={e => setFilterResident(e.target.value)}
                >
                  <option value="all">All Residents</option>
                  {app.residents.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                </select>

                <select
                  className="form-select flex-1 sm:w-auto text-xs py-1 px-2.5"
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                >
                  {months.map(m => <option key={m} value={m}>{m === "all" ? "All Months" : m}</option>)}
                </select>

                <select
                  className="form-select flex-1 sm:w-auto text-xs py-1 px-2.5"
                  value={filterMethod}
                  onChange={e => setFilterMethod(e.target.value)}
                >
                  <option value="all">All Methods</option>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1.5 text-stone-500 font-medium">
                  <ArrowUpDown className="h-3.5 w-3.5 text-stone-400" />
                  <span>Sort:</span>
                </div>

                <select
                  className="form-select flex-1 sm:w-auto text-xs py-1 px-2.5 font-medium"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                >
                  <option value="newest">Newest Date</option>
                  <option value="oldest">Oldest Date</option>
                  <option value="amount-desc">Highest Amount</option>
                  <option value="amount-asc">Lowest Amount</option>
                </select>

                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm text-xs py-1 px-2.5 text-stone-600 hover:text-stone-900"
                    onClick={() => {
                      setSearch("");
                      setFilterCat("all");
                      setFilterResident("all");
                      setFilterMonth("all");
                      setFilterMethod("all");
                      setSortBy("newest");
                    }}
                  >
                    <RotateCcw className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          {combined.length === 0 ? (
            <div className="empty-state">
              <Receipt style={{ width: 32, height: 32 }} />
              <h3>No payments found</h3>
              <p>Record a rent or electricity payment to see it here.</p>
            </div>
          ) : (
            <div className="overflow-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Resident</th><th>Category</th><th>Amount</th><th>Method</th><th>Reference</th><th>Notes</th></tr>
                </thead>
                <tbody>
                  {combined.map(p => {
                    const resident = app.residents.find(r => r.id === p.residentId);
                    return (
                       <tr key={p.id} onClick={() => setViewing(p)} style={{ cursor: "pointer" }}>
                        <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>{formatDateTime(p.date)}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                            <div className="avatar" style={{ width: 26, height: 26, fontSize: "11px" }}>
                              {resident?.fullName.split(" ").map(n => n[0]).join("").slice(0,2) ?? "?"}
                            </div>
                            <span style={{ fontWeight: 500 }}>{resident?.fullName ?? "—"}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${p.type === "rent" ? "badge-blue" : "badge-amber"}`}>
                            {p.type === "rent" ? "Rent" : "Electricity"}
                          </span>
                        </td>
                         <td style={{ fontWeight: 700, color: "var(--sage-600, #537c48)" }}>{formatRupee(p.amount)} {p.voidedAt && <span className="badge badge-red">Corrected</span>}</td>
                        <td><span className={`badge ${methodBadge(p.method)}`}>{p.method.replace("_", " ")}</span></td>
                        <td style={{ fontSize: "12px", fontFamily: "monospace" }}>{p.reference || "—"}</td>
                        <td style={{ fontSize: "12px", color: "var(--stone-400)" }}>{p.notes || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <PaymentDialog open={showPayment} onClose={() => setShowPayment(false)} onSave={handlePayment} residents={app.residents} />
      <Dialog open={!!viewing} onClose={() => setViewing(null)} title="Payment details" size="sm">
        {viewing && <div style={{ display: "grid", gap: "9px" }}>
          <p><strong>{app.residents.find(r => r.id === viewing.residentId)?.fullName ?? "Unknown resident"}</strong></p>
          <p><span className="badge badge-blue">{viewing.type}</span> <strong>{formatRupee(viewing.amount)}</strong></p>
          <p style={{ color: "var(--stone-500)" }}>{formatDateTime(viewing.date)} · {viewing.method.replace("_", " ")}</p>
          <p>Reference: {viewing.reference || "—"}</p><p>Notes: {viewing.notes || "—"}</p>
          {!viewing.voidedAt && <button className="btn btn-secondary btn-sm" onClick={() => setCorrecting(true)}>Correct this payment</button>}
        </div>}
      </Dialog>
      <Dialog open={correcting} onClose={() => setCorrecting(false)} title="Correct payment" size="sm">
        <p style={{ color: "var(--stone-500)", fontSize: "13px", marginBottom: "10px" }}>The original transaction stays in activity history and is excluded from balance calculations.</p>
        <label className="form-label" htmlFor="correction-reason">Reason *</label>
        <textarea id="correction-reason" className="form-textarea" value={correctionReason} onChange={e => setCorrectionReason(e.target.value)} placeholder="Explain the correction…" />
        <div className="dialog-footer" style={{ padding: "16px 0 0", borderTop: 0 }}><button className="btn btn-secondary" onClick={() => setCorrecting(false)}>Cancel</button><button className="btn btn-danger" disabled={!correctionReason.trim()} onClick={correctPayment}>Confirm correction</button></div>
      </Dialog>
    </>
  );
}

type PaymentRow = { id: string; type: "rent" | "electricity"; residentId: string; amount: number; date: string; method: string; reference: string; notes: string; voidedAt?: string };
