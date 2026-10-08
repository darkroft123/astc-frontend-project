"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw, Clock, CheckCircle2, AlertTriangle, TrendingUp, CheckCheck, XCircle, Trash2 } from "lucide-react";
import PeriodSelector from "@/components/period-selector";
import PageHeader from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/DataTable";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import { StatusBadge } from "@/components/atoms/status-badge";
import { getAllUsers, getAllProjects, approveJustification, rejectJustification } from "@/app/services/project.assistance.service";
import { getGraphQLUrl } from "@/lib/api-host";
import { formatUserName } from "@/lib/formatters";

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

function formatLocalDateString(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  if (dateStr.includes("T")) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } else {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }
}

const LIST_JUSTIFICATIONS_PM = `
  query listJustificationsPM(
    $page: Int!
    $size: Int!
    $userId: String
    $status: String
    $fromDate: String
    $toDate: String
  ) {
    listJustificationsPM(
      page: $page
      size: $size
      userId: $userId
      status: $status
      fromDate: $fromDate
      toDate: $toDate
    ) {
      items {
        id
        userId
        description
        documentUrl
        status
        submittedAt
        absenceDate
        absenceType
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

type JustificationRow = {
  id: string;
  usuario: string;
  motivo: string;
  fecha: string;
  estado: string;
  documentUrl?: string | null;
};

export function JustificationsListView() {
  const { token } = useAuth();
  const [data, setData] = useState({ items: [] as JustificationRow[], total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const size = 5;

  const [dateRange, setDateRange] = useState<DateRange>(getInitialMonthRange());

  const [filters, setFilters] = useState({
    project: "all",
    user: "all",
    status: "TODOS",
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [userOptions, setUserOptions] = useState<{ id: string; name: string }[]>([]);

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

  const fetchData = useCallback(async () => {
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
          query: LIST_JUSTIFICATIONS_PM,
          variables: {
            page: page - 1,
            size,
            userId: filters.user === "all" ? null : filters.user,
            status: filters.status === "TODOS" ? null : filters.status,
            fromDate: dateRange.fromDate,
            toDate: dateRange.toDate,
          },
        }),
      });

      const json = await res.json();
      const result = json.data?.listJustificationsPM ?? { items: [], total: 0 };

      setData({ items: result.items, total: result.total });
    } catch {
      setData({ items: [], total: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [page, filters, dateRange, token]);

  useEffect(() => { setPage(1); }, [filters, dateRange]);
  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getAllUsers(token).catch(() => []),
      getAllProjects(token).catch(() => []),
    ]).then(([users, projs]) => {
      const map = new Map<string, string>();
      const opts: { id: string; name: string }[] = [];
      (users || []).forEach((u: any) => {
        const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || u.id;
        map.set(String(u.id).toLowerCase(), name);
        opts.push({ id: u.id, name });
      });
      (projs || []).forEach((p: any) => {
        p.members?.forEach((m: any) => {
          if (m?.userId && m?.user) {
            const uKey = String(m.userId).toLowerCase();
            if (!map.has(uKey)) {
              const name = [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") || m.user.username || m.userId;
              map.set(uKey, name);
              opts.push({ id: m.userId, name });
            }
          }
        });
      });
      setUserMap(map);
      setUserOptions(opts);
      setProjects(projs || []);
    });
  }, [token]);

  const handleQuickApprove = async (id: string) => {
    if (!token) return;
    try {
      await approveJustification(token, id, "Aprobado rápidamente desde la tabla");
      await fetchData();
    } catch (err) {
      console.error("Error aprobando justificante:", err);
    }
  };

  const handleQuickReject = async (id: string) => {
    if (!token) return;
    const reason = prompt("Ingrese el motivo del rechazo:", "No cumple los requisitos");
    if (reason === null) return;
    try {
      await rejectJustification(token, id, reason);
      await fetchData();
    } catch (err) {
      console.error("Error rechazando justificante:", err);
    }
  };

  const rows = useMemo(() => {
    return data.items.map((i: any) => ({
      id: i.id,
      usuario: formatUserName(i.userId, userMap),
      motivo: i.description ?? "-",
      fecha: i.submittedAt
        ? formatLocalDateString(i.submittedAt)
        : i.absenceDate
          ? formatLocalDateString(i.absenceDate)
          : "-",
      estado: i.status,
      documentUrl: i.documentUrl ?? null,
    }));
  }, [data.items, userMap]);

  const total = data.total;
  const pendientes = rows.filter(r => r.estado === "SUBMITTED" || r.estado === "PENDING").length;
  const aprobadas = rows.filter(r => r.estado === "APPROVED").length;
  const rechazadas = rows.filter(r => r.estado === "REJECTED").length;
  const porcentaje = total ? Math.round((aprobadas / total) * 100) : 0;

  const totalPages = Math.ceil(total / size);

  const columns: Column<JustificationRow>[] = [
    { key: "usuario", header: "USUARIO", render: (r) => <span className="font-medium text-xs text-slate-800">{r.usuario}</span> },
    { key: "motivo", header: "MOTIVO", render: (r) => <span className="text-slate-600 text-xs line-clamp-2 max-w-md">{r.motivo}</span> },
    { key: "fecha", header: "FECHA", render: (r) => <span className="text-slate-700 text-xs">{r.fecha}</span> },
    { key: "estado", header: "ESTADO", render: (r) => <StatusBadge status={r.estado as any} /> },
    {
      key: "acciones",
      header: "ACCIONES",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Link href={`/pm/justificaciones/${r.id}`}>
            <Button size="sm" variant="outline" title="Ver detalle" className="h-7 w-7 p-0 border-slate-200 text-slate-600 hover:bg-slate-50">
              <Eye className="w-3.5 h-3.5" />
            </Button>
          </Link>
          {(r.estado === "SUBMITTED" || r.estado === "PENDING") && (
            <>
              <Button
                size="sm"
                variant="ghost"
                title="Aprobar justificación"
                onClick={() => handleQuickApprove(r.id)}
                className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="Rechazar justificación"
                onClick={() => handleQuickReject(r.id)}
                className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
              >
                <XCircle className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-5 py-5">

        {/* HEADER */}
        <PageHeader
          categoryTag={{ badge: "JEFE DE PROYECTO", text: "Panel de Gestión" }}
          title="Justificaciones"
          description="Revisión, aprobación y gestión de solicitudes de justificación del equipo"
          period={dateRange.period}
          dateRange={dateRange}
          onPeriodChange={setDateRange}
        />

        {/* MÉTRICAS + FILTROS */}
        <div className="mt-5 flex flex-col lg:flex-row gap-5 items-end justify-between">

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SubMetricCard label="TOTAL" value={total} icon={<Clock className="w-5 h-5" />} />
            <SubMetricCard label="PENDIENTES" value={pendientes} color="amber" icon={<AlertTriangle className="w-5 h-5" />} />
            <SubMetricCard label="APROBADAS" value={aprobadas} color="green" icon={<CheckCircle2 className="w-5 h-5" />} />
            <SubMetricCard label="% APROBADAS" value={`${porcentaje}%`} color="blue" icon={<TrendingUp className="w-5 h-5" />} />
          </div>

          <div className="flex flex-wrap gap-3 items-end">

            <div className="flex flex-col">
              <label className="text-[9px] text-slate-500 mb-1">PROYECTO</label>
              <select
                className="border border-slate-300 rounded-md px-3 py-1.5 text-sm min-w-[150px]"
                value={filters.project}
                onChange={(e) => handleProjectFilterChange(e.target.value)}
              >
                <option value="all">Todos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[9px] text-slate-500 mb-1">USUARIO</label>
              <select
                className="border border-slate-300 rounded-md px-3 py-1.5 text-sm min-w-[150px]"
                value={filters.user}
                onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              >
                <option value="all">Todos</option>
                {userOptions.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[9px] text-slate-500 mb-1">ESTADO</label>
              <select
                className="border border-slate-300 rounded-md px-3 py-1.5 text-sm min-w-[130px]"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="SUBMITTED">Pendientes</option>
                <option value="PENDING">Borradores</option>
                <option value="APPROVED">Aprobadas</option>
                <option value="REJECTED">Rechazadas</option>
                <option value="OBSERVATION">En observación</option>
                <option value="TODOS">Todos</option>
              </select>
            </div>

            <Button
              onClick={fetchData}
              variant="ghost"
              className="h-9 px-4 gap-2 text-sm border border-slate-200 bg-card text-zinc-700 hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* TABLA */}
        <div className="mt-6">
          <DataTable
            data={rows}
            columns={columns}
            loading={isLoading}
            emptyText="No hay justificaciones en este período"
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
