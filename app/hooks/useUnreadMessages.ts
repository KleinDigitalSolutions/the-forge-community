'use client';

import { useCallback, useEffect, useState } from 'react';

export function useUnreadMessages(pollMs = 30000) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const response = await fetch('/api/messages/unread');
      if (!response.ok) return;
      const payload = await response.json();
      const total = Number(payload?.total ?? 0);
      setUnreadCount(Number.isFinite(total) ? total : 0);
    } catch (error) {
      console.error('Failed to fetch unread messages', error);
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchUnread();
    };

    tick();
    interval = setInterval(tick, pollMs);

    const handleFocus = () => tick();
    window.addEventListener('focus', handleFocus);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchUnread, pollMs]);

  return { unreadCount, refresh: fetchUnread };
}
