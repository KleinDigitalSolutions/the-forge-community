'use client';

import { useCallback, useEffect, useState } from 'react';
import { playGtaMenuSound, primeGtaMenuSound } from '@/lib/ui-sound';

let globalUnreadCount: number | null = null;
let lastNotifyAt = 0;
let primeBound = false;

export function useUnreadMessages(pollMs = 30000, options?: { enableSound?: boolean }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const enableSound = options?.enableSound ?? false;

  const fetchUnread = useCallback(async () => {
    try {
      const response = await fetch('/api/messages/unread');
      if (!response.ok) return;
      const payload = await response.json();
      const total = Number(payload?.total ?? 0);
      const safeTotal = Number.isFinite(total) ? total : 0;
      setUnreadCount(safeTotal);

      if (enableSound && globalUnreadCount !== null && safeTotal > globalUnreadCount) {
        const now = Date.now();
        if (now - lastNotifyAt > 1500) {
          playGtaMenuSound();
          lastNotifyAt = now;
        }
      }
      globalUnreadCount = safeTotal;
    } catch (error) {
      console.error('Failed to fetch unread messages', error);
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (enableSound && !primeBound && typeof window !== 'undefined') {
      primeBound = true;
      window.addEventListener('pointerdown', primeGtaMenuSound, { once: true });
    }

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
  }, [fetchUnread, pollMs, enableSound]);

  return { unreadCount, refresh: fetchUnread };
}
