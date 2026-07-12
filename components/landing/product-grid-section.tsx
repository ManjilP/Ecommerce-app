'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import ProductCard, { type RealProduct } from '@/components/product-card'
import CheckoutModal from '@/components/checkout-modal'
import { getProducts, addToWishlist, removeFromWishlist, getWishlist } from '@/lib/api'

const filterCategories = ['All', 'Medicines', 'Vitamins', 'Skincare', 'Baby Care', 'Health Devices']

interface ProductGridSectionProps {
  onProductsLoaded?: (products: RealProduct[]) => void
  activeCategory?: string
  onCategoryChange?: (category: string) => void
}

export default function ProductGridSection({ onProductsLoaded, activeCategory = 'All', onCategoryChange }: ProductGridSectionProps) {
  const [products, setProducts] = useState<RealProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [wishlistMap, setWishlistMap] = useState<Record<number, number>>({})
  const [checkoutProduct, setCheckoutProduct] = useState<RealProduct | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getProducts()
      const data: RealProduct[] = Array.isArray(res.data) ? res.data : res.data.results ?? []
      setProducts(data)
      onProductsLoaded?.(data)
    } catch {
      setError('Failed to load products. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [onProductsLoaded])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    const token = sessionStorage.getItem('access_token')
    if (!token) return
    getWishlist()
      .then((res) => {
        const items: { id: number; product: number | { id: number } }[] = Array.isArray(res.data)
          ? res.data
          : res.data.results ?? []
        const map: Record<number, number> = {}
        items.forEach((item) => {
          const productId = typeof item.product === 'object' ? item.product.id : item.product
          map[productId] = item.id
        })
        setWishlistMap(map)
      })
      .catch(() => {})
  }, [])

  const handleWishlist = async (product: RealProduct) => {
    const token = sessionStorage.getItem('access_token')
    if (!token) return
    if (wishlistMap[product.id]) {
      try {
        await removeFromWishlist(wishlistMap[product.id])
        setWishlistMap((prev) => { const next = { ...prev }; delete next[product.id]; return next })
      } catch {}
    } else {
      try {
        const res = await addToWishlist(product.id)
        setWishlistMap((prev) => ({ ...prev, [product.id]: res.data.id }))
      } catch {}
    }
  }

  const filtered = activeCategory === 'All'
    ? products
    : products.filter((p) => p.category === activeCategory)

  return (
    <>
      <section id="products" className="max-w-7xl mx-auto px-4 py-16">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Our Products</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
              Shop by Category
            </h2>
          </div>
          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {filterCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange?.(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card border border-border text-black hover:border-primary/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-muted rounded-full w-1/3" />
                  <div className="h-4 bg-muted rounded-full w-4/5" />
                  <div className="h-4 bg-muted rounded-full w-3/5" />
                  <div className="h-8 bg-muted rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-muted-foreground text-sm">{error}</p>
            <button
              onClick={fetchProducts}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* Products grid */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">No products found in this category.</p>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5"
              >
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    wishlisted={!!wishlistMap[product.id]}
                    onWishlist={handleWishlist}
                    onAddToCart={(p) => setCheckoutProduct(p)}
                  />
                ))}
              </motion.div>
            )}
          </>
        )}
      </section>

      {/* Checkout modal triggered by Add to Cart */}
      {checkoutProduct && (
        <CheckoutModal
          open={!!checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
          products={products}
          initialProductId={checkoutProduct.id}
        />
      )}
    </>
  )
}
