"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, AlertTriangle, FileText, Clock, UserPlus, Check, ChevronRight, X, CheckCircle2, FolderHeart, UserCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { notificationService, InAppNotification, getNotificationColor, getNotificationIcon, notifyUnreadCountChanged } from "@/lib/notification.service";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { cn } from "@/lib/utils";
import Link from "next/link";

const ICON_MAP = {
  AlertTriangle,
  FileText,
  Clock,
  UserPlus,
  Bell,
  Check,
  ChevronRight,
  X,
  CheckCircle2,
  FolderHeart,
  UserCog,
};

export function NotificationBell() {
  const { user, hydrated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (e) {
      console.error("Failed to fetch unread count", e);
    }
  }, [user?.id]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(user.id, 1, 10);
      setNotifications(res.items);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!hydrated || !user?.id) return;
    fetchUnreadCount();
    
    // Polling cada 30s pero con cache interno de 10s en el SDK
    const interval = setInterval(fetchUnreadCount, 60000);
    
    // Listen for cross-component read events
    const handleNotificationUpdate = () => {
      notificationService.invalidateUnreadCache();
      fetchUnreadCount();
      if (open) fetchNotifications();
    };
    
    window.addEventListener("astc-notification-updated", handleNotificationUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("astc-notification-updated", handleNotificationUpdate);
    };
  }, [hydrated, user?.id, fetchUnreadCount]);

  useEffect(() => {
    if (open && user?.id) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [open, user?.id, fetchNotifications, fetchUnreadCount]);

  const handleMarkAsRead = async (notification: InAppNotification) => {
    if (notification.read) return;
    try {
      await notificationService.markAsRead(user.id, notification.id);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      notifyUnreadCountChanged();
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    try {
      await notificationService.markAllAsRead([user.id], unread.map(n => n.id));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      notifyUnreadCountChanged();
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  if (!hydrated || !user) {
    return (
      <Button variant="ghost" size="icon" className="h-10 w-10" disabled>
        <Bell className="h-5 w-5 text-slate-400" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 hover:bg-accent transition-colors"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-in zoom-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 border-border shadow-xl rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Notificaciones</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-indigo-600 font-medium">{unreadCount} sin leer</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              onClick={handleMarkAllRead}
            >
              Marcar todo
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="h-[380px] w-full bg-card">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-slate-400 text-sm">Cargando...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No tienes notificaciones</p>
              <p className="text-xs text-slate-400 mt-1">
                Las notificaciones de asistencia, justificaciones y alertas aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => {
                const iconName = getNotificationIcon(n.notificationCode);
                const Icon = ICON_MAP[iconName as keyof typeof ICON_MAP] || Bell;
                const colors = getNotificationColor(n.notificationCode);
                return (
                  <DropdownMenuItem
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 p-3 transition-all relative overflow-hidden group cursor-pointer",
                      n.read ? "bg-card hover:bg-muted" : "bg-indigo-50/30 hover:bg-indigo-50/60"
                    )}
                    onClick={() => handleMarkAsRead(n)}
                    onSelect={(e) => e.preventDefault()}
                    inset
                  >
                    {/* Semantic side border indicator */}
                    {!n.read && (
                       <div className={cn("absolute left-0 top-0 bottom-0 w-1", colors.bg.replace('100', '400'))} />
                    )}
                    
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105", colors.bg)}>
                      <Icon className={cn("w-4 h-4", colors.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-tight", n.read ? "text-slate-700" : "text-slate-900 font-semibold")}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5 font-medium">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                    </div>
                    {n.actionLink && (
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 bg-muted border-t border-border">
          <Button
            variant="ghost"
            className="w-full text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100/50 justify-center font-medium"
            onClick={() => {
              setOpen(false);
              window.location.href = "/pm/notificaciones";
            }}
          >
            Ver todas las notificaciones
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
