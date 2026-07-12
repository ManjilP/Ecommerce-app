"use client";
import { useEffect, useState } from "react";

export interface StreamNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function useNotificationStream() {
  const [streamNotifications, setStreamNotifications] = useState<StreamNotification[]>([]);

  useEffect(() => {
    const es = new EventSource("/api/notifications/stream");

    es.onmessage = (e) => {
      const notif: StreamNotification = JSON.parse(e.data);
      setStreamNotifications((prev) => [notif, ...prev]);
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, []);

  const unreadCount = streamNotifications.length;

  return { streamNotifications, unreadCount, setStreamNotifications };
}
