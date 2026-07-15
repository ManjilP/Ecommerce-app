import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const POLL_INTERVAL = 15000
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  let closed = false
  let lastIds = new Set<number>()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      const fetchNotifications = async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/notifications/`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(10000),
          })
          if (!res.ok) return

          const json = await res.json()
          const notifications: Array<{ id: number; title: string; message: string; type: string; is_read: boolean; created_at: string }> =
            Array.isArray(json) ? json : json.results ?? []

          const newOnes = notifications.filter((n) => !lastIds.has(n.id) && !n.is_read)

          if (lastIds.size > 0 && newOnes.length > 0) {
            newOnes.forEach((n) => send('notification', n))
          }

          lastIds = new Set(notifications.map((n) => n.id))
          send('sync', { notifications })
        } catch {}
      }

      // initial fetch
      await fetchNotifications()

      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return }
        await fetchNotifications()
      }, POLL_INTERVAL)

      // heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        if (closed) { clearInterval(heartbeat); return }
        try { controller.enqueue(encoder.encode(': ping\n\n')) } catch {}
      }, 30000)

      req.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(interval)
        clearInterval(heartbeat)
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
