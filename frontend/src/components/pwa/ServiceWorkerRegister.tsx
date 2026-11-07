'use client';

import { useEffect } from 'react';

const SW_URL = '/sw.js';

/** Renders nothing: registers the service worker (installable app, offline page) in production builds. */
export const ServiceWorkerRegister = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    // A failed registration only means no offline page; the site works the same
    navigator.serviceWorker.register(SW_URL, { scope: '/' }).catch(() => undefined);
  }, []);
  return null;
};
