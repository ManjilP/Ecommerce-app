'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Trash2, ShoppingCart, RefreshCw, Pill } from 'lucide-react'
import Navbar from '@/components/navbar'
import SecondaryNav from '@/components/secondary-nav'
import Footer from '@/components/footer'
import CheckoutModal from '@/components/checkout-modal'
import { getWishlist, removeFromWishlist } from '@/lib/api'

interface WishlistItem {
  id: number
  product: {
    id: number
    name: string
    price: string | number
    category?: string
    image?: string
    description?: string
  } | number
  product_name?: string
  product_price?: string | number
  product_image?: string
  added_at?: string
}

function getProductId(item: WishlistItem): number {
  return typeof item.product === 'object' ? item.product.id : (item.product as number)
}

function getProductName(item: WishlistItem): string {
  if (typeof item.product === 'object' && item.product.name) return item.product.name
  return item.product_name ?? 'Product'
}

function getProductPrice(item: WishlistItem): number {
  const p = typeof item.product === 'object' ? item.product.price : item.product_price ?? 0
  return typeof p === 'string' ? parseFloat(p) : (p as number)
}

function getProductCategory(item: WishlistItem): string {
  return typeof item.product === 'object' ? (item.product.category ?? '') : ''
}

function getProductImage(item: WishlistItem): string | undefined {
  return typeof item.product === 'object' ? item.product.image : item.product_image
}

export default function MyWishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkoutProductId, setCheckoutProductId] = useState<number | null>(null)

  const fetchWishlist = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getWishlist()
      setItems(Array.isArray(res.data) ? res.data : res.data.results ?? [])
    } catch {
      setError('Failed to load wishlist.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWishlist() }, [])

  const handleRemove = async (wishlistId: number) => {
    try {
      await removeFromWishlist(wishlistId)
      setItems((prev) => prev.filter((i) => i.id !== wishlistId))
    } catch {}
  }

  const toRealProduct = (item: WishlistItem) => ({
    id: getProductId(item),
    name: getProductName(item),
    price: getProductPrice(item),
    category: getProductCategory(item),
    image: getProductImage(item),
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SecondaryNav />
      <div className="pt-32 max-w-3xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--red) 12%, transparent)' }}>
              <Heart size={20} style={{ color: 'var(--red)', fill: 'var(--red)' }} />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">My Wishlist</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-[52px]">
            {items.length} saved {items.length === 1 ? 'item' : 'items'}
          </p>
        </motion.div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 animate-pulse">
                <div className="h-40 bg-muted rounded-xl mb-4" />
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-4 py-16">
            <p className="text-muted-foreground text-sm">{error}</p>
            <button
              onClick={fetchWishlist}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Heart size={28} className="text-muted-foreground" />
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground">Your wishlist is empty</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Save items you love to buy them later.</p>
            <Link
              href="/landing"
              className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item, i) => {
              const name = getProductName(item)
              const price = getProductPrice(item)
              const category = getProductCategory(item)
              const image = getProductImage(item)
              const productId = getProductId(item)

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className="h-40 bg-muted flex items-center justify-center">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={name} className="w-full h-full object-contain p-3" />
                    ) : (
                      <Pill size={32} className="text-primary" />
                    )}
                  </div>
                  <div className="p-4">
                    {category && (
                      <span className="text-xs font-medium text-primary bg-accent px-2 py-0.5 rounded-full mb-2 inline-block">
                        {category}
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">{name}</h3>
                    <p className="text-base font-bold text-primary mb-4">NPR {price.toLocaleString()}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCheckoutProductId(productId)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                      >
                        <ShoppingCart size={14} /> Buy Now
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-2 rounded-xl border border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />

      {checkoutProductId !== null && (
        <CheckoutModal
          open={true}
          onClose={() => setCheckoutProductId(null)}
          products={items.map(toRealProduct)}
          initialProductId={checkoutProductId}
        />
      )}
    </div>
  )
}
