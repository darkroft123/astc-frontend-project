"use client";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/atoms/status-badge";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import { RefreshCw, ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, TrendingUp, X as XIcon } from "lucide-react";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import PeriodSelector from "@/components/period-selector";
import PageHeader from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/DataTable";
import { getAllProjects, getAllUsers } from "@/app/services/project.assistance.service";
import { getGraphQLUrl } from "@/lib/api-host";
import { LocationCell } from "@/components/atoms/LocationCell";
import { formatAvatarUrl } from "@/lib/avatar-url";


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

/* ===================== TYPES ===================== */
type Period = "today" | "thisweek" | "month" | "currentperiod" | "3months" | "6months" | "9months" | "total" | "custom";

interface DateRange {
  fromDate: string;
  toDate: string;
  label: string;
  period: Period;
}

type RawAttendanceItem = {
  id: string;
  userId: string;
  projectId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: string;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type AttendanceRow = {
  id: string;
  fecha: string;
  proyecto: string;
  usuario: string;
  estado: string;
  registrado: string;
  salida: string;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type AttendanceState = {
  rawItems: RawAttendanceItem[];
  total: number;
};

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getInitialRange(p: Period): DateRange {
  const today = new Date();
  if (p === "today") {
    return { fromDate: toDateString(today), toDate: toDateString(today), label: "Hoy", period: p };
  }
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  return { fromDate: toDateString(from), toDate: toDateString(today), label: "Este mes", period: p };
}

export function AttendanceManagementView() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceState | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<DateRange>(getInitialRange("month"));
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [page, setPage] = useState(1);

  const totalPages = attendance ? Math.ceil(attendance.total / 10) : 1;

  useEffect(() => {
    if (!token) return;
    getAllProjects(token).then(setProjects).catch((e) => console.error("[AttendanceManagement] Error loading projects:", e));
    getAllUsers(token).then(setUsers).catch((e) => console.error("[AttendanceManagement] Error loading users:", e));
  }, [token]);

  async function fetchAttendance() {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(getGraphQLUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: `
            query listTeamAttendance(
              $page: Int! $size: Int! $projectId: String $userId: String
              $fromDate: String $toDate: String $status: String
            ) {
              listTeamAttendance(
                page: $page size: $size projectId: $projectId userId: $userId
                fromDate: $fromDate toDate: $toDate status: $status
              ) {
                items { id userId projectId date checkIn checkOut status photoUrl latitude longitude }
              }
            }
          `,
          variables: {
            page: page - 1, size: 5,
            projectId: selectedProject === "all" ? null : selectedProject,
            userId: selectedUser === "all" ? null : selectedUser,
            fromDate: dateRange.fromDate, toDate: dateRange.toDate, status: null,
          },
        }),
      });

      const json = await res.json();
      const items: RawAttendanceItem[] = json.data?.listTeamAttendance?.items ?? [];

      setAttendance({ rawItems: items, total: items.length });
    } finally {
      setIsLoading(false);
    }
  }

  const registros: AttendanceRow[] = useMemo(() => {
    // 1. Build a robust user map from users list AND project members
    const userMap = new Map<string, any>();
    (users || []).forEach((u: any) => {
      if (u?.id) userMap.set(String(u.id).toLowerCase().trim(), u);
    });
    (projects || []).forEach((p: any) => {
      p.members?.forEach((m: any) => {
        if (m?.userId) {
          const uKey = String(m.userId).toLowerCase().trim();
          if (!userMap.has(uKey)) {
            userMap.set(uKey, {
              id: m.userId,
              username: m.user?.username || "usuario",
              firstName: m.user?.firstName || "",
              lastName: m.user?.lastName || "",
              roleName: m.role || "TEAM_MEMBER",
              avatarUrl: m.user?.avatarUrl || null,
            });
          }
        }
      });
    });

    // 2. Build a robust project map
    const projectMap = new Map<string, any>();
    (projects || []).forEach((p: any) => {
      if (p?.id) projectMap.set(String(p.id).toLowerCase().trim(), p);
    });

    return (attendance?.rawItems ?? []).map((item) => {
      const pId = String(item.projectId || "").toLowerCase().trim();
      const uId = String(item.userId || "").toLowerCase().trim();

      const proj = projectMap.get(pId);
      const projName = proj?.name || (item.projectId ? `Proyecto (${item.projectId.substring(0, 8)})` : "Sin proyecto");

      const userObj = userMap.get(uId);
      let uName = "Usuario Desconocido";
      if (userObj) {
        const parts = [userObj.firstName, userObj.lastName].filter(Boolean);
        uName = parts.length > 0 ? parts.join(" ") : userObj.username || userObj.email || "Usuario";
      } else if (item.userId) {
        uName = `Colaborador (${item.userId.substring(0, 8)})`;
      }

      const fecha = formatLocalDateString(item.date);

      const checkIn = item.checkIn
        ? item.checkIn.includes("T")
          ? new Date(item.checkIn).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
          : item.checkIn
        : "-";

      const checkOut = item.checkOut
        ? item.checkOut.includes("T")
          ? new Date(item.checkOut).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
          : item.checkOut
        : "-";

      return {
        id: item.id,
        fecha,
        proyecto: projName,
        usuario: uName,
        estado: item.status,
        registrado: checkIn,
        salida: checkOut,
        photoUrl: item.photoUrl,
        latitude: item.latitude,
        longitude: item.longitude,
      };
    });
  }, [attendance?.rawItems, projects, users]);

  const asistencias = registros.filter(r => r.estado === "PRESENTE" || r.estado === "CHECKED_IN" || r.estado === "CHECKED_OUT").length;
  const faltas = registros.filter(r => r.estado === "FALTA").length;
  const total = registros.length;
  const porcentajeAsistencia = total ? Math.round((asistencias / total) * 100) : 0;

  useEffect(() => {
    fetchAttendance();
  }, [dateRange, selectedProject, selectedUser, page, token]);

  const columns: Column<AttendanceRow>[] = [
    { key: "fecha", header: "FECHA", render: (r) => r.fecha },
    { key: "proyecto", header: "PROYECTO", render: (r) => r.proyecto },
    { key: "usuario", header: "USUARIO", render: (r) => r.usuario },
    { key: "estado", header: "ESTADO", render: (r) => <StatusBadge status={r.estado} /> },
    {
      key: "photoUrl",
      header: "FOTO",
      render: (r) => {
        const photoSrc = formatAvatarUrl(r.photoUrl);
        return photoSrc ? (
          <img
            src={photoSrc}
            alt="Foto de asistencia" className="w-16 h-16 rounded-lg object-cover border border-border cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all shadow-sm" onError={(e) => { (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center text-muted-foreground"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg><span class="text-[9px]">Sin foto</span></div>'; }}
            onClick={() => setSelectedPhotoUrl(photoSrc)}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-muted border border-border flex items-center justify-center">
            <span className="text-zinc-400 text-[10px]">Sin foto</span>
          </div>
        );
      },
    },
    { key: "registrado", header: "REGISTRO", hideOnMobile: true, render: (r) => <span className="font-mono text-slate-700 text-sm">{r.registrado}</span> },
    { key: "salida", header: "SALIDA", hideOnMobile: true, render: (r) => <span className="font-mono text-slate-700 text-sm">{r.salida}</span> },
    {
      key: "location",
      header: "UBICACIÓN",
      hideOnMobile: true,
      render: (r) => <LocationCell lat={r.latitude} lng={r.longitude} />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-5 py-5">

        {/* HEADER */}
        <PageHeader
          categoryTag={{ badge: "JEFE DE PROYECTO", text: "Panel de Gestión" }}
          title="Panel de Asistencias"
          description="Panel operativo para el control y monitoreo de la asistencia del equipo en tiempo real"
          period={dateRange.period}
          dateRange={dateRange}
          onPeriodChange={setDateRange}
        />

        {/* MÉTRICAS + FILTROS */}
        <div className="mt-5 flex flex-col lg:flex-row gap-5 items-end justify-between">

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SubMetricCard label="TOTAL" value={total} icon={<Clock className="w-5 h-5" />} />
            <SubMetricCard label="PRESENTES" value={asistencias} color="green" icon={<CheckCircle2 className="w-5 h-5" />} />
            <SubMetricCard label="FALTAS" value={faltas} color="red" icon={<XCircle className="w-5 h-5" />} />
            <SubMetricCard label="% ASISTENCIA" value={`${porcentajeAsistencia}%`} color="blue" icon={<TrendingUp className="w-5 h-5" />} />
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col">
              <label className="text-[9px] text-slate-500 mb-1">PROYECTO</label>
              <select
                className="border border-slate-300 rounded-md px-3 py-1.5 text-sm min-w-[160px]"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="all">Todos los proyectos</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[9px] text-slate-500 mb-1">USUARIO</label>
              <select
                className="border border-slate-300 rounded-md px-3 py-1.5 text-sm min-w-[160px]"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="all">Todos los usuarios</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>

            <Button
              onClick={fetchAttendance}
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
              data={registros}
              columns={columns}
              loading={isLoading}
              emptyText="No hay registros de asistencia"
              maxHeight="480px"
            />
        </div>

        {/* PAGINACIÓN */}
        <div className="flex justify-center mt-5">
          <div className="flex items-center gap-3 bg-card border border-slate-200 rounded-lg px-5 py-2 shadow-sm text-sm">
            <p>Página <span className="font-semibold">{page}</span> de {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-slate-500 text-xs">{total} registros</p>
          </div>
        </div>

        {/* Photo Lightbox */}
        <Dialog open={!!selectedPhotoUrl} onOpenChange={(open) => { if (!open) setSelectedPhotoUrl(null); }}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] p-2 sm:p-4" showCloseButton={false}>
            <DialogTitle className="sr-only">Foto de Asistencia</DialogTitle>
            <DialogClose className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
              <XIcon className="w-5 h-5 text-white" />
              <span className="sr-only">Cerrar</span>
            </DialogClose>
            {selectedPhotoUrl && (
              <div className="flex items-center justify-center w-full h-full">
                <img
                  src={selectedPhotoUrl}
                  alt="Foto de asistencia" className="max-w-full max-h-[85vh] object-contain rounded" onError={(e) => { (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center text-muted-foreground"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg><span class="text-[9px]">Sin foto</span></div>'; }}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
