"use client";

import { useState, useMemo } from "react";
import { useApp, formatDateTime } from "@/lib/AppContext";
import { useToast } from "@/components/ToastProvider";
import Dialog from "@/components/Dialog";
import {
  ClipboardList,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Shield,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Clock,
} from "lucide-react";

const actionColors: Record<string, string> = {
  Created: "badge-green",
  Updated: "badge-blue",
  Deactivated: "badge-red",
  Assigned: "badge-blue",
  Unassigned: "badge-amber",
  Charged: "badge-blush",
  Payment: "badge-green",
  Generated: "badge-stone",
  Logged: "badge-stone",
  Cleared: "badge-amber",
  Voided: "badge-red",
};

type ClearMode = "all" | "older_24h" | "older_7d" | "older_30d" | "before_specific" | "custom_range";

function ClearLogsDialog({
  open,
  onClose,
  onClear,
  totalLogs,
}: {
  open: boolean;
  onClose: () => void;
  onClear: (options: { mode: "all" } | { mode: "before"; timestamp: string } | { mode: "range"; start: string; end: string }) => Promise<void>;
  totalLogs: number;
}) {
  const [mode, setMode] = useState<ClearMode>("all");
  const [beforeDate, setBeforeDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [clearing, setClearing] = useState(false);

  const handleConfirm = async () => {
    setClearing(true);
    try {
      if (mode === "all") {
        await onClear({ mode: "all" });
      } else if (mode === "older_24h") {
        const d = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        await onClear({ mode: "before", timestamp: d });
      } else if (mode === "older_7d") {
        const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        await onClear({ mode: "before", timestamp: d });
      } else if (mode === "older_30d") {
        const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        await onClear({ mode: "before", timestamp: d });
      } else if (mode === "before_specific") {
        const iso = new Date(beforeDate).toISOString();
        await onClear({ mode: "before", timestamp: iso });
      } else if (mode === "custom_range") {
        const sIso = new Date(startDate).toISOString();
        const eIso = new Date(endDate).toISOString();
        await onClear({ mode: "range", start: sIso, end: eIso });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Clear Activity Logs (Admin Only)"
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={clearing}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ backgroundColor: "#dc2626", borderColor: "#dc2626" }}
            onClick={handleConfirm}
            disabled={clearing || totalLogs === 0}
          >
            {clearing ? <><span className="spinner" /> Clearing Logs…</> : "Permanently Clear"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Administrator Permission Required</strong>
            <p className="mt-0.5 text-red-700">
              This action permanently clears activity logs from both the live cloud database and session storage.
            </p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label font-semibold text-stone-700">Select Clear Option</label>
          <div className="space-y-2 mt-2">
            {[
              { id: "all", label: "All logs up to now", desc: `Delete all ${totalLogs} activity logs recorded in the system.` },
              { id: "older_24h", label: "Logs older than 24 hours", desc: "Keep only activity from the last 24 hours." },
              { id: "older_7d", label: "Logs older than 7 days", desc: "Retain only this week's audit logs." },
              { id: "older_30d", label: "Logs older than 30 days", desc: "Prune archive entries older than a month." },
              { id: "before_specific", label: "Clear logs before a specific date and time", desc: "Choose an exact cutoff point." },
              { id: "custom_range", label: "Clear logs in a specific date and time range", desc: "Delete records between a start and end timestamp." },
            ].map(opt => (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  mode === opt.id ? "border-red-400 bg-red-50/40 text-stone-900" : "border-stone-200 hover:bg-stone-50 text-stone-700"
                }`}
              >
                <input
                  type="radio"
                  name="clear_mode"
                  className="mt-1 accent-red-600"
                  checked={mode === opt.id}
                  onChange={() => setMode(opt.id as ClearMode)}
                />
                <div className="text-xs">
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-stone-500 text-[11px] mt-0.5">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {mode === "before_specific" && (
          <div className="form-group p-3 bg-stone-50 border border-stone-200 rounded-lg">
            <label className="form-label text-xs font-semibold flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5 text-stone-500" /> Cutoff Date & Time
            </label>
            <input
              type="datetime-local"
              className="form-input text-xs"
              value={beforeDate}
              onChange={e => setBeforeDate(e.target.value)}
            />
          </div>
        )}

        {mode === "custom_range" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-stone-50 border border-stone-200 rounded-lg">
            <div className="form-group">
              <label className="form-label text-xs font-semibold flex items-center gap-1.5 mb-1">
                <Calendar className="h-3.5 w-3.5 text-stone-500" /> Start Date & Time
              </label>
              <input
                type="datetime-local"
                className="form-input text-xs"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label text-xs font-semibold flex items-center gap-1.5 mb-1">
                <Calendar className="h-3.5 w-3.5 text-stone-500" /> End Date & Time
              </label>
              <input
                type="datetime-local"
                className="form-input text-xs"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

export default function ActivityPage() {
  const app = useApp();
  const { toast } = useToast();
  const [showClear, setShowClear] = useState(false);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterTimeframe, setFilterTimeframe] = useState<"all" | "today" | "7days" | "month">("all");
  const [sortBy, setSortBy] = useState<"desc" | "asc">("desc");

  const logs = app.activityLog;

  const handleClearLogs = async (
    options: { mode: "all" } | { mode: "before"; timestamp: string } | { mode: "range"; start: string; end: string }
  ) => {
    try {
      const removed = await app.clearActivityLogs(options);
      toast(`Successfully purged ${removed} activity log record(s).`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to clear activity logs", "error");
    }
  };

  // Unique actions and types
  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => { if (l.action) set.add(l.action); });
    return Array.from(set).sort();
  }, [logs]);

  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => { if (l.entityType) set.add(l.entityType); });
    return Array.from(set).sort();
  }, [logs]);

  // Filtered & sorted logs
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return logs
      .filter(l => {
        // Search
        const q = search.toLowerCase().trim();
        const matchesSearch = !q ||
          l.action.toLowerCase().includes(q) ||
          l.entityType.toLowerCase().includes(q) ||
          l.entityLabel.toLowerCase().includes(q) ||
          (l.details && l.details.toLowerCase().includes(q));

        // Action
        const matchesAction = filterAction === "all" || l.action === filterAction;

        // Type
        const matchesType = filterType === "all" || l.entityType === filterType;

        // Timeframe
        const time = new Date(l.timestamp).getTime();
        let matchesTime = true;
        if (filterTimeframe === "today") matchesTime = time >= todayStart;
        else if (filterTimeframe === "7days") matchesTime = time >= sevenDaysAgo;
        else if (filterTimeframe === "month") matchesTime = time >= monthStart;

        return matchesSearch && matchesAction && matchesType && matchesTime;
      })
      .sort((a, b) => {
        const tA = new Date(a.timestamp).getTime();
        const tB = new Date(b.timestamp).getTime();
        return sortBy === "desc" ? tB - tA : tA - tB;
      });
  }, [logs, search, filterAction, filterType, filterTimeframe, sortBy]);

  const hasActiveFilters = search || filterAction !== "all" || filterType !== "all" || filterTimeframe !== "all" || sortBy !== "desc";

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-desc">
            {filteredLogs.length} of {logs.length} action{logs.length !== 1 ? "s" : ""} recorded
          </p>
        </div>

        {/* 'Only' Section for Admin */}
        {app.isAdmin && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="badge badge-amber text-[11px] font-semibold flex items-center gap-1">
              <Shield className="h-3 w-3" /> Admin Only
            </span>
            <button
              className="btn btn-secondary btn-sm text-red-600 border-red-200 hover:bg-red-50 flex-1 sm:flex-initial justify-center"
              onClick={() => setShowClear(true)}
              title="Clear activity logs from database"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear Logs
            </button>
          </div>
        )}
      </div>

      <div className="page-body">
        {/* Filter Controls Bar */}
        <div className="card mb-4">
          <div className="flex flex-col gap-3">
            {/* Top row: search + action pills */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  className="form-input w-full"
                  style={{ paddingLeft: "34px" }}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search logs by action, subject, details…"
                  aria-label="Search activity logs"
                />
              </div>

              {/* Timeframe quick chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "All Time" },
                  { id: "today", label: "Today" },
                  { id: "7days", label: "Last 7 Days" },
                  { id: "month", label: "This Month" },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`btn btn-sm ${filterTimeframe === t.id ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setFilterTimeframe(t.id as typeof filterTimeframe)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom row: action dropdown, entity type dropdown, sorting, reset */}
            <div className="flex flex-wrap gap-2 items-center justify-between pt-2.5 border-t border-stone-100 text-xs">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 text-stone-500 font-medium">
                  <Filter className="h-3.5 w-3.5 text-stone-400" />
                  <span>Filters:</span>
                </div>

                <select
                  className="form-select flex-1 sm:w-auto text-xs py-1 px-2.5"
                  value={filterAction}
                  onChange={e => setFilterAction(e.target.value)}
                  aria-label="Filter by action"
                >
                  <option value="all">All Actions ({uniqueActions.length})</option>
                  {uniqueActions.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>

                <select
                  className="form-select flex-1 sm:w-auto text-xs py-1 px-2.5"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  aria-label="Filter by entity type"
                >
                  <option value="all">All Types ({uniqueTypes.length})</option>
                  {uniqueTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1.5 text-stone-500 font-medium">
                  <ArrowUpDown className="h-3.5 w-3.5 text-stone-400" />
                  <span>Sort:</span>
                </div>

                <select
                  className="form-select flex-1 sm:w-auto text-xs py-1 px-2.5 font-medium"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  aria-label="Sort activity logs"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>

                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm text-xs py-1 px-2.5 text-stone-600 hover:text-stone-900"
                    onClick={() => {
                      setSearch("");
                      setFilterAction("all");
                      setFilterType("all");
                      setFilterTimeframe("all");
                      setSortBy("desc");
                    }}
                  >
                    <RotateCcw className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="card">
          {logs.length === 0 ? (
            <div className="empty-state">
              <ClipboardList style={{ width: 36, height: 36 }} />
              <h3>No activity recorded</h3>
              <p>All administrative actions, rent payments, and updates will be logged here in real time.</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="empty-state">
              <Filter style={{ width: 32, height: 32 }} />
              <h3>No activity logs match your filters</h3>
              <p>Try broadening your search term or clearing the active filters.</p>
              <button
                className="btn btn-secondary btn-sm mt-3"
                onClick={() => {
                  setSearch("");
                  setFilterAction("all");
                  setFilterType("all");
                  setFilterTimeframe("all");
                  setSortBy("desc");
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp (IST)</th>
                      <th>Action</th>
                      <th>Type</th>
                      <th>Subject</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <tr key={log.id}>
                        <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td>
                          <span className={`badge ${actionColors[log.action] ?? "badge-stone"}`}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ fontSize: "12px", color: "var(--stone-500)" }}>
                          {log.entityType}
                        </td>
                        <td style={{ fontWeight: 500 }}>{log.entityLabel}</td>
                        <td style={{ fontSize: "12px", color: "var(--stone-400)", wordBreak: "break-word" }}>
                          {log.details || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Straight Cards View */}
              <div className="sm:hidden flex flex-col gap-2.5">
                {filteredLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`badge ${actionColors[log.action] ?? "badge-stone"} text-[10px]`}>
                        {log.action}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>

                    <div>
                      <strong className="block text-sm text-stone-800 font-semibold">
                        {log.entityLabel}
                      </strong>
                      <span className="inline-block text-[11px] text-stone-500 mt-0.5">
                        {log.entityType}
                      </span>
                    </div>

                    {log.details && (
                      <p className="text-xs text-stone-600 bg-white p-2 rounded border border-stone-200/60 break-words">
                        {log.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Admin Only Modal */}
      {app.isAdmin && (
        <ClearLogsDialog
          open={showClear}
          onClose={() => setShowClear(false)}
          onClear={handleClearLogs}
          totalLogs={logs.length}
        />
      )}
    </>
  );
}