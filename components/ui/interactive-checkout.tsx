"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Minus, Plus, ShoppingCart, X, CreditCard, ImageIcon, Package, Trash2, Eye, EyeOff, AlertCircle, MapPin } from "lucide-react"
import { FlipButton } from "@/components/ui/flip-button"
import { login, register } from "@/lib/api"
import { useGoogleLogin } from "@react-oauth/google"

export interface CheckoutProduct {
  id: number
  name: string
  price: number
  category: string
  image?: string
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock"
  stockQty?: number
}

interface CartItem extends CheckoutProduct {
  quantity: number
}

interface InteractiveCheckoutProps {
  products?: CheckoutProduct[]
  onCheckout?: (items: { productId: number; quantity: number }[]) => void
  isLoggedIn?: boolean
  onLoginRequired?: () => void
}

const stockColor: Record<string, string> = {
  in_stock: "var(--green)",
  low_stock: "var(--orange)",
  out_of_stock: "var(--red)",
}

const stockBg: Record<string, string> = {
  in_stock: "rgba(52,211,153,0.1)",
  low_stock: "rgba(251,146,60,0.1)",
  out_of_stock: "rgba(248,113,113,0.1)",
}

function InteractiveCheckout({
  products = [],
  onCheckout,
  isLoggedIn = true,
}: InteractiveCheckoutProps) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { const saved = localStorage.getItem("guest_cart"); return saved ? JSON.parse(saved) : [] } catch { return [] }
  })
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem("guest_cart", JSON.stringify(cart))
  }, [cart])

  // sync loggedIn with parent prop (parent reads localStorage in a useEffect, so initial value is false even if user is logged in)
  useEffect(() => { setLoggedIn(isLoggedIn) }, [isLoggedIn])

  // Auth modal states
  const [loginModal, setLoginModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"signin" | "register">("signin")
  const [authError, setAuthError] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [loggedIn, setLoggedIn] = useState(isLoggedIn)

  // Sign in states
  const [loginUsername, setLoginUsername] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Register states
  const [regUsername, setRegUsername] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regCity, setRegCity] = useState("")
  const [showRegPassword, setShowRegPassword] = useState(false)

  // Google + city popup states
  const [cityPopup, setCityPopup] = useState(false)
  const [cityInput, setCityInput] = useState("")
  const [pendingGoogleToken, setPendingGoogleToken] = useState("")
  const [googleLoading, setGoogleLoading] = useState(false)

  const proceedAfterAuth = (accessToken: string) => {
    setLoggedIn(true)
    setLoginModal(false)
    setCityPopup(false)
    // fire-and-forget — don't block checkout on the merge call
    fetch("/api/cart/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
      body: JSON.stringify({ items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })) }),
    }).catch(() => {})
    localStorage.removeItem("guest_cart")
    onCheckout?.(cart.map((i) => ({ productId: i.id, quantity: i.quantity })))
  }

  const addToCart = (product: CheckoutProduct) => {
    if (product.stockStatus === "out_of_stock") return
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...product, quantity: 1 }]
    })
    setCartOpen(true)
  }

  const removeFromCart = (productId: number) => setCart((prev) => prev.filter((i) => i.id !== productId))

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) => prev.map((i) => i.id === productId ? { ...i, quantity: i.quantity + delta } : i).filter((i) => i.quantity > 0))
  }

  const clearCart = () => setCart([])

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const handleCheckout = () => {
    if (cart.length === 0) return
    if (!loggedIn) {
      setAuthError(""); setLoginUsername(""); setLoginPassword("")
      setRegUsername(""); setRegEmail(""); setRegPassword(""); setRegCity("")
      setActiveTab("signin")
      setLoginModal(true)
      return
    }
    localStorage.removeItem("guest_cart")
    onCheckout?.(cart.map((i) => ({ productId: i.id, quantity: i.quantity })))
  }

  const handleLoginSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setAuthError(""); setAuthLoading(true)
    try {
      const { data } = await login(loginUsername, loginPassword)
      localStorage.setItem("access_token", data.access)
      localStorage.setItem("refresh_token", data.refresh)
      localStorage.setItem("username", loginUsername)
      localStorage.removeItem("orders_cache")
      document.cookie = `access_token=${data.access}; path=/`
      try {
        const payload = JSON.parse(atob(data.access.split(".")[1]))
        localStorage.setItem("is_admin", String(!!(payload.is_staff || payload.is_superuser)))
      } catch { localStorage.setItem("is_admin", "false") }
      proceedAfterAuth(data.access)
    } catch {
      setAuthError("Invalid username or password.")
    } finally { setAuthLoading(false) }
  }

  const handleRegisterSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setAuthError(""); setAuthLoading(true)
    try {
      const { data } = await register(regUsername, regPassword, regEmail, regCity)
      if (data.tokens) {
        localStorage.setItem("access_token", data.tokens.access)
        localStorage.setItem("refresh_token", data.tokens.refresh)
        localStorage.setItem("username", regUsername)
        localStorage.removeItem("orders_cache")
        localStorage.setItem("is_admin", "false")
        if (regCity) localStorage.setItem("delivery_city", regCity)
        document.cookie = `access_token=${data.tokens.access}; path=/`
        proceedAfterAuth(data.tokens.access)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      setAuthError(msg ? Object.values(msg).flat().join(" ") : "Registration failed.")
    } finally { setAuthLoading(false) }
  }

  const finishGoogleAuth = async (accessToken: string, city: string) => {
    setGoogleLoading(true); setAuthError("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken, city }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error("Google auth failed")
      localStorage.setItem("access_token", data.access)
      localStorage.setItem("refresh_token", data.refresh)
      localStorage.removeItem("orders_cache")
      localStorage.setItem("is_admin", "false")
      if (city) localStorage.setItem("delivery_city", city)
      document.cookie = `access_token=${data.access}; path=/`
      proceedAfterAuth(data.access)
    } catch {
      setAuthError("Google sign in failed. Please try again.")
    } finally { setGoogleLoading(false) }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setPendingGoogleToken(tokenResponse.access_token)
      setCityInput("")
      setCityPopup(true)
    },
    onError: () => setAuthError("Google sign in failed. Please try again."),
  })

  const glassBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    padding: "8px 20px", fontSize: "13px", fontWeight: 600, borderRadius: "99px",
    cursor: "pointer", color: "#fff", background: "rgba(0,113,227,0.85)",
    backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 2px 12px rgba(0,113,227,0.25)", transition: "all 0.2s", whiteSpace: "nowrap",
  }

  return (
    <div style={{ position: "relative" }}>

      {/* Cart fab button */}
      <AnimatePresence>
        {totalItems > 0 && !cartOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            onClick={() => setCartOpen(true)}
            style={{ position: "fixed", bottom: "32px", right: "32px", zIndex: 50, display: "flex", alignItems: "center", gap: "8px", padding: "12px 22px", borderRadius: "99px", background: "rgba(0,113,227,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 8px 32px rgba(0,113,227,0.35)", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
          >
            <ShoppingCart size={16} />
            View Cart
            <span style={{ padding: "2px 8px", borderRadius: "99px", background: "rgba(255,255,255,0.25)", fontSize: "12px", fontWeight: 700 }}>{totalItems}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCartOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", zIndex: 100 }} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "360px", zIndex: 101, background: "var(--bg-elevated)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", boxShadow: "-24px 0 64px rgba(0,0,0,0.15)" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ShoppingCart size={18} color="var(--text)" />
                  <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)" }}>Your Cart</h2>
                  <span style={{ padding: "2px 8px", borderRadius: "99px", background: "rgba(0,113,227,0.12)", color: "rgba(0,113,227,0.9)", fontSize: "12px", fontWeight: 700 }}>{totalItems}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {cart.length > 0 && <button onClick={clearCart} title="Clear cart" style={{ padding: "6px", borderRadius: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}><Trash2 size={15} /></button>}
                  <button onClick={() => setCartOpen(false)} style={{ width: "30px", height: "30px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)" }}><X size={14} /></button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
                <AnimatePresence initial={false} mode="popLayout">
                  {cart.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "64px 0", color: "var(--text-3)" }}>
                      <Package size={36} strokeWidth={1.5} />
                      <p style={{ fontSize: "14px" }}>Your cart is empty</p>
                    </motion.div>
                  ) : (
                    cart.map((item) => (
                      <motion.div key={item.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.18 }} style={{ display: "flex", gap: "12px", padding: "14px", borderRadius: "14px", background: "var(--card)", border: "1px solid var(--border)", marginBottom: "10px" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "10px", overflow: "hidden", background: "var(--card-2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {item.image ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ImageIcon size={18} color="var(--text-3)" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{item.name}</span>
                            <button onClick={() => removeFromCart(item.id)} style={{ padding: "2px", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", flexShrink: 0 }}><X size={13} /></button>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <button onClick={() => updateQuantity(item.id, -1)} style={{ width: "24px", height: "24px", borderRadius: "6px", background: "var(--card-2)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)" }}><Minus size={11} /></button>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", width: "20px", textAlign: "center" }}>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} style={{ width: "24px", height: "24px", borderRadius: "6px", background: "var(--card-2)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)" }}><Plus size={11} /></button>
                            </div>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Rs. {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {cart.length > 0 && (
                <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{ fontSize: "15px", color: "var(--text-2)", fontWeight: 500 }}>Total</span>
                    <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)" }}>Rs. {totalPrice.toFixed(2)}</span>
                  </div>
                  <button onClick={handleCheckout} style={{ ...glassBtn, width: "100%", height: "48px", fontSize: "15px", boxShadow: "0 4px 20px rgba(0,113,227,0.35)" }}>
                    <CreditCard size={16} />Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
        {products.map((product, idx) => {
          const isOOS = product.stockStatus === "out_of_stock"
          const inCart = cart.find((i) => i.id === product.id)
          return (
            <motion.div
              key={product.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: idx * 0.04 }}
              style={{ borderRadius: "8px", border: "1px solid rgba(0,113,227,0.4)", overflow: "hidden", background: "var(--card)", opacity: isOOS ? 0.6 : 1, transition: "box-shadow 0.2s, border-color 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,113,227,0.15)"; (e.currentTarget as HTMLDivElement).style.borderColor = "#0071E3" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,113,227,0.4)" }}
            >
              <div style={{ position: "relative", aspectRatio: "1", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {product.image ? <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ImageIcon size={32} color="var(--text-3)" />}
                {product.stockStatus && (
                  <span style={{ position: "absolute", top: "10px", left: "10px", padding: "3px 10px", fontSize: "11px", fontWeight: 600, borderRadius: "99px", background: stockBg[product.stockStatus], color: stockColor[product.stockStatus], backdropFilter: "blur(8px)", border: `1px solid ${stockColor[product.stockStatus]}30` }}>
                    {product.stockStatus === "low_stock" && product.stockQty != null ? `Only ${product.stockQty} left` : product.stockStatus === "in_stock" ? "In Stock" : "Out of Stock"}
                  </span>
                )}
                {inCart && (
                  <span style={{ position: "absolute", top: "10px", right: "10px", width: "24px", height: "24px", borderRadius: "99px", background: "rgba(0,113,227,0.9)", color: "#fff", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{inCart.quantity}</span>
                )}
              </div>
              <div style={{ padding: "14px 16px 16px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>{product.category}</p>
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "12px", lineHeight: 1.3 }}>{product.name}</h3>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Rs. {product.price.toFixed(2)}</span>
                  <button disabled={isOOS} onClick={() => addToCart(product)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 16px", fontSize: "13px", fontWeight: 600, borderRadius: "99px", cursor: isOOS ? "not-allowed" : "pointer", border: "none", color: isOOS ? "var(--text-3)" : "#fff", background: isOOS ? "var(--card-2)" : "rgba(0,113,227,0.85)", backdropFilter: isOOS ? "none" : "blur(12px)", boxShadow: isOOS ? "none" : "0 2px 10px rgba(0,113,227,0.3)", transition: "all 0.2s" }}>
                    <ShoppingCart size={13} />{inCart ? "Add more" : "Add to cart"}
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
        {products.length === 0 && <div style={{ gridColumn: "1 / -1", padding: "60px 0", textAlign: "center", color: "var(--text-3)" }}>No products available.</div>}
      </div>

      {/* Auth modal */}
      {loginModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(16px)" }}>
          <div style={{ width: "100%", maxWidth: "460px", borderRadius: "12px", padding: "32px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 40px 80px rgba(0,0,0,0.25)", margin: "0 16px", maxHeight: "90vh", overflowY: "auto" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)" }}>
                {activeTab === "signin" ? "Sign in to checkout" : "Create account"}
              </h2>
              <button onClick={() => setLoginModal(false)} style={{ width: "28px", height: "28px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-3)" }}><X size={14} /></button>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-2)", marginBottom: "20px" }}>Your {cart.length} item{cart.length > 1 ? "s" : ""} will be saved.</p>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", padding: "4px", borderRadius: "12px", background: "var(--card-2)", marginBottom: "20px" }}>
              {(["signin", "register"] as const).map((tab) => (
                <button key={tab} onClick={() => { setActiveTab(tab); setAuthError("") }}
                  style={{ flex: 1, height: "36px", borderRadius: "9px", fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s", background: activeTab === tab ? "var(--card)" : "transparent", color: activeTab === tab ? "var(--text)" : "var(--text-3)", boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
                  {tab === "signin" ? "Sign in" : "Register"}
                </button>
              ))}
            </div>

            {/* Error */}
            {authError && (
              <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: "13px" }}>
                <AlertCircle size={14} />{authError}
              </div>
            )}

            {/* Sign in form */}
            {activeTab === "signin" && (
              <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "6px" }}>Username</label>
                  <input type="text" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} placeholder="Enter your username" required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "6px" }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showLoginPassword ? "text" : "password"} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" required style={{ paddingRight: "44px" }} />
                    <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
                      {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={authLoading} style={{ height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "#fff", background: authLoading ? "#c7c7cc" : "rgba(0,113,227,0.85)", border: "1px solid rgba(0,113,227,0.4)", boxShadow: authLoading ? "none" : "0 4px 24px rgba(0,113,227,0.3)", cursor: authLoading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                  {authLoading ? "Signing in..." : "Sign in & Checkout"}
                </button>
              </form>
            )}

            {/* Register form */}
            {activeTab === "register" && (
              <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "6px" }}>Username</label>
                  <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)} placeholder="johndoe" required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "6px" }}>Email</label>
                  <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="john@example.com" required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "6px" }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showRegPassword ? "text" : "password"} value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" required minLength={8} style={{ paddingRight: "44px" }} />
                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
                      {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "6px" }}>Delivery City</label>
                  <input type="text" value={regCity} onChange={e => setRegCity(e.target.value)} placeholder="e.g. Kathmandu" required />
                </div>
                <button type="submit" disabled={authLoading} style={{ height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "#fff", background: authLoading ? "#c7c7cc" : "rgba(0,113,227,0.85)", border: "1px solid rgba(0,113,227,0.4)", boxShadow: authLoading ? "none" : "0 4px 24px rgba(0,113,227,0.3)", cursor: authLoading ? "not-allowed" : "pointer", marginTop: "4px", transition: "all 0.2s" }}>
                  {authLoading ? "Creating account..." : "Create account & Checkout"}
                </button>
              </form>
            )}

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
              <span style={{ fontSize: "13px", color: "var(--text-3)" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            </div>

            {/* Google button */}
            <button
              onClick={() => handleGoogleLogin()}
              disabled={googleLoading}
              style={{ width: "100%", height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "var(--text)", background: "var(--card-2)", border: "1px solid var(--border)", cursor: googleLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "all 0.2s", opacity: googleLoading ? 0.7 : 1 }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              {googleLoading ? "Signing in..." : "Continue with Google"}
            </button>
          </div>
        </div>
      )}

      {/* City popup for Google auth */}
      {cityPopup && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(16px)" }}>
          <div style={{ width: "100%", maxWidth: "360px", borderRadius: "24px", padding: "32px 28px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 40px 80px rgba(0,0,0,0.25)", margin: "0 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(0,113,227,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={20} color="#0071E3" />
              </div>
              <button onClick={() => { setCityPopup(false); finishGoogleAuth(pendingGoogleToken, "") }} style={{ width: "28px", height: "28px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-3)" }}><X size={14} /></button>
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "6px", marginTop: "16px" }}>Set delivery location</h2>
            <p style={{ fontSize: "13px", color: "var(--text-2)", marginBottom: "20px" }}>Which city do you want your orders delivered to?</p>
            <input
              value={cityInput} onChange={e => setCityInput(e.target.value)} placeholder="e.g. Kathmandu" autoFocus
              onKeyDown={e => { if (e.key === "Enter" && cityInput.trim()) finishGoogleAuth(pendingGoogleToken, cityInput.trim()) }}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "14px", background: "var(--card-2)", color: "var(--text)", outline: "none", boxSizing: "border-box", marginBottom: "12px" }}
            />
            <button onClick={() => finishGoogleAuth(pendingGoogleToken, cityInput.trim())} disabled={googleLoading}
              style={{ width: "100%", height: "46px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "#fff", background: googleLoading ? "#c7c7cc" : "rgba(0,113,227,0.85)", border: "none", cursor: googleLoading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
              {googleLoading ? "Signing in..." : "Continue"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export { InteractiveCheckout }
