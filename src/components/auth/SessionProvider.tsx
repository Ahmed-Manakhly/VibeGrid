'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/components/ui/toast';
import { Loader2, LogOut } from 'lucide-react';

import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.isAuthenticated && data.user) {
        if (!isAuthenticated && user === null) {
          toast.success('Session verified: Authenticated ⚡');
        } else if (user && user.id === data.user.id) {
          toast.info('Session refreshed 🔄');
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
  }, []);

  const logout = async () => {
    const userName = user?.name || user?.username || 'friend';
    toast.info(`See you soon, ${userName}! 👋`);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors during logout flow
    } finally {
      // Perform clean hard browser navigation to /login to guarantee full DOM container replacement
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
