'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Truck, Clock, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import CheckoutModal from '@/components/checkout-modal'
import type { RealProduct } from '@/components/product-card'

const trustBadges = [
  { icon: ShieldCheck, label: 'Genuine Medicines', sub: 'Verified suppliers' },
  { icon: Truck, label: 'Fast Nepal Delivery', sub: '1–3 business days' },
  { icon: Clock, label: '24/7 Support', sub: 'Always here to help' },
]

interface HeroSectionProps {
  products?: RealProduct[]
}

export default function HeroSection({ products = [] }: HeroSectionProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  return (
    <>
      <section className="relative overflow-hidden pt-12 pb-14 md:pt-16 md:pb-16">
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="max-w-3xl">
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight mb-6"
            >
              Genuine Medicines,{' '}
              <span className="text-primary">Delivered</span>{' '}
              to Your Door
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl"
            >
              Your trusted online pharmacy for authentic medicines and health products, delivered fast.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <button
                onClick={() => setCheckoutOpen(true)}
                className="flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm"
              >
                Order Now
                <ChevronRight size={16} />
              </button>
              <a
                href="#products"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-2 px-7 py-3.5 bg-transparent border-2 border-border text-foreground rounded-xl font-semibold text-base hover:bg-card hover:border-primary/40 transition-all"
              >
                Browse Products
              </a>
            </motion.div>
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-wrap gap-4 mt-10"
          >
            {trustBadges.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-5 py-3 bg-card rounded-2xl border border-border shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        products={products}
      />
    </>
  )
}
