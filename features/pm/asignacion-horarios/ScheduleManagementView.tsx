"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import {
  Pencil, ChevronLeft, ChevronRight, RefreshCw, RotateCcw, Clock, Users, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { DataTable, Column } from "@/components/DataTable";

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
      { id: "all", name: "Todos los proyectos" },
      ...projects.map((p) => ({ id: p.id, name: p.name })),
    ];
  }, [projects]);

  const filtered = useMemo(() => {
    let data = schedules;
    if (statusFilter === "WITH_OVERRIDE") data = data.filter((d) => d.hasOverride);
    if (statusFilter === "WITHOUT_OVERRIDE") data = data.filter((d) => !d.hasOverride && d.projectId);
    
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

  const total = filtered.length;
  const withOverride = filtered.filter((s) => s.hasOverride).length;
  const withDefault = filtered.filter((s) => !s.hasOverride && s.projectId).length;
  const withoutProject = filtered.filter((s) => !s.projectId).length;

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const columns: Column<UserSchedule>[] = [
    {
      key: "user",
      header: "USUARIO",
      render: (r) => (
        <div>
          <p className="font-medium">{r.userName}</p>
          <p className="text-xs text-muted-foreground">{r.userEmail}</p>
        </div>
      ),
    },
    {
      key: "projectName",
      header: "PROYECTO",
      render: (r) => (
        <span className={`text-sm ${r.projectId ? "text-zinc-700" : "text-zinc-400"}`}>
          {r.projectName}
        </span>
      ),
    },
    {
      key: "effectiveStartHour",
      header: "ENTRADA",
      hideOnMobile: true,
      render: (r) => (
        <span className={r.hasOverride ? "text-violet-700 font-medium" : "text-zinc-700"}>
          {r.effectiveStartHour}
        </span>
      ),
    },
    {
      key: "effectiveEndHour",
      header: "SALIDA",
      hideOnMobile: true,
      render: (r) => (
        <span className={r.hasOverride ? "text-violet-700 font-medium" : "text-zinc-700"}>
          {r.effectiveEndHour}
        </span>
      ),
    },
    {
      key: "status",
      header: "TIPO",
      render: (r) => {
        if (!r.projectId) return <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">SIN PROYECTO</span>;
        const shiftLabel = r.shiftType === "ROTATING_4X4" ? "4x4"
          : r.shiftType === "ROTATING_7X7" ? "7x7"
          : r.shiftType === "FLEXIBLE" ? "FLEX"
          : r.shiftType === "TRANSITORY" ? "TRANS"
          : r.shiftType === "REGULAR" || r.shiftType === "PERMANENT" ? "REG"
          : r.shiftType || "—";
        if (r.hasOverride) return (
          <div className="flex items-center gap-1">
            <span className="text-xs px-2 py-1 rounded-full bg-violet-100 text-violet-700 font-medium">PERS.</span>
            {shiftLabel && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-500">{shiftLabel}</span>}
          </div>
        );
        return (
          <div className="flex items-center gap-1">
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">PROY.</span>
            {shiftLabel && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{shiftLabel}</span>}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "ACCIONES",
      render: (r) => (
        <div className="flex gap-1.5">
          {r.hasOverride ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() =>
                  router.push(`/pm/asignacion-horarios/edit?projectId=${r.projectId}&userId=${r.userId}`)
                }
              >
                <Pencil className="w-3 h-3" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                onClick={() => handleReset(r.userId, r.projectId)}
                disabled={resettingId === `${r.userId}:${r.projectId}`}
              >
                <RotateCcw className="w-3 h-3" />
                Restablecer
              </Button>
            </>
          ) : r.projectId ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => router.push(`/pm/asignacion-horarios/asign?projectId=${r.projectId}&userId=${r.userId}`)}
            >
              Asignar
            </Button>
          ) : (
            <span className="text-[10px] text-muted-foreground">Sin proyecto</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-4">

        <PageHeader
          categoryTag={{ badge: "JEFE DE PROYECTO", text: "Panel de Gestión" }}
          title="Asignación de Horarios"
          description="Los horarios se heredan del proyecto. Puede asignar horarios personalizados por usuario."
          showPeriodSelector={false}
        />

        <Card className="mt-4">
          <CardContent className="p-4">

            <div className="flex items-end gap-3 flex-wrap lg:flex-nowrap mb-4">

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SubMetricCard label="TOTAL" value={total} icon={<Clock className="w-5 h-5" />} />
                <SubMetricCard label="PERSONALIZADOS" value={withOverride} color="violet" icon={<Users className="w-5 h-5" />} />
                <SubMetricCard label="PROYECTO" value={withDefault} color="green" icon={<CheckCircle2 className="w-5 h-5" />} />
                <SubMetricCard label="SIN PROYECTO" value={withoutProject} color="red" icon={<XCircle className="w-5 h-5" />} />
              </div>

              <div className="flex flex-col w-full sm:w-auto sm:min-w-[200px]">
                <label className="text-[10px] text-muted-foreground">Proyecto</label>
                <select
                  className="border px-3 h-9 rounded-md text-sm"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                >
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col w-full sm:w-auto sm:min-w-[200px]">
                <label className="text-[10px] text-muted-foreground">Buscar</label>
                <input
                  type="text"
                  placeholder="Buscar usuario o proyecto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-border rounded-md px-3 h-9 text-sm w-full"
                />
              </div>

              <div className="flex flex-col w-full sm:w-auto sm:min-w-[140px]">
                <label className="text-[10px] text-muted-foreground">Tipo</label>
                <select
                  className="border px-3 h-9 rounded-md text-sm"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="ALL">Todos</option>
                  <option value="WITH_OVERRIDE">Personalizados</option>
                  <option value="WITHOUT_OVERRIDE">Por defecto</option>
                </select>
              </div>

              <div className="ml-auto flex gap-2">
                <Button variant="ghost" onClick={loadData} className="border border-slate-200 bg-card text-zinc-700 hover:bg-slate-50">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>

            </div>

            <DataTable
              data={paginated}
              columns={columns}
              loading={isLoading}
              emptyText="No se encontraron usuarios"
            />

            <div className="flex justify-between items-center mt-5">
              <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
