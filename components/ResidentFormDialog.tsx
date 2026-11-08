"use client";
import React, { useState, useEffect } from "react";
import Dialog from "./Dialog";

export interface ResidentFormData {
  fullName: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  roomNumber: string;
  college: string;
  course: string;
  monthlyRent: string; // as rupees string for the form
  joiningDate: string;
  status: "active" | "inactive";
  notes: string;
}

const empty: ResidentFormData = {
  fullName: "", phone: "", guardianName: "", guardianPhone: "",
  roomNumber: "", college: "", course: "", monthlyRent: "",
  joiningDate: new Date().toISOString().slice(0, 10),
  status: "active", notes: "",
};

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return <div className="form-group"><label className="form-label" htmlFor={id}>{label}</label>{children}{error && <span className="form-error">{error}</span>}</div>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: ResidentFormData) => void;
  initial?: Partial<ResidentFormData>;
  title?: string;
  existingPhones?: string[];
  currentPhone?: string;
}

export default function ResidentFormDialog({ open, onClose, onSave, initial, title = "Add Resident", existingPhones = [], currentPhone }: Props) {
  const [form, setForm] = useState<ResidentFormData>({ ...empty, ...initial });
  const [errors, setErrors] = useState<Partial<Record<keyof ResidentFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) { setForm({ ...empty, ...initial }); setErrors({}); }
  }, [open, initial]);

  const set = (field: keyof ResidentFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(err => ({ ...err, [field]: undefined }));
  };

  const validate = () => {
    const errs: Partial<Record<keyof ResidentFormData, string>> = {};
    if (!form.fullName.trim())      errs.fullName    = "Full name is required";
    if (!form.phone.trim())         errs.phone       = "Phone number is required";
    else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) errs.phone = "Enter a valid 10-digit mobile number";
    else if (existingPhones.includes(form.phone.replace(/\s/g, "")) && form.phone !== currentPhone)
      errs.phone = "A resident with this phone already exists";
    if (!form.monthlyRent)          errs.monthlyRent = "Monthly rent is required";
    else if (isNaN(Number(form.monthlyRent)) || Number(form.monthlyRent) <= 0) errs.monthlyRent = "Enter a valid rent amount";
    if (!form.joiningDate)          errs.joiningDate = "Joining date is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 300)); // simulate async
    onSave(form);
    setSaving(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="resident-form" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner" />Saving…</> : "Save Resident"}
          </button>
        </>
      }
    >
      <form id="resident-form" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-2 gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Full Name *" id="fullName" error={errors.fullName}>
              <input id="fullName" type="text" className={`form-input ${errors.fullName ? "error" : ""}`} value={form.fullName} onChange={set("fullName")} placeholder="e.g. Priya Sharma" />
            </Field>
          </div>
          <Field label="Phone Number *" id="phone" error={errors.phone}>
            <input id="phone" type="tel" className={`form-input ${errors.phone ? "error" : ""}`} value={form.phone} onChange={set("phone")} placeholder="10-digit mobile" />
          </Field>
          <Field label="Room Number" id="roomNumber" error={errors.roomNumber}>
            <input id="roomNumber" type="text" className="form-input" value={form.roomNumber} onChange={set("roomNumber")} placeholder="e.g. 101" />
          </Field>
          <Field label="Guardian Name" id="guardianName" error={errors.guardianName}>
            <input id="guardianName" type="text" className="form-input" value={form.guardianName} onChange={set("guardianName")} placeholder="Parent / Guardian" />
          </Field>
          <Field label="Guardian Phone" id="guardianPhone" error={errors.guardianPhone}>
            <input id="guardianPhone" type="tel" className="form-input" value={form.guardianPhone} onChange={set("guardianPhone")} placeholder="10-digit mobile" />
          </Field>
          <Field label="College / Institution" id="college" error={errors.college}>
            <input id="college" type="text" className="form-input" value={form.college} onChange={set("college")} placeholder="e.g. BMS College" />
          </Field>
          <Field label="Course" id="course" error={errors.course}>
            <input id="course" type="text" className="form-input" value={form.course} onChange={set("course")} placeholder="e.g. B.Tech CSE" />
          </Field>
          <Field label="Monthly Rent (₹) *" id="monthlyRent" error={errors.monthlyRent}>
            <input id="monthlyRent" type="number" className={`form-input ${errors.monthlyRent ? "error" : ""}`} value={form.monthlyRent} onChange={set("monthlyRent")} placeholder="e.g. 8000" min="1" />
          </Field>
          <Field label="Joining Date *" id="joiningDate" error={errors.joiningDate}>
            <input id="joiningDate" type="date" className={`form-input ${errors.joiningDate ? "error" : ""}`} value={form.joiningDate} onChange={set("joiningDate")} />
          </Field>
          <Field label="Status" id="status" error={errors.status}>
            <select id="status" className="form-select" value={form.status} onChange={set("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Notes" id="notes" error={errors.notes}>
              <textarea id="notes" className="form-textarea" value={form.notes} onChange={set("notes")} placeholder="Any additional notes…" rows={3} />
            </Field>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
