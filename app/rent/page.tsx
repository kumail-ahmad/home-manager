"use client";

import { useState, useMemo } from "react";
import { Plus, RefreshCw, CreditCard, Search, Filter, ArrowUpDown, RotateCcw } from "lucide-react";
import { useApp, formatRupee, currentMonthKey } from "@/lib/AppContext";
import { useToast } from "@/components/ToastProvider";
import PaymentDialog from "@/components/PaymentDialog";
import Dialog from "@/components/Dialog";
import type { PaymentFormData } from "@/components/PaymentDialog";

function AddChargeDialog({ open, onClose, month }: { open: boolean; onClose: () => void; month: string }) {
  const app = useApp();
  const { toast } = useToast();
  const [residentId, setResidentId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!residentId || !amount || Number(amount) <= 0) { setError("Select a resident and enter an amount greater than zero."); return; }
    try { app.addRentCharge({ residentId, month, amountPaise: Math.round(Number(amount) * 100) }); toast("Rent charge added."); onClose(); setResidentId(""); setAmount(""); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add charge."); }
  };
  return <Dialog open={open} onClose={onClose} title={`Add rent charge · ${month}`} size="sm" footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" form="charge-form" type="submit">Add charge</button></>}>
    <form id="charge-form" onSubmit={submit} className="space-y-3" noValidate>
      <div className="form-group"><label className="form-label" htmlFor="charge-resident">Resident *</label><select id="charge-resident" className="form-select" value={residentId} onChange={e => setResidentId(e.target.value)}><option value="">— Select resident —</option>{app.residents.filter(r => r.status === "active").map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}</select></div>
      <div className="form-group"><label className="form-label" htmlFor="charge-amount">Amount (₹) *</label><input id="charge-amount" className="form-input" type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="7800" /></div>
      {error && <span className="form-error">{error}</span>}
    </form>
  </Dialog>;
}

export default function RentPage() {
  const app = useApp();
  const { toast } = useToast();
  const [filterMonth, setFilterMonth]  = useState(currentMonthKey());
  const [filterResident, setFilterResident] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "unpaid" | "paid" | "partial">("all");
  const [filterFloor, setFilterFloor] = useState<"all" | "100" | "200" | "300" | "400">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"room" | "name" | "outstanding" | "charged">("room");
  const [showPayment,    setShowPayment]    = useState(false);
  const [payResidentId,  setPayResidentId]  = useState<string | undefined>();
  const [showChargeDialog, setShowChargeDialog] = useState(false);

  // Months that have charges
  const months = useMemo(() => {
    const set = new Set(app.rentCharges.map(c => c.month));
    set.add(currentMonthKey());
    return [...set].sort().reverse();
  }, [app.rentCharges]);

  // Filtered charges for month
  const chargesForMonth = useMemo(() => {
    return app.rentCharges
      .filter(c => {
        if (c.month !== filterMonth) return false;
        if (filterResident !== "all" && c.residentId !== filterResident) return false;

        const resident = app.residents.find(r => r.id === c.residentId);
        const roomNum = resident?.roomNumber ?? "";

        // Floor / Series filter
        if (filterFloor === "100" && !roomNum.startsWith("1")) return false;
        if (filterFloor === "200" && !roomNum.startsWith("2")) return false;
        if (filterFloor === "300" && !roomNum.startsWith("3")) return false;
        if (filterFloor === "400" && !roomNum.startsWith("4")) return false;

        // Search text
        const q = search.toLowerCase().trim();
        if (q) {
          const matchName = resident?.fullName.toLowerCase().includes(q);
          const matchRoom = roomNum.toLowerCase().includes(q);
          if (!matchName && !matchRoom) return false;
        }

        // Status filter
        if (filterStatus !== "all") {
          const balance = app.getRentChargeBalance(c.id);
          const paid = balance.paid;
          const outstanding = balance.outstanding;
          const status = paid === 0 ? "unpaid" : outstanding === 0 ? "paid" : "partial";
          if (filterStatus !== status) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const resA = app.residents.find(r => r.id === a.residentId);
        const resB = app.residents.find(r => r.id === b.residentId);
        if (sortBy === "room") {
          return (resA?.roomNumber || "").localeCompare(resB?.roomNumber || "", undefined, { numeric: true, sensitivity: "base" });
        }
        if (sortBy === "name") {
          return (resA?.fullName || "").localeCompare(resB?.fullName || "");
        }
        if (sortBy === "outstanding") {
          const outA = app.getRentChargeBalance(a.id).outstanding;
          const outB = app.getRentChargeBalance(b.id).outstanding;
          return outB - outA;
        }
        if (sortBy === "charged") {
          return b.amountPaise - a.amountPaise;
        }
        return 0;
      });
  }, [app, filterMonth, filterResident, filterFloor, filterStatus, search, sortBy]);

  const handlePayment = (data: PaymentFormData) => {
    const paise = Math.round(Number(data.amountStr) * 100);
    app.addRentPayment({
      residentId: data.residentId, chargeId: null, amountPaise: paise,
      billingPeriod: data.billingPeriod,
      paymentDate: new Date(data.paymentDate).toISOString(),
      method: data.method, reference: data.reference, notes: data.notes,
    });
    toast(`Rent payment of ${formatRupee(paise)} recorded.`);
    setShowPayment(false);
  };

  const handleGenerateMonth = () => {
    const created = app.generateMonthlyRentCharges(filterMonth);
    toast(created.length > 0
      ? `${created.length} charge(s) generated for ${filterMonth}.`
      : "All rent charges for this month already exist."
    );
  };

  // Summary for current filter
  const totalCharged = chargesForMonth.reduce((s, c) => s + c.amountPaise, 0);
  const relevantResIds = chargesForMonth.map(c => c.residentId);
  const chargeIds = new Set(chargesForMonth.map(charge => charge.id));
  const totalPaid = app.rentPayments
    .filter(p => p.billingPeriod === filterMonth && relevantResIds.includes(p.residentId) || (p.chargeId !== null && chargeIds.has(p.chargeId)))
    .reduce((s, p) => s + p.amountPaise, 0);
  const outstanding = Math.max(0, totalCharged - totalPaid);

  const hasActiveFilters = search || filterResident !== "all" || filterStatus !== "all" || filterFloor !== "all" || sortBy !== "room";

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rent Management</h1>
          <p className="page-desc">Track monthly rent charges and payments</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button className="btn btn-secondary btn-sm" onClick={handleGenerateMonth}>
            <RefreshCw className="h-3.5 w-3.5" /> Generate {filterMonth} Charges
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowChargeDialog(true)}><Plus className="h-3.5 w-3.5" /> Add individual charge</button>
          <button className="btn btn-primary btn-sm" onClick={() => { setPayResidentId(undefined); setShowPayment(true); }}>
            <CreditCard className="h-3.5 w-3.5" /> Record Payment
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="card mb-4">
          <div className="flex flex-col gap-3">
            {/* Top row: search + month + resident */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  className="form-input w-full"
                  style={{ paddingLeft: "34px" }}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search resident or room…"
                  aria-label="Search rent charges"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                  <span className="text-xs text-stone-500 font-medium">Month:</span>
                  <select className="form-select text-xs py-1 px-2.5 flex-1 sm:w-auto" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                  <span className="text-xs text-stone-500 font-medium">Resident:</span>
                  <select className="form-select text-xs py-1 px-2.5 flex-1 sm:w-auto" value={filterResident} onChange={e => setFilterResident(e.target.value)}>
                    <option value="all">All Residents</option>
                    {app.residents.filter(r => r.status === "active").map(r =>
                      <option key={r.id} value={r.id}>{r.fullName}</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom row: Status pills + Floor + Sort + Reset */}
            <div className="flex flex-wrap gap-2 items-center justify-between pt-2.5 border-t border-stone-100 text-xs">
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <span className="text-stone-500 font-medium mr-1 flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Status:
                </span>
                {[
                  { id: "all", label: "All" },
                  { id: "unpaid", label: "Unpaid" },
                  { id: "partial", label: "Partial" },
                  { id: "paid", label: "Paid" },
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={`btn btn-sm ${filterStatus === s.id ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setFilterStatus(s.id as typeof filterStatus)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1">
                  <span className="text-stone-500">Floor:</span>
                  <select
                    className="form-select text-xs py-1 px-2"
                    value={filterFloor}
                    onChange={e => setFilterFloor(e.target.value as typeof filterFloor)}
                  >
                    <option value="all">All Floors</option>
                    <option value="100">101 Series</option>
                    <option value="200">201 Series</option>
                    <option value="300">301 Series</option>
                    <option value="400">401 Series</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3 text-stone-400" />
                  <select
                    className="form-select text-xs py-1 px-2 font-medium"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  >
                    <option value="room">Room Number</option>
                    <option value="name">Resident Name</option>
                    <option value="outstanding">Highest Outstanding</option>
                    <option value="charged">Highest Charged</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm text-xs py-1 px-2 text-stone-600 hover:text-stone-900"
                    onClick={() => {
                      setSearch("");
                      setFilterResident("all");
                      setFilterStatus("all");
                      setFilterFloor("all");
                      setSortBy("room");
                    }}
                  >
                    <RotateCcw className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid-cards grid-stats mb-4">
          {[
            { label: "Total Charged", value: formatRupee(totalCharged), color: "#3b82f6" },
            { label: "Collected",     value: formatRupee(totalPaid),    color: "var(--sage-500)" },
            { label: "Outstanding",   value: formatRupee(outstanding),  color: "#ef4444" },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <span className="stat-label">{s.label}</span>
              <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Charges table */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: "14px", fontWeight: 600 }}>Charges — {filterMonth}</h2>
          </div>
          {chargesForMonth.length === 0 ? (
            <div className="empty-state">
              <CreditCard style={{ width: 32, height: 32 }} />
              <h3>No charges for this period</h3>
              <p>Generate charges for all active residents, or add an individual charge.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: "12px" }} onClick={handleGenerateMonth}>
                <RefreshCw className="h-3.5 w-3.5" /> Generate Charges
              </button>
            </div>
          ) : (
            <div className="overflow-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Resident</th><th>Room</th><th>Charged</th><th>Paid</th><th>Outstanding</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {chargesForMonth.map(charge => {
                    const resident = app.residents.find(r => r.id === charge.residentId);
                    const balance = app.getRentChargeBalance(charge.id);
                    const paid = balance.paid;
                    const outstanding = balance.outstanding;
                    const overpaid = balance.advance;
                    const status = paid === 0 ? "unpaid" : outstanding === 0 ? "paid" : "partial";
                    return (
                      <tr key={charge.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div className="avatar" style={{ width: 28, height: 28, fontSize: "11px"}}>
                              {resident?.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <span style={{ fontWeight: 500 }}>{resident?.fullName ?? "—"}</span>
                          </div>
                        </td>
                        <td>{resident?.roomNumber ? `Room ${resident.roomNumber}` : "—"}</td>
                        <td style={{ fontWeight: 600 }}>{formatRupee(charge.amountPaise)}</td>
                        <td style={{ color: "var(--sage-600, #537c48)", fontWeight: 500 }}>{formatRupee(paid)}</td>
                        <td style={{ color: outstanding > 0 ? "#dc2626" : "var(--stone-400)", fontWeight: 500 }}>
                          {outstanding > 0 ? formatRupee(outstanding) : overpaid > 0 ? <span style={{ color: "#16a34a" }}>+{formatRupee(overpaid)} advance</span> : "—"}
                        </td>
                        <td>
                          {status === "paid"    && <span className="badge badge-green">Paid</span>}
                          {status === "partial" && <span className="badge badge-amber">Partial</span>}
                          {status === "unpaid"  && <span className="badge badge-red">Unpaid</span>}
                        </td>
                        <td>
                          <button
                            className="btn btn-sage btn-sm"
                            onClick={() => { setPayResidentId(charge.residentId); setShowPayment(true); }}
                          >
                            Pay
                          </button>
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

      <PaymentDialog
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSave={handlePayment}
        residents={app.residents}
        defaultResidentId={payResidentId}
        defaultCategory="rent"
        defaultBillingPeriod={filterMonth}
      />
      <AddChargeDialog open={showChargeDialog} onClose={() => setShowChargeDialog(false)} month={filterMonth} />
    </>
  );
}
