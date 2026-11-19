'use client';

import React, { createContext, useContext } from 'react';
import { useRealtimeSocket, RealtimeState } from './useRealtimeSocket';

const RealtimeContext = createContext<ReturnType<typeof useRealtimeSocket>>({
  isConnected: false,
  onlineUsers: new Set(),
  latestNotification: null,
  latestFeedSignal: null,
  clearLatestFeedSignal: () => {},
  latestDirectMessage: null,
  latestTypingSignal: null,
  latestSeenSignal: null,
  latestBlockSignal: null,
  unreadCount: 0,
  setUnreadCount: () => {},
  unreadMessagesCount: 0,
  setUnreadMessagesCount: () => {},
  socket: null,
});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const realtimeState = useRealtimeSocket();

  return (
    <RealtimeContext.Provider value={realtimeState}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
