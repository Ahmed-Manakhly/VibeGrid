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

export interface RealtimeState {
  isConnected: boolean;
  onlineUsers: Set<string>;
  latestNotification: NotificationSignal | null;
  latestFeedSignal: FeedSignal | null;
  latestDirectMessage: DirectMessageSignal | null;
  latestTypingSignal: TypingSignal | null;
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
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const processedNotificationIds = useRef<Set<string>>(new Set());
  const processedMessageIds = useRef<Set<string>>(new Set());

  const socketRef = useRef<Socket | null>(null);

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

        socket.on('connect', () => {
          setIsConnected(true);
          // ModelLink Parity: emit joinRoom upon connection
          try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const uid = tokenPayload.userId || tokenPayload.sub || tokenPayload.id;
            if (uid) {
              socket?.emit('joinRoom', uid);
            }
          } catch (e) {
            // Non-blocking
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

        // ModelLink Parity: 'receive_msg'
        socket.on('receive_msg', (msg: any) => {
          const directMsg: DirectMessageSignal = {
            messageId: msg.id || msg.messageId || `msg_${Date.now()}`,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            senderName: msg.senderName || msg.sender?.name || msg.sender?.username || 'Someone',
            content: msg.content,
            createdAt: msg.createdAt ? new Date(msg.createdAt).toISOString() : new Date().toISOString(),
          };

          if (directMsg.messageId && processedMessageIds.current.has(directMsg.messageId)) {
            return;
          }
          if (directMsg.messageId) {
            processedMessageIds.current.add(directMsg.messageId);
          }

          setLatestDirectMessage(directMsg);
          setUnreadMessagesCount((prev) => prev + 1);
          toast.info(`✉️ Message from ${directMsg.senderName}`);
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
    latestDirectMessage,
    latestTypingSignal,
    unreadCount,
    setUnreadCount,
    unreadMessagesCount,
    setUnreadMessagesCount,
    socket: socketRef.current,
  };
}
