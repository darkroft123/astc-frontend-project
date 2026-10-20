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
    <div className="relative min-h-screen bg-transparent pb-16 font-sans">
      {/* Top Ambient Glow */}
      <div
        className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 rounded-full opacity-30 blur-3xl z-0"
        style={{
          background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)",
        }}
      />

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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Gestión de proyectos
            </h1>
            <p className="text-xs text-[#8F96AE] leading-relaxed max-w-xl">
              Administración de proyectos, configuración y asignación de recursos del sistema.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(context === "ADMIN" ? "/projects/create" : "/pm/proyectos")}
              className="w-full md:w-auto h-11 px-5 rounded-2xl text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#A855F7]/25 hover:opacity-95 transition-all cursor-pointer"
              style={{
                background: "linear-gradient(90deg, #5B8CFF 0%, #A855F7 100%)",
              }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo proyecto</span>
            </button>
            <div className="hidden md:block">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* 2. 3 STAT CARDS (ROW OF 3 MATCHING EXACT SVG) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-1">
          {/* Card 1: Total */}
          <div className="rounded-2xl border border-[#1E2335] bg-[#0C0E18] p-3.5 sm:p-5 flex flex-col justify-between h-[95px] sm:h-[110px] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#141829] flex items-center justify-center text-[#8F96AE]">
                <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-[#8F96AE] block font-medium">Total</span>
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
                {total}
              </span>
            </div>
          </div>

          {/* Card 2: Activos */}
          <div className="rounded-2xl border border-[#134E35] bg-[#0C1814] p-3.5 sm:p-5 flex flex-col justify-between h-[95px] sm:h-[110px] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#0C251C] flex items-center justify-center text-[#34D399]">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-[#34D399] block font-semibold">Activos</span>
              <span className="text-2xl sm:text-3xl font-bold text-[#34D399] tracking-tight leading-none">
                {activeCount}
              </span>
            </div>
          </div>

          {/* Card 3: Inactivos */}
          <div className="rounded-2xl border border-[#5C1D24] bg-[#1A0F12] p-3.5 sm:p-5 flex flex-col justify-between h-[95px] sm:h-[110px] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#251417] flex items-center justify-center text-[#F87171]">
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-[#F87171] block font-semibold">Inactivos</span>
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
                {inactiveCount}
              </span>
            </div>
          </div>
        </div>

        {/* 3. FILTERS BAR */}
        <div className="rounded-2xl border border-[#1E2335] bg-[#0C0E18] p-4 shadow-xs">
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
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#1E2335] bg-[#12141F] text-xs font-medium text-white placeholder:text-[#8F96AE] focus:outline-none focus:border-[#A855F7]"
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
                  className="flex-1 h-11 px-3.5 rounded-xl border border-[#1E2335] bg-[#12141F] text-xs font-medium text-white focus:outline-none focus:border-[#A855F7]"
                >
                  <option value="all">Todos</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>

                <button
                  type="button"
                  onClick={fetchProjects}
                  className="w-11 h-11 rounded-xl border border-[#1E2335] bg-[#12141F] hover:bg-[#1A1D2E] text-[#8F96AE] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
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
            <div className="py-12 text-center text-[#8F96AE] text-xs bg-[#0C0E18] rounded-2xl border border-[#1E2335]">
              No se encontraron proyectos.
            </div>
          ) : (
            paginatedProjects.map((row) => {
              const isActive = row.status === "ACTIVE" || !row.status;
              return (
                <div
                  key={row.id}
                  className="rounded-2xl border border-[#1E2335] bg-[#0C0E18] p-4 space-y-3.5 shadow-xs"
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#1C1635] border border-[#312361] text-[#A855F7] flex items-center justify-center shrink-0">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-white text-sm block truncate">
                          {row.name}
                        </span>
                        <span className="text-[11px] text-[#8F96AE] font-mono block truncate mt-0.5">
                          {row.id}
                        </span>
                      </div>
                    </div>

                    {/* Pill Badge */}
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0C251C] text-[#34D399] border border-[#194B37] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#251417] text-[#F87171] border border-[#521C22] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F87171]" />
                        Inactivo
                      </span>
                    )}
                  </div>

                  {/* Middle row: 2 boxes (INICIO & FIN) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-[#1E2335] bg-[#12141F] p-2.5">
                      <span className="text-[9.5px] font-mono text-[#8B7BD8] uppercase tracking-wider block font-semibold">
                        INICIO
                      </span>
                      <span className="text-xs text-white font-medium block mt-1">
                        {formatDate(row.startDate)}
                      </span>
                    </div>
                    <div className="rounded-xl border border-[#1E2335] bg-[#12141F] p-2.5">
                      <span className="text-[9.5px] font-mono text-[#8B7BD8] uppercase tracking-wider block font-semibold">
                        FIN
                      </span>
                      <span className="text-xs text-white font-medium block mt-1">
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
                      <span className="font-medium text-white">
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
                    className="w-full h-11 rounded-xl border border-[#1E2335] bg-[#12141F] hover:bg-[#1A1D2E] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
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
        <div className="hidden md:block rounded-2xl border border-[#1E2335] bg-[#0C0E18] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1E2335] bg-[#101322] text-[10.5px] font-mono font-semibold text-[#8B7BD8] tracking-wider uppercase">
                  <th className="py-4 px-5">PROYECTO</th>
                  <th className="py-4 px-5">INICIO</th>
                  <th className="py-4 px-5">FIN</th>
                  <th className="py-4 px-5">ESTADO</th>
                  <th className="py-4 px-5">RESPONSABLE</th>
                  <th className="py-4 px-5 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2335]">
                {paginatedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#8F96AE]">
                      No se encontraron proyectos.
                    </td>
                  </tr>
                ) : (
                  paginatedProjects.map((row) => {
                    const isActive = row.status === "ACTIVE" || !row.status;

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-[#12141F]/80 transition-colors"
                      >
                        {/* PROYECTO */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#1C1635] border border-[#312361] flex items-center justify-center text-[#A855F7] shrink-0">
                              <Folder className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-semibold text-white text-xs block">
                                {row.name}
                              </span>
                              <span className="text-[11px] text-[#8F96AE] font-mono block mt-0.5">
                                {row.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* INICIO */}
                        <td className="py-4 px-5 font-mono text-xs text-white">
                          {formatDate(row.startDate)}
                        </td>

                        {/* FIN */}
                        <td className="py-4 px-5 font-mono text-xs text-white">
                          {formatDate(row.endDate)}
                        </td>

                        {/* ESTADO */}
                        <td className="py-4 px-5">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0C251C] text-[#34D399] border border-[#194B37]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#251417] text-[#F87171] border border-[#521C22]">
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
                            <span className="font-medium text-white text-xs">
                              @{row.responsible?.username || "jefeproyecto-x"}
                            </span>
                          </div>
                        </td>

                        {/* ACCIONES */}
                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedProjectForDetail(row)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#1E2335] bg-[#12141F] hover:bg-[#1A1D2E] text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
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
              className="w-9 h-9 rounded-xl border border-[#1E2335] bg-[#12141F] flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1A1D2E] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium px-2 text-white">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-9 h-9 rounded-xl border border-[#1E2335] bg-[#12141F] flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1A1D2E] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
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
