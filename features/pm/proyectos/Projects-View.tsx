"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import {
  FolderKanban, Users, Pencil, Trash2, ChevronLeft, ChevronRight, RefreshCw, Search, Filter, Clock, CheckCircle2, XCircle, Eye, Calendar, CalendarDays, MapPin, Globe, Timer, ShieldCheck, Copy, Check, Loader2, Info, FileText } from "lucide-react";
import { DataTable, Column } from "@/components/DataTable";
import PageHeader from "@/components/layout/page-header";
import {
  getAllProjects,
  listHolidays,
  listShiftTemplates,
  getCollectionsForProject,
  getGlobalCollections,
  getAdminSetting,
  graphqlRequest,
  deleteProject,
} from "@/app/services/project.assistance.service";
import type { Project } from "@/components/types/dashboard";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import DeleteProjectModal from "@/components/features/projects/DeleteProjectModal";

/* ===================== VIEW ===================== */

export function ProjectsManagementView({ context = "PM" }: { context?: "ADMIN" | "PM" }) {

  const router = useRouter();
  const { token, hydrated } = useAuth();
  const isAdmin = context === "ADMIN";
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<any | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("all");


  /* ===================== FETCH PROJECTS ===================== */
  const fetchProjects = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);

    try {
      const data = await getAllProjects(token);

      const sorted = [...(data ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setProjects(sorted);
    } catch (err) {
      console.error("? Error fetching projects:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  /* ===================== DELETE ===================== */

async function handleDeleteConfirm() {
  try {
    if (!token || !projectToDelete) return;

    console.log("DELETE:", projectToDelete.id);

    const result = await deleteProject(token, projectToDelete.id);

    console.log("RESULT:", result);

    setProjectToDelete(null);
    await fetchProjects();
  } catch (err) {
    console.error("? Delete error:", err);
  }
}

  
/* ===================== INIT ===================== */

    useEffect(() => {
      if (!hydrated || !token) return;
      fetchProjects();
    }, [hydrated, token, fetchProjects]);

    useEffect(() => {
      setPage(1);
    }, [search, estadoFilter]);

    
  /* ===================== FILTERS ===================== */

      const filteredProjects = useMemo(() => {
        return projects.filter((p) => {
          const matchesSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.id.toLowerCase().includes(search.toLowerCase());

          const matchesEstado =
            estadoFilter === "all" || p.status === estadoFilter;

          return matchesSearch && matchesEstado;
        });
      }, [projects, search, estadoFilter]);

      const totalProjects = filteredProjects.length;

      const activeProjects = filteredProjects.filter(
        (p) => p.status === "ACTIVE"
      ).length;

      const inactiveProjects = filteredProjects.filter(
        (p) => p.status === "INACTIVE"
      ).length;

      const pageSize = 5;

      const totalPages = Math.max(
        1,
        Math.ceil(filteredProjects.length / pageSize)
      );

      useEffect(() => {
        if (page > totalPages) {
          setPage(totalPages);
        }
      }, [page, totalPages]);

      const paginatedProjects = useMemo(() => {
        const start = (page - 1) * pageSize;

        return filteredProjects.slice(
          start,
          start + pageSize
        );
      }, [filteredProjects, page]);

      /* ===================== COLUMNS ===================== */

    const columns: Column<Project>[] = [
      {
        key: "name",
        header: "PROYECTO",
        render: (r) => (
          <div>
            <p className="font-medium text-foreground">{r.name}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{r.id}</p>
          </div>
        ),
      },

      {
        key: "startDate",
        header: "INICIO",
        hideOnMobile: true,
        render: (r) =>
          r.startDate
            ? new Date(r.startDate).toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })
            : "-",
      },

      {
        key: "endDate",
        header: "FIN",
        hideOnMobile: true,
        render: (r) =>
          r.endDate
            ? new Date(r.endDate).toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })
            : "-",
      },

      {
        key: "status",
        header: "ESTADO",
        render: (r) => <ProjectStatusBadge status={r.status} />,
      },

      {
        key: "assignedUser",
        header: "RESPONSABLE",
        hideOnMobile: true,
        render: (r: any) => {
          const responsibleMember = r.members?.find((m: any) => m.role === "PROJECT_MANAGER") || r.members?.[0];
          if (!responsibleMember || !responsibleMember.user) return <span className="text-zinc-400 text-xs">-</span>;
          const u = responsibleMember.user;
          return (
            <div>
              <p className="font-medium text-foreground text-xs">
                {u.firstName} {u.lastName}
              </p>
              <p className="text-[10px] text-muted-foreground">
                @{u.username}
              </p>
            </div>
          );
        }
      },

      {
        key: "actions",
        header: "ACCIONES",
        render: (r) => (
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/projects/edit/${r.id}`)}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setProjectToDelete(r)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Eliminar
                </Button>
              </>
            )}
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
              onClick={() => setSelectedProjectForDetail(r)}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Ver Detalle
            </Button>
          </div>
        ),
      },
    ];

  /* ===================== UI ===================== */
return (
  <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto px-4 py-4">

      {/* HEADER */}
      <PageHeader
          categoryTag={{ badge: "JEFE DE PROYECTO", text: "Panel de Gestión" }}
          title="Gestión de Proyectos"
        description="Administración de proyectos, configuración y asignación de recursos del sistema"
        showPeriodSelector={false}
      />

      {/* CARD */}
      <Card className="mt-4">
        <CardContent className="p-4">

          {/* ?? TOOLBAR (UNA SOLA LÍNEA REAL) */}
          <div className="flex flex-wrap lg:flex-nowrap items-end gap-3 mb-4">

            {/* METRICS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <SubMetricCard label="TOTAL" value={totalProjects} icon={<Clock className="w-5 h-5" />} />
              <SubMetricCard label="ACTIVOS" value={activeProjects} color="green" icon={<CheckCircle2 className="w-5 h-5" />} />
              <SubMetricCard label="INACTIVOS" value={inactiveProjects} color="red" icon={<XCircle className="w-5 h-5" />} />
            </div>

            {/* SEARCH */}
            <div className="flex flex-col w-full sm:w-auto sm:min-w-[200px]">
              <label className="text-[9px] text-zinc-500 mb-1">
                Buscar
              </label>
              <input
                className="border px-3 h-9 rounded-md text-sm w-full"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* STATE */}
            <div className="flex flex-col w-full sm:w-auto sm:min-w-[140px]">
              <label className="text-[9px] text-zinc-500 mb-1">
                Estado
              </label>
              <select
                className="border px-3 h-9 rounded-md text-sm"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 ml-auto">

              {isAdmin && (
                <Button
                  onClick={() => router.push("/projects/create")}
                  className="h-9 bg-blue-600 hover:bg-blue-700"
                >
                  <FolderKanban className="w-4 h-4 mr-1.5" />
                  Crear Proyecto
                </Button>
              )}

              <Button
                onClick={fetchProjects}
                variant="ghost"
                className="h-9 border border-slate-200 bg-card text-zinc-700 hover:bg-slate-50"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>

            </div>

          </div>

          <DataTable
          data={paginatedProjects}
          columns={columns}
          loading={isLoading}
          emptyText="No hay proyectos"
        />

       <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">

            <span className="text-sm text-zinc-500 order-2 sm:order-1">
              Página {page} de {totalPages}
            </span>

            <div className="flex gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-9 px-3"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-9 px-3"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* PROJECT DETAIL MODAL */}
      {selectedProjectForDetail && (
        <ProjectDetailModal
          project={selectedProjectForDetail}
          token={token}
          onClose={() => setSelectedProjectForDetail(null)}
        />
      )}

      {projectToDelete && (
        <DeleteProjectModal
          projectName={projectToDelete.name}
          projectId={projectToDelete.id}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setProjectToDelete(null)}
        />
      )}

    </div>
  </div>
);
}

function getCountryInfo(timezone: string | null | undefined): { country: string; flag: string } {
  const tz = timezone || "America/Lima";
  if (tz.includes("Lima")) return { country: "Perú", flag: "????" };
  if (tz.includes("Bogota")) return { country: "Colombia", flag: "????" };
  if (tz.includes("Mexico")) return { country: "México", flag: "????" };
  if (tz.includes("Santiago")) return { country: "Chile", flag: "????" };
  if (tz.includes("Argentina") || tz.includes("Buenos_Aires")) return { country: "Argentina", flag: "????" };
  if (tz.includes("Sao_Paulo")) return { country: "Brasil", flag: "????" };
  if (tz.includes("Caracas")) return { country: "Venezuela", flag: "????" };
  if (tz.includes("Guayaquil")) return { country: "Ecuador", flag: "????" };
  if (tz.includes("La_Paz")) return { country: "Bolivia", flag: "????" };
  if (tz.includes("Asuncion")) return { country: "Paraguay", flag: "????" };
  if (tz.includes("Montevideo")) return { country: "Uruguay", flag: "????" };
  if (tz.includes("Panama")) return { country: "Panamá", flag: "????" };
  if (tz.includes("Costa_Rica")) return { country: "Costa Rica", flag: "????" };
  if (tz.includes("El_Salvador")) return { country: "El Salvador", flag: "????" };
  if (tz.includes("Guatemala")) return { country: "Guatemala", flag: "????" };
  if (tz.includes("Honduras") || tz.includes("Tegucigalpa")) return { country: "Honduras", flag: "????" };
  if (tz.includes("Managua")) return { country: "Nicaragua", flag: "????" };
  if (tz.includes("Santo_Domingo")) return { country: "Rep. Dominicana", flag: "????" };
  if (tz.includes("Madrid")) return { country: "España", flag: "????" };
  if (tz.includes("New_York") || tz.includes("Chicago") || tz.includes("Los_Angeles") || tz.includes("Denver")) return { country: "Estados Unidos", flag: "????" };
  return { country: tz.split("/")[1]?.replace(/_/g, " ") || "Internacional", flag: "??" };
}

/* ===================== PROJECT DETAIL MODAL ===================== */

function ProjectDetailModal({
  project,
  token,
  onClose,
}: {
  project: any;
  token: string | null;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"general" | "holidays" | "schedules" | "members">("general");
  const [copiedId, setCopiedId] = useState(false);

  // Holidays state
  const currentYear = new Date().getFullYear();
  const [holidayYear, setHolidayYear] = useState<number>(currentYear);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);

  // Shift templates state
  const [shiftTemplates, setShiftTemplates] = useState<any[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);

  const fetchHolidays = useCallback(async (yr: number) => {
    if (!token || !project?.id) return;
    setIsLoadingHolidays(true);
    try {
      const [projCols, globalCols, globalAssignedId, directHolidays] = await Promise.all([
        getCollectionsForProject(token, project.id).catch(() => []),
        getGlobalCollections(token).catch(() => []),
        getAdminSetting(token, "GLOBAL_ASSIGNED_COLLECTION_ID").catch(() => null),
        listHolidays(token, project.id, yr).catch(() => []),
      ]);

      const holidaysMap = new Map<string, any>();

      // Direct holidays
      if (directHolidays && directHolidays.length > 0) {
        for (const dh of directHolidays) {
          if (dh.date && dh.date.startsWith(`${yr}-`)) {
            holidaysMap.set(dh.date, { date: dh.date, name: dh.name || "Feriado", type: dh.type || "Feriado" });
          }
        }
      }

      // Project collections
      if (projCols && projCols.length > 0) {
        for (const col of projCols) {
          if (col.items) {
            for (const it of col.items) {
              if (it.date && it.date.startsWith(`${yr}-`)) {
                holidaysMap.set(it.date, { date: it.date, name: it.name, type: col.scope === "GLOBAL" ? "Feriado Nacional" : "Feriado Proyecto" });
              }
            }
          }
        }
      }

      // Fallback to global assigned or all global collections if project collections had no entries
      if (holidaysMap.size === 0 && globalCols && globalCols.length > 0) {
        const targetGlobalCols = globalAssignedId
          ? globalCols.filter((g: any) => g.id === globalAssignedId)
          : globalCols;
        const colsToUse = targetGlobalCols.length > 0 ? targetGlobalCols : globalCols;
        for (const col of colsToUse) {
          if (col.items) {
            for (const it of col.items) {
              if (it.date && it.date.startsWith(`${yr}-`)) {
                holidaysMap.set(it.date, { date: it.date, name: it.name, type: "Feriado Nacional" });
              }
            }
          }
        }
      }

      const result = Array.from(holidaysMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      setHolidays(result);
    } catch (err) {
      console.error("Error loading project holidays:", err);
      setHolidays([]);
    } finally {
      setIsLoadingHolidays(false);
    }
  }, [token, project?.id]);

  const fetchShifts = useCallback(async () => {
    if (!token || !project?.id) return;
    setIsLoadingShifts(true);
    try {
      const data = await listShiftTemplates(token, project.id);
      setShiftTemplates(data || []);
    } catch (err) {
      console.error("Error loading project shifts:", err);
      setShiftTemplates([]);
    } finally {
      setIsLoadingShifts(false);
    }
  }, [token, project?.id]);

  useEffect(() => {
    if (activeTab === "holidays") {
      fetchHolidays(holidayYear);
    } else if (activeTab === "schedules") {
      fetchShifts();
    }
  }, [activeTab, holidayYear, fetchHolidays, fetchShifts]);

  const handleCopyId = () => {
    if (project?.id) {
      navigator.clipboard.writeText(project.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const responsibleMember = project?.members?.find((m: any) => m.role === "PROJECT_MANAGER") || project?.members?.[0];
  const respUser = responsibleMember?.user;
  const pmDisplayName = respUser
    ? (respUser.firstName || respUser.lastName
        ? `${respUser.firstName || ""} ${respUser.lastName || ""}`.trim()
        : (respUser.username ? `@${respUser.username}` : "Jefe de Proyecto"))
    : "No asignado";

  const countryInfo = getCountryInfo(project?.timezone);

  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0 rounded-2xl border-border">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white p-6 rounded-t-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-600/30 border border-violet-500/40 rounded-xl text-violet-400">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {project?.name}
                  <ProjectStatusBadge status={project?.status} />
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
                    ID: {project?.id}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="text-zinc-400 hover:text-white transition p-1 text-xs inline-flex items-center gap-1"
                    title="Copiar ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-6 border-b border-zinc-700/60 pb-1">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "general"
                  ? "bg-card text-zinc-900 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              General
            </button>
            <button
              onClick={() => setActiveTab("holidays")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "holidays"
                  ? "bg-card text-zinc-900 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Feriados Asignados
            </button>
            <button
              onClick={() => setActiveTab("schedules")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "schedules"
                  ? "bg-card text-zinc-900 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Horarios y Turnos
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "members"
                  ? "bg-card text-zinc-900 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Miembros ({project?.members?.length || 0})
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-6">
          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Description */}
              {project?.description && (
                <div className="p-4 bg-muted/50 border border-border/80 rounded-xl">
                  <p className="text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    Descripción del Proyecto
                  </p>
                  <p className="text-sm text-zinc-800 leading-relaxed">{project.description}</p>
                </div>
              )}

              {/* Grid Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3.5 bg-card border border-border rounded-xl shadow-xs">
                  <p className="text-[11px] font-medium text-zinc-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-violet-500" />
                    Periodo del Proyecto
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {project?.startDate ? new Date(project.startDate).toLocaleDateString("es-PE") : "Sin inicio"}
                    {" - "}
                    {project?.endDate ? new Date(project.endDate).toLocaleDateString("es-PE") : "Indefinido"}
                  </p>
                </div>

                <div className="p-3.5 bg-card border border-border rounded-xl shadow-xs">
                  <p className="text-[11px] font-medium text-zinc-500 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-violet-500" />
                    Equipo Asignado
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {project?.members?.length || 0} Colaboradores
                  </p>
                </div>

                <div className="p-3.5 bg-card border border-border rounded-xl shadow-xs">
                  <p className="text-[11px] font-medium text-zinc-500 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    Responsable / PM
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {pmDisplayName}
                  </p>
                  {respUser?.username && <p className="text-[11px] text-muted-foreground">@{respUser.username}</p>}
                </div>
              </div>

              {/* Attendance Policy & Config */}
              <div className="border border-border rounded-xl p-4 bg-zinc-50/50">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-violet-600" />
                  Políticas y Reglas de Asistencia
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500 text-xs block">País / Sede</span>
                    <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                      <span className="text-base leading-none">{countryInfo.flag}</span>
                      {countryInfo.country}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 text-xs block">Zona Horaria</span>
                    <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                      {project?.timezone || "America/Lima (UTC-5)"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 text-xs block">Tolerancia de Entrada</span>
                    <span className="font-medium text-zinc-900 mt-0.5 block">
                      {project?.graceMinutes ?? 15} minutos
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 text-xs block">Horario Base</span>
                    <span className="font-medium text-zinc-900 mt-0.5 block">
                      {project?.workStartTime ? project.workStartTime.substring(0, 5) : "08:00"} - {project?.workEndTime ? project.workEndTime.substring(0, 5) : "17:00"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 text-xs block">Corte de Falta</span>
                    <span className="font-medium text-zinc-900 mt-0.5 block">
                      {project?.absenceCutoffTime ? project.absenceCutoffTime.substring(0, 5) : "No especificado"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 text-xs block">Elegibilidad Vacaciones</span>
                    <span className="font-medium text-zinc-900 mt-0.5 block">
                      {project?.vacationEligibilityDays ?? 360} días
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 text-xs block">Ubicación GPS</span>
                    {project?.latitude && project?.longitude ? (
                      <a
                        href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-medium text-xs mt-0.5"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        Ver en Google Maps
                      </a>
                    ) : (
                      <span className="text-zinc-400 text-xs mt-0.5 block">Sin coordenadas GPS</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HOLIDAYS */}
          {activeTab === "holidays" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-muted/50 p-3 rounded-xl border border-border">
                <span className="text-xs font-semibold text-muted-foreground">Año de Feriados:</span>
                <div className="flex gap-1">
                  {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setHolidayYear(yr)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                        holidayYear === yr
                          ? "bg-violet-600 text-white shadow-xs"
                          : "bg-card text-zinc-700 border border-border hover:bg-accent"
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingHolidays ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Cargando feriados asignados...
                </div>
              ) : holidays.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {holidays.map((h: any, idx: number) => {
                    const d = new Date(h.date + "T00:00:00");
                    const dayName = d.toLocaleDateString("es-PE", { weekday: "long" });
                    return (
                      <div key={idx} className="p-3 bg-card border border-border rounded-xl flex items-center justify-between hover:border-violet-300 transition">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-violet-50 text-violet-600 rounded-lg text-center min-w-[48px]">
                            <span className="text-[10px] uppercase font-bold block">{dayName.substring(0, 3)}</span>
                            <span className="text-base font-extrabold block leading-tight">{d.getDate()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-xs sm:text-sm line-clamp-1">{h.name}</p>
                            <p className="text-[11px] text-zinc-500 capitalize">{d.toLocaleDateString("es-PE", { month: "long", year: "numeric" })}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-zinc-600 border border-border">
                          {h.type || "Feriado"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/50 border border-dashed border-border rounded-xl">
                  <CalendarDays className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No hay feriados asignados para el año {holidayYear}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">El administrador no ha vinculado una colección de feriados para este año.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SCHEDULES & SHIFTS */}
          {activeTab === "schedules" && (
            <div className="space-y-4">
              {isLoadingShifts ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Cargando horarios y turnos...
                </div>
              ) : shiftTemplates.length > 0 ? (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {shiftTemplates.map((shift: any, idx: number) => {
                    const days = [
                      { label: "L", active: shift.monday },
                      { label: "M", active: shift.tuesday },
                      { label: "M", active: shift.wednesday },
                      { label: "J", active: shift.thursday },
                      { label: "V", active: shift.friday },
                      { label: "S", active: shift.saturday },
                      { label: "D", active: shift.sunday },
                    ];
                    return (
                      <div key={idx} className="p-4 bg-card border border-border rounded-xl space-y-3 hover:border-violet-300 transition">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-violet-600" />
                            <h4 className="font-bold text-foreground text-sm">{shift.name}</h4>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {shift.shiftType || "REGULAR"}
                          </span>
                        </div>

                        {/* Working Days Badges */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-zinc-500 mr-1">Días:</span>
                          {days.map((d, dIdx) => (
                            <span
                              key={dIdx}
                              className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                d.active ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {d.label}
                            </span>
                          ))}
                        </div>

                        {/* Shift Times */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-muted/50 p-2.5 rounded-lg border border-zinc-100">
                          <div>
                            <span className="text-zinc-500 block">Jornada</span>
                            <span className="font-semibold text-foreground">
                              {shift.workStartTime?.substring(0, 5) || "08:00"} - {shift.workEndTime?.substring(0, 5) || "17:00"}
                            </span>
                          </div>
                          {shift.breakStartTime && (
                            <div>
                              <span className="text-zinc-500 block">Refrigerio</span>
                              <span className="font-semibold text-foreground">
                                {shift.breakStartTime.substring(0, 5)} - {shift.breakEndTime?.substring(0, 5)} ({shift.breakMinutes || 60}m)
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-zinc-500 block">Tolerancia</span>
                            <span className="font-semibold text-foreground">{shift.graceMinutes ?? 15} min</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-muted/50 border border-border rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-bold text-foreground text-sm">Horario Base del Proyecto</h4>
                      <p className="text-xs text-muted-foreground">Este proyecto no tiene turnos rotativos creados; rige el horario base configurado.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-card p-3 rounded-lg border border-border text-xs">
                    <div>
                      <span className="text-zinc-500 block">Horario de Ingreso / Salida</span>
                      <span className="font-semibold text-foreground">
                        {project?.workStartTime ? project.workStartTime.substring(0, 5) : "08:00"} - {project?.workEndTime ? project.workEndTime.substring(0, 5) : "17:00"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Tolerancia</span>
                      <span className="font-semibold text-foreground">{project?.graceMinutes ?? 15} minutos</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Corte de Falta</span>
                      <span className="font-semibold text-foreground">
                        {project?.absenceCutoffTime ? project.absenceCutoffTime.substring(0, 5) : "--:--"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MEMBERS */}
          {activeTab === "members" && (
            <div>
              {project?.members && project.members.length > 0 ? (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {project.members.map((m: any, idx: number) => {
                    const u = m.user;
                    const memberDisplayName = u
                      ? (u.firstName || u.lastName
                          ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
                          : (u.username ? `@${u.username}` : "Colaborador"))
                      : "Colaborador";
                    const initials = ((u?.firstName?.[0] || "") + (u?.lastName?.[0] || "") || u?.username?.[0] || "U").toUpperCase();
                    return (
                      <div key={idx} className="flex justify-between items-center p-3 bg-card border border-border rounded-xl hover:border-violet-300 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center border border-violet-200">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">
                              {memberDisplayName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>@{u?.username || m.userId}</span>
                              {u?.email && <span>• {u.email}</span>}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1 rounded-full font-semibold">
                          {m.role || "TEAM_MEMBER"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/50 border border-dashed border-border rounded-xl">
                  <Users className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No hay miembros asignados a este proyecto</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ================= BADGE ================= */

function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${
        status === "ACTIVE"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {status === "ACTIVE" ? "Activo" : status === "INACTIVE" ? "Inactivo" : status === "COMPLETED" ? "Completado" : status}
    </span>
  );
}
