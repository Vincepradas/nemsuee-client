import { useEffect, useState } from "react";

export type NotificationItem = {
  id: number;
  actionType: string;
  message: string;
  isRead?: number | boolean;
  courseId?: number | null;
  createdAt?: string;
};

export function useNotifications({
  api,
  headers,
  enabled,
}: {
  api: any;
  headers: any;
  enabled: boolean;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  async function loadNotifications() {
    if (!enabled) return;
    try {
      const rows = await api("/notifications/me", { headers });
      setNotifications((rows || []) as NotificationItem[]);
    } catch {
      // Keep UI functional if notifications endpoint is temporarily unavailable.
    }
  }

  async function markAsRead(id: number) {
    await api(`/notifications/${id}/read`, {
      method: "PATCH",
      headers,
    }).catch(() => null);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: 1 } : n)),
    );
  }

  useEffect(() => {
    if (!enabled) return;
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 15000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  return {
    notifications,
    notificationsOpen,
    setNotificationsOpen,
    setNotifications,
    loadNotifications,
    markAsRead,
  };
}

