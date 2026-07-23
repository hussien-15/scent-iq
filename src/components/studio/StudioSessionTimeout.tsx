'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

const IDLE_MS = 30 * 60 * 1000;

export default function StudioSessionTimeout() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let lastReset = 0;
    const expire = () => void signOut({ callbackUrl: '/admin/login?reason=idle' });
    const reset = () => {
      const now = Date.now();
      if (now - lastReset < 15_000) return;
      lastReset = now;
      clearTimeout(timer);
      timer = setTimeout(expire, IDLE_MS);
    };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    reset();
    return () => { clearTimeout(timer); events.forEach((event) => window.removeEventListener(event, reset)); };
  }, []);
  return null;
}
