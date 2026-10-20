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
  EyeOff,
} from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { listAttendance } from "@/app/services/assistance.service";
import { DateRangeModal, DateRange } from "@/components/ui/date-range-modal";

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
    checkOut: "Sin salida",
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
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: "01/09/2026",
    to: "03/09/2026",
  });

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
            checkOut: i.checkOut || "Sin salida",
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
    <div className="w-full space-y-4 text-foreground font-sans bg-transparent pb-12 max-w-6xl mx-auto px-0 md:px-6 py-2 md:py-4">
      {/* 1. TOP HEADER (EXACT SVG DESIGN) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-purple-400">
              PANEL DE GESTIÓN
            </span>
            <span className="text-xs text-muted-foreground font-sans">
              · Personal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Mis asistencias
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Consulta y filtra el historial completo de tus registros de asistencia personal.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <NotificationBell />
        </div>
      </div>

      {/* 2. REGISTRAR ASISTENCIA BUTTON (Full width with brand gradient as in SVG) */}
      <button
        type="button"
        onClick={() => router.push("/pm/asistencias/registrar")}
        className="w-full h-12 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 cursor-pointer transition-all"
      >
        <Clock className="w-4 h-4" />
        Registrar asistencia
      </button>

      {/* 3. PERIOD SELECTOR TABS */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card/60 border border-border/80 overflow-x-auto scrollbar-none">
        {PERIOD_TABS.map((tab) => {
          const isActive = activePeriod === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePeriod(tab.id)}
              className={`flex-1 min-w-[75px] py-2 px-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap text-center ${
                isActive
                  ? "bg-slate-800 text-white font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. DATE RANGE SELECTOR BAR */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3.5 h-11 rounded-xl border border-border bg-card/60 text-xs font-mono text-muted-foreground">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <span>{dateRange.from} → {dateRange.to}</span>
        </div>
        <button
          type="button"
          onClick={() => setDateRangeModalOpen(true)}
          className="w-11 h-11 rounded-xl border border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-colors"
          title="Seleccionar rango"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {/* 5. 4 KPI CARDS (2x2 on mobile, 4 cols on desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Total registros */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 flex flex-col justify-between shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-border/60 bg-background/50 flex items-center justify-center text-muted-foreground shrink-0 mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total registros</p>
            <p className="text-2xl font-bold text-foreground mt-1">{total}</p>
          </div>
        </div>

        {/* Card 2: Presentes */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col justify-between shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mb-3">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-emerald-400 font-medium">Presentes</p>
            <p className="text-2xl font-bold text-foreground mt-1">{presentes}</p>
          </div>
        </div>

        {/* Card 3: Faltas */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex flex-col justify-between shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mb-3">
            <XCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-rose-400 font-medium">Faltas</p>
            <p className="text-2xl font-bold text-foreground mt-1">{faltas}</p>
          </div>
        </div>

        {/* Card 4: % Asistencia */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 flex flex-col justify-between shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mb-3">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-purple-400 font-medium">% Asistencia</p>
            <p className="text-2xl font-bold text-foreground mt-1">{porcentaje}%</p>
          </div>
        </div>
      </div>

      {/* 6. FILTERS CONTAINER */}
      <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3.5 shadow-sm">
        {/* Buscar fecha */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Buscar fecha
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="dd/mm/aaaa"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full h-10 px-3.5 pr-10 rounded-xl border border-border bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Calendar className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Filtrar estado + Refresh */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Filtrar estado
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="all" className="bg-card text-foreground">Todos los estados</option>
                <option value="PRESENTE" className="bg-card text-foreground">Presente</option>
                <option value="FALTA" className="bg-card text-foreground">Falta</option>
                <option value="TARDE" className="bg-card text-foreground">Tarde</option>
                <option value="FUERA_DE_HORARIO" className="bg-card text-foreground">Fuera de horario</option>
              </select>
              <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={fetchRecords}
              disabled={isLoading}
              className="w-10 h-10 rounded-xl border border-border bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-colors"
              title="Actualizar"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 7. MOBILE CARDS VIEW (md:hidden) Matching SVG dark-mis asistencias.svg */}
      <div className="space-y-3 md:hidden">
        {filteredRecords.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground bg-card rounded-2xl border border-border">
            No se encontraron registros de asistencias.
          </div>
        ) : (
          filteredRecords.map((r, idx) => (
            <div key={r.id || idx} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              {/* Top Row: Date & Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{r.date}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {r.statusLabel}
                </span>
              </div>

              {/* Times Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                    ENTRADA
                  </span>
                  <span className="text-xs font-mono font-medium text-foreground">{r.checkIn}</span>
                </div>
                <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                    SALIDA
                  </span>
                  <span className="text-xs font-mono font-medium text-muted-foreground">{r.checkOut}</span>
                </div>
              </div>

              {/* Bottom Row: Photo Status & Location */}
              <div className="flex items-center gap-2 pt-0.5">
                <div className="h-10 px-3 rounded-xl bg-background/50 border border-border/60 flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  {r.photoUrl ? (
                    <>
                      <Camera className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-foreground">Con foto</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Sin foto</span>
                    </>
                  )}
                </div>

                <div className="flex-1 h-10 px-3 rounded-xl bg-background/50 border border-border/60 flex items-center justify-between text-xs font-medium text-blue-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-foreground">{r.locationName}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
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
                <th className="py-3.5 px-4">FECHA</th>
                <th className="py-3.5 px-4">ENTRADA</th>
                <th className="py-3.5 px-4">SALIDA</th>
                <th className="py-3.5 px-4">ESTADO</th>
                <th className="py-3.5 px-4">FOTO</th>
                <th className="py-3.5 px-4 text-right">UBICACIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4 font-mono text-xs text-foreground">{row.date}</td>
                  <td className="py-4 px-4 font-mono text-xs text-foreground font-medium">{row.checkIn}</td>
                  <td className="py-4 px-4 font-mono text-xs text-muted-foreground">{row.checkOut}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {row.photoUrl ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-border">
                        <img src={row.photoUrl} alt="Foto asistencia" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground">
                        <Camera className="w-4 h-4" />
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      {row.locationName}
                    </span>
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
          {total} registro{total === 1 ? "" : "s"} total{total === 1 ? "" : "es"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground font-medium px-1">
            Página {page} de 1
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
