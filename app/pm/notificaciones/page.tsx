"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, AlertTriangle, FileText, Clock, UserPlus, CheckCircle2, XCircle, ArrowLeft, Trash2, FolderHeart, UserCog, Check, Search } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { notificationService, InAppNotification, getNotificationColor, getNotificationIcon, notifyUnreadCountChanged } from "@/lib/notification.service";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, any> = {
  AlertTriangle, FileText, Clock, UserPlus, Bell, CheckCircle2, XCircle, FolderHeart, UserCog, Check,
};

const PAGE_SIZE = 10;

type FilterType = "all" | "unread" | "read" | "attendance" | "justification";

export default function NotificationsPage() {
  const { user, hydrated } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
      setUnreadCount(count);
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
    const handleNotificationUpdate = () => { if (user?.id) fetchNotifications(); };
    window.addEventListener("astc-notification-updated", handleNotificationUpdate);
    return () => window.removeEventListener("astc-notification-updated", handleNotificationUpdate);
  }, [user?.id, fetchNotifications]);

  const markAllRead = async () => {
    if (!user?.id) return;
    const unread = notifications.filter(n => !n.read);
    try {
      await notificationService.markAllAsRead([user.id], unread.map(n => n.id));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      notifyUnreadCountChanged();
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const handleClick = async (n: InAppNotification) => {
    setSelected(n);
    if (!n.read && user?.id) {
      try {
        await notificationService.markAsRead(user.id, n.id);
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
        setUnreadCount(prev => Math.max(0, prev - 1));
        notifyUnreadCountChanged();
      } catch (e) {
        console.error("Failed to mark as read", e);
      }
    }
  };

  const handleDelete = async (n: InAppNotification, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user?.id) return;
    const confirmed = window.confirm(`¿Eliminar "${n.title}"?`);
    if (!confirmed) return;
    try {
      await notificationService.deleteNotification(user.id, n.id);
      setNotifications(prev => prev.filter(item => item.id !== n.id));
      if (n.read === false) setUnreadCount(prev => Math.max(0, prev - 1));
      notifyUnreadCountChanged();
      if (selected?.id === n.id) setSelected(null);
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (filter === "unread" && n.read) return false;
      if (filter === "read" && !n.read) return false;
      if (filter === "attendance") {
        const code = n.notificationCode ?? "";
        if (!code.startsWith("AST00001") && !code.startsWith("AST00002") && !code.startsWith("AST00003") && !code.startsWith("AST00004") && !code.startsWith("AST00009") && !code.startsWith("AST00010")) return false;
      }
      if (filter === "justification") {
        const code = n.notificationCode ?? "";
        if (!code.startsWith("AST00005") && !code.startsWith("AST00006") && !code.startsWith("AST00007") && !code.startsWith("AST00008") && !code.startsWith("AST00011") && !code.startsWith("AST00012") && !code.startsWith("AST00013") && !code.startsWith("AST00014")) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (n.title ?? "").toLowerCase();
        const body = (n.body ?? "").toLowerCase();
        const code = (n.notificationCode ?? "").toLowerCase();
        if (!title.includes(q) && !body.includes(q) && !code.includes(q)) return false;
      }
      return true;
    });
  }, [notifications, filter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filter, searchQuery]);

  if (!hydrated || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground font-medium">Cargando notificaciones...</div>
      </div>
    );
  }

  if (selected) {
    const iconName = getNotificationIcon(selected.notificationCode);
    const Icon = ICON_MAP[iconName] || Bell;
    const colors = getNotificationColor(selected.notificationCode);
    const link = selected.actionLink || "/pm";

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="hover:bg-accent">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Detalle de Notificación</h1>
          </div>
          <Card className={cn("border-border shadow-md rounded-2xl overflow-hidden relative")}>
            <div className={cn("absolute top-0 left-0 w-full h-1 bg-gradient-to-r", colors.gradient)} />
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", colors.bg)}>
                  <Icon className={cn("w-7 h-7", colors.text)} />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-xs text-muted-foreground font-mono tracking-wider uppercase mb-1">{selected.notificationCode || "N/A"}</p>
                  <h2 className="text-xl font-bold text-foreground leading-tight">{selected.title}</h2>
                  <p className="text-sm text-muted-foreground mt-2 font-medium">{new Date(selected.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-muted/50 border border-border rounded-xl p-5 mb-6 shadow-inner">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{selected.body}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-border text-muted-foreground hover:bg-accent font-medium h-11" onClick={() => setSelected(null)}>
                  Volver a la lista
                </Button>
                <Link href={link} className="flex-1">
                  <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all font-medium">
                    Ver más detalles
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-md">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Notificaciones</h1>
              {unreadCount > 0 ? (
                <p className="text-sm text-blue-600 font-medium mt-0.5">{unreadCount} sin leer</p>
              ) : (
                <p className="text-sm text-muted-foreground font-medium mt-0.5">Estás al día</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 font-medium">
              Marcar todo como leído
            </Button>
          )}
        </div>

        {/* SEARCH */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, contenido o código..."
            className="h-10 pl-9 text-sm rounded-xl border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* FILTER CHIPS */}
        <div className="flex flex-wrap gap-2 mb-5">
          {([
            { key: "all" as FilterType, label: "Todas" },
            { key: "unread" as FilterType, label: "No leídas", count: unreadCount > 0 ? unreadCount : undefined },
            { key: "read" as FilterType, label: "Leídas" },
            { key: "attendance" as FilterType, label: "Asistencias" },
            { key: "justification" as FilterType, label: "Justificaciones" },
          ]).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                filter === key
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-accent"
              )}
            >
              {label}
              {count != null && count > 0 && (
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", filter === key ? "bg-white/20" : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300")}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* LIST */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-5">
              <Bell className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <p className="text-foreground font-semibold text-lg">No hay notificaciones</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              {searchQuery || filter !== "all" ? "No se encontraron notificaciones con los filtros aplicados" : "Las notificaciones aparecerán aquí"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 animate-in fade-in duration-500">
              {paginated.map((n) => {
                const iconName = getNotificationIcon(n.notificationCode);
                const Icon = ICON_MAP[iconName] || Bell;
                const colors = getNotificationColor(n.notificationCode);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "w-full text-left rounded-2xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-md relative overflow-hidden group",
                      n.read ? "bg-card border-border shadow-sm" : "bg-blue-50/40 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/50 shadow"
                    )}
                  >
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 transition-colors", n.read ? colors.bg.replace('100', '300') : colors.bg.replace('100', '500'))} />
                    <div className="p-5 pl-7 flex items-start gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105", colors.bg)}>
                        <Icon className={cn("w-6 h-6", colors.text)} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-3">
                          <p className={cn("text-base leading-snug", n.read ? "text-muted-foreground" : "text-foreground font-bold")}>{n.title}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap mt-1 font-medium bg-muted px-2 py-0.5 rounded-md border border-border">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{n.body}</p>
                      </div>
                      {!n.read && (
                        <div className="shrink-0 flex items-center justify-center w-6 h-full absolute right-4 top-0 bottom-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        </div>
                      )}
                      <button
                        onClick={(e) => handleDelete(n, e)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-muted-foreground hover:text-red-500 absolute right-4 bottom-4"
                        title="Eliminar notificación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 bg-card border border-border rounded-xl px-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-border"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground font-medium">
                  Página {currentPage} de {totalPages} ({filtered.length} notificaciones)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-border"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
