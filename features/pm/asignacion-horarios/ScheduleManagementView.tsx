"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  User,
  Folder,
  Ban,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  getAllProjects,
  getAllUsers,
  listScheduleOverrides,
  deleteSchedule,
} from "@/app/services/project.assistance.service";

type UserSchedule = {
  userId: string;
  userName: string;
  userEmail: string;
  projectId: string;
  projectName: string;
  projectStartHour: string;
  projectEndHour: string;
  projectGraceMinutes: number;
  effectiveStartHour: string;
  effectiveEndHour: string;
  hasOverride: boolean;
  overrideId: string | null;
  shiftType?: string;
};

export function ScheduleManagementView() {
  const router = useRouter();
  const { token, hydrated } = useAuth();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [resettingId, setResettingId] = useState<string | null>(null);

  const [projects, setProjects] = useState<{ id: string; name: string; workStartTime?: string; workEndTime?: string }[]>([]);
  const [schedules, setSchedules] = useState<UserSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);

    try {
      const [projData, userData, overrides] = await Promise.all([
        getAllProjects(token),
        getAllUsers(token),
        listScheduleOverrides(token),
      ]);

      const activeProjects = (projData ?? []) as any[];
      setProjects(activeProjects);

      const overrideMap = new Map<string, any>();
      (overrides ?? []).forEach((o) => {
        overrideMap.set(`${o.userId}:${o.projectId}`, o);
      });

      const derived: UserSchedule[] = [];
      const targetUsers = (userData ?? []).filter((u: any) => {
        const role = (u.roleCode || u.roleName || u.role || "").toUpperCase();
        return role !== "ADMIN" && role !== "ROLE_ADMIN" && u.username?.toLowerCase() !== "admin";
      });

      targetUsers.forEach((u: any) => {
        const userFullName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Usuario";
        const userProjects = activeProjects.filter((p: any) =>
          p.members?.some((m: any) => (m.userId || m.id) === u.id) || p.responsibleId === u.id
        );

        if (userProjects.length === 0) {
          derived.push({
            userId: u.id,
            userName: userFullName,
            userEmail: u.email,
            projectId: "",
            projectName: "Sin proyecto",
            projectStartHour: "--",
            projectEndHour: "--",
            projectGraceMinutes: 0,
            effectiveStartHour: "--",
            effectiveEndHour: "--",
            hasOverride: false,
            overrideId: null,
            shiftType: undefined,
          });
        } else {
          userProjects.forEach((proj: any) => {
            const override = overrideMap.get(`${u.id}:${proj.id}`);

            let effectiveStartHour = proj.workStartTime || "--";
            let effectiveEndHour = proj.workEndTime || "--";
            if (override) {
              if (override.shiftType?.startsWith("ROTATING") && override.rotationShiftStartTime) {
                effectiveStartHour = override.rotationShiftStartTime;
                effectiveEndHour = override.rotationShiftEndTime || "--";
              } else if (override.workStartTime) {
                effectiveStartHour = override.workStartTime;
                effectiveEndHour = override.workEndTime || "--";
              }
            }

            derived.push({
              userId: u.id,
              userName: userFullName,
              userEmail: u.email,
              projectId: proj.id,
              projectName: proj.name,
              projectStartHour: proj.workStartTime || "--",
              projectEndHour: proj.workEndTime || "--",
              projectGraceMinutes: proj.graceMinutes ?? 10,
              effectiveStartHour,
              effectiveEndHour,
              hasOverride: !!override,
              overrideId: override?.id || null,
              shiftType: override?.shiftType || proj.shiftType || undefined,
            });
          });
        }
      });

      setSchedules(derived);
    } catch (err) {
      console.error("Error loading schedule management data", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!hydrated || !token) return;
    loadData();
  }, [hydrated, token, loadData]);

  const handleReset = async (userId: string, projectId: string) => {
    if (!token || !projectId) return;
    if (!confirm("¿Restablecer al horario por defecto del proyecto?")) return;

    try {
      setResettingId(`${userId}:${projectId}`);
      await deleteSchedule(token, userId, projectId);
      await loadData();
    } catch (err) {
      console.error("Error resetting schedule:", err);
      alert("Error al restablecer el horario.");
    } finally {
      setResettingId(null);
    }
  };

  const projectOptions = useMemo(() => {
    return [
      { id: "all", name: `Todos los proyectos (${projects.length})` },
      ...projects.map((p) => ({ id: p.id, name: p.name })),
    ];
  }, [projects]);

  const filtered = useMemo(() => {
    let data = schedules;
    if (statusFilter === "WITH_OVERRIDE") data = data.filter((d) => d.hasOverride);
    if (statusFilter === "WITHOUT_OVERRIDE") data = data.filter((d) => !d.hasOverride && d.projectId);
    if (statusFilter === "NO_PROJECT") data = data.filter((d) => !d.projectId);

    if (searchTerm.trim() !== "") {
      const lower = searchTerm.toLowerCase();
      data = data.filter((d) =>
        d.userName.toLowerCase().includes(lower) ||
        d.userEmail.toLowerCase().includes(lower) ||
        d.projectName.toLowerCase().includes(lower)
      );
    }

    if (projectFilter !== "all") {
      data = data.filter((s) => s.projectId === projectFilter);
    }

    return data;
  }, [schedules, statusFilter, searchTerm, projectFilter]);

  const total = schedules.length;
  const withOverride = schedules.filter((s) => s.hasOverride).length;
  const withDefault = schedules.filter((s) => !s.hasOverride && s.projectId).length;
  const withoutProject = schedules.filter((s) => !s.projectId).length;

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Top Header */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-violet-ink dark:text-violet tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet" />
            PANEL DE GESTIÓN · Administración
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Asignación de horarios
          </h1>
          <p className="text-sm text-muted-foreground">
            Los horarios se heredan del proyecto. Puede asignar horarios personalizados por usuario.
          </p>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total */}
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{total}</p>
              <p className="text-xs text-muted-foreground mt-1">Total asignaciones</p>
            </div>
          </div>

          {/* Card 2: Personalizados */}
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-violet/10 text-violet-ink dark:text-violet flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{withOverride}</p>
              <p className="text-xs text-muted-foreground mt-1">Personalizados</p>
            </div>
          </div>

          {/* Card 3: Heredan del proyecto */}
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-green/10 text-green-ink dark:text-green flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{withDefault}</p>
              <p className="text-xs text-muted-foreground mt-1">Heredan del proyecto</p>
            </div>
          </div>

          {/* Card 4: Sin proyecto */}
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-red/10 text-red-ink dark:text-red flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{withoutProject}</p>
              <p className="text-xs text-muted-foreground mt-1">Sin proyecto</p>
            </div>
          </div>
        </div>

        {/* Main Content Card: Filters + Table + Pagination */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Filters Row */}
          <div className="p-4 border-b border-border bg-card flex flex-col md:flex-row items-stretch md:items-end gap-3.5">
            {/* Filter: Proyecto */}
            <div className="flex flex-col gap-1.5 md:w-56 shrink-0">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Proyecto
              </label>
              <select
                value={projectFilter}
                onChange={(e) => {
                  setProjectFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
              >
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Filter: Buscar */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Buscar
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Usuario o proyecto..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                />
              </div>
            </div>

            {/* Filter: Tipo de horario */}
            <div className="flex flex-col gap-1.5 md:w-44 shrink-0">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Tipo de horario
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
              >
                <option value="ALL">Todos</option>
                <option value="WITH_OVERRIDE">Personalizados</option>
                <option value="WITHOUT_OVERRIDE">Del proyecto</option>
                <option value="NO_PROJECT">Sin proyecto</option>
              </select>
            </div>

            {/* Refresh Button */}
            <div className="shrink-0 flex items-end">
              <button
                type="button"
                onClick={loadData}
                disabled={isLoading}
                className="h-9 px-4 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium text-foreground inline-flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Proyecto</th>
                  <th className="py-3 px-4">Entrada</th>
                  <th className="py-3 px-4">Salida</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Cargando horarios...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No se encontraron asignaciones de horario.
                    </td>
                  </tr>
                ) : (
                  paginated.map((r, idx) => {
                    const isEven = idx % 2 === 1;
                    const shiftBadge = r.shiftType === "ROTATING_4X4" ? "4x4"
                      : r.shiftType === "ROTATING_7X7" ? "7x7"
                      : r.shiftType === "FLEXIBLE" ? "Flexible"
                      : r.shiftType === "TRANSITORY" ? "Transitorio"
                      : null;

                    return (
                      <tr
                        key={`${r.userId}:${r.projectId || idx}`}
                        className={`transition-colors ${
                          isEven ? "bg-muted/25 dark:bg-white/[0.02]" : "bg-transparent"
                        } hover:bg-muted/50`}
                      >
                        {/* Usuario */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-violet/15 text-violet-ink dark:bg-violet/15 dark:text-violet-ink flex items-center justify-center font-bold text-xs shrink-0 border border-violet/20 dark:border-violet/25">
                              {getInitials(r.userName)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">
                                {r.userName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {r.userEmail}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Proyecto */}
                        <td className="py-3 px-4">
                          {r.projectId ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet/10 dark:bg-violet/15 text-violet-ink dark:text-violet-ink border border-violet/20 dark:border-violet/25">
                              {r.projectName}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Sin proyecto
                            </span>
                          )}
                        </td>

                        {/* Entrada */}
                        <td className="py-3 px-4 font-mono font-medium text-foreground text-sm">
                          {r.effectiveStartHour}
                        </td>

                        {/* Salida */}
                        <td className="py-3 px-4 font-mono font-medium text-foreground text-sm">
                          {r.effectiveEndHour}
                        </td>

                        {/* Tipo */}
                        <td className="py-3 px-4">
                          {!r.projectId ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-muted-foreground bg-muted">
                              Sin proyecto
                            </span>
                          ) : r.hasOverride ? (
                            <div className="inline-flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet/10 dark:bg-violet/15 text-violet-ink dark:text-violet-ink border border-violet/20 dark:border-violet/25">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet" />
                                Personalizado
                              </span>
                              {shiftBadge && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-cyan/10 dark:bg-cyan/15 text-cyan dark:text-cyan border border-cyan/20 dark:border-cyan/25">
                                  {shiftBadge}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green/10 dark:bg-green/15 text-green-ink dark:text-green-ink border border-green/20 dark:border-green/25">
                                <span className="w-1.5 h-1.5 rounded-full bg-green" />
                                Del proyecto
                              </span>
                              {shiftBadge && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-cyan/10 dark:bg-cyan/15 text-cyan dark:text-cyan border border-cyan/20 dark:border-cyan/25">
                                  {shiftBadge}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {r.hasOverride ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      `/pm/asignacion-horarios/edit?projectId=${r.projectId}&userId=${r.userId}`
                                    )
                                  }
                                  className="h-7 px-2.5 rounded-md border border-border bg-background hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1 transition-colors"
                                >
                                  <Pencil className="w-3 h-3 text-muted-foreground" />
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReset(r.userId, r.projectId)}
                                  disabled={resettingId === `${r.userId}:${r.projectId}`}
                                  className="h-7 px-2 rounded-md border border-border bg-background hover:bg-amber/10 text-xs font-medium text-amber-ink dark:text-amber inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Restablecer
                                </button>
                              </>
                            ) : r.projectId ? (
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/pm/asignacion-horarios/asign?projectId=${r.projectId}&userId=${r.userId}`
                                  )
                                }
                                className="h-8 px-3 rounded-lg border border-border bg-background hover:bg-muted/70 text-xs font-medium text-foreground inline-flex items-center gap-1.5 shadow-sm transition-colors"
                              >
                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                Asignar horario
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin proyecto</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Página {page} de {totalPages}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div>
              {filtered.length} {filtered.length === 1 ? "asignación" : "asignaciones"}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
