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
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-20">
        {/* Decorative background — soft glow + faint dot grid, fades toward edges */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2 w-[900px] h-[520px] rounded-full blur-3xl"
            style={{ background: 'var(--primary, #0e8f9c)', opacity: 0.1 }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at center, var(--border-strong) 1px, transparent 1px)',
              backgroundSize: '26px 26px',
              maskImage: 'radial-gradient(ellipse 70% 60% at 50% 35%, black 0%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 35%, black 0%, transparent 75%)',
              opacity: 0.5,
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass inline-flex items-center gap-2 px-4 py-1.5 mb-7 rounded-full"
          >
            <ShieldCheck size={14} className="text-primary" />
            <span className="text-xs font-semibold text-foreground">Nepal&apos;s Trusted Online Pharmacy</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.05] tracking-tight mb-6"
          >
            Genuine Medicines,<br />
            <span className="text-primary">Delivered</span> to Your Door
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-9 max-w-2xl mx-auto"
          >
            Your trusted online pharmacy for authentic medicines and health products, delivered fast across Nepal.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-14"
          >
            <button
              onClick={() => setCheckoutOpen(true)}
              className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-base hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
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
              className="glass flex items-center gap-2 px-8 py-4 text-foreground rounded-2xl font-semibold text-base hover:border-primary/40 transition-all"
            >
              Browse Products
            </a>
          </motion.div>

          {/* Trust bar — one grouped strip, dividers between items */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="glass inline-flex flex-col sm:flex-row items-stretch rounded-3xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-border"
          >
            {trustBadges.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 px-6 py-4">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                  <Icon size={19} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
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
