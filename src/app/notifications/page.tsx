// 1st we create the [notification.actions] for fetching all notifications based on the current user
// and to update notifications to be read | GO THERE TO CHECK THE LOGIC

//this component is going to be client component ,and as long as this component will be fetching data doesn't mean it has to be a server component
//for loading state we will use Skeleton from shad cn ||  will use | npx shadcn@latest add skeleton
//ALSO we will use Scroll-area from shad cn ||  will use | npx shadcn@latest add scroll-area
//and we got [skeleton.tsx] + [scroll-area.tsx] in the [ui] in the [components] folder
//in the [components] folder we will create a component called [NotificationSkeleton.tsx] | GO THERE TO CHECK THE LOGIC

"use client";

export const dynamic = "force-dynamic";

import { getNotifications, markNotificationsAsRead } from "@/actions/notification.action";
import { NotificationsSkeleton } from "@/components/NotificationSkeleton";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { HeartIcon, MessageCircleIcon, UserPlusIcon, Bell } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/toast";

type Notifications = Awaited<ReturnType<typeof getNotifications>>;
type Notification = Notifications[number]; //we got the type of single notification 

const getNotificationIcon = (type: string) => { //to change the icon based on the notification type
    switch (type) {
        case "LIKE":
            return <HeartIcon className="size-4 text-red-500" />;
        case "COMMENT":
            return <MessageCircleIcon className="size-4 text-accent" />;
        case "FOLLOW":
            return <UserPlusIcon className="size-4 text-green-500" />;
        default:
            return null;
    }
};

import { useRealtime } from "@/shared/infrastructure/socket/RealtimeProvider";

function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { latestNotification, setUnreadCount } = useRealtime();

    useEffect(() => {
        const fetchNotifications = async () => {
            setIsLoading(true);
            try {
                const data = await getNotifications();
                setNotifications(data);
                const unreadIds = data.filter((n) => !n.read).map((n) => n.id);
                if (unreadIds.length > 0) {
                  await markNotificationsAsRead(unreadIds);
                  setUnreadCount(0);
                }
            } catch (error) {
                toast.error("Failed to fetch notifications");
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotifications();
    }, [setUnreadCount]);

    // Live socket notification listener
    useEffect(() => {
        if (!latestNotification) return;

        // Fetch full hydrated notifications list to preserve canonical DTO shape without duplication
        const syncNotifications = async () => {
            try {
                const data = await getNotifications();
                setNotifications(data);
                const unreadIds = data.filter((n) => !n.read).map((n) => n.id);
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
    //-------------------------------------------
    if (isLoading) return <NotificationsSkeleton />; // IF LOADING SHOW THE skeleton
    //-------------------------------------------
    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div className="space-y-6 max-w-4xl">
            <PageHeader
                eyebrow="ACTIVITY LOG"
                title="Notifications"
                subtitle="Stay updated on likes, comments, and mentions from fellow developers."
                icon={Bell}
                action={
                    unreadCount > 0 ? (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono font-medium">
                            {unreadCount} unread
                        </span>
                    ) : undefined
                }
            />

            <Card className="border border-border/60 bg-card/80 backdrop-blur-xl">
                <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle>Notifications</CardTitle>
                        <span className="text-sm text-muted-foreground"> {notifications.filter((n) => !n.read).length} unread </span>
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
                                                    notification.type === "FOLLOW"? "started following you": notification.type === "LIKE"?
                                                        "liked your post": "commented on your post"
                                                }
                                            </span>
                                        </div>
                                        {/*------------------------------------------------  */}
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
                                                {/*------------------------------------------------  */}
                                                {notification.type === "COMMENT" && notification.comment && (
                                                    <div className="text-sm p-2 bg-accent/50 rounded-md">
                                                        {notification.comment.content}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {/* ------------------------------------------------ */}
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
        </div>
    );
}
export default NotificationsPage;