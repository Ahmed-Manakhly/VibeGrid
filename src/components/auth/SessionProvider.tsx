'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/components/ui/toast';

export interface SafeUser {
  id: string;
  email: string;
  name?: string;
  username?: string;
  image?: string | null;
  role: string;
  isEmailVerified: boolean;
}

interface SessionContextType {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isLoggingOut: false,
  refreshSession: async () => {},
  logout: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const initialCheckRef = React.useRef(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.isAuthenticated && data.user) {
        if (!initialCheckRef.current) {
          initialCheckRef.current = true;
        }
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        if (isAuthenticated) {
          toast.error('Session expired: Logged out 🔒');
        }
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    // Firefox/Safari instant session synchronization across tabs and OAuth redirects
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vibegrid_auth_sync') {
        fetchSession();
      }
    };

    const handleCustomSync = () => {
      fetchSession();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('session_updated', handleCustomSync);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('session_updated', handleCustomSync);
    };
  }, []);

  // Window Focus Auto-Revalidation & Interceptor for 401 Unauthorized API responses
  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Silent re-check on tab focus / visibility change
    const handleFocus = () => {
      fetchSession();
    };

    window.addEventListener('focus', handleFocus);

    // 2. Global fetch interceptor to handle 401 Unauthorized during active UI sessions
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401) {
        const urlStr = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';
        // Skip auth endpoints to avoid loops
        if (!urlStr.includes('/api/auth/')) {
          // Attempt silent session refresh
          const refreshRes = await originalFetch('/api/auth/me', { cache: 'no-store' });
          const refreshData = await refreshRes.json();

          if (refreshData.success && refreshData.isAuthenticated && refreshData.user) {
            setUser(refreshData.user);
            setIsAuthenticated(true);
            // Retry the original request seamlessly!
            return originalFetch(...args);
          } else {
            setUser(null);
            setIsAuthenticated(false);
            toast.error('Session expired. Please log in again 🔒');
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          }
        }
      }

      return response;
    };

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.fetch = originalFetch;
    };
  }, [isAuthenticated]);

  const logout = async () => {
    const userName = user?.name || user?.username || 'friend';
    toast.info(`See you soon, ${userName}! 👋`);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors during logout flow
    } finally {
      // Perform clean hard browser navigation to /login
      window.location.href = '/login';
    }
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isLoggingOut: false,
        refreshSession: fetchSession,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
