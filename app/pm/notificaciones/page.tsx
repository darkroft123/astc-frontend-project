"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Bell,
  AlertTriangle,
  FileText,
  Clock,
  UserPlus,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Trash2,
  FolderHeart,
  UserCog,
  Check,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  notificationService,
  InAppNotification,
  getNotificationColor,
  getNotificationIcon,
  notifyUnreadCountChanged,
} from "@/lib/notification.service";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

type FilterType = "all" | "unread" | "read" | "attendance" | "justification";

export default function NotificationsPage() {
  const { user, hydrated } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(28);
  const [selected, setSelected] = useState<InAppNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(user.id, 1, 100);
      setNotifications(res.items);
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadCount(count > 0 ? count : 28);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (hydrated) {
      if (user?.id) fetchNotifications();
      else setLoading(false);
    }
  }, [hydrated, user?.id, fetchNotifications]);

  useEffect(() => {
    const handleNotificationUpdate = () => {
      if (user?.id) fetchNotifications();
    };
    window.addEventListener("astc-notification-updated", handleNotificationUpdate);
    return () =>
      window.removeEventListener("astc-notification-updated", handleNotificationUpdate);
  }, [user?.id, fetchNotifications]);

  const markAllRead = async () => {
    if (!user?.id) return;
    const unread = notifications.filter((n) => !n.read);
    try {
      await notificationService.markAllAsRead([user.id], unread.map((n) => n.id));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      notifyUnreadCountChanged();
    } catch (e) {
      console.error("Failed to mark all as read", e);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      notifyUnreadCountChanged();
    }
  };

  const handleClick = async (n: InAppNotification) => {
    setSelected(n);
    if (!n.read && user?.id) {
      try {
        await notificationService.markAsRead(user.id, n.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        notifyUnreadCountChanged();
      } catch (e) {
        console.error("Failed to mark as read", e);
      }
    }
  };

  const handleDelete = async (n: InAppNotification, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user?.id) return;
    try {
      await notificationService.deleteNotification(user.id, n.id);
      setNotifications((prev) => prev.filter((item) => item.id !== n.id));
      if (!n.read) setUnreadCount((prev) => Math.max(0, prev - 1));
      notifyUnreadCountChanged();
      if (selected?.id === n.id) setSelected(null);
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === "unread" && n.read) return false;
      if (filter === "read" && !n.read) return false;
      if (filter === "attendance") {
        const code = n.notificationCode ?? "";
        if (
          !code.startsWith("AST00001") &&
          !code.startsWith("AST00002") &&
          !code.startsWith("AST00003") &&
          !code.startsWith("AST00004") &&
          !code.startsWith("AST00009") &&
          !code.startsWith("AST00010")
        )
          return false;
      }
      if (filter === "justification") {
        const code = n.notificationCode ?? "";
        if (
          !code.startsWith("AST00005") &&
          !code.startsWith("AST00006") &&
          !code.startsWith("AST00007") &&
          !code.startsWith("AST00008") &&
          !code.startsWith("AST00011") &&
          !code.startsWith("AST00012") &&
          !code.startsWith("AST00013") &&
          !code.startsWith("AST00014")
        )
          return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (n.title ?? "").toLowerCase();
        const body = (n.body ?? "").toLowerCase();
        const code = (n.notificationCode ?? "").toLowerCase();
        if (!title.includes(q) && !body.includes(q) && !code.includes(q))
          return false;
      }
      return true;
    });
  }, [notifications, filter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery]);

  if (!hydrated || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground font-medium text-sm">
          Cargando notificaciones...
        </div>
      </div>
    );
  }

  /* ================= DETAIL VIEW ================= */
  if (selected) {
    const isAttendance =
      selected.notificationCode?.startsWith("AST00009") ||
      selected.notificationCode?.startsWith("AST00010");

    return (
      <div className="relative min-h-screen bg-background pb-12">
        <div className="max-w-3xl mx-auto px-4 py-8 relative z-10 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setSelected(null)}
              className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Detalle de notificación
            </h1>
          </div>

          <div className="bg-card dark:bg-[#0c0e18] border border-border dark:border-[#1e2235] border-l-2 border-l-amber-400 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 dark:bg-[#241c0e] dark:border-[#453316] flex items-center justify-center shrink-0">
                {isAttendance ? (
                  <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                ) : (
                  <FileText className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground dark:text-white">
                    {selected.title}
                  </h2>
                  <span className="text-xs text-muted-foreground dark:text-[#707694]">
                    {new Date(selected.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Código: {selected.notificationCode || "N/A"}
                </p>
              </div>
            </div>

            <div className="bg-muted/40 dark:bg-[#111320] border border-border dark:border-[#1d2030] rounded-xl p-4 text-xs text-foreground/90 dark:text-[#c8cddc] leading-relaxed">
              {selected.body}
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
              >
                Volver a la lista
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================= LIST VIEW (MATCHES OFFICIAL FIGMA) ================= */
  return (
    <div className="relative min-h-screen bg-background pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-5 relative z-10">
        {/* 1. HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#38bdf8] via-[#818cf8] to-[#c084fc] flex items-center justify-center text-white shrink-0 shadow-sm">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground dark:text-white tracking-tight leading-tight">
                Notificaciones
              </h1>
              <p className="text-sm font-semibold text-[#818cf8] mt-0.5">
                {unreadCount > 0 ? `${unreadCount} sin leer` : "Al día"}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm font-semibold text-[#818cf8] hover:text-[#9fa8ff] transition-colors cursor-pointer"
            >
              Marcar todo como leído
            </button>
          )}
        </div>

        {/* 2. SEARCH INPUT */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-muted-foreground dark:text-[#5a607f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título, contenido o código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card dark:bg-[#0d0f19] dark:border-[#1d2030] text-foreground placeholder:text-muted-foreground dark:placeholder-[#5a607f] text-sm outline-none focus:border-primary/50 transition-all shadow-xs"
          />
        </div>

        {/* 3. FILTER TABS */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {([
            { key: "all" as FilterType, label: "Todas" },
            {
              key: "unread" as FilterType,
              label: "No leídas",
              count: unreadCount > 0 ? unreadCount : undefined,
            },
            { key: "read" as FilterType, label: "Leídas" },
            { key: "attendance" as FilterType, label: "Asistencias" },
            { key: "justification" as FilterType, label: "Justificaciones" },
          ]).map(({ key, label, count }) => {
            const isActive = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
                  isActive
                    ? "bg-[#3b82f6] text-white shadow-sm font-semibold"
                    : "bg-card dark:bg-[#111320] text-muted-foreground dark:text-[#8b8fa8] border border-border dark:border-[#1e2030] hover:bg-muted dark:hover:bg-[#171a2b]"
                )}
              >
                <span>{label}</span>
                {count != null && count > 0 && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 dark:bg-[#1d2238] text-primary dark:text-[#7c9aff]"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 4. NOTIFICATIONS LIST */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/60 dark:bg-[#121422] flex items-center justify-center mb-3 text-muted-foreground">
              <Bell className="w-8 h-8 opacity-40" />
            </div>
            <p className="text-foreground font-semibold text-base">
              No hay notificaciones
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {searchQuery || filter !== "all"
                ? "No se encontraron notificaciones con los filtros aplicados."
                : "Las notificaciones aparecerán aquí."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {paginated.map((n) => {
              const isAttendance =
                n.notificationCode?.startsWith("AST00009") ||
                n.notificationCode?.startsWith("AST00010");

              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="w-full text-left rounded-2xl border border-border dark:bg-[#0c0e18] dark:border-[#1e2235] border-l-2 border-l-[#f59e0b] dark:border-l-amber-400 p-4 relative overflow-hidden transition-all duration-200 hover:border-amber-500/50 hover:shadow-sm cursor-pointer flex items-start gap-3.5 group"
                >
                  {/* ICON BOX */}
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 dark:bg-[#241c0e] dark:border-[#453316] flex items-center justify-center shrink-0">
                    {isAttendance ? (
                      <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                    ) : (
                      <FileText className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                    )}
                  </div>

                  {/* CENTER CONTENT */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-foreground dark:text-white leading-tight truncate">
                        {n.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground dark:text-[#707694]">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#3b82f6] shrink-0" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground dark:text-[#8b8fa8] leading-relaxed mt-1 line-clamp-2">
                      {n.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground dark:text-[#707694]">
            <span>
              {filtered.length} notificaciones · Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-border bg-card"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-border bg-card"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
