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
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.isAuthenticated && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
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
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    const userName = user?.name || user?.username || 'friend';
    toast.info(`See you soon, ${userName}! 👋`);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors during logout flow
    } finally {
      // Execute seamless page navigation before clearing state to prevent React DOM tree divergence
      router.replace('/login');
      router.refresh();
      
      // Delay state clearing slightly until router replacement takes effect
      setTimeout(() => {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoggingOut(false);
      }, 100);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isLoggingOut,
        refreshSession: fetchSession,
        logout,
      }}
    >
      {children}

      {/* Logout Glassmorphic Transition Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4 p-8 rounded-3xl border border-accent/20 bg-card/60 shadow-2xl text-center max-w-sm w-full mx-4">
            <div className="p-4 rounded-2xl bg-accent/15 border border-accent/30 text-accent animate-pulse">
              <LogOut className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground font-display">Signing Out</h3>
              <p className="text-xs text-muted-foreground">Cleaning up session & security state...</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-accent pt-2">
              <Loader2 className="size-4 animate-spin" />
              <span>See you soon!</span>
            </div>
          </div>
        </div>
      )}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
