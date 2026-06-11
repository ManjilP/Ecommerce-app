"use client";
import { useEffect, useState } from "react";
import { getProducts, addToWishlist, getWishlist, getUnreadNotificationCount, logout, createOrder, applyCoupon, getMe, getInventory } from "@/lib/api";
import Link from "next/link";
import { Heart, ShoppingCart, Star, Bell, KeyRound, LogOut, Moon, Sun, X, Plus, Tag, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { InteractiveCheckout, type CheckoutProduct } from "@/components/ui/interactive-checkout";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number | string;
  image?: string;
}

interface InventoryItem {
  product: number;
  quantity: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
}

const userNav = [
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/reviews", label: "My Reviews", icon: Star },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export default function LandingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [addingId, setAddingId] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("customer");
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [orderModal, setOrderModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [items, setItems] = useState<{ product: string; quantity: number }[]>([{ product: "", quantity: 1 }]);
  const [saving, setSaving] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<{ discount_amount: string; final_amount: string; message?: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);
    if (token) {
      getMe().then((r) => {
        setUsername(r.data.username || "");
        setRole(r.data.role || "customer");
      }).catch(() => setUsername(localStorage.getItem("username") ?? ""));
      getUnreadNotificationCount().then((r) => setUnreadCount(r.data?.count ?? 0)).catch(() => {});
    }

    getProducts()
      .then((r) => setProducts(Array.isArray(r.data) ? r.data : r.data.results ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

    if (token) {
      getInventory()
        .then((r) => setInventory(Array.isArray(r.data) ? r.data : r.data.results ?? []))
        .catch(() => {});
    }

    if (token) {
      getWishlist()
        .then((r) => {
          const items = Array.isArray(r.data) ? r.data : r.data.results ?? [];
          setWishlistIds(new Set(items.map((i: { product_id: number }) => i.product_id)));
        })
        .catch(() => {});
    }
  }, []);

  const handleWishlist = async (productId: number) => {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (wishlistIds.has(productId)) return;
    setAddingId(productId);
    try {
      await addToWishlist(productId);
      setWishlistIds((prev) => new Set([...prev, productId]));
    } catch {
    } finally {
      setAddingId(null);
    }
  };

  const openOrderModal = (product?: Product) => {
    if (!isLoggedIn) { router.push("/login"); return; }
    setOrderError(""); setOrderSuccess(false);
    setCouponCode(""); setCouponResult(null); setCouponError("");
    setItems(product ? [{ product: String(product.id), quantity: 1 }] : [{ product: "", quantity: 1 }]);
    setOrderModal(true);
  };

  const closeOrderModal = () => {
    setOrderModal(false);
    setCustomerName(""); setDeliveryCity(""); setPaymentMethod("cod");
    setItems([{ product: "", quantity: 1 }]);
    setCouponCode(""); setCouponResult(null); setCouponError("");
    setOrderError(""); setOrderSuccess(false);
  };

  const getSubtotal = () => items.reduce((sum, item) => {
    const p = products.find(p => String(p.id) === item.product);
    return sum + (p ? parseFloat(String(p.price)) * item.quantity : 0);
  }, 0);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponApplying(true); setCouponError(""); setCouponResult(null);
    try {
      const { data } = await applyCoupon(couponCode.trim(), getSubtotal().toFixed(2));
      setCouponResult(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string; error?: string } } })?.response?.data;
      setCouponError(msg?.detail ?? msg?.error ?? "Invalid or expired coupon.");
    } finally { setCouponApplying(false); }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setOrderError("");
    try {
      await createOrder({ customer_name: customerName, delivery_city: deliveryCity, payment_method: paymentMethod, items: items.map(i => ({ product: parseInt(i.product), quantity: i.quantity })) });
      setOrderSuccess(true);
      setTimeout(() => closeOrderModal(), 2000);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        if (typeof obj.error === "string") {
          setOrderError(obj.error);
        } else if (typeof obj.detail === "string") {
          setOrderError(obj.detail);
        } else {
          const msgs = Object.entries(obj)
            .map(([field, val]) => `${field}: ${Array.isArray(val) ? val.join(", ") : val}`)
            .join("\n");
          setOrderError(msgs);
        }
      } else {
        setOrderError("Failed to place order. Check all fields and try again.");
      }
    } finally { setSaving(false); }
  };

  const addItem = () => setItems([...items, { product: "", quantity: 1 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) =>
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: field === "quantity" ? (Number(value) || 1) : value } : item));

  const checkoutProducts: CheckoutProduct[] = products.map((p) => {
    const inv = inventory.find((i) => (i.product === p.id) || ((i as unknown as Record<string, unknown>).product_id === p.id));
    const rawStatus = inv?.stock_status ?? (inv as unknown as Record<string, unknown>)?.status as string;
    const normalizeStatus = (s: string | undefined): "in_stock" | "low_stock" | "out_of_stock" | undefined => {
      if (!s) return undefined;
      const lower = s.toLowerCase().replace(/\s+/g, "_");
      if (lower.includes("low")) return "low_stock";
      if (lower.includes("out") || lower === "out_of_stock") return "out_of_stock";
      if (lower.includes("in") || lower === "in_stock") return "in_stock";
      return undefined;
    };
    return {
      id: p.id,
      name: p.name,
      price: parseFloat(String(p.price)),
      category: p.category,
      image: p.image,
      stockStatus: normalizeStatus(rawStatus),
      stockQty: inv?.quantity,
    };
  });

  const handleCartCheckout = (cartItems: { productId: number; quantity: number }[]) => {
    if (!isLoggedIn) { router.push("/login"); return; }
    setOrderError(""); setOrderSuccess(false);
    setCouponCode(""); setCouponResult(null); setCouponError("");
    setItems(cartItems.map((i) => ({ product: String(i.productId), quantity: i.quantity })));
    setOrderModal(true);
  };

  const handleLogout = async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) { try { await logout(refresh); } catch { } }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("is_admin");
    localStorage.removeItem("orders_cache");
    localStorage.removeItem("username");
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const itemStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "0 16px",
    height: "50px",
    borderRadius: "14px",
    fontWeight: 500,
    fontSize: "16px",
    color: active ? "var(--text)" : "var(--text-2)",
    background: active ? "var(--card-2)" : "transparent",
    transition: "all 0.15s",
    cursor: "pointer",
    textDecoration: "none",
    width: "100%",
    border: "none",
  });

  const categories = [...new Set(products.map((p) => p.category))].slice(0, 4);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>

      {/* Sidebar */}
      <aside style={{ width: sidebarOpen ? "264px" : "68px", minWidth: sidebarOpen ? "264px" : "68px", height: "100vh", position: "sticky", top: 0, background: "var(--bg-elevated)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", transition: "width 0.25s ease, min-width 0.25s ease", overflow: "hidden" }}>

        {/* Logo + toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
            <img src="/logo.png" alt="logo" style={{ width: "32px", height: "32px", objectFit: "contain", flexShrink: 0 }} />
            {sidebarOpen && (
              <div style={{ whiteSpace: "nowrap" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>ShopHub</div>
                <div style={{ fontSize: "13px", color: "var(--text-3)", lineHeight: 1.2 }}>Store</div>
              </div>
            )}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ width: "28px", height: "28px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)", flexShrink: 0 }}>
            {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          </button>
        </div>

        <div style={{ height: "1px", background: "var(--border)", margin: "0 12px 12px" }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: "4px 8px", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
          {isLoggedIn ? userNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            const isNotif = href === "/notifications";
            return (
              <Link key={href} href={href} style={{ ...itemStyle(active), justifyContent: sidebarOpen ? "flex-start" : "center", padding: sidebarOpen ? "0 16px" : "0" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Icon size={20} strokeWidth={active ? 2 : 1.7} />
                  {isNotif && unreadCount > 0 && (
                    <span style={{ position: "absolute", top: "-6px", right: "-6px", minWidth: "16px", height: "16px", borderRadius: "99px", background: "#ef4444", color: "#fff", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                {sidebarOpen && <span>{label}</span>}
                {sidebarOpen && active && <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "99px", background: "var(--accent)", flexShrink: 0 }} />}
              </Link>
            );
          }) : (
            <>
              <Link href="/login" style={{ ...itemStyle(false), justifyContent: sidebarOpen ? "flex-start" : "center", padding: sidebarOpen ? "0 16px" : "0" }}>
                {sidebarOpen ? <span>Sign in</span> : <span style={{ fontSize: "11px", fontWeight: 600 }}>In</span>}
              </Link>
              <Link href="/register" style={{ ...itemStyle(false), color: "var(--accent)", justifyContent: sidebarOpen ? "flex-start" : "center", padding: sidebarOpen ? "0 16px" : "0" }}>
                {sidebarOpen ? <span>Register</span> : <span style={{ fontSize: "11px", fontWeight: 600 }}>Reg</span>}
              </Link>
            </>
          )}
        </nav>

        {/* User profile */}
        {isLoggedIn && username && (
          <>
            <div style={{ height: "1px", background: "var(--border)", margin: "8px 12px" }} />
            <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: sidebarOpen ? "12px" : "0", justifyContent: sidebarOpen ? "flex-start" : "center", margin: "4px 8px", padding: "10px 8px", borderRadius: "14px", textDecoration: "none", background: "transparent", transition: "background 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ width: "34px", height: "34px", borderRadius: "99px", background: "linear-gradient(135deg, var(--accent), rgba(14,116,144,0.5))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{username.slice(0, 2).toUpperCase()}</span>
              </div>
              {sidebarOpen && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-3)", textTransform: "capitalize" }}>{role}</p>
                </div>
              )}
            </Link>
          </>
        )}

        {/* Bottom */}
        <div style={{ height: "1px", background: "var(--border)", margin: "8px 12px 12px" }} />
        <div style={{ padding: "0 8px 20px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {isLoggedIn && (
            <Link href="/change-password" style={{ ...itemStyle(false), justifyContent: sidebarOpen ? "flex-start" : "center", padding: sidebarOpen ? "0 16px" : "0" }}>
              <KeyRound size={20} strokeWidth={1.7} />
              {sidebarOpen && <span>Change Password</span>}
            </Link>
          )}
          <button
            onClick={toggle}
            style={{ ...itemStyle(false), justifyContent: sidebarOpen ? "space-between" : "center", padding: sidebarOpen ? "0 16px" : "0" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(128,128,128,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {theme === "light" ? <Moon size={20} strokeWidth={1.7} /> : <Sun size={20} strokeWidth={1.7} />}
              {sidebarOpen && <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>}
            </div>
            {sidebarOpen && (
              <div style={{ width: "36px", height: "20px", borderRadius: "99px", background: theme === "dark" ? "var(--accent)" : "var(--border-strong)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: "2px", left: theme === "dark" ? "18px" : "2px", width: "16px", height: "16px", borderRadius: "99px", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
              </div>
            )}
          </button>

          {isLoggedIn && (
            <button
              onClick={handleLogout}
              style={{ ...itemStyle(false), color: "#f87171", justifyContent: sidebarOpen ? "flex-start" : "center", padding: sidebarOpen ? "0 16px" : "0" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(248,113,113,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <LogOut size={20} strokeWidth={1.7} />
              {sidebarOpen && <span>Sign out</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto" }}>

        {/* Hero */}
        <section style={{ padding: "60px 40px 40px", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-3)", letterSpacing: "1px", marginBottom: "12px", textTransform: "uppercase" }}>Welcome to ShopHub</p>
          <h1 style={{ fontSize: "48px", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: "16px", color: "var(--text)" }}>
            Discover Tomorrow,<br />Today.
          </h1>
          <p style={{ fontSize: "17px", color: "var(--text-2)", marginBottom: "28px", maxWidth: "480px" }}>
            Explore our full collection of premium products.
          </p>
          <button onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
            style={{ padding: "12px 32px", fontSize: "15px", fontWeight: 600, color: "#fff", background: "var(--accent)", border: "none", borderRadius: "10px", cursor: "pointer" }}>
            Shop Now
          </button>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section style={{ padding: "28px 40px 0" }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {categories.map((cat) => (
                <span key={cat} style={{ padding: "6px 16px", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", background: "var(--card-2)", borderRadius: "99px", border: "1px solid var(--border)" }}>
                  {cat}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Products */}
        <section id="products" style={{ padding: "32px 40px 60px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)" }}>All Products</h2>
            {isLoggedIn && products.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {products.filter((p) => wishlistIds.has(p.id)).length > 0 && (
                  <span style={{ fontSize: "13px", color: "var(--text-3)" }}>
                    <Heart size={12} style={{ display: "inline", marginRight: "4px" }} fill="#ef4444" color="#ef4444" />
                    {wishlistIds.size} wishlisted
                  </span>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ borderRadius: "16px", background: "var(--card-2)", height: "84px" }} />
              ))}
            </div>
          ) : (
            <InteractiveCheckout
              products={checkoutProducts}
              onCheckout={handleCartCheckout}
              isLoggedIn={isLoggedIn}
              onLoginRequired={() => router.push("/login")}
            />
          )}
        </section>

        {/* CTA for guests */}
        {!isLoggedIn && (
          <section style={{ padding: "48px 40px", background: "var(--card-2)", textAlign: "center", borderTop: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.5px", marginBottom: "10px", color: "var(--text)" }}>Ready to shop?</h2>
            <p style={{ fontSize: "15px", color: "var(--text-2)", marginBottom: "24px" }}>Create an account to place orders and save items to your wishlist.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <Link href="/register" style={{ padding: "11px 28px", fontSize: "14px", fontWeight: 600, color: "#fff", background: "var(--accent)", borderRadius: "10px", textDecoration: "none" }}>Get started</Link>
              <Link href="/login" style={{ padding: "11px 28px", fontSize: "14px", fontWeight: 600, color: "var(--text)", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", textDecoration: "none" }}>Sign in</Link>
            </div>
          </section>
        )}
      </main>

      {/* Order Modal */}
      {orderModal && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(16px)" }}>
          <div style={{ width: "100%", maxWidth: "540px", maxHeight: "90vh", overflowY: "auto", borderRadius: "24px", padding: "28px", background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "0 40px 80px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>Place Order</h2>
              <button onClick={closeOrderModal} style={{ width: "30px", height: "30px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)" }}><X size={15} /></button>
            </div>

            {orderSuccess ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "32px 0", textAlign: "center" }}>
                <CheckCircle size={52} color="#34c759" />
                <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)" }}>Order placed!</p>
                <p style={{ fontSize: "14px", color: "var(--text-2)" }}>Thank you for your purchase.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateOrder} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {orderError && <div style={{ padding: "12px 16px", borderRadius: "12px", fontSize: "14px", color: "#ff3b30", background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.2)" }}>{orderError}</div>}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "7px" }}>Customer Name</label>
                    <input value={customerName} onChange={e => setCustomerName(e.target.value)} required style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "14px", outline: "none", background: "var(--card-2)", color: "var(--text)", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "7px" }}>Delivery City</label>
                    <input value={deliveryCity} onChange={e => setDeliveryCity(e.target.value)} placeholder="e.g. Kathmandu" required style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "14px", outline: "none", background: "var(--card-2)", color: "var(--text)", boxSizing: "border-box" }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "7px" }}>Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "14px", outline: "none", background: "var(--card-2)", color: "var(--text)", appearance: "none" }}>
                    <option value="cod">Cash on Delivery</option>
                  </select>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-2)" }}>Order Items</label>
                    <button type="button" onClick={addItem} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 500, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
                      <Plus size={13} /> Add item
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {items.map((item, i) => {
                      const sel = products.find(p => String(p.id) === item.product);
                      return (
                        <div key={i} style={{ borderRadius: "12px", padding: "12px 14px", background: "var(--card-2)", border: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-2)" }}>Item {i + 1}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {sel && <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent)" }}>Rs. {(parseFloat(String(sel.price)) * item.quantity).toFixed(2)}</span>}
                              {items.length > 1 && <button type="button" onClick={() => removeItem(i)} style={{ color: "#ff3b30", background: "none", border: "none", cursor: "pointer" }}><X size={13} /></button>}
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px" }}>
                            <select value={item.product} onChange={e => { updateItem(i, "product", e.target.value); setCouponResult(null); }} required style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "14px", outline: "none", background: "var(--bg-elevated)", color: "var(--text)" }}>
                              <option value="">Select product...</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name} — Rs. {parseFloat(String(p.price)).toFixed(2)}</option>)}
                            </select>
                            <input type="number" min={1} value={item.quantity} onChange={e => { updateItem(i, "quantity", parseInt(e.target.value)); setCouponResult(null); }} style={{ width: "72px", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "14px", outline: "none", background: "var(--bg-elevated)", color: "var(--text)" }} required />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {getSubtotal() > 0 && (
                  <div style={{ borderRadius: "12px", padding: "14px 16px", background: "var(--card-2)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--text-2)" }}>
                      <span>Subtotal</span><span style={{ fontWeight: 600, color: "var(--text)" }}>Rs. {getSubtotal().toFixed(2)}</span>
                    </div>
                    {couponResult && parseFloat(couponResult.discount_amount) > 0 && (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#34c759", marginTop: "6px" }}>
                          <span>Discount</span><span style={{ fontWeight: 600 }}>-Rs. {parseFloat(couponResult.discount_amount).toFixed(2)}</span>
                        </div>
                        <div style={{ height: "1px", background: "var(--border)", margin: "10px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
                          <span>Total</span><span style={{ color: "var(--accent)" }}>Rs. {(getSubtotal() - parseFloat(couponResult.discount_amount)).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "7px" }}>
                    <Tag size={13} /> Coupon <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); setCouponError(""); }} placeholder="e.g. SAVE20" style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "14px", outline: "none", background: "var(--card-2)", color: "var(--text)", fontFamily: "monospace" }} />
                    <button type="button" onClick={handleApplyCoupon} disabled={couponApplying || !couponCode.trim() || getSubtotal() === 0}
                      style={{ padding: "0 18px", borderRadius: "10px", fontSize: "14px", fontWeight: 500, color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap", background: couponApplying || !couponCode.trim() ? "#c7c7cc" : "var(--accent)" }}>
                      {couponApplying ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponResult && (
                    <div style={{ marginTop: "8px", padding: "10px 14px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.3)", color: "#34c759", fontSize: "13px" }}>
                      <CheckCircle size={13} /> {couponResult.message ?? `Applied! Save Rs. ${parseFloat(couponResult.discount_amount).toFixed(2)}`}
                    </div>
                  )}
                  {couponError && <div style={{ marginTop: "8px", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.2)", color: "#ff3b30" }}>{couponError}</div>}
                </div>

                <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                  <button type="button" onClick={closeOrderModal} style={{ flex: 1, height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 500, color: "var(--text)", border: "1px solid var(--border)", background: "var(--card-2)", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ flex: 1, height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "#fff", border: "none", cursor: "pointer", background: saving ? "#c7c7cc" : "var(--accent)", transition: "all 0.2s" }}>
                    {saving ? "Placing..." : "Place Order"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
