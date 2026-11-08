"use client";
import React from "react";
import Dialog from "./Dialog";
import type { Resident } from "@/lib/AppContext";
import { formatRupee, formatDate } from "@/lib/AppContext";

interface Props {
  open: boolean;
  onClose: () => void;
  resident: Resident | null;
  rentBalance: { totalCharged: number; totalPaid: number; outstanding: number; advance: number } | null;
  elecBalance: { totalBilled: number; totalPaid: number; outstanding: number } | null;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div style={{ display: "flex", gap: "12px", padding: "8px 0", borderBottom: "1px solid var(--stone-100)" }}><span style={{ width: "140px", flexShrink: 0, fontSize: "12px", color: "var(--stone-400)", fontWeight: 500 }}>{label}</span><span style={{ fontSize: "13px", color: "var(--stone-700)" }}>{value}</span></div>;
}

export default function ResidentDetailDialog({ open, onClose, resident, rentBalance, elecBalance }: Props) {
  if (!resident) return null;

  return (
    <Dialog open={open} onClose={onClose} title="Resident Details" size="md">
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px", padding: "12px", background: "var(--blush-50)", borderRadius: "10px" }}>
        <div className="avatar" style={{ width: 44, height: 44, fontSize: "16px" }}>
          {resident.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: "16px", color: "var(--stone-800)" }}>{resident.fullName}</p>
          <p style={{ fontSize: "12px", color: "var(--stone-500)" }}>
            {resident.status === "active"
              ? <span className="badge badge-green">Active</span>
              : <span className="badge badge-stone">Inactive</span>}
            {resident.roomNumber && <span style={{ marginLeft: "8px" }}>Room {resident.roomNumber}</span>}
          </p>
        </div>
      </div>

      <Row label="Phone"           value={resident.phone || "—"} />
      <Row label="Guardian Name"   value={resident.guardianName || "—"} />
      <Row label="Guardian Phone"  value={resident.guardianPhone || "—"} />
      <Row label="College"         value={resident.college || "—"} />
      <Row label="Course"          value={resident.course || "—"} />
      <Row label="Monthly Rent"    value={formatRupee(resident.monthlyRent)} />
      <Row label="Joining Date"    value={formatDate(resident.joiningDate)} />
      {resident.notes && <Row label="Notes" value={resident.notes} />}

      {rentBalance && (
        <>
          <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--stone-300)", margin: "14px 0 4px" }}>Rent Balance</p>
          <Row label="Total Charged" value={formatRupee(rentBalance.totalCharged)} />
          <Row label="Total Paid"    value={formatRupee(rentBalance.totalPaid)} />
          {rentBalance.outstanding > 0 && <Row label="Outstanding" value={<span style={{ color: "#dc2626", fontWeight: 600 }}>{formatRupee(rentBalance.outstanding)}</span>} />}
          {rentBalance.advance > 0     && <Row label="Advance Credit" value={<span style={{ color: "#16a34a", fontWeight: 600 }}>{formatRupee(rentBalance.advance)}</span>} />}
        </>
      )}
      {elecBalance && (
        <>
          <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--stone-300)", margin: "14px 0 4px" }}>Electricity Balance</p>
          <Row label="Total Billed"   value={formatRupee(elecBalance.totalBilled)} />
          <Row label="Total Paid"     value={formatRupee(elecBalance.totalPaid)} />
          {elecBalance.outstanding > 0 && <Row label="Outstanding" value={<span style={{ color: "#dc2626", fontWeight: 600 }}>{formatRupee(elecBalance.outstanding)}</span>} />}
        </>
      )}
    </Dialog>
  );
}
