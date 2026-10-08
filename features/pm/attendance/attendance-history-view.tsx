"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  X as XIcon,
  Camera,
  Download,
} from "lucide-react";
import PeriodSelector from "@/components/period-selector";
import PageHeader from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/atoms/status-badge";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAllProjects,
  getAllUsers,
  listTeamAttendance,
  exportAttendance,
} from "@/app/services/project.assistance.service";
import { LocationCell } from "@/components/atoms/LocationCell";
import { formatAvatarUrl } from "@/lib/avatar-url";

type Period =
  | "today"
  | "thisweek"
  | "month"
  | "currentperiod"
  | "3months"
  | "6months"
  | "9months"
  | "total"
  | "custom";

interface DateRange {
  fromDate: string;
  toDate: string;
  label: string;
  period: Period;
}

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
  if (!dateStr) return "—";
  const raw = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = raw.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

export function AttendanceHistoryView() {
  const { token } = useAuth();

  const [dateRange, setDateRange] = useState<DateRange>(getInitialMonthRange());
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);

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

  const handleProjectSelect = (id: string) => {
    setSelectedProjectId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_project_id", id);
      window.dispatchEvent(new CustomEvent("astc-project-changed", { detail: id }));
    }
  };

  useEffect(() => {
    if (!token) return;
    Promise.all([getAllProjects(token), getAllUsers(token)])
      .then(([pRes, uRes]) => {
        setProjects(pRes || []);
        setUsers(uRes || []);
      })
      .catch((err) => console.error("Error loading filters data:", err));
  }, [token]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await listTeamAttendance(
        token,
        selectedProjectId === "all" ? undefined : selectedProjectId,
        selectedUserId === "all" ? undefined : selectedUserId,
        selectedStatus === "all" ? undefined : selectedStatus,
        dateRange.fromDate,
        dateRange.toDate
      );
      setAttendanceRecords(data || []);
    } catch (err) {
      console.error("Error loading attendance history:", err);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    selectedProjectId,
    selectedUserId,
    selectedStatus,
    dateRange.fromDate,
    dateRange.toDate,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const userMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const u of users || []) {
      map[u.id] = u;
    }
    return map;
  }, [users]);

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of projects || []) {
      map[p.id] = p.name;
    }
    return map;
  }, [projects]);

  const formattedRows = useMemo(() => {
    return attendanceRecords.map((r) => {
      const u = userMap[r.userId];
      const userName = u
        ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || u.email
        : r.userName || `Usuario (${r.userId?.slice(0, 8) || "—"})`;
      const userEmail = u?.email || r.userEmail || "—";
      const projectName = r.projectId ? (projectMap[r.projectId] || r.projectName || "Proyecto Asignado") : "Gestión General";

      const checkInFormatted = r.checkIn ? r.checkIn.slice(0, 5) : (r.checkInTime ? r.checkInTime.slice(0, 5) : "—");
      const checkOutFormatted = r.checkOut ? r.checkOut.slice(0, 5) : (r.checkOutTime ? r.checkOutTime.slice(0, 5) : "—");

      return {
        ...r,
        userName,
        userEmail,
        projectName,
        checkInFormatted,
        checkOutFormatted,
      };
    });
  }, [attendanceRecords, userMap, projectMap]);

  const metrics = useMemo(() => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter((r) => ["PRESENTE", "ON_TIME", "EARLY", "ON_TIME_CHECKED_OUT", "EARLY_DEPARTURE"].includes(r.status)).length;
    const tardies = attendanceRecords.filter((r) => ["TARDE", "LATE", "LATE_CHECKED_OUT"].includes(r.status)).length;
    const absences = attendanceRecords.filter((r) => ["FALTA", "UNJUSTIFIED", "ABSENT"].includes(r.status)).length;
    const rate = total > 0 ? Math.round(((present + tardies) / total) * 100) : 0;

    return { total, present, tardies, absences, rate };
  }, [attendanceRecords]);

  const columns: Column<any>[] = [
    {
      key: "user",
      header: "COLABORADOR",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300 text-xs shrink-0 overflow-hidden border border-blue-200">
            {r.photoUrl ? (
              <img
                src={formatAvatarUrl(r.photoUrl) || ""}
                alt={r.userName || r.userEmail}
                className="w-full h-full object-cover"
              />
            ) : (
              (r.userName || r.userEmail || "U").charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground text-xs truncate">
              {r.userName || "—"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {r.userEmail || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "project",
      header: "PROYECTO",
      render: (r) => (
        <span className="text-xs font-semibold text-muted-foreground">
          {r.projectName || "—"}
        </span>
      ),
    },
    {
      key: "date",
      header: "FECHA",
      render: (r) => (
        <span className="text-xs font-bold text-foreground">
          {formatLocalDateString(r.date)}
        </span>
      ),
    },
    {
      key: "checkIn",
      header: "ENTRADA",
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {r.checkInFormatted}
          </span>
          {r.photoUrl && (
            <button
              onClick={() => {
                setPhotoModalUrl(formatAvatarUrl(r.photoUrl));
                setPhotoModalOpen(true);
              }}
              className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 mt-0.5"
            >
              <Camera className="w-3 h-3" /> Ver foto
            </button>
          )}
        </div>
      ),
    },
    {
      key: "checkOut",
      header: "SALIDA",
      render: (r) => (
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
          {r.checkOutFormatted}
        </span>
      ),
    },
    {
      key: "location",
      header: "UBICACIÓN",
      render: (r) => (
        <LocationCell
          latitude={r.latitude ?? r.checkInLatitude}
          longitude={r.longitude ?? r.checkInLongitude}
          address={r.address ?? r.checkInAddress}
        />
      ),
    },
    {
      key: "status",
      header: "ESTADO",
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  const handleExport = async () => {
    if (!token) return;
    try {
      const result = await exportAttendance(
        token,
        {
          projectId: selectedProjectId === "all" ? undefined : selectedProjectId,
          userId: selectedUserId === "all" ? undefined : selectedUserId,
          status: selectedStatus === "all" ? undefined : selectedStatus,
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
        }
      );
      if (result?.content) {
        const blob = new Blob([result.content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.fileName || "asistencias.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error exporting attendance:", err);
    }
  };

  return (
    <div className="min-h-screen bg-muted/50 pb-8">
      <div className="px-4 sm:px-6 py-4">
        <PageHeader
          title="Historial de Asistencias"
          description="Registro completo de ingresos, salidas y ubicaciones del equipo"
          categoryTag={{ badge: "JEFE DE PROYECTO", text: "Panel de Gestión" }}
          period={dateRange.period}
          dateRange={dateRange}
          onPeriodChange={setDateRange}
        />
      </div>

      <div className="p-4 max-w-7xl mx-auto space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SubMetricCard label="TOTAL" value={metrics.total} icon={<Clock className="w-5 h-5" />} />
          <SubMetricCard label="PRESENTES" value={metrics.present} color="green" icon={<CheckCircle2 className="w-5 h-5" />} />
          <SubMetricCard label="FALTAS / TARDANZAS" value={metrics.absences + metrics.tardies} color="red" icon={<XCircle className="w-5 h-5" />} />
          <SubMetricCard label="% ASISTENCIA" value={`${metrics.rate}%`} color="blue" icon={<TrendingUp className="w-5 h-5" />} />
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Filtros de Búsqueda
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="text-xs font-semibold gap-1.5 rounded-xl border-border h-8"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
              </Button>
              <Button
                onClick={handleExport}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 h-8 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Exportar CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Proyecto
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">Todos los Proyectos ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Colaborador
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">Todos los Colaboradores ({users.length})</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Estado de Marcado
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">Todos los Estados</option>
                <option value="PRESENTE">Presente</option>
                <option value="TARDE">Tarde</option>
                <option value="FALTA">Falta</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable
          data={formattedRows}
          columns={columns}
          loading={loading}
          emptyText="No se encontraron registros de asistencia para los filtros seleccionados"
        />
      </div>

      <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
            <DialogTitle className="text-sm font-bold text-foreground">
              Evidencia Fotográfica
            </DialogTitle>
            <DialogClose className="text-muted-foreground hover:text-foreground">
              <XIcon className="w-4 h-4" />
            </DialogClose>
          </div>
          {photoModalUrl ? (
            <div className="rounded-xl overflow-hidden border border-border bg-muted/30 max-h-[70vh] flex items-center justify-center">
              <img
                src={photoModalUrl}
                alt="Foto de asistencia"
                className="w-full h-auto object-contain"
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">
              No hay imagen disponible
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
