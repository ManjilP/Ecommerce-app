"use client";
import { useEffect, useState } from "react";
import { getWishlist, removeFromWishlist, clearWishlist, addToWishlist, getProducts, createOrder, applyCoupon } from "@/lib/api";
import { Heart, Trash2, X, Plus, Search, ImageIcon, ShoppingBag, Tag, CheckCircle } from "lucide-react";
import EsewaPayment from "@/components/ui/esewa-payment";
import KhaltiPayment from "@/components/ui/khalti-payment";

interface WishlistItem {
  id: number;
  product_id: number;
  product_name: string;
  product_price: string;
  product_image: string;
  product_category: string;
  created_at: string;
}

interface Product { id: number; name: string; sku: string; category: string; price: string; image?: string; }

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);
  const [modal, setModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState<number | null>(null);

  // ponytail: inline order modal duplicates checkout-modal.tsx — replace with <CheckoutModal> when confirmed working
  const [orderModal, setOrderModal] = useState(false);
  const [orderItem, setOrderItem] = useState<WishlistItem | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [quantity, setQuantity] = useState(1);
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<{ discount_amount: string; final_amount: string; message?: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [esewaModal, setEsewaModal] = useState(false);
  const [esewaOrderId, setEsewaOrderId] = useState<number | null>(null);
  const [esewaAmount, setEsewaAmount] = useState(0);
  const [khaltiModal, setKhaltiModal] = useState(false);
  const [khaltiOrderId, setKhaltiOrderId] = useState<number | null>(null);
  const [khaltiAmount, setKhaltiAmount] = useState(0);

  const load = () => {
    setLoading(true);
    getWishlist().then((r) => setItems(Array.isArray(r.data) ? r.data : r.data.results ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openModal = () => {
    setModal(true);
    setSearch("");
    setProductsLoading(true);
    getProducts().then((r) => setProducts(Array.isArray(r.data) ? r.data : r.data.results ?? [])).finally(() => setProductsLoading(false));
  };

  const openOrderModal = (item: WishlistItem) => {
    setOrderItem(item);
    setCustomerName(""); setDeliveryCity(""); setPaymentMethod("cod"); setQuantity(1);
    setCouponCode(""); setCouponResult(null); setCouponError("");
    setOrderError(""); setOrderSuccess(false);
    setOrderModal(true);
  };

  const closeOrderModal = () => {
    setOrderModal(false);
    setOrderItem(null);
  };

  const getSubtotal = () => orderItem ? parseFloat(orderItem.product_price) * quantity : 0;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !orderItem) return;
    setCouponApplying(true); setCouponError(""); setCouponResult(null);
    try {
      const { data } = await applyCoupon(couponCode.trim(), getSubtotal().toFixed(2));
      setCouponResult(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string; error?: string } } })?.response?.data;
      setCouponError(msg?.detail ?? msg?.error ?? "Invalid or expired coupon.");
    } finally { setCouponApplying(false); }
  };

  const handleCreateOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!orderItem) return;
    setOrderSaving(true); setOrderError("");
    try {
      const res = await createOrder({
        customer_name: customerName,
        delivery_city: deliveryCity,
        payment_method: paymentMethod,
        items: [{ product: orderItem.product_id, quantity }],
      });
      const total = couponResult ? parseFloat(couponResult.final_amount) : getSubtotal();
      if (paymentMethod === "esewa") {
        setEsewaOrderId(res.data.id);
        setEsewaAmount(total);
        closeOrderModal();
        setEsewaModal(true);
      } else if (paymentMethod === "khalti") {
        setKhaltiOrderId(res.data.id);
        setKhaltiAmount(total);
        closeOrderModal();
        setKhaltiModal(true);
      } else {
        setOrderSuccess(true);
        setTimeout(() => closeOrderModal(), 2000);
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        if (typeof obj.error === "string") setOrderError(obj.error);
        else if (typeof obj.detail === "string") setOrderError(obj.detail);
        else setOrderError(Object.entries(obj).map(([f, v]) => `${f}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\n"));
      } else {
        setOrderError("Failed to place order.");
      }
    } finally { setOrderSaving(false); }
  };

  const handleAdd = async (productId: number) => {
    setAddingId(productId);
    try { await addToWishlist(productId); load(); }
    finally { setAddingId(null); }
  };

  const handleRemove = async (id: number) => {
    setRemovingId(id);
    try { await removeFromWishlist(id); setItems((prev) => prev.filter((i) => i.id !== id)); }
    finally { setRemovingId(null); }
  };

  const handleClear = async () => {
    if (!confirm("Remove all items from your wishlist?")) return;
    setClearing(true);
    try { await clearWishlist(); setItems([]); } finally { setClearing(false); }
  };

  const wishlistProductIds = new Set(items.map((i) => i.product_id));
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const subtotal = getSubtotal();
  const discount = couponResult ? parseFloat(couponResult.discount_amount) : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.1 }}>Wishlist</h1>
          <p style={{ fontSize: "16px", color: "var(--text-2)", marginTop: "6px" }}>
            {items.length} saved {items.length === 1 ? "product" : "products"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {items.length > 0 && (
            <button onClick={handleClear} disabled={clearing} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 16px", height: "40px", borderRadius: "4px", fontSize: "14px", fontWeight: 500, color: "#f87171", background: "transparent", border: "1.5px solid rgba(248,113,113,0.5)", cursor: clearing ? "not-allowed" : "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.06)"; e.currentTarget.style.borderColor = "#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.5)"; }}>
              <X size={15} /> {clearing ? "Clearing..." : "Clear all"}
            </button>
          )}
          <button onClick={openModal} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 20px", height: "40px", borderRadius: "4px", fontSize: "14px", fontWeight: 600, color: "rgba(0,113,227,1)", background: "transparent", border: "1.5px solid rgba(0,113,227,0.6)", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,113,227,0.06)"; e.currentTarget.style.borderColor = "rgba(0,113,227,1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(0,113,227,0.6)"; }}>
            <Plus size={15} /> Add Product
          </button>
        </div>
      </div>

      {loading ? <p style={{ color: "var(--text-3)" }}>Loading...</p> : (
        <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--card)" }}>
          <table>
            <thead>
              <tr>{["Product", "Category", "Price", "Added", "Actions"].map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {item.product_image && /^(https?:\/\/|\/)/.test(item.product_image) ? (
                        <img src={item.product_image} alt={item.product_name} style={{ width: "36px", height: "36px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <ImageIcon size={14} color="var(--text-3)" />
                        </div>
                      )}
                      <span style={{ fontWeight: 500, color: "var(--text)" }}>{item.product_name}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-2)" }}>{item.product_category}</td>
                  <td style={{ fontWeight: 600, color: "var(--green)" }}>Rs. {parseFloat(item.product_price).toFixed(2)}</td>
                  <td style={{ color: "var(--text-3)" }}>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button onClick={() => openOrderModal(item)}
                        style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 14px", borderRadius: "99px", fontSize: "13px", fontWeight: 600, color: "#fff", background: "rgba(0,113,227,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,113,227,0.4)", boxShadow: "0 2px 12px rgba(0,113,227,0.25)", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(0,113,227,1)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(0,113,227,0.85)"}>
                        <ShoppingBag size={13} /> Order
                      </button>
                      <button onClick={() => handleRemove(item.id)} disabled={removingId === item.id} style={{ padding: "6px", borderRadius: "8px", color: "#f87171", background: "transparent", border: "none", cursor: "pointer" }} title="Remove">
                        {removingId === item.id ? <span style={{ fontSize: "12px", color: "var(--text-3)" }}>...</span> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "80px 20px", textAlign: "center", color: "var(--text-3)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                      <Heart size={40} color="var(--border-strong)" />
                      <p style={{ fontSize: "16px" }}>Your wishlist is empty.</p>
                      <button onClick={openModal} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 20px", height: "42px", borderRadius: "12px", fontSize: "15px", fontWeight: 600, color: "#fff", background: "rgba(0,113,227,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,113,227,0.4)", boxShadow: "0 4px 24px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,113,227,1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,113,227,0.85)"; }}>
                        <Plus size={16} /> Browse Products
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Browse Products Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(16px)" }}>
          <div style={{ width: "100%", maxWidth: "580px", maxHeight: "85vh", display: "flex", flexDirection: "column", borderRadius: "24px", background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "0 40px 80px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px 0" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>Browse Products</h2>
              <button onClick={() => setModal(false)} style={{ width: "30px", height: "30px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)" }}><X size={15} /></button>
            </div>
            <div style={{ padding: "16px 28px" }}>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, SKU or category..." style={{ paddingLeft: "42px" }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 28px 24px" }}>
              {productsLoading ? (
                <p style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)" }}>Loading products...</p>
              ) : filtered.length === 0 ? (
                <p style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)" }}>No products found.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {filtered.map((p) => {
                    const inWishlist = wishlistProductIds.has(p.id);
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", borderRadius: "14px", background: "var(--card-2)", border: `1px solid ${inWishlist ? "rgba(248,113,113,0.2)" : "var(--border)"}` }}>
                        {p.image && /^(https?:\/\/|\/)/.test(p.image) ? (
                          <img src={p.image} alt={p.name} style={{ width: "44px", height: "44px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "var(--card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <ImageIcon size={16} color="var(--text-3)" />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                          <p style={{ fontSize: "13px", color: "var(--text-3)", marginTop: "2px" }}>{p.category} · <span style={{ fontFamily: "monospace" }}>{p.sku}</span></p>
                        </div>
                        <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--green)", flexShrink: 0 }}>Rs. {parseFloat(p.price).toFixed(2)}</p>
                        <button
                          onClick={() => !inWishlist && handleAdd(p.id)}
                          disabled={inWishlist || addingId === p.id}
                          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 16px", height: "38px", borderRadius: "99px", fontSize: "14px", fontWeight: 600, flexShrink: 0, color: inWishlist ? "#f87171" : "#fff", background: inWishlist ? "rgba(248,113,113,0.1)" : addingId === p.id ? "#c7c7cc" : "rgba(0,113,227,0.85)", backdropFilter: inWishlist ? "none" : "blur(12px)", WebkitBackdropFilter: inWishlist ? "none" : "blur(12px)", border: inWishlist ? "1px solid rgba(248,113,113,0.3)" : "1px solid rgba(0,113,227,0.4)", boxShadow: inWishlist || addingId === p.id ? "none" : "0 4px 16px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", cursor: inWishlist ? "default" : "pointer", transition: "all 0.2s" }}>
                          <Heart size={14} fill={inWishlist ? "#f87171" : "none"} />
                          {addingId === p.id ? "Adding..." : inWishlist ? "Saved" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {orderModal && orderItem && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(16px)" }}>
          <div style={{ width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", borderRadius: "24px", padding: "28px", background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "0 40px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>Place Order</h2>
              <button onClick={closeOrderModal} style={{ width: "30px", height: "30px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)" }}><X size={15} /></button>
            </div>

            {/* Product preview */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", borderRadius: "14px", background: "var(--card-2)", border: "1px solid var(--border)", marginBottom: "20px" }}>
              {orderItem.product_image && /^(https?:\/\/|\/)/.test(orderItem.product_image) ? (
                <img src={orderItem.product_image} alt={orderItem.product_name} style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "var(--card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ImageIcon size={18} color="var(--text-3)" />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{orderItem.product_name}</p>
                <p style={{ fontSize: "13px", color: "var(--text-3)" }}>{orderItem.product_category}</p>
              </div>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--green)", flexShrink: 0 }}>Rs. {parseFloat(orderItem.product_price).toFixed(2)}</p>
            </div>

            {orderSuccess ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "32px 0", textAlign: "center" }}>
                <CheckCircle size={52} color="#34c759" />
                <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)" }}>Order placed!</p>
                <p style={{ fontSize: "14px", color: "var(--text-2)" }}>Thank you for your purchase.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateOrder} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {orderError && <div style={{ padding: "12px 16px", borderRadius: "12px", fontSize: "14px", color: "var(--red)", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>{orderError}</div>}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "7px" }}>Customer Name</label>
                    <input value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "7px" }}>Delivery City</label>
                    <input value={deliveryCity} onChange={e => setDeliveryCity(e.target.value)} placeholder="e.g. Kathmandu" required />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "7px" }}>Payment Method</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                      <option value="cod">Cash on Delivery</option>
                      <option value="esewa">eSewa</option>
                      <option value="khalti">Khalti</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "7px" }}>Quantity</label>
                    <input type="number" min={1} value={quantity} onChange={e => { setQuantity(parseInt(e.target.value) || 1); setCouponResult(null); }} />
                  </div>
                </div>

                {/* Subtotal */}
                <div style={{ padding: "12px 16px", borderRadius: "12px", background: "var(--card-2)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--text-2)" }}>
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>Rs. {subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--green)", marginTop: "6px" }}>
                        <span>Discount</span><span style={{ fontWeight: 600 }}>-Rs. {discount.toFixed(2)}</span>
                      </div>
                      <div style={{ height: "1px", background: "var(--border)", margin: "8px 0" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>
                        <span>Total</span><span style={{ color: "#0071e3" }}>Rs. {(subtotal - discount).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Coupon */}
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "7px" }}>
                    <Tag size={13} /> Coupon <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); setCouponError(""); }} placeholder="e.g. SAVE20" style={{ fontFamily: "monospace" }} />
                    <button type="button" onClick={handleApplyCoupon} disabled={couponApplying || !couponCode.trim()}
                      style={{ padding: "0 16px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, color: "#fff", background: couponApplying || !couponCode.trim() ? "#c7c7cc" : "rgba(0,113,227,0.85)", border: "1px solid rgba(0,113,227,0.4)", cursor: couponApplying || !couponCode.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                      {couponApplying ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponResult && (
                    <div style={{ marginTop: "8px", padding: "10px 14px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", color: "var(--green)", fontSize: "13px" }}>
                      <CheckCircle size={13} /> {couponResult.message ?? `Applied! Save Rs. ${parseFloat(couponResult.discount_amount).toFixed(2)}`}
                    </div>
                  )}
                  {couponError && <div style={{ marginTop: "8px", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "var(--red)" }}>{couponError}</div>}
                </div>

                <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                  <button type="button" onClick={closeOrderModal} style={{ flex: 1, height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 500, color: "var(--text)", background: "var(--card-2)", border: "1px solid var(--border)", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" disabled={orderSaving} style={{ flex: 1, height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "#fff", background: orderSaving ? "#c7c7cc" : "rgba(0,113,227,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,113,227,0.4)", boxShadow: orderSaving ? "none" : "0 4px 24px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", cursor: orderSaving ? "not-allowed" : "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { if (!orderSaving) { e.currentTarget.style.background = "rgba(0,113,227,1)"; } }}
                    onMouseLeave={e => { if (!orderSaving) { e.currentTarget.style.background = "rgba(0,113,227,0.85)"; } }}>
                    {orderSaving ? "Placing..." : "Place Order"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {esewaModal && esewaOrderId && (
        <EsewaPayment
          orderId={esewaOrderId}
          amount={esewaAmount}
          onClose={() => setEsewaModal(false)}
        />
      )}

      {khaltiModal && khaltiOrderId && (
        <KhaltiPayment
          orderId={khaltiOrderId}
          amount={khaltiAmount}
          onClose={() => setKhaltiModal(false)}
        />
      )}
    </div>
  );
}
