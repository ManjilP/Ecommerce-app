"use client";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { getInventorySummary, getSalesChart, getRevenueByCity, getTopProducts, getTopCustomers, getCouponUsage } from "@/lib/api";
import { Package, TrendingUp, MapPin, Users, Ticket } from "lucide-react";
import { RankedBarRow, TrendBarChart } from "@/components/ui/bar-chart";

type DaysOption = 7 | 30 | 90;

interface SalesPoint { label: string; total_sales: number; total_revenue: number; }
interface CityRevenue { delivery_city: string; total_revenue: number; order_count: number; }
interface TopProduct { product__name: string; total_sold: number; total_revenue: number; }
interface TopCustomer { customer_name: string; total_orders: number; total_spent: number; }
interface CouponStat { code: string; discount_type: string; times_used: number; total_discount: number; }
interface InventorySummary { [key: string]: unknown; }

// Donut for order-status breakdown. Identity is carried by the legend labels +
// counts (not color alone), so the status hues double as secondary-encoded segments.
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)"; // strong ease-out (Emil's UI curve)
function StatusDonut({ segments, total, centerLabel }: { segments: { label: string; value: number; color: string }[]; total: number; centerLabel: string }) {
  const size = 172, stroke = 22, r = (size - stroke) / 2, c = size / 2;
  const circ = 2 * Math.PI * r;
  const gap = total > 0 ? 3 : 0; // small surface gap between segments
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => { const id = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(id); }, []);
  let offset = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
      <div style={{
        position: "relative", width: size, height: size, flexShrink: 0,
        opacity: mounted ? 1 : 0,
        // Enter from scale(0.94), never scale(0); reduced-motion keeps only the fade
        transform: mounted || reduce ? "scale(1)" : "scale(0.94)",
        transition: `opacity 420ms ${EASE_OUT}, transform 420ms ${EASE_OUT}`,
      }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--card-2)" strokeWidth={stroke} />
          {total > 0 && segments.filter((s) => s.value > 0).map((s) => {
            const len = (s.value / total) * circ;
            const dash = Math.max(0, len - gap);
            const dimmed = hover !== null && hover !== s.label;
            const el = <circle key={s.label} cx={c} cy={c} r={r} fill="none" stroke={s.color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} style={{ opacity: dimmed ? 0.28 : 1, transition: "opacity 150ms ease" }} />;
            offset += len;
            return el;
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "30px", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "2px" }}>{centerLabel}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, minWidth: "170px" }}>
        {segments.map((s, i) => {
          const dimmed = hover !== null && hover !== s.label;
          return (
            <div key={s.label}
              onMouseEnter={() => setHover(s.label)} onMouseLeave={() => setHover(null)}
              style={{
                display: "flex", alignItems: "center", gap: "10px", cursor: "default",
                opacity: mounted ? (dimmed ? 0.5 : 1) : 0,
                transform: mounted || reduce ? "translateY(0)" : "translateY(6px)",
                // Staggered fade-up (Emil: 30-80ms between items), then hover-dim retargets smoothly
                transition: `opacity 260ms ease-out ${140 + i * 45}ms, transform 320ms ${EASE_OUT} ${140 + i * 45}ms`,
              }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "4px", background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: "14px", color: "var(--text-2)", flex: 1 }}>{s.label}</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{s.value}</span>
              <span style={{ fontSize: "12px", color: "var(--text-3)", width: "40px", textAlign: "right" }}>{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, icon, children, loading }: { title: string; icon: React.ReactNode; children: React.ReactNode; loading: boolean }) {
  return (
    <div className="report-card" style={{ borderRadius: "20px", padding: "24px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}>
      <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>{icon}{title}</h2>
      {loading ? <p style={{ fontSize: "15px", color: "var(--text-3)" }}>Loading...</p> : children}
    </div>
  );
}

export default function ReportsPage() {
  const [days, setDays] = useState<DaysOption>(30);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [sales, setSales] = useState<SalesPoint[]>([]);
  const [cities, setCities] = useState<CityRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [coupons, setCoupons] = useState<CouponStat[]>([]);
  const [loading, setLoading] = useState({ summary: true, sales: true, cities: true, products: true, customers: true, coupons: true });

  const setL = (key: keyof typeof loading, val: boolean) => setLoading((prev) => ({ ...prev, [key]: val }));

  const loadSummary = () => {
    setL("summary", true);
    getInventorySummary().then((r) => setSummary(r.data)).catch(() => setSummary(null)).finally(() => setL("summary", false));
  };

  const loadByDays = (d: DaysOption) => {
    setL("sales", true); setL("cities", true); setL("products", true); setL("customers", true);
    getSalesChart("daily", d).then((r) => setSales(Array.isArray(r.data) ? r.data : r.data.results ?? [])).catch(() => setSales([])).finally(() => setL("sales", false));
    getRevenueByCity(d).then((r) => setCities(Array.isArray(r.data) ? r.data : r.data.results ?? [])).catch(() => setCities([])).finally(() => setL("cities", false));
    getTopProducts(d).then((r) => setTopProducts(Array.isArray(r.data) ? r.data : r.data.results ?? [])).catch(() => setTopProducts([])).finally(() => setL("products", false));
    getTopCustomers(d).then((r) => setTopCustomers(Array.isArray(r.data) ? r.data : r.data.results ?? [])).catch(() => setTopCustomers([])).finally(() => setL("customers", false));
  };

  const loadCoupons = () => {
    setL("coupons", true);
    getCouponUsage().then((r) => setCoupons(Array.isArray(r.data) ? r.data : r.data.results ?? [])).catch(() => setCoupons([])).finally(() => setL("coupons", false));
  };

  useEffect(() => { loadSummary(); loadCoupons(); loadByDays(days); }, []);

  const handleDaysChange = (d: DaysOption) => { setDays(d); loadByDays(d); };

  const maxCity = Math.max(...cities.map((c) => c.total_revenue), 1);
  const maxProductSold = Math.max(...topProducts.map((p) => p.total_sold), 1);
  const maxCustomerSpent = Math.max(...topCustomers.map((c) => c.total_spent), 1);

  // Order-status breakdown for the donut (defensive reads from the free-form summary)
  const num = (k: string) => Number(summary?.[k] ?? 0);
  const totalOrders = num("total_orders");
  const pending = num("pending_orders");
  const completed = num("completed_orders");
  const cancelled = num("cancelled_orders");
  const processing = Math.max(0, totalOrders - pending - completed - cancelled);
  const statusSegments = [
    { label: "Pending", value: pending, color: "var(--chart-yellow)" },
    { label: "Processing", value: processing, color: "var(--chart-blue)" },
    { label: "Completed", value: completed, color: "var(--chart-green)" },
    { label: "Cancelled", value: cancelled, color: "var(--red)" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.1 }}>Reports</h1>
          <p style={{ fontSize: "16px", color: "var(--text-2)", marginTop: "6px" }}>Analytics and insights</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {([7, 30, 90] as DaysOption[]).map((d) => (
            <button key={d} onClick={() => handleDaysChange(d)} className="press" style={{ padding: "0 16px", height: "38px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: days === d ? "var(--card)" : "var(--text-2)", background: days === d ? "var(--orange)" : "var(--card-2)", border: "1px solid var(--border)", cursor: "pointer" }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Order Status */}
        <Section title="Order Status" icon={<TrendingUp size={16} color="var(--chart-green)" />} loading={loading.summary}>
          {summary && totalOrders > 0 ? (
            <StatusDonut segments={statusSegments} total={totalOrders} centerLabel="orders" />
          ) : <p style={{ fontSize: "15px", color: "var(--text-3)" }}>No order data.</p>}
        </Section>

        {/* Inventory Summary */}
        <Section title="Inventory Summary" icon={<Package size={16} color="var(--accent)" />} loading={loading.summary}>
          {summary ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {Object.entries(summary).map(([key, val]) => (
                <div key={key} style={{ borderRadius: "12px", padding: "16px", background: "var(--card-2)", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "12px", color: "var(--text-3)", textTransform: "capitalize", marginBottom: "6px" }}>{key.replace(/_/g, " ")}</p>
                  <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)" }}>{String(val ?? "—")}</p>
                </div>
              ))}
            </div>
          ) : <p style={{ fontSize: "15px", color: "var(--text-3)" }}>No data.</p>}
        </Section>

        {/* Coupon Usage */}
        <Section title="Coupon Usage" icon={<Ticket size={16} color="var(--orange)" />} loading={loading.coupons}>
          {coupons.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {coupons.map((c) => (
                <div key={c.code} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "12px", padding: "14px 16px", background: "var(--card-2)", border: "1px solid var(--border)" }}>
                  <div>
                    <p style={{ fontSize: "15px", fontFamily: "monospace", fontWeight: 600, color: "var(--text)" }}>{c.code}</p>
                    <p style={{ fontSize: "13px", color: "var(--text-3)", marginTop: "2px" }}>{c.discount_type} · {c.times_used} uses</p>
                  </div>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--green)" }}>-Rs. {Number(c.total_discount ?? 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : <p style={{ fontSize: "15px", color: "var(--text-3)" }}>No coupon data.</p>}
        </Section>

        {/* Sales Chart */}
        <Section title={`Revenue — last ${days} days`} icon={<TrendingUp size={16} color="var(--chart-green)" />} loading={loading.sales}>
          {sales.length > 0 ? (
            <>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px", marginBottom: "16px" }}>
                Rs. {sales.reduce((sum, s) => sum + Number(s.total_revenue), 0).toFixed(0)}
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-3)", marginLeft: "8px" }}>total</span>
              </p>
              <TrendBarChart
                data={sales.map((s) => ({ label: s.label, value: s.total_revenue }))}
                color="var(--chart-green)"
                formatValue={(v) => `Rs. ${v.toFixed(0)}`}
              />
            </>
          ) : <p style={{ fontSize: "15px", color: "var(--text-3)" }}>No sales data.</p>}
        </Section>

        {/* Revenue by City */}
        <Section title={`Revenue by City — last ${days} days`} icon={<MapPin size={16} color="var(--chart-blue)" />} loading={loading.cities}>
          {cities.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {cities.map((c) => (
                <div key={c.delivery_city}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)" }}>{c.delivery_city}</span>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-3)" }}>{c.order_count} orders</span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--green)" }}>Rs. {Number(c.total_revenue).toFixed(0)}</span>
                    </div>
                  </div>
                  <RankedBarRow label={c.delivery_city} value={c.total_revenue} max={maxCity} color="var(--chart-blue)" valueLabel={`Rs. ${Number(c.total_revenue).toFixed(0)}`} />
                </div>
              ))}
            </div>
          ) : <p style={{ fontSize: "15px", color: "var(--text-3)" }}>No city data.</p>}
        </Section>

        {/* Top Products */}
        <Section title={`Top Products — last ${days} days`} icon={<Package size={16} color="var(--chart-purple)" />} loading={loading.products}>
          {topProducts.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {topProducts.map((p, i) => (
                <div key={p.product__name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "12px", width: "22px", height: "22px", borderRadius: "99px", display: "flex", alignItems: "center", justifyContent: "center", background: "color-mix(in srgb, var(--chart-purple) 14%, transparent)", color: "var(--chart-purple)", fontWeight: 700 }}>{i + 1}</span>
                      <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.product__name}</span>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-3)" }}>{p.total_sold} sold</span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--green)" }}>Rs. {Number(p.total_revenue).toFixed(0)}</span>
                    </div>
                  </div>
                  <RankedBarRow label={p.product__name} value={p.total_sold} max={maxProductSold} color="var(--chart-purple)" valueLabel={`${p.total_sold} sold`} />
                </div>
              ))}
            </div>
          ) : <p style={{ fontSize: "15px", color: "var(--text-3)" }}>No product data.</p>}
        </Section>

        {/* Top Customers */}
        <Section title={`Top Customers — last ${days} days`} icon={<Users size={16} color="var(--chart-yellow)" />} loading={loading.customers}>
          {topCustomers.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {topCustomers.map((c, i) => (
                <div key={c.customer_name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "12px", width: "22px", height: "22px", borderRadius: "99px", display: "flex", alignItems: "center", justifyContent: "center", background: "color-mix(in srgb, var(--chart-yellow) 14%, transparent)", color: "var(--chart-yellow)", fontWeight: 700 }}>{i + 1}</span>
                      <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)" }}>{c.customer_name}</span>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-3)" }}>{c.total_orders} orders</span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--green)" }}>Rs. {Number(c.total_spent).toFixed(0)}</span>
                    </div>
                  </div>
                  <RankedBarRow label={c.customer_name} value={c.total_spent} max={maxCustomerSpent} color="var(--chart-yellow)" valueLabel={`Rs. ${Number(c.total_spent).toFixed(0)}`} />
                </div>
              ))}
            </div>
          ) : <p style={{ fontSize: "15px", color: "var(--text-3)" }}>No customer data.</p>}
        </Section>

      </div>
    </div>
  );
}
