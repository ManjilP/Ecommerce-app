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
import { getMe, getUnreadNotificationCount, logout } from '@/lib/api'
import CartDrawer from '@/components/cart-drawer'
import { useCart } from '@/hooks/useCart'
import { useProducts } from '@/hooks/useProducts'
import { useWishlist } from '@/hooks/useWishlist'

interface UserInfo {
  username: string
  email?: string
  first_name?: string
  last_name?: string
}

export default function Navbar() {
  const router = useRouter()
  const { count: cartCount } = useCart()
  const { products } = useProducts()
  const { count: wishlistCount } = useWishlist()
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    const token = sessionStorage.getItem('access_token')
    if (!token) return

    getMe().then((res) => setUser(res.data)).catch(() => {})
    getUnreadNotificationCount()
      .then((res) => setNotifCount(res.data.unread_count ?? res.data.count ?? 0))
      .catch(() => {})
  }, [])

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    if (val.trim().length < 1) { setSuggestions([]); setShowSuggestions(false); return }
    const filtered = products
      .map((p) => p.name)
      .filter(n => n.toLowerCase().includes(val.toLowerCase()))
      .slice(0, 8)
    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      router.push(`/landing?search=${encodeURIComponent(searchQuery)}#products`)
    }
  }

  const handleSearchSelect = (name: string) => {
    setSearchQuery(name)
    setSuggestions([])
    setShowSuggestions(false)
    router.push(`/landing?search=${encodeURIComponent(name)}#products`)
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
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search medicines, health products..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(suggestions.length > 0)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              className="w-full bg-muted/50 border border-border text-foreground text-sm rounded-full !pl-12 pr-24 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:bg-background transition-all shadow-sm hover:shadow-md"
            />
            <div className="absolute inset-y-0 right-1.5 flex items-center gap-1">
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setShowSuggestions(false); router.push('/landing#products'); }} 
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              )}
              <button 
                onClick={handleSearchSubmit} 
                className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:bg-emerald-600 transition-all hover:scale-105 shadow-sm hover:shadow-primary/25"
              >
                Search
              </button>
            </div>
            
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-background border border-border/60 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl">
                <div className="max-h-[280px] overflow-y-auto py-2 custom-scrollbar">
                  {suggestions.map((name) => (
                    <button 
                      key={name} 
                      onMouseDown={() => handleSearchSelect(name)} 
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 transition-colors text-left group/item"
                    >
                      <Search size={14} className="text-muted-foreground group-hover/item:text-primary transition-colors flex-shrink-0" />
                      <span className="font-medium group-hover/item:text-primary transition-colors">{name}</span>
                    </button>
                  ))}
                </div>
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

            {/* Cart */}
            <button onClick={() => setCartOpen(true)} className="hidden md:flex p-2 rounded-xl hover:bg-muted transition-colors relative">
              <ShoppingCart size={20} className="text-foreground" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
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
        <div className="md:hidden px-4 pb-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(suggestions.length > 0)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              className="w-full bg-muted/50 border border-border text-foreground text-sm rounded-full !pl-11 pr-20 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:bg-background transition-all shadow-sm"
            />
            <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setShowSuggestions(false); router.push('/landing#products'); }} 
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                >
                  <X size={14} />
                </button>
              )}
              <button 
                onClick={handleSearchSubmit} 
                className="p-1.5 mr-1 bg-primary text-primary-foreground rounded-full hover:bg-emerald-600 transition-all shadow-sm"
              >
                <Search size={14} />
              </button>
            </div>
            
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-background border border-border/60 rounded-2xl shadow-xl overflow-hidden">
                <div className="max-h-[220px] overflow-y-auto py-1">
                  {suggestions.map((name) => (
                    <button 
                      key={name} 
                      onMouseDown={() => handleSearchSelect(name)} 
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-foreground hover:bg-primary/10 transition-colors text-left group/item"
                    >
                      <Search size={14} className="text-muted-foreground group-hover/item:text-primary transition-colors flex-shrink-0" />
                      <span className="font-medium group-hover/item:text-primary">{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
