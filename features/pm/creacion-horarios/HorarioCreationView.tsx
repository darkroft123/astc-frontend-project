"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  ArrowLeft,
  Clock,
  Folder,
  ChevronDown,
  Info,
  Plus,
  Save,
  Check,
  AlertCircle,
  Repeat,
  Calendar,
  Layers,
} from "lucide-react";
import {
  getAllProjects,
  createShiftTemplate,
  listShiftTemplates,
} from "@/app/services/project.assistance.service";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/layout/notification-bell";

type ShiftType = "REGULAR" | "ROTATING_4X4" | "ROTATING_7X7" | "FLEXIBLE" | "TRANSITORY";

interface ShiftOption {
  key: ShiftType;
  title: string;
  description: string;
}

const SHIFT_OPTIONS: ShiftOption[] = [
  { key: "REGULAR", title: "Regular", description: "Lun–vie, horario fijo" },
  { key: "ROTATING_4X4", title: "Rotativo 4×4", description: "4 días trabajo, 4 descanso" },
  { key: "ROTATING_7X7", title: "Rotativo 7×7", description: "7 días trabajo, 7 descanso" },
  { key: "FLEXIBLE", title: "Flexible", description: "Horas por día, sin hora fija" },
  { key: "TRANSITORY", title: "Transitorio", description: "Por un periodo definido" },
];

interface Preset {
  id: string;
  label: string;
  range: string;
  start: string;
  end: string;
  cutoff: string;
}

const PRESETS: Preset[] = [
  { id: "dia", label: "Día", range: "08:00–17:00", start: "08:00", end: "17:00", cutoff: "09:30" },
  { id: "tarde", label: "Tarde", range: "14:00–22:00", start: "14:00", end: "22:00", cutoff: "15:30" },
  { id: "noche", label: "Noche", range: "22:00–06:00", start: "22:00", end: "06:00", cutoff: "23:30" },
];

const DAYS = [
  { key: "monday" as const, label: "Lunes" },
  { key: "tuesday" as const, label: "Martes" },
  { key: "wednesday" as const, label: "Miércoles" },
  { key: "thursday" as const, label: "Jueves" },
  { key: "friday" as const, label: "Viernes" },
  { key: "saturday" as const, label: "Sábado" },
  { key: "sunday" as const, label: "Domingo" },
];

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
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl-3",
    name: "Turno Flexible Desarrollo / Tech",
    shiftType: "FLEXIBLE",
    projectId: "p-testeo",
    graceMinutes: 15,
    timezone: "America/Lima",
    createdAt: new Date().toISOString(),
  },
];

export function HorarioCreationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");
  const queryProjectId = searchParams.get("projectId");
  const isEditMode = Boolean(templateId);

  const { token, hydrated } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState<any[]>(DEFAULT_MOCK_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(queryProjectId || "");
  const [templateName, setTemplateName] = useState<string>("");
  const [shiftType, setShiftType] = useState<ShiftType>("REGULAR");
  const [selectedPreset, setSelectedPreset] = useState<string>("dia");
  const [startHour, setStartHour] = useState("08:00");
  const [endHour, setEndHour] = useState("17:00");
  const [graceMinutes, setGraceMinutes] = useState(10);
  const [absenceCutoffTime, setAbsenceCutoffTime] = useState("09:30");

  // Rotating shifts parameters
  const [rotationWorkDays, setRotationWorkDays] = useState(4);
  const [rotationRestDays, setRotationRestDays] = useState(4);
  const [rotationStartHour, setRotationStartHour] = useState("08:00");
  const [rotationEndHour, setRotationEndHour] = useState("17:00");

  // Transitory shift parameters
  const [validFrom, setValidFrom] = useState("2026-09-01");
  const [validUntil, setValidUntil] = useState("2026-12-31");

  // Flexible hours
  const [flexHours, setFlexHours] = useState<Record<string, { start: string; end: string }>>({
    monday: { start: "08:00", end: "17:00" },
    tuesday: { start: "08:00", end: "17:00" },
    wednesday: { start: "08:00", end: "17:00" },
    thursday: { start: "08:00", end: "17:00" },
    friday: { start: "08:00", end: "17:00" },
    saturday: { start: "", end: "" },
    sunday: { start: "", end: "" },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Load Projects
  useEffect(() => {
    if (hydrated && token) {
      getAllProjects(token)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setProjects(data);
          }
        })
        .catch(() => {});
    }
  }, [hydrated, token]);

  // Load Existing Template Data when in Edit Mode
  useEffect(() => {
    if (!templateId) return;

    setLoadingData(true);

    const applyTemplate = (tpl: any) => {
      setTemplateName(tpl.name || "");
      setSelectedProjectId(tpl.projectId || "");
      setShiftType(tpl.shiftType || "REGULAR");

      const sHour =
        tpl.workStartTime?.substring(0, 5) ||
        tpl.rotationShiftStartTime?.substring(0, 5) ||
        "08:00";
      const eHour =
        tpl.workEndTime?.substring(0, 5) ||
        tpl.rotationShiftEndTime?.substring(0, 5) ||
        "17:00";
      const cutoff = tpl.absenceCutoffTime?.substring(0, 5) || "09:30";

      setStartHour(sHour);
      setEndHour(eHour);
      setRotationStartHour(sHour);
      setRotationEndHour(eHour);
      setAbsenceCutoffTime(cutoff);
      setGraceMinutes(Number(tpl.graceMinutes) || 10);

      if (tpl.rotationWorkDays) setRotationWorkDays(tpl.rotationWorkDays);
      if (tpl.rotationRestDays) setRotationRestDays(tpl.rotationRestDays);
      if (tpl.validFrom) setValidFrom(tpl.validFrom.split("T")[0]);
      if (tpl.validUntil) setValidUntil(tpl.validUntil.split("T")[0]);

      // Check matched preset
      const match = PRESETS.find((p) => p.start === sHour && p.end === eHour);
      if (match) setSelectedPreset(match.id);
      else setSelectedPreset("");
    };

    // 1. Search in custom local storage
    let found: any = null;
    if (typeof window !== "undefined") {
      try {
        const custom = JSON.parse(localStorage.getItem("pm_shift_templates_custom") || "[]");
        found = custom.find((t: any) => t.id === templateId);
      } catch {}
    }

    // 2. Search in mock default templates
    if (!found) {
      found = DEFAULT_MOCK_TEMPLATES.find((t) => t.id === templateId);
    }

    // 3. Or search in backend API
    if (!found && token) {
      listShiftTemplates(token)
        .then((data) => {
          const tpl = data?.find((t) => t.id === templateId);
          if (tpl) applyTemplate(tpl);
        })
        .catch(() => {})
        .finally(() => setLoadingData(false));
      return;
    }

    if (found) {
      applyTemplate(found);
    }
    setLoadingData(false);
  }, [templateId, token]);

  // Handle Preset Select
  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset.id);
    setStartHour(preset.start);
    setEndHour(preset.end);
    setAbsenceCutoffTime(preset.cutoff);
  };

  // Adjust shift type parameters
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

  const isFormValid = selectedProjectId.trim() !== "" && templateName.trim() !== "";

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast({
        title: isEditMode
          ? "Completa proyecto y nombre para guardar los cambios"
          : "Completa proyecto y nombre para crear el horario",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const targetId = templateId || `tpl-${Date.now()}`;
    const templateData: any = {
      id: targetId,
      projectId: selectedProjectId,
      name: templateName,
      shiftType,
      graceMinutes: Number(graceMinutes) || 10,
      absenceCutoffTime: `${absenceCutoffTime}:00`,
      workStartTime: `${startHour}:00`,
      workEndTime: `${endHour}:00`,
      rotationWorkDays,
      rotationRestDays,
      rotationShiftStartTime: `${rotationStartHour}:00`,
      rotationShiftEndTime: `${rotationEndHour}:00`,
      validFrom,
      validUntil,
      updatedAt: new Date().toISOString(),
      createdAt: isEditMode ? undefined : new Date().toISOString(),
    };

    try {
      // 1. Call backend API if in create mode and token available
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

      // 2. Persist in local storage for instant offline/mock feedback
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
        {/* Top Header & Breadcrumb matching SVG */}
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

        {/* 2-COLUMN GRID BODY MATCHING OFFICIAL SVG STRUCTURE */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
            {/* ==================== COLUMNA IZQUIERDA ==================== */}
            <div className="space-y-5 sm:space-y-6">
              {/* CARD 1: ASIGNACIÓN (Proyecto y Nombre juntos en una tarjeta) */}
              <div className="rounded-[20px] sm:rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-[#1F1836] border border-purple-200 dark:border-[#432C7A] text-purple-700 dark:text-[#A855F7] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">
                      Asignación
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Selecciona el proyecto y define el nombre
                    </p>
                  </div>
                </div>

                {/* Campo Proyecto */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-foreground block">
                    Proyecto
                  </label>
                  <div className="relative">
                    <Folder className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full h-11 pl-10 pr-9 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none cursor-pointer"
                    >
                      <option value="">Seleccionar proyecto...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {!selectedProjectId && (
                    <p className="text-[11px] text-[#FBBF24] mt-1 font-medium">
                      Elige un proyecto para continuar.
                    </p>
                  )}
                </div>

                {/* Campo Nombre del Horario */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-foreground block">
                    Nombre del horario
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Mañana, Tarde, Noche, Equipo A"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* CARD 2: TIPO DE TURNO (5 opciones interactivas con estados activos exactos) */}
              <div className="rounded-[20px] sm:rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-[#1F1836] border border-purple-200 dark:border-[#432C7A] text-purple-700 dark:text-[#A855F7] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">
                      Tipo de turno
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Elige la modalidad de horario
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {SHIFT_OPTIONS.map((opt) => {
                    const isSelected = shiftType === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleShiftTypeChange(opt.key)}
                        className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-purple-500/10 dark:bg-[#1A1435] border-purple-500 dark:border-[#A855F7] shadow-xs shadow-purple-500/20"
                            : "bg-card dark:bg-[#101322] border-border dark:border-[#1E2335] hover:border-border/80 dark:hover:border-[#2C334E]"
                        } ${opt.key === "TRANSITORY" ? "sm:col-span-2" : ""}`}
                      >
                        <p
                          className={`text-xs font-bold leading-tight ${
                            isSelected
                              ? "text-purple-600 dark:text-[#C084FC]"
                              : "text-foreground"
                          }`}
                        >
                          {opt.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                          {opt.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ==================== COLUMNA DERECHA ==================== */}
            <div className="space-y-5 sm:space-y-6">
              {/* CARD 3: CONFIGURACIÓN DE HORARIO SEGÚN TIPO */}
              <div className="rounded-[20px] sm:rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-[#1F1836] border border-purple-200 dark:border-[#432C7A] text-purple-700 dark:text-[#A855F7] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">
                      {shiftType === "REGULAR"
                        ? "Horario regular"
                        : shiftType === "TRANSITORY"
                        ? "Horario transitorio"
                        : shiftType === "FLEXIBLE"
                        ? "Horario flexible"
                        : "Turno rotativo"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Define las horas de entrada y salida
                    </p>
                  </div>
                </div>

                {/* Sub-formulario: REGULAR o TRANSITORIO */}
                {(shiftType === "REGULAR" || shiftType === "TRANSITORY") && (
                  <div className="space-y-4 pt-1">
                    {/* Info Alert Box exacto al SVG */}
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-start gap-2.5">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" />
                      <p className="leading-relaxed text-[11.5px]">
                        Lunes a viernes. Sábados y domingos son descanso automático: no se exige
                        marcar ni se genera falta. Ideal para personal administrativo u oficina.
                      </p>
                    </div>

                    {/* Plantilla Rápida */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground block">
                        Plantilla rápida
                      </label>
                      <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-background dark:bg-[#141829] border border-border dark:border-[#1E2335]">
                        {PRESETS.map((p) => {
                          const isSelected = selectedPreset === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handlePresetSelect(p)}
                              className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-primary/10 text-primary border border-primary/30 shadow-xs font-bold"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <div className="text-xs font-bold">{p.label}</div>
                              <div className="text-[10px] font-mono opacity-80 mt-0.5">
                                {p.range}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pickers de Horas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground block">
                          Hora de entrada
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            value={startHour}
                            onChange={(e) => {
                              setStartHour(e.target.value);
                              setSelectedPreset("");
                            }}
                            className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <Clock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground block">
                          Hora de salida
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            value={endHour}
                            onChange={(e) => {
                              setEndHour(e.target.value);
                              setSelectedPreset("");
                            }}
                            className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <Clock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Rango de Fechas si es Transitorio */}
                    {shiftType === "TRANSITORY" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border dark:border-[#1E2335]">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-foreground block">
                            Válido desde
                          </label>
                          <input
                            type="date"
                            value={validFrom}
                            onChange={(e) => setValidFrom(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-foreground block">
                            Válido hasta
                          </label>
                          <input
                            type="date"
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-formulario: ROTATIVO */}
                {shiftType.startsWith("ROTATING") && (
                  <div className="space-y-4 pt-1">
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-start gap-2.5">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" />
                      <p className="leading-relaxed text-[11.5px]">
                        Ciclo continuo de <strong>{rotationWorkDays} días de trabajo</strong> seguidos de{" "}
                        <strong>{rotationRestDays} días de descanso</strong>.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground block">
                          Entrada (laboral)
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            value={rotationStartHour}
                            onChange={(e) => setRotationStartHour(e.target.value)}
                            className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <Clock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground block">
                          Salida (laboral)
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            value={rotationEndHour}
                            onChange={(e) => setRotationEndHour(e.target.value)}
                            className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <Clock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-semibold text-foreground block">
                        Fecha de inicio del ciclo
                      </label>
                      <input
                        type="date"
                        value={validFrom}
                        onChange={(e) => setValidFrom(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-formulario: FLEXIBLE */}
                {shiftType === "FLEXIBLE" && (
                  <div className="space-y-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-start gap-2.5">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" />
                      <p className="leading-relaxed text-[11.5px]">
                        Configura horas distintas por día. Los días vacíos se consideran descanso
                        automático.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {DAYS.map((day) => {
                        const h = flexHours[day.key];
                        return (
                          <div
                            key={day.key}
                            className="grid grid-cols-[85px_1fr_1fr] gap-2 items-center"
                          >
                            <span className="text-xs font-medium text-muted-foreground">
                              {day.label}
                            </span>
                            <input
                              type="time"
                              value={h.start}
                              onChange={(e) =>
                                setFlexHours({
                                  ...flexHours,
                                  [day.key]: { ...h, start: e.target.value },
                                })
                              }
                              className="h-10 px-2.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-semibold text-foreground"
                            />
                            <input
                              type="time"
                              value={h.end}
                              onChange={(e) =>
                                setFlexHours({
                                  ...flexHours,
                                  [day.key]: { ...h, end: e.target.value },
                                })
                              }
                              className="h-10 px-2.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-semibold text-foreground"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 4: REGLAS GENERALES (Tolerancia y Corte de falta) */}
              <div className="rounded-[20px] sm:rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-[#1F1836] border border-purple-200 dark:border-[#432C7A] text-purple-700 dark:text-[#A855F7] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">
                      Reglas generales
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tolerancia y hora límite para faltas automáticas
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Tolerancia */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground block">
                      Tolerancia (minutos)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={graceMinutes}
                      onChange={(e) => setGraceMinutes(parseInt(e.target.value) || 0)}
                      className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <p className="text-[11px] text-muted-foreground leading-tight pt-0.5">
                      Minutos después de la entrada en los que aún llega a tiempo.
                    </p>
                  </div>

                  {/* Corte de falta */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground block">
                      Corte de falta automática
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={absenceCutoffTime}
                        onChange={(e) => setAbsenceCutoffTime(e.target.value)}
                        className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <Clock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight pt-0.5">
                      Si no marca antes de esta hora, se genera una falta. En turnos nocturnos solo
                      aplica dentro de la ventana del turno.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== BOTTOM ACTION BAR MATCHING EXACT SVG ==================== */}
          <div className="rounded-[20px] sm:rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 text-center sm:text-left">
              <Info className="w-4 h-4 shrink-0 text-muted-foreground" />
              {!isFormValid
                ? "Completa proyecto y nombre para guardar."
                : isEditMode
                ? "Cambios listos para guardar en la plantilla."
                : "Horario listo para guardar en el proyecto."}
            </p>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => router.push("/pm/horarios")}
                className="flex-1 sm:flex-initial h-11 px-6 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1c2238] text-xs sm:text-sm font-semibold text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`flex-1 sm:flex-initial h-11 px-6 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
                  isFormValid && !isSubmitting
                    ? "text-white cursor-pointer hover:opacity-95 active:scale-98 shadow-purple-500/20"
                    : "text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-white/10 cursor-not-allowed border border-slate-300 dark:border-white/5"
                }`}
                style={{
                  background:
                    isFormValid && !isSubmitting
                      ? "linear-gradient(90deg, #5B8CFF 0%, #A855F7 100%)"
                      : undefined,
                }}
              >
                {isEditMode ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>
                  {isSubmitting
                    ? isEditMode
                      ? "Guardando..."
                      : "Creando..."
                    : isEditMode
                    ? "Guardar cambios"
                    : "Crear horario"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
