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
  X as XIcon,
} from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { listAttendance } from "@/app/services/assistance.service";
import { DateRangeModal, DateRange } from "@/components/ui/date-range-modal";
import { formatAvatarUrl } from "@/lib/avatar-url";
import { formatAttendanceTime } from "@/lib/timezone";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { LocationCell } from "@/components/atoms/LocationCell";

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
  latitude?: number | null;
  longitude?: number | null;
  locationName: string;
};

function getDatesForPeriod(period: Period): { from: string; to: string } {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const to = fmt(today);

  switch (period) {
    case "today":
      return { from: to, to };
    case "thisweek": {
      const d = new Date(today);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      return { from: fmt(d), to };
    }
    case "month": {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: fmt(first), to };
    }
    case "3months": {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 3);
      return { from: fmt(d), to };
    }
    case "6months": {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 6);
      return { from: fmt(d), to };
    }
    case "9months": {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 9);
      return { from: fmt(d), to };
    }
    case "total":
    default:
      return { from: "01/01/2024", to };
  }
}

export default function PMAsistenciasPage() {
  const router = useRouter();
  const { token, hydrated, user } = useAuth();
  const [activePeriod, setActivePeriod] = useState<Period>("month");
  const [records, setRecords] = useState<AttendanceItem[]>([]);
  const [searchDate, setSearchDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(() => getDatesForPeriod("month"));

  useEffect(() => {
    if (activePeriod !== "custom") {
      setDateRange(getDatesForPeriod(activePeriod));
    }
  }, [activePeriod]);

  const fetchRecords = useCallback(async () => {
    if (!token) {
      setRecords([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await listAttendance(token, {
        page: 0,
        size: 100,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      const items = res?.items || [];
      setTotalRecords(Number(res?.total) || items.length);
      if (items.length > 0) {
        setRecords(
          items.map((i: any) => ({
            id: i.id,
            date: i.date,
            checkIn: i.checkIn || "-",
            checkOut: i.checkOut || "-",
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
            latitude: i.latitude != null ? Number(i.latitude) : null,
            longitude: i.longitude != null ? Number(i.longitude) : null,
            locationName: i.locationName || "Ubicación registrada",
          }))
        );
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
      setTotalRecords(0);
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

  const parseComparable = (str?: string) => {
    if (!str) return "";
    if (str.includes("/")) {
      const p = str.split("/");
      if (p.length === 3) return `${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`;
    }
    return str.slice(0, 10);
  };

  const filteredRecords = useMemo(() => {
    const fromComp = parseComparable(dateRange.from);
    const toComp = parseComparable(dateRange.to);

    return records.filter((r) => {
      const rComp = parseComparable(r.date);
      const inRange = (!fromComp || rComp >= fromComp) && (!toComp || rComp <= toComp);
      const matchesDate = !searchDate || r.date.includes(searchDate);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return inRange && matchesDate && matchesStatus;
    });
  }, [records, searchDate, statusFilter, dateRange]);

  useEffect(() => {
    setPage(1);
  }, [searchDate, statusFilter, activePeriod]);

  const total = filteredRecords.length;
  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage]);
  const presentes = filteredRecords.filter((r) => r.status === "PRESENTE").length;
  const faltas = filteredRecords.filter((r) => r.status === "FALTA").length;
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
              · Personal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Mis asistencias
          </h1>
          <p className="font-hanken text-xs text-muted-foreground mt-1">
            Consulta y filtra el historial completo de tus registros de asistencia personal.
          </p>
        </div>

        {/* Desktop Header Actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => router.push("/pm/registrar")}
            className="h-10 px-4 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer transition-all shrink-0"
          >
            <Clock className="w-4 h-4" />
            <span>Registrar asistencia</span>
          </button>
          <NotificationBell />
        </div>
      </div>

      {/* 2. REGISTRAR ASISTENCIA BUTTON (Mobile only) */}
      <button
        type="button"
        onClick={() => router.push("/pm/registrar")}
        className="md:hidden w-full h-12 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 cursor-pointer transition-all"
      >
        <Clock className="w-4 h-4" />
        Registrar asistencia
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
                  onClick={() => setActivePeriod(tab.id)}
                  className={`py-1.5 px-1 rounded-xl text-xs transition-all cursor-pointer truncate ${
                    isActive
                      ? "bg-white dark:bg-accent text-foreground border border-border font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground font-medium"
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
                      : "text-muted-foreground hover:text-foreground font-medium"
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
          <div className="flex-1 h-11 px-3.5 rounded-2xl bg-card dark:bg-[#0C0E18] border border-border dark:border-[#1E2335] flex items-center justify-center gap-2 text-xs font-mono text-[#8F96AE]">
            <Calendar className="w-3.5 h-3.5 text-[#A855F7]" />
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{dateRange.from} → {dateRange.to}</span>
          </div>
          <button
            type="button"
            onClick={() => setDateRangeModalOpen(true)}
            className="w-11 h-11 rounded-2xl bg-card dark:bg-[#0C0E18] border border-border dark:border-[#1E2335] text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
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
        {/* Card 1: Total registros */}
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

        {/* Card 3: Faltas */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
            <p className="text-xs text-rose-400 font-medium">Faltas</p>
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
        <div className="hidden md:flex md:items-end md:justify-between gap-4 pt-1">
        <div className="flex items-end gap-3 flex-1">
          {/* Buscar fecha */}
          <div className="space-y-1.5 w-64">
            <label className="text-xs font-semibold text-foreground">
              Buscar fecha
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full h-10 px-3.5 pr-10 rounded-xl border border-border bg-background/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Calendar className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Filtrar estado */}
          <div className="space-y-1.5 w-56">
            <label className="text-xs font-semibold text-foreground">
              Filtrar estado
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Todos los estados</option>
                <option value="PRESENTE" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Presente</option>
                <option value="FALTA" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Falta</option>
                <option value="TARDE" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Tarde</option>
                <option value="FUERA_DE_HORARIO" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Fuera de horario</option>
              </select>
              <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Action: Actualizar button */}
        <button
          type="button"
          onClick={fetchRecords}
          disabled={isLoading}
          className="h-10 px-4 rounded-xl border border-border bg-background/50 hover:bg-background text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </button>
      </div>

        {/* 6. FILTERS CONTAINER (Mobile only) */}
        <div className="md:hidden space-y-3.5 pt-1">
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
                <option value="all" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Todos los estados</option>
                <option value="PRESENTE" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Presente</option>
                <option value="FALTA" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Falta</option>
                <option value="TARDE" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Tarde</option>
                <option value="FUERA_DE_HORARIO" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Fuera de horario</option>
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
            No hay registros de asistencia disponibles
          </div>
        ) : (
          paginatedRecords.map((r, idx) => {
            const photos = (r.photoUrl || "").split(",").map((p: string) => p.trim()).filter(Boolean);
            const checkInPhoto = photos.find((p: string) => !p.toLowerCase().includes("_checkout") && !p.toLowerCase().includes("checkout")) || null;
            const checkOutPhoto = photos.find((p: string) => p.toLowerCase().includes("_checkout") || p.toLowerCase().includes("checkout")) || null;

            return (
            <div key={r.id || idx} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              {/* Top Row: Date & Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{r.date}</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${r.status === "PRESENTE" || r.status === "ON_TIME" ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40" : r.status === "FALTA" ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40" : r.status === "TARDE" ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40" : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${r.status === "PRESENTE" || r.status === "ON_TIME" ? "bg-emerald-500" : r.status === "FALTA" ? "bg-rose-500" : r.status === "TARDE" ? "bg-amber-500" : "bg-blue-500"}`} />
                  {r.statusLabel}
                </span>
              </div>

              {/* Times Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                    ENTRADA
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-foreground whitespace-nowrap">{formatAttendanceTime(r.checkIn, r.date)}</span>
                    {r.checkIn && r.checkIn !== "-" && checkInPhoto && (
                      <button
                        type="button"
                        onClick={() => setSelectedPhotoUrl(formatAvatarUrl(checkInPhoto))}
                        className="p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        title="Ver foto de entrada"
                      >
                        <Camera className="w-3.5 h-3.5 text-primary" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                    SALIDA
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-muted-foreground whitespace-nowrap">{formatAttendanceTime(r.checkOut, r.date)}</span>
                    {r.checkOut && r.checkOut !== "-" && checkOutPhoto && (
                      <button
                        type="button"
                        onClick={() => setSelectedPhotoUrl(formatAvatarUrl(checkOutPhoto))}
                        className="p-1 text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer"
                        title="Ver foto de salida"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Photo Status & Location */}
              <div className="flex items-center gap-2 pt-0.5">
                <div
                  className={`h-10 px-3 rounded-xl bg-background/50 border border-border/60 flex items-center gap-1.5 text-xs shrink-0 ${
                    checkInPhoto || checkOutPhoto ? "cursor-pointer hover:border-primary text-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => {
                    const src = formatAvatarUrl(checkInPhoto || checkOutPhoto);
                    if (src) setSelectedPhotoUrl(src);
                  }}
                >
                  {checkInPhoto || checkOutPhoto ? (
                    <>
                      <Camera className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-foreground">
                        {checkInPhoto && checkOutPhoto ? "Fotos (2)" : checkInPhoto ? "Foto entrada" : "Foto salida"}
                      </span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Sin foto</span>
                    </>
                  )}
                </div>

                <div className="flex-1 h-10 px-3 rounded-xl bg-background/50 border border-border/60 flex items-center justify-between text-xs font-medium">
                  <LocationCell lat={r.latitude} lng={r.longitude} />
                </div>
              </div>
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
                <th className="py-3.5 px-4">FECHA</th>
                <th className="py-3.5 px-4">ENTRADA</th>
                <th className="py-3.5 px-4">SALIDA</th>
                <th className="py-3.5 px-4">ESTADO</th>
                <th className="py-3.5 px-4">FOTO</th>
                <th className="py-3.5 px-4 text-right">UBICACIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm font-medium">
                    No hay registros de asistencia disponibles
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((row) => {
                const photos = (row.photoUrl || "").split(",").map((p: string) => p.trim()).filter(Boolean);
                const checkInPhoto = photos.find((p: string) => !p.includes("_checkout") && !p.includes("checkout")) || null;
                const checkOutPhoto = photos.find((p: string) => p.includes("_checkout") || p.includes("checkout")) || null;
                return (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4 font-mono text-xs text-foreground">{row.date}</td>
                  <td className="py-4 px-4 font-mono text-xs text-foreground font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="whitespace-nowrap">{formatAttendanceTime(row.checkIn, row.date)}</span>
                      {row.checkIn && row.checkIn !== "-" && checkInPhoto && (
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoUrl(formatAvatarUrl(checkInPhoto))}
                          className="p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          title="Ver foto de entrada"
                        >
                          <Camera className="w-3.5 h-3.5 text-primary" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="whitespace-nowrap">{formatAttendanceTime(row.checkOut, row.date)}</span>
                      {row.checkOut && row.checkOut !== "-" && checkOutPhoto && (
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoUrl(formatAvatarUrl(checkOutPhoto))}
                          className="p-1 text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer"
                          title="Ver foto de salida"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-500" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${row.status === "PRESENTE" || row.status === "ON_TIME" ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40" : row.status === "FALTA" ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40" : row.status === "TARDE" ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40" : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${row.status === "PRESENTE" || row.status === "ON_TIME" ? "bg-emerald-500" : row.status === "FALTA" ? "bg-rose-500" : row.status === "TARDE" ? "bg-amber-500" : "bg-blue-500"}`} />
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {checkInPhoto || checkOutPhoto ? (
                      <div className="flex items-center gap-1.5">
                        {checkInPhoto && (
                          <div
                            className="w-9 h-9 rounded-lg overflow-hidden border border-border cursor-pointer hover:ring-2 hover:ring-primary transition-all shadow-sm"
                            onClick={() => setSelectedPhotoUrl(formatAvatarUrl(checkInPhoto))}
                            title="Foto de entrada"
                          >
                            <img
                              src={formatAvatarUrl(checkInPhoto)!}
                              alt="Foto entrada"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {checkOutPhoto && (
                          <div
                            className="w-9 h-9 rounded-lg overflow-hidden border border-amber-500/50 cursor-pointer hover:ring-2 hover:ring-amber-500 transition-all shadow-sm"
                            onClick={() => setSelectedPhotoUrl(formatAvatarUrl(checkOutPhoto))}
                            title="Foto de salida"
                          >
                            <img
                              src={formatAvatarUrl(checkOutPhoto)!}
                              alt="Foto salida"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground">
                        <Camera className="w-4 h-4" />
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end">
                      <LocationCell lat={row.latitude} lng={row.longitude} />
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
            {total} registro{total === 1 ? "" : "s"} total{total === 1 ? "" : "es"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-40 cursor-pointer"
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

      {/* Date Range Modal */}
      <DateRangeModal
        open={dateRangeModalOpen}
        onOpenChange={setDateRangeModalOpen}
        initialRange={dateRange}
        onApply={(newRange: { from: string; to: string }) => setDateRange(newRange)}
      />

      {/* PHOTO PREVIEW DIALOG */}
      <Dialog open={!!selectedPhotoUrl} onOpenChange={(open) => { if (!open) setSelectedPhotoUrl(null); }}>
        <DialogContent className="sm:max-w-md p-4 bg-card dark:bg-[#101322] border border-border dark:border-[#1E2335] rounded-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-border dark:border-[#1E2335]">
            <DialogTitle className="font-semibold text-base text-foreground dark:text-white">
              Foto de marcación
            </DialogTitle>
            <DialogClose className="rounded-lg p-1 text-muted-foreground hover:bg-muted dark:hover:bg-[#181B2A] transition-colors cursor-pointer">
              <XIcon className="w-4 h-4" />
            </DialogClose>
          </div>
          <DialogDescription className="sr-only">
            Vista previa ampliada de la foto de marcación
          </DialogDescription>
          <div className="mt-3 flex items-center justify-center bg-black/40 rounded-xl overflow-hidden min-h-[300px] max-h-[550px]">
            {selectedPhotoUrl && (
              <img
                src={selectedPhotoUrl}
                alt="Foto de asistencia"
                className="max-w-full max-h-[500px] object-contain rounded-lg shadow-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
