"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Edit2, UserX, UserCheck, Eye } from "lucide-react";
import { useApp, formatRupee, formatDate } from "@/lib/AppContext";
import { useToast } from "@/components/ToastProvider";
import ResidentFormDialog from "@/components/ResidentFormDialog";
import ResidentDetailDialog from "@/components/ResidentDetailDialog";
import type { ResidentFormData } from "@/components/ResidentFormDialog";
import type { Resident } from "@/lib/AppContext";

export default function ResidentsPage() {
  const app = useApp();
  const { toast } = useToast();

  const [search,    setSearch]    = useState("");
  const [filterStatus, setFilter] = useState<"all" | "active" | "inactive">("active");
  const [filterRoom, setFilterRoom] = useState("all");
  const [filterPayment, setFilterPayment] = useState<"all" | "due" | "settled">("all");
  const [showAdd,   setShowAdd]   = useState(false);
  const [editing,   setEditing]   = useState<Resident | null>(null);
  const [viewing,   setViewing]   = useState<Resident | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Resident | null>(null);

  const filtered = useMemo(() => {
    return app.residents.filter(r => {
      const matchStatus = filterStatus === "all" || r.status === filterStatus;
      const matchRoom = filterRoom === "all" || r.roomNumber === filterRoom;
      const balance = app.getResidentRentBalance(r.id);
      const matchPayment = filterPayment === "all" || (filterPayment === "due" ? balance.outstanding > 0 : balance.outstanding === 0);
      const q = search.toLowerCase();
      const matchSearch = !q ||
        r.fullName.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        (r.roomNumber && r.roomNumber.includes(q)) ||
        r.college.toLowerCase().includes(q);
      return matchStatus && matchRoom && matchPayment && matchSearch;
    });
  }, [app, search, filterStatus, filterRoom, filterPayment]);

  const handleSaveNew = (data: ResidentFormData) => {
    try { app.addResident({
      fullName: data.fullName, phone: data.phone.replace(/\s/g, ""),
      guardianName: data.guardianName, guardianPhone: data.guardianPhone,
      roomNumber: data.roomNumber || null, college: data.college, course: data.course,
      monthlyRent: Math.round(Number(data.monthlyRent) * 100),
      joiningDate: data.joiningDate, status: data.status, notes: data.notes,
    });
      toast(`${data.fullName} added successfully.`);
      setShowAdd(false);
    } catch (error) { toast(error instanceof Error ? error.message : "Could not add resident.", "error"); }
  };

  const handleSaveEdit = (data: ResidentFormData) => {
    if (!editing) return;
    try { app.updateResident(editing.id, {
      fullName: data.fullName, phone: data.phone.replace(/\s/g, ""),
      guardianName: data.guardianName, guardianPhone: data.guardianPhone,
      roomNumber: data.roomNumber || null, college: data.college, course: data.course,
      monthlyRent: Math.round(Number(data.monthlyRent) * 100),
      joiningDate: data.joiningDate, status: data.status, notes: data.notes,
    });
      toast(`${data.fullName} updated.`);
      setEditing(null);
    } catch (error) { toast(error instanceof Error ? error.message : "Could not update resident.", "error"); }
  };

  const handleDeactivate = () => {
    if (!confirmDeactivate) return;
    app.deactivateResident(confirmDeactivate.id);
    toast(`${confirmDeactivate.fullName} has been deactivated.`, "warn");
    setConfirmDeactivate(null);
  };

  const handleReactivate = (resident: Resident) => {
    app.reactivateResident(resident.id);
    toast(`${resident.fullName} is active again.`);
  };

  const existingPhones = app.residents.map(r => r.phone);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Residents</h1>
          <p className="page-desc">{app.residents.filter(r => r.status === "active").length} active · {app.residents.filter(r => r.status === "inactive").length} inactive</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Resident
        </button>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="filter-bar mb-4">
          <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
            <Search className="h-4 w-4" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--stone-400)" }} />
            <input
              type="search"
              className="form-input"
              style={{ paddingLeft: "34px" }}
              placeholder="Search by name, phone, room, college…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search residents"
            />
          </div>
           {(["all", "active", "inactive"] as const).map(s => (
            <button
              key={s}
              className={`btn ${filterStatus === s ? "btn-primary" : "btn-secondary"} btn-sm`}
              onClick={() => setFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
             </button>
           ))}
           <select className="form-select" style={{ width: "auto" }} value={filterRoom} onChange={e => setFilterRoom(e.target.value)} aria-label="Filter by room">
             <option value="all">All rooms</option>
             {app.rooms.map(room => <option key={room.id} value={room.roomNumber}>Room {room.roomNumber}</option>)}
           </select>
           <select className="form-select" style={{ width: "auto" }} value={filterPayment} onChange={e => setFilterPayment(e.target.value as typeof filterPayment)} aria-label="Filter by payment status">
             <option value="all">All balances</option>
             <option value="due">With dues</option>
             <option value="settled">Settled</option>
           </select>
         </div>

        {/* Table */}
        <div className="card">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <Plus style={{ width: 36, height: 36 }} />
              <h3>{search || filterStatus !== "all" ? "No matching residents" : "No residents yet"}</h3>
              <p>{search || filterStatus !== "all" ? "Try adjusting your search or filter." : "Add your first resident to get started."}</p>
              {!search && filterStatus === "all" && (
                <button className="btn btn-primary btn-sm" style={{ marginTop: "12px" }} onClick={() => setShowAdd(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Resident
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Straight Cards (1 by 1) */}
              <div className="md:hidden flex flex-col gap-3">
                {filtered.map(r => {
                  const bal = app.getResidentRentBalance(r.id);
                  return (
                    <div key={r.id} className="p-3.5 bg-white border border-[var(--stone-200)] rounded-xl shadow-2xs space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="avatar">
                            {r.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-[var(--stone-800)]">{r.fullName}</p>
                            <p className="text-xs text-[var(--stone-400)]">{r.phone}</p>
                          </div>
                        </div>
                        <span className={`badge ${r.status === "active" ? "badge-green" : "badge-stone"}`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[var(--stone-100)]">
                        <div>
                          <span className="text-[var(--stone-400)] block">Room</span>
                          <span className="font-medium text-[var(--stone-700)]">
                            {r.roomNumber ? `Room ${r.roomNumber}` : "Unassigned"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--stone-400)] block">Rent</span>
                          <span className="font-medium text-[var(--stone-700)]">
                            {formatRupee(r.monthlyRent)}/mo
                          </span>
                        </div>
                      </div>
                      {bal.outstanding > 0 && (
                        <p className="text-xs text-red-600 font-semibold">
                          Due: {formatRupee(bal.outstanding)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-2 border-t border-[var(--stone-100)]">
                        <button className="btn btn-secondary btn-sm flex-1" onClick={() => setViewing(r)}>
                          <Eye className="h-3 w-3" /> View
                        </button>
                        <button className="btn btn-secondary btn-sm flex-1" onClick={() => setEditing(r)}>
                          <Edit2 className="h-3 w-3" /> Edit
                        </button>
                        {r.status === "active" && (
                          <button className="btn btn-ghost btn-sm text-red-500" onClick={() => setConfirmDeactivate(r)}>
                            <UserX className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {r.status === "inactive" && (
                          <button className="btn btn-ghost btn-sm text-emerald-600" onClick={() => handleReactivate(r)}>
                            <UserCheck className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Room</th>
                      <th>College / Course</th>
                      <th>Rent/mo</th>
                      <th>Joining</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const bal = app.getResidentRentBalance(r.id);
                      return (
                        <tr key={r.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div className="avatar">{r.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                              <div>
                                <p style={{ fontWeight: 500, color: "var(--stone-800)" }}>{r.fullName}</p>
                                {r.guardianName && <p style={{ fontSize: "11px", color: "var(--stone-400)" }}>Guardian: {r.guardianName}</p>}
                              </div>
                            </div>
                          </td>
                          <td style={{ fontFamily: "monospace", fontSize: "13px" }}>{r.phone}</td>
                          <td>{r.roomNumber ? <span className="badge badge-blue">Room {r.roomNumber}</span> : <span style={{ color: "var(--stone-300)" }}>—</span>}</td>
                          <td>
                            <p style={{ fontSize: "12px" }}>{r.college || "—"}</p>
                            {r.course && <p style={{ fontSize: "11px", color: "var(--stone-400)" }}>{r.course}</p>}
                          </td>
                          <td style={{ fontWeight: 600 }}>{formatRupee(r.monthlyRent)}</td>
                          <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>{formatDate(r.joiningDate)}</td>
                          <td>
                            {r.status === "active"
                              ? <span className="badge badge-green">Active</span>
                              : <span className="badge badge-stone">Inactive</span>}
                            {bal.outstanding > 0 && (
                              <span className="badge badge-red" style={{ marginLeft: "4px" }}>Due {formatRupee(bal.outstanding)}</span>
                            )}
                            {bal.advance > 0 && (
                              <span className="badge badge-blue" style={{ marginLeft: "4px" }}>Advance {formatRupee(bal.advance)}</span>
                            )}
                          </td>
                          <td style={{ position: "relative", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setViewing(r)} title="View details"><Eye className="h-3.5 w-3.5" /></button>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(r)} title="Edit"><Edit2 className="h-3.5 w-3.5" /></button>
                               {r.status === "active" && (
                                 <button className="btn btn-ghost btn-icon btn-sm" style={{ color: "#ef4444" }} onClick={() => setConfirmDeactivate(r)} title="Deactivate"><UserX className="h-3.5 w-3.5" /></button>
                               )}
                               {r.status === "inactive" && (
                                 <button className="btn btn-ghost btn-icon btn-sm" style={{ color: "var(--sage-600)" }} onClick={() => handleReactivate(r)} title="Reactivate"><UserCheck className="h-3.5 w-3.5" /></button>
                               )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add dialog */}
      <ResidentFormDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleSaveNew}
        existingPhones={existingPhones}
      />

      {/* Edit dialog */}
      <ResidentFormDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        onSave={handleSaveEdit}
        title="Edit Resident"
        initial={editing ? {
          fullName: editing.fullName, phone: editing.phone, guardianName: editing.guardianName,
          guardianPhone: editing.guardianPhone, roomNumber: editing.roomNumber ?? "",
          college: editing.college, course: editing.course,
          monthlyRent: String(editing.monthlyRent / 100), joiningDate: editing.joiningDate,
          status: editing.status, notes: editing.notes,
        } : undefined}
        existingPhones={existingPhones}
        currentPhone={editing?.phone}
      />

      {/* Detail dialog */}
      <ResidentDetailDialog
        open={!!viewing}
        onClose={() => setViewing(null)}
        resident={viewing}
        rentBalance={viewing ? app.getResidentRentBalance(viewing.id) : null}
        elecBalance={viewing ? app.getResidentElectricityBalance(viewing.id) : null}
      />

      {/* Deactivate confirm */}
      {confirmDeactivate && (
        <div className="dialog-backdrop">
          <div className="dialog" style={{ maxWidth: "380px" }}>
            <div className="dialog-header">
              <h2 className="dialog-title">Deactivate Resident?</h2>
            </div>
            <div className="dialog-body">
              <p style={{ fontSize: "14px", color: "var(--stone-600)" }}>
                Are you sure you want to deactivate <strong>{confirmDeactivate.fullName}</strong>?
                Their history will be preserved. This action can be undone by editing the resident.
              </p>
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDeactivate(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeactivate}>Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
