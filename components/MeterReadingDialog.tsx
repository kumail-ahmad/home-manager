"use client";
import React, { useEffect, useState } from "react";
import Dialog from "./Dialog";
import type { Room } from "@/lib/AppContext";

export interface MeterReadingData {
  roomNumber: string;
  readingDate: string;
  units: number;
  notes: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (d: Omit<import("@/lib/AppContext").MeterReading, "id">) => void;
  rooms: Room[];
}

export default function MeterReadingDialog({ open, onClose, onSave, rooms }: Props) {
  const [roomNumber, setRoomNumber] = useState("");
  const [readingDate, setReadingDate] = useState(new Date().toISOString().slice(0, 10));
  const [units, setUnits] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) { setRoomNumber(""); setReadingDate(new Date().toISOString().slice(0, 10)); setUnits(""); setNotes(""); setErrors({}); }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!roomNumber) errs.roomNumber = "Select a room";
    if (!units || isNaN(Number(units)) || Number(units) < 0) errs.units = "Enter valid unit reading";
    if (!readingDate) errs.readingDate = "Date is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave({ roomNumber, readingDate, units: Number(units), notes });
    setSaving(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Log Meter Reading"
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="meter-form" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner" />Saving…</> : "Log Reading"}
          </button>
        </>
      }
    >
      <form id="meter-form" onSubmit={handleSubmit} noValidate className="space-y-3">
        <div className="form-group">
          <label className="form-label" htmlFor="m-room">Room *</label>
          <select id="m-room" className={`form-select ${errors.roomNumber ? "error" : ""}`} value={roomNumber} onChange={e => setRoomNumber(e.target.value)}>
            <option value="">— Select room —</option>
            {rooms.map(r => <option key={r.id} value={r.roomNumber}>Room {r.roomNumber}</option>)}
          </select>
          {errors.roomNumber && <span className="form-error">{errors.roomNumber}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="m-date">Reading Date *</label>
          <input id="m-date" type="date" className={`form-input ${errors.readingDate ? "error" : ""}`} value={readingDate} onChange={e => setReadingDate(e.target.value)} />
          {errors.readingDate && <span className="form-error">{errors.readingDate}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="m-units">Units Reading (kWh) *</label>
          <input id="m-units" type="number" className={`form-input ${errors.units ? "error" : ""}`} value={units} onChange={e => setUnits(e.target.value)} placeholder="e.g. 1254" min="0" step="0.01" />
          {errors.units && <span className="form-error">{errors.units}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="m-notes">Notes</label>
          <textarea id="m-notes" className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes…" />
        </div>
      </form>
    </Dialog>
  );
}
