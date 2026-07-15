'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, CheckCircle, Loader2, Tag } from 'lucide-react'
import { createOrder, applyCoupon } from '@/lib/api'
import EsewaPayment from '@/components/ui/esewa-payment'
import KhaltiPayment from '@/components/ui/khalti-payment'
import PrescriptionUpload from '@/components/ui/prescription-upload'
import type { RealProduct } from '@/components/product-card'

interface CartItem {
  productId: number
  quantity: number
}

export interface CheckoutModalProps {
  open: boolean
  onClose: () => void
  products?: RealProduct[]
  initialProductId?: number
  initialItems?: CartItem[]
  onPlaced?: () => void
}

const nepaliCities = ['Kathmandu', 'Pokhara', 'Lalitpur']

type PaymentMethod = 'esewa' | 'khalti' | 'cod'

const defaultItems = (products: RealProduct[], initialProductId?: number): CartItem[] => [
  { productId: initialProductId ?? (products[0]?.id ?? 0), quantity: 1 },
]

export default function CheckoutModal({ open, onClose, products = [], initialProductId, initialItems, onPlaced }: CheckoutModalProps) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [items, setItems] = useState<CartItem[]>(
    initialItems && initialItems.length > 0 ? initialItems : defaultItems(products, initialProductId)
  )

  useEffect(() => {
    if (open) {
      setItems(initialItems && initialItems.length > 0 ? initialItems : defaultItems(products, initialProductId))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const [coupon, setCoupon] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [payment, setPayment] = useState<PaymentMethod>('esewa')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [esewaOrder, setEsewaOrder] = useState<{ id: number; amount: number } | null>(null)
  const [khaltiOrder, setKhaltiOrder] = useState<{ id: number; amount: number } | null>(null)
  const [prescriptionOrder, setPrescriptionOrder] = useState<{ id: number; amount: number } | null>(null)

  const getProduct = (id: number) => products.find((p) => p.id === id)

  const getPrice = (p: RealProduct) =>
    typeof p.price === 'string' ? parseFloat(p.price) || 0 : p.price

  const subtotal = items.reduce((sum, item) => {
    const p = getProduct(item.productId)
    return sum + (p ? getPrice(p) * item.quantity : 0)
  }, 0)

  const discount = couponApplied ? couponDiscount : 0
  const total = Math.max(0, subtotal - discount)

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return
    try {
      const res = await applyCoupon(coupon.trim(), subtotal.toString())
      const data = res.data
      const discountAmt = data.discount_amount ?? data.discount ?? 0
      setCouponDiscount(parseFloat(discountAmt))
      setCouponApplied(true)
      setCouponError('')
    } catch {
      setCouponError('Invalid or expired coupon code')
      setCouponApplied(false)
      setCouponDiscount(0)
    }
  }

  const updateItem = (idx: number, field: keyof CartItem, value: number) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)))
  }

  const removeItem = (idx: number) => {
    if (items.length === 1) return
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const addItem = () => {
    const firstProduct = products[0]
    if (!firstProduct) return
    setItems((prev) => [...prev, { productId: firstProduct.id, quantity: 1 }])
  }

  const proceedToPayment = (orderId: number, orderTotal: number) => {
    if (payment === 'esewa') {
      setEsewaOrder({ id: orderId, amount: orderTotal })
    } else if (payment === 'khalti') {
      setKhaltiOrder({ id: orderId, amount: orderTotal })
    } else {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        handleClose()
      }, 2200)
    }
  }

  const handlePlace = async () => {
    if (!name.trim() || !city) return
    setLoading(true)
    setError('')
    try {
      const orderData = {
        customer_name: name.trim(),
        delivery_city: city,
        payment_method: payment,
        items: items
          .filter((it) => it.productId && it.quantity > 0)
          .map((it) => ({ product: it.productId, quantity: it.quantity })),
        ...(couponApplied ? { coupon_code: coupon.trim() } : {}),
      }
      const res = await createOrder(orderData)
      const createdOrder = res.data.orders?.[0] ?? res.data.order ?? res.data
      const orderId: number = createdOrder?.id ?? createdOrder?.order_id ?? createdOrder?.pk
      if (!orderId) {
        console.error('createOrder response did not contain a recognizable order ID:', res.data)
        setError('Order was placed but the server did not return an order ID, so payment cannot be started. Please check your orders page or contact support.')
        return
      }
      const orderTotal: number = parseFloat(createdOrder.total_price ?? createdOrder.total_amount ?? total.toString())
      onPlaced?.()

      if (createdOrder.requires_prescription) {
        setPrescriptionOrder({ id: orderId, amount: orderTotal })
      } else {
        proceedToPayment(orderId, orderTotal)
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: Record<string, unknown>; status?: number }; message?: string }
      const errData = err.response?.data
      const detail = errData
        ? Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        : err.message
      setError(detail ?? 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setCity('')
    setItems([{ productId: products[0]?.id ?? 0, quantity: 1 }])
    setCoupon('')
    setCouponApplied(false)
    setCouponDiscount(0)
    setCouponError('')
    setPayment('esewa')
    setError('')
    setSuccess(false)
    onClose()
  }

  const paymentOptions: { method: PaymentMethod; label: string; color: string; bg: string; img?: string }[] = [
    { method: 'esewa', label: 'eSewa', color: 'text-green-700', bg: 'bg-green-50', img: '/esewa.png' },
    { method: 'khalti', label: 'Khalti', color: 'text-purple-700', bg: 'bg-purple-50', img: '/khalti.png' },
    { method: 'cod', label: 'Cash on Delivery', color: 'text-gray-700', bg: 'bg-gray-50' },
  ]

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-lg bg-card rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
                <h2 className="font-heading text-xl font-bold text-foreground">Place Order</h2>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Success state */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-card z-10 flex flex-col items-center justify-center gap-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <CheckCircle size={64} className="text-primary" />
                    </motion.div>
                    <h3 className="font-heading text-2xl font-bold text-foreground">Order Placed!</h3>
                    <p className="text-muted-foreground text-sm">Your order is being processed.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                {/* Error */}
                {error && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Customer details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ram Kumar"
                      style={{ background: 'var(--card-2)', border: '1px solid var(--border-strong)', padding: '10px 12px', borderRadius: '12px', width: '100%', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                      Delivery City
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ background: 'var(--card-2)', border: '1px solid var(--border-strong)', padding: '10px 12px', borderRadius: '12px', width: '100%', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="">Select city</option>
                      {nepaliCities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Products */}
                {products.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                      Products
                    </label>
                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(idx, 'productId', Number(e.target.value))}
                            style={{ flex: 1, background: 'var(--card-2)', border: '1px solid var(--border-strong)', padding: '8px 12px', borderRadius: '12px', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
                          >
                            {products.map((p, pi) => (
                              <option key={p.id ?? pi} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                            style={{ width: '64px', background: 'var(--card-2)', border: '1px solid var(--border-strong)', padding: '8px', borderRadius: '12px', fontSize: '14px', outline: 'none', textAlign: 'center' }}
                          />
                          <button
                            onClick={() => removeItem(idx)}
                            disabled={items.length === 1}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addItem}
                      className="mt-2 flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                    >
                      <Plus size={14} />
                      Add Item
                    </button>
                  </div>
                )}

                {/* Coupon */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={coupon}
                        onChange={(e) => { setCoupon(e.target.value); setCouponError('') }}
                        placeholder="Enter coupon"
                        style={{
                          paddingLeft: '32px',
                          paddingRight: '12px',
                          paddingTop: '10px',
                          paddingBottom: '10px',
                          background: couponApplied ? 'color-mix(in srgb, var(--green) 10%, var(--card-2))' : 'var(--card-2)',
                          border: couponApplied ? '1px solid var(--green)' : couponError ? '1px solid var(--red)' : '1px solid var(--border-strong)',
                          borderRadius: '12px',
                          width: '100%',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <button
                      onClick={handleApplyCoupon}
                      className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponApplied && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      Coupon applied — NPR {couponDiscount.toLocaleString()} off!
                    </p>
                  )}
                  {couponError && (
                    <p className="text-xs text-red-500 mt-1">{couponError}</p>
                  )}
                </div>

                {/* Order summary */}
                <div className="bg-muted rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>NPR {subtotal.toLocaleString()}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Discount</span>
                      <span>- NPR {discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Delivery</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-foreground border-t border-border pt-2 mt-1">
                    <span>Total</span>
                    <span>NPR {total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentOptions.map(({ method, label, color, bg, img }) => (
                      <button
                        key={method}
                        onClick={() => setPayment(method)}
                        className={`py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all flex flex-col items-center gap-1.5 ${
                          payment === method
                            ? `border-primary ${bg} ${color}`
                            : 'border-border bg-card text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {img ? (
                          <Image src={img} alt={label} width={32} height={32} className="object-contain h-7 w-auto" />
                        ) : null}
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="px-6 py-4 border-t border-border flex-shrink-0">
                <button
                  onClick={handlePlace}
                  disabled={loading || !name.trim() || !city}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    `Place Order — NPR ${total.toLocaleString()}`
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prescription upload modal */}
      {prescriptionOrder && (
        <PrescriptionUpload
          orderId={prescriptionOrder.id}
          onDone={() => {
            const p = prescriptionOrder
            setPrescriptionOrder(null)
            if (p) proceedToPayment(p.id, p.amount)
          }}
          onClose={() => {
            const p = prescriptionOrder
            setPrescriptionOrder(null)
            if (p) proceedToPayment(p.id, p.amount)
          }}
        />
      )}

      {/* eSewa payment modal */}
      {esewaOrder && (
        <EsewaPayment
          orderId={esewaOrder.id}
          amount={esewaOrder.amount}
          onClose={() => setEsewaOrder(null)}
        />
      )}

      {/* Khalti payment modal */}
      {khaltiOrder && (
        <KhaltiPayment
          orderId={khaltiOrder.id}
          amount={khaltiOrder.amount}
          onClose={() => setKhaltiOrder(null)}
        />
      )}
    </>
  )
}
