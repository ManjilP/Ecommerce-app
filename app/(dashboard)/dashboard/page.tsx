﻿"use client";
import { useEffect, useState } from "react";
import { getProducts, getOrders, getInventory, getTopProducts, getSalesChart } from "@/lib/api";
import { Package, ShoppingCart, Warehouse, TrendingUp, ArrowUpRight, Activity } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Order { id: number; customer_name: string; status: string; total_price: string; created_at: string; }
interface TopProduct { product__name: string; total_sold: number; total_revenue: number; }
interface SalesPoint { label: string; total_revenue: number; }

const statusColor: Record<string, string> = {
  pending: "#fb923c",
  completed: "#34d399",
  cancelled: "#f87171",
  processing: "#60a5fa",
  shipped: "#a78bfa",
};

function BentoCard({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-3xl ${className}`}
      style={{ background: "var(--card)", border: "1px solid var(--border)", padding: "28px", ...style }}
    >
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ products: 0, orders: 0, inventory: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesData, setSalesData] = useState<SalesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("is_admin") !== "true") {
      router.replace("/orders");
      return;
    }
    Promise.all([
      getProducts(), getOrders(), getInventory(), getTopProducts(30), getSalesChart("daily", 14),
    ]).then(([p, o, i, tp, sc]) => {
      const orders: Order[] = Array.isArray(o.data) ? o.data : o.data.results ?? [];
      const revenue = orders.reduce((s, ord) => s + parseFloat(ord.total_price || "0"), 0);
      setStats({
        products: Array.isArray(p.data) ? p.data.length : p.data.count ?? 0,
        orders: Array.isArray(o.data) ? o.data.length : o.data.count ?? 0,
        inventory: Array.isArray(i.data) ? i.data.length : i.data.count ?? 0,
        revenue,
      });
      setRecentOrders(orders.slice(0, 5));
      setTopProducts((Array.isArray(tp.data) ? tp.data : tp.data.results ?? []).slice(0, 5));
      setSalesData((Array.isArray(sc.data) ? sc.data : sc.data.results ?? []).slice(-10));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const maxRevenue = Math.max(...salesData.map((s) => s.total_revenue), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <h1 style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)" }}>Overview</h1>
        <p style={{ fontSize: "15px", color: "var(--text-2)", marginTop: "6px" }}>Here&apos;s what&apos;s happening with your inventory.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">

        {/* Orders "” 2 cols */}
        <BentoCard
          className="col-span-2 flex flex-col justify-between"
          style={{ minHeight: "190px", background: "var(--bento-orders-bg)", borderColor: "var(--bento-orders-border)" }}
        >
          <div className="flex items-start justify-between">
            <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bento-orders-label)" }}>Total Orders</p>
            <div className="p-2.5 rounded-xl" style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.15)" }}>
              <ShoppingCart size={20} color="#60a5fa" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: "56px", fontWeight: 800, letterSpacing: "-2px", color: "var(--text)", lineHeight: 1 }}>{stats.orders}</p>
            <Link href="/orders" className="flex items-center gap-1.5 mt-4" style={{ fontSize: "13px", fontWeight: 500, color: "#60a5fa", width: "fit-content" }}>
              View all orders <ArrowUpRight size={14} />
            </Link>
          </div>
        </BentoCard>

        {/* Revenue */}
        <BentoCard
          className="flex flex-col justify-between"
          style={{ minHeight: "190px", background: "var(--bento-revenue-bg)", borderColor: "var(--bento-revenue-border)" }}
        >
          <div className="flex items-start justify-between">
            <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bento-revenue-label)" }}>Revenue</p>
            <div className="p-2.5 rounded-xl" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.15)" }}>
              <TrendingUp size={20} color="#34d399" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-1px", color: "var(--text)", lineHeight: 1 }}>Rs. {stats.revenue.toFixed(0)}</p>
            <Link href="/reports" className="flex items-center gap-1.5 mt-4" style={{ fontSize: "13px", fontWeight: 500, color: "#34d399", width: "fit-content" }}>
              Reports <ArrowUpRight size={14} />
            </Link>
          </div>
        </BentoCard>

        {/* Products */}
        <BentoCard
          className="flex flex-col justify-between"
          style={{ minHeight: "190px", background: "var(--bento-products-bg)", borderColor: "var(--bento-products-border)" }}
        >
          <div className="flex items-start justify-between">
            <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bento-products-label)" }}>Products</p>
            <div className="p-2.5 rounded-xl" style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.15)" }}>
              <Package size={20} color="#a78bfa" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-1px", color: "var(--text)", lineHeight: 1 }}>{stats.products}</p>
            <Link href="/products" className="flex items-center gap-1.5 mt-4" style={{ fontSize: "13px", fontWeight: 500, color: "#a78bfa", width: "fit-content" }}>
              Manage <ArrowUpRight size={14} />
            </Link>
          </div>
        </BentoCard>

        {/* Sparkline "” 2 cols */}
        <BentoCard className="col-span-2" style={{ minHeight: "200px" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Revenue Trend</p>
              <p style={{ fontSize: "13px", color: "var(--text-3)", marginTop: "2px" }}>Last 10 days</p>
            </div>
            <Activity size={18} style={{ color: "var(--text-3)" }} />
          </div>
          {salesData.length > 0 ? (
            <div className="flex items-end gap-2" style={{ height: "72px" }}>
              {salesData.map((s, i) => {
                const h = Math.max(6, Math.round((s.total_revenue / maxRevenue) * 64));
                return (
                  <div key={i} className="flex-1 group relative flex flex-col justify-end">
                    <div
                      className="w-full rounded-md transition-opacity"
                      style={{ height: `${h}px`, background: `rgba(14,116,144,${0.4 + (i / salesData.length) * 0.6})` }}
                      title={`Rs. ${s.total_revenue.toFixed(0)}`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: "15px", color: "var(--text-3)" }}>No sales data yet.</p>
          )}
        </BentoCard>

        {/* Inventory */}
        <BentoCard
          className="flex flex-col justify-between"
          style={{ minHeight: "200px", background: "var(--bento-inventory-bg)", borderColor: "var(--bento-inventory-border)" }}
        >
          <div className="flex items-start justify-between">
            <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bento-inventory-label)" }}>Inventory</p>
            <div className="p-2.5 rounded-xl" style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.15)" }}>
              <Warehouse size={20} color="#fb923c" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-1px", color: "var(--text)", lineHeight: 1 }}>{stats.inventory}</p>
            <p style={{ fontSize: "13px", color: "rgba(251,146,60,0.5)", marginTop: "4px" }}>items tracked</p>
            <Link href="/inventory" className="flex items-center gap-1.5 mt-3" style={{ fontSize: "13px", fontWeight: 500, color: "#fb923c", width: "fit-content" }}>
              View inventory <ArrowUpRight size={14} />
            </Link>
          </div>
        </BentoCard>

        {/* Top Products */}
        <BentoCard style={{ minHeight: "200px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: "20px" }}>Top Products</p>
          {topProducts.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {topProducts.map((p, i) => (
                <div key={p.product__name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-3)", fontFamily: "monospace", width: "16px" }}>{i + 1}</span>
                    <span style={{ fontSize: "14px", color: "var(--text)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.product__name}</span>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#34d399" }}>Rs. {Number(p.total_revenue).toFixed(0)}</span>
                </div>
              ))}
            </div>
          ) : <p style={{ fontSize: "14px", color: "var(--text-3)" }}>No data yet.</p>}
        </BentoCard>

        {/* Recent Orders "” 2 cols */}
        <BentoCard className="col-span-2" style={{ minHeight: "200px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Recent Orders</p>
            <Link href="/orders" style={{ fontSize: "13px", fontWeight: 500, color: "var(--accent)" }}>See all â†’</Link>
          </div>
          {recentOrders.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {recentOrders.map((o) => (
                <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)" }}>{o.customer_name}</p>
                    <p style={{ fontSize: "13px", color: "var(--text-3)", marginTop: "2px" }}>{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "13px", padding: "4px 10px", borderRadius: "99px", background: (statusColor[o.status] ?? "#6b7280") + "18", color: statusColor[o.status] ?? "#9ca3af", fontWeight: 500 }}>
                      {o.status}
                    </span>
                    <span style={{ fontSize: "15px", fontWeight: 600, color: "#34d399" }}>Rs. {parseFloat(o.total_price).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p style={{ fontSize: "15px", color: "var(--text-3)" }}>No orders yet.</p>}
        </BentoCard>

        {/* Quick stat */}
        <BentoCard>
          <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: "20px" }}>Quick Links</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { label: "Add Product", href: "/products", color: "#a78bfa" },
              { label: "New Order", href: "/orders", color: "#60a5fa" },
              { label: "View Reports", href: "/reports", color: "#34d399" },
              { label: "Coupons", href: "/coupons", color: "#fbbf24" },
            ].map(({ label, href, color }) => (
              <Link key={href} href={href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "15px", color, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span>{label}</span>
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </div>
        </BentoCard>

      </div>
    </div>
  );
}

