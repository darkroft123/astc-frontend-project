"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import ScheduleForm from "@/components/dashboard/projects/assignaments/Schedule-form";
import { getProjectById, getAllUsers, listScheduleOverrides } from "@/app/services/project.assistance.service";

export default function EditSchedulePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const userId = searchParams.get("userId");
  const { token, hydrated } = useAuth();

  const fallbackSchedule = {
    userId: userId || "usr-01",
    projectId: projectId || "p1",
    userName: "Carlos Mamani (@carlos123)",
    userEmail: "cmamani@empresa.com",
    projectName: "Gestión de Asistencia",
    startHour: "08:00",
    endHour: "17:00",
    graceMinutes: 10,
    hasOverride: true,
    shiftType: "REGULAR",
  };

  const [schedule, setSchedule] = useState<any>(fallbackSchedule);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSchedule() {
      if (!hydrated || !token || !projectId || !userId) {
        setSchedule(fallbackSchedule);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [project, users, overrides] = await Promise.all([
          getProjectById(token, projectId).catch(() => null),
          getAllUsers(token).catch(() => []),
          listScheduleOverrides(token, projectId, userId).catch(() => []),
        ]);

        const user = users?.find((u: any) => u.id === userId);
        if (!project || !user) {
          setSchedule(fallbackSchedule);
          return;
        }

        const projAny = project as any;
        const override = overrides?.find((o: any) => o.userId === userId && o.projectId === projectId);

        setSchedule({
          userId: userId,
          projectId: projectId,
          userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Carlos Mamani",
          userEmail: user.email || "cmamani@empresa.com",
          projectName: project.name || "Gestión de Asistencia",
          startHour: override?.workStartTime || projAny.workStartTime || "08:00",
          endHour: override?.workEndTime || projAny.workEndTime || "17:00",
          graceMinutes: override?.graceMinutes ?? projAny.graceMinutes ?? 10,
          hasOverride: !!override,
          shiftType: override?.shiftType || projAny.shiftType || "REGULAR",
        });
      } catch (err) {
        console.error("Error loading schedule for edit:", err);
        setSchedule(fallbackSchedule);
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, [hydrated, token, projectId, userId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return <ScheduleForm mode="edit" initialData={schedule} />;
}
