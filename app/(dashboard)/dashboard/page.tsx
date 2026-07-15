﻿"use client";
import { useEffect, useState } from "react";
import { getProducts, getOrders, getTopProducts, getSalesChart } from "@/lib/api";
import { Package, ShoppingCart, Warehouse, TrendingUp, ArrowUpRight, Activity } from "lucide-react";
import Link from "next/link";
import { TrendBarChart } from "@/components/ui/bar-chart";
import { useRouter } from "next/navigation";

interface Order { id: number; customer_name: string; status: string; total_price: string; created_at: string; }
interface TopProduct { product__name: string; total_sold: number; total_revenue: number; }
interface SalesPoint { label: string; total_revenue: number; }

const statusColor: Record<string, string> = {
  pending: "var(--orange)",
  completed: "var(--green)",
  cancelled: "var(--red)",
  processing: "var(--blue)",
  shipped: "var(--purple)",
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
    if (sessionStorage.getItem("is_admin") !== "true") {
      router.replace("/orders");
      return;
    }
    Promise.allSettled([
      getProducts(), getOrders(), getTopProducts(30), getSalesChart("daily", 14),
    ]).then(([p, o, tp, sc]) => {
      const oData = o.status === "fulfilled" ? o.value.data : null;
      const pData = p.status === "fulfilled" ? p.value.data : null;
      const orders: Order[] = oData ? (Array.isArray(oData) ? oData : oData.results ?? []) : [];
      const revenue = orders.reduce((s, ord) => s + parseFloat(ord.total_price || "0"), 0);
      setStats({
        products: pData ? (Array.isArray(pData) ? pData.length : pData.count ?? 0) : 0,
        orders: oData ? (Array.isArray(oData) ? oData.length : oData.count ?? 0) : 0,
        inventory: 0,
        revenue,
      });
      setRecentOrders(orders.slice(0, 5));
      if (tp.status === "fulfilled") setTopProducts((Array.isArray(tp.value.data) ? tp.value.data : tp.value.data.results ?? []).slice(0, 5));
      if (sc.status === "fulfilled") setSalesData((Array.isArray(sc.value.data) ? sc.value.data : sc.value.data.results ?? []).slice(-10));
    }).finally(() => setLoading(false));
  }, []);

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
          style={{ minHeight: "190px" }}
        >
          <div className="flex items-start justify-between">
            <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)" }}>Total Orders</p>
            <div className="p-2.5 rounded-xl" style={{ background: "color-mix(in srgb, var(--blue) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--blue) 18%, transparent)" }}>
              <ShoppingCart size={20} color="var(--blue)" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: "56px", fontWeight: 800, letterSpacing: "-2px", color: "var(--text)", lineHeight: 1 }}>{stats.orders}</p>
            <Link href="/orders" className="flex items-center gap-1.5 mt-4" style={{ fontSize: "13px", fontWeight: 500, color: "var(--blue)", width: "fit-content" }}>
              View all orders <ArrowUpRight size={14} />
            </Link>
          </div>
        </BentoCard>

        {/* Revenue */}
        <BentoCard
          className="flex flex-col justify-between"
          style={{ minHeight: "190px" }}
        >
          <div className="flex items-start justify-between">
            <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)" }}>Revenue</p>
            <div className="p-2.5 rounded-xl" style={{ background: "color-mix(in srgb, var(--green) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--green) 18%, transparent)" }}>
              <TrendingUp size={20} color="var(--green)" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-1px", color: "var(--text)", lineHeight: 1 }}>Rs. {stats.revenue.toFixed(0)}</p>
            <Link href="/reports" className="flex items-center gap-1.5 mt-4" style={{ fontSize: "13px", fontWeight: 500, color: "var(--green)", width: "fit-content" }}>
              Reports <ArrowUpRight size={14} />
            </Link>
          </div>
        </BentoCard>

        {/* Products */}
        <BentoCard
          className="flex flex-col justify-between"
          style={{ minHeight: "190px" }}
        >
          <div className="flex items-start justify-between">
            <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)" }}>Products</p>
            <div className="p-2.5 rounded-xl" style={{ background: "color-mix(in srgb, var(--purple) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--purple) 18%, transparent)" }}>
              <Package size={20} color="var(--purple)" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-1px", color: "var(--text)", lineHeight: 1 }}>{stats.products}</p>
            <Link href="/products" className="flex items-center gap-1.5 mt-4" style={{ fontSize: "13px", fontWeight: 500, color: "var(--purple)", width: "fit-content" }}>
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
            <TrendBarChart
              data={salesData.map((s) => ({ label: s.label, value: s.total_revenue }))}
              color="var(--chart-green)"
              height={72}
              formatValue={(v) => `Rs. ${v.toFixed(0)}`}
            />
          ) : (
            <p style={{ fontSize: "15px", color: "var(--text-3)" }}>No sales data yet.</p>
          )}
        </BentoCard>

        {/* Inventory */}
        <BentoCard
          className="flex flex-col justify-between"
          style={{ minHeight: "200px" }}
        >
          <div className="flex items-start justify-between">
            <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)" }}>Inventory</p>
            <div className="p-2.5 rounded-xl" style={{ background: "color-mix(in srgb, var(--orange) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--orange) 18%, transparent)" }}>
              <Warehouse size={20} color="var(--orange)" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-1px", color: "var(--text)", lineHeight: 1 }}>{stats.inventory}</p>
            <p style={{ fontSize: "13px", color: "var(--text-3)", marginTop: "4px" }}>items tracked</p>
            <Link href="/inventory" className="flex items-center gap-1.5 mt-3" style={{ fontSize: "13px", fontWeight: 500, color: "var(--orange)", width: "fit-content" }}>
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
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--green)" }}>Rs. {Number(p.total_revenue).toFixed(0)}</span>
                </div>
              ))}
            </div>
          ) : <p style={{ fontSize: "14px", color: "var(--text-3)" }}>No data yet.</p>}
        </BentoCard>

        {/* Recent Orders "” 2 cols */}
        <BentoCard className="col-span-2" style={{ minHeight: "200px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Recent Orders</p>
            <Link href="/orders" style={{ fontSize: "13px", fontWeight: 500, color: "var(--accent)" }}>See all →</Link>
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
                    <span style={{ fontSize: "13px", padding: "4px 10px", borderRadius: "99px", background: `color-mix(in srgb, ${statusColor[o.status] ?? "var(--text-3)"} 14%, transparent)`, color: statusColor[o.status] ?? "var(--text-2)", fontWeight: 500 }}>
                      {o.status}
                    </span>
                    <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--green)" }}>Rs. {parseFloat(o.total_price).toFixed(2)}</span>
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
              { label: "Add Product", href: "/products", color: "var(--purple)" },
              { label: "New Order", href: "/orders", color: "var(--blue)" },
              { label: "View Reports", href: "/reports", color: "var(--green)" },
              { label: "Coupons", href: "/coupons", color: "var(--yellow)" },
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

