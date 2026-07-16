'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const promos = [
  {
    title: 'Free Delivery',
    subtitle: 'On every order',
    description: 'Delivered to your doorstep at no extra cost, no minimum order.',
    cta: 'Shop Now',
    featured: true,
  },
  {
    title: 'Prescription Uploads',
    subtitle: 'For Rx medicines',
    description: 'Ordering a prescription-only item? Upload it securely during checkout.',
    cta: 'Browse Products',
    featured: false,
  },
]

export default function PromoCards() {
  return (
    <section className="max-w-7xl mx-auto px-4 pb-14">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {promos.map((promo, i) => (
          <motion.div
            key={promo.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className={`group rounded-3xl p-7 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
              promo.featured
                ? 'bg-primary border border-primary shadow-lg shadow-primary/20'
                : 'glass'
            }`}
            style={{ minHeight: '230px' }}
          >
            <div>
              <span
                className={`block text-xs font-semibold tracking-wide uppercase mb-3 ${
                  promo.featured ? 'text-white/70' : 'text-primary'
                }`}
              >
                {promo.subtitle}
              </span>

              <h3
                className={`text-2xl font-bold leading-tight mb-2 ${
                  promo.featured ? 'text-white' : 'text-foreground'
                }`}
              >
                {promo.title}
              </h3>

              <p className={`text-sm leading-relaxed ${promo.featured ? 'text-white/75' : 'text-muted-foreground'}`}>
                {promo.description}
              </p>
            </div>

            <a
              href="#products"
              className={`flex items-center gap-2 text-sm font-semibold mt-6 w-fit px-5 py-2.5 rounded-xl transition-colors ${
                promo.featured
                  ? 'bg-white text-primary hover:bg-white/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {promo.cta}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
