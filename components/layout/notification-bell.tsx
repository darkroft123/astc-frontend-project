"use client";
import { useState, useEffect, useCallback } from "react";
import { Bell, AlertTriangle, FileText, Clock, UserPlus, Check, ChevronRight, X, CheckCircle2, FolderHeart, UserCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
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

const DEFAULT_MOCK_NOTIFICATIONS: InAppNotification[] = [
  {
    id: "notif-1",
    notificationCode: "AST00012",
    title: "Justificación enviada",
    body: "Se ha recibido su justificación para la ausencia del día 2026-09-02. Estado: Enviado. Será revisada a la brevedad.",
    icon: null,
    color: null,
    actionLink: "/team-member/notificaciones",
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "notif-2",
    notificationCode: "AST00001",
    title: "Asistencia registrada",
    body: "Registro biométrico exitoso a las 08:00 AM para la jornada laboral.",
    icon: null,
    color: null,
    actionLink: "/team-member/asistencias",
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "notif-3",
    notificationCode: "AST00009",
    title: "Tardanza registrada",
    body: "Se registró un ingreso tardío el día 2026-09-01 a las 08:24 AM.",
    icon: null,
    color: null,
    actionLink: "/team-member/asistencias",
    read: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "notif-4",
    notificationCode: "AST00005",
    title: "Falta injustificada",
    body: "Ausencia sin registrar detectada. Puede emitir su justificación desde el panel.",
    icon: null,
    color: null,
    actionLink: "/team-member/justificar",
    read: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export function NotificationBell() {
  const { user, hydrated } = useAuth();
  const effectiveUserId = user?.id || "user-002";
  const [unreadCount, setUnreadCount] = useState(3);
  const [notifications, setNotifications] = useState<InAppNotification[]>(DEFAULT_MOCK_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount(effectiveUserId);
      if (typeof count === "number" && count >= 0) {
        setUnreadCount(count);
      }
    } catch {
      // In offline/mock mode, calculate from notifications state
      setUnreadCount((prev) => (prev > 0 ? prev : 3));
    }
  }, [effectiveUserId]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(effectiveUserId, 1, 10);
      if (res && res.items && res.items.length > 0) {
        setNotifications(res.items);
      } else {
        setNotifications(DEFAULT_MOCK_NOTIFICATIONS);
      }
    } catch {
      setNotifications(DEFAULT_MOCK_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 60000);

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
  }, [fetchUnreadCount, fetchNotifications, open]);

  useEffect(() => {
    if (open) {
      notificationService.invalidateUnreadCache();
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [open, fetchNotifications, fetchUnreadCount]);

  const handleMarkAsRead = async (notification: InAppNotification) => {
    if (notification.read) return;
    try {
      await notificationService.markAsRead(effectiveUserId, notification.id);
    } catch {
      // Offline fallback
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    notifyUnreadCountChanged();
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      await notificationService.markAllAsRead([effectiveUserId], unread.map((n) => n.id));
    } catch {
      // Offline fallback
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    notifyUnreadCountChanged();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative w-10 h-10 rounded-xl bg-gray-100/90 dark:bg-card border border-gray-200/90 dark:border-border/80 flex items-center justify-center hover:bg-gray-200/80 dark:hover:bg-raised transition-colors cursor-pointer text-gray-700 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground shadow-xs shrink-0"
          aria-label="Notificaciones"
        >
          <Bell className="w-4 h-4 text-gray-600 dark:text-muted-foreground" strokeWidth={2} />
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[18px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#080A12]">
            {unreadCount > 9 ? "9+" : unreadCount > 0 ? unreadCount : "9+"}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 border-line shadow-xl rounded-[var(--radius-card)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-inset border-b border-line">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-gradient rounded-[var(--radius-nav)] flex items-center justify-center shadow-sm">
              <Bell className="w-4 h-4 text-primary-foreground" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] text-foreground">Notificaciones</h3>
              {unreadCount > 0 && (
                <p className="text-[12.5px] text-primary font-medium">{unreadCount} sin leer</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary hover:bg-primary/10"
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
              <div className="text-text-4 text-sm">Cargando...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-12 h-12 bg-inset rounded-full flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-text-5" strokeWidth={2} />
              </div>
              <p className="text-text-2 font-medium">No tienes notificaciones</p>
              <p className="text-xs text-text-4 mt-1">
                Las notificaciones de asistencia, justificaciones y alertas aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {notifications.map((n) => {
                const iconName = getNotificationIcon(n.notificationCode);
                const Icon = ICON_MAP[iconName as keyof typeof ICON_MAP] || Bell;
                const colors = getNotificationColor(n.notificationCode);
                return (
                  <DropdownMenuItem
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 p-3 transition-all relative overflow-hidden group cursor-pointer",
                      n.read ? "bg-card hover:bg-raised" : "bg-primary/10 hover:bg-primary/15"
                    )}
                    onClick={() => handleMarkAsRead(n)}
                    onSelect={(e) => e.preventDefault()}
                    inset
                  >
                    {/* Semantic side border indicator */}
                    {!n.read && (
                      <div className={cn("absolute left-0 top-0 bottom-0 w-1", colors.bg.replace('100', '400'))} />
                    )}

                    <div className={cn("w-9 h-9 rounded-[var(--radius-nav)] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105", colors.bg)}>
                      <Icon className={cn("w-4 h-4", colors.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-tight", n.read ? "text-text-2" : "text-foreground font-semibold")}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-text-4 whitespace-nowrap mt-0.5 font-medium font-mono">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-text-3 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                    </div>
                    {n.actionLink && (
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-text-5" strokeWidth={2} />
                      </div>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 bg-inset border-t border-line">
          <Button
            variant="ghost"
            className="w-full text-sm text-primary hover:bg-primary/10 justify-center font-medium"
            onClick={() => {
              setOpen(false);
              window.location.href = "/team-member/notificaciones";
            }}
          >
            Ver todas las notificaciones
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
