"use client";
import { useEffect, useMemo, useState } from "react";

import {
  Search, Calendar as CalendarIcon, RefreshCw, ChevronLeft, ChevronRight, Loader2, Clock, CheckCircle2, XCircle, TrendingUp, X as XIcon, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { StatusBadge } from "@/components/atoms/status-badge";
import PageHeader from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/DataTable";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";

import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { listAttendance } from "@/app/services/assistance.service";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { formatLocalTime, getEffectiveTimezone } from "@/lib/timezone";
import { LocationCell } from "@/components/atoms/LocationCell";
import { formatAvatarUrl } from "@/lib/avatar-url";

/* ================= TYPES ================= */

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

type AttendanceStatus = "PRESENTE" | "FALTA" | "TARDE";

type AttendanceRecord = {
  id: string;
  userId?: string | null;
  projectId?: string | null;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: AttendanceStatus;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
};

/* ================= HELPERS ================= */

function formatLocalTimeWrapper(value?: string | null, tz?: string | null) {
  return formatLocalTime(value, tz);
}

function formatLocation(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return "-";
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function getMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function getInitialRange(p: Period): DateRange {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  if (p === "today") {
    const d = formatDate(today);
    return { fromDate: d, toDate: d, label: "Hoy", period: p };
  }

  if (p === "month") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      fromDate: formatDate(from),
      toDate: formatDate(today),
      label: "Este mes",
      period: p,
    };
  }

  const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
  return {
    fromDate: formatDate(firstDayOfYear),
    toDate: formatDate(today),
    label: "Este año",
    period: p,
  };
}

/* ================= COMPONENT ================= */

export default function AttendanceHistoryPage() {
  const { hydrated, token, checkingAuth, user } =
    useAuthGuard(["PROJECT_MANAGER"]);
  const { project, loadingProject } = useUserProject();

  const isBlocked = !hydrated || checkingAuth || !token || !user;

  const [period, setPeriod] = useState<Period>("month");
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getInitialRange("month")
  );

  const [searchDate, setSearchDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    total: 0,
    size: 5,
  });

  const projectTimezone = getEffectiveTimezone(project?.timezone);

  const filteredRecords = useMemo(() => {
    if (!searchDate.trim()) return attendanceRecords;
    return attendanceRecords.filter((r) =>
      r.date.includes(searchDate.trim())
    );
  }, [attendanceRecords, searchDate]);

  const metrics = useMemo(() => {
    const total = pagination.total;
    const presentes = attendanceRecords.filter(r => r.status === "PRESENTE").length;
    const faltas = attendanceRecords.filter(r => r.status === "FALTA").length;
    const rate = total > 0 ? Math.round((presentes / total) * 100) : 0;
    
    return { total, presentes, faltas, rate };
  }, [attendanceRecords, pagination.total]);

  /* ================= FETCH ================= */

  useEffect(() => {
    if (isBlocked) return;

    const load = async () => {
      try {
        setLoading(true);

        const res = await listAttendance(token!, {
          page: currentPage - 1,
          size: 5,
          projectId: project?.id ?? null,
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
          status: statusFilter !== "all" ? statusFilter : null,
        });

        const items = res?.items ?? [];
        const total = res?.total ?? items.length;

        setAttendanceRecords(items);

        setPagination({
          totalPages: Math.max(1, Math.ceil(total / 10)),
          total,
          size: 5,
        });
      } catch (err) {
        console.error("Error loading attendance:", err);
        setAttendanceRecords([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [
    isBlocked,
    token,
    currentPage,
    dateRange.fromDate,
    dateRange.toDate,
    statusFilter,
    project,
  ]);

  const handlePeriodChange = (newRange: DateRange) => {
    setDateRange(newRange);
    setPeriod(newRange.period);
    setCurrentPage(1);
  };

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "date",
      header: "FECHA",
      render: (r) => (
        <span className="font-medium text-foreground">{r.date}</span>
      ),
    },
    {
      key: "checkIn",
      header: "ENTRADA",
      render: (r) => (
        <span className="text-zinc-600 font-mono text-sm">{formatLocalTimeWrapper(r.checkIn, projectTimezone)}</span>
      ),
    },
    {
      key: "checkOut",
      header: "SALIDA",
      render: (r) => (
        <span className="text-zinc-600 font-mono text-sm">{formatLocalTimeWrapper(r.checkOut, projectTimezone)}</span>
      ),
    },
    {
      key: "status",
      header: "ESTADO",
      render: (r) => <StatusBadge status={r.status as any} />,
    },
    {
      key: "photoUrl",
      header: "FOTO",
      render: (r) => {
        const photoSrc = formatAvatarUrl(r.photoUrl);
        const isValidPhoto = photoSrc && !photoSrc.includes("test.com");

        return isValidPhoto ? (
          <div
            className="group relative w-14 h-14 rounded-xl overflow-hidden border-2 border-blue-200 hover:border-blue-500 cursor-pointer shadow-sm transition-all duration-200 bg-muted shrink-0"
            onClick={() => setSelectedPhotoUrl(photoSrc!)}
            title="Clic para ampliar foto"
          >
            <img
              src={photoSrc!}
              alt="Foto de asistencia" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" onError={(e) => { (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center text-muted-foreground"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg><span class="text-[9px]">Sin foto</span></div>'; }}
            />
            <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
              <Camera className="w-4 h-4 text-white drop-shadow" />
            </div>
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl bg-zinc-100/80 border border-border flex flex-col items-center justify-center gap-0.5 text-muted-foreground">
            <Camera className="w-4 h-4 text-muted-foreground" />
            <span className="text-[9px] font-medium">Sin foto</span>
          </div>
        );
      },
    },
    {
      key: "location",
      header: "UBICACIÓN",
      hideOnMobile: true,
      render: (r) => <LocationCell lat={r.latitude} lng={r.longitude} />,
    },
  ];

  /* ================= LOADING GUARD ================= */

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen sm:h-[calc(100vh-70px)] bg-muted/50 overflow-y-auto sm:overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-4 h-full flex flex-col gap-4">

        {/* HEADER */}
        <PageHeader
          categoryTag={{ badge: "JEFE DE PROYECTO", text: "Panel de Gestión" }}
          title="Mis Asistencias"
          description="Consulta y filtra el historial completo de tus registros de asistencia personal"
          period={period}
          dateRange={dateRange}
          onPeriodChange={handlePeriodChange}
        />

        {/* MAIN CARD */}
        <Card className="flex-1 border-0 shadow-sm ring-1 ring-zinc-200/50 bg-card rounded-2xl overflow-hidden flex flex-col">
          <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">

            {/* TOOLBAR: Metrics + Filters */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
              
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SubMetricCard label="TOTAL" value={metrics.total} icon={<Clock className="w-5 h-5" />} />
                <SubMetricCard label="PRESENTES" value={metrics.presentes} color="green" icon={<CheckCircle2 className="w-5 h-5" />} />
                <SubMetricCard label="FALTAS" value={metrics.faltas} color="red" icon={<XCircle className="w-5 h-5" />} />
                <SubMetricCard label="% ASIST." value={`${metrics.rate}%`} color="blue" icon={<TrendingUp className="w-5 h-5" />} />
              </div>

              {/* FILTERS */}
              <div className="flex flex-wrap items-end gap-3 lg:ml-auto">
                <div className="flex flex-col w-full sm:w-auto sm:min-w-[180px]">
                  <label className="text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                    Buscar Fecha
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <Input
                      placeholder="YYYY-MM-DD..."
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-md border-border focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col w-full sm:w-auto sm:min-w-[140px]">
                  <label className="text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                    Filtrar Estado
                  </label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-md border-border">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="PRESENTE">Presente</SelectItem>
                      <SelectItem value="FALTA">Falta</SelectItem>
                      <SelectItem value="TARDE">Tarde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  className="h-9 px-3 text-xs gap-2 border border-border bg-card text-zinc-700 hover:bg-background"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Actualizar
                </Button>
              </div>
            </div>

            {/* TABLE */}
            <div className="flex-1 overflow-hidden border rounded-lg">
              <DataTable
                data={filteredRecords}
                columns={columns}
                loading={loading}
                emptyText="No se encontraron registros de asistencia"
                maxHeight="100%"
              />
            </div>
          </CardContent>
        </Card>

        {/* PAGINATION: Centered Status Bar */}
        <div className="flex justify-center pb-2">
          <div className="flex items-center gap-4 bg-card border border-border rounded-lg px-5 py-2 shadow-sm">
            <p className="text-xs text-zinc-600 font-medium">
              Página <span className="font-bold text-foreground">{currentPage}</span> de {pagination.totalPages}
            </p>
            
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0" 
                disabled={currentPage >= pagination.totalPages} 
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-zinc-400 italic">
              {pagination.total} registros totales
            </p>
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
              <div className="flex items-center justify-center w-full h-full p-2">
                <img
                  src={selectedPhotoUrl.includes("minio:9000") ? selectedPhotoUrl.replace("http://minio:9000", "https://minio-s3.astc.joyit.io") : selectedPhotoUrl}
                  alt="Foto de asistencia" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20" onError={(e) => { (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center text-muted-foreground"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg><span class="text-[9px]">Sin foto</span></div>'; }}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

