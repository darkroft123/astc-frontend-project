"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  RotateCw, 
  MapPin, 
  Eye, 
  Trash2, 
  Check, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Folder,
  User,
} from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { getGraphQLUrl } from "@/lib/api-host";
import { getAllProjects, getAllUsers, cancelAlert, approveAlert } from "@/app/services/project.assistance.service";
import { DateRangeModal, DateRange } from "@/components/ui/date-range-modal";

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

type AlertRow = {
  id: string;
  type?: string | null;
  status?: string | null;
  message?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  userId?: string | null;
  userName?: string | null;
  createdAt?: string | null;
  dateStr?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
};

type PeriodTab = "Hoy" | "Esta semana" | "Este mes" | "3 meses" | "6 meses" | "9 meses" | "Total";

export function AlertsListView() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activePeriod, setActivePeriod] = useState<PeriodTab>("Este mes");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: "01/09/2026",
    to: "03/09/2026",
  });

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getAllProjects(token).catch(() => []),
      getAllUsers(token).catch(() => []),
    ]).then(([projData, userData]) => {
      if (Array.isArray(projData) && projData.length > 0) {
        setProjects([{ id: "all", name: `Todos los proyectos (${projData.length})` }, ...projData]);
      }
      if (Array.isArray(userData) && userData.length > 0) {
        setUsers([{ id: "all", name: `Todos los usuarios (${userData.length})` }, ...userData]);
      }
    });
  }, [token]);

  const fetchAlerts = useCallback(async () => {
    if (!token) {
      setAlerts([]);
      return;
    }
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
            page,
            size: 10,
            status: selectedStatus === "all" ? undefined : selectedStatus,
            projectId: selectedProject === "all" ? undefined : selectedProject,
            userId: selectedUser === "all" ? undefined : selectedUser,
          },
        }),
      });
      const json = await res.json();
      const items = json?.data?.listAttendanceAlerts?.items;
      if (Array.isArray(items) && items.length > 0) {
        setAlerts(
          items.map((i: any) => {
            const proj = projects.find((p) => p.id === i.projectId);
            const usr = users.find((u) => u.id === i.userId);
            const userName = usr
              ? `${usr.firstName || ""} ${usr.lastName || ""}`.trim() || usr.username
              : "Trabajador";
            return {
              id: i.id,
              type: i.type || "ASISTENCIA_TARDE",
              status: i.status || "PENDING",
              message: i.message || "Análisis completado sin anomalías",
              projectId: i.projectId,
              projectName: proj?.name || "Proyecto",
              userId: i.userId,
              userName,
              dateStr: i.createdAt ? new Date(i.createdAt).toLocaleDateString("es-PE") : "-",
              locationName: "Ubicación registrada",
            };
          })
        );
      } else {
        setAlerts([]);
      }
    } catch {
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, page, selectedStatus, selectedProject, selectedUser, projects, users]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleMarkAllReviewed = async () => {
    if (!token) return;
    const pendingAlerts = alerts.filter((a) => a.status === "PENDING");
    if (pendingAlerts.length === 0) return;
    try {
      await Promise.all(pendingAlerts.map((a) => approveAlert(token, a.id)));
      await fetchAlerts();
    } catch {
      await fetchAlerts();
    }
  };

  const handleDismissAlert = async (id: string) => {
    if (!token) {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      return;
    }
    try {
      await cancelAlert(token, id);
      await fetchAlerts();
    } catch {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const total = alerts.length;
  const pendientes = alerts.filter((a) => a.status === "PENDING").length;
  const revisadas = alerts.filter((a) => a.status === "REVIEWED" || a.status === "APPROVED").length;
  const porcentaje = total > 0 ? Math.round((revisadas / total) * 100) : 0;

  return (
    <div className="w-full space-y-6 text-foreground font-sans bg-transparent pb-12 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-purple-400">
              PANEL DE GESTIÓN
            </span>
            <span className="text-xs text-muted-foreground font-sans">
              · Incidentes
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Alertas de asistencia
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monitoreo y gestión de incidentes de asistencia, ubicaciones y alertas del personal.
          </p>
        </div>

        {/* Desktop Header Actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleMarkAllReviewed}
            className="h-10 px-4 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer transition-all shrink-0"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Marcar todas como revisadas</span>
          </button>
          <NotificationBell />
        </div>
      </div>

      {/* 2. MARCAR TODAS COMO REVISADAS BUTTON (Mobile only) */}
      <button
        type="button"
        onClick={handleMarkAllReviewed}
        className="md:hidden w-full h-12 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 cursor-pointer transition-all"
      >
        <Check className="w-4 h-4 stroke-[2.5]" />
        Marcar todas como revisadas
      </button>

      {/* 3. PERIOD SELECTOR - Desktop View (Compact inline tabs + button + badge) */}
      <div className="hidden md:flex items-center gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[#0C0E18] border border-[#1E2335]">
          {(["Hoy", "Esta semana", "Este mes", "3 meses", "6 meses", "9 meses", "Total"] as PeriodTab[]).map((tab) => {
            const isActive = activePeriod === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActivePeriod(tab)}
                className={`py-2 px-3.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#1E2338] text-white border border-[#2D354E] font-semibold shadow-xs"
                    : "text-[#8F96AE] hover:text-white"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setDateRangeModalOpen(true)}
          className="h-10 px-4 rounded-2xl bg-[#0C0E18] border border-[#1E2335] text-xs font-medium text-[#8F96AE] hover:text-white flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
          title="Seleccionar rango personalizado"
        >
          <Calendar className="w-4 h-4 text-[#A855F7]" />
          <span>Rango personalizado</span>
        </button>

        <div className="h-10 px-4 rounded-2xl bg-[#0C0E18] border border-[#1E2335] flex items-center gap-2 text-xs font-mono shrink-0 shadow-xs">
          <span className="text-[#8F96AE]">Período:</span>
          <span className="text-[#EEF0F6] font-semibold">
            {dateRange.from} → {dateRange.to}
          </span>
        </div>
      </div>

      {/* 3. PERIOD SELECTOR TABS (Mobile only - 2 rows matching Figma SVG) */}
      <div className="md:hidden space-y-2.5">
        <div className="p-2 sm:p-2.5 rounded-2xl bg-[#0C0E18] border border-[#1E2335]">
          {/* Row 1: 4 tabs */}
          <div className="grid grid-cols-4 gap-1 text-center">
            {(["Hoy", "Esta semana", "Este mes", "3 meses"] as PeriodTab[]).map((tab) => {
              const isActive = activePeriod === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActivePeriod(tab)}
                  className={`py-1.5 px-1 rounded-xl text-xs transition-all cursor-pointer truncate ${
                    isActive
                      ? "bg-[#1E2338] text-white border border-[#2D354E] font-semibold shadow-xs"
                      : "text-[#8F96AE] hover:text-white font-medium"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Row 2: 3 tabs */}
          <div className="grid grid-cols-3 gap-1 text-center mt-1.5 max-w-[280px]">
            {(["6 meses", "9 meses", "Total"] as PeriodTab[]).map((tab) => {
              const isActive = activePeriod === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActivePeriod(tab)}
                  className={`py-1.5 px-1 rounded-xl text-xs transition-all cursor-pointer truncate ${
                    isActive
                      ? "bg-[#1E2338] text-white border border-[#2D354E] font-semibold shadow-xs"
                      : "text-[#8F96AE] hover:text-white font-medium"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. DATE RANGE SELECTOR BAR (Mobile only) */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-11 px-3.5 rounded-2xl bg-[#0C0E18] border border-[#1E2335] flex items-center justify-center gap-2 text-xs font-mono text-[#8F96AE]">
            <Calendar className="w-3.5 h-3.5 text-[#A855F7]" />
            <span className="text-[#EEF0F6] font-semibold">{dateRange.from} → {dateRange.to}</span>
          </div>
          <button
            type="button"
            onClick={() => setDateRangeModalOpen(true)}
            className="w-11 h-11 rounded-2xl bg-[#0C0E18] border border-[#1E2335] text-[#8F96AE] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
            title="Seleccionar rango"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. 4 KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {/* Card 1: Total alertas */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-border/60 bg-background/50 flex items-center justify-center text-muted-foreground shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Total alertas</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{total}</p>
          </div>
        </div>

        {/* Card 2: Pendientes */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-xs text-amber-400 font-medium">Pendientes</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{pendientes}</p>
          </div>
        </div>

        {/* Card 3: Revisadas */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs text-emerald-400 font-medium">Revisadas</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{revisadas}</p>
          </div>
        </div>

        {/* Card 4: % Resueltas */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-xs text-purple-400 font-medium">% Resueltas</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{porcentaje}%</p>
          </div>
        </div>
      </div>

      {/* 6. FILTERS CONTAINER - Desktop View (1 Row) */}
      <div className="hidden md:grid md:grid-cols-4 gap-4 items-end rounded-2xl border border-border bg-card/60 p-4 shadow-sm">
        {/* Proyecto */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Proyecto
          </label>
          <div className="relative">
            <Folder className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">{p.name}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Usuario */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Usuario
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-card text-foreground">{u.name || u.username}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Estado
          </label>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="all" className="bg-card text-foreground">Todos los estados</option>
              <option value="PENDING" className="bg-card text-foreground">Pendiente</option>
              <option value="REVIEWED" className="bg-card text-foreground">Revisada</option>
              <option value="APPROVED" className="bg-card text-foreground">Aprobada</option>
              <option value="CANCELLED" className="bg-card text-foreground">Cancelada</option>
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Action: Actualizar button */}
        <div>
          <button
            type="button"
            onClick={fetchAlerts}
            disabled={isLoading}
            className="w-full h-10 px-4 rounded-xl border border-border bg-background/50 hover:bg-background text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* 6. FILTERS CONTAINER (Mobile only) */}
      <div className="md:hidden rounded-2xl border border-border bg-card/60 p-4 space-y-3.5 shadow-sm">
        {/* Proyecto */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Proyecto
          </label>
          <div className="relative">
            <Folder className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">{p.name}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Usuario */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Usuario
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-card text-foreground">{u.name || u.username}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Estado + Refresh */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Estado
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="all" className="bg-card text-foreground">Todos los estados</option>
                <option value="PENDING" className="bg-card text-foreground">Pendiente</option>
                <option value="REVIEWED" className="bg-card text-foreground">Revisada</option>
                <option value="APPROVED" className="bg-card text-foreground">Aprobada</option>
                <option value="CANCELLED" className="bg-card text-foreground">Cancelada</option>
              </select>
              <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={fetchAlerts}
              disabled={isLoading}
              className="w-10 h-10 rounded-xl border border-border bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-colors"
              title="Actualizar"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 7. MOBILE CARDS VIEW (md:hidden) Matching SVG dark-alertas.svg */}
      <div className="space-y-3 md:hidden">
        {alerts.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground bg-card rounded-2xl border border-border">
            No se encontraron alertas registradas.
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              {/* Header: Type icon, Type Name, Status Badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-foreground leading-tight">
                      {alert.type === "ASISTENCIA_TARDE" ? "Asistencia tarde" : alert.type || "Alerta"}
                    </h4>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground mt-0.5">
                      {alert.type || "ASISTENCIA_TARDE"}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {alert.status === "PENDING" ? "Pendiente" : alert.status === "REVIEWED" ? "Revisada" : "Aprobada"}
                </span>
              </div>

              {/* Message */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {alert.message || "Análisis completado sin anomalías"}
              </p>

              {/* Project Tag & Date */}
              <div className="flex items-center justify-between">
                <span className="inline-block bg-purple-950/60 text-purple-300 border border-purple-800/40 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {alert.projectName || "testo6"}
                </span>
                <span className="text-sm font-medium text-foreground">{alert.dateStr || "02/09/2026"}</span>
              </div>

              {/* Location Row */}
              <button
                type="button"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/60 hover:bg-background text-xs font-medium text-blue-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-foreground">{alert.locationName || "Condevilla Señor"}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Actions Row */}
              <div className="flex items-center gap-2 pt-1">
                <Link href={`/pm/alertas/${alert.id}`} className="flex-1">
                  <button
                    type="button"
                    className="w-full h-11 rounded-xl border border-border bg-background/50 hover:bg-background text-sm font-medium text-foreground flex items-center justify-center gap-2 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    Ver
                  </button>
                </Link>

                <button
                  type="button"
                  onClick={() => handleDismissAlert(alert.id)}
                  className="w-11 h-11 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 transition-colors"
                  title="Descartar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 8. DESKTOP TABLE VIEW (hidden md:block) */}
      <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/50 text-[10.5px] font-mono font-semibold text-muted-foreground tracking-wider uppercase">
                <th className="py-3.5 px-4">TIPO</th>
                <th className="py-3.5 px-4">ESTADO</th>
                <th className="py-3.5 px-4">MENSAJE</th>
                <th className="py-3.5 px-4">PROYECTO</th>
                <th className="py-3.5 px-4">FECHA</th>
                <th className="py-3.5 px-4">UBICACIÓN</th>
                <th className="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          {alert.type === "ASISTENCIA_TARDE" ? "Asistencia tarde" : alert.type || "Alerta"}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">{alert.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {alert.status === "PENDING" ? "Pendiente" : "Revisada"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground max-w-xs truncate">{alert.message}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-950/60 text-purple-300 border border-purple-800/40">
                      {alert.projectName}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-foreground">{alert.dateStr}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-blue-400 text-xs font-medium">{alert.locationName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/pm/alertas/${alert.id}`}>
                        <button
                          title="Ver detalle"
                          className="w-8 h-8 rounded-lg border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Link>
                      <button
                        title="Descartar"
                        onClick={() => handleDismissAlert(alert.id)}
                        className="w-8 h-8 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9. PAGINATION FOOTER */}
      <div className="flex items-center justify-between pt-1 px-1">
        <span className="text-xs text-muted-foreground font-medium">
          {total} alerta{total === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground font-medium px-1">
            Página 1 de 1
          </span>
          <button
            type="button"
            disabled
            className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Range Modal */}
      <DateRangeModal
        open={dateRangeModalOpen}
        onOpenChange={setDateRangeModalOpen}
        initialRange={dateRange}
        onApply={(newRange) => setDateRange(newRange)}
      />
    </div>
  );
}
