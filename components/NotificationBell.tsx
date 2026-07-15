'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, X, ShoppingCart, Package, Tag, AlertTriangle, Info } from 'lucide-react'
import Link from 'next/link'
import { useNotifications, Notification } from '@/hooks/useNotifications'

const typeIcon: Record<string, React.ReactNode> = {
  order:        <ShoppingCart size={14} />,
  order_status: <ShoppingCart size={14} />,
  product:      <Package size={14} />,
  coupon:       <Tag size={14} />,
  alert:        <AlertTriangle size={14} />,
  default:      <Info size={14} />,
}

const typeColor: Record<string, string> = {
  order:        'text-blue-500 bg-blue-500/10',
  order_status: 'text-blue-500 bg-blue-500/10',
  product:      'text-purple-500 bg-purple-500/10',
  coupon:       'text-green-500 bg-green-500/10',
  alert:        'text-orange-500 bg-orange-500/10',
  default:      'text-primary bg-primary/10',
}

function getTypeKey(type: string) {
  return Object.keys(typeIcon).find((k) => type?.toLowerCase().includes(k)) ?? 'default'
}

function formatTime(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

// Toast shown in top-right corner
export function NotificationToasts() {
  const { toasts, dismissToast } = useNotifications()

  return (
    <div className="fixed top-24 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const key = getTypeKey(t.type)
          const colorClass = typeColor[key]
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="pointer-events-auto w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="flex items-start gap-3 p-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  {typeIcon[key]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{t.title || 'Notification'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.message}</p>
                </div>
                <button
                  onClick={() => dismissToast(t.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
              {/* Progress bar */}
              <motion.div
                className="h-0.5 bg-primary"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// Bell icon with dropdown
export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const preview = notifications.slice(0, 8)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-xl hover:bg-muted transition-colors relative"
      >
        <Bell size={20} className="text-foreground" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-[100]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-destructive/10 text-destructive rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto">
              {preview.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Bell size={24} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                preview.map((n) => <NotifItem key={n.id} n={n} onRead={markRead} onClose={() => setOpen(false)} />)
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-border px-4 py-2.5">
                <Link
                  href="/my-notifications"
                  onClick={() => setOpen(false)}
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  View all notifications →
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NotifItem({ n, onRead, onClose }: { n: Notification; onRead: (id: number) => void; onClose: () => void }) {
  const key = getTypeKey(n.type)
  const colorClass = typeColor[key]

  return (
    <button
      onClick={() => { if (!n.is_read) onRead(n.id); onClose(); }}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${
        !n.is_read ? 'bg-primary/5' : ''
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}>
        {typeIcon[key]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className={`text-xs font-semibold leading-snug ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
            {n.title || 'Notification'}
          </p>
          {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">{formatTime(n.created_at)}</p>
      </div>
    </button>
  )
}
