'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User, Mail, Shield, Calendar, Clock, KeyRound, ChevronRight } from 'lucide-react'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { getMe } from '@/lib/api'

interface UserProfile {
  username: string
  email: string
  role?: 'admin' | 'customer'
  first_name?: string
  last_name?: string
  date_joined?: string
  last_login?: string | null
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border last:border-b-0">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-[15px] font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe().then((r) => setUser(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name ?? ''}`.trim()
    : user?.username ?? ''
  const initials = displayName
    ? displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground text-sm mt-1">Your account information</p>
          </div>

          {loading ? (
            <div className="bg-card rounded-3xl border border-border p-7 animate-pulse h-64" />
          ) : !user ? (
            <p className="text-destructive text-sm">Failed to load profile.</p>
          ) : (
            <>
              <div className="bg-card rounded-3xl border border-border shadow-sm p-7 mb-4 flex items-center gap-5">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--blue))' }}
                >
                  <span className="text-xl font-bold" style={{ color: 'var(--card)' }}>{initials}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">{displayName}</h2>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: user.role === 'admin' ? 'color-mix(in srgb, var(--orange) 12%, transparent)' : 'color-mix(in srgb, var(--accent) 12%, transparent)',
                      color: user.role === 'admin' ? 'var(--orange)' : 'var(--accent)',
                    }}
                  >
                    {user.role === 'admin' ? 'Vendor' : 'Customer'}
                  </span>
                </div>
              </div>

              <div className="bg-card rounded-3xl border border-border shadow-sm px-6 mb-4">
                <InfoRow icon={<User size={16} />} label="Username" value={user.username} />
                <InfoRow icon={<Mail size={16} />} label="Email address" value={user.email} />
                {user.role && <InfoRow icon={<Shield size={16} />} label="Role" value={user.role === 'admin' ? 'Vendor' : 'Customer'} />}
                {user.date_joined && (
                  <InfoRow
                    icon={<Calendar size={16} />}
                    label="Member since"
                    value={new Date(user.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  />
                )}
                {user.last_login && (
                  <InfoRow
                    icon={<Clock size={16} />}
                    label="Last login"
                    value={new Date(user.last_login).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  />
                )}
              </div>

              <Link
                href="/change-password"
                className="flex items-center gap-4 px-6 py-5 rounded-3xl bg-card border border-border shadow-sm hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
                  <KeyRound size={17} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-foreground">Change Password</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Update your account password</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
