"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { FolderKanban, Save, Users, UserCog, Clock, PlaneTakeoff, Loader2, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {mode === "create" ? "Crear Proyecto" : "Editar Proyecto"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {mode === "create"
                  ? "Configura los parámetros operativos, horarios y miembros del nuevo proyecto"
                  : "Modifica los datos, asignaciones y reglas de asistencia del proyecto"}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/projects')}
            className="text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Volver a Proyectos
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT COLUMN: General Info & Period */}
          <div className="space-y-6">

            {/* CARD 1: GENERAL INFORMATION */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="text-sm">1. Datos del Proyecto</CardTitle>
                <CardDescription className="text-xs">Nombre, descripción, estado y zona horaria</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="projectName" className="text-xs text-muted-foreground">Nombre del Proyecto *</Label>
                  <Input
                    id="projectName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej. Desarrollo Web Portal E-Commerce"
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="projectDesc" className="text-xs text-muted-foreground">Descripción / Alcance</Label>
                  <textarea
                    id="projectDesc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalles sobre el alcance o entregables..."
                    rows={2}
                    className="w-full border border-border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Estado</Label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="h-9 w-full border border-border rounded-lg px-2.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                      <option value="COMPLETED">Completado</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Zona Horaria</Label>
                    <TimezoneSelector
                      value={timezone}
                      onChange={setTimezone}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 2: DATES & VACATION POLICIES */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="text-sm">2. Periodo y Políticas de Vacaciones</CardTitle>
                <CardDescription className="text-xs">Fechas de vigencia y elegibilidad de descanso</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Fecha de Inicio</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Fecha de Fin (Estimada)</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 space-y-2">
                  <Label className="text-xs text-muted-foreground">Días de Antigüedad para Vacaciones</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={vacationEligibilityDays}
                      onChange={(e) => setVacationEligibilityDays(Number(e.target.value) || 0)}
                      className="h-9 text-xs w-32"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setVacationEligibilityDays(90)}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                          vacationEligibilityDays === 90
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                            : 'bg-background border-border text-muted-foreground hover:border-border hover:bg-muted'
                        }`}
                      >
                        3 meses (90d)
                      </button>
                      <button
                        type="button"
                        onClick={() => setVacationEligibilityDays(180)}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                          vacationEligibilityDays === 180
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                            : 'bg-background border-border text-muted-foreground hover:border-border hover:bg-muted'
                        }`}
                      >
                        6 meses (180d)
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: Responsible, Members & Schedules */}
          <div className="space-y-6">

            {/* CARD 3: RESPONSIBLE & TEAM MEMBERS */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="text-sm">3. Responsable y Equipo</CardTitle>
                <CardDescription className="text-xs">Jefe de proyecto y colaboradores asignados</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Jefe de Proyecto Responsable</Label>
                  <select
                    value={responsibleId}
                    onChange={(e) => setResponsibleId(e.target.value)}
                    className="h-9 w-full border border-border rounded-lg px-2.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Seleccionar Responsable --</option>
                    {projectManagers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} (@{u.username})
                      </option>
                    ))}
                  </select>
                  {selectedResponsible && (
                    <p className="text-[11px] text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-100">
                      Asignado: <strong>{selectedResponsible.firstName} {selectedResponsible.lastName}</strong> ({selectedResponsible.email || selectedResponsible.username})
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Miembros del Proyecto</Label>
                    <span className="text-[10px] text-blue-600 font-semibold">{selectedMemberIds.length} seleccionados</span>
                  </div>
                  <Input
                    type="text"
                    placeholder="Buscar miembros..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="h-8 text-xs mb-2"
                  />
                  <div className="border border-border rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                    {filteredMembers.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 text-center py-2">No hay miembros disponibles</p>
                    ) : (
                      filteredMembers.map((u) => (
                        <label
                          key={u.id}
                          className="flex items-center justify-between p-1.5 hover:bg-accent rounded cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedMemberIds.includes(u.id)}
                              onChange={() => toggleMember(u.id)}
                              className="rounded text-blue-600 border-zinc-300 focus:ring-blue-500"
                            />
                            <span>{u.firstName} {u.lastName}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">@{u.username}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 4: BASE SCHEDULE & TOLERANCES */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="text-sm">4. Horario Base y Tolerancia</CardTitle>
                <CardDescription className="text-xs">Jornada estándar aplicable a los miembros por defecto</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Hora de Entrada</Label>
                    <Input
                      type="time"
                      value={workStartTime}
                      onChange={(e) => setWorkStartTime(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                    <p className="text-[10px] text-muted-foreground">Inicio regular de la jornada</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Hora de Salida</Label>
                    <Input
                      type="time"
                      value={workEndTime}
                      onChange={(e) => setWorkEndTime(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                    <p className="text-[10px] text-muted-foreground">Fin programado de la jornada</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Tolerancia (min)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={120}
                      value={projectGraceMinutes}
                      onChange={(e) => setProjectGraceMinutes(Number(e.target.value) || 0)}
                      className="h-9 text-xs bg-background"
                    />
                    <p className="text-[10px] text-muted-foreground">Minutos de gracia sin tardanza</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Corte de Falta</Label>
                    <Input
                      type="time"
                      value={projectAbsenceCutoffTime}
                      onChange={(e) => setProjectAbsenceCutoffTime(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                    <p className="text-[10px] text-muted-foreground">Límite: a partir de aquí se marca falta automática</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

        {/* BOTTOM BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button
            variant="outline"
            onClick={() => router.push('/projects')}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? "Guardando..." : "Guardar Proyecto"}
          </Button>
        </div>

      </div>
    </div>
  );
}
