"use client";

/**
 * AppContext — provides live state, auth status, and mutators to all components.
 * Seamlessly integrates with Supabase PostgreSQL database when configured,
 * while maintaining instantaneous UI responsiveness and fallback storage.
 */

import React, { createContext, useCallback, useContext, useEffect, useState, useMemo } from "react";
import * as store from "@/lib/mockStore";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  AdminUser,
  fetchInitialDataFromSupabase,
  checkAdminStatusInSupabase,
  approveAdminInSupabase,
  rejectAdminInSupabase,
  deleteAdminInSupabase,
  clearActivityLogsInSupabase,
  logActivityToSupabase,
  addResidentToSupabase,
  updateResidentInSupabase,
  addRoomToSupabase,
  updateRoomInSupabase,
  addRentChargeToSupabase,
  addRentPaymentToSupabase,
  voidRentPaymentInSupabase,
  addElectricityBillToSupabase,
  addElectricityPaymentToSupabase,
  voidElectricityPaymentInSupabase,
  addMeterReadingToSupabase,
} from "@/lib/supabaseService";

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
} from "@/lib/mockStore";

export type { Resident, Room, RentCharge, RentPayment, ElectricityBill, ElectricityAllocation, ElectricityPayment, MeterReading, ActivityLog, PaymentMethod, AdminUser };
export { formatRupee, formatDate, formatDateTime, currentMonthLabel, currentMonthKey, rupeeToInt, exportCSV } from "@/lib/mockStore";

/** Standard RFC4122 v4 UUID generator for PostgreSQL compatibility */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Default administrators with full control ─────────────────────────────
const DEFAULT_INITIAL_ADMINS: AdminUser[] = [
  {
    id: "admin-1",
    email: "admin",
    fullName: "admin",
    role: "super_admin",
    status: "approved",
    approvedBy: "system",
    approvedAt: "2025-01-01T00:00:00.000Z",
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "admin-2",
    email: "rameez",
    fullName: "user",
    role: "user",
    status: "approved",
    approvedBy: "admin",
    approvedAt: "2025-01-01T00:00:00.000Z",
    createdAt: "2025-01-01T00:00:00.000Z",
  },
];

// ─── Context shape ─────────────────────────────────────────────────────────────
interface AppState {
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
}

export interface DashboardStats {
  activeResidents: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  rentCharged: number;
  rentCollected: number;
  rentOutstanding: number;
  elecBilled: number;
  elecCollected: number;
  elecOutstanding: number;
}

interface AppContextValue extends AppState {
  currentUser: AdminUser | null;
  isAdmin: boolean;
  isAuthChecking: boolean;
  setCurrentUser: (user: AdminUser | null) => void;
  logout: () => Promise<void>;
  approveAdmin: (adminId: string) => Promise<void>;
  rejectAdmin: (adminId: string) => Promise<void>;
  deleteAdmin: (adminId: string) => Promise<void>;
  registerLocalAdmin: (email: string, fullName: string) => AdminUser;
  clearActivityLogs: (options: { mode: "all" } | { mode: "before"; timestamp: string } | { mode: "range"; start: string; end: string }) => Promise<number>;
  isLiveBackend: boolean;
  isLoadingBackend: boolean;
  refreshBackend: () => Promise<void>;
  dashboardStats: DashboardStats;
  addResident: (d: Omit<Resident, "id">) => Resident;
  updateResident: (id: string, d: Partial<Omit<Resident, "id">>) => Resident | null;
  deactivateResident: (id: string) => void;
  reactivateResident: (id: string) => void;
  addRoom: (d: Omit<Room, "id">) => Room;
  updateRoom: (id: string, d: Partial<Omit<Room, "id">>) => Room | null;
  assignResidentToRoom: (roomId: string, residentId: string) => { success: boolean; error?: string };
  removeResidentFromRoom: (roomId: string, residentId: string) => void;
  addRentCharge: (d: Omit<RentCharge, "id" | "createdAt">) => RentCharge;
  generateMonthlyRentCharges: (month: string) => RentCharge[];
  addRentPayment: (d: Omit<RentPayment, "id">) => RentPayment;
  voidRentPayment: (id: string, reason: string) => boolean;
  addElectricityBill: (d: Omit<ElectricityBill, "id" | "createdAt">, allocs: { residentId: string; sharePaise: number }[]) => ElectricityBill;
  addElectricityPayment: (d: Omit<ElectricityPayment, "id">) => ElectricityPayment;
  voidElectricityPayment: (id: string, reason: string) => boolean;
  addMeterReading: (d: Omit<MeterReading, "id">) => MeterReading;
  getResidentRentBalance: (id: string) => { totalCharged: number; totalPaid: number; outstanding: number; advance: number };
  getRentChargeBalance: (id: string) => { charged: number; paid: number; outstanding: number; advance: number };
  getResidentElectricityBalance: (id: string) => { totalBilled: number; totalPaid: number; outstanding: number };
  getDashboardStatsForMonth: (month?: string) => DashboardStats;
}

const AppContext = createContext<AppContextValue | null>(null);

function initialSnapshot(): AppState {
  return {
    admins: DEFAULT_INITIAL_ADMINS,
    residents: store.getResidents(),
    rooms: store.getRooms(),
    rentCharges: store.getRentCharges(),
    rentPayments: store.getRentPayments(),
    electricityBills: store.getElectricityBills(),
    electricityAllocations: store.getElectricityAllocations(),
    electricityPayments: store.getElectricityPayments(),
    meterReadings: store.getMeterReadings(),
    activityLog: store.getActivityLog(),
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialSnapshot);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(false);

  // Initialize Auth state from session cookie, localStorage or Supabase
  useEffect(() => {
    let unmounted = false;

    const initAuth = async () => {
      try {
        // 1. Check for active floral_session cookie
        const hasSessionCookie = typeof document !== "undefined" && /(?:^|;\s*)floral_session=([^;]+)/.test(document.cookie);

        // 2. Restore active user session from localStorage or sessionStorage
        const savedUser = typeof window !== "undefined"
          ? (localStorage.getItem("floral_admin_user") || sessionStorage.getItem("floral_admin_user"))
          : null;

        if (savedUser && hasSessionCookie && !unmounted) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed && (parsed.email === "admin" || parsed.email === "rameez" || parsed.email === "user")) {
              setCurrentUser(parsed);
              setIsAuthChecking(false);
              return;
            }
          } catch {
            localStorage.removeItem("floral_admin_user");
            sessionStorage.removeItem("floral_admin_user");
          }
        }

        // Clean up stale storage if no cookie is found
        if (!hasSessionCookie && typeof window !== "undefined") {
          localStorage.removeItem("floral_admin_user");
          sessionStorage.removeItem("floral_admin_user");
        }

        // 3. Supabase fallback verification
        if (isSupabaseConfigured() && hasSessionCookie) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            const admin = await checkAdminStatusInSupabase(session.user.email);
            if (!unmounted && admin && admin.status === "approved") {
              const isRealAdmin = session.user.email === "admin" || session.user.email === "admin@home.com" || session.user.email === "admin@floralhome.com";
              setCurrentUser({
                ...admin,
                fullName: isRealAdmin ? "admin" : "user",
                role: isRealAdmin ? "super_admin" : "user",
              });
              setIsAuthChecking(false);
              return;
            }
          }
        }

        if (!unmounted) {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (!unmounted) setCurrentUser(null);
      } finally {
        if (!unmounted) {
          setIsAuthChecking(false);
        }
      }
    };

    initAuth();

    return () => {
      unmounted = true;
    };
  }, []);

  // Sync currentUser with localStorage, sessionStorage & simple cross-browser cookie
  const handleSetCurrentUser = useCallback((user: AdminUser | null) => {
    setCurrentUser(user);
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("floral_admin_user", JSON.stringify(user));
        sessionStorage.setItem("floral_admin_user", JSON.stringify(user));
        // Clean alphanumeric cookie value — works reliably on mobile Safari & Chrome
        document.cookie = `floral_session=${encodeURIComponent(user.email)}; path=/; max-age=604800; SameSite=Lax`;
      } else {
        localStorage.removeItem("floral_admin_user");
        sessionStorage.removeItem("floral_admin_user");
        document.cookie = "floral_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
      }
    }
  }, []);

  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    const email = currentUser.email?.toLowerCase().trim();
    const role = currentUser.role?.toLowerCase().trim();
    return email === "admin" || email === "admin@home.com" || email === "admin@floralhome.com" || role === "super_admin";
  }, [currentUser]);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Supabase signOut error:", e);
      }
    }
    handleSetCurrentUser(null);
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = "floral_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
      window.location.replace("/login");
    }
  }, [handleSetCurrentUser]);

  // Load from Supabase if configured
  const loadSupabaseData = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setIsLoadingBackend(true);
    try {
      const data = await fetchInitialDataFromSupabase();
      if (data) {
        setState({
          admins: data.admins.length > 0 ? data.admins : DEFAULT_INITIAL_ADMINS,
          residents: data.residents,
          rooms: data.rooms,
          rentCharges: data.rentCharges,
          rentPayments: data.rentPayments,
          electricityBills: data.electricityBills,
          electricityAllocations: data.electricityAllocations,
          electricityPayments: data.electricityPayments,
          meterReadings: data.meterReadings,
          activityLog: data.activityLog,
        });
        setIsLiveBackend(true);
      }
    } catch (err) {
      console.error("Failed to load data from Supabase:", err);
    } finally {
      setIsLoadingBackend(false);
    }
  }, []);

  // Initial load and Real-Time Multi-Device Synchronization
  useEffect(() => {
    let unmounted = false;

    const syncInitial = async () => {
      await Promise.resolve();
      if (!unmounted) {
        await loadSupabaseData();
      }
    };

    void syncInitial();

    if (!isSupabaseConfigured()) return;

    // Realtime postgres changes across any table in the public schema
    const channel = supabase
      .channel("public-db-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        () => {
          if (!unmounted) {
            void loadSupabaseData();
          }
        }
      )
      .subscribe();

    // Re-synchronize whenever the window or tab regains visibility / focus
    const handleVisibilityOrFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible" && !unmounted) {
        void loadSupabaseData();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    // Periodic safety poll every 25 seconds
    const interval = setInterval(handleVisibilityOrFocus, 25000);

    return () => {
      unmounted = true;
      supabase.removeChannel(channel);
      window.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      clearInterval(interval);
    };
  }, [loadSupabaseData]);

  // Admin user approvals
  const approveAdmin = useCallback(async (adminId: string) => {
    const approverEmail = currentUser?.email || "admin";
    const target = state.admins.find(a => a.id === adminId);
    const now = new Date().toISOString();

    setState(prev => ({
      ...prev,
      admins: prev.admins.map(a => (a.id === adminId ? { ...a, status: "approved", approvedBy: approverEmail, approvedAt: now } : a)),
      activityLog: [{
        id: `act-${Date.now()}`,
        timestamp: now,
        action: "Approved",
        entityType: "Admin Account",
        entityLabel: target?.email || adminId,
        details: `Approved by ${approverEmail}`,
      }, ...prev.activityLog],
    }));

    if (isLiveBackend) {
      await approveAdminInSupabase(adminId, approverEmail, target?.email);
    }
  }, [currentUser, isLiveBackend, state.admins]);

  const rejectAdmin = useCallback(async (adminId: string) => {
    setState(prev => ({
      ...prev,
      admins: prev.admins.map(a => (a.id === adminId ? { ...a, status: "rejected" } : a)),
      activityLog: [{
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "Rejected",
        entityType: "Admin Account",
        entityLabel: adminId,
        details: "Account registration rejected",
      }, ...prev.activityLog],
    }));

    if (isLiveBackend) {
      await rejectAdminInSupabase(adminId);
    }
  }, [isLiveBackend]);

  const deleteAdmin = useCallback(async (adminId: string) => {
    setState(prev => ({
      ...prev,
      admins: prev.admins.filter(a => a.id !== adminId),
    }));

    if (isLiveBackend) {
      await deleteAdminInSupabase(adminId);
    }
  }, [isLiveBackend]);

  const registerLocalAdmin = useCallback((email: string, fullName: string): AdminUser => {
    const isFirst = state.admins.length === 0;
    const newAdmin: AdminUser = {
      id: `admin-${Date.now()}`,
      email: email.toLowerCase().trim(),
      fullName: fullName || email.split("@")[0],
      role: isFirst ? "super_admin" : "admin",
      status: isFirst ? "approved" : "pending",
      approvedBy: isFirst ? "system" : undefined,
      approvedAt: isFirst ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      admins: [newAdmin, ...prev.admins],
      activityLog: [{
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: isFirst ? "Created" : "Requested",
        entityType: "Admin Account",
        entityLabel: newAdmin.email,
        details: isFirst ? "First administrator automatically approved" : "Pending administrator approval",
      }, ...prev.activityLog],
    }));

    return newAdmin;
  }, [state.admins.length]);

  // Calculations derived directly from live state
  const getResidentRentBalance = useCallback((residentId: string) => {
    const charged = state.rentCharges.filter(c => c.residentId === residentId).reduce((sum, c) => sum + c.amountPaise, 0);
    const paid = state.rentPayments.filter(p => p.residentId === residentId && !p.voidedAt).reduce((sum, p) => sum + p.amountPaise, 0);
    const difference = paid - charged;
    return { totalCharged: charged, totalPaid: paid, outstanding: Math.max(0, -difference), advance: Math.max(0, difference) };
  }, [state.rentCharges, state.rentPayments]);

  const getRentChargeBalance = useCallback((chargeId: string) => {
    const charge = state.rentCharges.find(c => c.id === chargeId);
    const paid = state.rentPayments.filter(p => p.chargeId === chargeId && !p.voidedAt).reduce((sum, p) => sum + p.amountPaise, 0);
    const amount = charge?.amountPaise ?? 0;
    return { charged: amount, paid, outstanding: Math.max(0, amount - paid), advance: Math.max(0, paid - amount) };
  }, [state.rentCharges, state.rentPayments]);

  const getResidentElectricityBalance = useCallback((residentId: string) => {
    const allocations = state.electricityAllocations.filter(a => a.residentId === residentId);
    const billed = allocations.reduce((sum, a) => sum + a.sharePaise, 0);
    const paid = state.electricityPayments.filter(p => p.residentId === residentId && !p.voidedAt).reduce((sum, p) => sum + p.amountPaise, 0);
    return { totalBilled: billed, totalPaid: paid, outstanding: Math.max(0, billed - paid) };
  }, [state.electricityAllocations, state.electricityPayments]);

  const getDashboardStatsForMonth = useCallback((month = store.currentMonthKey()): DashboardStats => {
    const activeResidents = state.residents.filter(r => r.status === "active").length;
    const totalBeds = state.rooms.reduce((sum, room) => sum + room.capacity, 0);
    const occupiedBeds = state.rooms.reduce((sum, room) => sum + room.residentIds.length, 0);
    const charges = state.rentCharges.filter(charge => charge.month === month);
    const chargeIds = new Set(charges.map(charge => charge.id));
    const rentCharged = charges.reduce((sum, charge) => sum + charge.amountPaise, 0);
    const rentCollected = state.rentPayments
      .filter(p => !p.voidedAt && (p.billingPeriod === month || (p.chargeId && chargeIds.has(p.chargeId))))
      .reduce((sum, p) => sum + p.amountPaise, 0);
    const bills = state.electricityBills.filter(bill => bill.periodStart.startsWith(month));
    const billIds = new Set(bills.map(bill => bill.id));
    const allocations = state.electricityAllocations.filter(a => billIds.has(a.billId));
    const allocationIds = new Set(allocations.map(a => a.id));
    const elecBilled = allocations.reduce((sum, a) => sum + a.sharePaise, 0);
    const elecCollected = state.electricityPayments
      .filter(p => !p.voidedAt && allocationIds.has(p.allocationId))
      .reduce((sum, p) => sum + p.amountPaise, 0);
    return {
      activeResidents,
      totalBeds,
      occupiedBeds,
      availableBeds: totalBeds - occupiedBeds,
      rentCharged,
      rentCollected,
      rentOutstanding: Math.max(0, rentCharged - rentCollected),
      elecBilled,
      elecCollected,
      elecOutstanding: Math.max(0, elecBilled - elecCollected),
    };
  }, [state.residents, state.rooms, state.rentCharges, state.rentPayments, state.electricityBills, state.electricityAllocations, state.electricityPayments]);

  // ── Mutators ──
  const addResident = useCallback((d: Omit<Resident, "id">): Resident => {
    const id = generateUUID();
    const newRes: Resident = { ...d, id };

    setState(prev => {
      const room = d.roomNumber ? prev.rooms.find(r => r.roomNumber === d.roomNumber) : undefined;
      const updatedRooms = prev.rooms.map(rm => {
        if (room && rm.id === room.id) {
          return { ...rm, residentIds: [...rm.residentIds, id] };
        }
        return rm;
      });
      const logEntry: ActivityLog = {
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        action: "Created",
        entityType: "Resident",
        entityLabel: d.fullName,
        details: `Room ${d.roomNumber || "—"}, ${store.formatRupee(d.monthlyRent)}/mo`,
      };
      return {
        ...prev,
        residents: [...prev.residents, newRes],
        rooms: updatedRooms,
        activityLog: [logEntry, ...prev.activityLog],
      };
    });

    if (isLiveBackend) {
      addResidentToSupabase({ ...d, id }).catch(e => console.error("Supabase error adding resident:", e));
    }
    return newRes;
  }, [isLiveBackend]);

  const updateResident = useCallback((id: string, d: Partial<Omit<Resident, "id">>): Resident | null => {
    let updatedResident: Resident | null = null;
    setState(prev => {
      const existing = prev.residents.find(r => r.id === id);
      if (!existing) return prev;
      updatedResident = { ...existing, ...d };
      const nextRoomNumber = d.roomNumber === undefined ? existing.roomNumber : d.roomNumber;
      const updatedRooms = prev.rooms.map(rm => {
        const withoutResident = rm.residentIds.filter(rid => rid !== id);
        if (nextRoomNumber && rm.roomNumber === nextRoomNumber) {
          return { ...rm, residentIds: [...withoutResident, id] };
        }
        return { ...rm, residentIds: withoutResident };
      });
      return {
        ...prev,
        residents: prev.residents.map(r => (r.id === id ? updatedResident! : r)),
        rooms: updatedRooms,
      };
    });

    if (isLiveBackend) {
      updateResidentInSupabase(id, d).catch(e => console.error("Supabase error updating resident:", e));
    }
    return updatedResident;
  }, [isLiveBackend]);

  const deactivateResident = useCallback((id: string) => {
    setState(prev => {
      const res = prev.residents.find(r => r.id === id);
      return {
        ...prev,
        residents: prev.residents.map(r => (r.id === id ? { ...r, status: "inactive", roomNumber: null } : r)),
        rooms: prev.rooms.map(rm => ({ ...rm, residentIds: rm.residentIds.filter(rid => rid !== id) })),
        activityLog: res ? [{
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "Deactivated",
          entityType: "Resident",
          entityLabel: res.fullName,
          details: "Marked inactive",
        }, ...prev.activityLog] : prev.activityLog,
      };
    });

    if (isLiveBackend) {
      updateResidentInSupabase(id, { status: "inactive", roomNumber: null }).catch(e => console.error("Supabase deactivation error:", e));
    }
  }, [isLiveBackend]);

  const reactivateResident = useCallback((id: string) => {
    setState(prev => {
      const res = prev.residents.find(r => r.id === id);
      return {
        ...prev,
        residents: prev.residents.map(r => (r.id === id ? { ...r, status: "active" } : r)),
        activityLog: res ? [{
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "Reactivated",
          entityType: "Resident",
          entityLabel: res.fullName,
          details: "Marked active",
        }, ...prev.activityLog] : prev.activityLog,
      };
    });

    if (isLiveBackend) {
      updateResidentInSupabase(id, { status: "active" }).catch(e => console.error("Supabase reactivation error:", e));
    }
  }, [isLiveBackend]);

  const addRoom = useCallback((d: Omit<Room, "id">): Room => {
    const id = generateUUID();
    const newRoom: Room = { ...d, id, residentIds: d.residentIds || [] };
    setState(prev => ({
      ...prev,
      rooms: [...prev.rooms, newRoom],
      activityLog: [{
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        action: "Created",
        entityType: "Room",
        entityLabel: `Room ${d.roomNumber}`,
        details: `Capacity: ${d.capacity}`,
      }, ...prev.activityLog],
    }));

    if (isLiveBackend) {
      addRoomToSupabase({ ...d, id }).catch(e => console.error("Supabase add room error:", e));
    }
    return newRoom;
  }, [isLiveBackend]);

  const updateRoom = useCallback((id: string, d: Partial<Omit<Room, "id">>): Room | null => {
    let updatedRoom: Room | null = null;
    setState(prev => {
      const existing = prev.rooms.find(r => r.id === id);
      if (!existing) return prev;
      updatedRoom = { ...existing, ...d };
      return {
        ...prev,
        rooms: prev.rooms.map(r => (r.id === id ? updatedRoom! : r)),
      };
    });

    if (isLiveBackend) {
      updateRoomInSupabase(id, d).catch(e => console.error("Supabase update room error:", e));
    }
    return updatedRoom;
  }, [isLiveBackend]);

  const assignResidentToRoom = useCallback((roomId: string, residentId: string): { success: boolean; error?: string } => {
    const targetRoom = state.rooms.find(r => r.id === roomId);
    const targetResident = state.residents.find(r => r.id === residentId);
    if (!targetRoom || !targetResident) return { success: false, error: "Not found" };
    if (targetRoom.residentIds.length >= targetRoom.capacity) return { success: false, error: "Room at full capacity" };

    setState(prev => ({
      ...prev,
      rooms: prev.rooms.map(rm => {
        const withoutRes = rm.residentIds.filter(rid => rid !== residentId);
        if (rm.id === roomId) {
          return { ...rm, residentIds: [...withoutRes, residentId] };
        }
        return { ...rm, residentIds: withoutRes };
      }),
      residents: prev.residents.map(r => (r.id === residentId ? { ...r, roomNumber: targetRoom.roomNumber } : r)),
      activityLog: [{
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        action: "Assigned",
        entityType: "Room",
        entityLabel: `Room ${targetRoom.roomNumber}`,
        details: `${targetResident.fullName} assigned to room ${targetRoom.roomNumber}`,
      }, ...prev.activityLog],
    }));

    if (isLiveBackend) {
      updateResidentInSupabase(residentId, { roomNumber: targetRoom.roomNumber }).catch(e => console.error("Supabase assignment error:", e));
    }
    return { success: true };
  }, [state.rooms, state.residents, isLiveBackend]);

  const removeResidentFromRoom = useCallback((roomId: string, residentId: string) => {
    const targetRoom = state.rooms.find(r => r.id === roomId);
    const targetResident = state.residents.find(r => r.id === residentId);
    setState(prev => ({
      ...prev,
      rooms: prev.rooms.map(rm => (rm.id === roomId ? { ...rm, residentIds: rm.residentIds.filter(rid => rid !== residentId) } : rm)),
      residents: prev.residents.map(r => (r.id === residentId ? { ...r, roomNumber: null } : r)),
      activityLog: targetResident && targetRoom ? [{
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        action: "Unassigned",
        entityType: "Room",
        entityLabel: `Room ${targetRoom.roomNumber}`,
        details: `${targetResident.fullName} unassigned`,
      }, ...prev.activityLog] : prev.activityLog,
    }));

    if (isLiveBackend) {
      updateResidentInSupabase(residentId, { roomNumber: null }).catch(e => console.error("Supabase remove room error:", e));
    }
  }, [state.rooms, state.residents, isLiveBackend]);

  const addRentCharge = useCallback((d: Omit<RentCharge, "id" | "createdAt">): RentCharge => {
    const id = generateUUID();
    const now = new Date().toISOString();
    const charge: RentCharge = {
      ...d,
      id,
      createdAt: now,
    };
    setState(prev => ({
      ...prev,
      rentCharges: [...prev.rentCharges, charge],
    }));

    if (isLiveBackend) {
      addRentChargeToSupabase({ ...d, id, createdAt: now }).catch(e => console.error("Supabase add rent charge error:", e));
    }
    return charge;
  }, [isLiveBackend]);

  const generateMonthlyRentCharges = useCallback((month: string): RentCharge[] => {
    const activeWithoutCharge = state.residents.filter(
      r => r.status === "active" && !state.rentCharges.some(c => c.residentId === r.id && c.month === month)
    );
    const now = new Date().toISOString();
    const createdList: RentCharge[] = activeWithoutCharge.map(r => ({
      id: generateUUID(),
      residentId: r.id,
      month,
      amountPaise: r.monthlyRent,
      createdAt: now,
    }));

    setState(prev => ({
      ...prev,
      rentCharges: [...prev.rentCharges, ...createdList],
      activityLog: [{
        id: generateUUID(),
        timestamp: now,
        action: "Generated",
        entityType: "Rent Charges",
        entityLabel: month,
        details: `${createdList.length} charge(s) created for ${month}`,
      }, ...prev.activityLog],
    }));

    if (isLiveBackend) {
      createdList.forEach(charge => {
        addRentChargeToSupabase({
          id: charge.id,
          residentId: charge.residentId,
          month: charge.month,
          amountPaise: charge.amountPaise,
          createdAt: charge.createdAt,
        }).catch(e => console.error("Supabase charge generation error:", e));
      });
    }
    return createdList;
  }, [state.residents, state.rentCharges, isLiveBackend]);

  const addRentPayment = useCallback((d: Omit<RentPayment, "id">): RentPayment => {
    const id = generateUUID();
    const payment: RentPayment = {
      ...d,
      id,
    };
    const res = state.residents.find(r => r.id === d.residentId);

    setState(prev => ({
      ...prev,
      rentPayments: [...prev.rentPayments, payment],
      activityLog: [{
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        action: "Payment",
        entityType: "Rent",
        entityLabel: res?.fullName || d.residentId,
        details: `${store.formatRupee(d.amountPaise)} via ${d.method.toUpperCase()}`,
      }, ...prev.activityLog],
    }));

    if (isLiveBackend) {
      addRentPaymentToSupabase({ ...d, id }).catch(e => console.error("Supabase add rent payment error:", e));
    }
    return payment;
  }, [state.residents, isLiveBackend]);

  const voidRentPayment = useCallback((id: string, reason: string): boolean => {
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      rentPayments: prev.rentPayments.map(p => (p.id === id ? { ...p, voidedAt: now, voidReason: reason } : p)),
    }));

    if (isLiveBackend) {
      voidRentPaymentInSupabase(id, reason).catch(e => console.error("Supabase void payment error:", e));
    }
    return true;
  }, [isLiveBackend]);

  const addElectricityBill = useCallback((d: Omit<ElectricityBill, "id" | "createdAt">, allocs: { residentId: string; sharePaise: number }[]): ElectricityBill => {
    const billId = generateUUID();
    const now = new Date().toISOString();
    const bill: ElectricityBill = {
      ...d,
      id: billId,
      createdAt: now,
    };
    const createdAllocs: ElectricityAllocation[] = allocs.map(a => ({
      id: generateUUID(),
      billId,
      residentId: a.residentId,
      sharePaise: a.sharePaise,
    }));

    setState(prev => ({
      ...prev,
      electricityBills: [...prev.electricityBills, bill],
      electricityAllocations: [...prev.electricityAllocations, ...createdAllocs],
      activityLog: [{
        id: generateUUID(),
        timestamp: now,
        action: "Created",
        entityType: "Electricity Bill",
        entityLabel: d.periodLabel,
        details: `${store.formatRupee(d.totalAmountPaise)} for ${allocs.length} resident(s)`,
      }, ...prev.activityLog],
    }));

    if (isLiveBackend) {
      addElectricityBillToSupabase({ ...d, id: billId, createdAt: now }, createdAllocs).catch(e => console.error("Supabase add elec bill error:", e));
    }
    return bill;
  }, [isLiveBackend]);

  const addElectricityPayment = useCallback((d: Omit<ElectricityPayment, "id">): ElectricityPayment => {
    const id = generateUUID();
    const payment: ElectricityPayment = {
      ...d,
      id,
    };
    const res = state.residents.find(r => r.id === d.residentId);

    setState(prev => ({
      ...prev,
      electricityPayments: [...prev.electricityPayments, payment],
      activityLog: [{
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        action: "Payment",
        entityType: "Electricity",
        entityLabel: res?.fullName || d.residentId,
        details: `${store.formatRupee(d.amountPaise)} via ${d.method.toUpperCase()}`,
      }, ...prev.activityLog],
    }));

    if (isLiveBackend) {
      addElectricityPaymentToSupabase({ ...d, id }).catch(e => console.error("Supabase elec payment error:", e));
    }
    return payment;
  }, [state.residents, isLiveBackend]);

  const voidElectricityPayment = useCallback((id: string, reason: string): boolean => {
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      electricityPayments: prev.electricityPayments.map(p => (p.id === id ? { ...p, voidedAt: now, voidReason: reason } : p)),
    }));

    if (isLiveBackend) {
      voidElectricityPaymentInSupabase(id, reason).catch(e => console.error("Supabase void elec payment error:", e));
    }
    return true;
  }, [isLiveBackend]);

  const addMeterReading = useCallback((d: Omit<MeterReading, "id">): MeterReading => {
    const id = generateUUID();
    const reading: MeterReading = {
      ...d,
      id,
    };

    setState(prev => ({
      ...prev,
      meterReadings: [...prev.meterReadings, reading],
      activityLog: [{
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        action: "Logged",
        entityType: "Meter Reading",
        entityLabel: `Room ${d.roomNumber}`,
        details: `${d.units} units on ${d.readingDate}`,
      }, ...prev.activityLog],
    }));

    if (isLiveBackend) {
      addMeterReadingToSupabase({ ...d, id }).catch(e => console.error("Supabase add meter reading error:", e));
    }
    return reading;
  }, [isLiveBackend]);

  const clearActivityLogs = useCallback(async (
    options: { mode: "all" } | { mode: "before"; timestamp: string } | { mode: "range"; start: string; end: string }
  ): Promise<number> => {
    if (!isAdmin) {
      throw new Error("Unauthorized: Only the admin can clear activity logs.");
    }

    let removedCount = 0;
    const prevLogs = state.activityLog;
    let remainingLogs: ActivityLog[] = [];

    if (options.mode === "all") {
      removedCount = prevLogs.length;
      remainingLogs = [];
    } else if (options.mode === "before") {
      const cutoff = new Date(options.timestamp).getTime();
      remainingLogs = prevLogs.filter(l => new Date(l.timestamp).getTime() > cutoff);
      removedCount = prevLogs.length - remainingLogs.length;
    } else if (options.mode === "range") {
      const startT = new Date(options.start).getTime();
      const endT = new Date(options.end).getTime();
      remainingLogs = prevLogs.filter(l => {
        const t = new Date(l.timestamp).getTime();
        return t < startT || t > endT;
      });
      removedCount = prevLogs.length - remainingLogs.length;
    }

    if (isLiveBackend) {
      try {
        await clearActivityLogsInSupabase(options);
      } catch (err) {
        console.error("Supabase log deletion error:", err);
      }
    }

    const clearedLog: ActivityLog = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      action: "Cleared",
      entityType: "System Audit",
      entityLabel: "Activity Logs",
      details: options.mode === "all"
        ? `Admin cleared all activity logs (${removedCount} records)`
        : options.mode === "before"
        ? `Admin cleared logs before ${new Date(options.timestamp).toLocaleString("en-IN")} (${removedCount} records)`
        : `Admin cleared logs from ${new Date(options.start).toLocaleString("en-IN")} to ${new Date(options.end).toLocaleString("en-IN")} (${removedCount} records)`,
    };

    const finalLogs = [clearedLog, ...remainingLogs];
    setState(prev => ({ ...prev, activityLog: finalLogs }));

    if (isLiveBackend) {
      await logActivityToSupabase(clearedLog.action, clearedLog.entityType, clearedLog.entityLabel, clearedLog.details);
    }

    return removedCount;
  }, [isAdmin, state.activityLog, isLiveBackend]);

  const dashboardStats = getDashboardStatsForMonth();

  return (
    <AppContext.Provider
      value={{
        ...state,
        currentUser,
        isAdmin,
        isAuthChecking,
        setCurrentUser: handleSetCurrentUser,
        logout,
        approveAdmin,
        rejectAdmin,
        deleteAdmin,
        registerLocalAdmin,
        clearActivityLogs,
        isLiveBackend,
        isLoadingBackend,
        refreshBackend: loadSupabaseData,
        dashboardStats,
        addResident,
        updateResident,
        deactivateResident,
        reactivateResident,
        addRoom,
        updateRoom,
        assignResidentToRoom,
        removeResidentFromRoom,
        addRentCharge,
        generateMonthlyRentCharges,
        addRentPayment,
        voidRentPayment,
        addElectricityBill,
        addElectricityPayment,
        voidElectricityPayment,
        addMeterReading,
        getResidentRentBalance,
        getRentChargeBalance,
        getResidentElectricityBalance,
        getDashboardStatsForMonth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
