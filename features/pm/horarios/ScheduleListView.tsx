"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { getAllProjects, listShiftTemplates, getProjectMembers, graphqlRequest } from "@/app/services/project.assistance.service";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DataTable, Column } from "@/components/DataTable";
import { Loader2, Plus, Clock, Repeat, CalendarDays, CalendarRange, CheckCircle, AlertTriangle, Search } from "lucide-react";
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

function TemplatePreview({ template, projects, onAssign, onClose }: {
  template: any;
  projects: any[];
  onAssign: (id: string) => void;
  onClose: () => void;
}) {
  const project = projects.find((p: any) => p.id === template.projectId);
  const config = SHIFT_LABELS[template.shiftType] || SHIFT_LABELS["REGULAR"];
  const Icon = config.icon;

  return (
    <DialogContent className="sm:max-w-lg rounded-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {template.name}
        </DialogTitle>
        <DialogDescription>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${config.color}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="bg-background rounded-xl p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-500">Proyecto</span>
            <span className="font-medium">{project?.name || template.projectId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Tolerancia</span>
            <span className="font-medium">{template.graceMinutes} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Corte falta</span>
            <span className="font-medium">{template.absenceCutoffTime?.substring(0, 5) || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Zona horaria</span>
            <span className="font-medium">{template.timezone || "America/Lima"}</span>
          </div>
        </div>

        {template.shiftType === "REGULAR" || template.shiftType === "TRANSITORY" ? (
          <div className="bg-blue-50/50 rounded-xl p-4 text-sm">
            <p className="font-semibold text-blue-800 mb-2">Horario</p>
            <p className="text-blue-700">
              {template.workStartTime?.substring(0, 5)} - {template.workEndTime?.substring(0, 5)}
            </p>
            {template.shiftType === "TRANSITORY" && (template.validFrom || template.validUntil) && (
              <div className="flex gap-4 mt-2 text-xs text-blue-600">
                {template.validFrom && <span>Desde: {template.validFrom}</span>}
                {template.validUntil && <span>Hasta: {template.validUntil}</span>}
              </div>
            )}
          </div>
        ) : null}

        {template.shiftType === "FLEXIBLE" ? (
          <div className="bg-violet-50/50 rounded-xl p-4 text-sm">
            <p className="font-semibold text-violet-800 mb-2">Horarios por día</p>
            <div className="space-y-1">
              {DAYS_ORDER.map((day) => {
                const start = template[`${day.key}Start`];
                const end = template[`${day.key}End`];
                return (
                  <div key={day.key} className="flex justify-between text-xs">
                    <span className="text-violet-700">{day.label}</span>
                    <span className="font-medium">{start && end ? `${start.substring(0, 5)} - ${end.substring(0, 5)}` : "Libre"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {template.shiftType?.startsWith("ROTATING") ? (
          <div className="bg-blue-50/50 rounded-xl p-4 text-sm space-y-2">
            <p className="font-semibold text-blue-800 mb-2">Turno Rotativo</p>
            <div className="flex justify-between text-xs">
              <span className="text-blue-700">Ciclo</span>
              <span className="font-medium">{template.rotationWorkDays}d trabajo / {template.rotationRestDays}d descanso</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-blue-700">Horario</span>
              <span className="font-medium">{template.rotationShiftStartTime?.substring(0, 5)} - {template.rotationShiftEndTime?.substring(0, 5)}</span>
            </div>
            {template.validFrom && (
              <div className="flex justify-between text-xs">
                <span className="text-blue-700">Inicio ciclo</span>
                <span className="font-medium">{template.validFrom}</span>
              </div>
            )}
          </div>
        ) : null}

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onAssign(template.id)}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Establecer
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

export function ScheduleListView() {
  const router = useRouter();
  const { token, hydrated } = useAuth();

  const [projects, setProjects] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [assignedTemplateIds, setAssignedTemplateIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (hydrated && token) {
      getAllProjects(token).then((data) => {
        setProjects(data || []);
      });
    }
  }, [hydrated, token]);

  const fetchTemplates = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await listShiftTemplates(token, null);
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const executeAssignment = async (templateDataObj: any, targetMembers: any[]) => {
    try {
      const { id: _id, projectId: _pid, name: _name, createdAt: _ca, updatedAt: _ua, ...templateData } = templateDataObj;
      for (const m of targetMembers) {
        await graphqlRequest(
          `mutation assignSchedule($input: ScheduleInput!) {
            assignSchedule(input: $input) { id }
          }`,
          { input: { ...templateData, userId: m.userId, projectId: templateDataObj.projectId } },
          token
        );
      }
      setAssignedTemplateIds(prev => new Set(prev).add(templateDataObj.id));
      setPreviewTemplate(null);
      toast({
        title: "Asignación exitosa",
        description: `El horario ha sido asignado a ${targetMembers.length} miembros del proyecto.`,
      });
      router.refresh(); // Actualiza la caché para otras pantallas
    } catch (e) {
      toast({
        title: "Error al asignar",
        description: "Ocurrió un error asignando el horario.",
        variant: "destructive"
      });
    }
  };

  const [pendingAssignment, setPendingAssignment] = useState<{
    template: any;
    members: any[];
    membersWithSchedule: any[];
  } | null>(null);

  const columns: Column<any>[] = [
    {
      key: "projectName",
      header: "PROYECTO",
      render: (r) => {
        const p = projects.find(proj => proj.id === r.projectId);
        return <span className="text-xs text-zinc-500 font-medium">{p?.name || r.projectId}</span>;
      }
    },
    {
      key: "name",
      header: "NOMBRE",
      render: (r) => <span className="font-medium text-sm text-foreground">{r.name}</span>,
    },
    {
      key: "shiftType",
      header: "TIPO DE TURNO",
      render: (r) => {
        const c = SHIFT_LABELS[r.shiftType] || SHIFT_LABELS["REGULAR"];
        const Icon = c.icon;
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.color}`}>
            <Icon className="w-3 h-3" />
            {c.label}
          </span>
        );
      }
    },
    {
      key: "hours",
      header: "HORARIO",
      render: (r) => {
        if (r.shiftType === "FLEXIBLE") return <span className="text-zinc-500 text-xs">Varios horarios</span>;
        if (r.shiftType?.startsWith("ROTATING")) {
          return <span className="text-zinc-700 text-xs font-mono">{r.rotationShiftStartTime?.substring(0,5)} - {r.rotationShiftEndTime?.substring(0,5)}</span>;
        }
        return <span className="text-zinc-700 text-xs font-mono">{r.workStartTime?.substring(0,5)} - {r.workEndTime?.substring(0,5)}</span>;
      }
    },
    {
      key: "graceMinutes",
      header: "TOLERANCIA",
      render: (r) => <span className="text-xs text-muted-foreground">{r.graceMinutes} min</span>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button 
          size="sm" 
          className="h-7 text-xs" 
          onClick={() => setPreviewTemplate(r)}
          disabled={assignedTemplateIds.has(r.id)}
          variant={assignedTemplateIds.has(r.id) ? "outline" : "default"}
        >
          {assignedTemplateIds.has(r.id) ? "Asignado" : "Asignar"}
        </Button>
      ),
    }
  ];

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredTemplates = templates.filter(t => {
    const p = projects.find(proj => proj.id === t.projectId);
    const searchStr = `${t.name} ${p?.name || ""}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageTemplates = filteredTemplates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Horarios del Proyecto</CardTitle>
            <CardDescription className="text-xs">
              Selecciona un proyecto y asigna un horario a sus miembros
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-[300px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por proyecto u horario..."
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
            <Button
              onClick={() => router.push("/pm/creacion-horarios")}
              className="bg-primary text-white shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Crear Horario
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No hay horarios configurados</p>
              <p className="text-xs mt-1">Crea horarios para tus proyectos.</p>
            </div>
          ) : (
            <>
              <DataTable columns={columns} data={pageTemplates} />

              {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Página {currentPage} de {totalPages} ({filteredTemplates.length} horarios)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-border"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-border"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewTemplate} onOpenChange={(open) => { if (!open) setPreviewTemplate(null); }}>
        {previewTemplate && (
          <TemplatePreview
            template={previewTemplate}
            projects={projects}
            onAssign={async (id) => {
              try {
                const members = await getProjectMembers(token, previewTemplate.projectId);
                if (members && members.length > 0) {
                  const membersWithSchedule = members.filter((m: any) => m.hasCustomSchedule);
                  if (membersWithSchedule.length > 0) {
                    setPreviewTemplate(null);
                    setPendingAssignment({ template: previewTemplate, members, membersWithSchedule });
                  } else {
                    await executeAssignment(previewTemplate, members);
                  }
                } else {
                  toast({
                    title: "Sin miembros",
                    description: "El proyecto no tiene miembros asignados a los cuales aplicar este horario.",
                    variant: "destructive"
                  });
                  setPreviewTemplate(null);
                }
              } catch(e) {
                toast({
                  title: "Error al verificar miembros",
                  description: "Ocurrió un error verificando miembros del proyecto.",
                  variant: "destructive"
                });
                setPreviewTemplate(null);
              }
            }}
            onClose={() => setPreviewTemplate(null)}
          />
        )}
      </Dialog>

      <Dialog open={!!pendingAssignment} onOpenChange={(open) => { if (!open) setPendingAssignment(null); }}>
        {pendingAssignment && (
          <DialogContent className="max-w-md rounded-[24px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Sobrescribir Horarios</DialogTitle>
              <DialogDescription>
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto my-4" />
                Se ha detectado que <strong>{pendingAssignment.membersWithSchedule.length}</strong> de los {pendingAssignment.members.length} miembros del proyecto ya tienen un horario personalizado asignado.
                <br /><br />
                ¿Qué deseas hacer?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-4">
              <Button 
                variant="default" 
                className="w-full justify-start text-left bg-blue-600 hover:bg-blue-700"
                onClick={async () => {
                  await executeAssignment(pendingAssignment.template, pendingAssignment.members);
                  setPendingAssignment(null);
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold">Sobrescribir a todos</span>
                  <span className="text-xs font-normal opacity-80">Aplicar este horario a todos, borrando horarios anteriores.</span>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left border-border"
                onClick={async () => {
                  const toAssign = pendingAssignment.members.filter((m: any) => !m.hasCustomSchedule);
                  if (toAssign.length > 0) {
                    await executeAssignment(pendingAssignment.template, toAssign);
                  } else {
                    toast({ title: "Sin cambios", description: "Todos los miembros ya tenían horario personalizado." });
                  }
                  setPendingAssignment(null);
                }}
              >
                <div className="flex flex-col items-start text-muted-foreground">
                  <span className="font-bold">Solo a los sin horario</span>
                  <span className="text-xs font-normal opacity-80">Respetar horarios existentes y solo asignar a los nuevos.</span>
                </div>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-zinc-500 hover:text-zinc-700 hover:bg-accent"
                onClick={() => setPendingAssignment(null)}
              >
                Cancelar
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
