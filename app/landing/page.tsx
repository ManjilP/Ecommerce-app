'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import SecondaryNav from '@/components/secondary-nav'
import Footer from '@/components/footer'
import HeroSection from '@/components/landing/hero-section'
import PromoCards from '@/components/landing/promo-cards'
import ProductGridSection from '@/components/landing/product-grid-section'
import { GridBackground } from '@/components/ui/grid-background'

export default function LandingPage() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    if (sessionStorage.getItem('is_admin') === 'true') {
      router.replace('/dashboard')
    }
  }, [router])

  return (
    <GridBackground className="min-h-screen bg-background">
      <Navbar />
      <SecondaryNav activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      {/* pt-28 accounts for fixed navbar (h-16) + secondary nav (h-12) */}
      <main className="pt-28 relative z-10">
        <HeroSection />
        <PromoCards />
        <ProductGridSection activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      </main>
      <Footer />
    </GridBackground>
  )
}
