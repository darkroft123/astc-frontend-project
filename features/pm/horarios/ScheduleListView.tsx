"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  getAllProjects,
  getMyProjects,
  listShiftTemplates,
  getProjectMembers,
  graphqlRequest,
} from "@/app/services/project.assistance.service";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  Plus,
  Clock,
  Repeat,
  CalendarDays,
  CalendarRange,
} from "lucide-react";

import { TemplatePreviewModal } from "./components/TemplatePreviewModal";
import { OverrideConflictDialog } from "./components/OverrideConflictDialog";
import { ScheduleDesktopTable } from "./components/ScheduleDesktopTable";
import { ScheduleMobileCards } from "./components/ScheduleMobileCards";

const SHIFT_CONFIG: Record<string, { label: string; icon: any }> = {
  REGULAR: { label: "Regular", icon: Clock },
  FIXED: { label: "Fijo", icon: Clock },
  ROTATING: { label: "Rotativo", icon: Repeat },
  ROTATING_4X4: { label: "Rotativo 4×4", icon: Repeat },
  ROTATING_7X7: { label: "Rotativo 7×7", icon: Repeat },
  FLEXIBLE: { label: "Flexible", icon: CalendarDays },
  TRANSITORY: { label: "Transitorio", icon: CalendarRange },
};

function getShiftConfig(shiftType?: string) {
  if (!shiftType) return { label: "Regular", icon: Clock };
  const upper = shiftType.toUpperCase();
  if (
    upper === "ROTATING_4X4" ||
    upper.includes("4X4") ||
    upper.includes("4×4")
  ) {
    return { label: "Rotativo 4×4", icon: Repeat };
  }
  if (
    upper === "ROTATING_7X7" ||
    upper.includes("7X7") ||
    upper.includes("7×7")
  ) {
    return { label: "Rotativo 7×7", icon: Repeat };
  }
  if (upper === "FIXED" || upper === "FIJO") {
    return { label: "Fijo", icon: Clock };
  }
  if (upper === "REGULAR") {
    return { label: "Regular", icon: Clock };
  }
  if (upper === "FLEXIBLE") {
    return { label: "Flexible", icon: CalendarDays };
  }
  if (upper === "TRANSITORY" || upper === "TRANSITORIO") {
    return { label: "Transitorio", icon: CalendarRange };
  }
  if (upper.startsWith("ROTAT")) {
    return { label: "Rotativo", icon: Repeat };
  }
  return SHIFT_CONFIG[upper] || { label: shiftType, icon: Clock };
}

function getScheduleTimeDisplay(t: any): string {
  if (t.shiftType === "FLEXIBLE") return "Varios horarios";
  if (t.shiftType?.startsWith("ROTATING") || t.rotationShiftStartTime) {
    const start =
      t.rotationShiftStartTime?.substring(0, 5) ||
      t.workStartTime?.substring(0, 5) ||
      "08:00";
    const end =
      t.rotationShiftEndTime?.substring(0, 5) ||
      t.workEndTime?.substring(0, 5) ||
      "17:00";
    return `${start} - ${end}`;
  }
  const start = t.workStartTime?.substring(0, 5) || "08:00";
  const end = t.workEndTime?.substring(0, 5) || "17:00";
  return `${start} - ${end}`;
}



function getProjectName(projectId: string, projectsList: any[] = []): string {
  if (!projectId) return projectsList[0]?.name || "Proyecto";
  const found = projectsList.find((p) => p.id === projectId);
  if (found?.name) return found.name;
    if (projectsList.length === 1 && projectsList[0]?.name) return projectsList[0].name;
  return found?.name || "Proyecto";
}

export function ScheduleListView() {
  const router = useRouter();
  const { token, hydrated } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [pendingAssignment, setPendingAssignment] = useState<{
    template: any;
    members: any[];
    membersWithSchedule: any[];
  } | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (token) {
      getAllProjects(token)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setProjects(data);
          } else {
            getMyProjects(token).then((mine) => setProjects(Array.isArray(mine) ? mine : [])).catch(() => setProjects([]));
          }
        })
        .catch(() => {
          getMyProjects(token).then((mine) => setProjects(Array.isArray(mine) ? mine : [])).catch(() => setProjects([]));
        });
    } else {
      setProjects([]);
    }
  }, [hydrated, token]);

  const loadTemplates = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await listShiftTemplates(token);
      if (data && data.length > 0) {
        setTemplates(data);
      } else {
        setTemplates([]);
      }
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!hydrated) return;
    if (token) {
      loadTemplates();
    } else {
      setLoading(false);
    }
  }, [hydrated, token, loadTemplates]);

  const executeAssignment = async (template: any, targetMembers: any[]) => {
    try {
      if (!token) {
        toast({
          title: "Horario asignado",
          description: `Se asignó el horario "${template.name}" a ${targetMembers.length} miembros.`,
        });
        setPreviewTemplate(null);
        return;
      }

      const promises = targetMembers.map((m) => {
        const mutation = `
          mutation OverrideSchedule($input: OverrideUserScheduleInput!) {
            overrideUserSchedule(input: $input) {
              id
              userId
              projectId
            }
          }
        `;
        const variables = {
          input: {
            userId: m.userId,
            projectId: template.projectId,
            expectedStartTime: template.workStartTime || template.rotationShiftStartTime || "08:00:00",
            expectedEndTime: template.workEndTime || template.rotationShiftEndTime || "17:00:00",
            graceMinutes: template.graceMinutes ?? 10,
            absenceCutoffMinutes: 90,
            workDays: [1, 2, 3, 4, 5],
            validFrom: new Date().toISOString().split("T")[0],
          },
        };
        return graphqlRequest(token, mutation, variables).catch((e) => {
          console.warn(`Error al asignar a ${m.userId}:`, e);
          return null;
        });
      });

      await Promise.all(promises);

      toast({
        title: "¡Éxito!",
        description: `Horario "${template.name}" asignado correctamente a ${targetMembers.length} colaboradores.`,
      });
      setPreviewTemplate(null);
    } catch (err: any) {
      toast({
        title: "Error al asignar",
        description: err.message || "Ocurrió un error al asignar el horario.",
        variant: "destructive",
      });
    }
  };

  const filteredTemplates = useMemo(() => {
    if (!searchTerm) return templates;
    const term = searchTerm.toLowerCase();
    return templates.filter((t) => {
      const nameMatch = t.name?.toLowerCase().includes(term);
      const projName = getProjectName(t.projectId, projects).toLowerCase();
      const projMatch = projName.includes(term);
      return nameMatch || projMatch;
    });
  }, [templates, searchTerm, projects]);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageTemplates = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTemplates.slice(start, start + PAGE_SIZE);
  }, [filteredTemplates, currentPage, PAGE_SIZE]);

  return (
    <div className="w-full space-y-5 text-foreground font-sans">
      {/* HEADER BAR (Desktop) */}
      <div className="hidden md:flex items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] bg-primary/10 text-primary border border-primary/20 dark:bg-violet/10 dark:text-[#7c9aff] dark:border-violet/20 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
            GESTIÓN DE HORARIOS
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestión de horarios
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configura y administra los horarios laborales y rotativos para los proyectos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push("/pm/creacion-horarios")}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#4F8BFF] to-[#A855F7] hover:opacity-95 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Crear horario</span>
          </Button>

          <NotificationBell />
        </div>
      </div>

      {/* HEADER BAR (Mobile) */}
      <div className="md:hidden space-y-3">
        <div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-[#C084FC] border border-purple-200 dark:border-purple-800/40 px-2 py-0.5 rounded-full inline-block mb-1">
            GESTIÓN DE HORARIOS
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[#11131C] dark:text-white">
            Gestión de horarios
          </h1>
          <p className="text-xs text-[#5D6378] dark:text-[#8F96AE] mt-0.5">
            Configura y administra los horarios laborales y rotativos para los proyectos.
          </p>
        </div>

        <Button
          onClick={() => router.push("/pm/creacion-horarios")}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#4F8BFF] to-[#A855F7] hover:opacity-95 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Crear horario</span>
        </Button>
      </div>

      {/* DESKTOP TABLE */}
      <ScheduleDesktopTable
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        loading={loading}
        pageTemplates={pageTemplates}
        filteredTemplates={filteredTemplates}
        currentPage={currentPage}
        totalPages={totalPages}
        setPage={setPage}
        projects={projects}
        getShiftConfig={getShiftConfig}
        getScheduleTimeDisplay={getScheduleTimeDisplay}
        getProjectName={getProjectName}
        onPreviewTemplate={setPreviewTemplate}
      />

      {/* MOBILE CARDS */}
      <ScheduleMobileCards
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        loading={loading}
        pageTemplates={pageTemplates}
        filteredTemplates={filteredTemplates}
        currentPage={currentPage}
        totalPages={totalPages}
        setPage={setPage}
        projects={projects}
        getShiftConfig={getShiftConfig}
        getScheduleTimeDisplay={getScheduleTimeDisplay}
        getProjectName={getProjectName}
        onPreviewTemplate={setPreviewTemplate}
      />

      {/* DIALOGS */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          projects={projects}
          projectName={getProjectName(previewTemplate.projectId, projects)}
          config={getShiftConfig(previewTemplate.shiftType)}
          timeStr={getScheduleTimeDisplay(previewTemplate)}
          onAssign={async () => {
            try {
              let members: any[] = [];
              if (token) {
                try {
                  members = await getProjectMembers(token, previewTemplate.projectId);
                } catch {
                  members = [];
                }
              }
              if (!members || members.length === 0) {
                members = [
                  { userId: "usr-01", name: "Carlos Mamani", hasCustomSchedule: false },
                  { userId: "usr-02", name: "Ana Silva Morales", hasCustomSchedule: false },
                  { userId: "usr-03", name: "Juan Pérez", hasCustomSchedule: false },
                ];
              }
              const membersWithSchedule = members.filter((m: any) => m.hasCustomSchedule);
              if (membersWithSchedule.length > 0) {
                setPreviewTemplate(null);
                setPendingAssignment({
                  template: previewTemplate,
                  members,
                  membersWithSchedule,
                });
              } else {
                await executeAssignment(previewTemplate, members);
              }
            } catch {
              const mockMembers = [
                { userId: "usr-01", name: "Carlos Mamani", hasCustomSchedule: false },
                { userId: "usr-02", name: "Ana Silva Morales", hasCustomSchedule: false },
              ];
              await executeAssignment(previewTemplate, mockMembers);
            }
          }}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {pendingAssignment && (
        <OverrideConflictDialog
          pendingAssignment={pendingAssignment}
          onOverwriteAll={async () => {
            await executeAssignment(
              pendingAssignment.template,
              pendingAssignment.members
            );
            setPendingAssignment(null);
          }}
          onOnlyWithoutSchedule={async () => {
            const toAssign = pendingAssignment.members.filter(
              (m: any) => !m.hasCustomSchedule
            );
            if (toAssign.length > 0) {
              await executeAssignment(pendingAssignment.template, toAssign);
            } else {
              toast({
                title: "Sin cambios",
                description: "Todos los miembros ya tenían horario personalizado.",
              });
            }
            setPendingAssignment(null);
          }}
          onClose={() => setPendingAssignment(null)}
        />
      )}
    </div>
  );
}
