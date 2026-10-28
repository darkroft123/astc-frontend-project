"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Folder,
  User,
  RotateCw,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Camera,
  Eye,
  X as XIcon,
} from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatAvatarUrl } from "@/lib/avatar-url";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DateRangeModal, DateRange } from "@/components/ui/date-range-modal";
import {
  getAllProjects,
  getMyProjects,
  getAllUsers,
  listTeamAttendance,
  exportAttendance,
} from "@/app/services/project.assistance.service";

type Period =
  | "today"
  | "thisweek"
  | "month"
  | "3months"
  | "6months"
  | "9months"
  | "total";

const PERIOD_TABS: { id: Period; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "thisweek", label: "Esta semana" },
  { id: "month", label: "Este mes" },
  { id: "3months", label: "3 meses" },
  { id: "6months", label: "6 meses" },
  { id: "9months", label: "9 meses" },
  { id: "total", label: "Total" },
];

const DEFAULT_SAMPLE_ATTENDANCE = [
  {
    id: "att-001",
    userId: "usr-carlos",
    userName: "carlos mamani",
    userEmail: "mamanigutierrezcarlos123@gmail.com",
    projectName: "Proyecto",
    date: "02/09/2026",
    checkIn: "08:52",
    checkOut: "09:07",
    status: "PRESENTE",
    statusLabel: "Asistencia",
    locationName: "Condevilla Señor",
    latitude: -12.0184,
    longitude: -77.0817,
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
  },
  {
    id: "att-002",
    userId: "usr-carlos",
    userName: "carlos mamani",
    userEmail: "mamanigutierrezcarlos123@gmail.com",
    projectName: "Proyecto",
    date: "01/09/2026",
    checkIn: "11:28",
    checkOut: "13:59",
    status: "PRESENTE",
    statusLabel: "Asistencia",
    locationName: "Condevilla Señor",
    latitude: -12.0184,
    longitude: -77.0817,
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
  },
];

const formatDateStr = (d: Date) => {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseToIso = (slashStr: string) => {
  if (!slashStr) return "";
  const parts = slashStr.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return slashStr;
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
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return { from: formatDateStr(start), to: formatDateStr(now) };
  }
  if (p === "6months") {
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return { from: formatDateStr(start), to: formatDateStr(now) };
  }
  if (p === "9months") {
    const start = new Date(now.getFullYear(), now.getMonth() - 8, 1);
    return { from: formatDateStr(start), to: formatDateStr(now) };
  }
  return { from: "01/01/2024", to: formatDateStr(now) };
};

export function AttendanceHistoryView() {
  const { token } = useAuth();
  const [activePeriod, setActivePeriod] = useState<Period>("month");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(() => getPeriodDates("month"));

  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const filteredUserOptions = useMemo(() => {
    if (selectedProjectId === "all") {
      return [{ id: "all", name: `Todos los trabajadores (${allUsers.length})` }, ...allUsers];
    }
    const proj = projects.find((p) => p.id === selectedProjectId);
    if (!proj) {
      return [{ id: "all", name: `Todos los trabajadores (${allUsers.length})` }, ...allUsers];
    }
    const memberIds = new Set<string>();
    if (proj.responsibleId) memberIds.add(String(proj.responsibleId).toLowerCase());
    if (Array.isArray(proj.members)) {
      proj.members.forEach((m: any) => {
        const uid = m.userId || m.id;
        if (uid) memberIds.add(String(uid).toLowerCase());
      });
    }
    const matched = allUsers.filter((u) => memberIds.has(String(u.id).toLowerCase()));
    return [{ id: "all", name: `Todos los trabajadores (${matched.length})` }, ...matched];
  }, [selectedProjectId, projects, allUsers]);

  const handleProjectSelect = (projId: string, broadcast = true) => {
    setSelectedProjectId(projId);
    setPage(1);
    if (broadcast && typeof window !== "undefined") {
      localStorage.setItem("selected_project_id", projId);
      window.dispatchEvent(new CustomEvent("astc-project-changed", { detail: projId }));
    }
    if (projId !== "all") {
      const proj = projects.find((p) => p.id === projId);
      if (proj) {
        const memberIds = new Set<string>();
        if (proj.responsibleId) memberIds.add(String(proj.responsibleId).toLowerCase());
        if (Array.isArray(proj.members)) {
          proj.members.forEach((m: any) => {
            const uid = m.userId || m.id;
            if (uid) memberIds.add(String(uid).toLowerCase());
          });
        }
        if (selectedUserId !== "all" && !memberIds.has(String(selectedUserId).toLowerCase())) {
          setSelectedUserId("all");
        }
      }
    }
  };
  const [records, setRecords] = useState<any[]>([]);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selected_project_id");
      if (saved) setSelectedProjectId(saved);

      const handleProj = (e: Event) => {
        const customEvent = e as CustomEvent<string>;
        const newId = customEvent.detail ?? localStorage.getItem("selected_project_id") ?? "all";
        setSelectedProjectId((current) => {
          if (current !== newId) {
            handleProjectSelect(newId, false);
            return newId;
          }
          return current;
        });
      };

      window.addEventListener("astc-project-changed", handleProj);
      window.addEventListener("storage", handleProj);
      return () => {
        window.removeEventListener("astc-project-changed", handleProj);
        window.removeEventListener("storage", handleProj);
      };
    }
  }, [projects]);

  useEffect(() => {
    if (!token) return;
    const fetchProjs = async () => {
      try {
        const list = await getAllProjects(token);
        if (Array.isArray(list) && list.length > 0) return list;
        return await getMyProjects(token);
      } catch {
        return await getMyProjects(token).catch(() => []);
      }
    };

    Promise.all([fetchProjs(), getAllUsers(token).catch(() => [])])
      .then(([pRes, uRes]) => {
        if (Array.isArray(pRes) && pRes.length > 0) {
          setProjects([{ id: "all", name: `Todos los proyectos (${pRes.length})` }, ...pRes]);
        }
        if (Array.isArray(uRes) && uRes.length > 0) {
          const mapped = uRes.map((u: any) => ({
            ...u,
            name: u.name || [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.username || "Usuario",
          }));
          setUsers([{ id: "all", name: `Todos los trabajadores (${mapped.length})` }, ...mapped]);
          setAllUsers(mapped);
        }
      })
      .catch((err) => console.error("Error loading filters data:", err));
  }, [token]);

  const loadData = useCallback(async () => {
    if (!token) {
      setRecords(DEFAULT_SAMPLE_ATTENDANCE);
      return;
    }
    setLoading(true);
    try {
      const fromIso = parseToIso(dateRange.from);
      const toIso = parseToIso(dateRange.to);
      const data = await listTeamAttendance(
        token,
        selectedProjectId === "all" ? undefined : selectedProjectId,
        selectedUserId === "all" ? undefined : selectedUserId,
        selectedStatus === "all" ? undefined : selectedStatus,
        fromIso,
        toIso
      );
      if (Array.isArray(data) && data.length > 0) {
        setRecords(data);
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [token, selectedProjectId, selectedUserId, selectedStatus, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async () => {
    if (!token) return;
    try {
      const result = await exportAttendance(token, {
        projectId: selectedProjectId === "all" ? undefined : selectedProjectId,
        userId: selectedUserId === "all" ? undefined : selectedUserId,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        fromDate: parseToIso(dateRange.from),
        toDate: parseToIso(dateRange.to),
      });
      if (result?.content) {
        let content = result.content;
        if (!content.startsWith("\uFEFF")) {
          content = "\uFEFF" + content;
        }
        if (!content.includes("sep=")) {
          content = "\uFEFFsep=;\r\n" + content.replace(/^\uFEFF/, "");
        }
        const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.fileName || "historial-asistencias.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error exporting:", err);
    }
  };


  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) {
      if (p.id && p.id !== "all") map.set(p.id, p.name);
    }
    return map;
  }, [projects]);

  const userMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const u of users) {
      if (u.id && u.id !== "all") map.set(u.id, u);
    }
    return map;
  }, [users]);

  const enrichedRecords = useMemo(() => {
    return records.map((r) => {
      const u = userMap.get(r.userId);
      const userName =
        r.userName ||
        (u
          ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || u.name
          : r.userId
          ? `Usuario (${r.userId.slice(0, 8)})`
          : "Colaborador");
      const userEmail = r.userEmail || u?.email || "";
      const avatarUrl = u?.avatarUrl || r.avatarUrl || null;
      const projectName =
        r.projectName ||
        projectMap.get(r.projectId) ||
        (r.projectId ? `Proyecto (${r.projectId.slice(0, 8)})` : "Sin proyecto");
      return {
        ...r,
        userName,
        userEmail,
        projectName,
        avatarUrl,
      };
    });
  }, [records, projectMap, userMap]);

  const PAGE_SIZE = 5;
  const totalRecords = enrichedRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return enrichedRecords.slice(start, start + PAGE_SIZE);
  }, [enrichedRecords, currentPage]);

  const total = records.length || 2;
  const presentes = records.filter((r) => r.status === "PRESENTE").length;
  const faltas = records.filter(
    (r) => r.status === "FALTA" || r.status === "TARDE" || r.status === "SALIDA_TEMPRANA"
  ).length;
  const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

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
              · Equipo
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Historial de asistencias
          </h1>
          <p className="font-hanken text-xs text-muted-foreground mt-1">
            Registro completo de ingresos, salidas y ubicaciones del equipo.
          </p>
        </div>

        {/* Desktop Header Actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExport}
            className="h-10 px-4 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <NotificationBell />
        </div>
      </div>

      {/* 2. EXPORT CSV BUTTON (Mobile only) */}
      <button
        type="button"
        onClick={handleExport}
        className="md:hidden w-full h-12 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 cursor-pointer transition-all"
      >
        <Download className="w-4 h-4" />
        Exportar CSV
      </button>

      {/* 3. PERIOD SELECTOR - Desktop View (Compact inline tabs + button + badge) */}
      <div className="hidden md:flex items-center gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-card border border-border">
          {PERIOD_TABS.map((tab) => {
            const isActive = activePeriod === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActivePeriod(tab.id); setDateRange(getPeriodDates(tab.id)); }}
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

      {/* 3. PERIOD SELECTOR TABS (Mobile only - 2 rows matching Figma SVG) */}
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
                  onClick={() => { setActivePeriod(tab.id); setDateRange(getPeriodDates(tab.id)); }}
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
                  onClick={() => { setActivePeriod(tab.id); setDateRange(getPeriodDates(tab.id)); }}
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

        {/* 4. DATE RANGE SELECTOR BAR (Mobile only) */}
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

      {/* 5. UNIFIED MAIN CONTAINER ("Un cuadro entero, no 3") */}
      <div className="rounded-[22px] border border-border bg-card/60 dark:bg-[#0C0E18] p-4 sm:p-5 md:p-6 shadow-sm space-y-5 sm:space-y-6">
        {/* 4 KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {/* Card 1: Total */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-border/60 bg-background/50 flex items-center justify-center text-muted-foreground shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Total registros</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{total}</p>
          </div>
        </div>

        {/* Card 2: Presentes */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs text-emerald-400 font-medium">Presentes</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{presentes}</p>
          </div>
        </div>

        {/* Card 3: Faltas / tardanzas */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
            <p className="text-xs text-rose-400 font-medium">Faltas / tardanzas</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{faltas}</p>
          </div>
        </div>

        {/* Card 4: % Asistencia */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-xs text-purple-400 font-medium">% Asistencia</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{porcentaje}%</p>
          </div>
        </div>
      </div>

        {/* Divider Line */}
        <div className="border-t border-border/60 -mx-4 sm:-mx-5 md:-mx-6" />

        {/* 6. FILTERS CONTAINER - Desktop View (1 Row) */}
        <div className="hidden md:grid md:grid-cols-4 gap-4 items-end pt-1">
        {/* Proyecto */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Proyecto
          </label>
          <div className="relative">
            <Folder className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectSelect(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">{p.name}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Trabajador */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Trabajador
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
            <select
              value={selectedUserId}
              onChange={(e) => { setSelectedUserId(e.target.value); setPage(1); }}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {filteredUserOptions.map((u) => (
                <option key={u.id} value={u.id} className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">{u.name || [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.username || "Usuario"}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Estado de marcado */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Estado de marcado
          </label>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Todos los estados</option>
              <option value="PRESENTE" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Presente</option>
              <option value="FALTA" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Falta</option>
              <option value="TARDE" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Tardanza</option>
              <option value="SALIDA_TEMPRANA" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Salida temprana</option>
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Action: Actualizar button */}
        <div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="w-full h-10 rounded-xl border border-border bg-background/50 hover:bg-background text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

        {/* 6. FILTERS CONTAINER (Mobile only) */}
        <div className="md:hidden space-y-3.5 pt-1">
        {/* Proyecto */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Proyecto
          </label>
          <div className="relative">
            <Folder className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectSelect(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">{p.name}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Trabajador */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Trabajador
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <select
              value={selectedUserId}
              onChange={(e) => { setSelectedUserId(e.target.value); setPage(1); }}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {filteredUserOptions.map((u) => (
                <option key={u.id} value={u.id} className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">{u.name || u.username}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Estado de marcado + Refresh */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Estado de marcado
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Todos los estados</option>
                <option value="PRESENTE" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Presente</option>
                <option value="FALTA" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Falta</option>
                <option value="TARDE" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Tardanza</option>
                <option value="SALIDA_TEMPRANA" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Salida temprana</option>
              </select>
              <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="w-10 h-10 rounded-xl border border-border bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-colors"
              title="Actualizar"
            >
              <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 7. MOBILE CARDS VIEW (md:hidden) Matching SVG dark-historial asistencia.svg */}
      <div className="space-y-3 md:hidden">
        {records.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground bg-card rounded-2xl border border-border">
            No hay registros de asistencias disponibles
          </div>
        ) : (
          paginatedRecords.map((r, idx) => {
            const initials = (r.userName || "Carlos Mamani")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            const photos = (r.photoUrl || "").split(",").map((p: string) => p.trim()).filter(Boolean);
            const checkInPhoto = photos.find((p: string) => !p.toLowerCase().includes("_checkout") && !p.toLowerCase().includes("checkout")) || null;
            const checkOutPhoto = photos.find((p: string) => p.toLowerCase().includes("_checkout") || p.toLowerCase().includes("checkout")) || null;

            return (
              <div key={r.id || idx} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                {/* Header: Avatar, Name, Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 rounded-xl shrink-0 shadow-sm">
                      {formatAvatarUrl(r.avatarUrl) && (
                        <AvatarImage src={formatAvatarUrl(r.avatarUrl)!} alt={r.userName} className="object-cover rounded-xl" />
                      )}
                      <AvatarFallback className="w-10 h-10 rounded-xl bg-brand-gradient text-white font-bold text-sm flex items-center justify-center">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-base text-foreground leading-tight">{r.userName}</h4>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {r.statusLabel || "Asistencia"}
                  </span>
                </div>

                {/* Email */}
                <p className="text-xs text-muted-foreground truncate">{r.userEmail}</p>

                {/* Project Tag & Date */}
                <div className="flex items-center justify-between">
                  <span className="inline-block bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    {r.projectName || "Proyecto"}
                  </span>
                  <span className="text-sm font-medium text-foreground">{r.date}</span>
                </div>

                {/* Times Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                      ENTRADA
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-400">{r.checkIn}</span>
                      {checkInPhoto && (
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoUrl(formatAvatarUrl(checkInPhoto))}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Ver foto</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                      SALIDA
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-medium text-amber-400">{r.checkOut || "—"}</span>
                      {r.checkOut && r.checkOut !== "—" && checkOutPhoto && (
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoUrl(formatAvatarUrl(checkOutPhoto))}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Ver foto de salida"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-500" />
                          <span>Ver foto</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location Row */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/60 hover:bg-background text-xs font-medium text-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-foreground">{r.locationName || "Condevilla Señor"}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            );
          })
        )}
      </div>

        {/* 8. DESKTOP TABLE VIEW (hidden md:block) */}
        <div className="hidden md:block rounded-xl border border-border/80 dark:border-white/[0.08] bg-card/30 dark:bg-[#101322]/30 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/50 text-[10.5px] font-mono font-semibold text-muted-foreground tracking-wider uppercase">
                <th className="py-3.5 px-4">TRABAJADOR</th>
                <th className="py-3.5 px-4">PROYECTO</th>
                <th className="py-3.5 px-4">FECHA</th>
                <th className="py-3.5 px-4">ENTRADA</th>
                <th className="py-3.5 px-4">SALIDA</th>
                <th className="py-3.5 px-4">ESTADO</th>
                <th className="py-3.5 px-4">UBICACIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm font-medium">
                    No hay registros de asistencias disponibles
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((row, idx) => {
                const initials = (row.userName || "Carlos Mamani")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                const photos = (row.photoUrl || "").split(",").map((p: string) => p.trim()).filter(Boolean);
                const checkInPhoto = photos.find((p: string) => !p.toLowerCase().includes("_checkout") && !p.toLowerCase().includes("checkout")) || null;
                const checkOutPhoto = photos.find((p: string) => p.toLowerCase().includes("_checkout") || p.toLowerCase().includes("checkout")) || null;

                return (
                  <tr key={row.id || idx} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 rounded-lg shrink-0">
                          {formatAvatarUrl(row.avatarUrl) && (
                            <AvatarImage src={formatAvatarUrl(row.avatarUrl)!} alt={row.userName} className="object-cover rounded-lg" />
                          )}
                          <AvatarFallback className="w-8 h-8 rounded-lg bg-brand-gradient text-white flex items-center justify-center font-bold text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{row.userName}</p>
                          <p className="text-xs text-muted-foreground truncate">{row.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                        {row.projectName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-foreground">{row.date}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{row.checkIn}</span>
                        {checkInPhoto && (
                          <button
                            type="button"
                            onClick={() => setSelectedPhotoUrl(formatAvatarUrl(checkInPhoto))}
                            className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Ver foto de entrada"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-400">
                      <div className="flex items-center gap-1.5">
                        <span>{row.checkOut || "—"}</span>
                        {row.checkOut && row.checkOut !== "—" && checkOutPhoto && (
                          <button
                            type="button"
                            onClick={() => setSelectedPhotoUrl(formatAvatarUrl(checkOutPhoto))}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Ver foto de salida"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {row.statusLabel || "Asistencia"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-blue-400 text-xs font-medium">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-foreground">{row.locationName}</span>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

        {/* 9. PAGINATION FOOTER */}
        <div className="flex items-center justify-between pt-1 px-1">
          <span className="text-xs text-muted-foreground font-medium">
            {enrichedRecords.length} {enrichedRecords.length === 1 ? "registro total" : "registros totales"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-40 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground font-medium px-1">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-40 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Photo Preview */}
      <Dialog open={!!selectedPhotoUrl} onOpenChange={(open) => { if (!open) setSelectedPhotoUrl(null); }}>
        <DialogContent className="max-w-md bg-card border-border p-4 rounded-2xl">
          <div className="space-y-3">
            <DialogTitle className="font-semibold text-base text-foreground">Foto de marcación</DialogTitle>
            <DialogDescription className="sr-only">Vista previa de la foto de marcación</DialogDescription>
            {selectedPhotoUrl && (
              <img
                src={selectedPhotoUrl}
                alt="Foto"
                className="w-full h-auto rounded-xl object-contain max-h-[400px] border border-border"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Date Range Modal */}
      <DateRangeModal
        open={dateRangeModalOpen}
        onOpenChange={setDateRangeModalOpen}
        initialRange={dateRange}
        onApply={(newRange: { from: string; to: string }) => {
          setDateRange(newRange);
          setActivePeriod("custom" as any);
        }}
      />
    </div>
  );
}
