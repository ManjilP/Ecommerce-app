'use client'

import Navbar from '@/components/navbar'
import SecondaryNav from '@/components/secondary-nav'
import Footer from '@/components/footer'
import AboutUsSection from '@/components/ui/about-us-section'
import { GridBackground } from '@/components/ui/grid-background'

export default function AboutPage() {
  return (
    <GridBackground className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <SecondaryNav />
      <main className="flex-1 pt-28">
        <AboutUsSection />
      </main>
      <Footer />
    </GridBackground>
  )
}
