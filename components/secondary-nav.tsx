'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlignJustify } from 'lucide-react'
import { categories } from '@/lib/pharmacy-data'
const categoryTabs = categories.slice(0, 5) // ponytail: was a separate export, inlined

interface SecondaryNavProps {
  activeCategory?: string
  onCategoryChange?: (cat: string) => void
}

export default function SecondaryNav({ activeCategory = 'All', onCategoryChange }: SecondaryNavProps) {
  const handleCategory = (cat: string) => {
    onCategoryChange?.(cat)
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-3">
        {/* All categories button */}
        <button onClick={() => handleCategory('All')} className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex-shrink-0 hover:bg-emerald-700 transition-colors">
          <AlignJustify size={15} />
          <span>All Categories</span>
        </button>

        {/* Divider */}
        <div className="hidden md:block h-5 w-px bg-border" />

        {/* Scrollable category tabs */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categoryTabs.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-black hover:text-primary hover:bg-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right nav links */}
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          {[
            { label: 'About', href: '/about' },
            { label: 'Contact', href: '/contact' },
            { label: 'My Wishlist', href: '/my-wishlist' },
            { label: 'Notifications', href: '/my-notifications' },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="px-3 py-1.5 text-sm text-black hover:text-primary hover:bg-muted rounded-lg transition-colors whitespace-nowrap"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
