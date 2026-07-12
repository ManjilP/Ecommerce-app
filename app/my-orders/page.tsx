'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, ShoppingBag, X, ChevronRight, RefreshCw } from 'lucide-react'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { getOrders } from '@/lib/api'

type FilterTab = 'All' | string

const filterTabs: FilterTab[] = ['All', 'pending', 'processing', 'delivered', 'cancelled']

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500' },
  processing: { label: 'Processing', color: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-500' },
  delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' },
}

const paymentConfig: Record<string, { label: string; color: string; bg: string }> = {
  esewa: { label: 'eSewa', color: 'text-green-700', bg: 'bg-green-100' },
  khalti: { label: 'Khalti', color: 'text-purple-700', bg: 'bg-purple-100' },
  cod: { label: 'Cash on Delivery', color: 'text-gray-700', bg: 'bg-gray-100' },
}

interface OrderItem {
  product?: { id: number; name: string; price?: string | number } | number
  product_name?: string
  name?: string
  quantity: number
  unit_price?: string | number
}

interface Order {
  id: number
  order_number?: string
  status: string
  items: OrderItem[]
  payment_method?: string
  payment?: string
  city?: string
  total_amount?: string | number
  total?: number
  created_at?: string
  date?: string
}

function getItemName(item: OrderItem): string {
  if (item.product_name) return item.product_name
  if (item.name) return item.name
  if (typeof item.product === 'object' && item.product?.name) return item.product.name
  return 'Product'
}

function getItemPrice(item: OrderItem): number {
  const p = item.unit_price ?? 0
  return typeof p === 'string' ? parseFloat(p) : p
}

function getOrderTotal(order: Order): number {
  const t = order.total_amount ?? order.total ?? 0
  return typeof t === 'string' ? parseFloat(t) : t
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const statusKey = (order.status ?? '').toLowerCase()
  const status = statusConfig[statusKey] ?? statusConfig.pending
  const paymentKey = (order.payment_method ?? order.payment ?? '').toLowerCase()
  const payment = paymentConfig[paymentKey] ?? { label: order.payment_method ?? '—', color: 'text-gray-700', bg: 'bg-gray-100' }
  const total = getOrderTotal(order)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="px-6 py-5 border-b border-border flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">Order Details</h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">#{order.order_number ?? order.id}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors">
              <X size={15} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                  <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
                </div>
              </div>
              <div className="bg-muted rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Payment</p>
                <span className={`text-sm font-semibold ${payment.color}`}>{payment.label}</span>
              </div>
              {order.city && (
                <div className="bg-muted rounded-2xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Delivery City</p>
                  <span className="text-sm font-semibold text-foreground">{order.city}</span>
                </div>
              )}
              <div className="bg-muted rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Date Placed</p>
                <span className="text-sm font-semibold text-foreground">{formatDate(order.created_at ?? order.date)}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Items Ordered</h3>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 px-4 bg-muted rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{getItemName(item)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.quantity} × NPR {getItemPrice(item).toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground ml-4">NPR {(item.quantity * getItemPrice(item)).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-base font-bold text-foreground pt-1 border-t border-border">
                <span>Grand Total</span>
                <span>NPR {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default function MyOrdersPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getOrders()
      const data: Order[] = Array.isArray(res.data) ? res.data : res.data.results ?? []
      setOrders(data)
    } catch { setError('Failed to load orders.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchOrders() }, [])

  const filtered = activeFilter === 'All'
    ? orders
    : orders.filter((o) => (o.status ?? '').toLowerCase() === activeFilter)

  const countFor = (s: string) => orders.filter((o) => (o.status ?? '').toLowerCase() === s).length

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-3xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center">
              <Package size={20} className="text-primary" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">My Orders</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-[52px]">Track and manage all your purchases</p>
        </motion.div>

        <div className="flex gap-2 flex-wrap mb-8">
          {filterTabs.map((tab) => (
            <button key={tab} onClick={() => setActiveFilter(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                activeFilter === tab
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
              }`}
            >
              {tab === 'All' ? 'All' : statusConfig[tab]?.label ?? tab}
              {tab !== 'All' && countFor(tab) > 0 && <span className="ml-1.5 text-xs opacity-70">({countFor(tab)})</span>}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                <div className="h-3 bg-muted rounded w-2/3 mb-4" />
                <div className="flex gap-2"><div className="h-6 bg-muted rounded-full w-20" /><div className="h-6 bg-muted rounded-full w-24" /></div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-4 py-16">
            <p className="text-muted-foreground text-sm">{error}</p>
            <button onClick={fetchOrders} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag size={28} className="text-muted-foreground" />
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground">No orders yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {activeFilter === 'All' ? "You haven't placed any orders yet." : 'No orders in this category.'}
            </p>
            <Link href="/landing" className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
              Shop Now
            </Link>
          </motion.div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((order, i) => {
              const sk = (order.status ?? '').toLowerCase()
              const status = statusConfig[sk] ?? statusConfig.pending
              const pk = (order.payment_method ?? order.payment ?? '').toLowerCase()
              const payment = paymentConfig[pk] ?? { label: order.payment_method ?? '—', color: 'text-gray-700', bg: 'bg-gray-100' }
              const total = getOrderTotal(order)
              return (
                <motion.button
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left bg-card rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">
                          #{order.order_number ?? order.id}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDate(order.created_at ?? order.date)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                        {order.items.map((it) => `${getItemName(it)} ×${it.quantity}`).join(', ')}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${payment.bg} ${payment.color}`}>{payment.label}</span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${status.bg} ${status.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="text-lg font-bold text-foreground">NPR {total.toLocaleString()}</p>
                      <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  )
}
