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
      {/* AboutUsSection is designed with fixed light-palette colors (black text, brass
          accents) and isn't dark-mode aware, so this wrapper pins it to a light backdrop
          regardless of the site theme to keep its text readable. */}
      <main className="flex-1 pt-32 bg-[#f5f0e6]">
        <AboutUsSection />
      </main>
      <Footer />
    </GridBackground>
  )
}
