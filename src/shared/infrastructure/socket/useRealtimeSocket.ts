'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

export interface NotificationSignal {
  id: string;
  type: string;
  userId: string;
  creatorId: string;
  postId?: string;
  commentId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface FeedSignal {
  type: 'new_content' | 'post_deleted' | 'post_updated';
  postId?: string;
}

export interface PresenceSignal {
  userId: string;
  status: 'online' | 'offline';
  timestamp: number;
}

export interface RealtimeState {
  isConnected: boolean;
  onlineUsers: Set<string>;
  latestNotification: NotificationSignal | null;
  latestFeedSignal: FeedSignal | null;
}

export function useRealtimeSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [latestNotification, setLatestNotification] = useState<NotificationSignal | null>(null);
  const [latestFeedSignal, setLatestFeedSignal] = useState<FeedSignal | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Connect via relative path to gateway endpoint (or host)
    const socketUrl = process.env.NEXT_PUBLIC_REALTIME_URL || window.location.origin;

    const socket = io(socketUrl, {
      path: '/socket.io/',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('notification:new', (data: NotificationSignal) => {
      setLatestNotification(data);
      if (data.type === 'FOLLOW') {
        toast.success(`🎉 User ${data.creatorId} started following you!`);
      } else if (data.type === 'LIKE') {
        toast.success(`❤️ Someone liked your post!`);
      } else if (data.type === 'COMMENT') {
        toast.success(`💬 New comment on your post!`);
      } else {
        toast.success(`✉️ New notification received`);
      }
    });

    socket.on('feed:updated', (signal: FeedSignal) => {
      setLatestFeedSignal(signal);
      toast('⚡ New vibes available in your feed', { icon: '📰' });
    });

    socket.on('presence:online', (presence: PresenceSignal) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(presence.userId);
        return next;
      });
    });

    socket.on('presence:offline', (presence: PresenceSignal) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(presence.userId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return {
    isConnected,
    onlineUsers,
    latestNotification,
    latestFeedSignal,
    socket: socketRef.current,
  };
}
