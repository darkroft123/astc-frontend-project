"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Clock, Repeat, CalendarDays, CalendarRange, Settings, Info, Plus, CheckCircle } from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DataTable, Column } from "@/components/DataTable";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { getAllProjects, createShiftTemplate, listShiftTemplates, listScheduleOverrides } from "@/app/services/project.assistance.service";

type ShiftType = "REGULAR" | "ROTATING_4X4" | "ROTATING_7X7" | "FLEXIBLE" | "TRANSITORY";

const SHIFT_TYPES: { key: ShiftType; label: string; icon: typeof Clock; desc: string }[] = [
  { key: "REGULAR", label: "Regular", icon: Clock, desc: "Lun-Vie laboral, Sab-Dom descanso" },
  { key: "ROTATING_4X4", label: "Rotativo 4x4", icon: Repeat, desc: "4 d\u00edas trabajo / 4 descanso" },
  { key: "ROTATING_7X7", label: "Rotativo 7x7", icon: Repeat, desc: "7 d\u00edas trabajo / 7 descanso" },
  { key: "FLEXIBLE", label: "Flexible", icon: CalendarDays, desc: "Horario distinto por d\u00eda" },
  { key: "TRANSITORY", label: "Transitorio", icon: CalendarRange, desc: "Rango de fechas espec\u00edfico" },
];

const DAYS = [
  { key: "monday" as const, label: "Lunes" },
  { key: "tuesday" as const, label: "Martes" },
  { key: "wednesday" as const, label: "Mi\u00e9rcoles" },
  { key: "thursday" as const, label: "Jueves" },
  { key: "friday" as const, label: "Viernes" },
  { key: "saturday" as const, label: "S\u00e1bado" },
  { key: "sunday" as const, label: "Domingo" },
];

const ICON_BY_SHIFT: Record<string, typeof Clock> = {
  REGULAR: Clock,
  ROTATING_4X4: Repeat,
  ROTATING_7X7: Repeat,
  FLEXIBLE: CalendarDays,
  TRANSITORY: CalendarRange,
};

const SHIFT_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  REGULAR: { label: "Regular", icon: Clock, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  ROTATING_4X4: { label: "Rotativo 4x4", icon: Repeat, color: "text-blue-600 bg-blue-50 border-blue-200" },
  ROTATING_7X7: { label: "Rotativo 7x7", icon: Repeat, color: "text-blue-600 bg-blue-50 border-blue-200" },
  FLEXIBLE: { label: "Flexible", icon: CalendarDays, color: "text-violet-600 bg-violet-50 border-violet-200" },
  TRANSITORY: { label: "Transitorio", icon: CalendarRange, color: "text-amber-600 bg-amber-50 border-amber-200" },
};

const DAYS_ORDER = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];



export function HorarioCreationView() {
  const router = useRouter();
  const { token, hydrated } = useAuth();

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [templateName, setTemplateName] = useState("");

  const [shiftType, setShiftType] = useState<ShiftType>("REGULAR");

  const [startHour, setStartHour] = useState("08:00");
  const [endHour, setEndHour] = useState("17:00");
  const [graceMinutes, setGraceMinutes] = useState(10);
  const [absenceCutoffTime, setAbsenceCutoffTime] = useState("09:30");

  const [flexHours, setFlexHours] = useState<Record<string, { start: string; end: string }>>({
    monday: { start: "08:00", end: "17:00" },
    tuesday: { start: "08:00", end: "17:00" },
    wednesday: { start: "08:00", end: "17:00" },
    thursday: { start: "08:00", end: "17:00" },
    friday: { start: "08:00", end: "17:00" },
    saturday: { start: "", end: "" },
    sunday: { start: "", end: "" },
  });

  const [rotationWorkDays, setRotationWorkDays] = useState(4);
  const [rotationRestDays, setRotationRestDays] = useState(4);
  const [rotationStartHour, setRotationStartHour] = useState("08:00");
  const [rotationEndHour, setRotationEndHour] = useState("20:00");

  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [shiftTemplates, setShiftTemplates] = useState<any[]>([]);

  // States for Override Warning Modal
  const [showOverrideWarning, setShowOverrideWarning] = useState(false);
  const [overrideCount, setOverrideCount] = useState(0);
  const [pendingInput, setPendingInput] = useState<any>(null);


  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const SelectedIcon = ICON_BY_SHIFT[shiftType as string] || Clock;

  const fetchTemplates = useCallback(async () => {
    if (!hydrated || !token) return;
    try {
      const data = await listShiftTemplates(token);
      setShiftTemplates(data || []);
    } catch { /* ignore */ }
  }, [hydrated, token]);

  useEffect(() => {
    if (hydrated && token) {
      getAllProjects(token).then((data) => setProjects(data || []));
      fetchTemplates();
    }
  }, [hydrated, token, fetchTemplates]);

  useEffect(() => {
    if (shiftType === "ROTATING_4X4") {
      setRotationWorkDays(4);
      setRotationRestDays(4);
    } else if (shiftType === "ROTATING_7X7") {
      setRotationWorkDays(7);
      setRotationRestDays(7);
    }
  }, [shiftType]);

  useEffect(() => {
    const calculateCutoff = (start: string) => {
      if (!start) return "09:30";
      const [h, m] = start.split(":").map(Number);
      const date = new Date();
      date.setHours(h, m + 90, 0, 0);
      return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    };
    if (shiftType.startsWith("ROTATING")) {
      setAbsenceCutoffTime(calculateCutoff(rotationStartHour));
    } else {
      setAbsenceCutoffTime(calculateCutoff(startHour));
    }
  }, [shiftType, startHour, rotationStartHour]);

  useEffect(() => {
    const proj = projects.find(p => p.id === selectedProjectId);
    if (!proj) return;
    if (proj.workStartTime) {
      setStartHour(proj.workStartTime.substring(0, 5));
      setRotationStartHour(proj.workStartTime.substring(0, 5));
    }
    if (proj.workEndTime) {
      setEndHour(proj.workEndTime.substring(0, 5));
      setRotationEndHour(proj.workEndTime.substring(0, 5));
    }
  }, [selectedProjectId, projects]);

  const handleSubmit = async () => {
    if (!hydrated || !token) return;
    setError(null);

    if (!selectedProjectId || !selectedProject) {
      setError("Seleccione un proyecto.");
      return;
    }

    try {
      setIsSubmitting(true);

      const input: any = {
        projectId: selectedProjectId,
        name: templateName.trim() || SHIFT_TYPES.find(s => s.key === shiftType)?.label || "Horario",
        shiftType,
        graceMinutes,
        timezone: selectedProject.timezone || "America/Lima",
        absenceCutoffTime: absenceCutoffTime ? `${absenceCutoffTime}:00` : null,
      };

      if (shiftType === "REGULAR" || shiftType === "TRANSITORY") {
        input.workStartTime = `${startHour}:00`;
        input.workEndTime = `${endHour}:00`;
      }

      if (shiftType === "FLEXIBLE") {
        for (const day of DAYS) {
          const h = flexHours[day.key];
          input[`${day.key}Start`] = h.start ? `${h.start}:00` : null;
          input[`${day.key}End`] = h.end ? `${h.end}:00` : null;
        }
      }

      if (shiftType.startsWith("ROTATING")) {
        if (!validFrom) {
          setError("La fecha de inicio del ciclo es obligatoria para turnos rotativos.");
          setIsSubmitting(false);
          return;
        }
        input.rotationWorkDays = rotationWorkDays;
        input.rotationRestDays = rotationRestDays;
        input.rotationShiftStartTime = `${rotationStartHour}:00`;
        input.rotationShiftEndTime = `${rotationEndHour}:00`;
        input.validFrom = validFrom;
      }

      if (shiftType === "TRANSITORY") {
        input.validFrom = validFrom || null;
        input.validUntil = validUntil || null;
      }

      // Validation for Override Warnings before saving
      const overrides = await listScheduleOverrides(token, selectedProjectId);
      if (overrides && overrides.length > 0) {
        setOverrideCount(overrides.length);
        setPendingInput(input);
        setShowOverrideWarning(true);
        setIsSubmitting(false);
        return;
      }

      await submitShiftTemplate(input);
    } catch (err: any) {
      setError(err?.message || "Error al verificar horarios personalizados.");
      setIsSubmitting(false);
    }
  };

  const submitShiftTemplate = async (inputToSave: any) => {
    try {
      setIsSubmitting(true);
      await createShiftTemplate(token!, inputToSave);
      setSuccess(`Horario creado para ${selectedProject?.name}`);
      setShowOverrideWarning(false);
      setPendingInput(null);
    } catch (err: any) {
      setError(err?.message || "Error al crear horario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  function reset() {
    setSelectedProjectId("");
    setShiftType("REGULAR");
    setSuccess(null);
    setIsSubmitting(false);
    setError(null);
  }

  function goToList() {
    reset();
    fetchTemplates();
  }

  if (success) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 mb-4">Horario creado exitosamente</h2>
            <div className="bg-background rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground">{success}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={reset}>Crear otro horario</Button>
              <Button onClick={() => router.push("/pm/asignacion-horarios")}>
                Ver asignaciones
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Error Modal */}
      <Dialog open={!!error} onOpenChange={() => setError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Error</DialogTitle>
            <DialogDescription>{error}</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setError(null)} variant="destructive">Entendido</Button>
        </DialogContent>
      </Dialog>

      {/* Warning Modal for Overrides */}
      <Dialog open={showOverrideWarning} onOpenChange={setShowOverrideWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-amber-600 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Horarios Personalizados Detectados
            </DialogTitle>
            <DialogDescription className="text-zinc-600 pt-2 text-base">
              Hay <strong>{overrideCount} usuario{overrideCount !== 1 ? 's' : ''}</strong> en este proyecto que ya cuenta{overrideCount !== 1 ? 'n' : ''} con un horario personalizado asignado directamente.
              <br /><br />
              El nuevo horario base del proyecto se creará, pero <strong>no afectará a estos usuarios</strong>, ya que sus horarios personalizados tienen prioridad.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={() => setShowOverrideWarning(false)} variant="outline">
              Cancelar
            </Button>
            <Button onClick={() => submitShiftTemplate(pendingInput)} className="bg-amber-600 hover:bg-amber-700 text-white">
              Entendido, Guardar Horario
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-5xl mx-auto px-4 py-4">

        <PageHeader
          categoryTag={{ badge: "JEFE DE PROYECTO", text: "Panel de Gestión" }}
          title="Creación de Horarios"
          description="Define horarios con distintos tipos de turno para los proyectos"
          showPeriodSelector={false}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

          {/* LEFT COLUMN: Project & Shift Type Selection */}
          <div className="space-y-6">
            {/* PROJECT SELECTION */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="text-sm">1. Proyecto</CardTitle>
                <CardDescription className="text-xs">Selecciona el proyecto al que aplicarás el horario</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar proyecto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* NAME FIELD */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="text-sm">2. Nombre del Horario</CardTitle>
                <CardDescription className="text-xs">Asigna un nombre para identificar este turno (ej: Mañana, Tarde, Noche, Equipo A)</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder={SHIFT_TYPES.find(s => s.key === shiftType)?.label || "Nombre del horario"}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* SHIFT TYPE SELECTOR */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="text-sm">3. Tipo de Turno</CardTitle>
                <CardDescription className="text-xs">Elige la modalidad de horario</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SHIFT_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isActive = shiftType === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setShiftType(t.key)}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 text-xs font-medium transition-all
                          ${isActive
                            ? "bg-primary/10 text-primary border-primary shadow-sm"
                            : "border-zinc-100 bg-card text-zinc-500 hover:border-border hover:bg-background"}`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-zinc-400"}`} />
                        <span className="text-center leading-tight font-semibold">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Specific Config, General Rules & Summary */}
          <div className="space-y-6">
            {/* SPECIFIC CONFIGURATION */}
            {(shiftType === "REGULAR" || shiftType === "TRANSITORY") && (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        4. Horario {shiftType === "TRANSITORY" ? "Transitorio" : "Regular"}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">Define las horas de entrada y salida</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex gap-3 bg-blue-50/50 text-blue-800 p-3 rounded-lg border border-blue-100 text-xs">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                    <p>
                      {shiftType === "REGULAR"
                        ? "Horario de oficina: los empleados trabajan de Lunes a Viernes con la misma hora de entrada y salida. Sábados y Domingos son descanso automático (no se genera falta por no marcar). Ideal para personal administrativo."
                        : "Los empleados tendrán este horario solo durante el rango de fechas especificado. Fuera de dicho rango, el sistema no considerará el horario y no generará penalizaciones."}
                    </p>
                  </div>
                  {(shiftType === "REGULAR" || shiftType === "TRANSITORY") && (
                    <div className="flex gap-2 bg-muted/50 p-2 rounded-lg border border-zinc-100">
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-white" onClick={() => { setStartHour("08:00"); setEndHour("17:00"); }}>Día</Button>
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-white" onClick={() => { setStartHour("14:00"); setEndHour("22:00"); }}>Tarde</Button>
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-white" onClick={() => { setStartHour("22:00"); setEndHour("06:00"); }}>
                        Noche <span className="text-[9px] text-zinc-400 ml-1">22:00–06:00</span>
                      </Button>
                    </div>
                  )}
                  {(shiftType === "REGULAR" || shiftType === "TRANSITORY") && startHour === "22:00" && endHour === "06:00" && (
                    <div className="flex gap-2 bg-amber-50/50 text-amber-700 p-2 rounded-lg border border-amber-200 text-[10px]">
                      <Info className="w-3 h-3 shrink-0 mt-0.5" />
                      <p>Turno nocturno: la jornada cruza la medianoche. El sistema evaluará la asistencia entre las 22:00 y las 06:00 del día siguiente. Las faltas automáticas solo se generan si la hora actual está dentro de la ventana del turno.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Hora de Entrada</Label>
                      <Input type="time" value={startHour} onChange={(e) => setStartHour(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Hora de Salida</Label>
                      <Input type="time" value={endHour} onChange={(e) => setEndHour(e.target.value)} />
                    </div>
                  </div>
                  {shiftType === "TRANSITORY" && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Válido desde</Label>
                        <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Válido hasta</Label>
                        <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {shiftType === "FLEXIBLE" && (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    4. Horario Flexible
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">Configura horas distintas por día</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex gap-3 bg-blue-50/50 text-blue-800 p-3 rounded-lg border border-blue-100 text-xs mb-4">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                    <p>
                      El sistema evaluará la asistencia del equipo de forma distinta según el día de la semana. Los días en los que dejes las horas vacías, el sistema entenderá que el proyecto está inactivo ese día y <strong>no generará faltas automáticas para nadie</strong>.
                    </p>
                  </div>
                  {DAYS.map((day) => {
                    const h = flexHours[day.key];
                    return (
                      <div key={day.key} className="grid grid-cols-[80px_1fr_1fr] gap-3 items-center">
                        <span className="text-xs font-medium text-muted-foreground">{day.label}</span>
                        <Input type="time" className="h-8 text-xs" value={h.start} onChange={(e) => setFlexHours({ ...flexHours, [day.key]: { ...h, start: e.target.value } })} />
                        <Input type="time" className="h-8 text-xs" value={h.end} onChange={(e) => setFlexHours({ ...flexHours, [day.key]: { ...h, end: e.target.value } })} />
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-zinc-400 mt-2 text-center bg-muted/50 py-1 rounded">Deja vacío si es día libre</p>
                </CardContent>
              </Card>
            )}

            {shiftType.startsWith("ROTATING") && (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-muted-foreground" />
                    4. Turno Rotativo
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">Ciclos de trabajo y descanso</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex gap-3 bg-blue-50/50 text-blue-800 p-3 rounded-lg border border-blue-100 text-xs">
                    <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
                    <div className="space-y-2">
                      <p>
                        El sistema calculará un ciclo continuo a partir de la Fecha de inicio. Exigirá asistencia por <strong>{rotationWorkDays} días</strong> consecutivos y luego apagará todas las alertas de falta automática por <strong>{rotationRestDays} días</strong>. Ideal para régimen minero u obras alejadas.
                      </p>
                      <div className="bg-card/50 p-2 rounded border border-blue-200/50">
                        <span className="font-semibold block mb-1">¿Cómo lo calcula el sistema?</span>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Suma el total de días del ciclo ({rotationWorkDays} + {rotationRestDays} = {rotationWorkDays + rotationRestDays} días).</li>
                          <li>Calcula los días transcurridos desde el inicio y obtiene el residuo de dividirlos entre la longitud del ciclo.</li>
                          <li>Si el residuo es menor a {rotationWorkDays}, le toca <strong>TRABAJAR</strong>. Si es mayor o igual, le toca <strong>DESCANSAR</strong>.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Días de trabajo</Label>
                      <Input type="number" min={1} max={30} value={rotationWorkDays} onChange={(e) => setRotationWorkDays(parseInt(e.target.value) || 4)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Días de descanso</Label>
                      <Input type="number" min={1} max={30} value={rotationRestDays} onChange={(e) => setRotationRestDays(parseInt(e.target.value) || 4)} />
                    </div>
                  </div>

                  <div className="bg-card border border-blue-100 rounded-lg overflow-hidden">
                    <div className="bg-blue-50/50 px-3 py-2 border-b border-blue-100">
                      <p className="text-xs font-semibold text-blue-800">Vista del ciclo</p>
                    </div>
                    <div className="p-3">
                      <div className="flex gap-0.5 justify-center flex-wrap">
                        {Array.from({ length: rotationWorkDays + rotationRestDays }, (_, i) => (
                          <div
                            key={i}
                            className={`w-7 h-7 rounded flex items-center justify-center text-[9px] font-bold ${
                              i < rotationWorkDays
                                ? "bg-emerald-500 text-white"
                                : "bg-zinc-200 text-muted-foreground"
                            }`}
                            title={i < rotationWorkDays ? `Día de trabajo ${i + 1}` : `Día de descanso ${i + 1 - rotationWorkDays}`}
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Trabajo ({rotationWorkDays}d)</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-zinc-200 inline-block" /> Descanso ({rotationRestDays}d)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 bg-muted/50 p-2 rounded-lg border border-zinc-100">
                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-white" onClick={() => { setRotationStartHour("08:00"); setRotationEndHour("20:00"); }}>Día</Button>
                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-white" onClick={() => { setRotationStartHour("14:00"); setRotationEndHour("22:00"); }}>Tarde</Button>
                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-white" onClick={() => { setRotationStartHour("22:00"); setRotationEndHour("06:00"); }}>
                      Noche <span className="text-[9px] text-zinc-400 ml-1">22:00–06:00</span>
                    </Button>
                  </div>
                  {rotationStartHour === "22:00" && rotationEndHour === "06:00" && (
                    <div className="flex gap-2 bg-amber-50/50 text-amber-700 p-2 rounded-lg border border-amber-200 text-[10px]">
                      <Info className="w-3 h-3 shrink-0 mt-0.5" />
                      <p>Turno nocturno: la jornada cruza la medianoche. El sistema evaluará la asistencia entre las 22:00 y las 06:00 del día siguiente.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Entrada (laboral)</Label>
                      <Input type="time" value={rotationStartHour} onChange={(e) => setRotationStartHour(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Salida (laboral)</Label>
                      <Input type="time" value={rotationEndHour} onChange={(e) => setRotationEndHour(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                    <Label className="text-xs text-muted-foreground">Fecha de inicio del ciclo <span className="text-red-500">*</span></Label>
                    <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} required />
                    <p className="text-[10px] text-muted-foreground">El sistema empezará a contar el ciclo desde esta fecha. Es obligatoria para calcular correctamente los días de trabajo y descanso.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CONFIGURACIÓN GENERAL */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  5. Reglas Generales
                </CardTitle>
                <CardDescription className="text-xs mt-1">Tolerancia y hora límite para generar faltas automáticas</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Tolerancia (minutos)</Label>
                    <Input type="number" min={0} max={120} value={graceMinutes} onChange={(e) => setGraceMinutes(parseInt(e.target.value) || 0)} />
                    <p className="text-[10px] text-muted-foreground">Minutos después de la hora de entrada en los que el colaborador aún llega a tiempo.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Corte de falta automática</Label>
                    <Input type="time" value={absenceCutoffTime} onChange={(e) => setAbsenceCutoffTime(e.target.value)} />
                    <p className="text-[10px] text-muted-foreground">Si el colaborador no marca antes de esta hora, el sistema genera una falta automática. Para turnos nocturnos, solo evalúa si la hora actual está dentro de la ventana del turno.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RESUMEN */}
            {selectedProjectId && (
              <Card className="bg-primary/5 border-primary/20 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <SelectedIcon className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">{selectedProject?.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {SHIFT_TYPES.find(s => s.key === shiftType)?.label} | Tolerancia: {graceMinutes}m
                    </p>
                  </div>
                  <Button onClick={handleSubmit} disabled={isSubmitting || !selectedProjectId} className="shrink-0 shadow-sm">
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Guardando..." : "Guardar"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* BOTTOM ACTIONS */}
        {!selectedProjectId && (
          <div className="flex justify-end mt-6 pt-4 border-t border-border">
            <Button onClick={handleSubmit} disabled={true}>
              <Save className="w-4 h-4 mr-2" />
              Selecciona un proyecto
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
