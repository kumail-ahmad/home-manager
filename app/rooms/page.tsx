"use client";

import { useState, useMemo } from "react";
import { Plus, Users, BedDouble, Edit2, UserMinus, UserPlus, Search, ArrowUpDown, Filter } from "lucide-react";
import { useApp, formatRupee } from "@/lib/AppContext";
import { useToast } from "@/components/ToastProvider";
import Dialog from "@/components/Dialog";
import type { Room } from "@/lib/AppContext";

function RoomFormDialog({ open, onClose, onSave, initial }: {
  open: boolean;
  onClose: () => void;
  onSave: (d: { roomNumber: string; capacity: number; notes: string }) => void;
  initial?: Room;
}) {
  const [roomNumber, setRoomNumber] = useState(initial?.roomNumber ?? "");
  const [capacity,   setCapacity]   = useState(String(initial?.capacity ?? "2"));
  const [notes,      setNotes]      = useState(initial?.notes ?? "");
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [saving,     setSaving]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!roomNumber.trim())      errs.roomNumber = "Room number is required";
    if (!capacity || Number(capacity) < 1) errs.capacity = "Capacity must be at least 1";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 250));
    onSave({ roomNumber: roomNumber.trim(), capacity: Number(capacity), notes });
    setSaving(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? "Edit Room" : "Add Room"}
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="room-form" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner" />Saving…</> : "Save Room"}
          </button>
        </>
      }
    >
      <form id="room-form" onSubmit={handleSubmit} noValidate className="space-y-3">
        <div className="form-group">
          <label className="form-label" htmlFor="r-num">Room Number / Name *</label>
          <input id="r-num" className={`form-input ${errors.roomNumber ? "error" : ""}`} value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="e.g. 101 or G1" />
          {errors.roomNumber && <span className="form-error">{errors.roomNumber}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="r-cap">Capacity (max occupants) *</label>
          <input id="r-cap" type="number" min="1" max="10" className={`form-input ${errors.capacity ? "error" : ""}`} value={capacity} onChange={e => setCapacity(e.target.value)} />
          {errors.capacity && <span className="form-error">{errors.capacity}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="r-notes">Notes</label>
          <textarea id="r-notes" className="form-textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional…" />
        </div>
      </form>
    </Dialog>
  );
}

function AssignDialog({ open, onClose, room }: { open: boolean; onClose: () => void; room: Room | null }) {
  const app = useApp();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState("");

  const availableResidents = useMemo(() =>
    app.residents.filter(r => r.status === "active" && !room?.residentIds.includes(r.id)),
    [app.residents, room]
  );

  if (!room) return null;

  const handleAssign = () => {
    if (!selectedId) return;
    const result = app.assignResidentToRoom(room.id, selectedId);
    if (result.success) {
      const r = app.residents.find(r => r.id === selectedId);
      toast(`${r?.fullName} assigned to Room ${room.roomNumber}.`);
      setSelectedId("");
      onClose();
    } else {
      toast(result.error ?? "Could not assign resident.", "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={`Assign Resident — Room ${room.roomNumber}`} size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAssign} disabled={!selectedId}>Assign</button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Select Resident</label>
         {availableResidents.length === 0 ? (
           <p style={{ fontSize: "13px", color: "var(--stone-400)" }}>No other active residents available.</p>
        ) : (
          <select className="form-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">— Select —</option>
             {availableResidents.map(r => <option key={r.id} value={r.id}>{r.fullName}{r.roomNumber ? ` · currently Room ${r.roomNumber}` : " · unassigned"}</option>)}
          </select>
        )}
      </div>
      <p style={{ fontSize: "12px", color: "var(--stone-400)", marginTop: "10px" }}>
        Capacity: {room.residentIds.length} / {room.capacity} occupied
      </p>
    </Dialog>
  );
}

export default function RoomsPage() {
  const app  = useApp();
  const { toast } = useToast();
  const [showAdd, setShowAdd]     = useState(false);
  const [editing, setEditing]     = useState<Room | null>(null);
  const [assigning, setAssigning] = useState<Room | null>(null);
  const [search, setSearch]       = useState("");
  const [filterFloor, setFilterFloor] = useState<"all" | "100" | "200" | "300" | "400">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "full" | "empty">("all");
  const [sortBy, setSortBy]       = useState<"asc" | "desc" | "available" | "capacity-desc" | "capacity-asc">("asc");

  const handleSaveRoom = (d: { roomNumber: string; capacity: number; notes: string }) => {
    try {
      if (editing) {
        app.updateRoom(editing.id, d);
        toast(`Room ${d.roomNumber} updated.`);
        setEditing(null);
      } else {
        app.addRoom({ ...d, residentIds: [] });
        toast(`Room ${d.roomNumber} created.`);
        setShowAdd(false);
      }
    } catch (error) { toast(error instanceof Error ? error.message : "Could not save room.", "error"); }
  };

  const handleRemove = (roomId: string, residentId: string) => {
    const room = app.rooms.find(r => r.id === roomId);
    const resident = app.residents.find(r => r.id === residentId);
    if (!window.confirm(`Remove ${resident?.fullName} from Room ${room?.roomNumber}?`)) return;
    app.removeResidentFromRoom(roomId, residentId);
    toast(`${resident?.fullName} removed from Room ${room?.roomNumber}.`, "warn");
  };

  const totalBeds    = app.rooms.reduce((s, r) => s + r.capacity, 0);
  const occupiedBeds = app.rooms.reduce((s, r) => s + r.residentIds.length, 0);

  // Floor counts for quick filters
  const floorCounts = useMemo(() => {
    return {
      all: app.rooms.length,
      "100": app.rooms.filter(r => r.roomNumber.startsWith("1")).length,
      "200": app.rooms.filter(r => r.roomNumber.startsWith("2")).length,
      "300": app.rooms.filter(r => r.roomNumber.startsWith("3")).length,
      "400": app.rooms.filter(r => r.roomNumber.startsWith("4")).length,
    };
  }, [app.rooms]);

  // Filtered and sorted rooms
  const filteredRooms = useMemo(() => {
    return app.rooms
      .filter(room => {
        // 1. Search text filter
        const q = search.toLowerCase().trim();
        const matchesSearch = !q ||
          room.roomNumber.toLowerCase().includes(q) ||
          room.notes.toLowerCase().includes(q) ||
          app.residents.some(r => room.residentIds.includes(r.id) && r.fullName.toLowerCase().includes(q));

        // 2. Floor / Series filter (101, 201, 301, 401...)
        const matchesFloor =
          filterFloor === "all" ||
          (filterFloor === "100" && room.roomNumber.startsWith("1")) ||
          (filterFloor === "200" && room.roomNumber.startsWith("2")) ||
          (filterFloor === "300" && room.roomNumber.startsWith("3")) ||
          (filterFloor === "400" && room.roomNumber.startsWith("4"));

        // 3. Occupancy Status filter
        const occupantsCount = room.residentIds.length;
        const isFull = occupantsCount >= room.capacity;
        const isEmpty = occupantsCount === 0;
        const isAvailable = !isFull;

        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "available" && isAvailable) ||
          (filterStatus === "full" && isFull) ||
          (filterStatus === "empty" && isEmpty);

        return matchesSearch && matchesFloor && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "asc") {
          return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: "base" });
        }
        if (sortBy === "desc") {
          return b.roomNumber.localeCompare(a.roomNumber, undefined, { numeric: true, sensitivity: "base" });
        }
        if (sortBy === "available") {
          const availA = a.capacity - a.residentIds.length;
          const availB = b.capacity - b.residentIds.length;
          return availB - availA;
        }
        if (sortBy === "capacity-desc") {
          return b.capacity - a.capacity;
        }
        if (sortBy === "capacity-asc") {
          return a.capacity - b.capacity;
        }
        return 0;
      });
  }, [app.rooms, app.residents, search, filterFloor, filterStatus, sortBy]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rooms & Occupancy</h1>
          <p className="page-desc">{app.rooms.length} rooms · {occupiedBeds}/{totalBeds} beds occupied</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Room
        </button>
      </div>

      <div className="page-body">
        {/* Summary bar */}
        <div className="grid-cards grid-stats mb-5 sm:mb-6">
          {[
            { label: "Total Rooms",   value: app.rooms.length,           icon: BedDouble, color: "var(--blush-500)" },
            { label: "Occupied Beds", value: `${occupiedBeds}/${totalBeds}`, icon: Users,     color: "var(--sage-500)" },
            { label: "Available Beds",value: totalBeds - occupiedBeds,   icon: BedDouble, color: "#3b82f6" },
          ].map(c => (
            <div key={c.label} className="stat-card">
              <span className="stat-label">{c.label}</span>
              <span className="stat-value" style={{ color: c.color }}>{c.value}</span>
            </div>
          ))}
        </div>

        {/* Filter and sorting controls */}
        <div className="card mb-5 p-3 sm:p-4 bg-white/80 backdrop-blur-xs">
          <div className="flex flex-col gap-3">
            {/* Top row: search + floor chips */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div style={{ position: "relative", flex: 1, minWidth: "220px", maxWidth: "340px" }} className="w-full sm:w-auto">
                <Search className="h-4 w-4" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--stone-400)" }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: "34px" }}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by room or notes…"
                  aria-label="Search rooms"
                />
              </div>

              {/* Floor / Series filter chips */}
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                {[
                  { id: "all", label: "All", count: floorCounts.all },
                  { id: "100", label: "101 Series", count: floorCounts["100"] },
                  { id: "200", label: "201 Series", count: floorCounts["200"] },
                  { id: "300", label: "301 Series", count: floorCounts["300"] },
                  { id: "400", label: "401 Series", count: floorCounts["400"] },
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    className={`btn btn-sm ${filterFloor === f.id ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setFilterFloor(f.id as typeof filterFloor)}
                  >
                    <span>{f.label}</span>
                    <span className={`text-[10px] ml-1 px-1.5 py-0.2 rounded-full ${filterFloor === f.id ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"}`}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom row: status & sort order */}
            <div className="flex flex-wrap gap-2 items-center justify-between pt-2 border-t border-stone-100 text-xs">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 text-stone-500 font-medium">
                  <Filter className="h-3.5 w-3.5 text-stone-400" />
                  <span>Status:</span>
                </div>
                <select
                  className="form-select flex-1 sm:w-auto text-xs py-1 px-2.5"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                  aria-label="Filter by room status"
                >
                  <option value="all">All Occupancy ({app.rooms.length})</option>
                  <option value="available">Available with vacant beds</option>
                  <option value="full">Full capacity</option>
                  <option value="empty">Empty (0 residents)</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 text-stone-500 font-medium">
                  <ArrowUpDown className="h-3.5 w-3.5 text-stone-400" />
                  <span>Sort:</span>
                </div>
                <select
                  className="form-select flex-1 sm:w-auto text-xs py-1 px-2.5 font-medium"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  aria-label="Sort rooms"
                >
                  <option value="asc">Room Number (Ascending: 101, 201…)</option>
                  <option value="desc">Room Number (Descending: 402, 301…)</option>
                  <option value="available">Most Available Beds</option>
                  <option value="capacity-desc">Capacity: High to Low</option>
                  <option value="capacity-asc">Capacity: Low to High</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {app.rooms.length === 0 ? (
          <div className="card"><div className="empty-state">
            <BedDouble style={{ width: 36, height: 36 }} />
            <h3>No rooms yet</h3>
            <p>Add rooms to start assigning residents.</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: "12px" }} onClick={() => setShowAdd(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Room
            </button>
          </div></div>
        ) : filteredRooms.length === 0 ? (
          <div className="card"><div className="empty-state">
            <BedDouble style={{ width: 32, height: 32 }} />
            <h3>No rooms match your filter</h3>
            <p>Try clearing filters or search to view all rooms.</p>
            <button
              className="btn btn-secondary btn-sm mt-3"
              onClick={() => { setSearch(""); setFilterFloor("all"); setFilterStatus("all"); }}
            >
              Reset Filters
            </button>
          </div></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
             {filteredRooms.map(room => {
              const occupants = app.residents.filter(r => room.residentIds.includes(r.id));
              const full = occupants.length >= room.capacity;
              return (
                <div key={room.id} className="card" style={{ borderTop: `3px solid ${full ? "var(--blush-400)" : "var(--sage-400, #6b9f5e)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: "16px" }}>Room {room.roomNumber}</h3>
                      <p style={{ fontSize: "12px", color: "var(--stone-400)" }}>Capacity: {room.capacity}</p>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <span className={`badge ${full ? "badge-red" : "badge-green"}`}>
                        {occupants.length}/{room.capacity} {full ? "Full" : "Available"}
                      </span>
                    </div>
                  </div>

                  {/* Occupants */}
                  <div style={{ marginBottom: "10px" }}>
                    {occupants.length === 0 ? (
                      <p style={{ fontSize: "12px", color: "var(--stone-300)" }}>No residents assigned</p>
                    ) : (
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                        {occupants.map(r => (
                          <li key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--stone-50)", borderRadius: "6px", padding: "6px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                              <div className="avatar" style={{ width: 26, height: 26, fontSize: "11px" }}>
                                {r.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </div>
                              <div>
                                <p style={{ fontSize: "12px", fontWeight: 500 }}>{r.fullName}</p>
                                <p style={{ fontSize: "11px", color: "var(--stone-400)" }}>{formatRupee(r.monthlyRent)}/mo</p>
                              </div>
                            </div>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              style={{ color: "#ef4444" }}
                              title={`Remove ${r.fullName} from room`}
                              onClick={() => handleRemove(room.id, r.id)}
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setEditing(room)}>
                      <Edit2 className="h-3 w-3" /> Edit
                    </button>
                    <button
                      className="btn btn-sage btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => setAssigning(room)}
                      disabled={full}
                      title={full ? "Room is at capacity" : "Assign a resident"}
                    >
                      <UserPlus className="h-3 w-3" /> Assign
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RoomFormDialog open={showAdd}  onClose={() => setShowAdd(false)}   onSave={handleSaveRoom} />
      <RoomFormDialog open={!!editing} onClose={() => setEditing(null)}   onSave={handleSaveRoom} initial={editing ?? undefined} />
      <AssignDialog   open={!!assigning} onClose={() => setAssigning(null)} room={assigning} />
    </>
  );
}
