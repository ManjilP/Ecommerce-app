'use client'

import { useRouter, usePathname } from 'next/navigation'
import { categories } from '@/lib/pharmacy-data'

interface SecondaryNavProps {
  activeCategory?: string
  onCategoryChange?: (cat: string) => void
}

export default function SecondaryNav({ activeCategory = 'All', onCategoryChange }: SecondaryNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleCategory = (cat: string) => {
    if (pathname === '/landing' && onCategoryChange) {
      onCategoryChange(cat)
      // Smoothly bring the (now filtered) product grid into view
      setTimeout(() => {
        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 60)
    } else {
      router.push(`/landing?category=${encodeURIComponent(cat)}#products`)
    }
  }

  return (
    <div className="fixed top-20 left-0 right-0 z-30 glass-nav">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-12 flex items-center gap-3 relative">
        {/* Category quick-links (Amazon/Flipkart style) — fills the bar */}
        <nav className="flex items-center gap-1 overflow-x-auto flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {['All', ...categories].map((cat) => {
            const active = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary/12 text-primary'
                    : 'text-foreground/75 hover:text-primary hover:bg-primary/8'
                }`}
              >
                {cat === 'All' ? 'All Products' : cat}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
