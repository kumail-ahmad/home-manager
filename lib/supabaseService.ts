import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  Resident,
  Room,
  RentCharge,
  RentPayment,
  ElectricityBill,
  ElectricityAllocation,
  ElectricityPayment,
  MeterReading,
  ActivityLog,
  PaymentMethod,
} from "./mockStore";

// ─── Data Mappers ─────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: "super_admin" | "admin" | "user";
  status: "approved" | "pending" | "rejected";
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

interface DBAdmin {
  id: string;
  email: string;
  full_name: string | null;
  role: "super_admin" | "admin";
  status: "approved" | "pending" | "rejected";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

interface DBResident {
  id: string;
  full_name: string;
  phone: string;
  guardian_name: string | null;
  guardian_phone: string | null;
  room_number: string | null;
  college: string | null;
  course: string | null;
  monthly_rent: number;
  joining_date: string;
  status: "active" | "inactive";
  notes: string | null;
}

interface DBRoom {
  id: string;
  room_number: string;
  capacity: number;
  notes: string | null;
}

interface DBRentCharge {
  id: string;
  resident_id: string;
  month: string;
  amount_paise: number;
  created_at: string;
}

interface DBRentPayment {
  id: string;
  resident_id: string;
  charge_id: string | null;
  billing_period: string;
  amount_paise: number;
  payment_date: string;
  method: string;
  reference: string | null;
  notes: string | null;
  voided_at: string | null;
  void_reason: string | null;
}

interface DBElectricityBill {
  id: string;
  period_label: string;
  period_start: string;
  period_end: string;
  total_amount_paise: number;
  allocation_method: "individual" | "shared";
  resident_ids: string[] | null;
  due_date: string | null;
  created_at: string;
}

interface DBElectricityAllocation {
  id: string;
  bill_id: string;
  resident_id: string;
  share_paise: number;
}

interface DBElectricityPayment {
  id: string;
  allocation_id: string;
  resident_id: string;
  amount_paise: number;
  payment_date: string;
  method: string;
  reference: string | null;
  notes: string | null;
  voided_at: string | null;
  void_reason: string | null;
}

interface DBMeterReading {
  id: string;
  room_number: string;
  reading_date: string;
  units: number;
  notes: string | null;
}

interface DBActivityLog {
  id: string;
  timestamp: string;
  action: string;
  entity_type: string;
  entity_label: string;
  details: string | null;
}

export async function fetchInitialDataFromSupabase(): Promise<{
  admins: AdminUser[];
  residents: Resident[];
  rooms: Room[];
  rentCharges: RentCharge[];
  rentPayments: RentPayment[];
  electricityBills: ElectricityBill[];
  electricityAllocations: ElectricityAllocation[];
  electricityPayments: ElectricityPayment[];
  meterReadings: MeterReading[];
  activityLog: ActivityLog[];
} | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const [
      resAdmins,
      resRooms,
      resResidents,
      resCharges,
      resRentPayments,
      resBills,
      resAllocs,
      resElecPayments,
      resMeters,
      resLogs,
    ] = await Promise.all([
      supabase.from("admins").select("*").order("created_at", { ascending: false }),
      supabase.from("rooms").select("*"),
      supabase.from("residents").select("*"),
      supabase.from("rent_charges").select("*"),
      supabase.from("rent_payments").select("*"),
      supabase.from("electricity_bills").select("*"),
      supabase.from("electricity_allocations").select("*"),
      supabase.from("electricity_payments").select("*"),
      supabase.from("meter_readings").select("*"),
      supabase.from("activity_logs").select("*").order("timestamp", { ascending: false }).limit(100),
    ]);

    if (resRooms.error || resResidents.error) {
      console.warn("Supabase queries failed or tables do not exist yet:", resRooms.error || resResidents.error);
      return null;
    }

    const dbAdmins: DBAdmin[] = resAdmins.data || [];
    const admins: AdminUser[] = dbAdmins.map(a => ({
      id: a.id,
      email: a.email,
      fullName: a.full_name || (a.email.toLowerCase() === "user" ? "Rameez Ahmad" : a.email.toLowerCase() === "admin" ? "Administrator" : a.email.split("@")[0]),
      role: a.role || "admin",
      status: a.status || "approved", // In allowlist table, existing entries are approved
      approvedBy: a.approved_by || undefined,
      approvedAt: a.approved_at || undefined,
      createdAt: a.created_at,
    }));

    const dbResidents: DBResident[] = resResidents.data || [];
    const residents: Resident[] = dbResidents.map(r => ({
      id: r.id,
      fullName: r.full_name,
      phone: r.phone,
      guardianName: r.guardian_name || "",
      guardianPhone: r.guardian_phone || "",
      roomNumber: r.room_number || null,
      college: r.college || "",
      course: r.course || "",
      monthlyRent: r.monthly_rent,
      joiningDate: r.joining_date,
      status: r.status,
      notes: r.notes || "",
    }));

    const dbRooms: DBRoom[] = resRooms.data || [];
    const rooms: Room[] = dbRooms.map(rm => ({
      id: rm.id,
      roomNumber: rm.room_number,
      capacity: rm.capacity,
      notes: rm.notes || "",
      residentIds: residents.filter(r => r.roomNumber === rm.room_number).map(r => r.id),
    }));

    const dbCharges: DBRentCharge[] = resCharges.data || [];
    const rentCharges: RentCharge[] = dbCharges.map(c => ({
      id: c.id,
      residentId: c.resident_id,
      month: c.month,
      amountPaise: c.amount_paise,
      createdAt: c.created_at,
    }));

    const dbRentPayments: DBRentPayment[] = resRentPayments.data || [];
    const rentPayments: RentPayment[] = dbRentPayments.map(p => ({
      id: p.id,
      residentId: p.resident_id,
      chargeId: p.charge_id,
      billingPeriod: p.billing_period,
      amountPaise: p.amount_paise,
      paymentDate: p.payment_date,
      method: (p.method as PaymentMethod) || "upi",
      reference: p.reference || "",
      notes: p.notes || "",
      voidedAt: p.voided_at || undefined,
      voidReason: p.void_reason || undefined,
    }));

    const dbBills: DBElectricityBill[] = resBills.data || [];
    const electricityBills: ElectricityBill[] = dbBills.map(b => ({
      id: b.id,
      periodLabel: b.period_label,
      periodStart: b.period_start,
      periodEnd: b.period_end,
      totalAmountPaise: b.total_amount_paise,
      allocationMethod: b.allocation_method,
      residentIds: b.resident_ids || [],
      dueDate: b.due_date || "",
      createdAt: b.created_at,
    }));

    const dbAllocs: DBElectricityAllocation[] = resAllocs.data || [];
    const electricityAllocations: ElectricityAllocation[] = dbAllocs.map(a => ({
      id: a.id,
      billId: a.bill_id,
      residentId: a.resident_id,
      sharePaise: a.share_paise,
    }));

    const dbElecPayments: DBElectricityPayment[] = resElecPayments.data || [];
    const electricityPayments: ElectricityPayment[] = dbElecPayments.map(p => ({
      id: p.id,
      allocationId: p.allocation_id,
      residentId: p.resident_id,
      amountPaise: p.amount_paise,
      paymentDate: p.payment_date,
      method: (p.method as PaymentMethod) || "upi",
      reference: p.reference || "",
      notes: p.notes || "",
      voidedAt: p.voided_at || undefined,
      voidReason: p.void_reason || undefined,
    }));

    const dbMeters: DBMeterReading[] = resMeters.data || [];
    const meterReadings: MeterReading[] = dbMeters.map(m => ({
      id: m.id,
      roomNumber: m.room_number,
      readingDate: m.reading_date,
      units: Number(m.units),
      notes: m.notes || "",
    }));

    const dbLogs: DBActivityLog[] = resLogs.data || [];
    const activityLog: ActivityLog[] = dbLogs.map(l => ({
      id: l.id,
      timestamp: l.timestamp,
      action: l.action,
      entityType: l.entity_type,
      entityLabel: l.entity_label,
      details: l.details || "",
    }));

    return {
      admins,
      residents,
      rooms,
      rentCharges,
      rentPayments,
      electricityBills,
      electricityAllocations,
      electricityPayments,
      meterReadings,
      activityLog,
    };
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    return null;
  }
}

// ─── Admin User Management ──────────────────────────────────────────────────

export async function checkAdminStatusInSupabase(email: string): Promise<AdminUser | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from("admins").select("*").eq("email", email.toLowerCase()).single();
  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name || data.email.split("@")[0],
    role: data.role || "admin",
    status: data.status || "approved", // In allowlist table, existence means approved
    approvedBy: data.approved_by || undefined,
    approvedAt: data.approved_at || undefined,
    createdAt: data.created_at,
  };
}

export async function registerAdminRequestInSupabase(email: string, fullName = ""): Promise<AdminUser> {
  const normEmail = email.toLowerCase().trim();

  // Check how many admins exist in allowlist
  const { count, error: countErr } = await supabase.from("admins").select("*", { count: "exact", head: true });
  const isFirstAdmin = !countErr && (count === 0 || count === null);

  if (isFirstAdmin) {
    // First admin is automatically inserted into allowlist
    const tryInsert = await supabase.from("admins").insert({
      email: normEmail,
      full_name: fullName || normEmail.split("@")[0],
      role: "super_admin",
      status: "approved",
    }).select().single();

    let created = tryInsert.data;
    if (tryInsert.error) {
      // Fallback if full_name column not present in schema
      const fallback = await supabase.from("admins").insert({ email: normEmail }).select().single();
      if (fallback.error) throw new Error(fallback.error.message);
      created = fallback.data;
    }

    const admin: AdminUser = {
      id: created.id,
      email: created.email,
      fullName: created.full_name || fullName || normEmail.split("@")[0],
      role: "super_admin",
      status: "approved",
      createdAt: created.created_at,
    };
    await logActivityToSupabase("Created", "Admin Account", admin.email, "Primary administrator registered");
    return admin;
  }

  // If not first admin, account requires approval before being placed in allowlist
  const pendingAdmin: AdminUser = {
    id: `pending-${Date.now()}`,
    email: normEmail,
    fullName: fullName || normEmail.split("@")[0],
    role: "admin",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await logActivityToSupabase("Requested", "Admin Account", normEmail, "Pending approval from administrator");
  return pendingAdmin;
}

export async function approveAdminInSupabase(adminId: string, approvedByEmail: string, emailToApprove?: string): Promise<void> {
  // If emailToApprove or adminId looks like an email or pending id
  const targetEmail = emailToApprove || (adminId.includes("@") ? adminId : undefined);

  if (targetEmail) {
    // Insert into allowlist table
    const { error } = await supabase.from("admins").insert({ email: targetEmail.toLowerCase() });
    if (error && !error.message.includes("unique")) throw new Error(error.message);
  } else {
    // If admin record exists with status column
    const now = new Date().toISOString();
    const { error } = await supabase.from("admins").update({
      status: "approved",
      approved_by: approvedByEmail,
      approved_at: now,
    }).eq("id", adminId);

    if (error) {
      // Fallback: check if id exists and verify
      console.warn("Could not update admin row, verifying allowlist entry:", error.message);
    }
  }

  await logActivityToSupabase("Approved", "Admin Account", targetEmail || adminId, `Approved by ${approvedByEmail}`);
}

export async function rejectAdminInSupabase(adminId: string): Promise<void> {
  const { error } = await supabase.from("admins").update({
    status: "rejected",
  }).eq("id", adminId);

  if (error) throw new Error(error.message);
  await logActivityToSupabase("Rejected", "Admin Account", adminId, "Registration request rejected");
}

export async function deleteAdminInSupabase(adminId: string): Promise<void> {
  const { error } = await supabase.from("admins").delete().eq("id", adminId);
  if (error) throw new Error(error.message);
  await logActivityToSupabase("Removed", "Admin Account", adminId, "Admin removed");
}

// ─── Supabase Write Operations ────────────────────────────────────────────────

export async function logActivityToSupabase(action: string, entityType: string, entityLabel: string, details = "") {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from("activity_logs").insert({
      action,
      entity_type: entityType,
      entity_label: entityLabel,
      details,
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}

export async function clearActivityLogsInSupabase(
  options: { mode: "all" } | { mode: "before"; timestamp: string } | { mode: "range"; start: string; end: string }
): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  try {
    if (options.mode === "all") {
      const { data, error } = await supabase
        .from("activity_logs")
        .delete()
        .gte("timestamp", "1970-01-01T00:00:00.000Z")
        .select("id");
      if (error) throw error;
      return data?.length ?? 0;
    } else if (options.mode === "before") {
      const { data, error } = await supabase
        .from("activity_logs")
        .delete()
        .lte("timestamp", options.timestamp)
        .select("id");
      if (error) throw error;
      return data?.length ?? 0;
    } else if (options.mode === "range") {
      const { data, error } = await supabase
        .from("activity_logs")
        .delete()
        .gte("timestamp", options.start)
        .lte("timestamp", options.end)
        .select("id");
      if (error) throw error;
      return data?.length ?? 0;
    }
    return 0;
  } catch (err) {
    console.error("Failed to clear activity logs in Supabase:", err);
    throw err;
  }
}

export async function addResidentToSupabase(data: Omit<Resident, "id"> & { id?: string }): Promise<Resident> {
  const row: Record<string, unknown> = {
    full_name: data.fullName,
    phone: data.phone,
    guardian_name: data.guardianName,
    guardian_phone: data.guardianPhone,
    room_number: data.roomNumber,
    college: data.college,
    course: data.course,
    monthly_rent: data.monthlyRent,
    joining_date: data.joiningDate,
    status: data.status,
    notes: data.notes,
  };
  if (data.id) row.id = data.id;

  const { data: created, error } = await supabase.from("residents").insert(row).select().single();
  if (error) throw new Error(error.message);

  const res: Resident = {
    id: created.id,
    fullName: created.full_name,
    phone: created.phone,
    guardianName: created.guardian_name || "",
    guardianPhone: created.guardian_phone || "",
    roomNumber: created.room_number || null,
    college: created.college || "",
    course: created.course || "",
    monthlyRent: created.monthly_rent,
    joiningDate: created.joining_date,
    status: created.status,
    notes: created.notes || "",
  };

  await logActivityToSupabase("Created", "Resident", res.fullName, `Room ${res.roomNumber || "—"}`);
  return res;
}

export async function updateResidentInSupabase(id: string, data: Partial<Omit<Resident, "id">>): Promise<void> {
  const patch: Record<string, string | number | null | undefined> = {};
  if (data.fullName !== undefined) patch.full_name = data.fullName;
  if (data.phone !== undefined) patch.phone = data.phone;
  if (data.guardianName !== undefined) patch.guardian_name = data.guardianName;
  if (data.guardianPhone !== undefined) patch.guardian_phone = data.guardianPhone;
  if (data.roomNumber !== undefined) patch.room_number = data.roomNumber;
  if (data.college !== undefined) patch.college = data.college;
  if (data.course !== undefined) patch.course = data.course;
  if (data.monthlyRent !== undefined) patch.monthly_rent = data.monthlyRent;
  if (data.joiningDate !== undefined) patch.joining_date = data.joiningDate;
  if (data.status !== undefined) patch.status = data.status;
  if (data.notes !== undefined) patch.notes = data.notes;

  const { error } = await supabase.from("residents").update(patch).eq("id", id);
  if (error) throw new Error(error.message);

  await logActivityToSupabase("Updated", "Resident", data.fullName || "Resident", "Updated details in Supabase");
}

export async function addRoomToSupabase(data: Omit<Room, "id"> & { id?: string }): Promise<Room> {
  const row: Record<string, unknown> = {
    room_number: data.roomNumber,
    capacity: data.capacity,
    notes: data.notes,
  };
  if (data.id) row.id = data.id;

  const { data: created, error } = await supabase.from("rooms").insert(row).select().single();
  if (error) throw new Error(error.message);

  const room: Room = {
    id: created.id,
    roomNumber: created.room_number,
    capacity: created.capacity,
    notes: created.notes || "",
    residentIds: [],
  };

  await logActivityToSupabase("Created", "Room", `Room ${room.roomNumber}`, `Capacity: ${room.capacity}`);
  return room;
}

export async function updateRoomInSupabase(id: string, data: Partial<Omit<Room, "id">>): Promise<void> {
  const patch: Record<string, string | number | null | undefined> = {};
  if (data.roomNumber !== undefined) patch.room_number = data.roomNumber;
  if (data.capacity !== undefined) patch.capacity = data.capacity;
  if (data.notes !== undefined) patch.notes = data.notes;

  const { error } = await supabase.from("rooms").update(patch).eq("id", id);
  if (error) throw new Error(error.message);

  await logActivityToSupabase("Updated", "Room", `Room ${data.roomNumber || id}`);
}

export async function addRentChargeToSupabase(data: Omit<RentCharge, "id" | "createdAt"> & { id?: string; createdAt?: string }): Promise<RentCharge> {
  const row: Record<string, unknown> = {
    resident_id: data.residentId,
    month: data.month,
    amount_paise: data.amountPaise,
  };
  if (data.id) row.id = data.id;
  if (data.createdAt) row.created_at = data.createdAt;

  const { data: created, error } = await supabase.from("rent_charges").insert(row).select().single();
  if (error) throw new Error(error.message);

  const charge: RentCharge = {
    id: created.id,
    residentId: created.resident_id,
    month: created.month,
    amountPaise: created.amount_paise,
    createdAt: created.created_at,
  };

  await logActivityToSupabase("Charged", "Rent", data.month, `Rent charge ₹${(data.amountPaise / 100).toLocaleString("en-IN")}`);
  return charge;
}

export async function addRentPaymentToSupabase(data: Omit<RentPayment, "id"> & { id?: string }): Promise<RentPayment> {
  const row: Record<string, unknown> = {
    resident_id: data.residentId,
    charge_id: data.chargeId,
    billing_period: data.billingPeriod,
    amount_paise: data.amountPaise,
    payment_date: data.paymentDate,
    method: data.method,
    reference: data.reference,
    notes: data.notes,
  };
  if (data.id) row.id = data.id;

  const { data: created, error } = await supabase.from("rent_payments").insert(row).select().single();
  if (error) throw new Error(error.message);

  const payment: RentPayment = {
    id: created.id,
    residentId: created.resident_id,
    chargeId: created.charge_id,
    billingPeriod: created.billing_period,
    amountPaise: created.amount_paise,
    paymentDate: created.payment_date,
    method: (created.method as PaymentMethod) || "upi",
    reference: created.reference || "",
    notes: created.notes || "",
  };

  await logActivityToSupabase("Payment", "Rent", data.billingPeriod, `₹${(data.amountPaise / 100).toLocaleString("en-IN")} via ${data.method}`);
  return payment;
}

export async function voidRentPaymentInSupabase(id: string, reason: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("rent_payments").update({
    voided_at: now,
    void_reason: reason,
  }).eq("id", id);

  if (error) throw new Error(error.message);
  await logActivityToSupabase("Voided", "Rent Payment", id, `Reason: ${reason}`);
}

export async function addElectricityBillToSupabase(
  billData: Omit<ElectricityBill, "id" | "createdAt"> & { id?: string; createdAt?: string },
  allocations: { id?: string; residentId: string; sharePaise: number }[]
): Promise<{ bill: ElectricityBill; allocations: ElectricityAllocation[] }> {
  const billRow: Record<string, unknown> = {
    period_label: billData.periodLabel,
    period_start: billData.periodStart,
    period_end: billData.periodEnd,
    total_amount_paise: billData.totalAmountPaise,
    allocation_method: billData.allocationMethod,
    resident_ids: billData.residentIds,
    due_date: billData.dueDate || null,
  };
  if (billData.id) billRow.id = billData.id;
  if (billData.createdAt) billRow.created_at = billData.createdAt;

  const { data: createdBill, error: billErr } = await supabase.from("electricity_bills").insert(billRow).select().single();
  if (billErr) throw new Error(billErr.message);

  const allocRows = allocations.map(a => {
    const row: Record<string, unknown> = {
      bill_id: createdBill.id,
      resident_id: a.residentId,
      share_paise: a.sharePaise,
    };
    if (a.id) row.id = a.id;
    return row;
  });

  const { data: createdAllocs, error: allocErr } = await supabase.from("electricity_allocations").insert(allocRows).select();
  if (allocErr) throw new Error(allocErr.message);

  const bill: ElectricityBill = {
    id: createdBill.id,
    periodLabel: createdBill.period_label,
    periodStart: createdBill.period_start,
    periodEnd: createdBill.period_end,
    totalAmountPaise: createdBill.total_amount_paise,
    allocationMethod: createdBill.allocation_method,
    residentIds: createdBill.resident_ids || [],
    dueDate: createdBill.due_date || "",
    createdAt: createdBill.created_at,
  };

  const allocs: ElectricityAllocation[] = (createdAllocs || []).map(a => ({
    id: a.id,
    billId: a.bill_id,
    residentId: a.resident_id,
    sharePaise: a.share_paise,
  }));

  await logActivityToSupabase("Created", "Electricity Bill", bill.periodLabel, `₹${(bill.totalAmountPaise / 100).toLocaleString("en-IN")}`);
  return { bill, allocations: allocs };
}

export async function addElectricityPaymentToSupabase(data: Omit<ElectricityPayment, "id"> & { id?: string }): Promise<ElectricityPayment> {
  const row: Record<string, unknown> = {
    allocation_id: data.allocationId,
    resident_id: data.residentId,
    amount_paise: data.amountPaise,
    payment_date: data.paymentDate,
    method: data.method,
    reference: data.reference,
    notes: data.notes,
  };
  if (data.id) row.id = data.id;

  const { data: created, error } = await supabase.from("electricity_payments").insert(row).select().single();
  if (error) throw new Error(error.message);

  const payment: ElectricityPayment = {
    id: created.id,
    allocationId: created.allocation_id,
    residentId: created.resident_id,
    amountPaise: created.amount_paise,
    paymentDate: created.payment_date,
    method: (created.method as PaymentMethod) || "upi",
    reference: created.reference || "",
    notes: created.notes || "",
  };

  await logActivityToSupabase("Payment", "Electricity", "Payment recorded", `₹${(data.amountPaise / 100).toLocaleString("en-IN")} via ${data.method}`);
  return payment;
}

export async function voidElectricityPaymentInSupabase(id: string, reason: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("electricity_payments").update({
    voided_at: now,
    void_reason: reason,
  }).eq("id", id);

  if (error) throw new Error(error.message);
  await logActivityToSupabase("Voided", "Electricity Payment", id, `Reason: ${reason}`);
}

export async function addMeterReadingToSupabase(data: Omit<MeterReading, "id"> & { id?: string }): Promise<MeterReading> {
  const row: Record<string, unknown> = {
    room_number: data.roomNumber,
    reading_date: data.readingDate,
    units: data.units,
    notes: data.notes,
  };
  if (data.id) row.id = data.id;

  const { data: created, error } = await supabase.from("meter_readings").insert(row).select().single();
  if (error) throw new Error(error.message);

  const reading: MeterReading = {
    id: created.id,
    roomNumber: created.room_number,
    readingDate: created.reading_date,
    units: Number(created.units),
    notes: created.notes || "",
  };

  await logActivityToSupabase("Logged", "Meter Reading", `Room ${reading.roomNumber}`, `${reading.units} units on ${reading.readingDate}`);
  return reading;
}
