"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  getMyProjects,
  deleteProject,
} from "@/app/services/project.assistance.service";
import ProjectDetailModal from "@/components/dashboard/projects/ProjectDetailModal";
import DeleteProjectModal from "@/components/features/projects/DeleteProjectModal";

export function ProjectsManagementView({
  context = "PM",
}: {
  context?: "ADMIN" | "PM";
}) {
  const router = useRouter();
  const { token, hydrated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("all");

  const searchParams = useSearchParams();
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<any | null>(null);

  useEffect(() => {
    if (searchParams?.get("modal") === "detail") {
      const p = projects[0] || DEFAULT_SVG_PROJECTS[0];
      setSelectedProjectForDetail(p);
    }
  }, [searchParams, projects]);
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      let data = await getAllProjects(token);
      if (!Array.isArray(data) || data.length === 0) {
        data = await getMyProjects(token);
      }
      if (Array.isArray(data)) {
        setProjects(data);
      } else {
        setProjects([]);
      }
    } catch {
      try {
        const mine = await getMyProjects(token);
        setProjects(Array.isArray(mine) ? mine : []);
      } catch {
        setProjects([]);
      }
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleProj = (e: Event) => {
        const customEvent = e as CustomEvent<string>;
        const newId = customEvent.detail ?? localStorage.getItem("selected_project_id");
        if (newId === "all" || !newId) {
          setSearch("");
        } else {
          const match = projects.find((p) => p.id === newId);
          if (match?.name) {
            setSearch(match.name);
          }
        }
      };

      window.addEventListener("astc-project-changed", handleProj);
      window.addEventListener("storage", handleProj);
      return () => {
        window.removeEventListener("astc-project-changed", handleProj);
        window.removeEventListener("storage", handleProj);
      };
    }
  }, [projects]);

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

  const pageSize = 5;
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
    <div className="relative min-h-screen bg-transparent pb-16 font-sans">
      

      <div className="relative w-full max-w-7xl mx-auto space-y-4 md:space-y-5 z-10 px-0 md:px-0">
        {/* 1. TOP HEADER & NEW PROJECT BUTTON */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#8B7BD8]">
                PANEL DE GESTIÓN
              </span>
              <span className="text-xs text-[#8F96AE]">
                · Administración
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Gestión de proyectos
            </h1>
            <p className="font-hanken text-xs text-muted-foreground leading-relaxed max-w-xl">
              Administración de proyectos, configuración y asignación de recursos del sistema.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Jefe de proyecto no crea proyectos */}
            <div className="hidden md:block">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* UNIFIED MAIN CONTAINER ("Un cuadro entero, no 3") */}
        <div className="rounded-[22px] border border-border bg-card/60 dark:bg-[#0C0E18] p-4 sm:p-5 md:p-6 shadow-sm space-y-5 sm:space-y-6">
        {/* 2. 3 STAT CARDS (ROW OF 3 MATCHING EXACT SVG) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-1">
          {/* Card 1: Total */}
          <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 flex flex-col justify-between h-[95px] sm:h-[110px] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-muted dark:bg-[#141829] border border-border dark:border-white/10 flex items-center justify-center text-muted-foreground dark:text-[#8F96AE]">
                <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-[#8F96AE] block font-medium">Total</span>
              <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-none">
                {total}
              </span>
            </div>
          </div>

          {/* Card 2: Activos */}
          <div className="rounded-2xl border border-emerald-500/20 dark:border-[#134E35] bg-card dark:bg-[#0C1814] p-3.5 sm:p-5 flex flex-col justify-between h-[95px] sm:h-[110px] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-[#34D399]">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-[#34D399] block font-semibold">Activos</span>
              <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-none">
                {activeCount}
              </span>
            </div>
          </div>

          {/* Card 3: Inactivos */}
          <div className="rounded-2xl border border-rose-500/20 dark:border-[#5C1D24] bg-card dark:bg-[#1A0F12] p-3.5 sm:p-5 flex flex-col justify-between h-[95px] sm:h-[110px] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-[#F87171]">
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-[#F87171] block font-semibold">Inactivos</span>
              <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-none">
                {inactiveCount}
              </span>
            </div>
          </div>
        </div>

        {/* Divider Line */}
          <div className="border-t border-border/60 -mx-4 sm:-mx-5 md:-mx-6" />

          {/* 3. FILTERS BAR */}
          <div className="pt-1">
          <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3.5">
            {/* Buscar */}
            <div className="space-y-1.5 flex-1">
              <label className="text-[10px] font-mono font-semibold text-[#8F96AE] uppercase tracking-wider block">
                BUSCAR
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#8F96AE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Nombre o ID del proyecto..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-border bg-background/50 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#A855F7]"
                />
              </div>
            </div>

            {/* Estado + Reload */}
            <div className="space-y-1.5 w-full md:w-64">
              <label className="text-[10px] font-mono font-semibold text-[#8F96AE] uppercase tracking-wider block">
                ESTADO
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={estadoFilter}
                  onChange={(e) => {
                    setEstadoFilter(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 h-11 px-3.5 rounded-xl border border-border bg-background/50 text-xs font-medium text-foreground focus:outline-none focus:border-[#A855F7]"
                >
                  <option value="all">Todos</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>

                <button
                  type="button"
                  onClick={fetchProjects}
                  className="w-11 h-11 rounded-xl border border-border bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
                  title="Actualizar"
                >
                  <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#A855F7]" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. RESPONSIVE VIEW: MOBILE PROJECT CARDS (md:hidden) */}
        <div className="md:hidden space-y-3.5">
          {paginatedProjects.length === 0 ? (
            <div className="py-12 text-center text-[#8F96AE] text-xs bg-card rounded-2xl border border-border">
              No hay proyectos disponibles
            </div>
          ) : (
            paginatedProjects.map((row) => {
              const isActive = row.status === "ACTIVE" || !row.status;
              return (
                <div
                  key={row.id}
                  className="rounded-2xl border border-border bg-card p-4 space-y-3.5 shadow-xs"
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-[#1C1635] border border-purple-200 dark:border-[#312361] text-purple-600 dark:text-[#A855F7] flex items-center justify-center shrink-0">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-foreground text-sm block truncate">
                          {row.name}
                        </span>
                        <span className="text-[11px] text-[#8F96AE] font-mono block truncate mt-0.5">
                          {row.id}
                        </span>
                      </div>
                    </div>

                    {/* Pill Badge */}
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-[#0C251C] text-emerald-700 dark:text-[#34D399] border border-emerald-200 dark:border-[#194B37] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-[#251417] text-rose-700 dark:text-[#F87171] border border-rose-200 dark:border-[#521C22] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F87171]" />
                        Inactivo
                      </span>
                    )}
                  </div>

                  {/* Middle row: 2 boxes (INICIO & FIN) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-border bg-background/50 p-2.5">
                      <span className="text-[9.5px] font-mono text-[#8B7BD8] uppercase tracking-wider block font-semibold">
                        INICIO
                      </span>
                      <span className="text-xs text-foreground font-medium block mt-1">
                        {formatDate(row.startDate)}
                      </span>
                    </div>
                    <div className="rounded-xl border border-border bg-background/50 p-2.5">
                      <span className="text-[9.5px] font-mono text-[#8B7BD8] uppercase tracking-wider block font-semibold">
                        FIN
                      </span>
                      <span className="text-xs text-foreground font-medium block mt-1">
                        {formatDate(row.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Responsible row */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs"
                        style={{
                          background:
                            "linear-gradient(135deg, #5B8CFF 0%, #A855F7 55%, #22C3E6 100%)",
                        }}
                      >
                        JP
                      </div>
                      <span className="font-medium text-foreground">
                        @{row.responsible?.username || "jefeproyecto-x"}
                      </span>
                    </div>
                    <span className="text-[#8F96AE] text-xs">
                      Responsable
                    </span>
                  </div>

                  {/* Full-width Ver Detalle Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedProjectForDetail(row)}
                    className="w-full h-11 rounded-xl border border-border bg-background/50 hover:bg-muted text-xs font-semibold text-foreground flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Eye className="w-4 h-4 text-[#8F96AE]" />
                    <span>Ver detalle</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* 5. DESKTOP VIEW: DATA TABLE (hidden md:block - WEB IS PRESERVED!) */}
        <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/50 text-[10.5px] font-mono font-semibold text-[#8B7BD8] tracking-wider uppercase">
                  <th className="py-4 px-5">PROYECTO</th>
                  <th className="py-4 px-5">INICIO</th>
                  <th className="py-4 px-5">FIN</th>
                  <th className="py-4 px-5">ESTADO</th>
                  <th className="py-4 px-5">RESPONSABLE</th>
                  <th className="py-4 px-5 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#8F96AE]">
                      No hay proyectos disponibles
                    </td>
                  </tr>
                ) : (
                  paginatedProjects.map((row) => {
                    const isActive = row.status === "ACTIVE" || !row.status;

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-background/50/80 transition-colors"
                      >
                        {/* PROYECTO */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-[#1C1635] border border-purple-200 dark:border-[#312361] text-purple-600 dark:text-[#A855F7] flex items-center justify-center shrink-0">
                              <Folder className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-semibold text-foreground text-xs block">
                                {row.name}
                              </span>
                              <span className="text-[11px] text-[#8F96AE] font-mono block mt-0.5">
                                {row.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* INICIO */}
                        <td className="py-4 px-5 font-mono text-xs text-foreground">
                          {formatDate(row.startDate)}
                        </td>

                        {/* FIN */}
                        <td className="py-4 px-5 font-mono text-xs text-foreground">
                          {formatDate(row.endDate)}
                        </td>

                        {/* ESTADO */}
                        <td className="py-4 px-5">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-[#0C251C] text-emerald-700 dark:text-[#34D399] border border-emerald-200 dark:border-[#194B37]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-[#251417] text-rose-700 dark:text-[#F87171] border border-rose-200 dark:border-[#521C22]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F87171]" />
                              Inactivo
                            </span>
                          )}
                        </td>

                        {/* RESPONSABLE */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-lg text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs"
                              style={{
                                background:
                                  "linear-gradient(135deg, #5B8CFF 0%, #A855F7 55%, #22C3E6 100%)",
                              }}
                            >
                              JP
                            </div>
                            <span className="font-medium text-foreground text-xs">
                              @{row.responsible?.username || "jefeproyecto-x"}
                            </span>
                          </div>
                        </td>

                        {/* ACCIONES */}
                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedProjectForDetail(row)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border bg-background/50 hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#8F96AE]" />
                            <span>Ver detalle</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. FOOTER PAGINATION */}
        <div className="flex items-center justify-between text-xs text-[#8F96AE] pt-2">
          <span>{total} proyectos</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-9 h-9 rounded-xl border border-border bg-background/50 flex items-center justify-center text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium px-2 text-foreground">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-9 h-9 rounded-xl border border-border bg-background/50 flex items-center justify-center text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Modals */}
      {selectedProjectForDetail && (
        <ProjectDetailModal
          project={selectedProjectForDetail}
          token={token}
          onClose={() => setSelectedProjectForDetail(null)}
          onRefresh={fetchProjects}
        />
      )}

      {projectToDelete && (
        <DeleteProjectModal
          projectId={projectToDelete.id}
          projectName={projectToDelete.name || ""}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setProjectToDelete(null)}
        />
      )}
    </div>
  );
}
