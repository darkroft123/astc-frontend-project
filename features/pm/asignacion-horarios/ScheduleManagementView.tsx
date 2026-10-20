"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  User,
  Folder,
  XCircle,
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
import PageHeader from "@/components/layout/page-header";

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

const DEFAULT_MOCK_SCHEDULES: UserSchedule[] = [
  {
    userId: "usr-01",
    userName: "Carlos Mamani",
    userEmail: "cmamani@empresa.com",
    projectId: "p1",
    projectName: "Gestión de Asistencia",
    projectStartHour: "09:00",
    projectEndHour: "18:00",
    projectGraceMinutes: 10,
    effectiveStartHour: "09:00",
    effectiveEndHour: "18:00",
    hasOverride: false,
    overrideId: null,
    shiftType: "REGULAR",
  },
  {
    userId: "usr-02",
    userName: "Ana Silva Morales",
    userEmail: "asilva@empresa.com",
    projectId: "p1",
    projectName: "Gestión de Asistencia",
    projectStartHour: "09:00",
    projectEndHour: "18:00",
    projectGraceMinutes: 15,
    effectiveStartHour: "08:30",
    effectiveEndHour: "17:30",
    hasOverride: true,
    overrideId: "ov-01",
    shiftType: "ROTATING_4X4",
  },
  {
    userId: "usr-03",
    userName: "Diego Torres Ramos",
    userEmail: "dtorres@empresa.com",
    projectId: "p2",
    projectName: "Proyecto Testeo",
    projectStartHour: "08:00",
    projectEndHour: "17:00",
    projectGraceMinutes: 10,
    effectiveStartHour: "08:00",
    effectiveEndHour: "17:00",
    hasOverride: false,
    overrideId: null,
    shiftType: "REGULAR",
  },
  {
    userId: "usr-04",
    userName: "Lucía Fernández Cruz",
    userEmail: "lfernandez@empresa.com",
    projectId: "p3",
    projectName: "Testo6",
    projectStartHour: "10:00",
    projectEndHour: "19:00",
    projectGraceMinutes: 10,
    effectiveStartHour: "10:00",
    effectiveEndHour: "19:00",
    hasOverride: false,
    overrideId: null,
    shiftType: "FLEXIBLE",
  },
  {
    userId: "usr-05",
    userName: "Miguel Ángel Rojas",
    userEmail: "mrojas@empresa.com",
    projectId: "",
    projectName: "Sin proyecto",
    projectStartHour: "--",
    projectEndHour: "--",
    projectGraceMinutes: 0,
    effectiveStartHour: "--",
    effectiveEndHour: "--",
    hasOverride: false,
    overrideId: null,
  },
];

const DEFAULT_MOCK_PROJECTS = [
  { id: "p1", name: "Gestión de Asistencia", workStartTime: "09:00", workEndTime: "18:00" },
  { id: "p2", name: "Proyecto Testeo", workStartTime: "08:00", workEndTime: "17:00" },
  { id: "p3", name: "Testo6", workStartTime: "10:00", workEndTime: "19:00" },
];

export function ScheduleManagementView() {
  const router = useRouter();
  const { token, hydrated } = useAuth();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [resettingId, setResettingId] = useState<string | null>(null);

  const [projects, setProjects] = useState<{ id: string; name: string; workStartTime?: string; workEndTime?: string }[]>(DEFAULT_MOCK_PROJECTS);
  const [schedules, setSchedules] = useState<UserSchedule[]>(DEFAULT_MOCK_SCHEDULES);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) {
      setProjects(DEFAULT_MOCK_PROJECTS);
      setSchedules(DEFAULT_MOCK_SCHEDULES);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      const [projData, userData, overrides] = await Promise.all([
        getAllProjects(token),
        getAllUsers(token),
        listScheduleOverrides(token),
      ]);

      const activeProjects = (projData ?? []) as any[];
      setProjects(activeProjects.length > 0 ? activeProjects : DEFAULT_MOCK_PROJECTS);

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

      if (derived.length > 0) {
        setSchedules(derived);
      } else {
        setSchedules(DEFAULT_MOCK_SCHEDULES);
      }
    } catch (err) {
      console.error("Error loading schedule management data", err);
      setProjects(DEFAULT_MOCK_PROJECTS);
      setSchedules(DEFAULT_MOCK_SCHEDULES);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!hydrated) return;
    loadData();
  }, [hydrated, loadData]);

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
    <div className="min-h-screen bg-transparent">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 space-y-6">

        {/* Top Header */}
        <PageHeader
          categoryTag={{ badge: "PANEL DE GESTIÓN", text: "Administración" }}
          title="Asignación de horarios"
          description="Los horarios se heredan del proyecto. Puede asignar horarios personalizados por usuario."
          showPeriodSelector={false}
        />

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {/* Card 1: Total */}
          <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl border border-border/60 bg-background/50 flex items-center justify-center text-muted-foreground shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Total asignaciones</p>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{total}</p>
            </div>
          </div>

          {/* Card 2: Personalizados */}
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <p className="text-xs text-purple-300 font-medium">Personalizados</p>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{withOverride}</p>
            </div>
          </div>

          {/* Card 3: Heredan del proyecto */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Folder className="w-4 h-4" />
              </div>
              <p className="text-xs text-emerald-400 font-medium">Heredan del proyecto</p>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{withDefault}</p>
            </div>
          </div>

          {/* Card 4: Sin proyecto */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                <XCircle className="w-4 h-4" />
              </div>
              <p className="text-xs text-rose-400 font-medium">Sin proyecto</p>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{withoutProject}</p>
            </div>
          </div>
        </div>

        {/* Filters Container - Desktop View (1 Row) */}
        <div className="hidden md:grid md:grid-cols-4 gap-4 items-end rounded-2xl border border-border bg-card/60 p-4 shadow-sm">
          {/* Proyecto */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Proyecto
            </label>
            <div className="relative">
              <Folder className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
              <select
                value={projectFilter}
                onChange={(e) => {
                  setProjectFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id} className="bg-card text-foreground">{p.name}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Buscar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Buscar
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Usuario o proyecto..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Tipo de horario */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Tipo de horario
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="ALL" className="bg-card text-foreground">Todos</option>
                <option value="WITH_OVERRIDE" className="bg-card text-foreground">Personalizados</option>
                <option value="WITHOUT_OVERRIDE" className="bg-card text-foreground">Del proyecto</option>
                <option value="NO_PROJECT" className="bg-card text-foreground">Sin proyecto</option>
              </select>
              <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Action: Actualizar button */}
          <div>
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="w-full h-10 px-4 rounded-xl border border-border bg-background/50 hover:bg-background text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Filters Card (Mobile only) */}
        <div className="md:hidden rounded-2xl border border-border bg-card/60 p-4 space-y-3.5 shadow-sm">
          {/* Proyecto */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Proyecto
            </label>
            <div className="relative">
              <Folder className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <select
                value={projectFilter}
                onChange={(e) => {
                  setProjectFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id} className="bg-card text-foreground">{p.name}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Buscar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Buscar
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Usuario o proyecto..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Tipo de horario + Refresh */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Tipo de horario
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  <option value="ALL" className="bg-card text-foreground">Todos</option>
                  <option value="WITH_OVERRIDE" className="bg-card text-foreground">Personalizados</option>
                  <option value="WITHOUT_OVERRIDE" className="bg-card text-foreground">Del proyecto</option>
                  <option value="NO_PROJECT" className="bg-card text-foreground">Sin proyecto</option>
                </select>
                <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={loadData}
                disabled={isLoading}
                className="w-10 h-10 rounded-xl border border-border bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-colors"
                title="Actualizar"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile View: Cards idénticas al SVG dark-asignacion de horarios.svg */}
        <div className="space-y-3 md:hidden">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Cargando horarios...
            </div>
          ) : paginated.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground bg-card rounded-2xl border border-border">
              No se encontraron asignaciones de horario.
            </div>
          ) : (
            paginated.map((r, idx) => {
              const shiftBadge = r.shiftType === "ROTATING_4X4" ? "4×4"
                : r.shiftType === "ROTATING_7X7" ? "7×7"
                : r.shiftType === "FLEXIBLE" ? "Flexible"
                : r.shiftType === "TRANSITORY" ? "Transitorio"
                : null;

              return (
                <div key={`${r.userId}:${r.projectId || idx}`} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                  {/* Top user row */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-gradient text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                      {getInitials(r.userName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-base text-foreground leading-tight truncate">
                        {r.userName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {r.userEmail}
                      </p>
                    </div>
                  </div>

                  {/* Badges row */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {r.projectId ? (
                      <span className="inline-block bg-purple-950/60 text-purple-300 border border-purple-800/40 text-xs px-2.5 py-0.5 rounded-full font-medium">
                        {r.projectName}
                      </span>
                    ) : (
                      <span className="inline-block bg-muted text-muted-foreground text-xs px-2.5 py-0.5 rounded-full font-medium">
                        Sin proyecto
                      </span>
                    )}

                    {r.hasOverride ? (
                      <span className="inline-flex items-center gap-1 bg-purple-950/50 text-purple-300 border border-purple-800/40 text-xs px-2.5 py-0.5 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        Personalizado
                      </span>
                    ) : r.projectId ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 text-xs px-2.5 py-0.5 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Del proyecto
                      </span>
                    ) : null}

                    {shiftBadge && (
                      <span className="inline-block bg-cyan-950/50 text-cyan-400 border border-cyan-800/40 text-xs px-2 py-0.5 rounded-md font-medium">
                        {shiftBadge}
                      </span>
                    )}
                  </div>

                  {/* Times Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                      <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                        ENTRADA
                      </span>
                      <span className="text-xs font-mono font-medium text-foreground">
                        {r.effectiveStartHour}
                      </span>
                    </div>
                    <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                      <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                        SALIDA
                      </span>
                      <span className="text-xs font-mono font-medium text-foreground">
                        {r.effectiveEndHour}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {r.hasOverride ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/pm/asignacion-horarios/edit?projectId=${r.projectId}&userId=${r.userId}`
                            )
                          }
                          className="flex-1 h-10 rounded-xl border border-border bg-background/50 hover:bg-background text-xs font-medium text-foreground inline-flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReset(r.userId, r.projectId)}
                          disabled={resettingId === `${r.userId}:${r.projectId}`}
                          className="h-10 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-400 inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restablecer
                        </button>
                      </div>
                    ) : r.projectId ? (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/pm/asignacion-horarios/asign?projectId=${r.projectId}&userId=${r.userId}`
                          )
                        }
                        className="w-full h-10 rounded-xl border border-border bg-background/50 hover:bg-background text-xs font-medium text-foreground inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        Asignar horario
                      </button>
                    ) : (
                      <div className="text-center py-2 text-xs text-muted-foreground">
                        Sin proyecto
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Tabla */}
        <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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
                    const shiftBadge = r.shiftType === "ROTATING_4X4" ? "4×4"
                      : r.shiftType === "ROTATING_7X7" ? "7×7"
                      : r.shiftType === "FLEXIBLE" ? "Flexible"
                      : r.shiftType === "TRANSITORY" ? "Transitorio"
                      : null;

                    return (
                      <tr key={`${r.userId}:${r.projectId || idx}`} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-gradient text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {getInitials(r.userName)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">{r.userName}</p>
                              <p className="text-xs text-muted-foreground truncate">{r.userEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {r.projectId ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-950/60 text-purple-300 border border-purple-800/40">
                              {r.projectName}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin proyecto</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-foreground text-sm">{r.effectiveStartHour}</td>
                        <td className="py-3 px-4 font-mono font-medium text-foreground text-sm">{r.effectiveEndHour}</td>
                        <td className="py-3 px-4">
                          {!r.projectId ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-muted-foreground bg-muted">Sin proyecto</span>
                          ) : r.hasOverride ? (
                            <div className="inline-flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-950/50 text-purple-300 border border-purple-800/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                Personalizado
                              </span>
                              {shiftBadge && (
                                <span className="inline-block bg-cyan-950/50 text-cyan-400 border border-cyan-800/40 text-xs px-2 py-0.5 rounded-md font-medium">
                                  {shiftBadge}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Del proyecto
                              </span>
                              {shiftBadge && (
                                <span className="inline-block bg-cyan-950/50 text-cyan-400 border border-cyan-800/40 text-xs px-2 py-0.5 rounded-md font-medium">
                                  {shiftBadge}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {r.hasOverride ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => router.push(`/pm/asignacion-horarios/edit?projectId=${r.projectId}&userId=${r.userId}`)}
                                  className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1 transition-colors"
                                >
                                  <Pencil className="w-3 h-3 text-muted-foreground" />
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReset(r.userId, r.projectId)}
                                  disabled={resettingId === `${r.userId}:${r.projectId}`}
                                  className="h-8 px-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-400 inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Restablecer
                                </button>
                              </>
                            ) : r.projectId ? (
                              <button
                                type="button"
                                onClick={() => router.push(`/pm/asignacion-horarios/asign?projectId=${r.projectId}&userId=${r.userId}`)}
                                className="h-8 px-3 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1.5 shadow-sm transition-colors"
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
        </div>

        {/* Paginación estilo SVG */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between pt-1 px-1">
            <span className="text-xs text-muted-foreground">
              {filtered.length} asignacion{filtered.length === 1 ? "" : "es"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-background flex items-center justify-center text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground font-medium px-1">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-background flex items-center justify-center text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
