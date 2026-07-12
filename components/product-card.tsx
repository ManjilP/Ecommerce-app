'use client'

import { useState } from 'react'
import { Heart, ShoppingCart } from 'lucide-react'
import { motion } from 'framer-motion'

export interface RealProduct {
  id: number
  name: string
  category: string
  price: number | string
  image?: string
  description?: string
}

interface ProductCardProps {
  product: RealProduct
  onAddToCart?: (product: RealProduct) => void
  wishlisted?: boolean
  onWishlist?: (product: RealProduct) => void
}

export default function ProductCard({ product, onAddToCart, wishlisted = false, onWishlist }: ProductCardProps) {
  const [added, setAdded] = useState(false)
  const [localWishlisted, setLocalWishlisted] = useState(wishlisted)

  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price

  const handleAddToCart = () => {
    setAdded(true)
    onAddToCart?.(product)
    setTimeout(() => setAdded(false), 1800)
  }

  const handleWishlist = () => {
    setLocalWishlisted((prev) => !prev)
    onWishlist?.(product)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex flex-col"
    >
      {/* Image area */}
      <div className="relative bg-white aspect-square overflow-hidden">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
              <span className="text-3xl">💊</span>
            </div>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-muted-foreground rounded-full border border-border shadow-sm">
            {product.category}
          </span>
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className="absolute bottom-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50"
          aria-label={localWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={14}
            className={localWishlisted ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-0.5">
          {product.category}
        </p>
        <h3 className="text-sm font-semibold text-foreground leading-snug mb-3 line-clamp-2 flex-1">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-end justify-between mb-3 mt-auto">
          <p className="text-lg font-bold text-foreground leading-none">
            NPR {isNaN(price) ? product.price : price.toLocaleString()}
          </p>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full text-green-700 bg-green-100">
            In Stock
          </span>
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            added
              ? 'bg-emerald-600 text-white scale-95'
              : 'bg-primary text-primary-foreground hover:bg-emerald-700 active:scale-95'
          }`}
        >
          <ShoppingCart size={14} />
          {added ? 'Added!' : 'Add to Cart'}
        </button>
      </div>
    </motion.div>
  )
}
