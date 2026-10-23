"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  CheckCircle2,
  XCircle,
  FileText,
  TrendingUp,
  Calendar,
  Activity,
  FolderKanban,
  Clock,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { NotificationBell } from "@/components/layout/notification-bell";
import { DateRangeModal } from "@/components/ui/date-range-modal";
import {
  getDashboardPM,
  getAllProjects,
} from "@/app/services/project.assistance.service";

type Period =
  | "today"
  | "thisweek"
  | "month"
  | "3months"
  | "6months"
  | "9months"
  | "total"
  | "custom";

const PERIOD_ROWS = [
  [
    { id: "today" as Period, label: "Hoy" },
    { id: "thisweek" as Period, label: "Esta semana" },
    { id: "month" as Period, label: "Este mes" },
    { id: "3months" as Period, label: "3 meses" },
  ],
  [
    { id: "6months" as Period, label: "6 meses" },
    { id: "9months" as Period, label: "9 meses" },
    { id: "total" as Period, label: "Total" },
  ],
];

const PERIOD_TABS_ALL = [
  { id: "today" as Period, label: "Hoy" },
  { id: "thisweek" as Period, label: "Esta semana" },
  { id: "month" as Period, label: "Este mes" },
  { id: "3months" as Period, label: "3 meses" },
  { id: "6months" as Period, label: "6 meses" },
  { id: "9months" as Period, label: "9 meses" },
  { id: "total" as Period, label: "Total" },
];

export function DashboardView() {
  const router = useRouter();
  const { user, token, hydrated } = useAuth();

  const [activePeriod, setActivePeriod] = useState<Period>("month");
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customRange, setCustomRange] = useState({
    from: "2026-09-01",
    to: "2026-09-03",
  });
  const [activeProjects, setActiveProjects] = useState<any[]>(MOCK_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [metrics, setMetrics] = useState({
    totalAttendances: 2,
    totalAbsences: 2,
    pendingJustifications: 1,
  });

  const displayName =
    user?.username ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "jefeproyecto-x");

  // Sync with global project selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selected_project_id");
      if (saved) setSelectedProjectId(saved);

      const handler = (e: Event) => {
        const customEvent = e as CustomEvent<string>;
        const newId = customEvent.detail ?? localStorage.getItem("selected_project_id");
        if (newId !== undefined && newId !== null) {
          setSelectedProjectId(newId);
        }
      };

      window.addEventListener("astc-project-changed", handler);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener("astc-project-changed", handler);
        window.removeEventListener("storage", handler);
      };
    }
  }, []);

  useEffect(() => {
    if (hydrated && token) {
      getAllProjects(token)
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            setActiveProjects(res);
          }
        })
        .catch(() => {});

      getDashboardPM(
        token,
        selectedProjectId === "all" ? undefined : selectedProjectId
      )
        .then((data) => {
          if (data) {
            setMetrics({
              totalAttendances: data.totalAttendances ?? 2,
              totalAbsences: data.totalAbsences ?? 2,
              pendingJustifications: data.pendingJustifications ?? 1,
            });
          }
        })
        .catch(() => {});
    }
  }, [hydrated, token, selectedProjectId]);

  const totalAttendances = metrics.totalAttendances || 2;
  const totalAbsences = metrics.totalAbsences || 2;
  const pendingJustifications = metrics.pendingJustifications || 1;

  // Donut chart calculations: Radius = 46, Circumference = 2 * PI * 46 ≈ 289.026
  const R = 46;
  const C = 2 * Math.PI * R;
  const GAP = 6; // Separation between slices, cut like admin
  const totalRecords = totalAttendances + totalAbsences + pendingJustifications;
  const totalAvailable = C - 3 * GAP;
  const attendancePercentage = totalRecords > 0 ? Math.round((totalAttendances / totalRecords) * 100) : 50;

  const attArc = totalRecords > 0 ? (totalAttendances / totalRecords) * totalAvailable : 0.4 * totalAvailable;
  const absArc = totalRecords > 0 ? (totalAbsences / totalRecords) * totalAvailable : 0.4 * totalAvailable;
  const pendArc = totalRecords > 0 ? (pendingJustifications / totalRecords) * totalAvailable : 0.2 * totalAvailable;

  return (
    <div className="relative min-h-screen bg-transparent pb-16 font-sans">
      {/* Top Ambient Glow */}
      <div
        className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 rounded-full opacity-30 blur-3xl z-0 hidden dark:block"
        style={{
          background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-7xl mx-auto space-y-4 md:space-y-5 z-10 px-0 md:px-0">
        {/* 1. HEADER SECTION (Mobile: stacked + full-width button; Desktop: flex row) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] text-violet">
                PANEL DE GESTIÓN
              </span>
              <span className="text-xs text-muted-foreground">
                · {activeProjects.length || 3} proyectos
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Hola, {displayName}
            </h1>
            <p className="font-hanken text-xs text-muted-foreground leading-relaxed max-w-xl">
              Visión general del rendimiento y la actividad del equipo. Hay 1 justificación esperando tu revisión.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/pm/justificaciones")}
              className="w-full md:w-auto h-11 px-5 rounded-2xl text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#A855F7]/25 hover:opacity-95 transition-all cursor-pointer"
              style={{
                background: "linear-gradient(90deg, #5B8CFF 0%, #A855F7 100%)",
              }}
            >
              <FileText className="w-4 h-4" />
              <span>Revisar justificaciones</span>
            </button>
            <div className="hidden md:block">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* 2. PERIOD TABS & DATE RANGE */}
        {/* Mobile View: 2 rows matching responsive SVG */}
        <div className="block md:hidden space-y-2 pt-1">
          {PERIOD_ROWS.map((row, rIdx) => (
            <div
              key={rIdx}
              className="flex items-center gap-1.5 p-1 rounded-2xl bg-card border border-border"
            >
              {row.map((tab) => {
                const isActive = activePeriod === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActivePeriod(tab.id)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium transition-all text-center cursor-pointer ${
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
          ))}

          {/* Mobile Date Selector Pill */}
          <div className="flex items-center gap-2 pt-0.5">
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card border border-border text-xs font-mono">
              <Calendar className="w-4 h-4 text-[#A855F7] shrink-0" />
              <span className="text-muted-foreground">Rango:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {customRange.from.split("-").reverse().join("/")}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {customRange.to.split("-").reverse().join("/")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCustomModalOpen(true)}
              className="w-10 h-10 rounded-2xl bg-card border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
              title="Seleccionar rango"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop View: Compact tabs pill + Rango personalizado button + dates badge matching official SVG */}
        <div className="hidden md:flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-card border border-border">
            {PERIOD_TABS_ALL.map((tab) => {
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
            onClick={() => setCustomModalOpen(true)}
            className="h-10 px-4 rounded-2xl bg-card border border-border text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
            title="Seleccionar rango personalizado"
          >
            <Calendar className="w-4 h-4 text-[#A855F7]" />
            <span>Rango personalizado</span>
          </button>

          <div className="h-10 px-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 flex items-center text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
            <span className="hidden">Período:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {customRange.from.split("-").reverse().join("/")} → {customRange.to.split("-").reverse().join("/")}
            </span>
          </div>
        </div>

        {/* 3. THE 4 STAT CARDS (2x2 on mobile, 4 in row on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Asistencias */}
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-between h-[124px] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-green/10 border border-green/20 flex items-center justify-center text-green">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-green">
                Asistencias
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {totalAttendances}
                </span>
                <span className="text-[11px] text-muted-foreground">días presentes</span>
              </div>
              <p className="text-[10.5px] text-muted-foreground mt-1">Último periodo</p>
            </div>
          </div>

          {/* Card 2: Faltas */}
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-between h-[124px] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-red/10 border border-red/20 flex items-center justify-center text-red">
                <XCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-red">
                Faltas
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {totalAbsences}
                </span>
                <span className="text-[11px] text-muted-foreground">días ausentes</span>
              </div>
              <p className="text-[10.5px] text-muted-foreground mt-1">Histórico del equipo</p>
            </div>
          </div>

          {/* Card 3: Por revisar */}
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-between h-[124px] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center text-amber">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-amber">
                Por revisar
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {pendingJustifications}
                </span>
                <span className="text-[11px] text-muted-foreground">por justificar</span>
              </div>
              <Link
                href="/pm/justificaciones"
                className="text-[10.5px] text-amber font-medium hover:underline mt-1 inline-flex items-center gap-0.5"
              >
                Revisar solicitud →
              </Link>
            </div>
          </div>

          {/* Card 4: Meta 90% */}
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-between h-[124px] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-violet/10 border border-violet/20 flex items-center justify-center text-[#A855F7]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-violet">
                Meta 90%
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  50%
                </span>
                <span className="text-[11px] text-muted-foreground">cumplimiento</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div
                  className="h-1.5 rounded-full w-[50%]"
                  style={{
                    background: "linear-gradient(90deg, #5B8CFF 0%, #A855F7 100%)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. MIDDLE ROW: Resumen general & Actividad reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card: Resumen general */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">
                  Resumen general
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  5 registros del equipo en el periodo
                </p>
              </div>
              <span className="text-[10.5px] font-semibold bg-violet/10 text-violet border border-violet/20 px-2.5 py-0.5 rounded-full">
                Todos los proyectos
              </span>
            </div>

            {/* Circular Segmented Donut matching SVG */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
              <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={R}
                    stroke="currentColor"
                    className="text-muted/40 dark:text-[#1F2438]"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  {/* Segment 1: Asistencias (Green) */}
                  <circle
                    cx="60"
                    cy="60"
                    r={R}
                    stroke="#34D399"
                    strokeWidth="12"
                    strokeDasharray={`${attArc} ${C}`}
                    strokeDashoffset="0"
                    fill="transparent"
                  />
                  {/* Segment 2: Faltas (Red) */}
                  <circle
                    cx="60"
                    cy="60"
                    r={R}
                    stroke="#F87171"
                    strokeWidth="12"
                    strokeDasharray={`${absArc} ${C}`}
                    strokeDashoffset={-(attArc + GAP)}
                    fill="transparent"
                  />
                  {/* Segment 3: Pendientes (Amber) */}
                  <circle
                    cx="60"
                    cy="60"
                    r={R}
                    stroke="#FBBF24"
                    strokeWidth="12"
                    strokeDasharray={`${pendArc} ${C}`}
                    strokeDashoffset={-(attArc + GAP + absArc + GAP)}
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-foreground tracking-tight leading-none">
                    {attendancePercentage}%
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase mt-1 font-semibold">
                    ASISTENCIA
                  </span>
                </div>
              </div>

              {/* Legend matching SVG */}
              <div className="w-full sm:w-auto flex-1 max-w-[280px] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
                    <span className="text-foreground font-medium">Asistencias</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-foreground">2</span>
                    <span className="text-muted-foreground w-8 text-right">40%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F87171]" />
                    <span className="text-foreground font-medium">Faltas</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-foreground">2</span>
                    <span className="text-muted-foreground w-8 text-right">40%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" />
                    <span className="text-foreground font-medium">Pendientes</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-foreground">1</span>
                    <span className="text-muted-foreground w-8 text-right">20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Actividad reciente */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">
                  Actividad reciente
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Últimas acciones del equipo
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-green/10 text-green border border-green/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                En vivo
              </span>
            </div>

            {/* Dashed Empty State Box */}
            <div className="my-auto py-7 px-4 rounded-xl border border-dashed border-border bg-muted flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-raised border border-border flex items-center justify-center text-muted-foreground mb-2.5">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs text-foreground">
                Aún no hay actividad en tu equipo
              </h4>
              <p className="text-[11px] text-muted-foreground max-w-xs mt-1 mb-3.5 leading-relaxed">
                Asigna trabajadores a tus proyectos para ver sus marcajes aquí en tiempo real.
              </p>
              <button
                type="button"
                onClick={() => router.push("/pm/proyectos")}
                className="px-4 py-2 rounded-xl border border-border bg-raised hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Gestionar proyectos
              </button>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/pm/historial-asistencias"
                className="block w-full py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors"
              >
                Ver todas las asistencias →
              </Link>
            </div>
          </div>
        </div>

        {/* 5. BOTTOM ROW: Resumen de asistencias & Acciones rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card: Resumen de asistencias (Bar Chart with exact linear gradients) */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                Resumen de asistencias
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Distribución de asistencias, faltas y solicitudes
              </p>
            </div>

            <div className="pt-4 pb-2">
              <div className="grid grid-cols-3 gap-6 items-end h-[160px] pb-2 border-b border-border">
                {/* Bar 1: Asistencias (Height 124px, Exact Green Gradient) */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-foreground mb-2">2</span>
                  <div
                    className="w-16 h-[124px] rounded-t-xl transition-all hover:brightness-110"
                    style={{
                      background:
                        "linear-gradient(180deg, #34D399 0%, rgba(52, 211, 153, 0.33) 100%)",
                    }}
                  />
                </div>

                {/* Bar 2: Faltas (Height 124px, Exact Red Gradient) */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-foreground mb-2">2</span>
                  <div
                    className="w-16 h-[124px] rounded-t-xl transition-all hover:brightness-110"
                    style={{
                      background:
                        "linear-gradient(180deg, #F87171 0%, rgba(248, 113, 113, 0.33) 100%)",
                    }}
                  />
                </div>

                {/* Bar 3: Pendientes (Height 62px, Exact Amber Gradient) */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-foreground mb-2">1</span>
                  <div
                    className="w-16 h-[62px] rounded-t-xl transition-all hover:brightness-110"
                    style={{
                      background:
                        "linear-gradient(180deg, #FBBF24 0%, rgba(251, 191, 36, 0.33) 100%)",
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-3 text-center text-xs text-muted-foreground font-medium">
                <span>Asistencias</span>
                <span>Faltas</span>
                <span>Pendientes</span>
              </div>
            </div>
          </div>

          {/* Card: Acciones rápidas */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                Acciones rápidas
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gestiona el equipo de forma inmediata
              </p>
            </div>

            <div className="space-y-2.5">
              {/* Featured Justificaciones Card */}
              <Link
                href="/pm/justificaciones"
                className="flex items-center justify-between p-3.5 rounded-xl border border-amber/20 bg-amber/10 hover:bg-amber/15 transition-colors shadow-2xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber/15 flex items-center justify-center text-amber shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-foreground group-hover:text-amber transition-colors">
                    Justificaciones
                  </span>
                </div>
                <span className="w-5 h-5 rounded-full bg-[#F59E0B] text-black font-bold text-[11px] flex items-center justify-center shrink-0">
                  {pendingJustifications}
                </span>
              </Link>

              {/* 6 Buttons in 2 columns */}
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/pm/registrar"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted dark:hover:bg-[#1A1D2E] transition-colors shadow-2xs group"
                >
                  <div className="w-7 h-7 rounded-lg bg-green/10 flex items-center justify-center text-green shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-green transition-colors">
                    Registrar
                  </span>
                </Link>

                <Link
                  href="/pm/historial-asistencias"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted dark:hover:bg-[#1A1D2E] transition-colors shadow-2xs group"
                >
                  <div className="w-7 h-7 rounded-lg bg-violet/10 flex items-center justify-center text-[#A855F7] shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-[#A855F7] transition-colors">
                    Asistencias
                  </span>
                </Link>

                <Link
                  href="/pm/alertas"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted dark:hover:bg-[#1A1D2E] transition-colors shadow-2xs group"
                >
                  <div className="w-7 h-7 rounded-lg bg-red/10 flex items-center justify-center text-red shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-red transition-colors">
                    Alertas
                  </span>
                </Link>

                <Link
                  href="/pm/proyectos"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted dark:hover:bg-[#1A1D2E] transition-colors shadow-2xs group"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan/10 flex items-center justify-center text-cyan shrink-0">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-cyan transition-colors">
                    Proyectos
                  </span>
                </Link>

                <Link
                  href="/pm/mis-asistencias"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted dark:hover:bg-[#1A1D2E] transition-colors shadow-2xs group"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue/10 flex items-center justify-center text-blue shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-blue transition-colors">
                    Historial
                  </span>
                </Link>

                <Link
                  href="/pm/horarios"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted dark:hover:bg-[#1A1D2E] transition-colors shadow-2xs group"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan/10 flex items-center justify-center text-cyan shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-cyan transition-colors">
                    Horarios
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Modal */}
      <DateRangeModal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        fromDate={customRange.from}
        toDate={customRange.to}
        onApply={(from, to) => {
          setCustomRange({ from, to });
          setActivePeriod("custom");
        }}
      />
    </div>
  );
}
