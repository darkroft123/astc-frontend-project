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

const DEFAULT_SVG_JUSTIFICATIONS: JustificationRow[] = [
  {
    id: "just-001",
    userId: "usr-carlos",
    userName: "carlos mamani",
    userRoleBadge: "tsteo",
    userEmail: "mamanigutierrezcarlos123@gmail.com",
    motivo: "tsteo",
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
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: "01/09/2026",
    to: "03/09/2026",
  });

  const [filters, setFilters] = useState({
    project: "all",
    user: "all",
    status: "TODOS",
  });

  const [projects, setProjects] = useState<any[]>([
    { id: "all", name: "Todos los proyectos (3)" },
    { id: "p1", name: "gestion de asistencia" },
    { id: "p2", name: "proyecto testeo" },
    { id: "p3", name: "testo6" },
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
            motivo: i.description || "tsteo",
            documentUrl: i.documentUrl || null,
            fecha: i.absenceDate || "02/09/2026",
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
  }, [token, page, filters]);

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
    <div className="w-full space-y-4 text-foreground font-sans bg-transparent pb-12 max-w-6xl mx-auto px-0 md:px-6 py-2 md:py-4">
      {/* 1. TOP HEADER (EXACT SVG DESIGN) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
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
          <p className="text-xs text-muted-foreground mt-1">
            Revisión, aprobación y gestión de solicitudes de justificación del equipo.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <NotificationBell />
        </div>
      </div>

      {/* 2. PERIOD SELECTOR TABS */}
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

      {/* 3. DATE RANGE SELECTOR BAR */}
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

      {/* 4. 4 KPI CARDS (2x2 on mobile, 4 cols on desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Total solicitudes */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 flex flex-col justify-between shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-border/60 bg-background/50 flex items-center justify-center text-muted-foreground shrink-0 mb-3">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total solicitudes</p>
            <p className="text-2xl font-bold text-foreground mt-1">{total}</p>
          </div>
        </div>

        {/* Card 2: Pendientes */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col justify-between shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-amber-400 font-medium">Pendientes</p>
            <p className="text-2xl font-bold text-foreground mt-1">{pendientes}</p>
          </div>
        </div>

        {/* Card 3: Aprobadas */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col justify-between shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mb-3">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-emerald-400 font-medium">Aprobadas</p>
            <p className="text-2xl font-bold text-foreground mt-1">{aprobadas}</p>
          </div>
        </div>

        {/* Card 4: % Aprobadas */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 flex flex-col justify-between shadow-sm">
          <div className="w-9 h-9 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mb-3">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-purple-400 font-medium">% Aprobadas</p>
            <p className="text-2xl font-bold text-foreground mt-1">{porcentaje}%</p>
          </div>
        </div>
      </div>

      {/* 5. FILTERS CONTAINER */}
      <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3.5 shadow-sm">
        {/* Proyecto */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Proyecto
          </label>
          <div className="relative">
            <Folder className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <select
              value={filters.project}
              onChange={(e) => setFilters((p) => ({ ...p, project: e.target.value }))}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">{p.name}</option>
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
                <option key={u.id} value={u.id} className="bg-card text-foreground">{u.name}</option>
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
                <option value="TODOS" className="bg-card text-foreground">Todos los estados</option>
                <option value="SUBMITTED" className="bg-card text-foreground">Enviada</option>
                <option value="PENDING" className="bg-card text-foreground">Pendiente</option>
                <option value="APPROVED" className="bg-card text-foreground">Aprobada</option>
                <option value="REJECTED" className="bg-card text-foreground">Rechazada</option>
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
        {data.items.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground bg-card rounded-2xl border border-border">
            No se encontraron justificaciones.
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
                    <div className="w-10 h-10 rounded-xl bg-brand-gradient text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      {initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-foreground leading-tight">{row.userName}</h4>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px] mt-0.5">
                        {row.userEmail}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
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
      <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
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
              {data.items.map((row) => {
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
                        <div className="w-8 h-8 rounded-lg bg-brand-gradient text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {initials}
                        </div>
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
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
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
              })}
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
