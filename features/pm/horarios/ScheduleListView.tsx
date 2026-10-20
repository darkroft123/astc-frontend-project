"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { getAllProjects, listShiftTemplates, getProjectMembers, graphqlRequest } from "@/app/services/project.assistance.service";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DataTable, Column } from "@/components/DataTable";
import { 
  Loader2, 
  Plus, 
  Clock, 
  Repeat, 
  CalendarDays, 
  CalendarRange, 
  CheckCircle, 
  AlertTriangle, 
  Search,
  Pencil,
  Users,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const SHIFT_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  REGULAR: { label: "Regular", icon: Clock, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  ROTATING_4X4: { label: "Rotativo 4×4", icon: Repeat, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  ROTATING_7X7: { label: "Rotativo 7×7", icon: Repeat, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  FLEXIBLE: { label: "Flexible", icon: CalendarDays, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  TRANSITORY: { label: "Transitorio", icon: CalendarRange, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
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
    <DialogContent className="sm:max-w-lg rounded-2xl bg-card border-border">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-foreground">
          <Icon className="w-5 h-5 text-primary" />
          {template.name}
        </DialogTitle>
        <DialogDescription>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.color}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="bg-background/80 border border-border/60 rounded-xl p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Proyecto</span>
            <span className="font-medium text-foreground">{project?.name || template.projectId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tolerancia</span>
            <span className="font-medium text-foreground">{template.graceMinutes} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Corte falta</span>
            <span className="font-medium text-foreground">{template.absenceCutoffTime?.substring(0, 5) || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Zona horaria</span>
            <span className="font-medium text-foreground">{template.timezone || "America/Lima"}</span>
          </div>
        </div>

        {template.shiftType === "REGULAR" || template.shiftType === "TRANSITORY" ? (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm">
            <p className="font-semibold text-foreground mb-2">Horario</p>
            <p className="text-muted-foreground">
              {template.workStartTime?.substring(0, 5)} - {template.workEndTime?.substring(0, 5)}
            </p>
            {template.shiftType === "TRANSITORY" && (template.validFrom || template.validUntil) && (
              <div className="flex gap-4 mt-2 text-xs text-primary">
                {template.validFrom && <span>Desde: {template.validFrom}</span>}
                {template.validUntil && <span>Hasta: {template.validUntil}</span>}
              </div>
            )}
          </div>
        ) : null}

        {template.shiftType === "FLEXIBLE" ? (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm">
            <p className="font-semibold text-foreground mb-2">Horarios por día</p>
            <div className="space-y-1">
              {DAYS_ORDER.map((day) => {
                const start = template[`${day.key}Start`];
                const end = template[`${day.key}End`];
                return (
                  <div key={day.key} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{day.label}</span>
                    <span className="font-medium text-foreground">{start && end ? `${start.substring(0, 5)} - ${end.substring(0, 5)}` : "Libre"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {template.shiftType?.startsWith("ROTATING") ? (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm space-y-2">
            <p className="font-semibold text-foreground mb-2">Turno Rotativo</p>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Ciclo</span>
              <span className="font-medium text-foreground">{template.rotationWorkDays}d trabajo / {template.rotationRestDays}d descanso</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Horario</span>
              <span className="font-medium text-foreground">{template.rotationShiftStartTime?.substring(0, 5)} - {template.rotationShiftEndTime?.substring(0, 5)}</span>
            </div>
            {template.validFrom && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Inicio ciclo</span>
                <span className="font-medium text-foreground">{template.validFrom}</span>
              </div>
            )}
          </div>
        ) : null}

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onAssign(template.id)} className="bg-brand-gradient text-white">
            <CheckCircle className="w-4 h-4 mr-2" />
            Establecer
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

const DEFAULT_MOCK_PROJECTS = [
  { id: "p1", name: "Gestión de Asistencia" },
  { id: "p2", name: "Proyecto Testeo" },
  { id: "p3", name: "Testo6" },
];

const DEFAULT_MOCK_TEMPLATES = [
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
    id: "tpl-2",
    name: "Turno Rotativo 4x4 Operaciones",
    shiftType: "ROTATING_4X4",
    projectId: "p1",
    rotationWorkDays: 4,
    rotationRestDays: 4,
    rotationShiftStartTime: "07:00:00",
    rotationShiftEndTime: "19:00:00",
    graceMinutes: 15,
    absenceCutoffTime: "08:30:00",
    timezone: "America/Lima",
    validFrom: "2026-01-01",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl-3",
    name: "Turno Flexible Desarrollo / Tech",
    shiftType: "FLEXIBLE",
    projectId: "p2",
    graceMinutes: 15,
    timezone: "America/Lima",
    mondayStart: "08:30:00",
    mondayEnd: "17:30:00",
    tuesdayStart: "08:30:00",
    tuesdayEnd: "17:30:00",
    wednesdayStart: "08:30:00",
    wednesdayEnd: "17:30:00",
    thursdayStart: "08:30:00",
    thursdayEnd: "17:30:00",
    fridayStart: "08:00:00",
    fridayEnd: "14:00:00",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl-4",
    name: "Turno Transitorio Campaña Especial",
    shiftType: "TRANSITORY",
    projectId: "p3",
    workStartTime: "08:00:00",
    workEndTime: "16:00:00",
    graceMinutes: 5,
    absenceCutoffTime: "09:00:00",
    timezone: "America/Lima",
    validFrom: "2026-03-01",
    validUntil: "2026-06-30",
    createdAt: new Date().toISOString(),
  },
];

export function ScheduleListView() {
  const router = useRouter();
  const { token, hydrated } = useAuth();

  const [projects, setProjects] = useState<any[]>(DEFAULT_MOCK_PROJECTS);
  const [templates, setTemplates] = useState<any[]>(DEFAULT_MOCK_TEMPLATES);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [assignedTemplateIds, setAssignedTemplateIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (!hydrated) return;
    if (token) {
      getAllProjects(token)
        .then((data) => {
          setProjects(data && data.length > 0 ? data : DEFAULT_MOCK_PROJECTS);
        })
        .catch(() => {
          setProjects(DEFAULT_MOCK_PROJECTS);
        });
    } else {
      setProjects(DEFAULT_MOCK_PROJECTS);
    }
  }, [hydrated, token]);

  const fetchTemplates = useCallback(async () => {
    if (!token) {
      setTemplates(DEFAULT_MOCK_TEMPLATES);
      setProjects(DEFAULT_MOCK_PROJECTS);
      return;
    }
    setLoading(true);
    try {
      const data = await listShiftTemplates(token);
      if (Array.isArray(data) && data.length > 0) {
        setTemplates(data);
      } else {
        setTemplates(DEFAULT_MOCK_TEMPLATES);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      setTemplates(DEFAULT_MOCK_TEMPLATES);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const executeAssignment = async (templateDataObj: any, targetMembers: any[]) => {
    if (!token) return;
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
      router.refresh();
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
        return <span className="text-xs text-muted-foreground font-medium">{p?.name || r.projectId}</span>;
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
        if (r.shiftType === "FLEXIBLE") return <span className="text-muted-foreground text-xs">Varios horarios</span>;
        if (r.shiftType?.startsWith("ROTATING")) {
          return <span className="text-foreground text-xs font-mono">{r.rotationShiftStartTime?.substring(0,5)} - {r.rotationShiftEndTime?.substring(0,5)}</span>;
        }
        return <span className="text-foreground text-xs font-mono">{r.workStartTime?.substring(0,5)} - {r.workEndTime?.substring(0,5)}</span>;
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
        <div className="flex items-center gap-2 justify-end">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-lg"
            onClick={() => router.push(`/pm/creacion-horarios?id=${r.id}`)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button 
            size="sm" 
            className="h-8 text-xs bg-[#2A1E4A] hover:bg-[#34255C] border border-purple-700/40 text-purple-200" 
            onClick={() => setPreviewTemplate(r)}
            disabled={assignedTemplateIds.has(r.id)}
          >
            <Users className="w-3.5 h-3.5 mr-1" />
            {assignedTemplateIds.has(r.id) ? "Asignado" : "Asignar"}
          </Button>
        </div>
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
      {/* Botón Crear Horario grande (Mobile only) */}
      <div className="md:hidden">
        <Button
          onClick={() => router.push("/pm/creacion-horarios")}
          className="w-full bg-brand-gradient hover:opacity-95 text-white font-medium py-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 text-base"
        >
          <Plus className="w-5 h-5" />
          Crear horario
        </Button>
      </div>

      {/* Desktop Top Action Row */}
      <div className="hidden md:flex md:items-center md:justify-between gap-4 rounded-2xl border border-border bg-card/60 p-4 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-foreground">Horarios del proyecto</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecciona un horario y asígnalo a los miembros del proyecto.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por proyecto u horario..."
              className="pl-9 bg-background/50 border-border rounded-xl h-10 text-xs"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <Button
            onClick={() => router.push("/pm/creacion-horarios")}
            className="h-10 px-4 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-purple-500/20 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear horario</span>
          </Button>
        </div>
      </div>

      {/* Card Horarios del proyecto con buscador (Mobile only) */}
      <Card className="md:hidden border-border bg-card/60 backdrop-blur-sm rounded-2xl shadow-sm">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Horarios del proyecto</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Selecciona un horario y asígnalo a los miembros del proyecto.
            </p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar por proyecto u horario..."
              className="pl-9 bg-background/50 border-border rounded-xl h-10 text-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vista Móvil: Tarjetas idénticas al SVG gestion de horarios-dark.svg */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground bg-card rounded-2xl border border-border">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-40" />
            <p className="text-sm font-medium text-foreground">No hay horarios configurados</p>
            <p className="text-xs mt-1">Crea horarios para tus proyectos.</p>
          </div>
        ) : (
          pageTemplates.map((t) => {
            const project = projects.find(p => p.id === t.projectId);
            const c = SHIFT_LABELS[t.shiftType] || SHIFT_LABELS["REGULAR"];
            const Icon = c.icon;
            const timeStr = t.shiftType === "FLEXIBLE" 
              ? "Varios horarios"
              : t.shiftType?.startsWith("ROTATING")
                ? `${t.rotationShiftStartTime?.substring(0, 5) || "08:00"} - ${t.rotationShiftEndTime?.substring(0, 5) || "17:00"}`
                : `${t.workStartTime?.substring(0, 5) || "08:00"} - ${t.workEndTime?.substring(0, 5) || "17:00"}`;

            return (
              <div key={t.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                {/* Header tarjeta */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-base text-foreground truncate">{t.name}</h4>
                    <span className="inline-block bg-purple-950/60 text-purple-300 border border-purple-800/40 text-xs px-2.5 py-0.5 rounded-full mt-1 font-medium">
                      {project?.name || t.projectId || "proyecto testeo"}
                    </span>
                  </div>
                </div>

                {/* Tipo de turno */}
                <div className="bg-background/60 border border-border/60 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                  <span className="text-[11px] font-mono tracking-wider uppercase text-muted-foreground">TIPO DE TURNO</span>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    <span>{c.label}</span>
                  </div>
                </div>

                {/* Horario y Tolerancia */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">HORARIO</span>
                    <span className="text-xs font-mono font-medium text-foreground">{timeStr}</span>
                  </div>
                  <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">TOLERANCIA</span>
                    <span className="text-xs font-medium text-foreground">{t.graceMinutes ?? 10} min</span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-xl border-border bg-background/60 hover:bg-background text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => router.push(`/pm/creacion-horarios?id=${t.id}`)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    className="flex-1 h-11 rounded-xl bg-[#2A1E4A] hover:bg-[#34255C] border border-purple-700/40 text-purple-200 font-medium text-sm flex items-center justify-center gap-2"
                    onClick={() => setPreviewTemplate(t)}
                    disabled={assignedTemplateIds.has(t.id)}
                  >
                    <Users className="w-4 h-4" />
                    {assignedTemplateIds.has(t.id) ? "Asignado" : "Asignar a miembros"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Vista Desktop: Tabla */}
      <div className="hidden md:block">
        <Card className="border-border bg-card rounded-2xl overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-40" />
                <p className="text-sm font-medium text-foreground">No hay horarios configurados</p>
                <p className="text-xs mt-1">Crea horarios para tus proyectos.</p>
              </div>
            ) : (
              <DataTable columns={columns} data={pageTemplates} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Paginación estilo SVG */}
      {filteredTemplates.length > 0 && (
        <div className="flex items-center justify-between pt-2 px-1">
          <span className="text-xs text-muted-foreground">
            {filteredTemplates.length} horario{filteredTemplates.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-border bg-card hover:bg-background"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground font-medium px-1">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-border bg-card hover:bg-background"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modales */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => { if (!open) setPreviewTemplate(null); }}>
        {previewTemplate && (
          <TemplatePreview
            template={previewTemplate}
            projects={projects}
            onAssign={async (id) => {
              try {
                const members = await getProjectMembers(token!, previewTemplate.projectId);
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
          <DialogContent className="max-w-md rounded-2xl bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-xl text-foreground">Sobrescribir Horarios</DialogTitle>
              <DialogDescription>
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto my-4" />
                Se ha detectado que <strong>{pendingAssignment.membersWithSchedule.length}</strong> de los {pendingAssignment.members.length} miembros del proyecto ya tienen un horario personalizado asignado.
                <br /><br />
                ¿Qué deseas hacer?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-4">
              <Button 
                variant="default" 
                className="w-full justify-start text-left bg-primary hover:bg-primary/90"
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
                className="w-full text-muted-foreground hover:text-foreground"
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
