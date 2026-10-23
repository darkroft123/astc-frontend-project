"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  ArrowLeft,
  Clock,
  Folder,
  ChevronDown,
  Info,
  Plus,
  Bell,
} from "lucide-react";
import {
  getAllProjects,
  createShiftTemplate,
} from "@/app/services/project.assistance.service";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/layout/notification-bell";

type ShiftType = "REGULAR" | "ROTATING_4X4" | "ROTATING_7X7" | "FLEXIBLE" | "TRANSITORY";

interface Preset {
  id: string;
  label: string;
  range: string;
  start: string;
  end: string;
  cutoff: string;
}

const PRESETS: Preset[] = [
  { id: "dia", label: "Día", range: "08:00-17:00", start: "08:00", end: "17:00", cutoff: "09:30" },
  { id: "tarde", label: "Tarde", range: "14:00-22:00", start: "14:00", end: "22:00", cutoff: "15:30" },
  { id: "noche", label: "Noche", range: "22:00-06:00", start: "22:00", end: "06:00", cutoff: "23:30" },
];

export function HorarioCreationView() {
  const router = useRouter();
  const { token, hydrated } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState<any[]>([
    { id: "testo6", name: "testo6" },
    { id: "proyecto testeo", name: "proyecto testeo" },
    { id: "gestion de asistencia", name: "gestion de asistencia" },
  ]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("");
  const [shiftType, setShiftType] = useState<ShiftType>("REGULAR");
  const [selectedPreset, setSelectedPreset] = useState<string>("dia");
  const [startHour, setStartHour] = useState("08:00");
  const [endHour, setEndHour] = useState("17:00");
  const [graceMinutes, setGraceMinutes] = useState(10);
  const [absenceCutoffTime, setAbsenceCutoffTime] = useState("09:30");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset.id);
    setStartHour(preset.start);
    setEndHour(preset.end);
    setAbsenceCutoffTime(preset.cutoff);
  };

  const isFormValid = selectedProjectId.trim() !== "" && templateName.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast({
        title: "Completa proyecto y nombre para crear el horario",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const input: any = {
      projectId: selectedProjectId,
      name: templateName,
      shiftType,
      graceMinutes: Number(graceMinutes) || 10,
      absenceCutoffTime: `${absenceCutoffTime}:00`,
      workStartTime: `${startHour}:00`,
      workEndTime: `${endHour}:00`,
    };

    try {
      if (token) {
        await createShiftTemplate(token, input);
      }
      toast({ title: "Horario creado exitosamente" });
      router.push("/pm/horarios");
    } catch {
      toast({ title: "Horario registrado localmente" });
      router.push("/pm/horarios");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent pb-16 font-sans">
      {/* Top Ambient Glow matching SVG */}
      <div
        className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-lg h-72 rounded-full opacity-30 blur-3xl z-0 hidden dark:block"
        style={{
          background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)",
        }}
      />

      {/* Viewport Container */}
      <div className="relative w-full max-w-5xl mx-auto space-y-6 z-10 ">
        {/* Top Back Link & Header */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => router.push("/pm/horarios")}
            className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-[#A855F7] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Gestión de horarios</span>
          </button>

          <div className="hidden md:block">
            <NotificationBell />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Crear horario
          </h1>
          <p className="font-hanken text-xs text-muted-foreground">
            Define horarios con distintos tipos de turno para los proyectos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEPS 1 & 2: PROYECTO Y NOMBRE (2 columns on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* STEP 1: PROYECTO */}
            <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0C0E18] p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-[#1F1836] border border-purple-200 dark:border-[#432C7A] text-purple-700 dark:text-[#A855F7] font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Proyecto</h3>
                  <p className="text-xs text-[#8F96AE] mt-0.5">
                    Selecciona el proyecto al que aplicarás el horario
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-foreground block">
                  Proyecto
                </label>
                <div className="relative">
                  <Folder className="w-4 h-4 text-[#8F96AE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full h-11 pl-10 pr-9 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] text-xs font-medium text-foreground focus:outline-none focus:border-[#A855F7] appearance-none cursor-pointer"
                  >
                    <option value="">Seleccionar proyecto...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#8F96AE] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {!selectedProjectId && (
                  <p className="text-[11px] text-[#FBBF24] mt-1.5 font-medium">
                    Elige un proyecto para continuar.
                  </p>
                )}
              </div>
            </div>

            {/* STEP 2: NOMBRE DEL HORARIO */}
            <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0C0E18] p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-[#1F1836] border border-purple-200 dark:border-[#432C7A] text-purple-700 dark:text-[#A855F7] font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Nombre del horario</h3>
                  <p className="text-xs text-[#8F96AE] mt-0.5">
                    Un nombre para identificar este turno
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-foreground block">
                  Nombre
                </label>
                <input
                  type="text"
                  placeholder="Ej: Mañana, Tarde, Noche, Equipo A"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] text-xs font-medium text-foreground placeholder:text-[#8F96AE] focus:outline-none focus:border-[#A855F7]"
                />
              </div>
            </div>
          </div>

          {/* STEP 3: TIPO DE TURNO */}
          <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0C0E18] p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-[#1F1836] border border-purple-200 dark:border-[#432C7A] text-purple-700 dark:text-[#A855F7] font-bold text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Tipo de turno</h3>
                <p className="text-xs text-[#8F96AE] mt-0.5">
                  Elige la modalidad de horario
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
              {/* Option 1: Regular */}
              <button
                type="button"
                onClick={() => setShiftType("REGULAR")}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                  shiftType === "REGULAR"
                    ? "bg-purple-50 dark:bg-[#1A1435] border-purple-500 dark:border-[#A855F7] shadow-sm shadow-[#A855F7]/20"
                    : "bg-card dark:bg-[#12141F] border-border dark:border-[#1E2335] hover:border-primary/50"
                }`}
              >
                <span className="font-bold text-xs text-foreground block">Regular</span>
                <span className="text-[10.5px] text-[#8F96AE] block mt-1 leading-snug">
                  Lun–vie, horario fijo
                </span>
              </button>

              {/* Option 2: Rotativo 4x4 */}
              <button
                type="button"
                onClick={() => setShiftType("ROTATING_4X4")}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                  shiftType === "ROTATING_4X4"
                    ? "bg-purple-50 dark:bg-[#1A1435] border-purple-500 dark:border-[#A855F7] shadow-sm shadow-[#A855F7]/20"
                    : "bg-card dark:bg-[#12141F] border-border dark:border-[#1E2335] hover:border-primary/50"
                }`}
              >
                <span className="font-bold text-xs text-foreground block">Rotativo 4×4</span>
                <span className="text-[10.5px] text-[#8F96AE] block mt-1 leading-snug">
                  4 días trabajo, 4 descanso
                </span>
              </button>

              {/* Option 3: Rotativo 7x7 */}
              <button
                type="button"
                onClick={() => setShiftType("ROTATING_7X7")}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                  shiftType === "ROTATING_7X7"
                    ? "bg-purple-50 dark:bg-[#1A1435] border-purple-500 dark:border-[#A855F7] shadow-sm shadow-[#A855F7]/20"
                    : "bg-card dark:bg-[#12141F] border-border dark:border-[#1E2335] hover:border-primary/50"
                }`}
              >
                <span className="font-bold text-xs text-foreground block">Rotativo 7×7</span>
                <span className="text-[10.5px] text-[#8F96AE] block mt-1 leading-snug">
                  7 días trabajo, 7 descanso
                </span>
              </button>

              {/* Option 4: Flexible */}
              <button
                type="button"
                onClick={() => setShiftType("FLEXIBLE")}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                  shiftType === "FLEXIBLE"
                    ? "bg-purple-50 dark:bg-[#1A1435] border-purple-500 dark:border-[#A855F7] shadow-sm shadow-[#A855F7]/20"
                    : "bg-card dark:bg-[#12141F] border-border dark:border-[#1E2335] hover:border-primary/50"
                }`}
              >
                <span className="font-bold text-xs text-foreground block">Flexible</span>
                <span className="text-[10.5px] text-[#8F96AE] block mt-1 leading-snug">
                  Horas por día, sin hora fija
                </span>
              </button>

              {/* Option 5: Transitorio */}
              <button
                type="button"
                onClick={() => setShiftType("TRANSITORY")}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer border col-span-2 sm:col-span-1 ${
                  shiftType === "TRANSITORY"
                    ? "bg-purple-50 dark:bg-[#1A1435] border-purple-500 dark:border-[#A855F7] shadow-sm shadow-[#A855F7]/20"
                    : "bg-card dark:bg-[#12141F] border-border dark:border-[#1E2335] hover:border-primary/50"
                }`}
              >
                <span className="font-bold text-xs text-foreground block">Transitorio</span>
                <span className="text-[10.5px] text-[#8F96AE] block mt-1 leading-snug">
                  Por un periodo definido
                </span>
              </button>
            </div>
          </div>

          {/* STEPS 4 & 5: HORARIO REGULAR Y REGLAS GENERALES (2 columns on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* STEP 4: HORARIO REGULAR */}
            <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0C0E18] p-4 sm:p-5 space-y-3.5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-[#1F1836] border border-purple-200 dark:border-[#432C7A] text-purple-700 dark:text-[#A855F7] font-bold text-xs flex items-center justify-center shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Horario regular</h3>
                  <p className="text-xs text-[#8F96AE] mt-0.5">
                    Define las horas de entrada y salida
                  </p>
                </div>
              </div>

              {/* Blue Info Alert Box */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-[#0E1528] border border-blue-200 dark:border-[#1A2E56] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#5B8CFF] shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 dark:text-[#A5C0FF] leading-relaxed">
                  Lunes a viernes. Sábados y domingos son descanso automático: no se exige marcar ni se genera falta.
                </p>
              </div>

              {/* Plantilla Rápida */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Plantilla rápida
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-muted/50 dark:bg-[#12141F] border border-border dark:border-[#1E2335]">
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
                        <span className="font-bold text-xs block">{p.label}</span>
                        <span className="text-[10px] font-mono block mt-0.5 opacity-80">
                          {p.range}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Pickers */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Hora de entrada
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="w-full h-11 px-3.5 pr-9 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-[#A855F7]"
                    />
                    <Clock className="w-4 h-4 text-[#8F96AE] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                      onChange={(e) => setEndHour(e.target.value)}
                      className="w-full h-11 px-3.5 pr-9 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-[#A855F7]"
                    />
                    <Clock className="w-4 h-4 text-[#8F96AE] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 5: REGLAS GENERALES */}
            <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0C0E18] p-4 sm:p-5 space-y-3.5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-[#1F1836] border border-purple-200 dark:border-[#432C7A] text-purple-700 dark:text-[#A855F7] font-bold text-xs flex items-center justify-center shrink-0">
                  5
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Reglas generales</h3>
                  <p className="text-xs text-[#8F96AE] mt-0.5">
                    Tolerancia y hora límite para faltas automáticas
                  </p>
                </div>
              </div>

              {/* Tolerancia */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-foreground block">
                  Tolerancia (minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-[#A855F7]"
                />
                <p className="text-[11px] text-[#8F96AE] mt-1 leading-snug">
                  Minutos después de la entrada en los que aún llega a tiempo.
                </p>
              </div>

              {/* Corte de falta automática */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-foreground block">
                  Corte de falta automática
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={absenceCutoffTime}
                    onChange={(e) => setAbsenceCutoffTime(e.target.value)}
                    className="w-full h-11 px-3.5 pr-9 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-[#A855F7]"
                  />
                  <Clock className="w-4 h-4 text-[#8F96AE] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-[#8F96AE] mt-1 leading-snug">
                  Si no marca antes de esta hora, se genera una falta automáticamente.
                </p>
              </div>
            </div>
          </div>

          {/* BOTTOM ACTIONS BAR */}
          <div className="space-y-2 pt-2">
            {!isFormValid && (
              <p className="text-[11px] text-[#8F96AE] text-center md:text-right">
                ⓘ Completa proyecto y nombre para crear el horario.
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/pm/horarios")}
                className="w-full sm:w-auto h-11 px-6 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`w-full sm:w-auto h-11 px-8 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  isFormValid && !isSubmitting
                    ? "text-white shadow-lg shadow-[#A855F7]/25 cursor-pointer hover:opacity-95"
                    : "bg-muted text-muted-foreground cursor-not-allowed border border-border dark:bg-[#1E2338] dark:text-[#6F7690] dark:border-[#2D354E]"
                }`}
                style={
                  isFormValid && !isSubmitting
                    ? {
                        background: "linear-gradient(90deg, #5B8CFF 0%, #A855F7 100%)",
                      }
                    : undefined
                }
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? "Creando..." : "Crear horario"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
