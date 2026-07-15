'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, User, Store, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { vendorLogin, vendorRegister } from '@/lib/api'
import { isTokenExpired } from '@/lib/api'

type Tab = 'login' | 'register'

interface FieldError {
  username?: string
  password?: string
  confirmPassword?: string
  email?: string
  store_name?: string
  slug?: string
  general?: string
}

export default function VendorLoginPage() {
  return (
    <Suspense fallback={null}>
      <VendorLoginContent />
    </Suspense>
  )
}

function VendorLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'register' ? 'register' : 'login')

  // Login
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPass, setShowLoginPass] = useState(false)
  const [loginErrors, setLoginErrors] = useState<FieldError>({})
  const [loginLoading, setLoginLoading] = useState(false)

  // Register
  const [storeName, setStoreName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [showRegPass, setShowRegPass] = useState(false)
  const [showRegConfirm, setShowRegConfirm] = useState(false)
  const [regErrors, setRegErrors] = useState<FieldError>({})
  const [regLoading, setRegLoading] = useState(false)
  const [regSuccess, setRegSuccess] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem('access_token')
    if (!token) return
    if (isTokenExpired(token)) {
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('refresh_token')
      return
    }
    router.replace('/dashboard')
  }, [router])

  // Auto-generate slug from store name
  useEffect(() => {
    if (!slugEdited) {
      setSlug(storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }, [storeName, slugEdited])

  const validateLogin = () => {
    const e: FieldError = {}
    if (!loginUsername.trim()) e.username = 'Username is required'
    if (!loginPassword) e.password = 'Password is required'
    return e
  }

  const validateRegister = () => {
    const e: FieldError = {}
    if (!storeName.trim()) e.store_name = 'Store name is required'
    if (!slug.trim()) e.slug = 'Store slug is required'
    else if (!/^[a-z0-9-]+$/.test(slug)) e.slug = 'Only lowercase letters, numbers, and hyphens'
    if (!regUsername.trim()) e.username = 'Username is required'
    if (!regEmail.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(regEmail)) e.email = 'Enter a valid email'
    if (!regPassword) e.password = 'Password is required'
    else if (regPassword.length < 8) e.password = 'At least 8 characters'
    if (regConfirm !== regPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateLogin()
    if (Object.keys(errs).length) { setLoginErrors(errs); return }
    setLoginErrors({})
    setLoginLoading(true)
    try {
      const res = await vendorLogin(loginUsername.trim(), loginPassword)
      const data = res.data
      sessionStorage.setItem('access_token', data.access ?? data.access_token ?? '')
      sessionStorage.setItem('refresh_token', data.refresh ?? data.refresh_token ?? '')
      sessionStorage.setItem('username', loginUsername.trim())
      sessionStorage.setItem('is_admin', 'true')
      const tenantSlug = data.store?.slug ?? data.slug ?? data.tenant_slug ?? ''
      if (tenantSlug) sessionStorage.setItem('tenant_slug', tenantSlug)
      const role = data.role ?? data.tenant_role ?? 'owner'
      sessionStorage.setItem('tenant_role', role)
      router.replace('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; non_field_errors?: string[] } } }
      const msg = e.response?.data?.detail
        ?? e.response?.data?.non_field_errors?.[0]
        ?? 'Invalid username or password'
      setLoginErrors({ general: msg })
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateRegister()
    if (Object.keys(errs).length) { setRegErrors(errs); return }
    setRegErrors({})
    setRegLoading(true)
    try {
      await vendorRegister(regUsername.trim(), regPassword, regEmail.trim(), storeName.trim(), slug.trim())
      setRegSuccess(true)
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } }
      const data = e.response?.data ?? {}
      const msg = Object.values(data).flat()[0] as string ?? 'Registration failed. Please try again.'
      setRegErrors({ general: msg })
    } finally {
      setRegLoading(false)
    }
  }

  const inputStyle = (err?: string): React.CSSProperties => ({
    width: '100%',
    paddingLeft: '40px',
    paddingRight: '16px',
    paddingTop: '12px',
    paddingBottom: '12px',
    background: 'var(--card-2)',
    border: `1px solid ${err ? 'var(--red)' : 'var(--border-strong)'}`,
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
  })

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-60 blur-3xl" style={{ background: 'var(--card-2)' }} />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl" style={{ background: 'var(--accent)', opacity: 0.1 }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/landing">
            <span className="font-heading text-3xl font-bold text-foreground">
              Shop<span className="text-primary">.</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">Vendor Portal</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card rounded-3xl border border-border shadow-lg overflow-hidden"
        >
          <div className="flex border-b border-border">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setRegSuccess(false) }}
                className={`flex-1 py-4 text-sm font-semibold capitalize transition-all ${
                  tab === t
                    ? 'text-primary border-b-2 border-primary bg-accent/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'login' ? 'Vendor Login' : 'Register Store'}
              </button>
            ))}
          </div>

          <div className="p-7">
            {/* Login */}
            {tab === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                {loginErrors.general && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-destructive bg-destructive/10 border border-destructive/20">
                    <AlertCircle size={14} /> {loginErrors.general}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Username</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} placeholder="your_username" style={inputStyle(loginErrors.username)} />
                  </div>
                  {loginErrors.username && <p className="flex items-center gap-1 text-xs text-red-500 mt-1"><AlertCircle size={11} /> {loginErrors.username}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showLoginPass ? 'text' : 'password'} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle(loginErrors.password), paddingRight: '40px' }} />
                    <button type="button" onClick={() => setShowLoginPass(!showLoginPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showLoginPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {loginErrors.password && <p className="flex items-center gap-1 text-xs text-red-500 mt-1"><AlertCircle size={11} /> {loginErrors.password}</p>}
                </div>

                <button type="submit" disabled={loginLoading} className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                  {loginLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Login to Dashboard'}
                </button>

                <div className="text-center pt-1">
                  <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Customer login →
                  </Link>
                </div>
              </motion.form>
            )}

            {/* Register */}
            {tab === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
              >
                {regSuccess ? (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-foreground">Store Registered!</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your store is pending admin approval. You'll be able to log in once it's activated.
                    </p>
                    <button
                      onClick={() => { setTab('login'); setRegSuccess(false) }}
                      className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all"
                    >
                      Go to Login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    {regErrors.general && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-destructive bg-destructive/10 border border-destructive/20">
                        <AlertCircle size={14} /> {regErrors.general}
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Store Name</label>
                      <div className="relative">
                        <Store size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="My Pharmacy" style={inputStyle(regErrors.store_name)} />
                      </div>
                      {regErrors.store_name && <p className="flex items-center gap-1 text-xs text-red-500 mt-1"><AlertCircle size={11} /> {regErrors.store_name}</p>}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Store Slug</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/</span>
                        <input
                          type="text"
                          value={slug}
                          onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
                          placeholder="my-pharmacy"
                          style={{ ...inputStyle(regErrors.slug), paddingLeft: '24px' }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Auto-generated from store name. Lowercase, hyphens only.</p>
                      {regErrors.slug && <p className="flex items-center gap-1 text-xs text-red-500 mt-1"><AlertCircle size={11} /> {regErrors.slug}</p>}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Username</label>
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} placeholder="ram_sharma" style={inputStyle(regErrors.username)} />
                      </div>
                      {regErrors.username && <p className="flex items-center gap-1 text-xs text-red-500 mt-1"><AlertCircle size={11} /> {regErrors.username}</p>}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Email Address</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="ram@example.com" style={inputStyle(regErrors.email)} />
                      </div>
                      {regErrors.email && <p className="flex items-center gap-1 text-xs text-red-500 mt-1"><AlertCircle size={11} /> {regErrors.email}</p>}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type={showRegPass ? 'text' : 'password'} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Min. 8 characters" style={{ ...inputStyle(regErrors.password), paddingRight: '40px' }} />
                        <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showRegPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {regErrors.password && <p className="flex items-center gap-1 text-xs text-red-500 mt-1"><AlertCircle size={11} /> {regErrors.password}</p>}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Confirm Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type={showRegConfirm ? 'text' : 'password'} value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} placeholder="Repeat password" style={{ ...inputStyle(regErrors.confirmPassword), paddingRight: '40px' }} />
                        <button type="button" onClick={() => setShowRegConfirm(!showRegConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showRegConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {regErrors.confirmPassword && <p className="flex items-center gap-1 text-xs text-red-500 mt-1"><AlertCircle size={11} /> {regErrors.confirmPassword}</p>}
                    </div>

                    <button type="submit" disabled={regLoading} className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                      {regLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Register Store'}
                    </button>

                    <p className="text-xs text-center text-muted-foreground">
                      Your store will be inactive until approved by the platform admin.
                    </p>
                  </form>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link href="/login" className="text-primary hover:underline">← Back to customer login</Link>
        </p>
      </div>
    </div>
  )
}
