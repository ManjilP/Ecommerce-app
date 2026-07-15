'use client'

import { motion } from 'framer-motion'
import { Bell, Package, CheckCircle, Tag, RotateCcw } from 'lucide-react'
import Navbar from '@/components/navbar'
import SecondaryNav from '@/components/secondary-nav'
import Footer from '@/components/footer'
import { GridBackground } from '@/components/ui/grid-background'
import { useNotifications, Notification } from '@/hooks/useNotifications'

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  order: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
  payment: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  stock: { icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-100' },
  promo: { icon: Tag, color: 'text-purple-600', bg: 'bg-purple-100' },
  default: { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' },
}

const getType = (n: Notification) => (n.type ?? 'default').toLowerCase()

function formatTime(ts?: string): string {
  if (!ts) return ''
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

export default function MyNotificationsPage() {
  const { notifications: notifs, unreadCount, markRead, markAllRead } = useNotifications()

  const handleMarkRead = (id: number) => markRead(id)
  const handleMarkAllRead = () => markAllRead()

  return (
    <GridBackground className="min-h-screen bg-background">
      <Navbar />
      <SecondaryNav />
      <div className="pt-32 max-w-2xl mx-auto px-4 py-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center">
                <Bell size={20} className="text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-3xl font-bold text-foreground">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
              </div>
            </div>
            <p className="text-muted-foreground text-sm ml-[52px]">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
              Mark all as read
            </button>
          )}
        </motion.div>

        {notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center"><Bell size={28} className="text-muted-foreground" /></div>
            <h3 className="font-heading text-xl font-bold text-foreground">You&apos;re all caught up</h3>
            <p className="text-sm text-muted-foreground">No notifications yet. Check back later!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map((notif, i) => {
              const config = typeConfig[getType(notif)] ?? typeConfig.default
              const { icon: Icon, color, bg } = config
              const read = notif.is_read
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => !read && handleMarkRead(notif.id)}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    !read ? 'bg-accent/50 border-primary/20 border-l-4 border-l-primary' : 'bg-card border-border'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${bg}`}>
                    <Icon size={18} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${!read ? 'text-foreground' : 'text-muted-foreground'} leading-snug`}>{notif.title || 'Notification'}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">{formatTime(notif.created_at)}</span>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${!read ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>{notif.message}</p>
                    {!read && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-primary font-semibold uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Unread
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </GridBackground>
  )
}
