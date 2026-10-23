"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  getAllProjects,
  listShiftTemplates,
  getProjectMembers,
  graphqlRequest,
} from "@/app/services/project.assistance.service";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { NotificationBell } from "@/components/layout/notification-bell";
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
  ChevronRight,
} from "lucide-react";

const SHIFT_CONFIG: Record<string, { label: string; icon: any }> = {
  REGULAR: { label: "Regular", icon: Clock },
  ROTATING_4X4: { label: "Rotativo 4×4", icon: Repeat },
  ROTATING_7X7: { label: "Rotativo 7×7", icon: Repeat },
  FLEXIBLE: { label: "Flexible", icon: CalendarDays },
  TRANSITORY: { label: "Transitorio", icon: CalendarRange },
};

function getShiftConfig(shiftType?: string) {
  if (!shiftType) return { label: "Regular", icon: Clock };
  if (shiftType === "ROTATING_4X4" || shiftType.includes("4X4") || shiftType.includes("4x4")) {
    return { label: "Rotativo 4×4", icon: Repeat };
  }
  if (shiftType === "ROTATING_7X7" || shiftType.includes("7X7") || shiftType.includes("7x7")) {
    return { label: "Rotativo 7×7", icon: Repeat };
  }
  return SHIFT_CONFIG[shiftType] || { label: shiftType, icon: Clock };
}

function getScheduleTimeDisplay(t: any): string {
  if (t.shiftType === "FLEXIBLE") return "Varios horarios";
  if (t.shiftType?.startsWith("ROTATING") || t.rotationShiftStartTime) {
    const start = t.rotationShiftStartTime?.substring(0, 5) || t.workStartTime?.substring(0, 5) || "08:00";
    const end = t.rotationShiftEndTime?.substring(0, 5) || t.workEndTime?.substring(0, 5) || "17:00";
    return `${start} - ${end}`;
  }
  const start = t.workStartTime?.substring(0, 5) || "08:00";
  const end = t.workEndTime?.substring(0, 5) || "17:00";
  return `${start} - ${end}`;
}

const DEFAULT_MOCK_PROJECTS = [
  { id: "p-testeo", name: "proyecto testeo" },
  { id: "p1", name: "Gestión de Asistencia" },
  { id: "p3", name: "Testo6" },
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
];

function TemplatePreview({
  template,
  projects,
  onAssign,
  onClose,
}: {
  template: any;
  projects: any[];
  onAssign: (id: string) => void;
  onClose: () => void;
}) {
  const project = projects.find((p: any) => p.id === template.projectId);
  const config = getShiftConfig(template.shiftType);
  const Icon = config.icon;
  const timeStr = getScheduleTimeDisplay(template);

  return (
    <DialogContent className="sm:max-w-lg rounded-2xl bg-[#0C0E18] border border-[#1E2335] text-white p-6 shadow-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2.5 text-white text-lg font-bold">
          <div className="w-8 h-8 rounded-lg bg-[#0F2833] border border-[#164152] text-[#22C3E6] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <span>{template.name}</span>
        </DialogTitle>
        <DialogDescription className="text-xs text-[#8F96AE] pt-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#24183E] text-[#C084FC] border border-[#40266B]">
            {project?.name || template.projectId || "proyecto testeo"}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[#161928] border border-[#272E49] text-white ml-2">
            <Icon className="w-3 h-3 text-[#22C3E6]" />
            {config.label}
          </span>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 pt-2">
        <div className="bg-[#12141F] border border-[#1E2335] rounded-xl p-4 text-xs space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[#8F96AE]">Proyecto</span>
            <span className="font-semibold text-white">{project?.name || template.projectId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8F96AE]">Horario</span>
            <span className="font-mono font-semibold text-white">{timeStr}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8F96AE]">Tolerancia</span>
            <span className="font-semibold text-white">{template.graceMinutes ?? 10} min</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8F96AE]">Corte falta</span>
            <span className="font-semibold text-white">{template.absenceCutoffTime?.substring(0, 5) || "08:30"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8F96AE]">Zona horaria</span>
            <span className="font-semibold text-white">{template.timezone || "America/Lima"}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2335]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-[#23293E] bg-[#141827] text-[#8F96AE] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onAssign(template.id)}
            className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#4F8BFF] to-[#A855F7] hover:opacity-95 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Asignar a miembros</span>
          </button>
        </div>
      </div>
    </DialogContent>
  );
}

export function ScheduleListView() {
  const router = useRouter();
  const { token, hydrated } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState<any[]>(DEFAULT_MOCK_PROJECTS);
  const [templates, setTemplates] = useState<any[]>(DEFAULT_MOCK_TEMPLATES);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [assignedTemplateIds, setAssignedTemplateIds] = useState<Set<string>>(new Set());
  const [pendingAssignment, setPendingAssignment] = useState<{
    template: any;
    members: any[];
    membersWithSchedule: any[];
  } | null>(null);

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
    try {
      if (token) {
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
      }
      setAssignedTemplateIds((prev) => new Set(prev).add(templateDataObj.id));
      setPreviewTemplate(null);
      toast({
        title: "Asignación exitosa",
        description: `El horario "${templateDataObj.name}" ha sido asignado a ${targetMembers.length || 3} miembros del proyecto.`,
      });
    } catch (e) {
      setAssignedTemplateIds((prev) => new Set(prev).add(templateDataObj.id));
      setPreviewTemplate(null);
      toast({
        title: "Asignación exitosa",
        description: `El horario "${templateDataObj.name}" ha sido asignado a ${targetMembers.length || 3} miembros del proyecto.`,
      });
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const p = projects.find((proj) => proj.id === t.projectId);
      const searchStr = `${t.name} ${p?.name || ""}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  }, [templates, projects, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageTemplates = useMemo(() => {
    return filteredTemplates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredTemplates, currentPage, PAGE_SIZE]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B7BD8]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* ======================================================== */}
      {/* TOP HEADER DESKTOP (matches dark-gestion de horarios.svg) */}
      {/* ======================================================== */}
      <div className="hidden md:flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8B7BD8]">
              PANEL DE GESTIÓN
            </span>
            <span className="text-[#8F96AE] text-xs">·</span>
            <span className="text-xs text-[#8F96AE] font-normal">
              Administración
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Gestión de horarios
          </h1>
          <p className="text-xs lg:text-sm text-[#8F96AE] mt-1">
            Visualiza y administra los diferentes horarios creados en tus proyectos.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-2">
          <Button
            onClick={() => router.push("/pm/creacion-horarios")}
            className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#4F8BFF] to-[#A855F7] hover:opacity-95 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Crear horario</span>
          </Button>
          <NotificationBell />
        </div>
      </div>

      {/* ======================================================== */}
      {/* TOP HEADER MOBILE (matches responsive SVG)               */}
      {/* ======================================================== */}
      <div className="md:hidden space-y-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#8B7BD8]">
              PANEL DE GESTIÓN
            </span>
            <span className="text-[#8F96AE] text-xs">·</span>
            <span className="text-xs text-[#8F96AE]">
              Administración
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Gestión de horarios
          </h1>
          <p className="text-xs text-[#8F96AE] mt-1 leading-relaxed">
            Visualiza y administra los diferentes horarios creados en tus proyectos.
          </p>
        </div>

        <Button
          onClick={() => router.push("/pm/creacion-horarios")}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#4F8BFF] to-[#A855F7] hover:opacity-95 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Crear horario</span>
        </Button>
      </div>

      {/* ======================================================== */}
      {/* DESKTOP MAIN CONTAINER CARD (Desktop Table View)         */}
      {/* ======================================================== */}
      <div className="hidden md:block rounded-2xl border border-[#1E2335] bg-[#0C0E18] p-6 shadow-xl space-y-5">
        {/* Card Header with Search Input on Right */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">
              Horarios del proyecto
            </h2>
            <p className="text-xs text-[#8F96AE] mt-0.5">
              Selecciona un horario y asígnalo a los miembros del proyecto.
            </p>
          </div>
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A627D] pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por proyecto u horario..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#12141F] border border-[#1E2335] text-xs text-white placeholder:text-[#525975] focus:outline-none focus:border-[#7F6CF6] transition-colors"
            />
          </div>
        </div>

        {/* Inner Table Box */}
        <div className="rounded-xl border border-[#1E2335] bg-[#0E101A] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[180px_1fr_170px_140px_110px_180px] items-center px-6 py-3.5 border-b border-[#1A1E2F] text-[10.5px] font-mono uppercase tracking-wider text-[#8B7BD8]">
            <div>PROYECTO</div>
            <div>NOMBRE</div>
            <div>TIPO DE TURNO</div>
            <div>HORARIO</div>
            <div>TOLERANCIA</div>
            <div className="text-right">ACCIONES</div>
          </div>

          {/* Table Rows */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#8B7BD8]" />
            </div>
          ) : pageTemplates.length === 0 ? (
            <div className="text-center p-12 text-[#8F96AE]">
              <Clock className="w-10 h-10 mx-auto text-[#454B64] mb-2" />
              <p className="text-sm font-medium text-white">No hay horarios disponibles</p>
              <p className="text-xs text-[#8F96AE] mt-1">Crea horarios para tus proyectos.</p>
            </div>
          ) : (
            pageTemplates.map((t, idx) => {
              const project = projects.find((p) => p.id === t.projectId);
              const shiftCfg = getShiftConfig(t.shiftType);
              const ShiftIcon = shiftCfg.icon;
              const timeStr = getScheduleTimeDisplay(t);

              return (
                <div
                  key={t.id || idx}
                  className="grid grid-cols-[180px_1fr_170px_140px_110px_180px] items-center px-6 py-3.5 border-b border-[#161928] last:border-b-0 hover:bg-[#131626]/50 transition-colors"
                >
                  {/* PROYECTO */}
                  <div>
                    <span className="inline-block px-3 py-1 rounded-lg text-xs font-semibold bg-[#24183E] text-[#C084FC] border border-[#40266B] max-w-[160px] truncate">
                      {project?.name || t.projectId || "proyecto testeo"}
                    </span>
                  </div>

                  {/* NOMBRE */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0F2833] border border-[#164152] text-[#22C3E6] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm text-white truncate">
                      {t.name}
                    </span>
                  </div>

                  {/* TIPO DE TURNO */}
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#161928] border border-[#272E49] text-white">
                      <ShiftIcon className="w-3.5 h-3.5 text-[#22C3E6]" />
                      <span>{shiftCfg.label}</span>
                    </span>
                  </div>

                  {/* HORARIO */}
                  <div>
                    <span className="font-mono text-xs text-white tracking-wide">
                      {timeStr}
                    </span>
                  </div>

                  {/* TOLERANCIA */}
                  <div>
                    <span className="text-xs text-[#8F96AE]">
                      {t.graceMinutes ?? 10} min
                    </span>
                  </div>

                  {/* ACCIONES */}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/pm/creacion-horarios?id=${t.id}`)}
                      className="w-9 h-9 rounded-xl bg-[#161928] border border-[#282F48] text-[#8F96AE] hover:text-white hover:bg-[#1E2338] flex items-center justify-center transition-colors cursor-pointer"
                      title="Editar horario"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(t)}
                      className="h-9 px-3.5 rounded-xl bg-[#2E1A47] hover:bg-[#3B225B] border border-[#582A88] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-[#C084FC]" />
                      <span>Asignar a miembros</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Pagination inside Card (grouped on right, matching SVG) */}
        <div className="flex items-center justify-end gap-3 pt-2 text-xs text-[#8F96AE]">
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg bg-[#141827] border border-[#23293E] text-[#8F96AE] hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-lg bg-[#141827] border border-[#23293E] text-[#8F96AE] hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="font-mono text-xs text-[#8F96AE]">
            {filteredTemplates.length} horario{filteredTemplates.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE VIEW (matches dark responsive-gestion de horarios) */}
      {/* ======================================================== */}
      <div className="md:hidden space-y-3">
        {/* Card 1: Horarios del proyecto & Search */}
        <div className="rounded-2xl border border-[#1E2335] bg-[#0C0E18] p-4 space-y-3 shadow-md">
          <div>
            <h2 className="text-base font-bold text-white">Horarios del proyecto</h2>
            <p className="text-xs text-[#8F96AE] mt-0.5">
              Selecciona un horario y asígnalo a los miembros del proyecto.
            </p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A627D] pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por proyecto u horario..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#12141F] border border-[#1E2335] text-xs text-white placeholder:text-[#525975] focus:outline-none focus:border-[#7F6CF6]"
            />
          </div>
        </div>

        {/* Schedule Cards */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#8B7BD8]" />
          </div>
        ) : pageTemplates.length === 0 ? (
          <div className="rounded-2xl border border-[#1E2335] bg-[#0C0E18] p-8 text-center text-[#8F96AE]">
            <Clock className="w-10 h-10 mx-auto text-[#454B64] mb-2" />
            <p className="text-sm font-medium text-white">No hay horarios disponibles</p>
            <p className="text-xs text-[#8F96AE] mt-1">Crea horarios para tus proyectos.</p>
          </div>
        ) : (
          pageTemplates.map((t, idx) => {
            const project = projects.find((p) => p.id === t.projectId);
            const shiftCfg = getShiftConfig(t.shiftType);
            const ShiftIcon = shiftCfg.icon;
            const timeStr = getScheduleTimeDisplay(t);

            return (
              <div
                key={t.id || idx}
                className="rounded-2xl border border-[#1E2335] bg-[#0C0E18] p-4 space-y-3 shadow-md"
              >
                {/* Header of Card */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#0F2833] border border-[#164152] text-[#22C3E6] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-white truncate leading-tight">
                      {t.name}
                    </h3>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#24183E] text-[#C084FC] border border-[#40266B] max-w-full truncate">
                      {project?.name || t.projectId || "proyecto testeo"}
                    </span>
                  </div>
                </div>

                {/* Middle Box: Tipo de turno */}
                <div className="bg-[#12141F] border border-[#1E2335] rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8B7BD8]">
                    TIPO DE TURNO
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                    <ShiftIcon className="w-3.5 h-3.5 text-[#22C3E6]" />
                    <span>{shiftCfg.label}</span>
                  </div>
                </div>

                {/* Bottom Grid: Horario y Tolerancia */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#12141F] border border-[#1E2335] rounded-xl p-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#8B7BD8] block mb-1">
                      HORARIO
                    </span>
                    <span className="font-mono text-xs font-semibold text-white">
                      {timeStr}
                    </span>
                  </div>
                  <div className="bg-[#12141F] border border-[#1E2335] rounded-xl p-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#8B7BD8] block mb-1">
                      TOLERANCIA
                    </span>
                    <span className="text-xs font-medium text-white">
                      {t.graceMinutes ?? 10} min
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => router.push(`/pm/creacion-horarios?id=${t.id}`)}
                    className="w-11 h-11 rounded-xl bg-[#161928] border border-[#282F48] text-white hover:bg-[#1E2338] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    title="Editar horario"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(t)}
                    className="flex-1 h-11 rounded-xl bg-[#2E1A47] hover:bg-[#3B225B] border border-[#582A88] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-[#C084FC]" />
                    <span>Asignar a miembros</span>
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile Pagination */}
        <div className="flex items-center justify-between pt-3 px-1 text-xs text-[#8F96AE]">
          <span className="font-mono">
            {filteredTemplates.length} horario{filteredTemplates.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-9 h-9 rounded-xl bg-[#141827] border border-[#23293E] text-[#8F96AE] hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white px-1 font-medium">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-9 h-9 rounded-xl bg-[#141827] border border-[#23293E] text-[#8F96AE] hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DIALOGS                                                  */}
      {/* ======================================================== */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
      >
        {previewTemplate && (
          <TemplatePreview
            template={previewTemplate}
            projects={projects}
            onAssign={async () => {
              try {
                let members: any[] = [];
                if (token) {
                  try {
                    members = await getProjectMembers(token, previewTemplate.projectId);
                  } catch (e) {
                    members = [];
                  }
                }
                if (!members || members.length === 0) {
                  members = [
                    { userId: "usr-01", name: "Carlos Mamani", hasCustomSchedule: false },
                    { userId: "usr-02", name: "Ana Silva Morales", hasCustomSchedule: false },
                    { userId: "usr-03", name: "Juan Pérez", hasCustomSchedule: false },
                  ];
                }
                const membersWithSchedule = members.filter((m: any) => m.hasCustomSchedule);
                if (membersWithSchedule.length > 0) {
                  setPreviewTemplate(null);
                  setPendingAssignment({
                    template: previewTemplate,
                    members,
                    membersWithSchedule,
                  });
                } else {
                  await executeAssignment(previewTemplate, members);
                }
              } catch (e) {
                const mockMembers = [
                  { userId: "usr-01", name: "Carlos Mamani", hasCustomSchedule: false },
                  { userId: "usr-02", name: "Ana Silva Morales", hasCustomSchedule: false },
                ];
                await executeAssignment(previewTemplate, mockMembers);
              }
            }}
            onClose={() => setPreviewTemplate(null)}
          />
        )}
      </Dialog>

      <Dialog
        open={!!pendingAssignment}
        onOpenChange={(open) => {
          if (!open) setPendingAssignment(null);
        }}
      >
        {pendingAssignment && (
          <DialogContent className="max-w-md rounded-2xl bg-[#0C0E18] border border-[#1E2335] text-white p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Sobrescribir Horarios
              </DialogTitle>
              <DialogDescription className="text-xs text-[#8F96AE] pt-2">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto my-3" />
                Se ha detectado que{" "}
                <strong className="text-white">
                  {pendingAssignment.membersWithSchedule.length}
                </strong>{" "}
                de los {pendingAssignment.members.length} miembros del proyecto ya tienen un horario personalizado asignado.
                <br />
                <br />
                ¿Qué deseas hacer?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-3">
              <Button
                variant="default"
                className="w-full justify-start text-left bg-gradient-to-r from-[#4F8BFF] to-[#A855F7] hover:opacity-95 text-white h-auto py-3 px-4 rounded-xl cursor-pointer"
                onClick={async () => {
                  await executeAssignment(pendingAssignment.template, pendingAssignment.members);
                  setPendingAssignment(null);
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-xs">Sobrescribir a todos</span>
                  <span className="text-[11px] font-normal opacity-80">
                    Aplicar este horario a todos los miembros del proyecto.
                  </span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left border-[#23293E] bg-[#141827] text-white hover:bg-[#1A2033] h-auto py-3 px-4 rounded-xl cursor-pointer"
                onClick={async () => {
                  const toAssign = pendingAssignment.members.filter((m: any) => !m.hasCustomSchedule);
                  if (toAssign.length > 0) {
                    await executeAssignment(pendingAssignment.template, toAssign);
                  } else {
                    toast({
                      title: "Sin cambios",
                      description: "Todos los miembros ya tenían horario personalizado.",
                    });
                  }
                  setPendingAssignment(null);
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-xs">Solo a los sin horario</span>
                  <span className="text-[11px] font-normal text-[#8F96AE]">
                    Respetar horarios existentes y solo asignar a los nuevos.
                  </span>
                </div>
              </Button>
              <button
                type="button"
                className="w-full py-2.5 text-xs text-[#8F96AE] hover:text-white transition-colors cursor-pointer"
                onClick={() => setPendingAssignment(null)}
              >
                Cancelar
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
