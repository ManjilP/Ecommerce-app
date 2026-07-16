'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import ProductCard, { type RealProduct } from '@/components/product-card'
import { useCart } from '@/hooks/useCart'
import { useProducts } from '@/hooks/useProducts'
import { useWishlist } from '@/hooks/useWishlist'

interface ProductGridSectionProps {
  onProductsLoaded?: (products: RealProduct[]) => void
  activeCategory?: string
  onCategoryChange?: (category: string) => void
}

export default function ProductGridSection(props: ProductGridSectionProps) {
  return (
    <Suspense fallback={<div className="h-20 w-full animate-pulse bg-muted rounded-xl" />}>
      <ProductGridContent {...props} />
    </Suspense>
  )
}

function ProductGridContent({ onProductsLoaded, activeCategory = 'All', onCategoryChange }: ProductGridSectionProps) {
  const { products, loading, error, refresh } = useProducts()
  const { wishlistMap, toggle } = useWishlist()
  const { addItem } = useCart()
  const searchParams = useSearchParams()
  const searchParam = searchParams.get('search')

  useEffect(() => {
    if (products.length > 0) onProductsLoaded?.(products)
  }, [products, onProductsLoaded])

  const filtered = products.filter((p) => {
    const matchCategory = activeCategory === 'All' || p.category === activeCategory
    const matchSearch = !searchParam || 
      (p.name && p.name.toLowerCase().includes(searchParam.toLowerCase())) || 
      (p.description && p.description.toLowerCase().includes(searchParam.toLowerCase()))
    return matchCategory && matchSearch
  })

  return (
    <>
      <section id="products" className="max-w-7xl mx-auto px-4 py-16 scroll-mt-36">
        {/* Section header */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Our Products</p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
            {activeCategory === 'All' ? 'All Products' : activeCategory}
          </h2>
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
              onClick={refresh}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
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
                    onWishlist={(p) => toggle(p.id)}
                    onAddToCart={(p) => addItem(p.id, 1, { name: p.name, price: typeof p.price === 'string' ? parseFloat(p.price) : p.price, image: p.image, stock: p.quantity })}
                  />
                ))}
              </motion.div>
            )}
          </>
        )}
      </section>
    </>
  )
}
