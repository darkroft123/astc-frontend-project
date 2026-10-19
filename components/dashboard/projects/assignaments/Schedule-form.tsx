"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Clock,
  Info,
  AlertCircle,
  Save,
  Check,
  Calendar,
} from "lucide-react";
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

interface ShiftOption {
  key: ShiftType;
  title: string;
  description: string;
}

const SHIFT_OPTIONS: ShiftOption[] = [
  { key: "REGULAR", title: "Regular", description: "Lun–vie, horario fijo" },
  { key: "ROTATING_4X4", title: "Rotativo 4x4", description: "4 días trabajo, 4 descanso" },
  { key: "ROTATING_7X7", title: "Rotativo 7x7", description: "7 días trabajo, 7 descanso" },
  { key: "FLEXIBLE", title: "Flexible", description: "Horas por día, sin hora fija" },
  { key: "TRANSITORY", title: "Transitorio", description: "Por un periodo definido" },
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
  const [quickTemplate, setQuickTemplate] = useState<"day" | "afternoon" | "night">("day");

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

  // Projects available
  const availableProjects = useMemo(() => {
    return projects;
  }, [projects]);

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
            const u = (userData || []).find((x: any) => x.id === qUserId);
            if (u) setSelectedUserId(u.id);
          }

          const qProjectId = searchParams.get("projectId");
          if (qProjectId && mode === "create") {
            setSelectedProjectId(qProjectId);
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
                if (tpl.absenceCutoffTime) setAbsenceCutoffTime(tpl.absenceCutoffTime.substring(0, 5));
                if (tpl.workStartTime) setStartHour(tpl.workStartTime.substring(0, 5));
                if (tpl.workEndTime) setEndHour(tpl.workEndTime.substring(0, 5));
                if (tpl.rotationWorkDays) setRotationWorkDays(tpl.rotationWorkDays);
                if (tpl.rotationRestDays) setRotationRestDays(tpl.rotationRestDays);
                if (tpl.rotationShiftStartTime) setRotationStartHour(tpl.rotationShiftStartTime.substring(0, 5));
                if (tpl.rotationShiftEndTime) setRotationEndHour(tpl.rotationShiftEndTime.substring(0, 5));
                if (tpl.validFrom) setValidFrom(tpl.validFrom);
                if (tpl.validUntil) setValidUntil(tpl.validUntil);
              }
            } catch {
              /* ignore */
            }
          }
        })
        .catch((err) => console.error("Error loading options:", err));
    }
  }, [hydrated, token, searchParams, mode]);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setSelectedUserId(initialData.userId || "");
      setSelectedProjectId(initialData.projectId || "");
      if (initialData.shiftType) {
        setShiftType(initialData.shiftType as ShiftType);
      }
      if (initialData.startHour) setStartHour(initialData.startHour.substring(0, 5));
      if (initialData.endHour) setEndHour(initialData.endHour.substring(0, 5));
      if (initialData.graceMinutes !== undefined) setGraceMinutes(initialData.graceMinutes);
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

  const handleApplyQuickTemplate = (type: "day" | "afternoon" | "night") => {
    setQuickTemplate(type);
    if (type === "day") {
      setStartHour("08:00");
      setEndHour("17:00");
      setAbsenceCutoffTime("09:30");
    } else if (type === "afternoon") {
      setStartHour("14:00");
      setEndHour("22:00");
      setAbsenceCutoffTime("15:30");
    } else if (type === "night") {
      setStartHour("22:00");
      setEndHour("06:00");
      setAbsenceCutoffTime("23:30");
    }
  };

  const handleSubmit = async () => {
    if (!hydrated || !token) return;
    setError(null);

    if (!selectedUserId || !selectedProjectId) {
      setError("Selecciona el usuario y el proyecto.");
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedProject = projects.find((p) => p.id === selectedProjectId);

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

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const isFormReady = Boolean(selectedUserId && selectedProjectId);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Back navigation */}
        <div>
          <Link
            href="/pm/asignacion-horarios"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-ink dark:text-violet hover:text-violet-ink transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Asignación de horarios
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {mode === "create" ? "Asignar horario personalizado" : "Editar horario personalizado"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configura un horario específico para un usuario. Reemplaza el horario heredado del proyecto.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* LEFT COLUMN: Steps 1 & 2 */}
          <div className="space-y-6">

            {/* STEP 1: Asignación */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-violet text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground leading-tight">
                    Asignación
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Selecciona el usuario y el proyecto
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                {/* Usuario */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Usuario
                  </label>
                  {mode === "edit" || selectedUser ? (
                    <input
                      type="text"
                      disabled
                      value={
                        selectedUser
                          ? `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() +
                            (selectedUser.username ? ` (@${selectedUser.username})` : "")
                          : "Usuario no seleccionado"
                      }
                      className="w-full h-10 px-3 rounded-lg border border-border bg-muted/40 text-sm text-foreground font-medium cursor-not-allowed opacity-90"
                    />
                  ) : (
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                    >
                      <option value="">Seleccionar usuario...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName} (@{u.username})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Proyecto */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Proyecto
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    disabled={mode === "edit"}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                  >
                    <option value="">Seleccionar proyecto...</option>
                    {availableProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {!selectedProjectId && (
                    <p className="text-xs text-amber-ink dark:text-amber flex items-center gap-1.5 pt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Elige un proyecto para continuar.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 2: Tipo de turno */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-violet text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground leading-tight">
                    Tipo de turno
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Elige la modalidad de horario
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {SHIFT_OPTIONS.map((opt) => {
                  const isSelected = shiftType === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setShiftType(opt.key)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-violet dark:border-violet bg-violet/10 dark:bg-violet/15 ring-1 ring-violet dark:ring-violet"
                          : "border-border bg-card hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-semibold leading-tight ${isSelected ? "text-violet-ink dark:text-violet-ink" : "text-foreground"}`}>
                          {opt.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {opt.description}
                        </p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "border-violet bg-violet text-white"
                            : "border-muted-foreground/40 bg-transparent"
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Steps 3 & 4 */}
          <div className="space-y-6">

            {/* STEP 3: Configuración de horario */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-violet text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground leading-tight">
                    {shiftType === "REGULAR" ? "Horario regular" :
                     shiftType === "TRANSITORY" ? "Horario transitorio" :
                     shiftType === "FLEXIBLE" ? "Horario flexible" : "Turno rotativo"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Define las horas de entrada y salida
                  </p>
                </div>
              </div>

              {/* REGULAR / TRANSITORY */}
              {(shiftType === "REGULAR" || shiftType === "TRANSITORY") && (
                <div className="space-y-4 pt-1">
                  {/* Info banner */}
                  <div className="p-3 rounded-lg bg-blue/10 dark:bg-blue/15 border border-blue/20 dark:border-blue/30 text-blue dark:text-blue text-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue dark:text-blue" />
                    <p className="leading-relaxed">
                      Lunes a viernes. Sábados y domingos son descanso automático (no exige marcar ni genera falta).
                    </p>
                  </div>

                  {/* Plantilla rápida */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Plantilla rápida
                    </label>
                    <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-muted/60 border border-border">
                      <button
                        type="button"
                        onClick={() => handleApplyQuickTemplate("day")}
                        className={`py-2 px-2 rounded-lg text-xs font-medium transition-all text-center ${
                          quickTemplate === "day"
                            ? "bg-card text-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div>Día</div>
                        <div className="text-[10px] text-muted-foreground font-normal">08:00 - 17:00</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyQuickTemplate("afternoon")}
                        className={`py-2 px-2 rounded-lg text-xs font-medium transition-all text-center ${
                          quickTemplate === "afternoon"
                            ? "bg-card text-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div>Tarde</div>
                        <div className="text-[10px] text-muted-foreground font-normal">14:00 - 22:00</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyQuickTemplate("night")}
                        className={`py-2 px-2 rounded-lg text-xs font-medium transition-all text-center ${
                          quickTemplate === "night"
                            ? "bg-card text-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div>Noche</div>
                        <div className="text-[10px] text-muted-foreground font-normal">22:00 - 06:00</div>
                      </button>
                    </div>
                  </div>

                  {/* Hours inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Hora de entrada
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          value={startHour}
                          onChange={(e) => {
                            setStartHour(e.target.value);
                            setQuickTemplate("day");
                          }}
                          className="w-full h-10 px-3 pr-8 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                        />
                        <Clock className="w-4 h-4 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Hora de salida
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          value={endHour}
                          onChange={(e) => {
                            setEndHour(e.target.value);
                            setQuickTemplate("day");
                          }}
                          className="w-full h-10 px-3 pr-8 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                        />
                        <Clock className="w-4 h-4 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {shiftType === "TRANSITORY" && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Válido desde
                        </label>
                        <input
                          type="date"
                          value={validFrom}
                          onChange={(e) => setValidFrom(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Válido hasta
                        </label>
                        <input
                          type="date"
                          value={validUntil}
                          onChange={(e) => setValidUntil(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ROTATING 4X4 / 7X7 */}
              {shiftType.startsWith("ROTATING") && (
                <div className="space-y-4 pt-1">
                  <div className="p-3 rounded-lg bg-blue/10 dark:bg-blue/15 border border-blue/20 dark:border-blue/30 text-blue dark:text-blue text-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue dark:text-blue" />
                    <p className="leading-relaxed">
                      Ciclo continuo de <strong>{rotationWorkDays} días de trabajo</strong> seguidos de <strong>{rotationRestDays} días de descanso</strong>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Entrada (laboral)
                      </label>
                      <input
                        type="time"
                        value={rotationStartHour}
                        onChange={(e) => setRotationStartHour(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Salida (laboral)
                      </label>
                      <input
                        type="time"
                        value={rotationEndHour}
                        onChange={(e) => setRotationEndHour(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Fecha de inicio del ciclo
                    </label>
                    <input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                    />
                  </div>
                </div>
              )}

              {/* FLEXIBLE */}
              {shiftType === "FLEXIBLE" && (
                <div className="space-y-3 pt-1">
                  <div className="p-3 rounded-lg bg-blue/10 dark:bg-blue/15 border border-blue/20 dark:border-blue/30 text-blue dark:text-blue text-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue dark:text-blue" />
                    <p className="leading-relaxed">
                      Configura horas distintas por día. Los días vacíos se consideran descanso automático.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {DAYS.map((day) => {
                      const h = flexHours[day.key];
                      return (
                        <div key={day.key} className="grid grid-cols-[80px_1fr_1fr] gap-2 items-center">
                          <span className="text-xs font-medium text-muted-foreground">{day.label}</span>
                          <input
                            type="time"
                            value={h.start}
                            onChange={(e) =>
                              setFlexHours({ ...flexHours, [day.key]: { ...h, start: e.target.value } })
                            }
                            className="h-8 px-2 rounded-md border border-border bg-background text-xs"
                          />
                          <input
                            type="time"
                            value={h.end}
                            onChange={(e) =>
                              setFlexHours({ ...flexHours, [day.key]: { ...h, end: e.target.value } })
                            }
                            className="h-8 px-2 rounded-md border border-border bg-background text-xs"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* STEP 4: Reglas generales */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-violet text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground leading-tight">
                    Reglas generales
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tolerancia y hora límite para faltas automáticas
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tolerancia (minutos)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={graceMinutes}
                    onChange={(e) => setGraceMinutes(parseInt(e.target.value) || 0)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Corte de falta automática
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={absenceCutoffTime}
                      onChange={(e) => setAbsenceCutoffTime(e.target.value)}
                      className="w-full h-10 px-3 pr-8 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                    />
                    <Clock className="w-4 h-4 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {!isFormReady
              ? "Completa usuario y proyecto para guardar."
              : `Horario listo para asignar a ${selectedUser?.firstName || "colaborador"}.`}
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Link
              href="/pm/asignacion-horarios"
              className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormReady || isSubmitting}
              className="px-5 py-2 rounded-lg bg-violet hover:bg-violet/90 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              {isSubmitting ? "Guardando..." : "Guardar horario"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
