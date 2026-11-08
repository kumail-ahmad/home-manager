/**
 * Initial data store.
 *
 * The store provides fallback local state when cloud database connectivity
 * is being configured.
 */

export type ResidentStatus = "active" | "inactive";
export type PaymentMethod = "cash" | "upi" | "bank_transfer" | "cheque" | "other";
export type PaymentStatus = "paid" | "partial" | "unpaid" | "advance";
export type RoomStatus = "full" | "available" | "empty";

export interface Resident {
  id: string;
  fullName: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  roomNumber: string | null;
  college: string;
  course: string;
  monthlyRent: number;
  joiningDate: string;
  status: ResidentStatus;
  notes: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  residentIds: string[];
  notes: string;
}

export interface RentCharge {
  id: string;
  residentId: string;
  month: string;
  amountPaise: number;
  createdAt: string;
}

export interface RentPayment {
  id: string;
  residentId: string;
  chargeId: string | null;
  billingPeriod: string;
  amountPaise: number;
  paymentDate: string;
  method: PaymentMethod;
  reference: string;
  notes: string;
  voidedAt?: string;
  voidReason?: string;
}

export interface ElectricityBill {
  id: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  totalAmountPaise: number;
  allocationMethod: "individual" | "shared";
  residentIds: string[];
  dueDate: string;
  createdAt: string;
}

export interface ElectricityAllocation {
  id: string;
  billId: string;
  residentId: string;
  sharePaise: number;
}

export interface ElectricityPayment {
  id: string;
  allocationId: string;
  residentId: string;
  amountPaise: number;
  paymentDate: string;
  method: PaymentMethod;
  reference: string;
  notes: string;
  voidedAt?: string;
  voidReason?: string;
}

export interface MeterReading {
  id: string;
  roomNumber: string;
  readingDate: string;
  units: number;
  notes: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityLabel: string;
  details: string;
}

let residents: Resident[] = [];
let rooms: Room[] = [];
let rentCharges: RentCharge[] = [];
let rentPayments: RentPayment[] = [];
let electricityBills: ElectricityBill[] = [];
let electricityAllocations: ElectricityAllocation[] = [];
let electricityPayments: ElectricityPayment[] = [];
let meterReadings: MeterReading[] = [];
let activityLog: ActivityLog[] = [];

const id = (prefix: string, number: number) => `${prefix}-${number}`;
const now = () => new Date().toISOString();
const currentMonth = () => currentMonthKey();

function seedInitialData() {
  const month = currentMonth();
  const previous = (() => {
    const d = new Date(`${month}-01T12:00:00`);
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  residents = [
    ["Ananya Rao", "9876501001", "Meera Rao", "9876502001", "BMS College of Engineering", "B.Tech CSE", "101"],
    ["Diya Nair", "9876501002", "Suresh Nair", "9876502002", "Mount Carmel College", "B.Com", "101"],
    ["Ishita Menon", "9876501003", "Kavita Menon", "9876502003", "Christ University", "BBA", "101"],
    ["Kavya Shah", "9876501004", "Rakesh Shah", "9876502004", "PES University", "B.Arch", "102"],
    ["Megha Iyer", "9876501005", "Latha Iyer", "9876502005", "RV College of Engineering", "B.Tech ECE", "102"],
    ["Nandini Das", "9876501006", "Anil Das", "9876502006", "St. Joseph's University", "BA Economics", "201"],
    ["Pooja Kulkarni", "9876501007", "Sunita Kulkarni", "9876502007", "Bangalore University", "MCA", "201"],
    ["Riya Thomas", "9876501008", "Mathew Thomas", "9876502008", "Christ University", "M.Sc Psychology", "202"],
    ["Saanvi Gupta", "9876501009", "Nitin Gupta", "9876502009", "Jain University", "B.Des", "202"],
    ["Tanvi Bhat", "9876501010", "Shobha Bhat", "9876502010", "BMS College of Engineering", "B.Tech IT", "301"],
    ["Vaishnavi Joshi", "9876501011", "Amit Joshi", "9876502011", "Mount Carmel College", "B.Sc", "301"],
    ["Zoya Khan", "9876501012", "Farah Khan", "9876502012", "PES University", "BCA", "302"],
    ["Aditi Sen", "9876501013", "Madhuri Sen", "9876502013", "Jain University", "MBA", ""],
    ["Bhavana Shetty", "9876501014", "Ramesh Shetty", "9876502014", "Bangalore University", "M.Com", ""],
  ].map((r, index): Resident => ({
    id: id("resident", index + 1), fullName: r[0], phone: r[1], guardianName: r[2], guardianPhone: r[3],
    college: r[4], course: r[5], roomNumber: r[6] || null, monthlyRent: 780000 + (index % 3) * 20000,
    joiningDate: `${2025 + (index % 2)}-0${(index % 8) + 1}-05`, status: "active", notes: index === 4 ? "Prefers UPI for payments." : "",
  }));

  rooms = [
    { id: id("room", 1), roomNumber: "101", capacity: 3, residentIds: ["resident-1", "resident-2", "resident-3"], notes: "North wing" },
    { id: id("room", 2), roomNumber: "102", capacity: 3, residentIds: ["resident-4", "resident-5"], notes: "North wing" },
    { id: id("room", 3), roomNumber: "201", capacity: 4, residentIds: ["resident-6", "resident-7"], notes: "Garden-facing" },
    { id: id("room", 4), roomNumber: "202", capacity: 4, residentIds: ["resident-8", "resident-9"], notes: "Garden-facing" },
    { id: id("room", 5), roomNumber: "301", capacity: 4, residentIds: ["resident-10", "resident-11"], notes: "Quiet floor" },
    { id: id("room", 6), roomNumber: "302", capacity: 4, residentIds: ["resident-12"], notes: "Quiet floor" },
    { id: id("room", 7), roomNumber: "401", capacity: 4, residentIds: [], notes: "Available" },
  ];

  const createdAt = `${month}-01T08:00:00.000Z`;
  rentCharges = residents.flatMap((resident, index) => [
    { id: id("rent-prev", index + 1), residentId: resident.id, month: previous, amountPaise: resident.monthlyRent, createdAt },
    { id: id("rent", index + 1), residentId: resident.id, month, amountPaise: resident.monthlyRent, createdAt },
  ]);

  rentPayments = residents.flatMap((resident, index) => {
    const previousAmount = resident.monthlyRent;
    const currentAmount = index < 7 ? resident.monthlyRent : index < 10 ? Math.round(resident.monthlyRent * 0.45) : 0;
    return [
      ...(previousAmount ? [{ id: id("rent-payment-prev", index + 1), residentId: resident.id, chargeId: id("rent-prev", index + 1), billingPeriod: previous, amountPaise: previousAmount, paymentDate: `${previous}-06T10:30:00.000Z`, method: index % 2 ? "upi" as const : "bank_transfer" as const, reference: `FH${previous.replace("-", "")}P${index + 1}`, notes: "Monthly payment" }] : []),
      ...(currentAmount ? [{ id: id("rent-payment", index + 1), residentId: resident.id, chargeId: id("rent", index + 1), billingPeriod: month, amountPaise: currentAmount, paymentDate: `${month}-05T10:30:00.000Z`, method: index % 3 ? "upi" as const : "cash" as const, reference: `FH${month.replace("-", "")}P${index + 1}`, notes: "Monthly payment" }] : []),
    ];
  });

  const selectedResidents = residents.filter(r => r.status === "active").map(r => r.id);
  const bill: ElectricityBill = { id: "bill-1", periodLabel: new Date(`${month}-01T12:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" }), periodStart: `${month}-01`, periodEnd: `${month}-25`, totalAmountPaise: 240000, allocationMethod: "shared", residentIds: selectedResidents, dueDate: `${month}-30`, createdAt };
  electricityBills = [bill];
  const baseShare = Math.floor(bill.totalAmountPaise / selectedResidents.length);
  electricityAllocations = selectedResidents.map((residentId, index) => ({ id: id("allocation", index + 1), billId: bill.id, residentId, sharePaise: baseShare + (index < bill.totalAmountPaise % selectedResidents.length ? 1 : 0) }));
  electricityPayments = electricityAllocations.slice(0, 6).map((allocation, index) => ({ id: id("electricity-payment", index + 1), allocationId: allocation.id, residentId: allocation.residentId, amountPaise: allocation.sharePaise, paymentDate: `${month}-08T12:00:00.000Z`, method: "upi" as const, reference: `ELEC${month.replace("-", "")}${index + 1}`, notes: "Utility payment" }));
  meterReadings = [
    { id: "meter-1", roomNumber: "101", readingDate: `${month}-25`, units: 1248, notes: "Monthly reading" },
    { id: "meter-2", roomNumber: "201", readingDate: `${month}-25`, units: 986, notes: "Monthly reading" },
  ];
  activityLog = [
    { id: "activity-1", timestamp: `${month}-08T12:00:00.000Z`, action: "Payment", entityType: "Electricity", entityLabel: residents[0].fullName, details: `₹${(electricityPayments[0].amountPaise / 100).toLocaleString("en-IN")} via UPI` },
    { id: "activity-2", timestamp: `${month}-05T10:30:00.000Z`, action: "Payment", entityType: "Rent", entityLabel: residents[0].fullName, details: `₹${(residents[0].monthlyRent / 100).toLocaleString("en-IN")} via UPI` },
    { id: "activity-3", timestamp: `${month}-01T08:00:00.000Z`, action: "Created", entityType: "Electricity Bill", entityLabel: bill.periodLabel, details: "₹2,400 shared across 14 residents" },
  ];
}

seedInitialData();

export const getResidents = () => [...residents];
export const getRooms = () => [...rooms];
export const getRentCharges = () => [...rentCharges];
export const getRentPayments = () => [...rentPayments];
export const getElectricityBills = () => [...electricityBills];
export const getElectricityAllocations = () => [...electricityAllocations];
export const getElectricityPayments = () => [...electricityPayments];
export const getMeterReadings = () => [...meterReadings];
export const getActivityLog = () => [...activityLog].reverse();

function logActivity(action: string, entityType: string, entityLabel: string, details = "") {
  activityLog.push({ id: `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: now(), action, entityType, entityLabel, details });
}

export function addResident(data: Omit<Resident, "id">): Resident {
  const room = data.roomNumber ? rooms.find(r => r.roomNumber === data.roomNumber) : undefined;
  if (room && room.residentIds.length >= room.capacity) throw new Error("That room is at full capacity.");
  if (data.phone && residents.some(r => r.phone === data.phone)) throw new Error("A resident with this phone already exists.");
  const resident: Resident = { ...data, id: `resident-${Date.now()}` };
  residents.push(resident);
  if (room) room.residentIds.push(resident.id);
  logActivity("Created", "Resident", resident.fullName, `Room ${resident.roomNumber ?? "—"}, ${formatRupee(resident.monthlyRent)}/mo`);
  return resident;
}

export function updateResident(id: string, data: Partial<Omit<Resident, "id">>): Resident | null {
  const resident = residents.find(r => r.id === id);
  if (!resident) return null;
  if (data.phone && residents.some(r => r.id !== id && r.phone === data.phone)) throw new Error("A resident with this phone already exists.");
  const nextRoomNumber = data.roomNumber === undefined ? resident.roomNumber : data.roomNumber;
  const nextRoom = nextRoomNumber ? rooms.find(r => r.roomNumber === nextRoomNumber) : undefined;
  if (nextRoom && !nextRoom.residentIds.includes(id) && nextRoom.residentIds.length >= nextRoom.capacity) throw new Error("That room is at full capacity.");
  rooms.forEach(room => { room.residentIds = room.residentIds.filter(residentId => residentId !== id); });
  Object.assign(resident, data);
  resident.roomNumber = nextRoom?.roomNumber ?? null;
  if (nextRoom) nextRoom.residentIds.push(id);
  logActivity("Updated", "Resident", resident.fullName, "Resident details updated");
  return resident;
}

export function deactivateResident(id: string): void {
  const resident = residents.find(r => r.id === id);
  if (!resident) return;
  resident.status = "inactive";
  rooms.forEach(room => { room.residentIds = room.residentIds.filter(residentId => residentId !== id); });
  resident.roomNumber = null;
  logActivity("Deactivated", "Resident", resident.fullName, "Marked inactive; room history preserved");
}

export function reactivateResident(id: string): void {
  const resident = residents.find(r => r.id === id);
  if (!resident) return;
  resident.status = "active";
  logActivity("Reactivated", "Resident", resident.fullName, "Marked active");
}

export function addRoom(data: Omit<Room, "id">): Room {
  if (rooms.some(room => room.roomNumber.toLowerCase() === data.roomNumber.toLowerCase())) throw new Error("A room with that name already exists.");
  const room = { ...data, id: `room-${Date.now()}` };
  rooms.push(room);
  logActivity("Created", "Room", `Room ${room.roomNumber}`, `Capacity: ${room.capacity}`);
  return room;
}

export function updateRoom(id: string, data: Partial<Omit<Room, "id">>): Room | null {
  const room = rooms.find(r => r.id === id);
  if (!room) return null;
  const capacity = data.capacity ?? room.capacity;
  if (capacity < room.residentIds.length) throw new Error(`Resolve ${room.residentIds.length - capacity} occupant(s) before reducing capacity.`);
  if (data.roomNumber && rooms.some(r => r.id !== id && r.roomNumber.toLowerCase() === data.roomNumber!.toLowerCase())) throw new Error("A room with that name already exists.");
  Object.assign(room, data);
  logActivity("Updated", "Room", `Room ${room.roomNumber}`, `Capacity: ${room.capacity}`);
  residents.forEach(resident => { if (room.residentIds.includes(resident.id)) resident.roomNumber = room.roomNumber; });
  return room;
}

export function assignResidentToRoom(roomId: string, residentId: string): { success: boolean; error?: string } {
  const room = rooms.find(r => r.id === roomId);
  const resident = residents.find(r => r.id === residentId);
  if (!room || !resident) return { success: false, error: "Resident or room not found." };
  if (room.residentIds.includes(residentId)) return { success: false, error: "Resident is already assigned to this room." };
  if (room.residentIds.length >= room.capacity) return { success: false, error: "Room is at full capacity." };
  rooms.forEach(existing => { existing.residentIds = existing.residentIds.filter(id => id !== residentId); });
  room.residentIds.push(residentId);
  const previousRoom = resident.roomNumber;
  resident.roomNumber = room.roomNumber;
  logActivity("Assigned", "Room", `Room ${room.roomNumber}`, `${resident.fullName} moved from Room ${previousRoom ?? "—"}`);
  return { success: true };
}

export function removeResidentFromRoom(roomId: string, residentId: string): void {
  const room = rooms.find(r => r.id === roomId);
  const resident = residents.find(r => r.id === residentId);
  if (!room) return;
  room.residentIds = room.residentIds.filter(id => id !== residentId);
  if (resident) resident.roomNumber = null;
  logActivity("Unassigned", "Room", `Room ${room.roomNumber}`, `${resident?.fullName ?? residentId} removed`);
}

export function addRentCharge(data: Omit<RentCharge, "id" | "createdAt">): RentCharge {
  if (rentCharges.some(c => c.residentId === data.residentId && c.month === data.month)) throw new Error("This resident already has a rent charge for that month.");
  const charge = { ...data, id: `rent-${Date.now()}`, createdAt: now() };
  rentCharges.push(charge);
  logActivity("Charged", "Rent", residentName(data.residentId), `${data.month}: ${formatRupee(data.amountPaise)}`);
  return charge;
}

export function generateMonthlyRentCharges(month: string): RentCharge[] {
  const created = residents.filter(r => r.status === "active" && !rentCharges.some(c => c.residentId === r.id && c.month === month)).map(r => addRentCharge({ residentId: r.id, month, amountPaise: r.monthlyRent }));
  logActivity("Generated", "Rent Charges", month, `${created.length} charge(s) created`);
  return created;
}

export function addRentPayment(data: Omit<RentPayment, "id">): RentPayment {
  const charge = data.chargeId ? rentCharges.find(c => c.id === data.chargeId) : rentCharges.find(c => c.residentId === data.residentId && c.month === data.billingPeriod);
  const payment = { ...data, chargeId: charge?.id ?? data.chargeId ?? null, id: `rent-payment-${Date.now()}` };
  rentPayments.push(payment);
  logActivity("Payment", "Rent", residentName(data.residentId), `${formatRupee(data.amountPaise)} via ${data.method}`);
  return payment;
}

export function getResidentRentBalance(residentId: string) {
  const charged = rentCharges.filter(c => c.residentId === residentId).reduce((sum, c) => sum + c.amountPaise, 0);
  const paid = rentPayments.filter(p => p.residentId === residentId && !p.voidedAt).reduce((sum, p) => sum + p.amountPaise, 0);
  const difference = paid - charged;
  return { totalCharged: charged, totalPaid: paid, outstanding: Math.max(0, -difference), advance: Math.max(0, difference) };
}

export function getRentChargeBalance(chargeId: string) {
  const charge = rentCharges.find(c => c.id === chargeId);
  const paid = rentPayments.filter(p => p.chargeId === chargeId && !p.voidedAt).reduce((sum, p) => sum + p.amountPaise, 0);
  const amount = charge?.amountPaise ?? 0;
  return { charged: amount, paid, outstanding: Math.max(0, amount - paid), advance: Math.max(0, paid - amount) };
}

export function addElectricityBill(data: Omit<ElectricityBill, "id" | "createdAt">, allocations: { residentId: string; sharePaise: number }[]): ElectricityBill {
  const allocationTotal = allocations.reduce((sum, allocation) => sum + allocation.sharePaise, 0);
  if (allocationTotal !== data.totalAmountPaise) throw new Error("Electricity allocations must add up to the total bill.");
  const bill = { ...data, id: `bill-${Date.now()}`, createdAt: now() };
  electricityBills.push(bill);
  allocations.forEach(allocation => electricityAllocations.push({ ...allocation, id: `allocation-${Date.now()}-${Math.random().toString(36).slice(2)}`, billId: bill.id }));
  logActivity("Created", "Electricity Bill", data.periodLabel, `${formatRupee(data.totalAmountPaise)} for ${allocations.length} resident(s)`);
  return bill;
}

export function addElectricityPayment(data: Omit<ElectricityPayment, "id">): ElectricityPayment {
  const payment = { ...data, id: `electricity-payment-${Date.now()}` };
  electricityPayments.push(payment);
  logActivity("Payment", "Electricity", residentName(data.residentId), `${formatRupee(data.amountPaise)} via ${data.method}`);
  return payment;
}

export function getResidentElectricityBalance(residentId: string) {
  const allocations = electricityAllocations.filter(a => a.residentId === residentId);
  const billed = allocations.reduce((sum, allocation) => sum + allocation.sharePaise, 0);
  const paid = electricityPayments.filter(p => p.residentId === residentId && !p.voidedAt).reduce((sum, payment) => sum + payment.amountPaise, 0);
  return { totalBilled: billed, totalPaid: paid, outstanding: Math.max(0, billed - paid) };
}

export function addMeterReading(data: Omit<MeterReading, "id">): MeterReading {
  const reading = { ...data, id: `meter-${Date.now()}` };
  meterReadings.push(reading);
  logActivity("Logged", "Meter Reading", `Room ${data.roomNumber}`, `${data.units} units on ${data.readingDate}`);
  return reading;
}

export function getDashboardStats(month = currentMonthKey()) {
  const activeResidents = residents.filter(r => r.status === "active").length;
  const totalBeds = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const occupiedBeds = rooms.reduce((sum, room) => sum + room.residentIds.length, 0);
  const charges = rentCharges.filter(charge => charge.month === month);
  const chargeIds = new Set(charges.map(charge => charge.id));
  const rentCharged = charges.reduce((sum, charge) => sum + charge.amountPaise, 0);
  const rentCollected = rentPayments.filter(payment => !payment.voidedAt && (payment.billingPeriod === month || (payment.chargeId && chargeIds.has(payment.chargeId)))).reduce((sum, payment) => sum + payment.amountPaise, 0);
  const bills = electricityBills.filter(bill => bill.periodStart.startsWith(month));
  const billIds = new Set(bills.map(bill => bill.id));
  const allocations = electricityAllocations.filter(allocation => billIds.has(allocation.billId));
  const allocationIds = new Set(allocations.map(allocation => allocation.id));
  const elecBilled = allocations.reduce((sum, allocation) => sum + allocation.sharePaise, 0);
  const elecCollected = electricityPayments.filter(payment => !payment.voidedAt && allocationIds.has(payment.allocationId)).reduce((sum, payment) => sum + payment.amountPaise, 0);
  return { activeResidents, totalBeds, occupiedBeds, availableBeds: totalBeds - occupiedBeds, rentCharged, rentCollected, rentOutstanding: Math.max(0, rentCharged - rentCollected), elecBilled, elecCollected, elecOutstanding: Math.max(0, elecBilled - elecCollected) };
}

export function voidRentPayment(paymentId: string, reason: string): boolean {
  const payment = rentPayments.find(item => item.id === paymentId);
  if (!payment || payment.voidedAt) return false;
  payment.voidedAt = now(); payment.voidReason = reason;
  logActivity("Adjusted", "Rent Payment", residentName(payment.residentId), `Payment history retained; reason: ${reason}`);
  return true;
}

export function voidElectricityPayment(paymentId: string, reason: string): boolean {
  const payment = electricityPayments.find(item => item.id === paymentId);
  if (!payment || payment.voidedAt) return false;
  payment.voidedAt = now(); payment.voidReason = reason;
  logActivity("Adjusted", "Electricity Payment", residentName(payment.residentId), `Payment history retained; reason: ${reason}`);
  return true;
}

function residentName(residentId: string) { return residents.find(resident => resident.id === residentId)?.fullName ?? residentId; }

export function formatRupee(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function currentMonthLabel(): string { return new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", month: "long", year: "numeric" }); }
export function currentMonthKey(): string {
  const date = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
export function rupeeToInt(value: string): number { const parsed = Number(value.replace(/,/g, "")); return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0; }

export function exportCSV(filename: string, headers: string[], rows: string[][]): void {
  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}
