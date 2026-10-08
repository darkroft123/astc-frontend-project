"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatAvatarUrl } from "@/lib/avatar-url";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  CheckCircle2, AlertCircle, FileText, Loader2, FolderKanban, Building2, Clock, AlertTriangle } from "lucide-react";
import PeriodSelector from "@/components/period-selector";
import PageHeader from "@/components/layout/page-header";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { GeneralSummaryCard } from "@/components/dashboard/GeneralSummaryCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ================= SERVICE ================= */
import { getDashboardPM, getAllProjects, getAllUsers, getProjectMembers } from "@/app/services/project.assistance.service";

/* ================= CHART ================= */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

interface Metrics {
  totalAttendances: number;
  totalAbsences: number;
  pendingJustifications: number;
}

const initialMetrics: Metrics = {
  totalAttendances: 0,
  totalAbsences: 0,
  pendingJustifications: 0,
};

const getInitialMonthRange = (): DateRange => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  return {
    fromDate: formatDate(firstDay),
    toDate: formatDate(today),
    label: "Este mes",
    period: "month",
  };
};

export function DashboardView() {
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getInitialMonthRange());

  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);

  const { hydrated, token, user, role, checkingAuth } = useAuth();

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

  const selectedProject = useMemo(() => {
    if (selectedProjectId === "all") return null;
    return activeProjects.find((p) => p.id === selectedProjectId) || null;
  }, [selectedProjectId, activeProjects]);

  /* ================= LOAD DYNAMIC PROJECTS & USERS ================= */

  useEffect(() => {
    if (hydrated && token) {
      getAllProjects(token)
        .then((res) => {
          setActiveProjects(res || []);
        })
        .catch((err) => {
          console.error("Error loading PM projects:", err);
          setActiveProjects([]);
        })
        .finally(() => {
          setLoadingProjects(false);
        });

      const projectFilter = selectedProjectId && selectedProjectId !== "all" ? selectedProjectId : undefined;

      const loadMembersFromProjects = async (projectIds: string[]) => {
        const allMembers: any[] = [];
        const seen = new Set<string>();
        for (const pid of projectIds) {
          try {
            const members = await getProjectMembers(token, pid);
            if (members) {
              for (const m of members) {
                if (!seen.has(m.userId)) {
                  seen.add(m.userId);
                  allMembers.push(m);
                }
              }
            }
          } catch { }
        }
        return allMembers;
      };

      (projectFilter
        ? getProjectMembers(token, projectFilter).catch(() => [])
        : getAllProjects(token).then((res) => loadMembersFromProjects((res || []).map((p: any) => p.id))).catch(() => [])
      ).then((members: any[]) => {
          if (!members || members.length === 0) { setUsers([]); return; }
          const userIds = members.map((m: any) => m.userId);
          getAllUsers(token)
            .then((allUsers) => {
              const filtered = (allUsers || []).filter((u: any) => userIds.includes(u.id));
              setUsers(filtered);
            })
            .catch(() => setUsers([]));
        })
        .catch(() => setUsers([]));
    }
  }, [hydrated, token, selectedProjectId]);

  /* ================= FETCH DASHBOARD ================= */

  useEffect(() => {
    if (!hydrated || checkingAuth || !token) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoadingMetrics(true);

        const data = await getDashboardPM(
          token,
          selectedProjectId === "all" ? undefined : selectedProjectId,
          dateRange.fromDate,
          dateRange.toDate
        );

        if (cancelled) return;

        if (data) {
          setMetrics({
            totalAttendances: data.totalAttendances ?? 0,
            totalAbsences: data.totalAbsences ?? 0,
            pendingJustifications: data.pendingJustifications ?? 0,
          });
        }
      } catch (err) {
        console.error("Dashboard PM load error:", err);
      } finally {
        if (!cancelled) setLoadingMetrics(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    checkingAuth,
    token,
    selectedProjectId,
    dateRange.fromDate,
    dateRange.toDate,
  ]);

  if (!hydrated || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!loadingProjects && activeProjects.length === 0) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
        <Card className="max-w-md w-full rounded-3xl border border-amber-200/50 bg-card text-card-foreground shadow-xl p-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 border border-amber-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-2xl mb-3 tracking-tight">Sin Proyectos Asignados</h3>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            No tienes proyectos asignados actualmente. Contacta a tu administrador para que te asigne a un proyecto.
          </p>
        </Card>
      </div>
    );
  }

  const totalAtt = metrics?.totalAttendances ?? 0;
  const totalAbs = metrics?.totalAbsences ?? 0;
  const pendingJust = metrics?.pendingJustifications ?? 0;

  const attendanceRate =
    totalAtt + totalAbs > 0
      ? Math.round((totalAtt / (totalAtt + totalAbs)) * 100)
      : 0;

  const chartData = [
    {
      name: "Asistencias",
      value: totalAtt,
    },
    {
      name: "Faltas",
      value: totalAbs,
    },
    {
      name: "Pendientes",
      value: pendingJust,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/50 pb-8">
      <div className="px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Dashboard"
          description="Visión general del rendimiento y la actividad del equipo"
          categoryTag={{ badge: "JEFE DE PROYECTO", text: "Panel de Gestión" }}
          period={dateRange.period}
          dateRange={dateRange}
          onPeriodChange={setDateRange}
        />
      </div>



      <div className="p-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-3">
            <Card className="lg:col-span-4 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl shadow-md border-0 overflow-hidden text-white">
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 rounded-full border-2 border-white/40 shadow-sm shrink-0">
                    <AvatarImage src={formatAvatarUrl(user?.avatarUrl)} alt={user?.username} className="object-cover" />
                    <AvatarFallback className="bg-card text-primary text-lg font-bold">
                      {(user?.username || "P").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <span className="bg-card/20 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      {role || "PROJECT_MANAGER"}
                    </span>
                    <h2 className="text-base font-bold text-white truncate mt-0.5">
                      {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.username ?? "Jefe de Proyecto")}
                    </h2>
                    <p className="text-blue-100 text-xs truncate">
                      {user?.email ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-white/15">
                  <div className="bg-card/10 rounded-xl p-2.5">
                    <p className="text-white/70 text-[9px] uppercase tracking-wider font-semibold">USUARIO</p>
                    <p className="text-white text-xs font-bold truncate mt-0.5">
                      {user?.username ?? "—"}
                    </p>
                  </div>

                  <div className="bg-card/10 rounded-xl p-2.5">
                    <p className="text-white/70 text-[9px] uppercase tracking-wider font-semibold">PROYECTO</p>
                    <p className="text-white text-xs font-bold truncate mt-0.5">
                      {selectedProject?.name || "Todos"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                icon={<CheckCircle2 />}
                value={metrics.totalAttendances}
                title="Asistencias"
                subtitle="Asistencias del equipo"
                trend="Último período"
                color="emerald"
              />

              <MetricCard
                icon={<AlertCircle />}
                value={metrics.totalAbsences}
                title="Faltas"
                subtitle="Faltas del equipo"
                trend="Histórico"
                color="rose"
              />

              <MetricCard
                icon={<FileText />}
                value={metrics.pendingJustifications}
                title="Por Justificar"
                subtitle="Justificaciones por revisar"
                trend="Revisión requerida"
                color="amber"
              />

              <MetricCard
                icon={<Building2 />}
                value={`${attendanceRate}%`}
                title="Cumplimiento"
                subtitle="Cumplimiento del equipo"
                trend="Promedio actual"
                color="blue"
              />
            </div>
          </div>
        </div>

        {/* ROW 1: Resumen General (50%) | Actividad Reciente (50%) */}
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-12 lg:col-span-6">
            <GeneralSummaryCard
              selectedProject={selectedProject || { name: "Todos los proyectos" }}
              attendanceRate={attendanceRate}
              metrics={metrics}
            />
          </div>

          <div className="col-span-12 lg:col-span-6">
            <RecentActivityCard users={users} />
          </div>
        </div>

        {/* ROW 2: Resumen de Asistencias (Gráfico de Barras) (50%) | Acciones Rápidas (50%) */}
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-12 lg:col-span-6">
            <Card className="rounded-2xl border border-border bg-card shadow-sm h-full flex flex-col justify-between">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">
                    Resumen de Asistencias
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Distribución de asistencias, faltas y solicitudes
                  </p>

                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                        <YAxis stroke="#888888" fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}
