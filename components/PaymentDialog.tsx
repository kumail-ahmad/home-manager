"use client";
import React, { useEffect, useState } from "react";
import Dialog from "./Dialog";
import type { Resident, PaymentMethod } from "@/lib/AppContext";

export interface PaymentFormData {
  residentId: string;
  category: "rent" | "electricity";
  billingPeriod: string;
  amountStr: string;
  paymentDate: string;
  method: PaymentMethod;
  reference: string;
  notes: string;
}

const emptyPayment = (): PaymentFormData => ({
  residentId: "", category: "rent", billingPeriod: new Date().toISOString().slice(0, 7), amountStr: "",
  paymentDate: new Date().toISOString().slice(0, 10),
  method: "upi", reference: "", notes: "",
});

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return <div className="form-group"><label className="form-label" htmlFor={id}>{label}</label>{children}{error && <span className="form-error">{error}</span>}</div>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: PaymentFormData) => void;
  residents: Resident[];
  defaultResidentId?: string;
  defaultCategory?: "rent" | "electricity";
  defaultBillingPeriod?: string;
}

export default function PaymentDialog({ open, onClose, onSave, residents, defaultResidentId, defaultCategory, defaultBillingPeriod }: Props) {
  const [form, setForm] = useState<PaymentFormData>(emptyPayment());
  const [errors, setErrors] = useState<Partial<Record<keyof PaymentFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ ...emptyPayment(), residentId: defaultResidentId ?? "", category: defaultCategory ?? "rent", billingPeriod: defaultBillingPeriod ?? emptyPayment().billingPeriod });
      setErrors({});
    }
  }, [open, defaultResidentId, defaultCategory, defaultBillingPeriod]);

  const set = (field: keyof PaymentFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(err => ({ ...err, [field]: undefined }));
  };

  const validate = () => {
    const errs: Partial<Record<keyof PaymentFormData, string>> = {};
    if (!form.residentId)    errs.residentId = "Please select a resident";
    if (!form.amountStr || isNaN(Number(form.amountStr)) || Number(form.amountStr) <= 0)
      errs.amountStr = "Enter a valid amount greater than 0";
    if (!form.paymentDate)   errs.paymentDate = "Payment date is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave(form);
    setSaving(false);
  };

  const activeResidents = residents.filter(r => r.status === "active");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Record Payment"
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="payment-form" className="btn btn-sage" disabled={saving}>
            {saving ? <><span className="spinner" />Saving…</> : "Record Payment"}
          </button>
        </>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit} noValidate className="space-y-3">
        <Field label="Resident *" id="pay-resident" error={errors.residentId}>
          <select id="pay-resident" className={`form-select ${errors.residentId ? "error" : ""}`} value={form.residentId} onChange={set("residentId")}>
            <option value="">— Select resident —</option>
            {activeResidents.map(r => (
              <option key={r.id} value={r.id}>{r.fullName}{r.roomNumber ? ` (Room ${r.roomNumber})` : ""}</option>
            ))}
          </select>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Category *" id="pay-category" error={undefined}>
            <select id="pay-category" className="form-select" value={form.category} onChange={set("category")}>
              <option value="rent">Rent</option>
              <option value="electricity">Electricity</option>
            </select>
          </Field>
          <Field label="Amount (₹) *" id="pay-amount" error={errors.amountStr}>
            <input id="pay-amount" type="number" className={`form-input ${errors.amountStr ? "error" : ""}`} value={form.amountStr} onChange={set("amountStr")} placeholder="e.g. 8000" min="1" step="0.01" />
          </Field>
        </div>

        <Field label="Billing Period *" id="pay-period" error={errors.billingPeriod}>
          <input id="pay-period" type="month" className={`form-input ${errors.billingPeriod ? "error" : ""}`} value={form.billingPeriod} onChange={set("billingPeriod")} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Payment Date *" id="pay-date" error={errors.paymentDate}>
            <input id="pay-date" type="date" className={`form-input ${errors.paymentDate ? "error" : ""}`} value={form.paymentDate} onChange={set("paymentDate")} />
          </Field>
          <Field label="Payment Method" id="pay-method" error={undefined}>
            <select id="pay-method" className="form-select" value={form.method} onChange={set("method")}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>

        <Field label="Reference / Transaction ID" id="pay-ref" error={undefined}>
          <input id="pay-ref" type="text" className="form-input" value={form.reference} onChange={set("reference")} placeholder="UPI ref, UTR, cheque no…" />
        </Field>

        <Field label="Notes" id="pay-notes" error={undefined}>
          <textarea id="pay-notes" className="form-textarea" value={form.notes} onChange={set("notes")} rows={2} placeholder="Optional notes…" />
        </Field>
      </form>
    </Dialog>
  );
}
