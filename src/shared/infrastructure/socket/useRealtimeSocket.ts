'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from '@/components/ui/toast';
import { EnvConfigRepository } from '@/modules/config/infrastructure/EnvConfigRepository';

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
  authorId?: string;
  communityId?: string;
  timestamp?: number;
}

export interface PresenceSignal {
  userId: string;
  status: 'online' | 'offline';
  timestamp: number;
}

export interface DirectMessageSignal {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
}

export interface TypingSignal {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface MessageSeenSignal {
  conversationId: string;
  seenByUserId: string;
  seenAt: string;
}

export interface BlockSignal {
  blockerUserId: string;
  blockedUserId: string;
  timestamp: number;
}

export interface RealtimeState {
  isConnected: boolean;
  onlineUsers: Set<string>;
  latestNotification: NotificationSignal | null;
  latestFeedSignal: FeedSignal | null;
  clearLatestFeedSignal: () => void;
  latestDirectMessage: DirectMessageSignal | null;
  latestTypingSignal: TypingSignal | null;
  latestSeenSignal: MessageSeenSignal | null;
  latestBlockSignal: { action: 'blocked' | 'unblocked'; data: BlockSignal } | null;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  unreadMessagesCount: number;
  setUnreadMessagesCount: React.Dispatch<React.SetStateAction<number>>;
  socket: Socket | null;
}

export function useRealtimeSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [latestNotification, setLatestNotification] = useState<NotificationSignal | null>(null);
  const [latestFeedSignal, setLatestFeedSignal] = useState<FeedSignal | null>(null);
  const [latestDirectMessage, setLatestDirectMessage] = useState<DirectMessageSignal | null>(null);
  const [latestTypingSignal, setLatestTypingSignal] = useState<TypingSignal | null>(null);
  const [latestSeenSignal, setLatestSeenSignal] = useState<MessageSeenSignal | null>(null);
  const [latestBlockSignal, setLatestBlockSignal] = useState<{ action: 'blocked' | 'unblocked'; data: BlockSignal } | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const processedNotificationIds = useRef<Set<string>>(new Set());
  const processedMessageIds = useRef<Set<string>>(new Set());

  const socketRef = useRef<Socket | null>(null);

  const clearLatestFeedSignal = useCallback(() => {
    setLatestFeedSignal(null);
  }, []);

  // Fetch initial unread notification & messages count on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    async function fetchUnread() {
      try {
        const [notifRes, convRes] = await Promise.all([
          fetch('/api/notifications'),
          fetch('/api/messages/conversations'),
        ]);

        if (notifRes.ok) {
          const data = await notifRes.json();
          if (Array.isArray(data)) {
            const count = data.filter((n: any) => !n.read).length;
            setUnreadCount(count);
          }
        }

        if (convRes.ok) {
          const convData = await convRes.json();
          if (convData.success && Array.isArray(convData.conversations)) {
            const totalUnread = convData.conversations.reduce(
              (acc: number, c: any) => acc + (c.unreadCount || 0),
              0
            );
            setUnreadMessagesCount(totalUnread);
          }
        }
      } catch (e) {
        // Silent catch
      }
    }
    fetchUnread();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let socket: Socket | null = null;
    let isCancelled = false;

    async function initSocket() {
      try {
        // Fetch valid JWT token from BFF auth endpoint
        let token: string | undefined;
        try {
          const tokenRes = await fetch('/api/auth/token');
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            if (tokenData.success && tokenData.token) {
              token = tokenData.token;
            }
          }
        } catch (e) {
          // Token fetch error
        }

        if (isCancelled) return;

        // If no auth token (unauthenticated user), do not connect
        if (!token) {
          return;
        }

        // Resolve realtime gateway URL strictly via EnvConfigRepository SSOT
        const { realtimeUrl } = EnvConfigRepository.getEndpoints();

        socket = io(realtimeUrl, {
          path: '/socket.io/',
          auth: { token },
          query: { token },
          withCredentials: true,
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        // Resolve current user ID from JWT token payload
        let currentUserId: string | null = null;
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          currentUserId = tokenPayload.userId || tokenPayload.sub || tokenPayload.id || null;
        } catch (e) {
          // Non-blocking
        }

        socket.on('connect', () => {
          setIsConnected(true);
          // ModelLink Parity: emit joinRoom upon connection
          if (currentUserId) {
            socket?.emit('joinRoom', currentUserId);
          }
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
        });

        // ModelLink Parity: 'get-users' active presence list
        socket.on('get-users', (users: Array<{ userId: string; socketId: string }>) => {
          if (Array.isArray(users)) {
            setOnlineUsers(new Set(users.map((u) => u.userId)));
          }
        });

        socket.on('notification:new', (data: NotificationSignal) => {
          // Deduplicate by ID
          if (data.id && processedNotificationIds.current.has(data.id)) {
            return;
          }
          if (data.id) {
            processedNotificationIds.current.add(data.id);
          }

          setLatestNotification(data);
          if (!data.isRead) {
            setUnreadCount((prev) => prev + 1);
          }

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
          // Filter out author's own created vibes: the author already sees their vibe immediately
          if (signal.authorId && currentUserId && signal.authorId === currentUserId) {
            return;
          }
          setLatestFeedSignal(signal);
          toast.info('⚡ New vibes available in your feed');
        });

        socket.on('message:new', (signal: DirectMessageSignal) => {
          if (signal.messageId && processedMessageIds.current.has(signal.messageId)) {
            return;
          }
          if (signal.messageId) {
            processedMessageIds.current.add(signal.messageId);
          }

          setLatestDirectMessage(signal);
          setUnreadMessagesCount((prev) => prev + 1);
          toast.info(`✉️ Message from ${signal.senderName || 'someone'}`);
        });

        socket.on('chat:typing', (typing: TypingSignal) => {
          setLatestTypingSignal(typing);
        });

        socket.on('message:seen', (seenData: MessageSeenSignal) => {
          setLatestSeenSignal(seenData);
        });

        socket.on('user:blocked', (blockData: BlockSignal) => {
          setLatestBlockSignal({ action: 'blocked', data: blockData });
        });

        socket.on('user:unblocked', (unblockData: BlockSignal) => {
          setLatestBlockSignal({ action: 'unblocked', data: unblockData });
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
      } catch (err) {
        // Init error
      }
    }

    initSocket();

    return () => {
      isCancelled = true;
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, []);

  return {
    isConnected,
    onlineUsers,
    latestNotification,
    latestFeedSignal,
    clearLatestFeedSignal,
    latestDirectMessage,
    latestTypingSignal,
    latestSeenSignal,
    latestBlockSignal,
    unreadCount,
    setUnreadCount,
    unreadMessagesCount,
    setUnreadMessagesCount,
    socket: socketRef.current,
  };
}
