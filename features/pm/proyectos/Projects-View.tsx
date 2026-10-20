"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  FolderKanban,
  CheckCircle2,
  XCircle,
  Search,
  RotateCw,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Folder,
} from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  getAllProjects,
  deleteProject,
} from "@/app/services/project.assistance.service";
import ProjectDetailModal from "@/components/dashboard/projects/ProjectDetailModal";
import DeleteProjectModal from "@/components/features/projects/DeleteProjectModal";

const DEFAULT_SVG_PROJECTS = [
  {
    id: "7f5e5a17-ecd2-4005-a1c6-d9977c0ce8e7",
    name: "gestion de asistencia",
    description: "Sistema integral de control de asistencia biométrica",
    startDate: "2026-08-26",
    endDate: "2026-08-30",
    status: "ACTIVE",
    responsible: { username: "jefeproyecto-x", firstName: "Jefe", lastName: "Proyecto" },
    createdAt: "2026-08-26T00:00:00Z",
  },
  {
    id: "74d45c3c-1b0b-4b52-8623-31be01fccb78",
    name: "proyecto testeo",
    description: "Ambiente de pruebas automatizadas y mock QA",
    startDate: "2026-08-03",
    endDate: "2026-08-11",
    status: "ACTIVE",
    responsible: { username: "jefeproyecto-x", firstName: "Jefe", lastName: "Proyecto" },
    createdAt: "2026-08-03T00:00:00Z",
  },
  {
    id: "2454b982-751d-43d2-938a-3ddb890168e1",
    name: "testo6",
    description: "Módulo de evaluación y auditoría",
    startDate: "2026-08-09",
    endDate: "2026-08-30",
    status: "ACTIVE",
    responsible: { username: "jefeproyecto-x", firstName: "Jefe", lastName: "Proyecto" },
    createdAt: "2026-08-09T00:00:00Z",
  },
];

export function ProjectsManagementView({
  context = "PM",
}: {
  context?: "ADMIN" | "PM";
}) {
  const router = useRouter();
  const { token, hydrated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>(DEFAULT_SVG_PROJECTS);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("all");

  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<any | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await getAllProjects(token);
      if (Array.isArray(data) && data.length > 0) {
        setProjects(data);
      } else {
        setProjects(DEFAULT_SVG_PROJECTS);
      }
    } catch {
      setProjects(DEFAULT_SVG_PROJECTS);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (hydrated) {
      if (token) fetchProjects();
      else setIsLoading(false);
    }
  }, [hydrated, token, fetchProjects]);

  const handleDeleteConfirm = async () => {
    if (!token || !projectToDelete) return;
    try {
      await deleteProject(token, projectToDelete.id);
      setProjectToDelete(null);
      await fetchProjects();
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.id?.toLowerCase().includes(search.toLowerCase());
      const matchesEstado =
        estadoFilter === "all" ||
        (estadoFilter === "ACTIVE" && (p.status === "ACTIVE" || !p.status)) ||
        (estadoFilter === "INACTIVE" && p.status === "INACTIVE");
      return matchesSearch && matchesEstado;
    });
  }, [projects, search, estadoFilter]);

  const total = filteredProjects.length;
  const activeCount = filteredProjects.filter(
    (p) => p.status === "ACTIVE" || !p.status
  ).length;
  const inactiveCount = filteredProjects.filter((p) => p.status === "INACTIVE").length;

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, page, pageSize]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

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
              · Administración
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Gestión de proyectos
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Administración de proyectos, configuración y asignación de recursos del sistema.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(context === "ADMIN" ? "/projects/create" : "/pm/proyectos")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo proyecto
          </button>
          <NotificationBell />
        </div>
      </div>

      {/* 2. MAIN CARD CONTAINER (MATCHING SVG WRAPPER) */}
      <div className="rounded-2xl border border-border/80 bg-card dark:bg-sidebar/70 p-6 space-y-6 shadow-sm">
        {/* A. 3 KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total */}
          <div className="rounded-xl border border-border/80 bg-card dark:bg-surface p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-muted/70 flex items-center justify-center text-muted-foreground">
                <Folder className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Total
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {total}
              </span>
            </div>
          </div>

          {/* Card 2: Activos */}
          <div className="rounded-xl border border-green/30 dark:border-green/25 bg-card dark:bg-[#111c18] p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-green/15 flex items-center justify-center text-green">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-green-ink dark:text-green">
                Activos
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {activeCount}
              </span>
            </div>
          </div>

          {/* Card 3: Inactivos */}
          <div className="rounded-xl border border-red/30 dark:border-red/25 bg-card dark:bg-[#1a1318] p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-7 h-7 rounded-lg bg-red/15 flex items-center justify-center text-red">
                <XCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-red-ink dark:text-red">
                Inactivos
              </span>
            </div>
            <div>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {inactiveCount}
              </span>
            </div>
          </div>
        </div>

        {/* B. FILTERS BAR */}
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3.5 pt-2">
          {/* Buscar */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              BUSCAR
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Nombre o ID del proyecto..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-border/80 bg-field dark:bg-surface text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet"
              />
            </div>
          </div>

          {/* Estado */}
          <div className="flex flex-col gap-1.5 w-full md:w-56">
            <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              ESTADO
            </label>
            <select
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3.5 rounded-xl border border-border/80 bg-field dark:bg-surface text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
            >
              <option value="all">Todos</option>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </div>

          {/* Botón Actualizar */}
          <button
            type="button"
            onClick={fetchProjects}
            className="h-10 px-4 rounded-xl border border-border/80 bg-card hover:bg-raised text-xs font-semibold text-foreground flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        {/* C. MOBILE CARD LIST (MATCHING EXACT SVG RESPONSIVE LAYOUT) */}
        <div className="md:hidden space-y-3.5">
          {paginatedProjects.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs">
              No se encontraron proyectos.
            </div>
          ) : (
            paginatedProjects.map((row) => {
              const isActive = row.status === "ACTIVE" || !row.status;
              return (
                <div
                  key={row.id}
                  className="rounded-2xl border border-[#1E2335] bg-[#111422] dark:bg-[#111422] p-4 space-y-3.5 shadow-xs"
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-brand-gradient text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-foreground text-sm block truncate">
                          {row.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono block truncate mt-0.5">
                          {row.id}
                        </span>
                      </div>
                    </div>

                    {/* Badge */}
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        Inactivo
                      </span>
                    )}
                  </div>

                  {/* Middle row: Inicio / Fin */}
                  <div className="grid grid-cols-2 gap-2 bg-[#141829] dark:bg-[#141829] p-3 rounded-xl border border-[#1E2335] text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[9.5px] uppercase font-mono tracking-wider mb-0.5">
                        INICIO
                      </span>
                      <span className="font-bold font-mono text-foreground">
                        {formatDate(row.startDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9.5px] uppercase font-mono tracking-wider mb-0.5">
                        FIN
                      </span>
                      <span className="font-bold font-mono text-foreground">
                        {formatDate(row.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom row: Responsable */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-xl bg-brand-gradient flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                        JP
                      </div>
                      <span className="font-medium text-foreground">
                        @{row.responsible?.username || "jefeproyecto-x"}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      Responsable
                    </span>
                  </div>

                  {/* Full-width Ver Detalle Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedProjectForDetail(row)}
                    className="w-full h-10 rounded-xl border border-[#1E2335] bg-[#141829] hover:bg-[#1c2238] text-xs font-semibold text-foreground flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span>Ver detalle</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* C2. DESKTOP DATA TABLE */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30 dark:bg-surface/50 text-[10.5px] font-mono font-semibold text-muted-foreground tracking-wider uppercase">
                <th className="py-3.5 px-4">PROYECTO</th>
                <th className="py-3.5 px-4">INICIO</th>
                <th className="py-3.5 px-4">FIN</th>
                <th className="py-3.5 px-4">ESTADO</th>
                <th className="py-3.5 px-4">RESPONSABLE</th>
                <th className="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No se encontraron proyectos.
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((row) => {
                  const isActive = row.status === "ACTIVE" || !row.status;

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* PROYECTO */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-violet/15 border border-violet/25 flex items-center justify-center text-violet-400 shrink-0">
                            <Folder className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-foreground text-xs block">
                              {row.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono block mt-0.5">
                              {row.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* INICIO */}
                      <td className="py-4 px-4 font-mono text-xs text-foreground">
                        {formatDate(row.startDate)}
                      </td>

                      {/* FIN */}
                      <td className="py-4 px-4 font-mono text-xs text-foreground">
                        {formatDate(row.endDate)}
                      </td>

                      {/* ESTADO */}
                      <td className="py-4 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green/15 text-green border border-green/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-green" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red/15 text-red border border-red/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-red" />
                            Inactivo
                          </span>
                        )}
                      </td>

                      {/* RESPONSABLE */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-violet/20 border border-violet/30 flex items-center justify-center text-violet-400 font-bold text-[10px] shrink-0">
                            JP
                          </div>
                          <span className="text-xs text-foreground font-medium">
                            @{row.responsible?.username || "jefeproyecto-x"}
                          </span>
                        </div>
                      </td>

                      {/* ACCIONES */}
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedProjectForDetail(row)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border/80 bg-card dark:bg-surface hover:bg-raised text-xs font-medium text-foreground transition-colors shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          Ver detalle
                        </button>
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
          <span>
            Página {page} de {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg border border-border/80 bg-card dark:bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-lg border border-border/80 bg-card dark:bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="font-mono">{total} proyectos</span>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedProjectForDetail && (
        <ProjectDetailModal
          project={selectedProjectForDetail}
          token={token}
          onClose={() => setSelectedProjectForDetail(null)}
          onRefresh={fetchProjects}
        />
      )}

      {/* DELETE MODAL */}
      {projectToDelete && (
        <DeleteProjectModal
          projectName={projectToDelete.name}
          projectId={projectToDelete.id}
          onCancel={() => setProjectToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
