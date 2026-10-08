"use client";
function getInitialMonthRange(): DateRange {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  return {
    fromDate: formatDate(from),
    toDate: formatDate(today),
    label: "Este mes",
    period: "month",
  };
}


import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/atoms/status-badge";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import { MapPin, Clock, Eye, Users, RefreshCw, AlertTriangle, CheckCircle2, TrendingUp, FolderKanban, Trash2, CheckCheck } from "lucide-react";
import PeriodSelector from "@/components/period-selector";
import PageHeader from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/DataTable";
import { LocationCell } from "@/components/atoms/LocationCell";
import { getAllProjects, getAllUsers, cancelAlert, approveAlert } from "@/app/services/project.assistance.service";

import { getGraphQLUrl } from "@/lib/api-host";
import { formatAlertType, formatAlertMessage, formatUserName } from "@/lib/formatters";

const LIST_ATTENDANCE_ALERTS = `
  query listAttendanceAlerts(
    $page: Int!
    $size: Int!
    $status: String
    $type: String
    $fromDate: String
    $toDate: String
  ) {
    listAttendanceAlerts(
      page: $page
      size: $size
      status: $status
      type: $type
      fromDate: $fromDate
      toDate: $toDate
    ) {
      items {
        id
        type
        status
        message
        projectId
        userId
        createdAt
        latitude
        longitude
      }
      total
    }
  }
`;

type Period = "today" | "thisweek" | "month" | "currentperiod" | "3months" | "6months" | "9months" | "total" | "custom";

interface DateRange {
  fromDate: string;
  toDate: string;
  label: string;
  period: Period;
}

type AlertRow = {
  id: string;
  type?: string | null;
  status?: string | null;
  message?: string | null;
  projectId?: string | null;
  userId?: string | null;
  createdAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

interface AlertsPage {
  items: AlertRow[];
  total: number;
}

function parseAlertDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const s = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : `${dateStr}Z`;
    const d = new Date(s);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("es-PE");
  } catch {
    return dateStr;
  }
}

export function AlertsListView() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [alertsData, setAlertsData] = useState<AlertsPage>({ items: [], total: 0 });
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const size = 5;

  const [dateRange, setDateRange] = useState<DateRange>(getInitialMonthRange());

  const [filters, setFilters] = useState({
    project: "all",
    status: "all",
    user: "all",
  });

  // Sync with global project selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selected_project_id");
      if (saved) setFilters((prev) => ({ ...prev, project: saved }));

      const handler = (e: Event) => {
        const customEvent = e as CustomEvent<string>;
        const newId = customEvent.detail ?? localStorage.getItem("selected_project_id");
        if (newId !== undefined && newId !== null) {
          setFilters((prev) => ({ ...prev, project: newId }));
          setPage(1);
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

  const handleProjectFilterChange = (id: string) => {
    setFilters((prev) => ({ ...prev, project: id }));
    setPage(1);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_project_id", id);
      window.dispatchEvent(new CustomEvent("astc-project-changed", { detail: id }));
    }
  };

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getAllProjects(token).catch(() => []),
      getAllUsers(token).catch(() => []),
    ]).then(([projData, userData]) => {
      setProjects(projData || []);
      setUsers(userData || []);
    });
  }, [token]);

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(getGraphQLUrl(), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: LIST_ATTENDANCE_ALERTS,
          variables: {
            page: 0,
            size: 100, // Fetch more to allow accurate client filtering
            status: filters.status === "all" ? null : filters.status,
            type: null,
            fromDate: dateRange.fromDate,
            toDate: dateRange.toDate,
          },
        }),
      });

      const json = await res.json();
      const rawItems = json?.data?.listAttendanceAlerts?.items || [];
      
      let filteredItems = rawItems;
      if (filters.project !== "all") {
        filteredItems = filteredItems.filter((a: AlertRow) => a.projectId === filters.project);
      }
      if (filters.user !== "all") {
        filteredItems = filteredItems.filter((a: AlertRow) => a.userId === filters.user);
      }

      setAlertsData({
        items: filteredItems,
        total: filteredItems.length,
      });
    } catch {
      setAlertsData({ items: [], total: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [filters, dateRange, token]);

  useEffect(() => { setPage(1); }, [filters, dateRange]);
  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleDismissAlert = async (alertId: string) => {
    if (!token) return;
    if (!confirm("¿Deseas descartar/limpiar esta alerta?")) return;
    try {
      await cancelAlert(token, alertId);
      await fetchAlerts();
    } catch (err) {
      console.error("Error descartando alerta:", err);
    }
  };

  const total = alertsData.total;
  const pendientes = alertsData.items.filter(a => a.status === "PENDING").length;
  const revisadas = alertsData.items.filter(a => a.status === "REVIEWED" || a.status === "APPROVED").length;
  const porcentaje = total ? Math.round((revisadas / total) * 100) : 0;

  const totalPages = Math.max(1, Math.ceil(total / size));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * size;
    return alertsData.items.slice(start, start + size);
  }, [alertsData.items, page, size]);

  const columns: Column<AlertRow>[] = [
    { key: "type", header: "TIPO", render: (r) => <span className="font-semibold text-xs text-slate-800">{formatAlertType(r.type)}</span> },
    { key: "status", header: "ESTADO", render: (r) => <StatusBadge status={(r.status ?? "PENDING") as any} /> },
    { key: "message", header: "MENSAJE", render: (r) => <span className="text-slate-600 text-xs line-clamp-2 max-w-[280px]">{formatAlertMessage(r.message, r.type)}</span> },
    { 
      key: "project", 
      header: "PROYECTO",
      hideOnMobile: true, 
      render: (r) => {
        const proj = projects.find((p) => p.id === r.projectId);
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <FolderKanban className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate max-w-[140px]">{proj?.name || r.projectId || "-"}</span>
          </div>
        );
      } 
    },
    { 
      key: "date", 
      header: "FECHA", 
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{parseAlertDate(r.createdAt)}</span>
        </div>
      ) 
    },
    { 
      key: "location", 
      header: "UBICACIÓN", 
      hideOnMobile: true, 
      render: (r) => <LocationCell lat={r.latitude} lng={r.longitude} />
    },
    { 
      key: "action", 
      header: "ACCIONES", 
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Link href={`/pm/alertas/${r.id}`}>
            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs font-medium">
              <Eye className="w-3 h-3 mr-1" /> Ver
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            title="Descartar / Limpiar alerta"
            onClick={() => handleDismissAlert(r.id)}
            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) 
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-5 py-5">

        {/* HEADER */}
        <PageHeader
          categoryTag={{ badge: "JEFE DE PROYECTO", text: "Panel de Gestión" }}
          title="Alertas de Asistencia"
          description="Monitoreo y gestión de incidentes de asistencia, ubicaciones y alertas del personal"
          period={dateRange.period}
          dateRange={dateRange}
          onPeriodChange={setDateRange}
        />

        {/* MÉTRICAS PEQUEÑAS (IZQUIERDA) + FILTROS (DERECHA) */}
        <div className="mt-5 flex flex-col lg:flex-row gap-5 items-end justify-between">

          {/* 4 CUADROS MUY PEQUEÑOS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SubMetricCard label="TOTAL" value={total} icon={<AlertTriangle className="w-5 h-5" />} />
            <SubMetricCard label="PENDIENTES" value={pendientes} color="red" icon={<Clock className="w-5 h-5" />} />
            <SubMetricCard label="REVISADAS" value={revisadas} color="green" icon={<CheckCircle2 className="w-5 h-5" />} />
            <SubMetricCard label="% RESUELTAS" value={`${porcentaje}%`} color="blue" icon={<TrendingUp className="w-5 h-5" />} />
          </div>

          {/* FILTROS A LA DERECHA */}
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col">
              <label className="text-[9px] text-slate-500 mb-1 font-semibold">PROYECTO</label>
              <select
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-full sm:w-48 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.project}
                onChange={(e) => setFilters({ ...filters, project: e.target.value })}
              >
                <option value="all">Todos los proyectos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[9px] text-slate-500 mb-1 font-semibold">ESTADO</label>
              <select
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-full sm:w-36 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">Todos</option>
                <option value="PENDING">Pendiente</option>
                <option value="REVIEWED">Revisado</option>
                <option value="APPROVED">Aprobado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[9px] text-slate-500 mb-1 font-semibold">USUARIO</label>
              <select
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-full sm:w-44 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.user}
                onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              >
                <option value="all">Todos los usuarios</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || u.email}
                  </option>
                ))}
              </select>
            </div>

            <Button 
              onClick={fetchAlerts} 
              variant="ghost" 
              className="h-8 px-3 gap-1.5 text-xs border border-slate-200 bg-card text-zinc-700 hover:bg-slate-50 self-end rounded-lg shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* TABLA */}
        <div className="mt-6">
          <DataTable
            data={paginatedItems}
            columns={columns}
            loading={isLoading}
            emptyText="Sin alertas registradas"
            maxHeight="480px"
          />
        </div>

        {/* PAGINACIÓN */}
        <div className="flex justify-center mt-5">
          <div className="flex items-center gap-3 bg-card border border-slate-200 rounded-lg px-5 py-2 shadow-sm text-sm">
            <p>Página <span className="font-semibold">{page}</span> de {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-8 p-0" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p-1))}>Anterior</Button>
              <Button variant="outline" size="sm" className="h-8 p-0" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
            </div>
            <p className="text-slate-500 text-xs">{total} registros</p>
          </div>
        </div>
      </div>
    </div>
  );
}

