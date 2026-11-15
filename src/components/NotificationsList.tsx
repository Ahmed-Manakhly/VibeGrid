"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { HeartIcon, MessageCircleIcon, UserPlusIcon } from "lucide-react";
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
};

interface NotificationsListProps {
  initialNotifications: Notification[];
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "LIKE":
      return <HeartIcon className="size-4 text-destructive" />;
    case "COMMENT":
      return <MessageCircleIcon className="size-4 text-accent" />;
    case "FOLLOW":
      return <UserPlusIcon className="size-4 text-emerald-500" />;
    default:
      return null;
  }
};

export function NotificationsList({ initialNotifications }: NotificationsListProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
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
        const data = await getNotifications();
        if (Array.isArray(data)) {
          setNotifications(data as Notification[]);
        }
      } catch (error) {
        console.error("Failed to sync realtime notification", error);
      }
    };

    syncNotifications();
  }, [latestNotification]);

  const handleNotificationClick = async (notification: Notification) => {
    // 1. If unread, mark this specific notification as read in DB and update local state
    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      markNotificationsAsRead([notification.id]).catch(console.error);
    }

    // 2. Navigate to the relevant event page
    if (notification.type === "FOLLOW") {
      router.push(`/profile/${notification.creator.username}`);
    } else if ((notification.type === "LIKE" || notification.type === "COMMENT") && notification.post?.id) {
      router.push(`/vibes/${notification.post.id}`);
    } else {
      router.push(`/profile/${notification.creator.username}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Card className="border border-border/60 bg-card/80 backdrop-blur-xl w-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle>Notifications</CardTitle>
          <span className="text-sm text-muted-foreground">{unreadCount} unread</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No notifications yet</div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-start gap-4 p-4 border-b hover:bg-muted/25 transition-colors cursor-pointer ${!notification.read ? "bg-muted/50 font-medium" : ""}`}
              >
                <Avatar className="mt-1">
                  <AvatarImage src={notification.creator.image ?? "/avatar.png"} />
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    <span>
                      <span className="font-semibold hover:underline">
                        {notification.creator.name ?? notification.creator.username}
                      </span>
                      {" "}{
                        notification.type === "FOLLOW"
                          ? "started following you"
                          : notification.type === "LIKE"
                          ? "liked your post"
                          : "commented on your post"
                      }
                    </span>
                    {!notification.read && (
                      <span className="inline-block size-2 rounded-full bg-accent ml-auto" />
                    )}
                  </div>

                  {notification.post && (notification.type === "LIKE" || notification.type === "COMMENT") && (
                    <div className="pl-6 space-y-2">
                      <div className="text-sm text-muted-foreground rounded-md p-2 bg-muted/30 mt-2 hover:bg-muted/50 transition-colors">
                        <p>{notification.post.content}</p>
                        {notification.post.image && (
                          <img
                            src={notification.post.image}
                            alt="Post content"
                            className="mt-2 rounded-md w-full max-w-[200px] h-auto object-cover"
                          />
                        )}
                      </div>
                      {notification.type === "COMMENT" && notification.comment && (
                        <div className="text-sm p-2 bg-accent/30 rounded-md">
                          {notification.comment.content}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground pl-6" suppressHydrationWarning>
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

