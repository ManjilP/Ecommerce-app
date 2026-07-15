"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducts, getOrders, getWarehouses, trackOrder, cancelOrder, deleteOrder, updateOrderStatus } from "@/lib/api";
import { Package, ShoppingCart, Warehouse, Building2, ArrowUpRight, MapPin, Ban, Trash2, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { OrderTracking } from "@/components/ui/order-tracking";

interface OrderItem { id: number; product_name: string; quantity: number; }
interface Order { id: number; customer_name: string; status: string; payment_method?: string; total_price: string; created_at: string; items: OrderItem[]; }
interface TrackTimeline { stage: string; status: string; timestamp: string | null; }
interface TrackInfo { order_id: number; customer_name: string; current_status: string; delivery_city: string; total_price: string; payment_method: string; payment_status: string; timeline: TrackTimeline[]; }

const statusColor: Record<string, string> = {
  pending: "var(--orange)",
  completed: "var(--green)",
  cancelled: "var(--red)",
  processing: "var(--blue)",
  shipped: "var(--purple)",
};

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ products: 0, orders: 0, inventory: 0, warehouses: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackModal, setTrackModal] = useState(false);
  const [trackData, setTrackData] = useState<TrackInfo | null>(null);

  const nextStatus: Record<string, string> = { pending: "processing", processing: "shipped", shipped: "completed" };

  const handleTrack = async (id: number) => {
    const r = await trackOrder(id);
    setTrackData(r.data);
    setTrackModal(true);
  };

  const reload = async () => {
    const o = await getOrders();
    const orders: Order[] = Array.isArray(o.data) ? o.data : o.data.results ?? [];
    setRecentOrders(orders.slice(0, 10));
    setStats(s => ({ ...s, orders: o.data.count ?? orders.length }));
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Cancel this order?")) return;
    await cancelOrder(id); await reload();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this order?")) return;
    await deleteOrder(id); await reload();
  };

  const handleAdvance = async (id: number, currentStatus: string) => {
    const next = nextStatus[currentStatus];
    if (!next) return;
    await updateOrderStatus(id, next); await reload();
  };

  useEffect(() => {
    if (sessionStorage.getItem("is_admin") !== "true") { router.replace("/orders"); return; }
    Promise.allSettled([getProducts(), getOrders(), getWarehouses()])
      .then(([p, o, w]) => {
        const pData = p.status === "fulfilled" ? p.value.data : null;
        const oData = o.status === "fulfilled" ? o.value.data : null;
        const wData = w.status === "fulfilled" ? w.value.data : null;
        const orders: Order[] = oData ? (Array.isArray(oData) ? oData : oData.results ?? []) : [];
        setStats({
          products: pData ? (pData.count ?? (Array.isArray(pData) ? pData.length : 0)) : 0,
          orders: oData ? (oData.count ?? orders.length) : 0,
          inventory: 0,
          warehouses: wData ? (wData.count ?? (Array.isArray(wData) ? wData.length : 0)) : 0,
        });
        setRecentOrders(orders.slice(0, 10));
      })
      .finally(() => setLoading(false));
  }, [router]);

  const cards = [
    { label: "Products", value: stats.products, icon: <Package size={22} />, color: "var(--purple)", bg: "rgba(167,139,250,0.1)", href: "/products" },
    { label: "Orders", value: stats.orders, icon: <ShoppingCart size={22} />, color: "var(--blue)", bg: "rgba(96,165,250,0.1)", href: "/orders" },
    { label: "Inventory", value: stats.inventory, icon: <Warehouse size={22} />, color: "var(--green)", bg: "rgba(52,211,153,0.1)", href: "/inventory" },
    { label: "Warehouses", value: stats.warehouses, icon: <Building2 size={22} />, color: "var(--orange)", bg: "rgba(251,146,60,0.1)", href: "/warehouses" },
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
      <p style={{ color: "var(--text-3)", fontSize: "16px" }}>Loading...</p>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.1 }}>Admin Panel</h1>
        <p style={{ fontSize: "16px", color: "var(--text-2)", marginTop: "6px" }}>System overview and alerts</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {cards.map((c) => (
          <Link key={c.label} href={c.href} style={{ textDecoration: "none" }}>
            <div style={{ borderRadius: "20px", padding: "24px", background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ padding: "10px", borderRadius: "12px", background: c.bg, color: c.color }}>{c.icon}</div>
                <ArrowUpRight size={16} style={{ color: "var(--text-3)" }} />
              </div>
              <p style={{ fontSize: "36px", fontWeight: 800, color: "var(--text)", letterSpacing: "-1px", lineHeight: 1 }}>{c.value}</p>
              <p style={{ fontSize: "14px", color: "var(--text-2)", marginTop: "6px" }}>{c.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div style={{ borderRadius: "20px", padding: "24px", background: "var(--card)", border: "1px solid var(--border)", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: "10px" }}>
            <ShoppingCart size={18} color="var(--blue)" /> Recent Orders
          </h2>
          <Link href="/orders" style={{ fontSize: "13px", fontWeight: 500, color: "var(--accent)" }}>See all →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p style={{ fontSize: "15px", color: "var(--text-3)" }}>No orders yet.</p>
        ) : (
          <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr>{["ID", "Customer", "Products", "Payment", "Total", "Status", "Date", "Actions"].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td className="font-mono text-xs" style={{ color: "var(--text-3)" }}>#{o.id}</td>
                    <td style={{ fontWeight: 500, color: "var(--text)" }}>{o.customer_name}</td>
                    <td style={{ color: "var(--text-2)", fontSize: "13px" }}>
                      {o.items?.slice(0, 2).map(i => i.product_name).join(", ")}
                      {o.items?.length > 2 && ` +${o.items.length - 2}`}
                    </td>
                    <td><span style={{ padding: "2px 10px", borderRadius: "99px", fontSize: "12px", fontWeight: 500, background: "var(--card-2)", color: "var(--text-2)", fontFamily: "monospace" }}>{o.payment_method ?? "cod"}</span></td>
                    <td style={{ fontWeight: 600, color: "var(--green)" }}>Rs. {parseFloat(o.total_price).toFixed(2)}</td>
                    <td>
                      <span style={{ padding: "2px 10px", borderRadius: "99px", fontSize: "12px", fontWeight: 500, background: `color-mix(in srgb, ${statusColor[o.status] ?? "var(--text-3)"} 12%, transparent)`, color: statusColor[o.status] ?? "var(--text-3)" }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-3)", fontSize: "13px" }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                        {([
                          { show: true, onClick: () => handleTrack(o.id), bg: "var(--purple)", icon: <MapPin size={12} />, label: "Track" },
                          { show: o.status !== "cancelled" && o.status !== "completed", onClick: () => handleAdvance(o.id, o.status), bg: "var(--blue)", icon: <ArrowRight size={12} />, label: "Advance" },
                          { show: o.status !== "cancelled", onClick: () => handleCancel(o.id), bg: "var(--yellow)", icon: <Ban size={12} />, label: "Cancel" },
                          { show: true, onClick: () => handleDelete(o.id), bg: "var(--red)", icon: <Trash2 size={12} />, label: "Delete" },
                        ] as { show: boolean; onClick: () => void; bg: string; icon: React.ReactNode; label: string }[]).filter(b => b.show).map((btn, i) => (
                          <button key={i} onClick={btn.onClick}
                            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", border: "none", background: btn.bg, color: "var(--card)", fontSize: "11px", fontWeight: 500, cursor: "pointer", transition: "opacity 0.15s", whiteSpace: "nowrap" }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                            {btn.icon}{btn.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ponytail: stock alerts removed — lowStock never loaded from backend, always empty */}

      {trackModal && trackData && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(16px)" }}>
          <div style={{ width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", borderRadius: "24px", padding: "28px", background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "0 40px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: "10px" }}>
                <MapPin size={20} color="var(--purple)" /> Order #{trackData.order_id}
              </h2>
              <button onClick={() => setTrackModal(false)} style={{ width: "30px", height: "30px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)" }}><X size={15} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
              {[
                { label: "Customer", value: trackData.customer_name },
                { label: "City", value: trackData.delivery_city },
                { label: "Total", value: `Rs. ${parseFloat(trackData.total_price).toFixed(2)}` },
                { label: "Payment", value: trackData.payment_method?.toUpperCase() },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: "12px 14px", borderRadius: "12px", background: "var(--card-2)", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</p>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{value}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-2)" }}>Current status:</span>
              <span style={{ padding: "4px 12px", borderRadius: "99px", fontSize: "13px", fontWeight: 600, background: `color-mix(in srgb, ${statusColor[trackData.current_status] ?? "var(--text-3)"} 14%, transparent)`, color: statusColor[trackData.current_status] ?? "var(--text-3)" }}>
                {trackData.current_status}
              </span>
            </div>
            {trackData.timeline && trackData.timeline.length > 0 && (
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-2)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Timeline</p>
                <OrderTracking
                  steps={trackData.timeline.map((step) => ({
                    name: step.stage,
                    timestamp: step.timestamp ? new Date(step.timestamp).toLocaleString() : "Pending",
                    isCompleted: step.status === "completed",
                  }))}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

