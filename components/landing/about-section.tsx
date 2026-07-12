'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, CreditCard, Truck } from 'lucide-react'

const features = [
  {
    icon: ShieldCheck,
    title: 'Genuine Medicines',
    description:
      'Every product on Shop. is sourced directly from certified manufacturers and verified distributors. No counterfeits, ever.',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description:
      'Pay safely with eSewa, Khalti, or Cash on Delivery. Your transactions are encrypted and protected at every step.',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description:
      'Same-day dispatch in Kathmandu Valley. Delivery within 1–3 business days across 20+ cities in Nepal.',
  },
]



export default function AboutSection() {
  return (
    <section id="about" className="bg-card border-y border-border py-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-primary uppercase tracking-wider mb-3"
          >
            Why Choose Shop.
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-heading text-3xl md:text-4xl font-bold text-foreground"
          >
            Healthcare you can trust
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground mt-3 max-w-xl mx-auto leading-relaxed"
          >
            We believe access to quality medicines should be easy, safe, and transparent. Shop. is built for Nepal — by people who care.
          </motion.p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {features.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-2xl p-7 border border-border hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-5 group-hover:bg-primary transition-colors">
                <Icon size={22} className="text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>


      </div>
    </section>
  )
}
