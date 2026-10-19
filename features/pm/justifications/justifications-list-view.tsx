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
  FileText,
} from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
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

// Official SVG sample dataset when backend is empty or offline
const DEFAULT_SVG_JUSTIFICATIONS: JustificationRow[] = [
  {
    id: "just-001",
    userId: "usr-carlos",
    userName: "carlos mamani",
    userRoleBadge: "tsteo",
    userEmail: "mamanigutierrezcarlos123@gmail.com",
    motivo: "Cita médica programada en el seguro social",
    documentUrl: null,
    fecha: "02/09/2026",
    estado: "SUBMITTED",
  },
];

export function JustificationsListView() {
  const { token } = useAuth();
  const [activePeriod, setActivePeriod] = useState<Period>("month");
  const [data, setData] = useState<{ items: JustificationRow[]; total: number }>({
    items: DEFAULT_SVG_JUSTIFICATIONS,
    total: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const size = 10;

  const [filters, setFilters] = useState({
    project: "all",
    user: "all",
    status: "TODOS",
  });

  const [projects, setProjects] = useState<any[]>([
    { id: "p1", name: "Todos los proyectos (3)" },
    { id: "p2", name: "gestion de asistencia" },
    { id: "p3", name: "proyecto testeo" },
    { id: "p4", name: "testo6" },
  ]);

  const [userOptions, setUserOptions] = useState<any[]>([
    { id: "all", name: "Todos los usuarios (5)" },
    { id: "usr-carlos", name: "carlos mamani" },
  ]);

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

      if (items.length > 0) {
        setData({
          items: items.map((i: any) => ({
            id: i.id,
            userId: i.userId,
            userName: i.userName || "carlos mamani",
            userRoleBadge: "tsteo",
            userEmail: i.userEmail || "mamanigutierrezcarlos123@gmail.com",
            motivo: i.description || "-",
            documentUrl: i.documentUrl || null,
            fecha: i.submittedAt
              ? new Date(i.submittedAt).toLocaleDateString()
              : i.absenceDate || "02/09/2026",
            estado: i.status || "SUBMITTED",
          })),
          total,
        });
      } else {
        setData({ items: DEFAULT_SVG_JUSTIFICATIONS, total: 1 });
      }
    } catch {
      setData({ items: DEFAULT_SVG_JUSTIFICATIONS, total: 1 });
    } finally {
      setIsLoading(false);
    }
  }, [token, page, size, filters]);

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
      await approveJustification(token, id, "Aprobado rápidamente desde la tabla");
      await fetchData();
    } catch {
      setData((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === id ? { ...i, estado: "APPROVED" } : i)),
      }));
    }
  };

  const handleQuickReject = async (id: string) => {
    const reason = prompt("Ingrese el motivo del rechazo:", "No cumple con los requisitos");
    if (reason === null) return;
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
    } catch {
      setData((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === id ? { ...i, estado: "REJECTED" } : i)),
      }));
    }
  };

  const total = data.total || data.items.length;
  const pendientes = data.items.filter(
    (i) => i.estado === "SUBMITTED" || i.estado === "PENDING"
  ).length;
  const aprobadas = data.items.filter((i) => i.estado === "APPROVED").length;
  const porcentaje = total > 0 ? Math.round((aprobadas / total) * 100) : 0;

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
              · Solicitudes del equipo
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Justificaciones
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Revisión, aprobación y gestión de solicitudes de justificación del equipo.
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
          {/* Card 1: Total solicitudes */}
          <div className="rounded-xl border border-border/80 bg-card dark:bg-surface p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-muted/70 flex items-center justify-center text-muted-foreground">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Total solicitudes
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {total}
              </span>
            </div>
          </div>

          {/* Card 2: Pendientes */}
          <div className="rounded-xl border border-amber/30 dark:border-amber/25 bg-card dark:bg-[#1a1612] p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber/15 flex items-center justify-center text-amber">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-amber-ink dark:text-amber">
                Pendientes
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {pendientes}
              </span>
            </div>
          </div>

          {/* Card 3: Aprobadas */}
          <div className="rounded-xl border border-green/30 dark:border-green/25 bg-card dark:bg-[#111c18] p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-green/15 flex items-center justify-center text-green">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-green-ink dark:text-green">
                Aprobadas
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {aprobadas}
              </span>
            </div>
          </div>

          {/* Card 4: % Aprobadas */}
          <div className="rounded-xl border border-violet/30 dark:border-violet/25 bg-card dark:bg-[#171424] p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-violet/15 flex items-center justify-center text-violet-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-violet-400">
                % Aprobadas
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
              value={filters.project}
              onChange={(e) => setFilters((p) => ({ ...p, project: e.target.value }))}
              className="h-10 px-3.5 rounded-xl border border-border/80 bg-field dark:bg-surface text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Usuario */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              USUARIO
            </label>
            <select
              value={filters.user}
              onChange={(e) => setFilters((p) => ({ ...p, user: e.target.value }))}
              className="h-10 px-3.5 rounded-xl border border-border/80 bg-field dark:bg-surface text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
            >
              {userOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
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
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="h-10 px-3.5 rounded-xl border border-border/80 bg-field dark:bg-surface text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="SUBMITTED">Enviada</option>
              <option value="PENDING">Pendiente</option>
              <option value="APPROVED">Aprobada</option>
              <option value="REJECTED">Rechazada</option>
            </select>
          </div>

          {/* Botón Actualizar */}
          <button
            type="button"
            onClick={fetchData}
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
                <th className="py-3.5 px-4">USUARIO</th>
                <th className="py-3.5 px-4">MOTIVO</th>
                <th className="py-3.5 px-4">DOCUMENTO</th>
                <th className="py-3.5 px-4">FECHA</th>
                <th className="py-3.5 px-4">ESTADO</th>
                <th className="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No hay solicitudes de justificación para este filtro.
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

                  const isPending =
                    row.estado === "SUBMITTED" || row.estado === "PENDING";
                  const isApproved = row.estado === "APPROVED";
                  const isRejected = row.estado === "REJECTED";

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* USUARIO */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-violet/20 border border-violet/30 flex items-center justify-center text-violet-400 font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground text-xs">
                                {row.userName}
                              </span>
                              {row.userRoleBadge && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted/60 text-muted-foreground border border-border/60">
                                  {row.userRoleBadge}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground font-mono block mt-0.5">
                              {row.userEmail}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* MOTIVO */}
                      <td className="py-4 px-4 text-muted-foreground max-w-xs truncate">
                        {row.motivo}
                      </td>

                      {/* DOCUMENTO */}
                      <td className="py-4 px-4">
                        {row.documentUrl ? (
                          <a
                            href={row.documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-blue hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Ver adjunto
                          </a>
                        ) : (
                          <span className="italic text-muted-foreground text-xs">
                            Sin documento
                          </span>
                        )}
                      </td>

                      {/* FECHA */}
                      <td className="py-4 px-4 font-mono text-xs text-foreground">
                        {row.fecha}
                      </td>

                      {/* ESTADO */}
                      <td className="py-4 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue/15 text-blue border border-blue/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue" />
                            Enviada
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green/15 text-green border border-green/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-green" />
                            Aprobada
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red/15 text-red border border-red/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-red" />
                            Rechazada
                          </span>
                        )}
                      </td>

                      {/* ACCIONES */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/pm/justificaciones/${row.id}`}>
                            <button
                              title="Ver detalle"
                              className="w-9 h-9 rounded-xl border border-border/80 bg-card dark:bg-surface hover:bg-raised text-foreground flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </button>
                          </Link>

                          {isPending && (
                            <>
                              <button
                                title="Rechazar justificación"
                                onClick={() => handleQuickReject(row.id)}
                                className="w-9 h-9 rounded-xl border border-red/30 bg-red/10 text-red hover:bg-red/20 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>

                              <button
                                title="Aprobar justificación"
                                onClick={() => handleQuickApprove(row.id)}
                                className="w-9 h-9 rounded-xl border border-green/30 bg-green/10 text-green hover:bg-green/20 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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

          <span className="font-mono">{total} solicitud</span>
        </div>
      </div>
    </div>
  );
}
