'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AlignJustify, ChevronDown } from 'lucide-react'
import { categories } from '@/lib/pharmacy-data'
import { motion, AnimatePresence } from 'framer-motion'

interface SecondaryNavProps {
  activeCategory?: string
  onCategoryChange?: (cat: string) => void
}

export default function SecondaryNav({ activeCategory = 'All', onCategoryChange }: SecondaryNavProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCategory = (cat: string) => {
    setIsDropdownOpen(false)
    if (pathname === '/landing' && onCategoryChange) {
      onCategoryChange(cat)
    } else {
      router.push(`/landing?category=${encodeURIComponent(cat)}#products`)
    }
  }

  return (
    <div className="fixed top-20 left-0 right-0 z-30 bg-card border-b border-border shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-12 flex items-center gap-3 relative">
        {/* All categories button with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0 hover:bg-primary/90 transition-colors shadow-sm"
          >
            <AlignJustify size={16} />
            <span>All Categories</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
              >
                <div className="p-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                  <button
                    onClick={() => handleCategory('All')}
                    className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeCategory === 'All' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    All Products
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategory(cat)}
                      className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeCategory === cat ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted hover:pl-5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Spacer to push remaining content to the right */}
        <div className="flex-1" />
      </div>
    </div>
  )
}
