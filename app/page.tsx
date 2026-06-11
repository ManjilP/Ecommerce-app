"use client";
import { useEffect, useState, useRef } from "react";
import { getProducts, addToWishlist, getWishlist, createOrder, applyCoupon, getUnreadNotificationCount, logout, getMe, getInventory } from "@/lib/api";
import Link from "next/link";
import { Heart, X, Plus, Tag, CheckCircle, Star, Package, Bell, KeyRound, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { InteractiveCheckout, type CheckoutProduct } from "@/components/ui/interactive-checkout";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import EsewaPayment from "@/components/ui/esewa-payment";
import KhaltiPayment from "@/components/ui/khalti-payment";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

interface Product {
  id: number;
  name: string;
  sku?: string;
  category: string;
  price: number | string;
  image?: string;
}
interface OrderItem { product: string; quantity: number; }

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}ms, transform 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

const glassBtn: React.CSSProperties = {
  background: "var(--card-2)",
  border: "1px solid var(--border)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

const glassPrimary: React.CSSProperties = {
  background: "rgba(0,113,227,0.85)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(0,113,227,0.4)",
  boxShadow: "0 4px 20px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
};

const glassCard: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  boxShadow: "var(--card-shadow)",
};

const userNav = [
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/reviews", label: "My Reviews", icon: Star },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [addingId, setAddingId] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("customer");
  const [activeCategory, setActiveCategory] = useState("All");
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inventory, setInventory] = useState<{ product: number; quantity: number; stock_status: "in_stock" | "low_stock" | "out_of_stock" }[]>([]);

  const [orderModal, setOrderModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [items, setItems] = useState<OrderItem[]>([{ product: "", quantity: 1 }]);
  const [saving, setSaving] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [esewaModal, setEsewaModal] = useState(false);
  const [esewaOrderId, setEsewaOrderId] = useState<number | null>(null);
  const [esewaAmount, setEsewaAmount] = useState(0);
  const [khaltiModal, setKhaltiModal] = useState(false);
  const [khaltiOrderId, setKhaltiOrderId] = useState<number | null>(null);
  const [khaltiAmount, setKhaltiAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<{ discount_amount: string; final_amount: string; message?: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);
    if (localStorage.getItem("is_admin") === "true") {
      router.replace("/dashboard");
      return;
    }
    if (token) {
      getMe().then((r) => {
        setUsername(r.data.username || "");
        setRole(r.data.role || "customer");
      }).catch(() => setUsername(localStorage.getItem("username") || ""));
    }
    getProducts()
      .then((r) => setProducts(Array.isArray(r.data) ? r.data : r.data.results ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    if (token) {
      getWishlist().then((r) => {
        const list = Array.isArray(r.data) ? r.data : r.data.results ?? [];
        setWishlistIds(new Set(list.map((i: { product_id: number }) => i.product_id)));
      }).catch(() => {});
    }
    if (token) {
      getUnreadNotificationCount().then((r) => setUnreadCount(r.data?.count ?? 0)).catch(() => {});
    }
    if (token) {
      getInventory()
        .then((r) => setInventory(Array.isArray(r.data) ? r.data : r.data.results ?? []))
        .catch(() => {});
    }
  }, []);

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

  const sidebarItem = (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: "14px",
    padding: "0 16px", height: "50px", borderRadius: "14px",
    fontWeight: 500, fontSize: "16px",
    color: active ? "var(--text)" : "var(--text-2)",
    background: active ? "var(--card-2)" : "transparent",
    transition: "all 0.15s", cursor: "pointer",
    textDecoration: "none", width: "100%", border: "none",
  });

  const handleWishlist = async (productId: number) => {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (wishlistIds.has(productId) || addingId === productId) return;
    setAddingId(productId);
    try { await addToWishlist(productId); setWishlistIds(p => new Set([...p, productId])); }
    catch { } finally { setAddingId(null); }
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
      const res = await createOrder({ customer_name: customerName, delivery_city: deliveryCity, payment_method: paymentMethod, items: items.map(i => ({ product: parseInt(i.product), quantity: i.quantity })) });
      if (paymentMethod === "esewa") {
        const total = couponResult ? parseFloat(couponResult.final_amount) : getSubtotal();
        setEsewaOrderId(res.data.id);
        setEsewaAmount(total);
        closeOrderModal();
        setEsewaModal(true);
      } else if (paymentMethod === "khalti") {
        const total = couponResult ? parseFloat(couponResult.final_amount) : getSubtotal();
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
        // Single "error" or "detail" key → show message directly
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

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];
  const filtered = activeCategory === "All" ? products : products.filter(p => p.category === activeCategory);

  const checkoutProducts: CheckoutProduct[] = filtered.map((p) => {
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

  const subtotal = getSubtotal();
  const discount = couponResult ? parseFloat(couponResult.discount_amount) : 0;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: "10px",
    border: "1px solid var(--border-strong)", fontSize: "14px", outline: "none",
    background: "var(--card-2)", boxSizing: "border-box", color: "var(--text)",
  };

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
              <Link key={href} href={href} style={{ ...sidebarItem(active), justifyContent: sidebarOpen ? "flex-start" : "center", padding: sidebarOpen ? "0 16px" : "0" }}>
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
              <Link href="/login" style={{ ...sidebarItem(false), justifyContent: sidebarOpen ? "flex-start" : "center", padding: sidebarOpen ? "0 16px" : "0" }}>
                {sidebarOpen ? <span>Sign in</span> : <span style={{ fontSize: "11px", fontWeight: 600 }}>In</span>}
              </Link>
              <Link href="/register" style={{ ...sidebarItem(false), color: "var(--accent)", justifyContent: sidebarOpen ? "flex-start" : "center", padding: sidebarOpen ? "0 16px" : "0" }}>
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
              onMouseEnter={e => { e.currentTarget.style.background = "var(--card-2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
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
            <Link href="/change-password" style={{ ...sidebarItem(false), justifyContent: sidebarOpen ? "flex-start" : "center", padding: sidebarOpen ? "0 16px" : "0" }}>
              <KeyRound size={20} strokeWidth={1.7} />
              {sidebarOpen && <span>Change Password</span>}
            </Link>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: sidebarOpen ? "space-between" : "center", padding: sidebarOpen ? "0 16px" : "0", height: "50px" }}>
            {sidebarOpen && <span style={{ fontSize: "16px", fontWeight: 500, color: "var(--text-2)" }}>{theme === "light" ? "Dark mode" : "Light mode"}</span>}
            <ThemeToggle />
          </div>
          {isLoggedIn && (
            <button onClick={handleLogout} style={{ ...sidebarItem(false), color: "#f87171", justifyContent: sidebarOpen ? "flex-start" : "center", padding: sidebarOpen ? "0 16px" : "0" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <LogOut size={20} strokeWidth={1.7} />
              {sidebarOpen && <span>Sign out</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, overflowY: "auto" }}>

      {/* Category strip */}
      {categories.length > 1 && (
        <div style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "center", gap: "8px", padding: "16px 40px", flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              style={{ padding: "7px 18px", fontSize: "13px", fontWeight: 500, borderRadius: "99px", cursor: "pointer", transition: "all 0.2s", border: "none", ...(activeCategory === cat ? glassPrimary : glassBtn), color: activeCategory === cat ? "#fff" : "var(--text)" }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Products */}
      <section style={{ padding: "48px 40px 100px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <FadeIn>
            <h2 style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", marginBottom: "4px" }}>
              {activeCategory === "All" ? "All Products" : activeCategory}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-2)", marginBottom: "32px" }}>{filtered.length} items</p>
          </FadeIn>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
              {[...Array(6)].map((_, i) => <div key={i} style={{ height: "360px", borderRadius: "20px", ...glassCard }} />)}
            </div>
          ) : (
            <InteractiveCheckout
              products={checkoutProducts}
              onCheckout={handleCartCheckout}
              isLoggedIn={isLoggedIn}
              onLoginRequired={() => router.push("/login")}
            />
          )}
        </div>
      </section>

      {!isLoggedIn && (
        <section style={{ padding: "80px 40px", textAlign: "center", background: "var(--bg-elevated)", borderTop: "1px solid var(--border)" }}>
          <FadeIn>
            <h2 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-1px", color: "var(--text)", marginBottom: "10px" }}>Ready to shop?</h2>
            <p style={{ fontSize: "17px", color: "var(--text-2)", marginBottom: "32px" }}>Create an account to place orders and save items to your wishlist.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <Link href="/register" style={{ padding: "13px 32px", fontSize: "15px", fontWeight: 600, color: "#fff", textDecoration: "none", borderRadius: "99px", ...glassPrimary, transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,113,227,1)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(0,113,227,0.85)"}>
                Get started
              </Link>
              <Link href="/login" style={{ padding: "13px 32px", fontSize: "15px", fontWeight: 500, color: "var(--text)", textDecoration: "none", borderRadius: "99px", ...glassBtn, transition: "all 0.2s" }}>
                Sign in
              </Link>
            </div>
          </FadeIn>
        </section>
      )}

      {/* Order Modal */}
      {orderModal && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(16px)" }}>
          <div style={{ width: "100%", maxWidth: "540px", maxHeight: "90vh", overflowY: "auto", borderRadius: "24px", padding: "28px", background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "0 40px 80px rgba(0,0,0,0.25)" }}>
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
                    <input value={customerName} onChange={e => setCustomerName(e.target.value)} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "7px" }}>Delivery City</label>
                    <input value={deliveryCity} onChange={e => setDeliveryCity(e.target.value)} placeholder="e.g. Kathmandu" required style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "7px" }}>Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="cod">Cash on Delivery</option>
                    <option value="esewa">eSewa</option>
                    <option value="khalti">Khalti</option>
                  </select>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-2)" }}>Order Items</label>
                    <button type="button" onClick={addItem} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 500, color: "#0071e3", background: "none", border: "none", cursor: "pointer" }}>
                      <Plus size={13} /> Add item
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {items.map((item, i) => {
                      const sel = products.find(p => String(p.id) === item.product);
                      return (
                        <div key={i} style={{ borderRadius: "12px", padding: "12px 14px", ...glassBtn }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-2)" }}>Item {i + 1}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {sel && <span style={{ fontSize: "13px", fontWeight: 600, color: "#0071e3" }}>Rs. {(parseFloat(String(sel.price)) * item.quantity).toFixed(2)}</span>}
                              {items.length > 1 && <button type="button" onClick={() => removeItem(i)} style={{ color: "#ff3b30", background: "none", border: "none", cursor: "pointer" }}><X size={13} /></button>}
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px" }}>
                            <select value={item.product} onChange={e => { updateItem(i, "product", e.target.value); setCouponResult(null); }} required style={{ ...inputStyle, padding: "8px 12px" }}>
                              <option value="">Select product...</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name} — Rs. {parseFloat(String(p.price)).toFixed(2)}</option>)}
                            </select>
                            <input type="number" min={1} value={item.quantity} onChange={e => { updateItem(i, "quantity", parseInt(e.target.value)); setCouponResult(null); }} style={{ ...inputStyle, width: "72px", padding: "8px 10px" }} required />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {subtotal > 0 && (
                  <div style={{ borderRadius: "12px", padding: "14px 16px", ...glassBtn }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--text-2)" }}>
                      <span>Subtotal</span><span style={{ fontWeight: 600, color: "var(--text)" }}>Rs. {subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && <>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#34c759", marginTop: "6px" }}>
                        <span>Discount</span><span style={{ fontWeight: 600 }}>-Rs. {discount.toFixed(2)}</span>
                      </div>
                      <div style={{ height: "1px", background: "rgba(0,0,0,0.08)", margin: "10px 0" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
                        <span>Total</span><span style={{ color: "#0071e3" }}>Rs. {(subtotal - discount).toFixed(2)}</span>
                      </div>
                    </>}
                  </div>
                )}

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "7px" }}>
                    <Tag size={13} /> Coupon <span style={{ color: "#c7c7cc", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); setCouponError(""); }} placeholder="e.g. SAVE20" style={{ ...inputStyle, fontFamily: "monospace" }} />
                    <button type="button" onClick={handleApplyCoupon} disabled={couponApplying || !couponCode.trim() || subtotal === 0}
                      style={{ padding: "0 18px", borderRadius: "10px", fontSize: "14px", fontWeight: 500, color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap", ...(couponApplying || !couponCode.trim() || subtotal === 0 ? { background: "#c7c7cc" } : glassPrimary) }}>
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
                  <button type="button" onClick={closeOrderModal} style={{ flex: 1, height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 500, color: "var(--text)", border: "1px solid var(--border)", cursor: "pointer", background: "var(--card-2)" }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ flex: 1, height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "#fff", border: "none", cursor: "pointer", ...(saving ? { background: "#c7c7cc" } : glassPrimary), transition: "all 0.2s" }}>
                    {saving ? "Placing..." : "Place Order"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </div>

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
