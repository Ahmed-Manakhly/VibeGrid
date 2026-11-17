"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { HeartIcon, MessageCircleIcon, UserPlusIcon, Users, Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/shared/infrastructure/socket/RealtimeProvider";
import { markNotificationsAsRead, getNotifications } from "@/actions/notification.action";

type Notification = {
  id: string;
  type: string;
  read: boolean;
  createdAt: Date | string;
  creator: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
  post?: {
    id: string;
    content: string;
    image: string | null;
  } | null;
  comment?: {
    id: string;
    content: string;
  } | null;
  community?: {
    id: string;
    name: string;
    slug: string;
    avatarUrl: string | null;
  } | null;
};

interface NotificationsListProps {
  initialNotifications: Notification[];
  initialCursor?: string | null;
}

const getNotificationBadge = (type: string) => {
  switch (type) {
    case "LIKE":
      return (
        <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-rose-600 text-white shadow-md ring-2 ring-background flex items-center justify-center">
          <HeartIcon className="size-3 fill-current" />
        </span>
      );
    case "COMMENT":
      return (
        <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-600 text-white shadow-md ring-2 ring-background flex items-center justify-center">
          <MessageCircleIcon className="size-3 fill-current" />
        </span>
      );
    case "FOLLOW":
      return (
        <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-white shadow-md ring-2 ring-background flex items-center justify-center">
          <UserPlusIcon className="size-3 stroke-[2.5]" />
        </span>
      );
    case "COMMUNITY_JOIN":
      return (
        <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background flex items-center justify-center">
          <Users className="size-3 stroke-[2.5]" />
        </span>
      );
    default:
      return null;
  }
};

export function NotificationsList({ initialNotifications, initialCursor = null }: NotificationsListProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const { latestNotification, setUnreadCount } = useRealtime();

  // Keep realtime unread count in sync with unread notifications in state
  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length;
    setUnreadCount(unread);
  }, [notifications, setUnreadCount]);

  // Realtime notification sync: when a new notification signal arrives, fetch updated list
  useEffect(() => {
    if (!latestNotification) return;

    const syncNotifications = async () => {
      try {
        const data = await getNotifications({ limit: 20 });
        if (data.success && data.notifications) {
          setNotifications(data.notifications as Notification[]);
          setCursor(data.nextCursor || null);
        }
      } catch (error) {
        console.error("Failed to sync realtime notification", error);
      }
    };

    syncNotifications();
  }, [latestNotification]);

  const handleLoadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await getNotifications({ limit: 20, cursor });
      if (data.success && data.notifications) {
        setNotifications((prev) => [...prev, ...(data.notifications as Notification[])]);
        setCursor(data.nextCursor || null);
      }
    } catch (err) {
      console.error("Failed to load older notifications", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // 1. If unread, mark this specific notification as read in DB and update local state
    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      markNotificationsAsRead([notification.id]).catch(console.error);
    }

    // 2. Navigate to the relevant event page (/explore/[id] for vibes, /profile/[username] for follow, /communities/[slug] for community join)
    if (notification.type === "COMMUNITY_JOIN" && notification.community?.slug) {
      router.push(`/communities/${notification.community.slug}`);
    } else if (notification.type === "FOLLOW") {
      router.push(`/profile/${notification.creator.username}`);
    } else if ((notification.type === "LIKE" || notification.type === "COMMENT") && notification.post?.id) {
      router.push(`/explore/${notification.post.id}`);
    } else {
      router.push(`/profile/${notification.creator.username}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Card className="border border-border/60 bg-card/80 backdrop-blur-xl w-full rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-card/40 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold">Notifications</CardTitle>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/20 text-primary border border-primary/30">
                {unreadCount} new
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {unreadCount === 0 ? "All caught up" : `${unreadCount} unread`}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-14rem)]">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <span className="text-3xl">🔔</span>
              <p className="font-medium text-sm">No notifications yet</p>
              <p className="text-xs text-muted-foreground/80">When fellow developers like, comment, or follow, they will appear here.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-start gap-3.5 p-4 border-b border-border/40 hover:bg-accent/10 transition-all cursor-pointer relative ${
                  !notification.read 
                    ? "bg-accent/10 hover:bg-accent/15 border-l-4 border-l-primary" 
                    : "border-l-4 border-l-transparent hover:bg-muted/30"
                }`}
              >
                <div className="relative shrink-0 mt-0.5">
                  <Avatar className="size-11 ring-1 ring-border">
                    <AvatarImage src={notification.creator.image ?? "/avatar.png"} />
                  </Avatar>
                  {getNotificationBadge(notification.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-snug">
                      <span className="font-bold text-foreground hover:underline">
                        {notification.creator.name ?? notification.creator.username}
                      </span>
                      {" "}
                      <span className={!notification.read ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {notification.type === "FOLLOW"
                          ? "started following you"
                          : notification.type === "LIKE"
                          ? "liked your vibe"
                          : notification.type === "COMMUNITY_JOIN"
                          ? `joined your guild ${notification.community?.name ? `"${notification.community.name}"` : ""}`
                          : "commented on your vibe"}
                      </span>
                    </p>
                    {!notification.read && (
                      <span className="size-2.5 rounded-full bg-primary shrink-0 mt-1 ring-2 ring-background animate-pulse" />
                    )}
                  </div>

                  {notification.post && (notification.type === "LIKE" || notification.type === "COMMENT") && (
                    <div className="space-y-1.5">
                      <div className="text-xs text-muted-foreground rounded-xl p-2.5 bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors line-clamp-2">
                        <p>{notification.post.content}</p>
                      </div>
                      {notification.type === "COMMENT" && notification.comment && (
                        <div className="text-xs p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-foreground font-medium">
                          &ldquo;{notification.comment.content}&rdquo;
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground font-mono" suppressHydrationWarning>
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}

          {cursor && (
            <div className="p-4 flex justify-center border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-xs h-8 px-4 rounded-xl gap-2 font-mono"
              >
                {loadingMore && <Loader2Icon className="size-3 animate-spin" />}
                <span>{loadingMore ? "Loading more..." : "Load older notifications"}</span>
              </Button>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
