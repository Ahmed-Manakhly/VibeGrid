import { getNotifications } from "@/actions/notification.action";
import { PageHeader } from "@/components/PageHeader";
import { NotificationsList } from "@/components/NotificationsList";
import { Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 w-full">
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

      <NotificationsList initialNotifications={notifications} />
    </div>
  );
}
