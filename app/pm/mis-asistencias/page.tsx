"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RotateCw,
  Calendar,
  Camera,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { listAttendance } from "@/app/services/assistance.service";

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

type AttendanceItem = {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
  statusLabel: string;
  photoUrl?: string | null;
  locationName: string;
};

const DEFAULT_SVG_ATTENDANCES: AttendanceItem[] = [
  {
    id: "att-001",
    date: "2026-09-02",
    checkIn: "11:03 p. m.",
    checkOut: "—",
    status: "FUERA_DE_HORARIO",
    statusLabel: "Fuera de horario",
    photoUrl: null,
    locationName: "Condevilla Señor",
  },
];

export default function PMAsistenciasPage() {
  const router = useRouter();
  const { token, hydrated, user } = useAuth();
  const [activePeriod, setActivePeriod] = useState<Period>("month");
  const [records, setRecords] = useState<AttendanceItem[]>(DEFAULT_SVG_ATTENDANCES);
  const [searchDate, setSearchDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await listAttendance(token, {
        page,
        size: 10,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      const items = res?.items || [];
      if (items.length > 0) {
        setRecords(
          items.map((i: any) => ({
            id: i.id,
            date: i.date,
            checkIn: i.checkIn || "11:03 p. m.",
            checkOut: i.checkOut || "—",
            status: i.status,
            statusLabel:
              i.status === "PRESENTE"
                ? "Presente"
                : i.status === "FALTA"
                ? "Falta"
                : i.status === "TARDE"
                ? "Tarde"
                : "Fuera de horario",
            photoUrl: i.photoUrl || null,
            locationName: "Condevilla Señor",
          }))
        );
      } else {
        setRecords(DEFAULT_SVG_ATTENDANCES);
      }
    } catch {
      setRecords(DEFAULT_SVG_ATTENDANCES);
    } finally {
      setIsLoading(false);
    }
  }, [token, page, statusFilter]);

  useEffect(() => {
    if (hydrated) {
      if (token) fetchRecords();
      else setIsLoading(false);
    }
  }, [hydrated, token, fetchRecords]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesDate = !searchDate || r.date.includes(searchDate);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesDate && matchesStatus;
    });
  }, [records, searchDate, statusFilter]);

  const total = filteredRecords.length;
  const presentes = filteredRecords.filter((r) => r.status === "PRESENTE").length;
  const faltas = filteredRecords.filter((r) => r.status === "FALTA").length;
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
              · Personal
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Mis asistencias
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Consulta y filtra el historial completo de tus registros de asistencia personal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/pm/asistencias/registrar")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            Registrar asistencia
          </button>
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
          {/* Card 1: Total registros */}
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

          {/* Card 3: Faltas */}
          <div className="rounded-xl border border-red/30 dark:border-red/25 bg-card dark:bg-[#1a1318] p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-red/15 flex items-center justify-center text-red">
                <XCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-red-ink dark:text-red">
                Faltas
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
          {/* Buscar Fecha */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              BUSCAR FECHA
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="mm/dd/yyyy"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full h-10 px-3.5 pr-10 rounded-xl border border-border/80 bg-field dark:bg-surface text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet"
              />
            </div>
          </div>

          {/* Filtrar Estado */}
          <div className="flex flex-col gap-1.5 w-full md:w-64">
            <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              FILTRAR ESTADO
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3.5 rounded-xl border border-border/80 bg-field dark:bg-surface text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
            >
              <option value="all">Todos los estados</option>
              <option value="PRESENTE">Presente</option>
              <option value="FALTA">Falta</option>
              <option value="TARDE">Tarde</option>
              <option value="FUERA_DE_HORARIO">Fuera de horario</option>
            </select>
          </div>

          {/* Botón Actualizar */}
          <button
            type="button"
            onClick={fetchRecords}
            className="h-10 px-4 rounded-xl border border-border/80 bg-card hover:bg-raised text-xs font-semibold text-foreground flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        {/* C. DATA TABLE (EXACT SVG COLUMNS AND STYLING) */}
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30 dark:bg-surface/50 text-[10.5px] font-mono font-semibold text-muted-foreground tracking-wider uppercase">
                <th className="py-3.5 px-4">FECHA</th>
                <th className="py-3.5 px-4">ENTRADA</th>
                <th className="py-3.5 px-4">SALIDA</th>
                <th className="py-3.5 px-4">ESTADO</th>
                <th className="py-3.5 px-4">FOTO</th>
                <th className="py-3.5 px-4 text-right">UBICACIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No se encontraron registros de asistencia.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    {/* FECHA */}
                    <td className="py-4 px-4 font-mono text-xs text-foreground">
                      {row.date}
                    </td>

                    {/* ENTRADA */}
                    <td className="py-4 px-4 font-mono text-xs text-foreground">
                      {row.checkIn}
                    </td>

                    {/* SALIDA */}
                    <td className="py-4 px-4 font-mono text-xs text-muted-foreground">
                      {row.checkOut}
                    </td>

                    {/* ESTADO */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber/15 text-amber-ink dark:text-amber border border-amber/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                        {row.statusLabel}
                      </span>
                    </td>

                    {/* FOTO */}
                    <td className="py-4 px-4">
                      {row.photoUrl ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-border">
                          <img
                            src={row.photoUrl}
                            alt="Foto asistencia"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border/80 flex items-center justify-center text-muted-foreground">
                          <Camera className="w-4 h-4" />
                        </div>
                      )}
                    </td>

                    {/* UBICACIÓN */}
                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-medium">
                        <MapPin className="w-3.5 h-3.5" />
                        {row.locationName}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* D. PAGINATION FOOTER */}
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span>Página {page} de 1</span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg border border-border/80 bg-card dark:bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled
              className="w-8 h-8 rounded-lg border border-border/80 bg-card dark:bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="font-mono">{total} registro total</span>
        </div>
      </div>
    </div>
  );
}
