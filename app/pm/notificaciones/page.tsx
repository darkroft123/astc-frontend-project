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

const PAGE_SIZE = 5;

type FilterType = "all" | "unread" | "read" | "attendance" | "justification";

export default function NotificationsPage() {
  const { user, token, hydrated } = useAuth();
  const effectiveUserId = user?.id || user?.sub || "";
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selected, setSelected] = useState<InAppNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("astc-hide-mobile-header", { detail: { hide: !!selected } }));
    }
    return () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("astc-hide-mobile-header", { detail: { hide: false } }));
      }
    };
  }, [selected]);

  useEffect(() => {
    if (token) {
      notificationService.setToken(token);
    }
  }, [token]);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!effectiveUserId) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const res = await notificationService.getNotifications(effectiveUserId, 1, 100);
      const items = res?.items || [];
      setNotifications(items);
      if (typeof window !== "undefined") {
        const idParam = new URLSearchParams(window.location.search).get("id");
        if (idParam) {
          const match = items.find((item) => item.id === idParam);
          if (match) {
            setSelected(match);
            if (!match.read) {
              notificationService.markAsRead(effectiveUserId, match.id).catch(() => {});
              setNotifications((prev) =>
                prev.map((it) => (it.id === match.id ? { ...it, read: true } : it))
              );
            }
          }
        }
      }
      const count = await notificationService.getUnreadCount(effectiveUserId);
      setUnreadCount(count || 0);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    if (hydrated) {
      if (effectiveUserId) fetchNotifications();
      else setLoading(false);
    }
  }, [hydrated, effectiveUserId, fetchNotifications]);

  useEffect(() => {
    const handleNotificationUpdate = () => {
      if (effectiveUserId) fetchNotifications(true);
    };
    window.addEventListener("astc-notification-updated", handleNotificationUpdate);
    return () =>
      window.removeEventListener("astc-notification-updated", handleNotificationUpdate);
  }, [effectiveUserId, fetchNotifications]);

  const markAllRead = async () => {
    if (!effectiveUserId) return;
    const unread = notifications.filter((n) => !n.read);
    try {
      await notificationService.markAllAsRead([effectiveUserId], unread.map((n) => n.id));
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
    if (!n.read && effectiveUserId) {
      try {
        await notificationService.markAsRead(effectiveUserId, n.id);
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
    if (!effectiveUserId) return;
    try {
      await notificationService.deleteNotification(effectiveUserId, n.id);
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

  /* ================= DETAIL VIEW ================= */
  if (selected) {
    const isAttendance =
      selected.notificationCode?.startsWith("AST00009") ||
      selected.notificationCode?.startsWith("AST00010");

    return (
      <div className="relative min-h-screen bg-transparent pb-12">
        <div className="w-full py-1 md:py-2 relative z-10 animate-in slide-in-from-bottom-3 duration-200">
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

          <div className="bg-card dark:bg-sidebar border border-border dark:border-raised border-l-2 border-l-amber rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/20 dark:bg-amber/15 dark:border-amber/25 flex items-center justify-center shrink-0">
                {isAttendance ? (
                  <Clock className="w-5 h-5 text-amber dark:text-amber" />
                ) : (
                  <FileText className="w-5 h-5 text-amber dark:text-amber" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground dark:text-white">
                    {selected.title}
                  </h2>
                  <span className="text-xs text-muted-foreground dark:text-text-5">
                    {new Date(selected.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Código: {selected.notificationCode || "N/A"}
                </p>
              </div>
            </div>

            <div className="bg-muted/40 dark:bg-surface border border-border dark:border-raised rounded-xl p-4 text-xs text-foreground/90 dark:text-text-2 leading-relaxed whitespace-pre-line">
              {selected.body}
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => handleDelete(selected)}
                className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
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
    <div className="relative min-h-screen bg-transparent pb-12">
      <div className="w-full py-1 md:py-2 space-y-3.5 relative z-10">
        {/* 1. HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight leading-tight">
              Notificaciones
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#818cf8] mt-0.5">
              {unreadCount > 0 ? `${unreadCount} sin leer` : "Al día"}
            </p>
          </div>

          {unreadCount > 0 && (
            <>
              {/* Desktop: pure text with Navigo font */}
              <button
                type="button"
                onClick={markAllRead}
                className="hidden sm:inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 hover:underline cursor-pointer transition-colors"
                style={{ fontFamily: "'Navigo', var(--font-inter), sans-serif" }}
              >
                Marcar todo como leído
              </button>

              {/* Mobile: button with icon and checkmark */}
              <button
                type="button"
                onClick={markAllRead}
                className="sm:hidden w-full h-10 px-4 rounded-xl border border-border/80 bg-raised hover:bg-surface text-foreground font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4 text-primary" />
                <span>Marcar todo como leído</span>
              </button>
            </>
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
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card dark:bg-sidebar dark:border-raised text-foreground placeholder:text-muted-foreground dark:placeholder-[#5a607f] text-sm outline-none focus:border-primary/50 transition-all shadow-xs"
          />
        </div>

        {/* 3. FILTER TABS */}
        <div className="flex flex-wrap items-center gap-2">
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
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
                  isActive
                    ? "bg-blue text-white shadow-sm font-semibold"
                    : "bg-card dark:bg-surface text-muted-foreground dark:text-text-4 border border-border dark:border-raised hover:bg-muted dark:hover:bg-raised"
                )}
              >
                <span>{label}</span>
                {count != null && count > 0 && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 dark:bg-violet/10 text-primary dark:text-[#7c9aff]"
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
        {!hydrated || loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
            <p className="text-muted-foreground font-medium text-sm">
              Cargando notificaciones...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-muted/60 dark:bg-surface flex items-center justify-center mb-3 text-muted-foreground">
              <Bell className="w-7 h-7 opacity-40" />
            </div>
            <p className="text-foreground font-semibold text-sm">
              No hay notificaciones
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {searchQuery || filter !== "all"
                ? "No se encontraron notificaciones con los filtros aplicados."
                : "Las notificaciones aparecerán aquí."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginated.map((n) => {
              const isAttendance =
                n.notificationCode?.startsWith("AST00009") ||
                n.notificationCode?.startsWith("AST00010");

              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="w-full text-left rounded-2xl border border-border dark:bg-sidebar dark:border-raised border-l-[3px] border-l-amber dark:border-l-amber px-4 py-3 relative overflow-hidden transition-all duration-200 hover:border-amber/50 hover:shadow-sm cursor-pointer flex items-center gap-4 group"
                >
                  {/* ICON BOX */}
                  <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/20 dark:bg-amber/15 dark:border-amber/25 flex items-center justify-center shrink-0">
                    {isAttendance ? (
                      <Clock className="w-5 h-5 text-amber dark:text-amber" />
                    ) : (
                      <FileText className="w-5 h-5 text-amber dark:text-amber" />
                    )}
                  </div>

                  {/* CENTER CONTENT */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-foreground dark:text-white leading-snug truncate">
                        {n.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground dark:text-text-5">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-blue shrink-0" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(n, e)}
                          title="Eliminar notificación"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground dark:text-text-4 leading-snug mt-0.5 line-clamp-1 sm:line-clamp-2">
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
          <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground dark:text-text-5">
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
