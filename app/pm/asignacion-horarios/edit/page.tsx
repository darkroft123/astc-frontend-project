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

  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchedule() {
      if (!hydrated || !token || !projectId || !userId) {
        setLoading(false);
        return;
      }
      try {
        const [project, users, overrides] = await Promise.all([
          getProjectById(token, projectId),
          getAllUsers(token),
          listScheduleOverrides(token, projectId, userId),
        ]);

        const user = users?.find((u: any) => u.id === userId);
        if (!project || !user) { setLoading(false); return; }

        const projAny = project as any;
        const override = overrides?.find((o: any) => o.userId === userId && o.projectId === projectId);

        setSchedule({
          userId: userId,
          projectId: projectId,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          projectName: project.name,
          startHour: override?.workStartTime || projAny.workStartTime || "08:00",
          endHour: override?.workEndTime || projAny.workEndTime || "17:00",
          graceMinutes: override?.graceMinutes ?? projAny.graceMinutes ?? 10,
          hasOverride: !!override,
        });
      } catch (err) {
        console.error("Error loading schedule for edit:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, [hydrated, token, projectId, userId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando asignación...</div>;
  }

  if (!schedule) {
    return <div className="min-h-screen flex items-center justify-center">Asignación no encontrada</div>;
  }

  return (
    <div className="min-h-screen bg-muted/50 p-4">
      <ScheduleForm mode="edit" initialData={schedule} />
    </div>
  );
}
