"use client";
import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead, markAllNotificationsRead, clearAllNotifications } from "@/lib/api";
import { Bell, CheckCheck, Trash2, ShoppingCart, Package, Tag, AlertTriangle, Info } from "lucide-react";

interface Notification { id: number; type: string; title: string; message: string; is_read: boolean; created_at: string; }

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  order:        { icon: <ShoppingCart size={16} />, color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  order_status: { icon: <ShoppingCart size={16} />, color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  product:      { icon: <Package size={16} />,      color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  coupon:       { icon: <Tag size={16} />,           color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  alert:        { icon: <AlertTriangle size={16} />, color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  default:      { icon: <Info size={16} />,          color: "#0e7490", bg: "rgba(14,116,144,0.12)" },
};

function getTypeConfig(type: string) {
  const key = Object.keys(typeConfig).find(k => type?.toLowerCase().includes(k));
  return typeConfig[key ?? "default"];
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const load = () => {
    setLoading(true);
    getNotifications()
      .then((r) => setNotifications(Array.isArray(r.data) ? r.data : r.data.results ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
              <span style={{ fontSize: "13px", fontWeight: 600, padding: "3px 10px", borderRadius: "99px", background: "rgba(14,116,144,0.15)", color: "#0e7490" }}>
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p style={{ fontSize: "16px", color: "var(--text-2)", marginTop: "6px" }}>{notifications.length} total</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 20px", height: "40px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, color: "#0071E3", background: "transparent", border: "1.5px solid rgba(0,113,227,0.5)", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,113,227,0.06)"; e.currentTarget.style.borderColor = "#0071E3"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(0,113,227,0.5)"; }}>
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={handleClearAll} disabled={clearing}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 16px", height: "40px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, color: "#f87171", background: "transparent", border: "1.5px solid rgba(248,113,113,0.5)", cursor: clearing ? "not-allowed" : "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.06)"; e.currentTarget.style.borderColor = "#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.5)"; }}>
              <Trash2 size={15} /> {clearing ? "Clearing..." : "Clear all"}
            </button>
          )}
        </div>
      </div>

      {loading ? <p style={{ color: "var(--text-3)" }}>Loading...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {notifications.map((n) => {
            const cfg = getTypeConfig(n.type);
            return (
              <div key={n.id} style={{
                borderRadius: "16px",
                padding: "22px 24px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                background: "var(--card)",
                border: `1px solid ${n.is_read ? "var(--border)" : "rgba(0,113,227,0.35)"}`,
                borderLeft: `4px solid ${n.is_read ? "var(--border)" : "#0071E3"}`,
                transition: "border-color 0.15s",
              }}>
                {/* Type icon */}
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: cfg.bg, color: cfg.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
                    {!n.is_read && <span style={{ width: "7px", height: "7px", borderRadius: "99px", background: "#0071E3", flexShrink: 0 }} />}
                    <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{n.title || "Notification"}</span>
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: cfg.bg, color: cfg.color, fontWeight: 500 }}>
                      {n.type?.replace(/_/g, " ") || "general"}
                    </span>
                  </div>
                  <p style={{ fontSize: "14px", color: "var(--text-2)", marginBottom: "5px", lineHeight: 1.5 }}>{n.message}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-3)" }}>{new Date(n.created_at).toLocaleString()}</p>
                </div>

                {/* Action */}
                {!n.is_read && (
                  <button onClick={() => handleMarkRead(n.id)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 14px", height: "36px", borderRadius: "8px", border: "1.5px solid rgba(0,113,227,0.5)", background: "transparent", color: "#0071E3", fontSize: "13px", fontWeight: 500, cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,113,227,0.06)"; e.currentTarget.style.borderColor = "#0071E3"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(0,113,227,0.5)"; }}>
                    <CheckCheck size={13} /> Mark read
                  </button>
                )}
              </div>
            );
          })}
          {notifications.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <Bell size={40} color="var(--border-strong)" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: "16px", color: "var(--text-3)" }}>No notifications yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
