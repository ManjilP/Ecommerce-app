'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/api'

export interface Notification {
  id: number
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

interface NotificationsContextValue {
  notifications: Notification[]
  unreadCount: number
  toasts: Notification[]
  dismissToast: (id: number) => void
  markRead: (id: number) => void
  markAllRead: () => void
  removeNotification: (id: number) => void
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  unreadCount: 0,
  toasts: [],
  dismissToast: () => {},
  markRead: () => {},
  markAllRead: () => {},
  removeNotification: () => {},
})

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Notification[]>([])
  const esRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    const token = sessionStorage.getItem('access_token')
    if (!token) return

    if (esRef.current) {
      esRef.current.close()
    }

    const es = new EventSource(`/api/notifications/stream`, {})

    // EventSource doesn't support custom headers — pass token via a one-time fetch trick
    // Instead we use a signed URL approach: re-open with token param won't work with JWT
    // Solution: use fetch-based SSE with ReadableStream on the client
    es.close()

    // Use fetch-based SSE to support Authorization header
    const ctrl = new AbortController()

    const connectFetch = async () => {
      try {
        const res = await fetch('/api/notifications/stream', {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        })

        if (!res.ok || !res.body) return

        const reader = res.body.getReader()
        const dec = new TextDecoder()
        let buf = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })

          const parts = buf.split('\n\n')
          buf = parts.pop() ?? ''

          for (const part of parts) {
            if (!part.trim() || part.startsWith(':')) continue

            const lines = part.split('\n')
            let event = 'message'
            let data = ''
            for (const line of lines) {
              if (line.startsWith('event:')) event = line.slice(6).trim()
              if (line.startsWith('data:')) data = line.slice(5).trim()
            }

            if (!data) continue

            try {
              const parsed = JSON.parse(data)
              if (event === 'sync') {
                setNotifications(parsed.notifications ?? [])
              } else if (event === 'notification') {
                // new unread notification arrived
                setNotifications((prev) => {
                  if (prev.find((n) => n.id === parsed.id)) return prev
                  return [parsed, ...prev]
                })
                setToasts((prev) => [...prev, parsed])
                // auto-dismiss toast after 5s
                setTimeout(() => {
                  setToasts((prev) => prev.filter((t) => t.id !== parsed.id))
                }, 5000)
              }
            } catch {}
          }
        }
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === 'AbortError') return
        // reconnect after 10s on error
        setTimeout(connectFetch, 10000)
      }
    }

    connectFetch()
    esRef.current = { close: () => ctrl.abort() } as unknown as EventSource
  }, [])

  useEffect(() => {
    connect()
    return () => { esRef.current?.close() }
  }, [connect])

  const markRead = useCallback(async (id: number) => {
    await markNotificationRead(id).catch(() => {})
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }, [])

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead().catch(() => {})
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }, [])

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, toasts, dismissToast, markRead, markAllRead, removeNotification }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
