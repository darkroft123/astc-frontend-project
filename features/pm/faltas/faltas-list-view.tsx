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


import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { Button } from "@/components/ui/button";
import { Eye, FileText, RefreshCw, Clock, CheckCircle2, XCircle } from "lucide-react";
import PeriodSelector from "@/components/period-selector";
import PageHeader from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/DataTable";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import { getGraphQLUrl } from "@/lib/api-host";
import { getAllUsers } from "@/app/services/project.assistance.service";
import { formatUserName } from "@/lib/formatters";

const LIST_TEAM_ABSENCES = `
  query listTeamAbsences(
    $page: Int!
    $size: Int!
    $projectId: String
    $userId: String
    $fromDate: String
    $toDate: String
    $type: String
    $justified: Boolean
  ) {
    listTeamAbsences(
      page: $page
      size: $size
      projectId: $projectId
      userId: $userId
      fromDate: $fromDate
      toDate: $toDate
      type: $type
      justified: $justified
    ) {
      items {
        id
        userId
        projectId
        date
        type
        justified
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

type AbsenceRow = {
  id: string;
  usuario: string;
  fecha: string;
  tipo: string;
  justificada: boolean;
};

export function FaltasListView() {
  const { token } = useAuth();
  const [data, setData] = useState({ items: [] as AbsenceRow[], total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const size = 10;

  const [dateRange, setDateRange] = useState<DateRange>(getInitialMonthRange());

  const [justifiedFilter, setJustifiedFilter] = useState<string>("all");
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

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
          query: LIST_TEAM_ABSENCES,
          variables: {
            page: page - 1,
            size,
            projectId: null,
            userId: null,
            fromDate: dateRange.fromDate,
            toDate: dateRange.toDate,
            type: null,
            justified: justifiedFilter === "all" ? null : justifiedFilter === "justified",
          },
        }),
      });

      const json = await res.json();
      const result = json.data?.listTeamAbsences ?? { items: [], total: 0 };

      const mapped = result.items.map((i: any) => ({
        id: i.id,
        usuario: formatUserName(i.userId, userMap),
        fecha: i.date ?? "-",
        tipo: i.type ?? "-",
        justificada: i.justified ?? false,
      }));

      setData({ items: mapped, total: result.total });
    } catch {
      setData({ items: [], total: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [page, justifiedFilter, dateRange, token]);

  useEffect(() => { setPage(1); }, [justifiedFilter, dateRange]);
  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!token) return;
    getAllUsers(token).then(users => {
      const map = new Map<string, string>();
      users.forEach(u => map.set(u.id, [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || u.id));
      setUserMap(map);
    }).catch(() => {});
  }, [token]);

  const ABSENCE_TYPE_LABELS: Record<string, string> = {
    FALTA_AUTOMATICA: "Falta Automática",
    UNJUSTIFIED: "Sin justificar",
    FALTA: "Falta",
    TARDE: "Tardanza",
    TARDANZA: "Tardanza",
    TEMPRANO: "Salida temprana",
    MEDICAL: "Médica",
  };

  const total = data.total;
  const justificadas = data.items.filter(r => r.justificada).length;
  const porJustificar = total - justificadas;

  const totalPages = Math.ceil(total / size);

  const columns: Column<AbsenceRow>[] = [
    { key: "usuario", header: "USUARIO", render: (r) => <span className="font-medium">{r.usuario}</span> },
    { key: "fecha", header: "FECHA", render: (r) => <span className="text-slate-700">{r.fecha}</span> },
    { key: "tipo", header: "TIPO", render: (r) => (
      <span className="text-slate-600 text-sm">{ABSENCE_TYPE_LABELS[r.tipo] || r.tipo}</span>
    )},
    {
      key: "justificada",
      header: "ESTADO",
      render: (r) => (
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium inline-block ${
          r.justificada
            ? "bg-emerald-100 text-emerald-700"
            : "bg-red-100 text-red-700"
        }`}>
          {r.justificada ? "JUSTIFICADA" : "SIN JUSTIFICAR"}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "ACCIONES",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Link href={`/pm/justificaciones`}>
            <Button size="sm" variant="outline" className="h-7 w-8 p-0" title="Ver justificaciones">
              <FileText className="w-3.5 h-3.5" />
            </Button>
          </Link>
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
          title="Faltas del Equipo"
          description="Control y seguimiento de ausencias registradas por los miembros del equipo"
          period={dateRange.period}
          dateRange={dateRange}
          onPeriodChange={setDateRange}
        />

        {/* MÉTRICAS + FILTROS */}
        <div className="mt-5 flex flex-col lg:flex-row gap-5 items-end justify-between">

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <SubMetricCard label="TOTAL FALTAS" value={total} icon={<Clock className="w-5 h-5" />} />
            <SubMetricCard label="JUSTIFICADAS" value={justificadas} color="green" icon={<CheckCircle2 className="w-5 h-5" />} />
            <SubMetricCard label="SIN JUSTIFICAR" value={porJustificar} color="red" icon={<XCircle className="w-5 h-5" />} />
          </div>

          <div className="flex items-center gap-2">
            <select
              className="text-sm border-border bg-card border rounded-lg px-3 py-1.5 text-slate-600"
              value={justifiedFilter}
              onChange={(e) => setJustifiedFilter(e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="justified">Justificadas</option>
              <option value="unjustified">Sin Justificar</option>
            </select>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="h-8">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* TABLA */}
        <div className="mt-5 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <DataTable<AbsenceRow>
            columns={columns}
            data={data.items}
            loading={isLoading}
            keyExtractor={(r) => r.id}
          />

          {/* PAGINACIÓN */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100">
              <p className="text-xs text-slate-400">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="h-7 text-xs"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="h-7 text-xs"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
