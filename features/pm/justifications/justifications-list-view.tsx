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
  Calendar,
  Eye,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Folder,
  User,
  FileText,
  Loader2,
} from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { DateRangeModal, DateRange } from "@/components/ui/date-range-modal";
import {
  getAllUsers,
  getAllProjects,
  approveJustification,
  rejectJustification,
} from "@/app/services/project.assistance.service";
import { getGraphQLUrl } from "@/lib/api-host";

type Period =
  | "today"
  | "thisweek"
  | "month"
  | "3months"
  | "6months"
  | "9months"
  | "total"
  | "custom";

const PERIOD_TABS: { id: Period; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "thisweek", label: "Esta semana" },
  { id: "month", label: "Este mes" },
  { id: "3months", label: "3 meses" },
  { id: "6months", label: "6 meses" },
  { id: "9months", label: "9 meses" },
  { id: "total", label: "Total" },
];

type JustificationRow = {
  id: string;
  userId: string;
  userName: string;
  userRoleBadge?: string;
  userEmail: string;
  motivo: string;
  documentUrl?: string | null;
  fecha: string;
  estado: "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
};

const formatDateStr = (d: Date) => {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const getPeriodDates = (p: Period): { from: string; to: string } => {
  const now = new Date();
  if (p === "today") {
    const s = formatDateStr(now);
    return { from: s, to: s };
  }
  if (p === "thisweek") {
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    return { from: formatDateStr(monday), to: formatDateStr(now) };
  }
  if (p === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: formatDateStr(first), to: formatDateStr(last) };
  }
  if (p === "3months") {
    const d = new Date(now);
    d.setMonth(now.getMonth() - 3);
    return { from: formatDateStr(d), to: formatDateStr(now) };
  }
  if (p === "6months") {
    const d = new Date(now);
    d.setMonth(now.getMonth() - 6);
    return { from: formatDateStr(d), to: formatDateStr(now) };
  }
  if (p === "9months") {
    const d = new Date(now);
    d.setMonth(now.getMonth() - 9);
    return { from: formatDateStr(d), to: formatDateStr(now) };
  }
  return { from: "01/01/2026", to: formatDateStr(now) };
};

export function JustificationsListView() {
  const { token } = useAuth();
  const [activePeriod, setActivePeriod] = useState<Period>("month");
  const [data, setData] = useState<{ items: JustificationRow[]; total: number }>({
    items: [],
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const size = 5;
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(() => getPeriodDates("month"));

  useEffect(() => {
    setDateRange(getPeriodDates(activePeriod));
  }, [activePeriod]);

  const [filters, setFilters] = useState({
    project: "all",
    user: "all",
    status: "TODOS",
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [userOptions, setUserOptions] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selected_project_id");
      if (saved) setFilters((f) => ({ ...f, project: saved }));

      const handleProj = (e: Event) => {
        const customEvent = e as CustomEvent<string>;
        const newId = customEvent.detail ?? localStorage.getItem("selected_project_id") ?? "all";
        setFilters((f) => ({ ...f, project: newId }));
      };

      window.addEventListener("astc-project-changed", handleProj);
      window.addEventListener("storage", handleProj);
      return () => {
        window.removeEventListener("astc-project-changed", handleProj);
        window.removeEventListener("storage", handleProj);
      };
    }
  }, []);

  const handleProjectChange = (id: string) => {
    setFilters((p) => ({ ...p, project: id }));
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_project_id", id);
      window.dispatchEvent(new CustomEvent("astc-project-changed", { detail: id }));
    }
  };

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
        const mappedUsers = userData.map((u: any) => ({
          ...u,
          name: u.name || [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.username || "Usuario",
        }));
        setUserOptions([{ id: "all", name: `Todos los trabajadores (${mappedUsers.length})` }, ...mappedUsers]);
      }
    });
  }, [token]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const query = `
        query listJustificationsPM($page: Int!, $size: Int!, $userId: String, $status: String) {
          listJustificationsPM(page: $page, size: $size, userId: $userId, status: $status) {
            items {
              id
              userId
              description
              documentUrl
              status
              submittedAt
              absenceDate
            }
            total
          }
        }
      `;
      const res = await fetch(getGraphQLUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          variables: {
            page,
            size,
            userId: filters.user === "all" ? undefined : filters.user,
            status: filters.status === "TODOS" ? undefined : filters.status,
          },
        }),
      });
      const json = await res.json();
      const items = json?.data?.listJustificationsPM?.items || [];
      const total = json?.data?.listJustificationsPM?.total ?? items.length;
      console.log("[JustificationsList PM] fetchData received items:", items.length, "total:", total);

      if (items.length > 0) {
        setData({
          items: items.map((i: any) => {
            const usr = userOptions.find((u) => u.id === i.userId);
            const userName = usr
              ? usr.name
              : (i.user ? `${i.user.firstName || ""} ${i.user.lastName || ""}`.trim() || i.user.username : (i.userName || "Colaborador"));
            const userEmail = usr?.email || i.userEmail || "";
            const avatarUrl = usr?.avatarUrl || i.avatarUrl || null;
            return {
              id: i.id,
              userId: i.userId,
              userName,
              userRoleBadge: "Trabajador",
              userEmail,
              avatarUrl,
              motivo: i.description || "Sin descripción",
              documentUrl: i.documentUrl || null,
              fecha: i.absenceDate || (i.submittedAt ? new Date(i.submittedAt).toLocaleDateString("es-PE") : "-"),
              estado: i.status || "SUBMITTED",
            };
          }),
          total,
        });
      } else {
        setData({ items: [], total: 0 });
      }
    } catch {
      setData({ items: [], total: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [token, page, filters, userOptions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQuickApprove = async (id: string) => {
    if (!token) {
      setData((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === id ? { ...i, estado: "APPROVED" } : i)),
      }));
      return;
    }
    try {
      await approveJustification(token, id);
      await fetchData();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("astc-justification-updated"));
    } catch {
      setData((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === id ? { ...i, estado: "APPROVED" } : i)),
      }));
    }
  };

  const handleQuickReject = async (id: string) => {
    const reason = prompt("Motivo del rechazo (opcional):") || "Rechazada por el jefe de proyecto";
    if (!token) {
      setData((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === id ? { ...i, estado: "REJECTED" } : i)),
      }));
      return;
    }
    try {
      await rejectJustification(token, id, reason);
      await fetchData();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("astc-justification-updated"));
    } catch {
      setData((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === id ? { ...i, estado: "REJECTED" } : i)),
      }));
    }
  };

  const total = data.total || data.items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const pendientes = data.items.filter(
    (i) => i.estado === "SUBMITTED" || i.estado === "PENDING"
  ).length;
  const aprobadas = data.items.filter((i) => i.estado === "APPROVED").length;
  const porcentaje = total > 0 ? Math.round((aprobadas / total) * 100) : 0;

  return (
    <div className="w-full space-y-6 text-foreground font-sans bg-transparent pb-12 max-w-7xl mx-auto ">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-purple-400">
              PANEL DE GESTIÓN
            </span>
            <span className="text-xs text-muted-foreground font-sans">
              · Solicitudes del equipo
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Justificaciones
          </h1>
          <p className="font-hanken text-xs text-muted-foreground mt-1">
            Revisión, aprobación y gestión de solicitudes de justificación del equipo.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <NotificationBell />
        </div>
      </div>

      {/* 2. PERIOD SELECTOR - Desktop View (Compact inline tabs + button + badge) */}
      <div className="hidden md:flex items-center gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-card border border-border">
          {PERIOD_TABS.map((tab) => {
            const isActive = activePeriod === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePeriod(tab.id)}
                className={`py-2 px-3.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-white dark:bg-accent text-foreground border border-border font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setDateRangeModalOpen(true)}
          className="h-10 px-4 rounded-2xl bg-card border border-border text-xs font-medium text-foreground hover:text-primary flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
          title="Seleccionar rango personalizado"
        >
          <Calendar className="w-4 h-4 text-[#A855F7]" />
          <span>Rango personalizado</span>
        </button>

        <div className="h-10 px-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 flex items-center text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
          <span className="hidden">Período:</span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">
            {dateRange.from} → {dateRange.to}
          </span>
        </div>
      </div>

      {/* 2. PERIOD SELECTOR TABS (Mobile only - 2 rows matching Figma SVG) */}
      <div className="md:hidden space-y-2.5">
        <div className="p-2 sm:p-2.5 rounded-2xl bg-card dark:bg-[#0C0E18] border border-border dark:border-[#1E2335]">
          {/* Row 1: 4 tabs */}
          <div className="grid grid-cols-4 gap-1 text-center">
            {PERIOD_TABS.slice(0, 4).map((tab) => {
              const isActive = activePeriod === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePeriod(tab.id)}
                  className={`py-1.5 px-1 rounded-xl text-xs transition-all cursor-pointer truncate ${
                    isActive
                      ? "bg-white dark:bg-accent text-foreground border border-border font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground dark:hover:text-white font-medium"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Row 2: 3 tabs */}
          <div className="grid grid-cols-3 gap-1 text-center mt-1.5 max-w-[280px]">
            {PERIOD_TABS.slice(4).map((tab) => {
              const isActive = activePeriod === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePeriod(tab.id)}
                  className={`py-1.5 px-1 rounded-xl text-xs transition-all cursor-pointer truncate ${
                    isActive
                      ? "bg-white dark:bg-accent text-foreground border border-border font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground dark:hover:text-white font-medium"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. DATE RANGE SELECTOR BAR (Mobile only) */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-11 px-3.5 rounded-2xl bg-card dark:bg-[#0C0E18] border border-border dark:border-[#1E2335] flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 text-[#A855F7]" />
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{dateRange.from} → {dateRange.to}</span>
          </div>
          <button
            type="button"
            onClick={() => setDateRangeModalOpen(true)}
            className="w-11 h-11 rounded-2xl bg-card dark:bg-[#0C0E18] border border-border dark:border-[#1E2335] text-muted-foreground hover:text-foreground dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
            title="Seleccionar rango"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. UNIFIED MAIN CONTAINER ("Un cuadro entero, no 3") */}
      <div className="rounded-[22px] border border-border bg-card/60 dark:bg-[#0C0E18] p-4 sm:p-5 md:p-6 shadow-sm space-y-5 sm:space-y-6">
        {/* 4 KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {/* Card 1: Total solicitudes */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-border/60 bg-background/50 flex items-center justify-center text-muted-foreground shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Total solicitudes</p>
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

        {/* Card 3: Aprobadas */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs text-emerald-400 font-medium">Aprobadas</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{aprobadas}</p>
          </div>
        </div>

        {/* Card 4: % Aprobadas */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-xs text-purple-400 font-medium">% Aprobadas</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{porcentaje}%</p>
          </div>
        </div>
      </div>

        {/* Divider Line */}
        <div className="border-t border-border/60 -mx-4 sm:-mx-5 md:-mx-6" />

        {/* 5. FILTERS CONTAINER - Desktop View (1 Row) */}
        <div className="hidden md:grid md:grid-cols-4 gap-4 items-end pt-1">
        {/* Proyecto */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Proyecto
          </label>
          <div className="relative">
            <Folder className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
            <select
              value={filters.project}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">{p.name}</option>
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
              value={filters.user}
              onChange={(e) => setFilters((p) => ({ ...p, user: e.target.value }))}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {userOptions.map((u) => (
                <option key={u.id} value={u.id} className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">{u.name || [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.username || "Usuario"}</option>
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
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="TODOS" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Todos los estados</option>
              <option value="SUBMITTED" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Enviada</option>
              <option value="PENDING" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Pendiente</option>
              <option value="APPROVED" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Aprobada</option>
              <option value="REJECTED" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Rechazada</option>
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Action: Actualizar button */}
        <div>
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="w-full h-10 px-4 rounded-xl border border-border bg-background/50 hover:bg-background text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

        {/* 5. FILTERS CONTAINER (Mobile only) */}
        <div className="md:hidden space-y-3.5 pt-1">
        {/* Proyecto */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Proyecto
          </label>
          <div className="relative">
            <Folder className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <select
              value={filters.project}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">{p.name}</option>
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
              value={filters.user}
              onChange={(e) => setFilters((p) => ({ ...p, user: e.target.value }))}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {userOptions.map((u) => (
                <option key={u.id} value={u.id} className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">{u.name}</option>
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
                value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="TODOS" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Todos los estados</option>
                <option value="SUBMITTED" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Enviada</option>
                <option value="PENDING" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Pendiente</option>
                <option value="APPROVED" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Aprobada</option>
                <option value="REJECTED" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Rechazada</option>
              </select>
              <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={fetchData}
              disabled={isLoading}
              className="w-10 h-10 rounded-xl border border-border bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-colors"
              title="Actualizar"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 6. MOBILE CARDS VIEW (md:hidden) Matching SVG dark-justificacionjes.svg */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="text-center p-8 text-muted-foreground bg-card rounded-2xl border border-border flex items-center justify-center gap-2 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-[#A855F7]" />
            <span>Cargando justificaciones...</span>
          </div>
        ) : data.items.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground bg-card rounded-2xl border border-border">
            No hay justificaciones disponibles
          </div>
        ) : (
          data.items.map((row) => {
            const initials = row.userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            const isPending = row.estado === "SUBMITTED" || row.estado === "PENDING";

            return (
              <div key={row.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                {/* Header: Avatar, Name, Email, Status Badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 rounded-xl shrink-0 shadow-sm mt-0.5">
                      {formatAvatarUrl(row.avatarUrl) && (
                        <AvatarImage src={formatAvatarUrl(row.avatarUrl)!} alt={row.userName} className="object-cover rounded-xl" />
                      )}
                      <AvatarFallback className="rounded-xl bg-brand-gradient text-white font-bold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-base text-foreground leading-tight">{row.userName}</h4>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px] mt-0.5">
                        {row.userEmail}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${row.estado === "APPROVED" ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40" : row.estado === "REJECTED" ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40" : row.estado === "SUBMITTED" ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40" : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${row.estado === "APPROVED" ? "bg-emerald-500" : row.estado === "REJECTED" ? "bg-rose-500" : row.estado === "SUBMITTED" ? "bg-blue-500" : "bg-amber-500"}`} />
                    {row.estado === "SUBMITTED" ? "Enviada" : row.estado === "APPROVED" ? "Aprobada" : row.estado === "REJECTED" ? "Rechazada" : "Pendiente"}
                  </span>
                </div>

                {/* Motivo Box */}
                <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                    MOTIVO
                  </span>
                  <p className="text-xs text-foreground font-medium">{row.motivo}</p>
                </div>

                {/* Subgrid: Documento & Fecha */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                      DOCUMENTO
                    </span>
                    {row.documentUrl ? (
                      <a href={row.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        Ver adjunto
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin documento</span>
                    )}
                  </div>
                  <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                      FECHA
                    </span>
                    <span className="text-xs font-mono font-medium text-foreground">{row.fecha}</span>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-2 pt-1">
                  <Link href={`/pm/justificaciones/${row.id}`} className="flex-1">
                    <button
                      type="button"
                      className="w-full h-11 rounded-xl border border-border bg-background/50 hover:bg-background text-sm font-medium text-foreground flex items-center justify-center gap-2 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      Ver
                    </button>
                  </Link>

                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleQuickReject(row.id)}
                        className="w-11 h-11 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 transition-colors"
                        title="Rechazar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickApprove(row.id)}
                        className="w-11 h-11 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 transition-colors"
                        title="Aprobar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

        {/* 7. DESKTOP TABLE VIEW (hidden md:block) */}
        <div className="hidden md:block rounded-xl border border-border/80 dark:border-white/[0.08] bg-card/30 dark:bg-[#101322]/30 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/50 text-[10.5px] font-mono font-semibold text-muted-foreground tracking-wider uppercase">
                <th className="py-3.5 px-4">USUARIO</th>
                <th className="py-3.5 px-4">MOTIVO</th>
                <th className="py-3.5 px-4">DOCUMENTO</th>
                <th className="py-3.5 px-4">FECHA</th>
                <th className="py-3.5 px-4">ESTADO</th>
                <th className="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#A855F7]" />
                      <span>Cargando justificaciones...</span>
                    </div>
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm font-medium">
                    No hay justificaciones disponibles
                  </td>
                </tr>
              ) : (
                data.items.map((row) => {
                const initials = row.userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                const isPending = row.estado === "SUBMITTED" || row.estado === "PENDING";

                return (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 rounded-lg shrink-0">
                          {formatAvatarUrl(row.avatarUrl) && (
                            <AvatarImage src={formatAvatarUrl(row.avatarUrl)!} alt={row.userName} className="object-cover rounded-lg" />
                          )}
                          <AvatarFallback className="rounded-lg bg-brand-gradient text-white font-bold text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{row.userName}</p>
                          <p className="text-xs text-muted-foreground truncate">{row.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground max-w-xs truncate">{row.motivo}</td>
                    <td className="py-4 px-4">
                      {row.documentUrl ? (
                        <a href={row.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline">
                          <FileText className="w-3.5 h-3.5" />
                          Ver adjunto
                        </a>
                      ) : (
                        <span className="italic text-muted-foreground text-xs">Sin documento</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-foreground">{row.fecha}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${row.estado === "APPROVED" ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40" : row.estado === "REJECTED" ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40" : row.estado === "SUBMITTED" ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40" : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${row.estado === "APPROVED" ? "bg-emerald-500" : row.estado === "REJECTED" ? "bg-rose-500" : row.estado === "SUBMITTED" ? "bg-blue-500" : "bg-amber-500"}`} />
                        {row.estado === "SUBMITTED" ? "Enviada" : row.estado === "APPROVED" ? "Aprobada" : row.estado === "REJECTED" ? "Rechazada" : "Pendiente"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/pm/justificaciones/${row.id}`}>
                          <button
                            title="Ver detalle"
                            className="w-9 h-9 rounded-xl border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center transition-colors shadow-sm"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        </Link>
                        {isPending && (
                          <>
                            <button
                              title="Rechazar"
                              onClick={() => handleQuickReject(row.id)}
                              className="w-9 h-9 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              title="Aprobar"
                              onClick={() => handleQuickApprove(row.id)}
                              className="w-9 h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

        {/* 8. PAGINATION FOOTER */}
        <div className="flex items-center justify-between pt-1 px-1">
          <span className="text-xs text-muted-foreground font-medium">
            {total} solicitud{total === 1 ? "" : "es"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground font-medium px-1">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Modal */}
      <DateRangeModal
        open={dateRangeModalOpen}
        onOpenChange={setDateRangeModalOpen}
        initialRange={dateRange}
        onApply={(newRange: { from: string; to: string }) => setDateRange(newRange)}
      />
    </div>
  );
}
