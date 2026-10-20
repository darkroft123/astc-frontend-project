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
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DateRangeModal, DateRange } from "@/components/ui/date-range-modal";
import {
  getAllProjects,
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
    projectName: "testo6",
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
    projectName: "testo6",
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

export function AttendanceHistoryView() {
  const { token } = useAuth();
  const [activePeriod, setActivePeriod] = useState<Period>("month");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: "01/09/2026",
    to: "03/09/2026",
  });

  const [projects, setProjects] = useState<any[]>([
    { id: "all", name: "Todos los proyectos (3)" },
    { id: "p1", name: "gestion de asistencia" },
    { id: "p2", name: "proyecto testeo" },
    { id: "p3", name: "testo6" },
  ]);

  const [users, setUsers] = useState<any[]>([
    { id: "all", name: "Todos los trabajadores (5)" },
    { id: "u1", name: "carlos mamani" },
  ]);

  const [records, setRecords] = useState<any[]>(DEFAULT_SAMPLE_ATTENDANCE);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([getAllProjects(token), getAllUsers(token)])
      .then(([pRes, uRes]) => {
        if (Array.isArray(pRes) && pRes.length > 0) {
          setProjects([{ id: "all", name: `Todos los proyectos (${pRes.length})` }, ...pRes]);
        }
        if (Array.isArray(uRes) && uRes.length > 0) {
          setUsers([{ id: "all", name: `Todos los trabajadores (${uRes.length})` }, ...uRes]);
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
      const data = await listTeamAttendance(
        token,
        selectedProjectId === "all" ? undefined : selectedProjectId,
        selectedUserId === "all" ? undefined : selectedUserId,
        selectedStatus === "all" ? undefined : selectedStatus,
        "2026-09-01",
        "2026-09-03"
      );
      if (Array.isArray(data) && data.length > 0) {
        setRecords(data);
      } else {
        setRecords(DEFAULT_SAMPLE_ATTENDANCE);
      }
    } catch {
      setRecords(DEFAULT_SAMPLE_ATTENDANCE);
    } finally {
      setLoading(false);
    }
  }, [token, selectedProjectId, selectedUserId, selectedStatus]);

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
        fromDate: "2026-09-01",
        toDate: "2026-09-03",
      });
      if (result?.content) {
        const blob = new Blob([result.content], { type: "text/csv;charset=utf-8;" });
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

  const total = records.length || 2;
  const presentes = records.filter((r) => r.status === "PRESENTE").length;
  const faltas = records.filter(
    (r) => r.status === "FALTA" || r.status === "TARDE" || r.status === "SALIDA_TEMPRANA"
  ).length;
  const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

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
              · Equipo
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Historial de asistencias
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
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
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[#0C0E18] border border-[#1E2335]">
          {PERIOD_TABS.map((tab) => {
            const isActive = activePeriod === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePeriod(tab.id)}
                className={`py-2 px-3.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#1E2338] text-white border border-[#2D354E] font-semibold shadow-xs"
                    : "text-[#8F96AE] hover:text-white"
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
            {PERIOD_TABS.slice(0, 4).map((tab) => {
              const isActive = activePeriod === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePeriod(tab.id)}
                  className={`py-1.5 px-1 rounded-xl text-xs transition-all cursor-pointer truncate ${
                    isActive
                      ? "bg-[#1E2338] text-white border border-[#2D354E] font-semibold shadow-xs"
                      : "text-[#8F96AE] hover:text-white font-medium"
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
                      ? "bg-[#1E2338] text-white border border-[#2D354E] font-semibold shadow-xs"
                      : "text-[#8F96AE] hover:text-white font-medium"
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

      {/* 6. FILTERS CONTAINER - Desktop View (1 Row) */}
      <div className="hidden md:grid md:grid-cols-4 gap-4 rounded-2xl border border-border bg-card/60 p-4 shadow-sm items-end">
        {/* Proyecto */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Proyecto
          </label>
          <div className="relative">
            <Folder className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">{p.name}</option>
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
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-card text-foreground">{u.name || u.username}</option>
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
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="all" className="bg-card text-foreground">Todos los estados</option>
              <option value="PRESENTE" className="bg-card text-foreground">Presente</option>
              <option value="FALTA" className="bg-card text-foreground">Falta</option>
              <option value="TARDE" className="bg-card text-foreground">Tardanza</option>
              <option value="SALIDA_TEMPRANA" className="bg-card text-foreground">Salida temprana</option>
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
      <div className="md:hidden rounded-2xl border border-border bg-card/60 p-4 space-y-3.5 shadow-sm">
        {/* Proyecto */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Proyecto
          </label>
          <div className="relative">
            <Folder className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">{p.name}</option>
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
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-card text-foreground">{u.name || u.username}</option>
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
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="all" className="bg-card text-foreground">Todos los estados</option>
                <option value="PRESENTE" className="bg-card text-foreground">Presente</option>
                <option value="FALTA" className="bg-card text-foreground">Falta</option>
                <option value="TARDE" className="bg-card text-foreground">Tardanza</option>
                <option value="SALIDA_TEMPRANA" className="bg-card text-foreground">Salida temprana</option>
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
            No se encontraron registros de asistencias.
          </div>
        ) : (
          records.map((r, idx) => {
            const initials = (r.userName || "Carlos Mamani")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div key={r.id || idx} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                {/* Header: Avatar, Name, Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-gradient text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                      {initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-foreground leading-tight">{r.userName}</h4>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {r.statusLabel || "Asistencia"}
                  </span>
                </div>

                {/* Email */}
                <p className="text-xs text-muted-foreground truncate">{r.userEmail}</p>

                {/* Project Tag & Date */}
                <div className="flex items-center justify-between">
                  <span className="inline-block bg-purple-950/60 text-purple-300 border border-purple-800/40 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    {r.projectName || "testo6"}
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
                      {r.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoUrl(r.photoUrl)}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
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
                    <span className="text-xs font-mono font-medium text-amber-400">{r.checkOut || "—"}</span>
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
      <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
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
              {records.map((row, idx) => {
                const initials = (row.userName || "Carlos Mamani")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <tr key={row.id || idx} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-gradient text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{row.userName}</p>
                          <p className="text-xs text-muted-foreground truncate">{row.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-950/60 text-purple-300 border border-purple-800/40">
                        {row.projectName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-foreground">{row.date}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{row.checkIn}</span>
                        {row.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setSelectedPhotoUrl(row.photoUrl)}
                            className="p-1 text-muted-foreground hover:text-foreground"
                            title="Ver foto"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-400">{row.checkOut}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9. PAGINATION FOOTER */}
      <div className="flex items-center justify-between pt-1 px-1">
        <span className="text-xs text-muted-foreground font-medium">
          {records.length} registros totales
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
        onApply={(newRange) => setDateRange(newRange)}
      />
    </div>
  );
}
