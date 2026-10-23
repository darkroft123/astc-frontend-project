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
  User,
  Folder,
  ChevronDown,
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
import { NotificationBell } from "@/components/layout/notification-bell";

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

  useEffect(() => {
    if (!hydrated) return;
    if (token) {
      Promise.all([getAllUsers(token).catch(() => []), getAllProjects(token).catch(() => [])])
        .then(async ([userData, projData]) => {
          const nonAdminUsers = (userData || []).filter((u: any) => {
            const role = (u.roleCode || u.roleName || u.role || "").toUpperCase();
            return role !== "ADMIN" && role !== "ROLE_ADMIN" && u.username?.toLowerCase() !== "admin";
          });
          const validUsers = nonAdminUsers || [];
          const validProjects = projData || [];

          setUsers(validUsers);
          setProjects(validProjects);

          const qUserId = searchParams.get("userId");
          if (qUserId && mode === "create") {
            const u = validUsers.find((x: any) => x.id === qUserId);
            if (u) setSelectedUserId(u.id);
          } else if (validUsers.length > 0 && !selectedUserId) {
            setSelectedUserId(validUsers[0].id);
          }

          const qProjectId = searchParams.get("projectId");
          if (qProjectId && mode === "create") {
            setSelectedProjectId(qProjectId);
          } else if (validProjects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(validProjects[0].id);
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
        .catch(() => {
          setUsers([]);
          setProjects([]);
        });
    } else {
      setUsers([]);
      setProjects([]);
      const qUserId = searchParams.get("userId");
      if (qUserId) setSelectedUserId(qUserId);
      const qProjectId = searchParams.get("projectId");
      if (qProjectId) setSelectedProjectId(qProjectId);
    }
  }, [hydrated, token, searchParams, mode]);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      if (initialData.userId) setSelectedUserId(initialData.userId);
      if (initialData.projectId) setSelectedProjectId(initialData.projectId);
      if (initialData.shiftType) setShiftType(initialData.shiftType as ShiftType);
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
    if (!selectedUserId || !selectedProjectId) {
      setError("Selecciona el usuario y el proyecto.");
      return;
    }
    setError(null);

    if (!token) {
      // Offline/Local mock simulation
      router.push("/pm/asignacion-horarios");
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedProject = projects.find((p) => p.id === selectedProjectId);

      if (mode === "create") {
        const existingMembers = await getProjectMembers(token, selectedProjectId).catch(() => []);
        if (!existingMembers.some((m: any) => m.userId === selectedUserId)) {
          await addProjectMember(token, selectedProjectId, selectedUserId).catch(() => {});
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

      if (validFrom) input.validFrom = validFrom;
      if (validUntil) input.validUntil = validUntil;

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
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header matching exact SVG */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            href="/pm/asignacion-horarios"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors mb-2 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Asignación de horarios</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {mode === "create" ? "Asignar horario personalizado" : "Editar horario personalizado"}
          </h1>
          <p className="font-hanken text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Configura un horario específico para un usuario. Reemplaza el horario heredado del proyecto.
          </p>
        </div>

        <div className="shrink-0">
          <NotificationBell />
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: 2 Columns on Desktop, 1 Column Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: Cards 1 & 2 */}
        <div className="space-y-6">
          {/* CARD 1: Asignación */}
          <div className="rounded-[20px] sm:rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-[#231B42] text-purple-700 dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">
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
                <label className="text-xs font-semibold text-foreground">
                  Usuario
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground pointer-events-none" />
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    disabled={mode === "edit"}
                    className="w-full h-11 pl-10 pr-9 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet appearance-none cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id} className="bg-card text-foreground">
                        {u.firstName || ""} {u.lastName || ""} (@{u.username || "usuario"})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3.5 top-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Proyecto */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Proyecto
                </label>
                <div className="relative">
                  <Folder className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground pointer-events-none" />
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    disabled={mode === "edit"}
                    className="w-full h-11 pl-10 pr-9 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet appearance-none cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="">Seleccionar proyecto...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-card text-foreground">
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3.5 top-3.5 text-muted-foreground pointer-events-none" />
                </div>
                {!selectedProjectId && (
                  <p className="text-xs text-amber-400 font-medium pt-1">
                    Elige un proyecto para continuar.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* CARD 2: Tipo de turno */}
          <div className="rounded-[20px] sm:rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-[#231B42] text-purple-700 dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
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

            {/* Desktop: top 3, bottom 2; Mobile: 2 cols */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {SHIFT_OPTIONS.map((opt) => {
                const isSelected = shiftType === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setShiftType(opt.key)}
                    className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? "border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500/30 dark:bg-purple-950/30 dark:text-purple-300 shadow-xs"
                        : "border-border dark:border-[#1E2335] bg-card/60 dark:bg-[#141829] hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    <p className={`text-xs sm:text-sm font-bold leading-tight ${isSelected ? "text-purple-700 dark:text-purple-300" : "text-foreground"}`}>
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

        {/* RIGHT COLUMN: Cards 3 & 4 */}
        <div className="space-y-6">
          {/* CARD 3: Configuración de horario */}
          <div className="rounded-[20px] sm:rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-[#231B42] text-purple-700 dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">
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
                {/* Info banner matching exact SVG text */}
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                  <p className="leading-relaxed">
                    Lunes a viernes. Sábados y domingos son descanso automático: no se exige marcar ni se genera falta. Ideal para personal administrativo u oficina.
                  </p>
                </div>

                {/* Plantilla rápida */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Plantilla rápida
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-background dark:bg-[#141829] border border-border dark:border-[#1E2335]">
                    <button
                      type="button"
                      onClick={() => handleApplyQuickTemplate("day")}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                        quickTemplate === "day"
                          ? "bg-primary/10 text-primary border border-primary/30 shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div>Día</div>
                      <div className="text-[10px] opacity-80 font-normal">08:00–17:00</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickTemplate("afternoon")}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                        quickTemplate === "afternoon"
                          ? "bg-primary/10 text-primary border border-primary/30 shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div>Tarde</div>
                      <div className="text-[10px] opacity-80 font-normal">14:00–22:00</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickTemplate("night")}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                        quickTemplate === "night"
                          ? "bg-primary/10 text-primary border border-primary/30 shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div>Noche</div>
                      <div className="text-[10px] opacity-80 font-normal">22:00–06:00</div>
                    </button>
                  </div>
                </div>

                {/* Hours inputs with Clock icon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
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
                        className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                      />
                      <Clock className="w-4 h-4 absolute right-3.5 top-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
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
                        className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                      />
                      <Clock className="w-4 h-4 absolute right-3.5 top-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                {shiftType === "TRANSITORY" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border dark:border-[#1E2335]">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Válido desde
                      </label>
                      <input
                        type="date"
                        value={validFrom}
                        onChange={(e) => setValidFrom(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Válido hasta
                      </label>
                      <input
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ROTATING */}
            {shiftType.startsWith("ROTATING") && (
              <div className="space-y-4 pt-1">
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                  <p className="leading-relaxed">
                    Ciclo continuo de <strong>{rotationWorkDays} días de trabajo</strong> seguidos de <strong>{rotationRestDays} días de descanso</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Entrada (laboral)
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={rotationStartHour}
                        onChange={(e) => setRotationStartHour(e.target.value)}
                        className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                      />
                      <Clock className="w-4 h-4 absolute right-3.5 top-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Salida (laboral)
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={rotationEndHour}
                        onChange={(e) => setRotationEndHour(e.target.value)}
                        className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                      />
                      <Clock className="w-4 h-4 absolute right-3.5 top-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-foreground">
                    Fecha de inicio del ciclo
                  </label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                  />
                </div>
              </div>
            )}

            {/* FLEXIBLE */}
            {shiftType === "FLEXIBLE" && (
              <div className="space-y-3 pt-1">
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
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
                          className="h-9 px-2.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs text-foreground"
                        />
                        <input
                          type="time"
                          value={h.end}
                          onChange={(e) =>
                            setFlexHours({ ...flexHours, [day.key]: { ...h, end: e.target.value } })
                          }
                          className="h-9 px-2.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs text-foreground"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* CARD 4: Reglas generales */}
          <div className="rounded-[20px] sm:rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-[#231B42] text-purple-700 dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
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
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Tolerancia (minutos)
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(parseInt(e.target.value) || 0)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                />
                <p className="text-[11px] text-muted-foreground leading-tight pt-0.5">
                  Minutos después de la entrada en los que aún llega a tiempo.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Corte de falta automática
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={absenceCutoffTime}
                    onChange={(e) => setAbsenceCutoffTime(e.target.value)}
                    className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                  />
                  <Clock className="w-4 h-4 absolute right-3.5 top-3.5 text-muted-foreground pointer-events-none" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight pt-0.5">
                  Si no marca antes de esta hora, se genera una falta. En turnos nocturnos solo aplica dentro de la ventana del turno.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR matching exact SVG */}
      <div className="rounded-[20px] sm:rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 text-center sm:text-left">
          <Info className="w-4 h-4 shrink-0 text-muted-foreground" />
          {!isFormReady
            ? "Completa usuario y proyecto para guardar."
            : `Horario listo para asignar a ${selectedUser?.firstName || "trabajador"}.`}
        </p>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/pm/asignacion-horarios"
            className="flex-1 sm:flex-initial h-11 px-6 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1c2238] text-xs sm:text-sm font-semibold text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            Cancelar
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormReady || isSubmitting}
            className="flex-1 sm:flex-initial h-11 px-6 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-500/20"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? "Guardando..." : "Guardar horario"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
