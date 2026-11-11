"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { HeartIcon, MessageCircleIcon, UserPlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const { latestNotification, setUnreadCount } = useRealtime();

  // Mark initial unread as read
  useEffect(() => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      markNotificationsAsRead(unreadIds).catch(console.error);
      setUnreadCount(0);
    }
  }, []);

  // Realtime notification sync
  useEffect(() => {
    if (!latestNotification) return;

    const syncNotifications = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data as Notification[]);
        const unreadIds = (data as Notification[]).filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length > 0) {
          await markNotificationsAsRead(unreadIds);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error("Failed to sync realtime notification", error);
      }
    };

    syncNotifications();
  }, [latestNotification, setUnreadCount]);

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
                className={`flex items-start gap-4 p-4 border-b hover:bg-muted/25 transition-colors ${!notification.read ? "bg-muted/50" : ""}`}
              >
                <Avatar className="mt-1">
                  <AvatarImage src={notification.creator.image ?? "/avatar.png"} />
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    <span>
                      <span className="font-medium">
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
                  </div>

                  {notification.post && (notification.type === "LIKE" || notification.type === "COMMENT") && (
                    <div className="pl-6 space-y-2">
                      <div className="text-sm text-muted-foreground rounded-md p-2 bg-muted/30 mt-2">
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
                        <div className="text-sm p-2 bg-accent/50 rounded-md">
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

