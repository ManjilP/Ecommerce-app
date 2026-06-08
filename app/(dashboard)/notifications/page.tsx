"use client";
import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead, markAllNotificationsRead, clearAllNotifications } from "@/lib/api";
import { Bell, CheckCheck, CheckCircle, Trash2 } from "lucide-react";

interface Notification { id: number; type: string; title: string; message: string; is_read: boolean; created_at: string; }

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getNotifications()
      .then((r) => setNotifications(Array.isArray(r.data) ? r.data : r.data.results ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const [clearing, setClearing] = useState(false);
  const handleMarkRead = async (id: number) => { await markNotificationRead(id); load(); };
  const handleMarkAllRead = async () => { await markAllNotificationsRead(); load(); };
  const handleClearAll = async () => {
    if (!confirm("Delete all notifications?")) return;
    setClearing(true);
    try { await clearAllNotifications(notifications.map((n) => n.id)); setNotifications([]); }
    catch { load(); } finally { setClearing(false); }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.1, display: "flex", alignItems: "center", gap: "12px" }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{ fontSize: "14px", fontWeight: 600, padding: "3px 10px", borderRadius: "99px", background: "rgba(14,116,144,0.15)", color: "var(--accent)" }}>
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p style={{ fontSize: "16px", color: "var(--text-2)", marginTop: "6px" }}>{notifications.length} total</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 20px", height: "44px", borderRadius: "12px", fontSize: "15px", fontWeight: 500, color: "var(--accent)", background: "rgba(14,116,144,0.1)", border: "1px solid rgba(14,116,144,0.2)", cursor: "pointer" }}>
              <CheckCircle size={16} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={handleClearAll} disabled={clearing} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 20px", height: "44px", borderRadius: "12px", fontSize: "15px", fontWeight: 500, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", cursor: clearing ? "not-allowed" : "pointer" }}>
              <Trash2 size={16} /> {clearing ? "Clearing..." : "Clear all"}
            </button>
          )}
        </div>
      </div>

      {loading ? <p style={{ color: "var(--text-3)" }}>Loading...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                borderRadius: "16px",
                padding: "20px 24px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
                background: n.is_read ? "var(--card)" : "rgba(14,116,144,0.06)",
                border: `1px solid ${n.is_read ? "var(--border)" : "rgba(14,116,144,0.2)"}`,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  {!n.is_read && <span style={{ width: "8px", height: "8px", borderRadius: "99px", background: "var(--accent)", flexShrink: 0 }} />}
                  <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>{n.title}</span>
                  <span style={{ fontSize: "12px", padding: "2px 10px", borderRadius: "99px", background: "var(--card-2)", color: "var(--text-2)" }}>
                    {n.type.replace(/_/g, " ")}
                  </span>
                </div>
                <p style={{ fontSize: "15px", color: "var(--text-2)", marginBottom: "6px" }}>{n.message}</p>
                <p style={{ fontSize: "13px", color: "var(--text-3)" }}>{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, color: "var(--accent)", background: "rgba(14,116,144,0.1)", border: "1px solid rgba(14,116,144,0.2)", cursor: "pointer", flexShrink: 0 }}
                >
                  <CheckCheck size={14} /> Mark read
                </button>
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <Bell size={40} color="var(--border-strong)" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: "16px", color: "var(--text-3)" }}>No notifications.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
