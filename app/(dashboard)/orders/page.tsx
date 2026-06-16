﻿"use client";
import { useEffect, useState } from "react";
import { getOrders, cancelOrder, deleteOrder, createOrder, getProducts, trackOrder, updateOrderStatus, applyCoupon, confirmPayment } from "@/lib/api";
import { ShoppingCart, Ban, Trash2, Plus, X, Search, ChevronLeft, ChevronRight, MapPin, ArrowRight, Tag, CheckCircle, CreditCard } from "lucide-react";
import { OrderTracking } from "@/components/ui/order-tracking";
import EsewaPayment from "@/components/ui/esewa-payment";
import KhaltiPayment from "@/components/ui/khalti-payment";

interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  unit_price: string;
}

interface Order {
  id: number;
  customer_name: string;
  delivery_city: string;
  status: string;
  payment_method?: string;
  total_price: string;
  created_at: string;
  items: OrderItem[];
}

interface Product { id: number; name: string; price: string; }

const statusColor: Record<string, string> = {
  pending: "#d97706",
  completed: "#059669",
  cancelled: "#dc2626",
  processing: "#0e7490",
  shipped: "#7c3aed",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [items, setItems] = useState([{ product: "", quantity: 1 }]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<{ discount_amount: string; final_amount: string; message?: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  interface TrackTimeline { stage: string; status: string; timestamp: string | null; }
  interface TrackInfo { order_id: number; customer_name: string; current_status: string; delivery_city: string; total_price: string; payment_method: string; payment_status: string; timeline: TrackTimeline[]; }
  const [trackModal, setTrackModal] = useState(false);
  const [trackData, setTrackData] = useState<TrackInfo | null>(null);
  const [esewaModal, setEsewaModal] = useState(false);
  const [esewaOrderId, setEsewaOrderId] = useState<number | null>(null);
  const [esewaRef, setEsewaRef] = useState("");
  const [esewaError, setEsewaError] = useState("");
  const [esewaConfirming, setEsewaConfirming] = useState(false);
  const [esewaPayModal, setEsewaPayModal] = useState(false);
  const [esewaPayOrderId, setEsewaPayOrderId] = useState<number | null>(null);
  const [esewaPayAmount, setEsewaPayAmount] = useState(0);
  const [khaltiPayModal, setKhaltiPayModal] = useState(false);
  const [khaltiPayOrderId, setKhaltiPayOrderId] = useState<number | null>(null);
  const [khaltiPayAmount, setKhaltiPayAmount] = useState(0);
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  const PAGE_SIZE = 10;

  useEffect(() => {
    setIsAdmin(localStorage.getItem("is_admin") === "true");
  }, []);

  const CACHE_KEY = "orders_cache";

  const fetchAll = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      setAllOrders(parsed);
      setLoading(false);
    } else {
      setLoading(true);
    }
    getOrders()
      .then((r) => {
        const fresh = Array.isArray(r.data) ? r.data : r.data.results ?? [];
        setAllOrders(fresh);
        localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
      })
      .finally(() => setLoading(false));
  };

  const applyFilter = (all: Order[], s: string, p: number) => {
    const filtered = s.trim()
      ? all.filter(o =>
          o.customer_name?.toLowerCase().includes(s.toLowerCase()) ||
          o.delivery_city?.toLowerCase().includes(s.toLowerCase()) ||
          o.status?.toLowerCase().includes(s.toLowerCase()) ||
          String(o.id).includes(s.trim())
        )
      : all;
    const start = (p - 1) * PAGE_SIZE;
    setOrders(filtered.slice(start, start + PAGE_SIZE));
    setCount(filtered.length);
  };

  useEffect(() => {
    applyFilter(allOrders, search, page);
  }, [allOrders, search, page]);

  const load = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const fresh = JSON.parse(cached);
      setAllOrders(fresh);
    } else {
      fetchAll();
    }
    fetchAll();
  };

  useEffect(() => {
    fetchAll();
    getProducts().then((r) => setProducts(Array.isArray(r.data) ? r.data : r.data.results ?? []));
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const goToPage = (p: number) => setPage(p);

  const totalPages = Math.ceil(count / PAGE_SIZE);

  const handleCancel = async (id: number) => {
    if (!confirm("Cancel this order?")) return;
    await cancelOrder(id);
    localStorage.removeItem(CACHE_KEY);
    fetchAll();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this order?")) return;
    await deleteOrder(id);
    localStorage.removeItem(CACHE_KEY);
    fetchAll();
  };

  const nextStatus: Record<string, string> = {
    pending: "processing",
    processing: "shipped",
    shipped: "completed",
  };

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    const next = nextStatus[currentStatus];
    if (!next) return;
    await updateOrderStatus(id, next);
    localStorage.removeItem(CACHE_KEY);
    fetchAll();
  };

  const handleTrack = async (id: number) => {
    const r = await trackOrder(id);
    setTrackData(r.data);
    setTrackModal(true);
  };

  const handleConfirmPayment = (id: number) => {
    setEsewaOrderId(id);
    setEsewaRef("");
    setEsewaError("");
    setEsewaModal(true);
  };

  const submitEsewaConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!esewaOrderId) return;
    setEsewaConfirming(true);
    setEsewaError("");
    try {
      await confirmPayment(esewaOrderId, esewaRef.trim() || undefined);
      setEsewaModal(false);
      setEsewaRef("");
      setEsewaOrderId(null);
      localStorage.removeItem(CACHE_KEY);
      fetchAll();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const msg = data
        ? Object.values(data).flat().join(" ")
        : "Failed to confirm payment. Check the transaction ID.";
      setEsewaError(msg);
    } finally {
      setEsewaConfirming(false);
    }
  };


  const getSubtotal = () => items.reduce((sum, item) => {
    const p = products.find((p) => String(p.id) === item.product);
    return sum + (p ? parseFloat(p.price) * item.quantity : 0);
  }, 0);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponApplying(true); setCouponError(""); setCouponResult(null);
    try {
      const subtotal = getSubtotal();
      const { data } = await applyCoupon(couponCode.trim(), subtotal.toFixed(2));
      setCouponResult(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string; error?: string } } })?.response?.data;
      setCouponError(msg?.detail ?? msg?.error ?? "Invalid or expired coupon.");
    } finally { setCouponApplying(false); }
  };

  const addItem = () => setItems([...items, { product: "", quantity: 1 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) =>
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: field === "quantity" ? (Number(value) || 1) : value } : item));

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await createOrder({
        customer_name: customerName,
        delivery_city: deliveryCity,
        payment_method: paymentMethod,
        items: items.map((i) => ({ product: parseInt(i.product), quantity: i.quantity })),
      });
      const total = couponResult ? parseFloat(couponResult.final_amount) : getSubtotal();
      setModal(false);
      setCustomerName(""); setDeliveryCity(""); setPaymentMethod("cod");
      setItems([{ product: "", quantity: 1 }]);
      setCouponCode(""); setCouponResult(null); setCouponError("");
      localStorage.removeItem(CACHE_KEY);
      fetchAll();
      if (paymentMethod === "esewa") {
        setEsewaPayOrderId(res.data.id);
        setEsewaPayAmount(total);
        setEsewaPayModal(true);
      } else if (paymentMethod === "khalti") {
        setKhaltiPayOrderId(res.data.id);
        setKhaltiPayAmount(total);
        setKhaltiPayModal(true);
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      setError(data ? JSON.stringify(data) : "Failed to create order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.1 }}>Orders</h1>
          <p style={{ fontSize: "16px", color: "var(--text-2)", marginTop: "6px" }}>{count} total orders</p>
        </div>
        <button onClick={() => { setModal(true); setError(""); }} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 24px", height: "44px", borderRadius: "4px", fontSize: "15px", fontWeight: 600, color: "rgba(0,113,227,1)", background: "transparent", border: "1.5px solid rgba(0,113,227,0.6)", cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,113,227,0.06)"; e.currentTarget.style.borderColor = "rgba(0,113,227,1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(0,113,227,0.6)"; }}>
          <Plus size={16} /> New Order
        </button>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", alignItems: "stretch", marginBottom: "24px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by customer or status..." style={{ paddingLeft: "46px", height: "50px" }} />
        </div>
        <button type="submit" style={{ padding: "0 24px", height: "50px", borderRadius: "4px", fontSize: "15px", fontWeight: 600, color: "rgba(0,113,227,1)", background: "transparent", border: "1.5px solid rgba(0,113,227,0.6)", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,113,227,0.06)"; e.currentTarget.style.borderColor = "rgba(0,113,227,1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(0,113,227,0.6)"; }}>Search</button>
        {search && <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} style={{ padding: "0 20px", height: "50px", borderRadius: "4px", fontSize: "15px", fontWeight: 500, color: "var(--text-2)", background: "transparent", border: "1.5px solid var(--border)", cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--text-3)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}>Clear</button>}
      </form>

      {loading ? <p style={{ color: "var(--text-3)" }}>Loading...</p> : (
        <>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr>{["ID", "Products", "Customer", "Status", "Payment", "Total", "Date", "Actions"].map((h) => (
                  <th key={h}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono text-xs" style={{ color: "var(--text-3)" }}>#{o.id}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {o.items && o.items.length > 0 ? o.items.map((item) => (
                          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{item.product_name}</span>
                            <span style={{ fontSize: "11px", padding: "1px 7px", borderRadius: "99px", background: "var(--card-2)", color: "var(--text-3)" }}>x{item.quantity}</span>
                          </div>
                        )) : <span style={{ color: "var(--text-3)", fontSize: "13px" }}>"”</span>}
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium" style={{ fontSize: "14px", color: "var(--text)" }}>{o.customer_name}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-3)" }}>{o.delivery_city}</p>
                      </div>
                    </td>
                    <td>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: (statusColor[o.status] ?? "#6b7280") + "18", color: statusColor[o.status] ?? "#9ca3af" }}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-lg text-xs font-mono" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>{o.payment_method ?? "cod"}</span>
                    </td>
                    <td className="font-semibold" style={{ color: "#34d399" }}>Rs. {parseFloat(o.total_price).toFixed(2)}</td>
                    <td style={{ color: "var(--text-3)" }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                        {([
                          { show: true, onClick: () => handleTrack(o.id), color: "#fff", bg: "#a78bfa", icon: <MapPin size={13} />, label: "Track" },
                          { show: (!o.payment_method || o.payment_method === "cod") && o.status === "pending", onClick: () => handleConfirmPayment(o.id), color: "#fff", bg: "#a78bfa", icon: <CreditCard size={13} />, label: "Confirm" },
                          { show: isAdmin && o.status !== "cancelled" && o.status !== "completed", onClick: () => handleUpdateStatus(o.id, o.status), color: "#fff", bg: "#60a5fa", icon: <ArrowRight size={13} />, label: "Advance" },
                          { show: o.status !== "cancelled", onClick: () => handleCancel(o.id), color: "#fff", bg: "#fbbf24", icon: <Ban size={13} />, label: "Cancel" },
                          { show: true, onClick: () => handleDelete(o.id), color: "#fff", bg: "#f87171", icon: <Trash2 size={13} />, label: "Delete" },
                        ] as { show: boolean; onClick: () => void; color: string; bg: string; icon: React.ReactNode; label: string }[]).filter(b => b.show).map((btn, i) => (
                          <button key={i} onClick={btn.onClick}
                            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "6px", border: "none", background: btn.bg, color: btn.color, fontSize: "12px", fontWeight: 500, cursor: "pointer", transition: "opacity 0.15s", whiteSpace: "nowrap" }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                            {btn.icon}{btn.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={8} className="py-16 text-center" style={{ color: "var(--text-3)" }}>No orders found.</td></tr>}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <span className="text-xs" style={{ color: "var(--text-3)" }}>Page {page} of {totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: page === 1 ? "var(--border-strong)" : "var(--text-2)" }}><ChevronLeft size={16} /></button>
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: page === totalPages ? "var(--border-strong)" : "var(--text-2)" }}><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* New Order Modal */}
      {modal && (() => {
        const subtotal = getSubtotal();
        const discount = couponResult ? parseFloat(couponResult.discount_amount) : 0;
        const total = subtotal - discount;
        return (
          <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(16px)" }}>
            <div style={{ width: "100%", maxWidth: "540px", maxHeight: "90vh", overflowY: "auto", borderRadius: "24px", padding: "28px", background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "0 40px 80px rgba(0,0,0,0.18)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>New Order</h2>
                <button onClick={() => { setModal(false); setCouponCode(""); setCouponResult(null); setCouponError(""); }} style={{ width: "30px", height: "30px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)" }}><X size={15} /></button>
              </div>

              <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {error && <div style={{ padding: "12px 16px", borderRadius: "12px", fontSize: "14px", color: "var(--red)", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>{error}</div>}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "8px" }}>Customer Name</label>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "8px" }}>Delivery City</label>
                    <input value={deliveryCity} onChange={(e) => setDeliveryCity(e.target.value)} placeholder="e.g. Kathmandu" required />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "8px" }}>Payment Method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="cod">Cash on Delivery</option>
                    <option value="esewa">eSewa</option>
                    <option value="khalti">Khalti</option>
                  </select>
                </div>

                {/* Items */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-2)" }}>Order Items</label>
                    <button type="button" onClick={addItem} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 500, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
                      <Plus size={14} /> Add item
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {items.map((item, i) => {
                      const selectedProduct = products.find((p) => String(p.id) === item.product);
                      const lineTotal = selectedProduct ? parseFloat(selectedProduct.price) * item.quantity : 0;
                      return (
                        <div key={i} style={{ borderRadius: "12px", padding: "14px", background: "var(--card-2)", border: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-3)" }}>Item {i + 1}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              {selectedProduct && <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--green)" }}>Rs. {lineTotal.toFixed(2)}</span>}
                              {items.length > 1 && <button type="button" onClick={() => removeItem(i)} style={{ color: "var(--red)", background: "none", border: "none", cursor: "pointer" }}><X size={14} /></button>}
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px" }}>
                            <select value={item.product} onChange={(e) => { updateItem(i, "product", e.target.value); setCouponResult(null); setCouponError(""); }} required>
                              <option value="">Select product...</option>
                              {products.map((p) => <option key={p.id} value={p.id}>{p.name} "” Rs. {parseFloat(p.price).toFixed(2)}</option>)}
                            </select>
                            <input type="number" min={1} value={item.quantity} onChange={(e) => { updateItem(i, "quantity", parseInt(e.target.value)); setCouponResult(null); setCouponError(""); }} style={{ width: "80px" }} required />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subtotal */}
                {subtotal > 0 && (
                  <div style={{ borderRadius: "12px", padding: "14px 16px", background: "var(--card-2)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--text-2)", marginBottom: discount > 0 ? "8px" : 0 }}>
                      <span>Subtotal</span>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>Rs. {subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && <>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--green)", marginBottom: "8px" }}>
                        <span>Coupon discount</span>
                        <span style={{ fontWeight: 600 }}>-Rs. {discount.toFixed(2)}</span>
                      </div>
                      <div style={{ height: "1px", background: "var(--border)", margin: "8px 0" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
                        <span>Total</span>
                        <span style={{ color: "var(--accent)" }}>Rs. {total.toFixed(2)}</span>
                      </div>
                    </>}
                  </div>
                )}

                {/* Coupon */}
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "8px" }}>
                    <Tag size={14} /> Coupon Code <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); setCouponError(""); }}
                      placeholder="e.g. SAVE20"
                      style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponApplying || !couponCode.trim() || subtotal === 0}
                      style={{ padding: "0 18px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, color: "#fff", background: couponApplying || !couponCode.trim() || subtotal === 0 ? "#c7c7cc" : "rgba(0,113,227,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,113,227,0.4)", boxShadow: couponApplying || !couponCode.trim() || subtotal === 0 ? "none" : "0 4px 16px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", cursor: couponApplying || !couponCode.trim() || subtotal === 0 ? "not-allowed" : "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}
                    >
                      {couponApplying ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponResult && (
                    <div style={{ marginTop: "8px", padding: "10px 14px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", color: "var(--green)", fontSize: "14px" }}>
                      <CheckCircle size={14} />
                      {couponResult.message ?? `Coupon applied! You save Rs. ${parseFloat(couponResult.discount_amount).toFixed(2)}`}
                    </div>
                  )}
                  {couponError && (
                    <div style={{ marginTop: "8px", padding: "10px 14px", borderRadius: "10px", fontSize: "14px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "var(--red)" }}>
                      {couponError}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px", paddingTop: "8px" }}>
                  <button type="button" onClick={() => { setModal(false); setCouponCode(""); setCouponResult(null); setCouponError(""); }} style={{ flex: 1, height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 500, color: "var(--text)", background: "var(--card-2)", border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--border)"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--card-2)"}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ flex: 1, height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "#fff", background: saving ? "#c7c7cc" : "rgba(0,113,227,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,113,227,0.4)", boxShadow: saving ? "none" : "0 4px 24px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", cursor: saving ? "not-allowed" : "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = "rgba(0,113,227,1)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,113,227,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}
                    onMouseLeave={e => { if (!saving) { e.currentTarget.style.background = "rgba(0,113,227,0.85)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}>
                    {saving ? "Creating..." : "Create Order"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Track Modal */}
      {trackModal && trackData && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(16px)" }}>
          <div style={{ width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", borderRadius: "24px", padding: "28px", background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "0 40px 80px rgba(0,0,0,0.25)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: "10px" }}>
                <MapPin size={20} color="#a78bfa" /> Order #{trackData.order_id}
              </h2>
              <button onClick={() => setTrackModal(false)} style={{ width: "30px", height: "30px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)" }}><X size={15} /></button>
            </div>

            {/* Order Info */}
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

            {/* Status Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-2)" }}>Current status:</span>
              <span style={{ padding: "4px 12px", borderRadius: "99px", fontSize: "13px", fontWeight: 600, background: (statusColor[trackData.current_status] ?? "#6b7280") + "20", color: statusColor[trackData.current_status] ?? "#9ca3af" }}>
                {trackData.current_status}
              </span>
            </div>

            {/* Timeline */}
            {trackData.timeline && trackData.timeline.length > 0 && (
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-2)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Timeline</p>
                <OrderTracking
                  steps={trackData.timeline.map((step) => ({
                    name: step.stage,
                    timestamp: step.timestamp
                      ? new Date(step.timestamp).toLocaleString()
                      : "Pending",
                    isCompleted: step.status === "completed",
                  }))}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* eSewa confirm modal */}
      {esewaModal && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(16px)" }}>
          <div style={{ width: "100%", maxWidth: "420px", borderRadius: "24px", padding: "28px", background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "0 40px 80px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>Confirm eSewa Payment</h2>
              <button onClick={() => setEsewaModal(false)} style={{ width: "30px", height: "30px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)" }}><X size={14} /></button>
            </div>
            <form onSubmit={submitEsewaConfirm} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5 }}>
                Enter the eSewa transaction ID from your payment receipt to confirm this order.
              </p>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "7px" }}>Transaction ID <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(optional)</span></label>
                <input
                  value={esewaRef}
                  onChange={(e) => setEsewaRef(e.target.value)}
                  placeholder="e.g. 00C3B2D1A4E..."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "14px", outline: "none", background: "var(--card-2)", color: "var(--text)", fontFamily: "monospace", boxSizing: "border-box" }}
                />
              </div>
              {esewaError && (
                <div style={{ padding: "10px 14px", borderRadius: "10px", fontSize: "13px", color: "var(--red)", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                  {esewaError}
                </div>
              )}
              <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                <button type="button" onClick={() => setEsewaModal(false)} style={{ flex: 1, height: "44px", borderRadius: "99px", fontSize: "14px", fontWeight: 500, color: "var(--text)", border: "1px solid var(--border)", background: "var(--card-2)", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={esewaConfirming} style={{ flex: 1, height: "44px", borderRadius: "99px", fontSize: "14px", fontWeight: 600, color: "#fff", border: "none", cursor: "pointer", background: esewaConfirming ? "#c7c7cc" : "rgba(0,113,227,0.85)", backdropFilter: "blur(12px)", transition: "all 0.2s" }}>
                  {esewaConfirming ? "Confirming..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {esewaPayModal && esewaPayOrderId && (
        <EsewaPayment
          orderId={esewaPayOrderId}
          amount={esewaPayAmount}
          onClose={() => setEsewaPayModal(false)}
        />
      )}

      {khaltiPayModal && khaltiPayOrderId && (
        <KhaltiPayment
          orderId={khaltiPayOrderId}
          amount={khaltiPayAmount}
          onClose={() => setKhaltiPayModal(false)}
        />
      )}

    </div>
  );
}

