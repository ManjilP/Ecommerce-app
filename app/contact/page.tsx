'use client'

import Navbar from '@/components/navbar'
import SecondaryNav from '@/components/secondary-nav'
import Footer from '@/components/footer'
import { Contact2 } from '@/components/ui/contact-2'
import { GridBackground } from '@/components/ui/grid-background'

export default function ContactPage() {
  return (
    <GridBackground className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <SecondaryNav />
      <main className="flex-1 pt-32">
        <Contact2
          title="Contact Us"
          description="Have questions about your order, need help finding a medicine, or want to share feedback? Our team is here to assist you."
        />
      </main>
      <Footer />
    </GridBackground>
  )
}
