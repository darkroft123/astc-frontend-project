"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  FolderKanban,
  Save,
  Users,
  UserCog,
  Clock,
  PlaneTakeoff,
  Loader2,
  ArrowLeft,
  Calendar,
  Search,
  Info,
  Globe,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { TimezoneSelector } from "@/components/ui/timezone-selector";
import { DEFAULT_TIMEZONE } from "@/lib/timezones";

import {
  createProject,
  graphqlRequest,
  listProjectManagers,
  listTeamMembers,
} from "@/app/services/project.assistance.service";

import type { ProjectInput, User } from "@/components/types/dashboard";

export default function ProjectForm({ mode = "create", initialData }: any) {
  const { token, hydrated } = useAuth();
  const router = useRouter();

  /* ================= STATE ================= */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);

  const [projectManagers, setProjectManagers] = useState<User[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  const [responsibleId, setResponsibleId] = useState<string>("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  const [vacationEligibilityDays, setVacationEligibilityDays] = useState<number>(90);

  const [workStartTime, setWorkStartTime] = useState("08:00");
  const [workEndTime, setWorkEndTime] = useState("17:00");
  const [projectGraceMinutes, setProjectGraceMinutes] = useState(10);
  const [projectAbsenceCutoffTime, setProjectAbsenceCutoffTime] = useState("09:30");

  useEffect(() => {
    if (hydrated && token) {
      listProjectManagers(token)
        .then((res) => setProjectManagers(res || []))
        .catch((err) => console.error("Error loading project managers:", err));

      listTeamMembers(token)
        .then((res) => setTeamMembers(res || []))
        .catch((err) => console.error("Error loading team members:", err));
    }
  }, [hydrated, token]);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setStatus(initialData.status || "ACTIVE");
      setStartDate(initialData.startDate || "");
      setEndDate(initialData.endDate || "");

      if (initialData.timezone) setTimezone(initialData.timezone);
      if (initialData.vacationEligibilityDays != null) setVacationEligibilityDays(initialData.vacationEligibilityDays);
      if (initialData.workStartTime) setWorkStartTime(initialData.workStartTime);
      if (initialData.workEndTime) setWorkEndTime(initialData.workEndTime);
      if (initialData.graceMinutes != null) setProjectGraceMinutes(initialData.graceMinutes);
      if (initialData.absenceCutoffTime) setProjectAbsenceCutoffTime(initialData.absenceCutoffTime);

      if (initialData.responsibleId) setResponsibleId(initialData.responsibleId);
      if (initialData.members && initialData.members.length > 0) {
        const teamMemberIds = initialData.members
          .filter((m: any) => m.role !== "PROJECT_MANAGER")
          .map((m: any) => m.userId);
        setSelectedMemberIds(teamMemberIds);
      }
    }
  }, [mode, initialData]);

  function toggleMember(userId: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    if (!hydrated || !token) return;
    if (!name.trim()) {
      alert("Por favor ingresa el nombre del proyecto.");
      return;
    }

    setIsSubmitting(true);

    const memberIds = selectedMemberIds.filter((id) => id !== responsibleId);
    const input: any = {
      name,
      description,
      status: status as any,
      startDate: startDate || null,
      endDate: endDate || null,
      timezone,
      responsibleId: responsibleId || undefined,
      members: memberIds.map((userId) => ({
        userId,
        role: "TEAM_MEMBER",
      })),
      vacationEligibilityDays,
      workStartTime: workStartTime || "08:00",
      workEndTime: workEndTime || "17:00",
      graceMinutes: projectGraceMinutes,
      absenceCutoffTime: projectAbsenceCutoffTime || "09:30",
    };

    try {
      if (mode === "create") {
        await createProject(token, input);
      } else {
        const UPDATE_PROJECT = `
          mutation updateProject($id: String!, $input: ProjectInput!) {
            updateProject(id: $id, input: $input) {
              id
              name
              status
            }
          }
        `;
        await graphqlRequest(UPDATE_PROJECT, { id: initialData.id, input }, token);
      }

      router.push("/projects");
    } catch (err) {
      console.error("Error saving project:", err);
      alert("Error al guardar proyecto");
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedResponsible = projectManagers.find((u) => u.id === responsibleId);
  const filteredMembers = teamMembers.filter((u) => {
    const q = memberSearch.toLowerCase();
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const username = (u.username || "").toLowerCase();
    return fullName.includes(q) || username.includes(q);
  });

  return (
    <div className="relative min-h-screen bg-transparent overflow-hidden pb-12">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6 z-10">

        {/* MOBILE TOP BAR (MATCHING SVG: <- Proyectos + Notification Bell) */}
        <div className="flex md:hidden items-center justify-between pb-1">
          <button
            type="button"
            onClick={() => router.push("/projects")}
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:opacity-80 transition-opacity cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Proyectos</span>
          </button>
          <NotificationBell />
        </div>

        {/* SECTION HEADER */}
        <div className="flex items-start md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#A855F7] flex items-center justify-center text-white shadow-md shrink-0">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                {mode === "create" ? "Crear proyecto" : "Editar proyecto"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {mode === "create"
                  ? "Configura los parámetros operativos, horarios y miembros del nuevo proyecto."
                  : "Modifica los datos, asignaciones y reglas de asistencia del proyecto."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/projects")}
            className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-raised text-xs font-medium text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Proyectos</span>
          </button>
        </div>

        {/* FORM CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* LEFT COLUMN: Card 1 & Card 2 */}
          <div className="space-y-6">

            {/* CARD 1: DATOS DEL PROYECTO */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Datos del proyecto
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nombre, descripción, estado y zona horaria
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                {/* Nombre del proyecto */}
                <div className="space-y-1.5">
                  <Label htmlFor="projectName" className="text-xs font-medium text-foreground">
                    Nombre del proyecto <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <Input
                    id="projectName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej. Desarrollo web portal e-commerce"
                    required
                    className="h-11 px-3.5 rounded-xl border border-border bg-background text-foreground text-xs shadow-xs placeholder:text-muted-foreground"
                  />
                </div>

                {/* Descripción / alcance */}
                <div className="space-y-1.5">
                  <Label htmlFor="projectDesc" className="text-xs font-medium text-foreground">
                    Descripción / alcance <span className="text-muted-foreground text-[11px] font-normal">(opcional)</span>
                  </Label>
                  <textarea
                    id="projectDesc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalles sobre el alcance o entregables..."
                    rows={3}
                    className="w-full border border-border rounded-xl p-3 text-xs bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs transition-colors"
                  />
                </div>

                {/* Estado */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Estado</Label>
                  <Select value={status} onValueChange={(val) => setStatus(val)}>
                    <SelectTrigger className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-foreground text-xs shadow-xs">
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Activo</SelectItem>
                      <SelectItem value="INACTIVE">Inactivo</SelectItem>
                      <SelectItem value="COMPLETED">Completado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Zona horaria */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Zona horaria</Label>
                  <TimezoneSelector
                    value={timezone}
                    onChange={setTimezone}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Base para el horario y los feriados · UTC-5
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 2: PERIODO Y POLÍTICAS DE VACACIONES */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Periodo y políticas de vacaciones
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fechas de vigencia y elegibilidad para descanso
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Fecha de inicio</Label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-11 px-3.5 rounded-xl border border-border bg-background text-foreground text-xs shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Fecha de fin</Label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-11 px-3.5 rounded-xl border border-border bg-background text-foreground text-xs shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-medium text-foreground">Días de antigüedad para vacaciones</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={vacationEligibilityDays}
                      onChange={(e) => setVacationEligibilityDays(Number(e.target.value) || 0)}
                      className="h-11 px-3.5 rounded-xl border border-border bg-background text-foreground text-xs w-24 shadow-xs"
                    />
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setVacationEligibilityDays(90)}
                        className={`text-xs px-3 py-2 rounded-xl border transition-all cursor-pointer font-medium ${
                          vacationEligibilityDays === 90
                            ? "bg-primary/10 border-primary/40 text-primary font-semibold shadow-xs"
                            : "bg-background border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        3 meses <span className="text-[10px] opacity-70">90d</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVacationEligibilityDays(180)}
                        className={`text-xs px-3 py-2 rounded-xl border transition-all cursor-pointer font-medium ${
                          vacationEligibilityDays === 180
                            ? "bg-primary/10 border-primary/40 text-primary font-semibold shadow-xs"
                            : "bg-background border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        6 meses <span className="text-[10px] opacity-70">180d</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Días trabajados antes de que un miembro pueda solicitar vacaciones.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Card 3 & Card 4 */}
          <div className="space-y-6">

            {/* CARD 3: RESPONSABLE Y EQUIPO */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Responsable y equipo
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Jefe de proyecto y colaboradores asignados
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                {/* Project Manager selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Project manager responsable</Label>
                  <Select value={responsibleId} onValueChange={(val) => setResponsibleId(val)}>
                    <SelectTrigger className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-foreground text-xs shadow-xs">
                      <SelectValue placeholder="Selecciona un responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectManagers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName} (@{u.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedResponsible && (
                    <p className="text-[11px] text-primary bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                      Asignado: <strong>{selectedResponsible.firstName} {selectedResponsible.lastName}</strong> ({selectedResponsible.email || selectedResponsible.username})
                    </p>
                  )}
                </div>

                {/* Team Members search and list */}
                <div className="space-y-2 pt-1 border-t border-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-foreground">Miembros del proyecto</Label>
                    <span className="text-[11px] font-semibold text-primary">{selectedMemberIds.length} seleccionados</span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Buscar por nombre o usuario..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="h-10 pl-10 pr-3.5 text-xs rounded-xl border border-border bg-background shadow-xs"
                    />
                  </div>

                  <div className="border border-border rounded-xl p-2 max-h-52 overflow-y-auto space-y-1 bg-background/50">
                    {filteredMembers.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground text-center py-4">No hay miembros disponibles</p>
                    ) : (
                      filteredMembers.map((u) => {
                        const isChecked = selectedMemberIds.includes(u.id);
                        const initials = `${(u.firstName?.[0] || "").toUpperCase()}${(u.lastName?.[0] || "").toUpperCase()}` || "U";
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                              isChecked ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/60"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleMember(u.id)}
                                className="w-4 h-4 rounded text-primary border-border focus:ring-primary cursor-pointer"
                              />
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                                {initials}
                              </div>
                              <span className="font-medium text-foreground truncate">{u.firstName} {u.lastName}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-2">@{u.username}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 4: HORARIO BASE Y TOLERANCIA */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Horario base y tolerancia
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Jornada estándar que se aplica por defecto a los miembros
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Hora de entrada</span>
                  </Label>
                  <Input
                    type="time"
                    value={workStartTime}
                    onChange={(e) => setWorkStartTime(e.target.value)}
                    className="h-11 px-3.5 text-xs rounded-xl border border-border bg-background shadow-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Inicio regular de la jornada.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Hora de salida</span>
                  </Label>
                  <Input
                    type="time"
                    value={workEndTime}
                    onChange={(e) => setWorkEndTime(e.target.value)}
                    className="h-11 px-3.5 text-xs rounded-xl border border-border bg-background shadow-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Fin programado de la jornada.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Tolerancia (min)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    value={projectGraceMinutes}
                    onChange={(e) => setProjectGraceMinutes(Number(e.target.value) || 0)}
                    className="h-11 px-3.5 text-xs rounded-xl border border-border bg-background shadow-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Minutos de gracia antes de marcar tardanza.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Corte de falta</span>
                  </Label>
                  <Input
                    type="time"
                    value={projectAbsenceCutoffTime}
                    onChange={(e) => setProjectAbsenceCutoffTime(e.target.value)}
                    className="h-11 px-3.5 text-xs rounded-xl border border-border bg-background shadow-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Desde esta hora se marca falta automática.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-stretch gap-3 shadow-xs mt-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>
              {!name.trim()
                ? "Escribe el nombre del proyecto para guardar."
                : "Todos los campos principales están listos para guardar."}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => router.push("/projects")}
              disabled={isSubmitting}
              className="h-12 flex-1 rounded-2xl text-sm font-semibold border border-border bg-card dark:bg-[#161928] hover:bg-raised text-foreground transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center shadow-xs"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-12 flex-1 rounded-2xl text-sm font-semibold bg-brand-gradient hover:brightness-110 active:scale-[0.98] text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSubmitting ? "Guardando..." : "Guardar proyecto"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
