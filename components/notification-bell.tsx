"use client";

import { useState, useEffect } from "react";
import { Bell, BellDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/lib/actions/notification.actions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchNotifications = async () => {
      const [notifs, count] = await Promise.all([
        getNotifications(session.user.id, 10),
        getUnreadCount(session.user.id),
      ]);
      setNotifications(Array.isArray(notifs) ? notifs : []);
      setUnreadCount(typeof count === "number" ? count : 0);
      if (!Array.isArray(notifs)) console.error((notifs as any)?.error || "Failed to fetch notifications");
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  const handleClick = async (notif: any) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notif.link) {
      router.push(notif.link);
    }
    setShow(false);
  };

  const handleMarkAllRead = async () => {
    if (session?.user?.id) {
      await markAllAsRead(session.user.id);
      setUnreadCount(0);
      const notifs = await getNotifications(session.user.id, 10);
      setNotifications(Array.isArray(notifs) ? notifs : []);
    }
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setShow(!show)}>
        {unreadCount > 0 ? (
          <>
            <BellDot className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </>
        ) : (
          <Bell className="h-5 w-5" />
        )}
      </Button>
      
      {show && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-md border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b p-3">
            <span className="font-medium">Notifications</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`cursor-pointer p-3 hover:bg-accent ${
                      !notif.isRead ? "bg-muted/50" : ""
                    }`}
                    onClick={() => handleClick(notif)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{notif.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}