"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { ArrowLeft } from "lucide-react";
import {
  getAllProjects,
  createShiftTemplate,
  listShiftTemplates,
} from "@/app/services/project.assistance.service";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/layout/notification-bell";

import { ScheduleAssignmentCard } from "./components/ScheduleAssignmentCard";
import { ShiftTypeSelector, ShiftType } from "./components/ShiftTypeSelector";
import { ShiftTimeConfigCard, Preset, DAYS } from "./components/ShiftTimeConfigCard";
import { ShiftGeneralRulesCard } from "./components/ShiftGeneralRulesCard";
import { ScheduleCreationActionBar } from "./components/ScheduleCreationActionBar";

const DEFAULT_MOCK_PROJECTS = [
  { id: "p-testeo", name: "proyecto testeo" },
  { id: "p1", name: "Gestión de Asistencia" },
  { id: "p2", name: "proyecto testeo" },
  { id: "p3", name: "testo6" },
];

const DEFAULT_MOCK_TEMPLATES = [
  {
    id: "tpl-tessttt",
    name: "tessttt",
    shiftType: "ROTATING_4X4",
    projectId: "p-testeo",
    rotationWorkDays: 4,
    rotationRestDays: 4,
    rotationShiftStartTime: "08:00:00",
    rotationShiftEndTime: "17:00:00",
    graceMinutes: 10,
    absenceCutoffTime: "08:30:00",
    timezone: "America/Lima",
    validFrom: "2026-01-01",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl-1",
    name: "Horario Regular Administrativo",
    shiftType: "REGULAR",
    projectId: "p1",
    workStartTime: "09:00:00",
    workEndTime: "18:00:00",
    graceMinutes: 10,
    absenceCutoffTime: "10:30:00",
    timezone: "America/Lima",
    validFrom: "2026-01-01",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl-flex",
    name: "Horario Flexible de Verano",
    shiftType: "FLEXIBLE",
    projectId: "p3",
    graceMinutes: 15,
    absenceCutoffTime: "10:00:00",
    timezone: "America/Lima",
    validFrom: "2026-01-01",
    flexibleHours: 8,
    fridayEnd: "14:00:00",
    createdAt: new Date().toISOString(),
  },
];

export function HorarioCreationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("id") || null;
  const isEditMode = !!editId;

  const { token, hydrated } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState<any[]>(DEFAULT_MOCK_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("");
  const [shiftType, setShiftType] = useState<ShiftType>("REGULAR");
  const [selectedPreset, setSelectedPreset] = useState<string>("dia");

  const [startHour, setStartHour] = useState("08:00");
  const [endHour, setEndHour] = useState("17:00");
  const [validFrom, setValidFrom] = useState("2026-01-01");
  const [validUntil, setValidUntil] = useState("2026-12-31");

  const [rotationWorkDays, setRotationWorkDays] = useState(4);
  const [rotationRestDays, setRotationRestDays] = useState(4);
  const [rotationStartHour, setRotationStartHour] = useState("08:00");
  const [rotationEndHour, setRotationEndHour] = useState("17:00");

  const [flexHours, setFlexHours] = useState<Record<string, { start: string; end: string }>>({
    monday: { start: "08:00", end: "17:00" },
    tuesday: { start: "08:00", end: "17:00" },
    wednesday: { start: "08:00", end: "17:00" },
    thursday: { start: "08:00", end: "17:00" },
    friday: { start: "08:00", end: "17:00" },
    saturday: { start: "", end: "" },
    sunday: { start: "", end: "" },
  });

  const [graceMinutes, setGraceMinutes] = useState(10);
  const [absenceCutoffTime, setAbsenceCutoffTime] = useState("09:30");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (token) {
      getAllProjects(token)
        .then((data) => {
          if (data && data.length > 0) setProjects(data);
        })
        .catch(() => {});
    }
  }, [hydrated, token]);

  const loadTemplateForEdit = useCallback(async (id: string) => {
    let t: any = null;
    if (typeof window !== "undefined") {
      try {
        const custom = JSON.parse(localStorage.getItem("pm_shift_templates_custom") || "[]");
        t = custom.find((item: any) => item.id === id);
      } catch {}
    }
    if (!t && token) {
      try {
        const remote = await listShiftTemplates(token);
        t = remote.find((item: any) => item.id === id);
      } catch {}
    }
    if (!t) {
      t = DEFAULT_MOCK_TEMPLATES.find((item) => item.id === id);
    }

    if (t) {
      setSelectedProjectId(t.projectId || "");
      setTemplateName(t.name || "");
      if (t.shiftType) setShiftType(t.shiftType as ShiftType);
      if (t.graceMinutes != null) setGraceMinutes(t.graceMinutes);
      if (t.absenceCutoffTime) setAbsenceCutoffTime(t.absenceCutoffTime.substring(0, 5));

      if (t.workStartTime) setStartHour(t.workStartTime.substring(0, 5));
      if (t.workEndTime) setEndHour(t.workEndTime.substring(0, 5));

      if (t.rotationWorkDays != null) setRotationWorkDays(t.rotationWorkDays);
      if (t.rotationRestDays != null) setRotationRestDays(t.rotationRestDays);
      if (t.rotationShiftStartTime) setRotationStartHour(t.rotationShiftStartTime.substring(0, 5));
      if (t.rotationShiftEndTime) setRotationEndHour(t.rotationShiftEndTime.substring(0, 5));

      if (t.validFrom) setValidFrom(t.validFrom.split("T")[0]);
      if (t.validUntil) setValidUntil(t.validUntil.split("T")[0]);
    }
  }, [token]);

  useEffect(() => {
    if (editId) {
      loadTemplateForEdit(editId);
    }
  }, [editId, loadTemplateForEdit]);

  const handleShiftTypeChange = (type: ShiftType) => {
    setShiftType(type);
    if (type === "ROTATING_4X4") {
      setRotationWorkDays(4);
      setRotationRestDays(4);
    } else if (type === "ROTATING_7X7") {
      setRotationWorkDays(7);
      setRotationRestDays(7);
    }
  };

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset.id);
    setStartHour(preset.start);
    setEndHour(preset.end);
    setAbsenceCutoffTime(preset.cutoff);
  };

  const isFormValid = useMemo(() => {
    return selectedProjectId.trim() !== "" && templateName.trim() !== "";
  }, [selectedProjectId, templateName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast({
        title: "Campos requeridos",
        description: "Por favor selecciona un proyecto y define el nombre del horario.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const targetId = editId || `tpl-${Date.now()}`;
    const templateData: any = {
      id: targetId,
      projectId: selectedProjectId,
      name: templateName,
      shiftType,
      graceMinutes: Number(graceMinutes) || 10,
      absenceCutoffTime: `${absenceCutoffTime}:00`,
      timezone: "America/Lima",
      validFrom,
      validUntil: shiftType === "TRANSITORY" ? validUntil : undefined,
      updatedAt: new Date().toISOString(),
    };

    if (shiftType === "REGULAR" || shiftType === "TRANSITORY") {
      templateData.workStartTime = `${startHour}:00`;
      templateData.workEndTime = `${endHour}:00`;
    } else if (shiftType.startsWith("ROTATING")) {
      templateData.rotationWorkDays = rotationWorkDays;
      templateData.rotationRestDays = rotationRestDays;
      templateData.rotationShiftStartTime = `${rotationStartHour}:00`;
      templateData.rotationShiftEndTime = `${rotationEndHour}:00`;
    } else if (shiftType === "FLEXIBLE") {
      templateData.flexHours = flexHours;
    }

    try {
      if (token && !isEditMode) {
        await createShiftTemplate(token, {
          projectId: selectedProjectId,
          name: templateName,
          shiftType,
          graceMinutes: Number(graceMinutes) || 10,
          absenceCutoffTime: `${absenceCutoffTime}:00`,
          workStartTime: `${startHour}:00`,
          workEndTime: `${endHour}:00`,
        }).catch(() => {});
      }

      if (typeof window !== "undefined") {
        try {
          const custom = JSON.parse(localStorage.getItem("pm_shift_templates_custom") || "[]");
          const idx = custom.findIndex((t: any) => t.id === targetId);
          if (idx !== -1) {
            custom[idx] = { ...custom[idx], ...templateData };
          } else {
            custom.unshift(templateData);
          }
          localStorage.setItem("pm_shift_templates_custom", JSON.stringify(custom));
        } catch {}
      }

      toast({
        title: isEditMode ? "Horario actualizado exitosamente" : "Horario creado exitosamente",
        description: `El horario "${templateName}" ha sido guardado.`,
      });
      router.push("/pm/horarios");
    } catch {
      toast({
        title: isEditMode ? "Horario actualizado localmente" : "Horario registrado localmente",
      });
      router.push("/pm/horarios");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent pb-16 font-sans">
      {/* Top Ambient Glow */}
      <div
        className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-lg h-72 rounded-full opacity-30 blur-3xl z-0 hidden dark:block"
        style={{
          background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)",
        }}
      />

      {/* Main Viewport Container */}
      <div className="relative w-full max-w-7xl mx-auto space-y-6 z-10">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => router.push("/pm/horarios")}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors cursor-pointer group mb-1.5"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Gestión de horarios</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {isEditMode ? "Editar horario" : "Crear horario"}
            </h1>
            <p className="font-hanken text-xs text-muted-foreground leading-relaxed max-w-2xl">
              {isEditMode
                ? "Modifica los parámetros del horario, tipo de turno y reglas de asistencia."
                : "Define horarios con distintos tipos de turno para los proyectos."}
            </p>
          </div>

          <div className="hidden md:block">
            <NotificationBell />
          </div>
        </div>

        {/* 2-COLUMN GRID BODY */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
            {/* COLUMNA IZQUIERDA: ASIGNACIÓN Y TIPO DE TURNO */}
            <div className="space-y-5 sm:space-y-6">
              <ScheduleAssignmentCard
                projects={projects}
                selectedProjectId={selectedProjectId}
                setSelectedProjectId={setSelectedProjectId}
                templateName={templateName}
                setTemplateName={setTemplateName}
              />

              <ShiftTypeSelector
                shiftType={shiftType}
                onShiftTypeChange={handleShiftTypeChange}
              />
            </div>

            {/* COLUMNA DERECHA: CONFIGURACIÓN DE HORAS Y REGLAS GENERALES */}
            <div className="space-y-5 sm:space-y-6">
              <ShiftTimeConfigCard
                shiftType={shiftType}
                selectedPreset={selectedPreset}
                onPresetSelect={handlePresetSelect}
                startHour={startHour}
                setStartHour={setStartHour}
                endHour={endHour}
                setEndHour={setEndHour}
                setSelectedPreset={setSelectedPreset}
                validFrom={validFrom}
                setValidFrom={setValidFrom}
                validUntil={validUntil}
                setValidUntil={setValidUntil}
                rotationWorkDays={rotationWorkDays}
                rotationRestDays={rotationRestDays}
                rotationStartHour={rotationStartHour}
                setRotationStartHour={setRotationStartHour}
                rotationEndHour={rotationEndHour}
                setRotationEndHour={setRotationEndHour}
                flexHours={flexHours}
                setFlexHours={setFlexHours}
              />

              <ShiftGeneralRulesCard
                graceMinutes={graceMinutes}
                setGraceMinutes={setGraceMinutes}
                absenceCutoffTime={absenceCutoffTime}
                setAbsenceCutoffTime={setAbsenceCutoffTime}
              />
            </div>
          </div>

          {/* BOTTOM ACTION BAR */}
          <ScheduleCreationActionBar
            isFormValid={isFormValid}
            isEditMode={isEditMode}
            isSubmitting={isSubmitting}
            onCancel={() => router.push("/pm/horarios")}
          />
        </form>
      </div>
    </div>
  );
}
