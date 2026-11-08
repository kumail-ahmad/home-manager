"use client";
import { useApp, formatDateTime } from "@/lib/AppContext";
import { ClipboardList } from "lucide-react";

const actionColors: Record<string, string> = {
  Created: "badge-green", Updated: "badge-blue", Deactivated: "badge-red",
  Assigned: "badge-blue", Unassigned: "badge-amber", Charged: "badge-blush",
  Payment: "badge-green", Generated: "badge-stone", Logged: "badge-stone",
};

export default function ActivityPage() {
  const app = useApp();
  const logs = app.activityLog;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-desc">{logs.length} action{logs.length !== 1 ? "s" : ""} recorded this session</p>
        </div>
      </div>

      <div className="page-body">
        <div className="card">
          <p style={{ fontSize: "12px", color: "var(--stone-500)", marginBottom: "12px" }}>
            Real-time audit log recording administrative actions, resident updates, billing, and receipts.
          </p>
          {logs.length === 0 ? (
            <div className="empty-state">
              <ClipboardList style={{ width: 36, height: 36 }} />
              <h3>No activity yet</h3>
              <p>All actions you take — adding residents, recording payments, etc. — will appear here.</p>
            </div>
          ) : (
            <div className="overflow-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Timestamp (IST)</th><th>Action</th><th>Type</th><th>Subject</th><th>Details</th></tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>{formatDateTime(log.timestamp)}</td>
                      <td><span className={`badge ${actionColors[log.action] ?? "badge-stone"}`}>{log.action}</span></td>
                      <td style={{ fontSize: "12px", color: "var(--stone-500)" }}>{log.entityType}</td>
                      <td style={{ fontWeight: 500 }}>{log.entityLabel}</td>
                      <td style={{ fontSize: "12px", color: "var(--stone-400)" }}>{log.details || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
