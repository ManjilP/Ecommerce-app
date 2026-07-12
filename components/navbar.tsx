'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Heart, Bell, ChevronDown, Menu, X,
  ShoppingCart, LogOut, Package, Star, Settings,
} from 'lucide-react'
import { categories } from '@/lib/pharmacy-data'
import { getMe, getUnreadNotificationCount, getWishlist, logout, getProducts } from '@/lib/api'
import CheckoutModal from '@/components/checkout-modal'
import type { RealProduct } from '@/components/product-card'

interface UserInfo {
  username: string
  email?: string
  first_name?: string
  last_name?: string
}

export default function Navbar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [productNames, setProductNames] = useState<string[]>([])
  const [allProducts, setAllProducts] = useState<RealProduct[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [notifCount, setNotifCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)

  useEffect(() => {
    getProducts()
      .then((res) => {
        const items: RealProduct[] = Array.isArray(res.data) ? res.data : res.data.results ?? []
        setAllProducts(items)
        setProductNames(items.map((p) => p.name))
      })
      .catch(() => {})

    const token = sessionStorage.getItem('access_token')
    if (!token) return

    getMe().then((res) => setUser(res.data)).catch(() => {})
    getUnreadNotificationCount()
      .then((res) => setNotifCount(res.data.unread_count ?? res.data.count ?? 0))
      .catch(() => {})
    getWishlist()
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : res.data.results ?? []
        setWishlistCount(items.length)
      })
      .catch(() => {})
  }, [])

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    if (val.trim().length < 1) { setSuggestions([]); setShowSuggestions(false); return }
    const filtered = productNames.filter(n => n.toLowerCase().includes(val.toLowerCase())).slice(0, 8)
    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }

  const handleSearchSelect = (name: string) => {
    setSearchQuery(name)
    setSuggestions([])
    setShowSuggestions(false)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const refresh = sessionStorage.getItem('refresh_token')
    if (refresh) {
      try { await logout(refresh) } catch {}
    }
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
    sessionStorage.removeItem('is_admin')
    sessionStorage.removeItem('username')
    router.replace('/login')
  }

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name ?? ''}`.trim()
    : user?.username ?? ''

  const initials = displayName
    ? displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  const isLoggedIn = !!user

  return (
    <>
      {/* Primary Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/landing" className="flex-shrink-0">
            <span className="font-heading text-2xl font-bold text-foreground tracking-tight">
              Shop<span className="text-primary">.</span>
            </span>
          </Link>

          {/* Search bar — desktop */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-2xl mx-auto items-stretch rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow" style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search medicines, health products..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(suggestions.length > 0)}
              style={{ flex: 1, padding: '10px 16px', background: '#ffffff', color: '#1a1a1a', fontSize: '14px', border: 'none', outline: 'none' }}
            />
            <button className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2">
              <Search size={16} /><span>Search</span>
            </button>
            {showSuggestions && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #d4e8d4', borderTop: 'none', borderRadius: '0 0 12px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxHeight: '280px', overflowY: 'auto' }}>
                {suggestions.map((name) => (
                  <button key={name} onMouseDown={() => handleSearchSelect(name)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#1a1a1a', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f7f0'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <Search size={13} style={{ color: '#16a34a', flexShrink: 0 }} />{name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xs font-semibold">{initials}</span>
                  </div>
                  <ChevronDown size={14} className="text-muted-foreground hidden md:block" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white border border-border rounded-2xl shadow-lg overflow-hidden"
                    >
                      <div className="p-3 border-b border-border">
                        <p className="font-semibold text-sm text-foreground">{displayName}</p>
                        {user?.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                      </div>
                      <div className="py-1">
                        {[
                          { icon: Package, label: 'My Orders', href: '/my-orders' },
                          { icon: Heart, label: 'My Wishlist', href: '/my-wishlist' },
                          { icon: Star, label: 'My Reviews', href: '/my-reviews' },
                          { icon: Bell, label: 'Notifications', href: '/my-notifications' },
                          { icon: Settings, label: 'Settings', href: '#' },
                        ].map(({ icon: Icon, label, href }) => (
                          <Link
                            key={label}
                            href={href}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Icon size={15} className="text-muted-foreground" />
                            {label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-border py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={15} />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                Login
              </Link>
            )}

            {/* Wishlist */}
            <Link href="/my-wishlist" className="p-2 rounded-xl hover:bg-muted transition-colors relative">
              <Heart size={20} className="text-foreground" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <Link href="/my-notifications" className="p-2 rounded-xl hover:bg-muted transition-colors relative">
              <Bell size={20} className="text-foreground" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>

            {/* Cart icon (opens checkout) */}
            <button onClick={() => setCartOpen(true)} className="hidden md:flex p-2 rounded-xl hover:bg-muted transition-colors">
              <ShoppingCart size={20} className="text-foreground" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-muted transition-colors md:hidden"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3" style={{ position: 'relative' }}>
          <div className="flex items-stretch rounded-xl border border-border bg-card overflow-hidden">
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(suggestions.length > 0)}
              style={{ flex: 1, padding: '10px 16px', background: '#ffffff', fontSize: '14px', border: 'none', outline: 'none' }}
            />
            <button className="px-4 py-2.5 bg-primary text-primary-foreground">
              <Search size={16} />
            </button>
          </div>
          {showSuggestions && (
            <div style={{ position: 'absolute', top: '100%', left: '16px', right: '16px', zIndex: 50, background: '#fff', border: '1px solid #d4e8d4', borderRadius: '0 0 12px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxHeight: '220px', overflowY: 'auto' }}>
              {suggestions.map((name) => (
                <button key={name} onMouseDown={() => handleSearchSelect(name)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#1a1a1a', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f7f0'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <Search size={13} style={{ color: '#16a34a', flexShrink: 0 }} />{name}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-[120px] left-0 right-0 z-40 bg-white border-b border-border shadow-lg md:hidden"
          >
            <div className="p-4 space-y-1">
              {[
                { label: 'All Categories', href: '/landing' },
                { label: 'My Orders', href: '/my-orders' },
                { label: 'Notifications', href: '/my-notifications' },
                { label: 'My Reviews', href: '/my-reviews' },
                { label: 'About', href: '/landing#about' },
                { label: 'Contact', href: '/landing#contact' },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  {label}
                </Link>
              ))}
              {isLoggedIn && (
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout() }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click away to close user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}

      <CheckoutModal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        products={allProducts}
      />
    </>
  )
}
