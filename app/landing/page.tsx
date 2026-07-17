'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
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

  useEffect(() => {
    const category = new URLSearchParams(window.location.search).get('category')
    if (category) setActiveCategory(category)
  }, [])

  return (
    <GridBackground className="min-h-screen mesh-bg">
      <Navbar />
      {/* pt-20 accounts for the fixed navbar (h-20); categories now live inline in the products section */}
      <main className="pt-20 relative z-10">
        <HeroSection />
        <PromoCards />
        <ProductGridSection activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      </main>
      <Footer />
    </GridBackground>
  )
}
