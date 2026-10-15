"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  CheckCircle2,
  XCircle,
  FileText,
  TrendingUp,
  Calendar,
  Bell,
  Activity,
  FolderKanban,
  Clock,
  BarChart3,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { NotificationBell } from "@/components/layout/notification-bell";
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

const PERIOD_TABS: { id: Period; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "thisweek", label: "Esta semana" },
  { id: "month", label: "Este mes" },
  { id: "3months", label: "3 meses" },
  { id: "6months", label: "6 meses" },
  { id: "9months", label: "9 meses" },
  { id: "total", label: "Total" },
];

export function DashboardView() {
  const router = useRouter();
  const { user, token, hydrated } = useAuth();

  const [activePeriod, setActivePeriod] = useState<Period>("month");
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
  const totalRecords = totalAttendances + totalAbsences + pendingJustifications;

  const attendancePercent =
    totalRecords > 0 ? Math.round((totalAttendances / totalRecords) * 100) : 40;
  const absencePercent =
    totalRecords > 0 ? Math.round((totalAbsences / totalRecords) * 100) : 40;
  const pendingPercent =
    totalRecords > 0 ? 100 - attendancePercent - absencePercent : 20;

  return (
    <div className="relative min-h-screen bg-transparent pb-12">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 z-10">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] text-primary dark:text-violet-ink">
                PANEL DE GESTIÓN
              </span>
              <span className="text-xs text-muted-foreground font-sans">
                · {activeProjects.length || 3} proyectos
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Hola, {displayName}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Visión general del rendimiento y la actividad del equipo. Hay 1 justificación esperando tu revisión.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/pm/justificaciones")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue hover:bg-blue/90 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Revisar justificaciones
            </button>
            <NotificationBell />
          </div>
        </div>

        {/* PERIOD / DATE SELECTOR BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/40 dark:bg-surface border border-border/80 overflow-x-auto">
            {PERIOD_TABS.map((tab) => {
              const isActive = activePeriod === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePeriod(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card dark:bg-sidebar/70 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              Rango personalizado
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue/20 bg-blue/10 text-xs font-mono text-blue dark:text-blue shadow-xs">
              <span>01/09/2026 → 03/09/2026</span>
            </div>
          </div>
        </div>

        {/* 4 TOP METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Asistencias */}
          <div className="rounded-2xl border border-border/80 bg-card dark:bg-sidebar/70 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-green/10 flex items-center justify-center text-green">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-green-ink dark:text-green">
                Asistencias
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {totalAttendances}
                </span>
                <span className="text-xs text-muted-foreground">días presentes</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Último periodo</p>
            </div>
          </div>

          {/* Card 2: Faltas */}
          <div className="rounded-2xl border border-border/80 bg-card dark:bg-sidebar/70 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-red/10 flex items-center justify-center text-red">
                <XCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-red-ink dark:text-red">
                Faltas
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {totalAbsences}
                </span>
                <span className="text-xs text-muted-foreground">días ausentes</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Histórico del equipo</p>
            </div>
          </div>

          {/* Card 3: Requiere revisión */}
          <div className="rounded-2xl border border-border/80 bg-card dark:bg-sidebar/70 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber/10 flex items-center justify-center text-amber">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-amber-ink dark:text-amber">
                Requiere revisión
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {pendingJustifications}
                </span>
                <span className="text-xs text-muted-foreground">por justificar</span>
              </div>
              <Link
                href="/pm/justificaciones"
                className="text-xs font-medium text-amber-ink dark:text-amber hover:underline mt-2 inline-flex items-center gap-1"
              >
                Revisar solicitud →
              </Link>
            </div>
          </div>

          {/* Card 4: Meta 90% */}
          <div className="rounded-2xl border border-border/80 bg-card dark:bg-sidebar/70 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-violet/10 flex items-center justify-center text-violet">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-violet-ink dark:text-violet">
                Meta 90%
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">50%</span>
                <span className="text-xs text-muted-foreground">cumplimiento</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-raised rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan via-blue to-violet h-1.5 rounded-full w-[50%]" />
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE ROW (Resumen general & Actividad reciente) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card: Resumen general */}
          <div className="rounded-2xl border border-border/80 bg-card dark:bg-sidebar/70 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Resumen general
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  5 registros del equipo en el periodo
                </p>
              </div>
              <span className="font-mono text-[10.5px] font-semibold bg-violet/10 text-violet-ink dark:text-violet border border-violet/20 px-2.5 py-0.5 rounded-full">
                Todos los proyectos
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4 flex-1">
              {/* Donut Chart */}
              <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="currentColor"
                    strokeWidth="14"
                    fill="transparent"
                    className="text-slate-100 dark:text-raised"
                  />
                  {/* Asistencias (Green 40%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="var(--green)"
                    strokeWidth="14"
                    strokeDasharray="95.5 143.2"
                    strokeDashoffset="0"
                    fill="transparent"
                  />
                  {/* Faltas (Red 40%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="var(--red)"
                    strokeWidth="14"
                    strokeDasharray="95.5 143.2"
                    strokeDashoffset="-95.5"
                    fill="transparent"
                  />
                  {/* Pendientes (Amber 20%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="var(--amber)"
                    strokeWidth="14"
                    strokeDasharray="47.7 191"
                    strokeDashoffset="-191"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-foreground tracking-tight leading-none">
                    50%
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase mt-1">
                    ASISTENCIA
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full sm:w-auto flex-1 max-w-[240px] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-xs bg-green" />
                    <span className="text-foreground font-medium">Asistencias</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">2</span>
                    <span className="text-muted-foreground w-8 text-right">40%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-xs bg-red" />
                    <span className="text-foreground font-medium">Faltas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">2</span>
                    <span className="text-muted-foreground w-8 text-right">40%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-xs bg-amber" />
                    <span className="text-foreground font-medium">Pendientes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">1</span>
                    <span className="text-muted-foreground w-8 text-right">20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Actividad reciente */}
          <div className="rounded-2xl border border-border/80 bg-card dark:bg-sidebar/70 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Actividad reciente
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Últimas acciones del equipo
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-green/10 text-green-ink dark:text-green border border-green/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                En vivo
              </span>
            </div>

            {/* Empty State Box */}
            <div className="my-auto py-8 px-4 rounded-xl border border-dashed border-border/80 bg-muted/20 dark:bg-inset/40 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-muted/60 dark:bg-raised border border-border flex items-center justify-center text-muted-foreground mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-foreground">
                Aún no hay actividad en tu equipo
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-4 leading-relaxed">
                Asigna colaboradores a tus proyectos para ver sus marcajes aquí en tiempo real.
              </p>
              <button
                type="button"
                onClick={() => router.push("/pm/proyectos")}
                className="px-4 py-2 rounded-xl border border-border bg-card dark:bg-raised hover:bg-muted/60 text-foreground text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Gestionar proyectos
              </button>
            </div>

            <div className="pt-3 border-t border-border/40 text-center">
              <Link
                href="/pm/historial-asistencias"
                className="text-xs font-medium text-blue dark:text-blue hover:underline"
              >
                Ver todas las asistencias →
              </Link>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW (Resumen de asistencias & Acciones rápidas) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card: Resumen de asistencias (Bar Chart) */}
          <div className="rounded-2xl border border-border/80 bg-card dark:bg-sidebar/70 p-5 shadow-xs flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-base font-bold text-foreground tracking-tight">
                Resumen de asistencias
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Distribución de asistencias, faltas y solicitudes
              </p>
            </div>

            <div className="flex-1 flex flex-col justify-end pt-6 pb-2">
              {/* Bar visualization */}
              <div className="grid grid-cols-3 gap-6 items-end h-44 pb-3 border-b border-border/60">
                {/* Bar 1: Asistencias */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">2</span>
                  <div className="w-full max-w-[68px] h-32 rounded-t-lg bg-gradient-to-t from-green to-green opacity-90 transition-all hover:opacity-100" />
                </div>

                {/* Bar 2: Faltas */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">2</span>
                  <div className="w-full max-w-[68px] h-32 rounded-t-lg bg-gradient-to-t from-red to-red opacity-90 transition-all hover:opacity-100" />
                </div>

                {/* Bar 3: Pendientes */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">1</span>
                  <div className="w-full max-w-[68px] h-16 rounded-t-lg bg-gradient-to-t from-amber to-amber opacity-90 transition-all hover:opacity-100" />
                </div>
              </div>

              {/* Labels below bars */}
              <div className="grid grid-cols-3 gap-6 pt-3 text-center text-xs text-muted-foreground font-medium">
                <span>Asistencias</span>
                <span>Faltas</span>
                <span>Pendientes</span>
              </div>
            </div>
          </div>

          {/* Card: Acciones rápidas */}
          <div className="rounded-2xl border border-border/80 bg-card dark:bg-sidebar/70 p-5 shadow-xs flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-base font-bold text-foreground tracking-tight">
                Acciones rápidas
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gestiona el equipo de forma inmediata
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              {/* Col 1 */}
              <div className="space-y-3">
                <Link
                  href="/pm/registrar"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card dark:bg-surface/80 hover:bg-muted/40 transition-colors shadow-2xs group"
                >
                  <div className="w-8 h-8 rounded-lg bg-green/10 flex items-center justify-center text-green shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                    Registrar
                  </span>
                </Link>

                <Link
                  href="/pm/historial-asistencias"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card dark:bg-surface/80 hover:bg-muted/40 transition-colors shadow-2xs group"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet/10 flex items-center justify-center text-violet shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                    Asistencias
                  </span>
                </Link>

                <Link
                  href="/pm/proyectos"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card dark:bg-surface/80 hover:bg-muted/40 transition-colors shadow-2xs group"
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center text-cyan shrink-0">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                    Proyectos
                  </span>
                </Link>

                <Link
                  href="/pm/horarios"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card dark:bg-surface/80 hover:bg-muted/40 transition-colors shadow-2xs group"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                    Horarios
                  </span>
                </Link>
              </div>

              {/* Col 2 */}
              <div className="space-y-3">
                <Link
                  href="/pm/justificaciones"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card dark:bg-surface/80 hover:bg-muted/40 transition-colors shadow-2xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber/10 flex items-center justify-center text-amber shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                      Justificaciones
                    </span>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-amber text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    1
                  </span>
                </Link>

                <Link
                  href="/pm/alertas"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card dark:bg-surface/80 hover:bg-muted/40 transition-colors shadow-2xs group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red/10 flex items-center justify-center text-red shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                    Alertas
                  </span>
                </Link>

                <Link
                  href="/pm/historial-asistencias"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card dark:bg-surface/80 hover:bg-muted/40 transition-colors shadow-2xs group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue/10 flex items-center justify-center text-blue shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                    Historial
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
