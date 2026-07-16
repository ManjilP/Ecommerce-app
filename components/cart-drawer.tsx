'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, Trash2, Loader2, ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import CheckoutModal from '@/components/checkout-modal'
import { clearCart } from '@/lib/api'

export interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, subtotal, loading: cartLoading, updateQty, removeItem, refresh } = useCart()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set())

  const handlePlaced = () => {
    clearCart().catch(() => {})
    refresh()
    onClose()
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="relative w-full max-w-md bg-card h-full shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
                <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                  <ShoppingBag size={20} /> Your Cart
                </h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-5">
                {cartLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-muted-foreground" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <ShoppingBag size={40} className="text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">Your cart is empty.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {item.image && /^(https?:\/\/|\/)/.test(item.image) && !brokenImages.has(item.id) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={() => setBrokenImages((prev) => new Set(prev).add(item.id))}
                            />
                          ) : (
                            <ShoppingBag size={20} className="text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                          <p className="text-sm text-primary font-medium">NPR {item.price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => item.quantity > 1 ? updateQty(item.id, item.quantity - 1) : removeItem(item.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted hover:bg-border transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{item.quantity}</span>
                          <button
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            disabled={typeof item.stock === 'number' && item.quantity >= item.stock}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted hover:bg-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-muted"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="px-6 py-4 border-t border-border flex-shrink-0 space-y-3">
                  <div className="flex justify-between font-bold text-base text-foreground">
                    <span>Subtotal</span>
                    <span>NPR {subtotal.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => setCheckoutOpen(true)}
                    className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        products={items.map((item) => ({ id: item.product, name: item.name, category: '', price: item.price, image: item.image }))}
        initialItems={items.map((item) => ({ productId: item.product, quantity: item.quantity }))}
        onPlaced={handlePlaced}
      />
    </>
  )
}
