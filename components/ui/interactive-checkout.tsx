"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Minus, Plus, ShoppingCart, X, CreditCard, ImageIcon, Package, Trash2 } from "lucide-react"


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
  onLoginRequired,
}: InteractiveCheckoutProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  const addToCart = (product: CheckoutProduct) => {
    if (product.stockStatus === "out_of_stock") return
    if (!isLoggedIn) { onLoginRequired?.(); return }
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setCartOpen(true)
  }

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.id !== productId))
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => i.id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    )
  }

  const clearCart = () => setCart([])

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const handleCheckout = () => {
    if (cart.length === 0) return
    if (!isLoggedIn) { onLoginRequired?.(); return }
    onCheckout?.(cart.map((i) => ({ productId: i.id, quantity: i.quantity })))
  }

  const glassBtn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px 20px",
    fontSize: "13px",
    fontWeight: 600,
    borderRadius: "99px",
    cursor: "pointer",
    color: "#fff",
    background: "rgba(0,113,227,0.85)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 2px 12px rgba(0,113,227,0.25)",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  }

  return (
    <div style={{ position: "relative" }}>

      {/* Cart fab button */}
      <AnimatePresence>
        {totalItems > 0 && !cartOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setCartOpen(true)}
            style={{
              position: "fixed",
              bottom: "32px",
              right: "32px",
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 22px",
              borderRadius: "99px",
              background: "rgba(0,113,227,0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 32px rgba(0,113,227,0.35)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ShoppingCart size={16} />
            View Cart
            <span style={{ padding: "2px 8px", borderRadius: "99px", background: "rgba(255,255,255,0.25)", fontSize: "12px", fontWeight: 700 }}>
              {totalItems}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", zIndex: 100 }}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: "360px",
                zIndex: 101,
                background: "var(--bg-elevated)",
                borderLeft: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                boxShadow: "-24px 0 64px rgba(0,0,0,0.15)",
              }}
            >
              {/* Drawer header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ShoppingCart size={18} color="var(--text)" />
                  <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)" }}>Your Cart</h2>
                  <span style={{ padding: "2px 8px", borderRadius: "99px", background: "rgba(0,113,227,0.12)", color: "rgba(0,113,227,0.9)", fontSize: "12px", fontWeight: 700 }}>
                    {totalItems}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      title="Clear cart"
                      style={{ padding: "6px", borderRadius: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => setCartOpen(false)}
                    style={{ width: "30px", height: "30px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Cart items */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
                <AnimatePresence initial={false} mode="popLayout">
                  {cart.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "64px 0", color: "var(--text-3)" }}
                    >
                      <Package size={36} strokeWidth={1.5} />
                      <p style={{ fontSize: "14px" }}>Your cart is empty</p>
                    </motion.div>
                  ) : (
                    cart.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        style={{
                          display: "flex",
                          gap: "12px",
                          padding: "14px",
                          borderRadius: "14px",
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          marginBottom: "10px",
                        }}
                      >
                        {/* Item image */}
                        <div style={{ width: "48px", height: "48px", borderRadius: "10px", overflow: "hidden", background: "var(--card-2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {item.image ? (
                            <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <ImageIcon size={18} color="var(--text-3)" />
                          )}
                        </div>

                        {/* Item info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>
                              {item.name}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              style={{ padding: "2px", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", flexShrink: 0 }}
                            >
                              <X size={13} />
                            </button>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                style={{ width: "24px", height: "24px", borderRadius: "6px", background: "var(--card-2)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)" }}
                              >
                                <Minus size={11} />
                              </button>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", width: "20px", textAlign: "center" }}>
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                style={{ width: "24px", height: "24px", borderRadius: "6px", background: "var(--card-2)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)" }}
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
                              Rs. {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Drawer footer */}
              {cart.length > 0 && (
                <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{ fontSize: "15px", color: "var(--text-2)", fontWeight: 500 }}>Total</span>
                    <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)" }}>
                      Rs. {totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    style={{ ...glassBtn, width: "100%", height: "48px", fontSize: "15px", boxShadow: "0 4px 20px rgba(0,113,227,0.35)" }}
                  >
                    <CreditCard size={16} />
                    Checkout
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
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: idx * 0.04 }}
              style={{
                borderRadius: "16px",
                border: "1px solid var(--border)",
                overflow: "hidden",
                background: "var(--card)",
                opacity: isOOS ? 0.6 : 1,
                transition: "box-shadow 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--card-shadow)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none" }}
            >
              {/* Product image */}
              <div style={{ position: "relative", aspectRatio: "1", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {product.image ? (
                  <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <ImageIcon size={32} color="var(--text-3)" />
                )}
                {/* Stock badge */}
                {product.stockStatus && (
                  <span style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    padding: "3px 10px",
                    fontSize: "11px",
                    fontWeight: 600,
                    borderRadius: "99px",
                    background: stockBg[product.stockStatus],
                    color: stockColor[product.stockStatus],
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${stockColor[product.stockStatus]}30`,
                  }}>
                    {product.stockStatus === "low_stock" && product.stockQty != null
                      ? `Only ${product.stockQty} left`
                      : product.stockStatus === "in_stock"
                      ? "In Stock"
                      : "Out of Stock"}
                  </span>
                )}
                {/* In-cart badge */}
                {inCart && (
                  <span style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    width: "24px",
                    height: "24px",
                    borderRadius: "99px",
                    background: "rgba(0,113,227,0.9)",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {inCart.quantity}
                  </span>
                )}
              </div>

              {/* Product info */}
              <div style={{ padding: "14px 16px 16px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>
                  {product.category}
                </p>
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "12px", lineHeight: 1.3 }}>
                  {product.name}
                </h3>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
                    Rs. {product.price.toFixed(2)}
                  </span>
                  <button
                    disabled={isOOS}
                    onClick={() => addToCart(product)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "7px 16px",
                      fontSize: "13px",
                      fontWeight: 600,
                      borderRadius: "99px",
                      cursor: isOOS ? "not-allowed" : "pointer",
                      border: "none",
                      color: isOOS ? "var(--text-3)" : "#fff",
                      background: isOOS ? "var(--card-2)" : "rgba(0,113,227,0.85)",
                      backdropFilter: isOOS ? "none" : "blur(12px)",
                      boxShadow: isOOS ? "none" : "0 2px 10px rgba(0,113,227,0.3)",
                      transition: "all 0.2s",
                    }}
                  >
                    <ShoppingCart size={13} />
                    {inCart ? "Add more" : "Add to cart"}
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}

        {products.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: "60px 0", textAlign: "center", color: "var(--text-3)" }}>
            No products available.
          </div>
        )}
      </div>
    </div>
  )
}

export { InteractiveCheckout }
