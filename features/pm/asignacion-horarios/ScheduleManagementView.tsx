"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  getAllProjects,
  getMyProjects,
  getAllUsers,
  listScheduleOverrides,
  deleteSchedule,
  isAdminUser,
  isAdminUserId,
} from "@/app/services/project.assistance.service";
import PageHeader from "@/components/layout/page-header";

import { ScheduleKPIs } from "./components/ScheduleKPIs";
import { ScheduleFilters } from "./components/ScheduleFilters";
import { ScheduleDesktopTable } from "./components/ScheduleDesktopTable";
import { ScheduleMobileCards } from "./components/ScheduleMobileCards";

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
  const { token, hydrated } = useAuth();
  const [schedules, setSchedules] = useState<UserSchedule[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("selected_project_id") || "all" : "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Sync with PM global sidebar project selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem("selected_project_id");
      if (savedId) setProjectFilter(savedId);

      const handleProjectChange = (e: Event) => {
        const customEvent = e as CustomEvent<string>;
        const newId = customEvent.detail ?? localStorage.getItem("selected_project_id") ?? "all";
        setProjectFilter(newId);
        setPage(1);
      };

      window.addEventListener("astc-project-changed", handleProjectChange);
      return () => {
        window.removeEventListener("astc-project-changed", handleProjectChange);
      };
    }
  }, []);



  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      let projs = await getAllProjects(token).catch(() => []);
      if (!projs || projs.length === 0) {
        projs = await getMyProjects(token).catch(() => []);
      }
      const [users, overrides] = await Promise.all([
        getAllUsers(token).catch(() => []),
        listScheduleOverrides(token).catch(() => []),
      ]);

      const projectList = Array.isArray(projs) ? projs : [];
      setProjects(projectList);

      const overrideMap = new Map<string, any>();
      for (const ov of overrides || []) {
        overrideMap.set(`${ov.userId}:${ov.projectId}`, ov);
      }

      const projectMap = new Map<string, any>();
      for (const p of projectList) {
        projectMap.set(p.id, p);
      }

      const list: UserSchedule[] = [];
      const userList = (Array.isArray(users) ? users : []).filter(
        (u: any) => !isAdminUser(u) && !isAdminUserId(u?.id)
      );

      for (const u of userList) {
        let uProjects = u.projects && u.projects.length > 0 ? u.projects : [];
        if (uProjects.length === 0 && projectList.length > 0) {
          const memberOf = projectList.filter((pr: any) =>
            pr.members?.some((m: any) => m.userId === u.id) ||
            pr.responsibleId === u.id ||
            overrideMap.has(`${u.id}:${pr.id}`)
          );
          uProjects = memberOf;
        }
        if (uProjects.length === 0) continue;

        for (const p of uProjects) {
          const ov = overrideMap.get(`${u.id}:${p.id}`);
          const realProject = projectMap.get(p.id) || p;
          const pStart = realProject.workStartTime?.substring(0, 5) || realProject.startHour || "09:00";
          const pEnd = realProject.workEndTime?.substring(0, 5) || realProject.endHour || "18:00";
          const pGrace = realProject.graceMinutes ?? 10;
          const pName = realProject.name || p.name || "Proyecto";

          list.push({
            userId: u.id,
            userName: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || u.email,
            userEmail: u.email,
            projectId: realProject.id || p.id,
            projectName: pName,
            projectStartHour: pStart,
            projectEndHour: pEnd,
            projectGraceMinutes: pGrace,
            effectiveStartHour: ov
              ? ov.expectedStartTime?.substring(0, 5) || pStart
              : pStart,
            effectiveEndHour: ov
              ? ov.expectedEndTime?.substring(0, 5) || pEnd
              : pEnd,
            hasOverride: !!ov,
            overrideId: ov ? ov.id : null,
            shiftType: ov ? ov.shiftType || "CUSTOM" : (realProject.shiftType || "REGULAR"),
          });
        }
      }

      setSchedules(list);
    } catch {
      setSchedules([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!hydrated) return;
    if (token) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [hydrated, token, loadData]);

  const handleReset = async (userId: string, projectId: string) => {
    if (!token) return;
    if (!confirm("¿Deseas restablecer el horario al valor por defecto del proyecto?")) {
      return;
    }
    setResettingId(`${userId}:${projectId}`);
    try {
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
    if (statusFilter === "WITHOUT_OVERRIDE")
      data = data.filter((d) => !d.hasOverride && d.projectId);
    if (statusFilter === "NO_PROJECT") data = data.filter((d) => !d.projectId);

    if (searchTerm.trim() !== "") {
      const lower = searchTerm.toLowerCase();
      data = data.filter(
        (d) =>
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
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <PageHeader
          categoryTag={{ badge: "PANEL DE GESTIÓN", text: "Administración" }}
          title="Asignación de horarios"
          description="Los horarios se heredan del proyecto. Puede asignar horarios personalizados por usuario."
          showPeriodSelector={false}
        />

        {/* UNIFIED MAIN CONTAINER */}
        <div className="rounded-[22px] border border-border bg-card/60 dark:bg-[#0C0E18] p-4 sm:p-5 md:p-6 shadow-sm space-y-5 sm:space-y-6">
          {/* 4 Metric Cards */}
          <ScheduleKPIs
            total={total}
            withOverride={withOverride}
            withDefault={withDefault}
            withoutProject={withoutProject}
          />

          {/* Divider Line */}
          <div className="border-t border-border/60 -mx-4 sm:-mx-5 md:-mx-6" />

          {/* Filters Container */}
          <ScheduleFilters
            projectFilter={projectFilter}
            setProjectFilter={setProjectFilter}
            projectOptions={projectOptions}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            isLoading={isLoading}
            onRefresh={loadData}
          />

          {/* Mobile View: Cards */}
          <ScheduleMobileCards
            paginated={paginated}
            isLoading={isLoading}
            getInitials={getInitials}
            onReset={handleReset}
            resettingId={resettingId}
          />

          {/* Desktop View: Tabla + Paginación */}
          <ScheduleDesktopTable
            paginated={paginated}
            filtered={filtered}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            getInitials={getInitials}
            onReset={handleReset}
            resettingId={resettingId}
          />
        </div>
      </div>
    </div>
  );
}
