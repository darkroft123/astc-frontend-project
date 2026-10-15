"use client";
import { useCallback, useEffect, useState } from "react";
import {
  FolderKanban,
  X,
  Copy,
  Check,
  FileText,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  Globe,
  MapPin,
  Loader2,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  getCollectionsForProject,
  getGlobalCollections,
  getAdminSetting,
  listHolidays,
  listShiftTemplates,
  getAllUsers,
  addProjectMember,
} from "@/app/services/project.assistance.service";

interface ProjectDetailModalProps {
  project: any;
  token: string | null;
  onClose: () => void;
  onRefresh?: () => void;
}

function getCountryInfo(timezone: string | null | undefined): { code: string; country: string } {
  const tz = timezone || "America/Lima";
  if (tz.includes("Lima")) return { code: "PE", country: "Perú" };
  if (tz.includes("Bogota")) return { code: "CO", country: "Colombia" };
  if (tz.includes("Mexico")) return { code: "MX", country: "México" };
  if (tz.includes("Santiago")) return { code: "CL", country: "Chile" };
  if (tz.includes("Argentina") || tz.includes("Buenos_Aires")) return { code: "AR", country: "Argentina" };
  if (tz.includes("Sao_Paulo")) return { code: "BR", country: "Brasil" };
  if (tz.includes("Caracas")) return { code: "VE", country: "Venezuela" };
  if (tz.includes("Guayaquil")) return { code: "EC", country: "Ecuador" };
  if (tz.includes("La_Paz")) return { code: "BO", country: "Bolivia" };
  if (tz.includes("Asuncion")) return { code: "PY", country: "Paraguay" };
  if (tz.includes("Montevideo")) return { code: "UY", country: "Uruguay" };
  if (tz.includes("Panama")) return { code: "PA", country: "Panamá" };
  if (tz.includes("Costa_Rica")) return { code: "CR", country: "Costa Rica" };
  if (tz.includes("El_Salvador")) return { code: "SV", country: "El Salvador" };
  if (tz.includes("Guatemala")) return { code: "GT", country: "Guatemala" };
  if (tz.includes("Honduras") || tz.includes("Tegucigalpa")) return { code: "HN", country: "Honduras" };
  if (tz.includes("Managua")) return { code: "NI", country: "Nicaragua" };
  if (tz.includes("Santo_Domingo")) return { code: "DO", country: "Rep. Dominicana" };
  if (tz.includes("Madrid")) return { code: "ES", country: "España" };
  if (tz.includes("New_York") || tz.includes("Chicago") || tz.includes("Los_Angeles") || tz.includes("Denver")) {
    return { code: "US", country: "Estados Unidos" };
  }
  return { code: "GL", country: tz.split("/")[1]?.replace(/_/g, " ") || "Internacional" };
}

export default function ProjectDetailModal({
  project,
  token,
  onClose,
  onRefresh,
}: ProjectDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "holidays" | "schedules" | "members">("general");
  const [copiedId, setCopiedId] = useState(false);

  // Holidays state
  const currentYear = new Date().getFullYear();
  const [holidayYear, setHolidayYear] = useState<number>(currentYear);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);

  // Shifts state
  const [shiftTemplates, setShiftTemplates] = useState<any[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);

  // Members state
  const [membersList, setMembersList] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedNewUserId, setSelectedNewUserId] = useState("");
  const [selectedNewUserRole, setSelectedNewUserRole] = useState("TEAM_MEMBER");
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Normalize members list
  useEffect(() => {
    if (!project) return;
    const members = [...(project.members || [])];
    setMembersList(members);
  }, [project]);

  // Load available users for adding members
  useEffect(() => {
    if (!token || !showAddMember) return;
    getAllUsers(token)
      .then((users) => {
        const nonAdmin = (users || []).filter((u: any) => {
          const role = (u.roleCode || u.roleName || u.role || "").toUpperCase();
          return role !== "ADMIN" && role !== "ROLE_ADMIN" && u.username?.toLowerCase() !== "admin";
        });
        setAllUsers(nonAdmin);
      })
      .catch((err) => console.error("Error loading users:", err));
  }, [token, showAddMember]);

  const fetchHolidays = useCallback(async (yr: number) => {
    if (!token || !project?.id) return;
    setIsLoadingHolidays(true);
    try {
      const [projCols, globalCols, globalAssignedId, directHolidays] = await Promise.all([
        getCollectionsForProject(token, project.id).catch(() => []),
        getGlobalCollections(token).catch(() => []),
        getAdminSetting(token, "GLOBAL_ASSIGNED_COLLECTION_ID").catch(() => null),
        listHolidays(token, project.id, yr).catch(() => []),
      ]);

      const holidaysMap = new Map<string, any>();

      // Direct holidays
      if (directHolidays && directHolidays.length > 0) {
        for (const dh of directHolidays) {
          if (dh.date && dh.date.startsWith(`${yr}-`)) {
            holidaysMap.set(dh.date, { date: dh.date, name: dh.name || "Feriado", type: dh.type || "Nacional" });
          }
        }
      }

      // Project collections
      if (projCols && projCols.length > 0) {
        for (const col of projCols) {
          if (col.items) {
            for (const it of col.items) {
              if (it.date && it.date.startsWith(`${yr}-`)) {
                holidaysMap.set(it.date, {
                  date: it.date,
                  name: it.name,
                  type: col.scope === "GLOBAL" ? "Nacional" : "Proyecto",
                });
              }
            }
          }
        }
      }

      // Fallback to global collections
      if (holidaysMap.size === 0 && globalCols && globalCols.length > 0) {
        const targetGlobalCols = globalAssignedId
          ? globalCols.filter((g: any) => g.id === globalAssignedId)
          : globalCols;
        const colsToUse = targetGlobalCols.length > 0 ? targetGlobalCols : globalCols;
        for (const col of colsToUse) {
          if (col.items) {
            for (const it of col.items) {
              if (it.date && it.date.startsWith(`${yr}-`)) {
                holidaysMap.set(it.date, { date: it.date, name: it.name, type: "Nacional" });
              }
            }
          }
        }
      }

      const result = Array.from(holidaysMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      setHolidays(result);
    } catch (err) {
      console.error("Error loading project holidays:", err);
      setHolidays([]);
    } finally {
      setIsLoadingHolidays(false);
    }
  }, [token, project?.id]);

  const fetchShifts = useCallback(async () => {
    if (!token || !project?.id) return;
    setIsLoadingShifts(true);
    try {
      const data = await listShiftTemplates(token, project.id);
      setShiftTemplates(data || []);
    } catch (err) {
      console.error("Error loading project shifts:", err);
      setShiftTemplates([]);
    } finally {
      setIsLoadingShifts(false);
    }
  }, [token, project?.id]);

  useEffect(() => {
    if (activeTab === "holidays") {
      fetchHolidays(holidayYear);
    } else if (activeTab === "schedules") {
      fetchShifts();
    }
  }, [activeTab, holidayYear, fetchHolidays, fetchShifts]);

  const handleCopyId = () => {
    if (project?.id) {
      navigator.clipboard.writeText(project.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleAddMemberSubmit = async () => {
    if (!token || !project?.id || !selectedNewUserId) return;
    setIsAddingMember(true);
    try {
      await addProjectMember(token, project.id, selectedNewUserId, selectedNewUserRole);
      const newUser = allUsers.find((u) => u.id === selectedNewUserId);
      const newMember = {
        id: `mem-${Date.now()}`,
        userId: selectedNewUserId,
        role: selectedNewUserRole,
        user: newUser,
      };
      setMembersList((prev) => [...prev, newMember]);
      setShowAddMember(false);
      setSelectedNewUserId("");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error adding project member:", err);
      alert("Error al agregar miembro al proyecto.");
    } finally {
      setIsAddingMember(false);
    }
  };

  const responsibleMember =
    membersList.find((m: any) => m.role === "PROJECT_MANAGER") || membersList[0];
  const respUser = responsibleMember?.user;
  const pmUsername = respUser?.username ? `@${respUser.username}` : "@jefeproyecto-x";

  const countryInfo = getCountryInfo(project?.timezone);

  const formatDateRange = () => {
    const start = project?.startDate
      ? new Date(project.startDate + "T12:00:00").toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "26/08/2026";
    const end = project?.endDate
      ? new Date(project.endDate + "T12:00:00").toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "30/08/2026";
    return `${start} → ${end}`;
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        style={{ transform: "translate(-50%, -50%)" }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-3xl w-full max-h-[88vh] flex flex-col p-6 sm:p-7 rounded-[28px] border-border/80 bg-card shadow-2xl overflow-hidden z-50"
      >
        <DialogTitle className="sr-only">Detalles del Proyecto</DialogTitle>

        {/* Top subtle ambient glow */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-500/5 to-transparent pointer-events-none rounded-t-[28px]" />

        {/* Header Row */}
        <div className="relative flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            {/* Glowing squircle icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#d946ef] p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0 text-white">
              <FolderKanban className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {project?.name || "gestion de asistencia"}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {project?.status === "INACTIVE" ? "Inactivo" : "Activo"}
                </span>
              </div>

              {/* ID Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 mt-1.5 rounded-xl border border-border/80 dark:border-border/60 bg-muted/40 dark:bg-white/[0.03] text-xs font-mono text-muted-foreground">
                <span className="font-semibold text-muted-foreground/70">ID</span>
                <span>{project?.id}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                  title="Copiar ID"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-border/80 dark:border-border/60 bg-card hover:bg-muted/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Tabs Bar */}
        <div className="bg-muted/40 dark:bg-white/[0.04] p-1.5 rounded-2xl border border-border/60 flex items-center gap-1.5 mt-6 shrink-0">
          {/* Tab 1: General */}
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "general"
                ? "bg-white dark:bg-white/10 text-foreground dark:text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            General
          </button>

          {/* Tab 2: Feriados */}
          <button
            type="button"
            onClick={() => setActiveTab("holidays")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "holidays"
                ? "bg-white dark:bg-white/10 text-foreground dark:text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Feriados
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === "holidays"
                  ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {holidays.length || 3}
            </span>
          </button>

          {/* Tab 3: Horarios y turnos */}
          <button
            type="button"
            onClick={() => setActiveTab("schedules")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "schedules"
                ? "bg-white dark:bg-white/10 text-foreground dark:text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Horarios y turnos
          </button>

          {/* Tab 4: Miembros */}
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "members"
                ? "bg-white dark:bg-white/10 text-foreground dark:text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Miembros
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === "members"
                  ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {membersList.length}
            </span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="mt-6 space-y-4 overflow-y-auto flex-1 pr-1">

          {/* ===================== TAB 1: GENERAL ===================== */}
          {activeTab === "general" && (
            <div className="space-y-4">
              {/* Card 1: Descripción */}
              <div className="rounded-2xl border border-border/70 dark:border-border/60 bg-card/60 p-4 shadow-2xs">
                <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                  DESCRIPCIÓN DEL PROYECTO
                </p>
                <p className="text-sm font-medium text-foreground">
                  {project?.description || project?.name || "gestion de asistencia"}
                </p>
              </div>

              {/* Card 2: Grid 3 cols */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Periodo */}
                <div className="rounded-2xl border border-border/70 dark:border-border/60 bg-card/60 p-4 shadow-2xs">
                  <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                    <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    PERIODO
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {formatDateRange()}
                  </p>
                </div>

                {/* Equipo */}
                <div className="rounded-2xl border border-border/70 dark:border-border/60 bg-card/60 p-4 shadow-2xs">
                  <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                    <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    EQUIPO
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {membersList.length} colaboradores
                  </p>
                </div>

                {/* Responsable */}
                <div className="rounded-2xl border border-border/70 dark:border-border/60 bg-card/60 p-4 shadow-2xs">
                  <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    RESPONSABLE
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      JP
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {pmUsername}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Políticas y reglas de asistencia */}
              <div className="rounded-2xl border border-border/70 dark:border-border/60 bg-card/60 p-5 shadow-2xs">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-foreground">
                    Políticas y reglas de asistencia
                  </h3>
                </div>

                {/* Grid 6 properties */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-5 gap-x-6 text-sm mb-5">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1 block">
                      PAÍS / SEDE
                    </span>
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-muted border border-border text-[11px] font-mono font-bold text-foreground">
                        {countryInfo.code}
                      </span>
                      {countryInfo.country}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1 block">
                      ZONA HORARIA
                    </span>
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      {project?.timezone || "America/Lima"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1 block">
                      TOLERANCIA DE ENTRADA
                    </span>
                    <span className="font-bold text-sm text-foreground">
                      {project?.graceMinutes ?? 10} minutos
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1 block">
                      HORARIO BASE
                    </span>
                    <span className="font-mono font-bold text-sm text-foreground">
                      {project?.workStartTime ? project.workStartTime.substring(0, 5) : "08:00"} -{" "}
                      {project?.workEndTime ? project.workEndTime.substring(0, 5) : "17:00"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1 block">
                      CORTE DE FALTA
                    </span>
                    <span className="font-mono font-bold text-sm text-foreground">
                      {project?.absenceCutoffTime ? project.absenceCutoffTime.substring(0, 5) : "09:30"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1 block">
                      ELEGIBILIDAD VACACIONES
                    </span>
                    <span className="font-bold text-sm text-foreground">
                      {project?.vacationEligibilityDays ?? 0} días
                    </span>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4">
                  {/* GPS Status Banner */}
                  <div className="rounded-xl border border-amber-300/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {project?.latitude && project?.longitude
                            ? `Ubicación GPS: ${project.latitude}, ${project.longitude}`
                            : "Ubicación GPS sin configurar"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {project?.latitude && project?.longitude
                            ? `Geocerca activa con radio de ${project?.geofenceRadiusMeters || 100} metros.`
                            : "Sin coordenadas, la geocerca no valida los marcajes."}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (project?.latitude && project?.longitude) {
                          window.open(
                            `https://www.google.com/maps?q=${project.latitude},${project.longitude}`,
                            "_blank"
                          );
                        } else {
                          alert("Para configurar la geocerca, edita la configuración del proyecto.");
                        }
                      }}
                      className="px-4 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100/50 dark:hover:bg-amber-950/40 text-xs font-semibold transition-colors"
                    >
                      Configurar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 2: FERIADOS ===================== */}
          {activeTab === "holidays" && (
            <div className="space-y-4">
              {/* Header row */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    Feriados asignados
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {holidays.length} feriados en {holidayYear}
                  </p>
                </div>

                {/* Year Selector */}
                <div className="bg-muted/40 dark:bg-white/[0.04] p-1 rounded-xl border border-border/60 flex items-center gap-1">
                  {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setHolidayYear(yr)}
                      className={`px-3 py-1 rounded-lg text-xs transition-all ${
                        holidayYear === yr
                          ? "bg-white dark:bg-white/10 text-foreground font-bold shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Holidays List */}
              {isLoadingHolidays ? (
                <div className="py-12 flex items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  <span className="text-xs">Cargando feriados asignados...</span>
                </div>
              ) : holidays.length > 0 ? (
                <div className="space-y-3">
                  {holidays.map((h, idx) => {
                    const d = new Date(h.date + "T12:00:00");
                    const dayAbbr = d
                      .toLocaleDateString("es-PE", { weekday: "short" })
                      .replace(".", "")
                      .toUpperCase();
                    const dayNum = d.getDate();
                    const fullDateStr = d.toLocaleDateString("es-PE", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    });

                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-border/70 dark:border-border/60 bg-card/60 p-3.5 flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center gap-3.5">
                          {/* Date box */}
                          <div className="border border-border/80 dark:border-border/60 rounded-xl p-2 min-w-[54px] text-center bg-muted/20">
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block tracking-wider uppercase">
                              {dayAbbr}
                            </span>
                            <span className="text-lg font-bold text-foreground leading-none block mt-0.5">
                              {dayNum}
                            </span>
                          </div>

                          <div>
                            <p className="font-bold text-sm text-foreground">
                              {h.name}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize mt-0.5">
                              {fullDateStr}
                            </p>
                          </div>
                        </div>

                        {/* Pill badge */}
                        <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40 px-3 py-1 rounded-full text-xs font-semibold">
                          {h.type || "Nacional"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
                  <Calendar className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    No hay feriados asignados para el año {holidayYear}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No se han vinculado colecciones de feriados en este periodo.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 3: HORARIOS Y TURNOS ===================== */}
          {activeTab === "schedules" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    Horarios y turnos de trabajo
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Horario base configurado y plantillas de turnos vinculadas al proyecto.
                  </p>
                </div>
              </div>

              {/* Base Schedule Card */}
              <div className="rounded-2xl border border-border/70 dark:border-border/60 bg-card/60 p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-bold text-sm text-foreground">Horario Base del Proyecto</h4>
                  <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 font-semibold">
                    Predeterminado
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/30 p-3 rounded-xl border border-border/60 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-mono tracking-wider">
                      Jornada
                    </span>
                    <span className="font-bold text-foreground font-mono text-xs mt-0.5 block">
                      {project?.workStartTime ? project.workStartTime.substring(0, 5) : "08:00"} -{" "}
                      {project?.workEndTime ? project.workEndTime.substring(0, 5) : "17:00"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-mono tracking-wider">
                      Tolerancia
                    </span>
                    <span className="font-bold text-foreground text-xs mt-0.5 block">
                      {project?.graceMinutes ?? 10} minutos
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-mono tracking-wider">
                      Corte de falta
                    </span>
                    <span className="font-bold text-foreground font-mono text-xs mt-0.5 block">
                      {project?.absenceCutoffTime ? project.absenceCutoffTime.substring(0, 5) : "09:30"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shift Templates List */}
              {isLoadingShifts ? (
                <div className="py-8 flex items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-xs">Cargando turnos...</span>
                </div>
              ) : shiftTemplates.length > 0 ? (
                <div className="space-y-3">
                  {shiftTemplates.map((shift, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border/70 dark:border-border/60 bg-card/60 p-4 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-foreground">{shift.name}</h4>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 font-semibold">
                          {shift.shiftType || "REGULAR"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        Horario: {shift.workStartTime?.substring(0, 5) || "08:00"} -{" "}
                        {shift.workEndTime?.substring(0, 5) || "17:00"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* ===================== TAB 4: MIEMBROS ===================== */}
          {activeTab === "members" && (
            <div className="space-y-4">
              {/* Header row */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    Miembros del proyecto
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {membersList.length} personas asignadas
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="px-4 py-2 rounded-xl border border-border/80 dark:border-border/60 bg-card hover:bg-muted/70 text-xs font-semibold text-foreground inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </button>
              </div>

              {/* Add Member Drawer / Inline Form */}
              {showAddMember && (
                <div className="p-4 rounded-2xl border border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
                  <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                    Asignar nuevo miembro
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Colaborador
                      </label>
                      <select
                        value={selectedNewUserId}
                        onChange={(e) => setSelectedNewUserId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs"
                      >
                        <option value="">Selecciona usuario...</option>
                        {allUsers
                          .filter((u) => !membersList.some((m) => (m.userId || m.id) === u.id))
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.firstName} {u.lastName} (@{u.username})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Rol en el proyecto
                      </label>
                      <select
                        value={selectedNewUserRole}
                        onChange={(e) => setSelectedNewUserRole(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs"
                      >
                        <option value="TEAM_MEMBER">Colaborador</option>
                        <option value="PROJECT_MANAGER">Jefe de proyecto</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddMember(false)}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!selectedNewUserId || isAddingMember}
                      onClick={handleAddMemberSubmit}
                      className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      {isAddingMember ? "Asignando..." : "Asignar"}
                    </button>
                  </div>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-3">
                {membersList.map((m, idx) => {
                  const u = m.user;
                  const isPM = m.role === "PROJECT_MANAGER";
                  const displayName = u
                    ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || `@${u.username}`
                    : `@jefeproyecto-x`;
                  const usernameStr = u?.username ? `@${u.username}` : `@${m.userId || "usuario"}`;
                  const emailStr = u?.email || "pm@astc.com";
                  const initials = getInitials(displayName.replace("@", ""));

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border/70 dark:border-border/60 bg-card/60 p-4 flex items-center justify-between shadow-2xs"
                    >
                      {/* Left: Avatar + Names */}
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-full bg-purple-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                          {initials}
                        </div>

                        <div>
                          <p className="font-bold text-sm text-foreground">
                            {displayName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {usernameStr} · {emailStr}
                          </p>
                        </div>
                      </div>

                      {/* Right: Role Badges */}
                      <div className="text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${
                            isPM
                              ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                              : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {isPM ? "Jefe de proyecto" : "Colaborador"}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mt-1">
                          {isPM ? "PROJECT_MANAGER" : "TEAM_MEMBER"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
