"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, Clock, Repeat, CalendarDays, CalendarRange, Settings, UserCircle2, Info } from "lucide-react";
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
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  getAllUsers,
  getAllProjects,
  addProjectMember,
  getProjectMembers,
  listShiftTemplates,
} from "@/app/services/project.assistance.service";
import { getGraphQLUrl } from "@/lib/api-host";

const ASSIGN_SCHEDULE = `
    mutation assignSchedule($input: ScheduleInput!) {
      assignSchedule(input: $input) {
        id
        userId
        projectId
        shiftType
      }
    }
`;

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

export default function ScheduleForm({
  mode = "create",
  initialData,
}: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, hydrated } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");

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

  const filteredProjects = useMemo(() => {
    if (!selectedUserId) return projects;
    return projects.filter((p: any) =>
      p.members?.some((m: any) => m.userId === selectedUserId)
    );
  }, [projects, selectedUserId]);

  useEffect(() => {
    if (hydrated && token) {
      Promise.all([getAllUsers(token), getAllProjects(token)])
        .then(async ([userData, projData]) => {
          const nonAdminUsers = (userData || []).filter((u: any) => {
            const role = (u.roleCode || u.roleName || u.role || "").toUpperCase();
            return role !== "ADMIN" && role !== "ROLE_ADMIN" && u.username?.toLowerCase() !== "admin";
          });
          setUsers(nonAdminUsers);
          setProjects(projData || []);

          const qUserId = searchParams.get("userId");
          if (qUserId && mode === "create") {
            const u = userData?.find((x: any) => x.id === qUserId);
            if (u) setSelectedUserId(u.id);
          }

          const qTemplateId = searchParams.get("templateId");
          if (qTemplateId && mode === "create") {
            try {
              const templates = await listShiftTemplates(token);
              const tpl = templates.find((t: any) => t.id === qTemplateId);
              if (tpl) {
                if (tpl.projectId) setSelectedProjectId(tpl.projectId);
                setShiftType((tpl.shiftType || "REGULAR") as ShiftType);
                if (tpl.graceMinutes !== undefined) setGraceMinutes(tpl.graceMinutes);
                if (tpl.absenceCutoffTime) setAbsenceCutoffTime(tpl.absenceCutoffTime.substring(0,5));
                if (tpl.workStartTime) setStartHour(tpl.workStartTime.substring(0,5));
                if (tpl.workEndTime) setEndHour(tpl.workEndTime.substring(0,5));
                if (tpl.rotationWorkDays) setRotationWorkDays(tpl.rotationWorkDays);
                if (tpl.rotationRestDays) setRotationRestDays(tpl.rotationRestDays);
                if (tpl.rotationShiftStartTime) setRotationStartHour(tpl.rotationShiftStartTime.substring(0,5));
                if (tpl.rotationShiftEndTime) setRotationEndHour(tpl.rotationShiftEndTime.substring(0,5));
                if (tpl.validFrom) setValidFrom(tpl.validFrom);
                if (tpl.validUntil) setValidUntil(tpl.validUntil);
                if (tpl.shiftType === "FLEXIBLE") {
                  const newFlex: any = {};
                  for (const day of ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]) {
                    newFlex[day] = {
                      start: tpl[`${day}Start`]?.substring(0,5) || "",
                      end: tpl[`${day}End`]?.substring(0,5) || "",
                    };
                  }
                  setFlexHours(newFlex);
                }
              }
            } catch { /* ignore */ }
          }
        })
        .catch((err) => console.error("Error loading options:", err));
    }
  }, [hydrated, token, searchParams, mode]);

  useEffect(() => {
    if (mode === "edit") return;
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
  }, [shiftType, startHour, rotationStartHour, mode]);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setSelectedUserId(initialData.userId || "");
      setSelectedProjectId(initialData.projectId || "");
      if (initialData.shiftType) {
        setShiftType(initialData.shiftType as ShiftType);
      }
      if (initialData.workStartTime) setStartHour(initialData.workStartTime.substring(0,5));
      if (initialData.workEndTime) setEndHour(initialData.workEndTime.substring(0,5));
      if (initialData.graceMinutes !== undefined) setGraceMinutes(initialData.graceMinutes);
      
      // We would ideally populate the rest of the fields here if initialData contains them,
      // but typically the list view only sends basic data. 
    }
  }, [mode, initialData]);

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
    if (mode !== "create") return;
    const proj = projects.find(p => p.id === selectedProjectId);
    if (!proj) return;
    if (proj.workStartTime) setStartHour(proj.workStartTime.substring(0, 5));
    if (proj.workEndTime) setEndHour(proj.workEndTime.substring(0, 5));
    if (proj.workStartTime) setRotationStartHour(proj.workStartTime.substring(0, 5));
    if (proj.workEndTime) setRotationEndHour(proj.workEndTime.substring(0, 5));
  }, [selectedProjectId, mode, projects]);

  const handleSubmit = async () => {
    if (!hydrated || !token) return;
    setError(null);

    if (!selectedUserId || !selectedProjectId) {
      setError("Seleccione un usuario y un proyecto.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const selectedProject = projects.find(p => p.id === selectedProjectId);

      if (mode === "create") {
        const existingMembers = await getProjectMembers(token, selectedProjectId);
        if (!existingMembers.some((m: any) => m.userId === selectedUserId)) {
          await addProjectMember(token, selectedProjectId, selectedUserId);
        }
      }

      const input: any = {
        userId: selectedUserId,
        projectId: selectedProjectId,
        shiftType,
        graceMinutes,
        timezone: selectedProject?.timezone || "America/Lima",
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
        input.rotationWorkDays = rotationWorkDays;
        input.rotationRestDays = rotationRestDays;
        input.rotationShiftStartTime = `${rotationStartHour}:00`;
        input.rotationShiftEndTime = `${rotationEndHour}:00`;
      }

      if (shiftType === "TRANSITORY") {
        input.validFrom = validFrom || null;
        input.validUntil = validUntil || null;
      }

      const res = await fetch(getGraphQLUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: ASSIGN_SCHEDULE,
          variables: { input },
        }),
      });

      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);

      router.refresh();
      router.push("/pm/asignacion-horarios");
    } catch (err: any) {
      setError(err?.message || "Error al asignar horario.");
      setIsSubmitting(false);
    }
  };

  const SelectedIcon = ICON_BY_SHIFT[shiftType] || Clock;
  const selectedUser = users.find((u) => u.id === selectedUserId);
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-4">

        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-sm">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {mode === "create" ? "Asignar Horario Personalizado" : "Editar Horario Personalizado"}
            </h1>
            <p className="text-xs text-muted-foreground">Configura un horario específico para un usuario</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT COLUMN: User, Project & Shift Type Selection */}
          <div className="space-y-6">
            
            {/* USER & PROJECT SELECTION */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="text-sm">1. Asignación</CardTitle>
                <CardDescription className="text-xs">Selecciona el usuario y el proyecto</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Usuario</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={mode === "edit"}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar usuario..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName} (@{u.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Proyecto</Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={mode === "edit"}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar proyecto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* SHIFT TYPE SELECTOR */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="text-sm">2. Tipo de Turno</CardTitle>
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
                            ? "bg-violet-600/10 text-violet-700 border-violet-600 shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-border hover:bg-muted"}`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? "text-violet-600" : "text-zinc-400"}`} />
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
                        ? "Horario laboral de Lunes a Viernes. Sábados y Domingos son descanso automático (no se exige marcar ni genera falta). Ideal para personal administrativo u oficina."
                        : "El empleado tendrá este horario de forma temporal. El sistema solo calculará las faltas basándose en este horario durante el rango de fechas seleccionado. Fuera de dicho rango, el sistema no considerará el horario y no generará penalizaciones."}
                    </p>
                  </div>
                  {(shiftType === "REGULAR" || shiftType === "TRANSITORY") && (
                    <div className="flex gap-2 bg-muted/50 p-2 rounded-lg border border-zinc-100">
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-background" onClick={() => { setStartHour("08:00"); setEndHour("17:00"); }}>Día</Button>
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-background" onClick={() => { setStartHour("14:00"); setEndHour("22:00"); }}>Tarde</Button>
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-background" onClick={() => { setStartHour("22:00"); setEndHour("06:00"); }}>
                        Noche <span className="text-[9px] text-zinc-400 ml-1">22:00–06:00</span>
                      </Button>
                    </div>
                  )}
                  {(shiftType === "REGULAR" || shiftType === "TRANSITORY") && startHour === "22:00" && endHour === "06:00" && (
                    <div className="flex gap-2 bg-amber-50/50 text-amber-700 p-2 rounded-lg border border-amber-200 text-[10px]">
                      <Info className="w-3 h-3 shrink-0 mt-0.5" />
                      <p>Turno nocturno: la jornada cruza la medianoche. El sistema evaluará la asistencia entre las 22:00 y las 06:00 del día siguiente.</p>
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
                    3. Horario Flexible
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">Configura horas distintas por día</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex gap-3 bg-blue-50/50 text-blue-800 p-3 rounded-lg border border-blue-100 text-xs mb-4">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                    <p>
                      El sistema evaluará la asistencia de forma distinta según el día de la semana. Los días en los que dejes las horas vacías, el sistema entenderá que el empleado está en su día libre y <strong>no generará faltas automáticas</strong>.
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
                    3. Turno Rotativo
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">Ciclos de trabajo y descanso</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex gap-3 bg-blue-50/50 text-blue-800 p-3 rounded-lg border border-blue-100 text-xs">
                    <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
                    <div className="space-y-2">
                      <p>
                        El sistema calculará un ciclo continuo a partir de la Fecha de inicio. Exigirá asistencia por <strong>{rotationWorkDays} días</strong> consecutivos y luego apagará todas las alertas de falta automática por <strong>{rotationRestDays} días</strong>.
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

                  <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-lg text-center">
                    <p className="text-xs text-violet-700 font-medium">Ciclo total de {rotationWorkDays + rotationRestDays} días: {rotationWorkDays}d trabajo &rarr; {rotationRestDays}d descanso</p>
                  </div>

                  <div className="flex gap-2 bg-muted/50 p-2 rounded-lg border border-zinc-100">
                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-background" onClick={() => { setRotationStartHour("08:00"); setRotationEndHour("20:00"); }}>Día</Button>
                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-background" onClick={() => { setRotationStartHour("14:00"); setRotationEndHour("22:00"); }}>Tarde</Button>
                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-background" onClick={() => { setRotationStartHour("22:00"); setRotationEndHour("06:00"); }}>
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
                    <Label className="text-xs text-muted-foreground">Fecha de inicio del ciclo</Label>
                    <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
                    <p className="text-[10px] text-muted-foreground">El sistema empezará a contar el ciclo desde esta fecha. Si no se asigna, usará la fecha actual como inicio.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CONFIGURACIÓN GENERAL */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  4. Reglas Generales
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
            {(selectedUserId && selectedProjectId) && (
              <Card className="bg-violet-600/5 border-violet-600/20 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <SelectedIcon className="w-4 h-4 text-violet-700" />
                      <p className="text-sm font-medium text-foreground">
                        {selectedUser?.firstName} {selectedUser?.lastName}
                      </p>
                    </div>
                    <p className="text-[11px] text-zinc-500 mb-1">Proyecto: {selectedProject?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {SHIFT_TYPES.find(s => s.key === shiftType)?.label} | Tolerancia: {graceMinutes}m
                    </p>
                  </div>
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="shrink-0 shadow-sm bg-violet-600 hover:bg-violet-700">
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Guardando..." : "Guardar"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* BOTTOM ACTIONS - If not selected project/user, show a generic save button to keep layout consistent */}
        {(!selectedUserId || !selectedProjectId) && (
          <div className="flex justify-end mt-6 pt-4 border-t border-border">
            <Button disabled={true} className="bg-zinc-200 text-muted-foreground">
              <Save className="w-4 h-4 mr-2" />
              Completa los datos
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

