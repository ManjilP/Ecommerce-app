'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react'
import { login, register, isTokenExpired } from '@/lib/api'
import { useGoogleLogin } from '@react-oauth/google'

type Tab = 'login' | 'register'

interface FieldError {
  username?: string
  password?: string
  confirmPassword?: string
  email?: string
  general?: string
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
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
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [showRegPass, setShowRegPass] = useState(false)
  const [showRegConfirm, setShowRegConfirm] = useState(false)
  const [regErrors, setRegErrors] = useState<FieldError>({})
  const [regLoading, setRegLoading] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem('access_token')
    if (!token) return
    if (isTokenExpired(token)) {
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('refresh_token')
      return
    }
    const isAdmin = sessionStorage.getItem('is_admin') === 'true'
    router.replace(isAdmin ? '/dashboard' : '/landing')
  }, [router])

  const validateLogin = () => {
    const e: FieldError = {}
    if (!loginUsername.trim()) e.username = 'Username is required'
    if (!loginPassword) e.password = 'Password is required'
    return e
  }

  const validateRegister = () => {
    const e: FieldError = {}
    if (!regUsername.trim()) e.username = 'Username is required'
    if (!regEmail.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(regEmail)) e.email = 'Enter a valid email'
    if (!regPassword) e.password = 'Password is required'
    else if (regPassword.length < 8) e.password = 'Password must be at least 8 characters'
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
      const res = await login(loginUsername.trim(), loginPassword)
      sessionStorage.setItem('access_token', res.data.access)
      sessionStorage.setItem('refresh_token', res.data.refresh)
      sessionStorage.setItem('username', loginUsername.trim())
      // Decode JWT to check admin status without extra API call
      let isAdmin = res.data.is_admin ?? res.data.is_staff ?? false
      try {
        const payload = JSON.parse(atob(res.data.access.split('.')[1]))
        isAdmin = payload.is_admin ?? payload.is_staff ?? payload.role === 'admin' ?? isAdmin
      } catch {}
      sessionStorage.setItem('is_admin', String(isAdmin))
      router.replace(isAdmin ? '/dashboard' : '/landing')
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
      await register(regUsername.trim(), regPassword, regEmail.trim())
      const res = await login(regUsername.trim(), regPassword)
      sessionStorage.setItem('access_token', res.data.access)
      sessionStorage.setItem('refresh_token', res.data.refresh)
      sessionStorage.setItem('username', regUsername.trim())
      sessionStorage.setItem('is_admin', 'false')
      router.replace('/landing')
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } }
      const data = e.response?.data ?? {}
      const msg = Object.values(data).flat()[0] ?? 'Registration failed. Please try again.'
      setRegErrors({ general: msg })
    } finally {
      setRegLoading(false)
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: () => {
      setLoginErrors({ general: 'Google login coming soon. Please use username/password.' })
    },
    onError: () => setLoginErrors({ general: 'Google login failed.' }),
  })

  const inputStyle = (err?: string): React.CSSProperties => ({
    width: '100%',
    paddingLeft: '40px',
    paddingRight: '16px',
    paddingTop: '12px',
    paddingBottom: '12px',
    background: err ? '#fff1f2' : '#f0f5f0',
    border: `1px solid ${err ? '#fca5a5' : '#d4e8d4'}`,
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
  })

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-100 rounded-full opacity-30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/landing">
            <span className="font-heading text-3xl font-bold text-foreground">
              Shop<span className="text-primary">.</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">Nepal&apos;s Trusted Online Pharmacy</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl border border-border shadow-lg overflow-hidden"
        >
          <div className="flex border-b border-border">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-4 text-sm font-semibold capitalize transition-all ${
                  tab === t
                    ? 'text-primary border-b-2 border-primary bg-accent/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="p-7">
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
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    <AlertCircle size={14} />
                    {loginErrors.general}
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

                <button type="submit" disabled={loginLoading} className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                  {loginLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Login'}
                </button>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or continue with</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <button type="button" onClick={() => googleLogin()} className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-border bg-white text-sm font-medium text-foreground hover:bg-card transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="text-center pt-1">
                  <Link href="/admin-login" className="text-xs text-amber-600 font-medium hover:underline">Vendor login →</Link>
                </div>
              </motion.form>
            )}

            {tab === 'register' && (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                {regErrors.general && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    <AlertCircle size={14} />
                    {regErrors.general}
                  </div>
                )}

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
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
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

                <button type="submit" disabled={regLoading} className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                  {regLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
                </button>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <button type="button" onClick={() => googleLogin()} className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-border bg-white text-sm font-medium text-foreground hover:bg-card transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </button>
              </motion.form>
            )}
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our{' '}
          <Link href="#" className="text-primary hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
