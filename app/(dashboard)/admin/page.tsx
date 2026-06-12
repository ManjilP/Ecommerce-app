"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducts, getOrders, getInventory, getWarehouses } from "@/lib/api";
import { Package, ShoppingCart, Warehouse, Building2, AlertTriangle, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ products: 0, orders: 0, inventory: 0, warehouses: 0 });
  const [lowStock, setLowStock] = useState<{ stock_status: string; id: number; product_name: string; warehouse_name: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("is_admin") !== "true") { router.replace("/orders"); return; }
    Promise.all([getProducts(), getOrders(), getInventory(), getWarehouses()])
      .then(([p, o, i, w]) => {
        const inventory = Array.isArray(i.data) ? i.data : i.data.results ?? [];
        setStats({
          products: p.data.count ?? (Array.isArray(p.data) ? p.data.length : 0),
          orders: o.data.count ?? (Array.isArray(o.data) ? o.data.length : 0),
          inventory: i.data.count ?? inventory.length,
          warehouses: w.data.count ?? (Array.isArray(w.data) ? w.data.length : 0),
        });
        setLowStock(inventory.filter((item: { stock_status: string }) => item.stock_status === "low_stock" || item.stock_status === "out_of_stock"));
      })
      .finally(() => setLoading(false));
  }, [router]);

  const cards = [
    { label: "Products", value: stats.products, icon: <Package size={22} />, color: "#a78bfa", bg: "rgba(167,139,250,0.1)", href: "/products" },
    { label: "Orders", value: stats.orders, icon: <ShoppingCart size={22} />, color: "#60a5fa", bg: "rgba(96,165,250,0.1)", href: "/orders" },
    { label: "Inventory", value: stats.inventory, icon: <Warehouse size={22} />, color: "#34d399", bg: "rgba(52,211,153,0.1)", href: "/inventory" },
    { label: "Warehouses", value: stats.warehouses, icon: <Building2 size={22} />, color: "#fb923c", bg: "rgba(251,146,60,0.1)", href: "/warehouses" },
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

      <div style={{ borderRadius: "20px", padding: "24px", background: "var(--card)", border: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertTriangle size={18} color="#fb923c" /> Stock Alerts
        </h2>
        {lowStock.length === 0 ? (
          <p style={{ fontSize: "15px", color: "var(--text-3)" }}>All stock levels are healthy.</p>
        ) : (
          <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}>
            <table>
              <thead>
                <tr>{["Product", "Warehouse", "Qty", "Status"].map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {lowStock.map((item) => (
                  <tr key={item.id}>
                    <td style={{ color: "var(--text)", fontWeight: 500 }}>{item.product_name}</td>
                    <td style={{ color: "var(--text-2)" }}>{item.warehouse_name}</td>
                    <td style={{ color: "var(--text)", fontWeight: 600 }}>{item.quantity}</td>
                    <td>
                      <span style={{ padding: "4px 12px", borderRadius: "99px", fontSize: "13px", fontWeight: 500, background: item.stock_status === "out_of_stock" ? "rgba(248,113,113,0.12)" : "rgba(251,146,60,0.12)", color: item.stock_status === "out_of_stock" ? "#f87171" : "#fb923c" }}>
                        {item.stock_status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

