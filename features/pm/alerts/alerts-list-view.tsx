"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  RefreshCw, 
  MapPin, 
  Eye, 
  Trash2, 
  Check, 
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { getGraphQLUrl } from "@/lib/api-host";
import { getAllProjects, getAllUsers, cancelAlert } from "@/app/services/project.assistance.service";

const LIST_ATTENDANCE_ALERTS = `
  query listAttendanceAlerts(
    $page: Int!
    $size: Int!
    $status: String
    $type: String
    $fromDate: String
    $toDate: String
  ) {
    listAttendanceAlerts(
      page: $page
      size: $size
      status: $status
      type: $type
      fromDate: $fromDate
      toDate: $toDate
    ) {
      items {
        id
        type
        status
        message
        projectId
        userId
        createdAt
        latitude
        longitude
      }
      total
    }
  }
`;

const MARK_ALL_REVIEWED = `
  mutation markAllAlertsAsReviewed {
    markAllAlertsAsReviewed
  }
`;

type AlertRow = {
  id: string;
  type?: string | null;
  status?: string | null;
  message?: string | null;
  projectId?: string | null;
  userId?: string | null;
  createdAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type PeriodTab = "Hoy" | "Esta semana" | "Este mes" | "3 meses" | "6 meses" | "9 meses" | "Total";

export function AlertsListView() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activePeriod, setActivePeriod] = useState<PeriodTab>("Este mes");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getAllProjects(token).catch(() => []),
      getAllUsers(token).catch(() => []),
    ]).then(([projData, userData]) => {
      setProjects(Array.isArray(projData) ? projData : []);
      const safeUsers = Array.isArray(userData)
        ? userData
        : Array.isArray((userData as any)?.items)
        ? (userData as any).items
        : [];
      setUsers(safeUsers);
    });
  }, [token]);

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(getGraphQLUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: LIST_ATTENDANCE_ALERTS,
          variables: {
            page: 0,
            size: 50,
          },
        }),
      });

      const json = await res.json();
      const items: AlertRow[] = json?.data?.listAttendanceAlerts?.items || [];
      setAlerts(items);
    } catch {
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleDismissAlert = async (alertId: string) => {
    if (!token) return;
    try {
      await cancelAlert(token, alertId);
      await fetchAlerts();
    } catch (err) {
      console.error("Error dismissing alert:", err);
    }
  };

  const handleMarkAllAsReviewed = async () => {
    if (!token) return;
    try {
      await fetch(getGraphQLUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: MARK_ALL_REVIEWED,
        }),
      });
      await fetchAlerts();
    } catch (err) {
      console.error("Error marking all as reviewed:", err);
    }
  };

  // Filter alerts based on dropdown selections
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (selectedProject !== "all" && alert.projectId !== selectedProject) return false;
      if (selectedUser !== "all" && alert.userId !== selectedUser) return false;
      if (selectedStatus !== "all" && alert.status !== selectedStatus) return false;
      return true;
    });
  }, [alerts, selectedProject, selectedUser, selectedStatus]);

  const total = filteredAlerts.length;
  const pendientes = filteredAlerts.filter((a) => a.status === "PENDING").length;
  const revisadas = filteredAlerts.filter((a) => a.status === "REVIEWED" || a.status === "APPROVED").length;
  const porcentaje = total > 0 ? Math.round((revisadas / total) * 100) : 0;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedAlerts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAlerts.slice(start, start + pageSize);
  }, [filteredAlerts, page, pageSize]);

  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getUTCDate()).padStart(2, "0");
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const getProjectName = (projectId?: string | null) => {
    if (!projectId) return "testo6";
    const p = projects.find((proj) => proj.id === projectId);
    return p?.name || "testo6";
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-wider text-[#6366f1] dark:text-[#818cf8] uppercase mb-1">
            PANEL DE GESTIÓN · Incidentes
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Alertas de asistencia
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl">
            Monitoreo y gestión de incidentes de asistencia, ubicaciones y alertas del personal.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={handleMarkAllAsReviewed}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#5046e6] via-[#7c3aed] to-[#06b6d4] hover:opacity-95 text-white text-xs md:text-sm font-semibold flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Marcar todas como revisadas</span>
          </button>

          <NotificationBell />
        </div>
      </div>

      {/* 2. PERIOD TABS BAR & CUSTOM RANGE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
        {/* Period Selector Tabs */}
        <div className="bg-[#f3f4f8] dark:bg-[#14171f] p-1 rounded-xl flex items-center gap-1 border border-border/40 dark:border-white/5 overflow-x-auto max-w-full">
          {(["Hoy", "Esta semana", "Este mes", "3 meses", "6 meses", "9 meses", "Total"] as PeriodTab[]).map(
            (tab) => {
              const isActive = activePeriod === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActivePeriod(tab)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-[#202533] text-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              );
            }
          )}
        </div>

        {/* Custom Range & Date Badge */}
        <div className="flex items-center gap-2">
          <button className="h-9 px-3 rounded-xl border border-border/80 bg-card hover:bg-muted/50 text-foreground text-xs font-medium flex items-center gap-2 shadow-sm transition-colors cursor-pointer">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Rango personalizado</span>
          </button>
          <div className="h-9 px-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-mono font-medium flex items-center gap-2">
            <span>01/09/2026 → 03/09/2026</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN CARD CONTAINER */}
      <div className="bg-card border border-border/70 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
        {/* 4 KPI METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total alertas */}
          <div className="rounded-2xl border border-border/70 dark:border-white/5 bg-background/50 dark:bg-[#151821] p-4 flex flex-col justify-between h-[104px]">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Total alertas</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{total}</div>
          </div>

          {/* Card 2: Pendientes */}
          <div className="rounded-2xl border border-amber-500/30 dark:border-amber-500/20 bg-amber-500/[0.03] dark:bg-[#1a1713] p-4 flex flex-col justify-between h-[104px]">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Pendientes</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{pendientes}</div>
          </div>

          {/* Card 3: Revisadas */}
          <div className="rounded-2xl border border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/[0.03] dark:bg-[#131b17] p-4 flex flex-col justify-between h-[104px]">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Revisadas</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{revisadas}</div>
          </div>

          {/* Card 4: % Resueltas */}
          <div className="rounded-2xl border border-purple-500/30 dark:border-purple-500/20 bg-purple-500/[0.03] dark:bg-[#171422] p-4 flex flex-col justify-between h-[104px]">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">% Resueltas</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{porcentaje}%</div>
          </div>
        </div>

        {/* FILTERS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase mb-1.5 block">
              PROYECTO
            </label>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-border/80 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">Todos los proyectos ({Array.isArray(projects) ? projects.length : 3})</option>
              {Array.isArray(projects) && projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase mb-1.5 block">
              USUARIO
            </label>
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-border/80 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">Todos los usuarios ({Array.isArray(users) ? users.length : 5})</option>
              {Array.isArray(users) && users.map((u) => (
                <option key={u.id} value={u.id}>
                  {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase mb-1.5 block">
              ESTADO
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-border/80 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="REVIEWED">Revisado</option>
              <option value="APPROVED">Aprobado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <button
            onClick={fetchAlerts}
            className="h-10 px-4 rounded-xl border border-border/80 bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Actualizar</span>
          </button>
        </div>

        {/* TABLE (Intercalated zebra striping, without horizontal scroll) */}
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-transparent">
                <th className="py-3 px-4 text-[10px] font-mono tracking-wider text-muted-foreground uppercase font-semibold">
                  TIPO
                </th>
                <th className="py-3 px-4 text-[10px] font-mono tracking-wider text-muted-foreground uppercase font-semibold">
                  ESTADO
                </th>
                <th className="py-3 px-4 text-[10px] font-mono tracking-wider text-muted-foreground uppercase font-semibold">
                  MENSAJE
                </th>
                <th className="py-3 px-4 text-[10px] font-mono tracking-wider text-muted-foreground uppercase font-semibold">
                  PROYECTO
                </th>
                <th className="py-3 px-4 text-[10px] font-mono tracking-wider text-muted-foreground uppercase font-semibold">
                  FECHA
                </th>
                <th className="py-3 px-4 text-[10px] font-mono tracking-wider text-muted-foreground uppercase font-semibold">
                  UBICACIÓN
                </th>
                <th className="py-3 px-4 text-[10px] font-mono tracking-wider text-muted-foreground uppercase font-semibold text-right">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground text-xs">
                    Cargando alertas...
                  </td>
                </tr>
              ) : paginatedAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground text-xs">
                    No hay alertas registradas con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedAlerts.map((alert, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <tr
                      key={alert.id}
                      className={`border-b border-border/40 transition-colors ${
                        isEven ? "bg-card" : "bg-gray-50/70 dark:bg-white/[0.02]"
                      } hover:bg-muted/40`}
                    >
                      {/* TIPO */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-foreground">
                              {alert.type === "ASISTENCIA_TARDE" ? "Asistencia tarde" : alert.type || "Alerta"}
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              {alert.type || "ASISTENCIA_TARDE"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ESTADO */}
                      <td className="py-3.5 px-4">
                        {alert.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pendiente
                          </span>
                        ) : alert.status === "APPROVED" || alert.status === "REVIEWED" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Revisada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                            Cancelada
                          </span>
                        )}
                      </td>

                      {/* MENSAJE */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-muted-foreground block truncate max-w-[280px]">
                          {alert.message || "Análisis completado sin anomalías"}
                        </span>
                      </td>

                      {/* PROYECTO */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          {getProjectName(alert.projectId)}
                        </span>
                      </td>

                      {/* FECHA */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatDateDisplay(alert.createdAt)}
                        </span>
                      </td>

                      {/* UBICACIÓN */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>Condevilla Señor</span>
                        </span>
                      </td>

                      {/* ACCIONES */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/pm/alertas/${alert.id}`}>
                            <button className="h-7 px-2.5 rounded-lg border border-border/80 hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1 transition-colors cursor-pointer">
                              <Eye className="w-3 h-3 text-muted-foreground" />
                              <span>Ver</span>
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDismissAlert(alert.id)}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer"
                            title="Descartar alerta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="flex items-center justify-center gap-3 pt-2 text-xs text-muted-foreground">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 rounded-lg border border-border/80 hover:bg-muted flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="w-7 h-7 rounded-lg border border-border/80 hover:bg-muted flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <span>{total} alertas</span>
        </div>
      </div>
    </div>
  );
}
