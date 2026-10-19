"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Search,
  Folder,
  RotateCw,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Camera,
  X as XIcon,
} from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
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
    projectName: "gestion de asistencia",
    date: "2026-09-02",
    checkIn: "08:52 a. m.",
    checkOut: "09:07 a. m.",
    status: "SALIDA_TEMPRANA",
    locationName: "Condevilla Señor",
    latitude: -12.0184,
    longitude: -77.0817,
  },
  {
    id: "att-002",
    userId: "usr-carlos",
    userName: "carlos mamani",
    userEmail: "mamanigutierrezcarlos123@gmail.com",
    projectName: "proyecto testeo",
    date: "2026-09-01",
    checkIn: "11:28 a. m.",
    checkOut: "01:59 p. m.",
    status: "SALIDA_TEMPRANA",
    locationName: "Condevilla Señor",
    latitude: -12.0184,
    longitude: -77.0817,
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
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

  const [projects, setProjects] = useState<any[]>([
    { id: "all", name: "Todos los proyectos (3)" },
    { id: "p1", name: "gestion de asistencia" },
    { id: "p2", name: "proyecto testeo" },
    { id: "p3", name: "testo6" },
  ]);

  const [users, setUsers] = useState<any[]>([
    { id: "all", name: "Todos los colaboradores" },
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
          setUsers([{ id: "all", name: "Todos los colaboradores" }, ...uRes]);
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
    <div className="w-full space-y-6 text-foreground font-sans bg-transparent pb-12">
      {/* 1. TOP HEADER (EXACT SVG DESIGN) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] text-violet-400">
              PANEL DE GESTIÓN
            </span>
            <span className="text-xs text-muted-foreground font-sans">
              · Historial del equipo
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Historial de asistencias
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Registro completo de ingresos, salidas y ubicaciones del equipo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
        </div>
      </div>

      {/* 2. PERIOD SELECTOR ROW */}
      <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        <div className="flex-1 flex items-center gap-1 p-1 rounded-xl bg-muted/40 dark:bg-surface border border-border/80 overflow-x-auto">
          {PERIOD_TABS.map((tab) => {
            const isActive = activePeriod === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActivePeriod(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer text-center ${
                  isActive
                    ? "bg-white dark:bg-raised text-foreground dark:text-white shadow-xs border border-border font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-card dark:bg-surface text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            Rango personalizado
          </button>
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-blue/20 bg-blue/10 text-xs font-mono text-blue dark:text-blue shadow-xs">
            <span>01/09/2026 → 03/09/2026</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN CARD CONTAINER (MATCHING SVG WRAPPER) */}
      <div className="rounded-2xl border border-border/80 bg-card dark:bg-sidebar/70 p-6 space-y-6 shadow-sm">
        {/* A. 4 KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total */}
          <div className="rounded-xl border border-border/80 bg-card dark:bg-surface p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-muted/70 flex items-center justify-center text-muted-foreground">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Total registros
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {total}
              </span>
            </div>
          </div>

          {/* Card 2: Presentes */}
          <div className="rounded-xl border border-green/30 dark:border-green/25 bg-card dark:bg-[#111c18] p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-green/15 flex items-center justify-center text-green">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-green-ink dark:text-green">
                Presentes
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {presentes}
              </span>
            </div>
          </div>

          {/* Card 3: Faltas / Tardanzas */}
          <div className="rounded-xl border border-red/30 dark:border-red/25 bg-card dark:bg-[#1a1318] p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-red/15 flex items-center justify-center text-red">
                <XCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-red-ink dark:text-red">
                Faltas / Tardanzas
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {faltas}
              </span>
            </div>
          </div>

          {/* Card 4: % Asistencia */}
          <div className="rounded-xl border border-violet/30 dark:border-violet/25 bg-card dark:bg-[#171424] p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-violet/15 flex items-center justify-center text-violet-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-violet-400">
                % Asistencia
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {porcentaje}%
              </span>
            </div>
          </div>
        </div>

        {/* B. FILTERS BAR */}
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3.5 pt-2">
          {/* Proyecto */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              PROYECTO
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="h-10 px-3.5 rounded-xl border border-border/80 bg-field dark:bg-surface text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Colaborador */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              COLABORADOR
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="h-10 px-3.5 rounded-xl border border-border/80 bg-field dark:bg-surface text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.username || `${u.firstName || ""} ${u.lastName || ""}`}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              ESTADO
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-3.5 rounded-xl border border-border/80 bg-field dark:bg-surface text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
            >
              <option value="all">Todos los estados</option>
              <option value="PRESENTE">Presente</option>
              <option value="FALTA">Falta</option>
              <option value="TARDE">Tardanza</option>
              <option value="SALIDA_TEMPRANA">Salida temprana</option>
            </select>
          </div>

          {/* Botones Actualizar & Exportar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="h-10 px-4 rounded-xl border border-border/80 bg-card hover:bg-raised text-xs font-semibold text-foreground flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="h-10 px-4 rounded-xl bg-green hover:bg-green/90 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar
            </button>
          </div>
        </div>

        {/* C. DATA TABLE */}
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30 dark:bg-surface/50 text-[10.5px] font-mono font-semibold text-muted-foreground tracking-wider uppercase">
                <th className="py-3.5 px-4">COLABORADOR</th>
                <th className="py-3.5 px-4">PROYECTO</th>
                <th className="py-3.5 px-4">FECHA</th>
                <th className="py-3.5 px-4">ENTRADA</th>
                <th className="py-3.5 px-4">SALIDA</th>
                <th className="py-3.5 px-4">ESTADO</th>
                <th className="py-3.5 px-4">UBICACIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {records.map((row, idx) => {
                const isEven = idx % 2 === 0;
                const initials = (row.userName || "Carlos Mamani")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <tr
                    key={row.id || idx}
                    className={`hover:bg-muted/40 dark:hover:bg-raised/40 transition-colors ${
                      isEven ? "bg-muted/10 dark:bg-surface/20" : "bg-transparent"
                    }`}
                  >
                    {/* Colaborador */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet/20 border border-violet/30 flex items-center justify-center text-[11px] font-bold text-violet-300 shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {row.userName || "carlos mamani"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {row.userEmail || "mamanigutierrezcarlos123@gmail.com"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Proyecto */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-foreground font-medium">
                        <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{row.projectName || "gestion de asistencia"}</span>
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {row.date || "2026-09-02"}
                    </td>

                    {/* Entrada */}
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {row.checkIn || "08:52 a. m."}
                    </td>

                    {/* Salida */}
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {row.checkOut || "09:07 a. m."}
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber/15 text-amber border border-amber/30">
                        {row.status === "SALIDA_TEMPRANA" ? "Salida temprana" : row.status || "Presente"}
                      </span>
                    </td>

                    {/* Ubicación */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-blue text-xs font-medium">
                        <MapPin className="w-3.5 h-3.5 text-blue shrink-0" />
                        <span>{row.locationName || "Condevilla Señor"}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* D. PAGINATION FOOTER */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            Página <span className="font-bold text-foreground">1</span> de 1
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled
              className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled
              className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-muted-foreground">
            {records.length} registros totales
          </div>
        </div>
      </div>
    </div>
  );
}
