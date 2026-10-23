"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  getAllProjects,
  getAllUsers,
  listScheduleOverrides,
  deleteSchedule,
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
];

export function ScheduleManagementView() {
  const { token, hydrated } = useAuth();
  const [schedules, setSchedules] = useState<UserSchedule[]>(DEFAULT_MOCK_SCHEDULES);
  const [projects, setProjects] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [projs, users, overrides] = await Promise.all([
        getAllProjects(token).catch(() => []),
        getAllUsers(token).catch(() => []),
        listScheduleOverrides(token).catch(() => []),
      ]);

      setProjects(projs || []);

      const overrideMap = new Map<string, any>();
      for (const ov of overrides || []) {
        overrideMap.set(`${ov.userId}:${ov.projectId}`, ov);
      }

      const list: UserSchedule[] = [];
      const userList = users || [];

      for (const u of userList) {
        const uProjects =
          u.projects && u.projects.length > 0
            ? u.projects
            : [{ id: "p1", name: "Gestión de Asistencia" }];

        for (const p of uProjects) {
          const ov = overrideMap.get(`${u.id}:${p.id}`);
          const pStart = p.startHour || "09:00";
          const pEnd = p.endHour || "18:00";
          const pGrace = p.graceMinutes ?? 10;

          list.push({
            userId: u.id,
            userName: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
            userEmail: u.email,
            projectId: p.id,
            projectName: p.name,
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
            shiftType: ov ? ov.shiftType || "CUSTOM" : "REGULAR",
          });
        }
      }

      setSchedules(list.length > 0 ? list : DEFAULT_MOCK_SCHEDULES);
    } catch {
      setSchedules(DEFAULT_MOCK_SCHEDULES);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (hydrated && token) {
      loadData();
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
