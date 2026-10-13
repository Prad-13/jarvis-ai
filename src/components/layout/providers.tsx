'use client';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useJarvisStore } from '../../lib/store/jarvis-store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const setGoogleConnected = useJarvisStore((state) => state.setGoogleConnected);

  // Initialize session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setGoogleConnected(true, data.session);
          } else {
            setGoogleConnected(false, null);
          }
        }
      } catch (err) {
        console.error('Failed to sync authentication session:', err);
        setGoogleConnected(false, null);
      }
    }
    checkSession();
  }, [setGoogleConnected]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
