'use client'

import { useState } from 'react'
import { Heart, ShoppingCart, Pill } from 'lucide-react'
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
  const [imageError, setImageError] = useState(false)

  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price
  const hasValidImage = !!product.image && /^(https?:\/\/|\/)/.test(product.image)

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
        {hasValidImage && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
              <Pill size={26} className="text-primary" />
            </div>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-0.5 bg-card/90 backdrop-blur-sm text-[10px] font-semibold text-muted-foreground rounded-full border border-border shadow-sm">
            {product.category}
          </span>
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className="absolute bottom-3 right-3 w-8 h-8 bg-card rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive/10"
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
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ color: 'var(--green)', background: 'color-mix(in srgb, var(--green) 14%, transparent)' }}>
            In Stock
          </span>
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            added
              ? 'bg-primary text-primary-foreground scale-95'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
          }`}
        >
          <ShoppingCart size={14} />
          {added ? 'Added!' : 'Add to Cart'}
        </button>
      </div>
    </motion.div>
  )
}
