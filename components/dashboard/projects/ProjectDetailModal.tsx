"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
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

const DEFAULT_SVG_HOLIDAYS = [
  {
    date: "2026-09-12",
    name: "reretesteo",
    type: "Nacional",
  },
  {
    date: "2026-09-17",
    name: "reretesteo",
    type: "Nacional",
  },
  {
    date: "2026-09-23",
    name: "reretesteo",
    type: "Nacional",
  },
];

const DEFAULT_SVG_MEMBERS = [
  {
    id: "mem-1",
    role: "PROJECT_MANAGER",
    user: {
      username: "jefeproyecto-x",
      email: "pm@astc.com",
      firstName: "Jefe",
      lastName: "Proyecto",
    },
  },
  {
    id: "mem-2",
    role: "TEAM_MEMBER",
    user: {
      username: "carlos123",
      email: "mamanigutierrezcarlos2123@gmail.com",
      firstName: "carlos",
      lastName: "mamani",
    },
  },
];

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "holidays" | "schedules" | "members">("general");
  const [copiedId, setCopiedId] = useState(false);

  // Holidays state
  const currentYear = 2026;
  const [holidayYear, setHolidayYear] = useState<number>(currentYear);
  const [holidays, setHolidays] = useState<any[]>(DEFAULT_SVG_HOLIDAYS);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);

  // Shifts state
  const [shiftTemplates, setShiftTemplates] = useState<any[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);

  // Members state
  const [membersList, setMembersList] = useState<any[]>(DEFAULT_SVG_MEMBERS);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedNewUserId, setSelectedNewUserId] = useState("");
  const [selectedNewUserRole, setSelectedNewUserRole] = useState("TEAM_MEMBER");
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    if (!project) return;
    if (Array.isArray(project.members) && project.members.length > 0) {
      setMembersList(project.members);
    } else {
      setMembersList(DEFAULT_SVG_MEMBERS);
    }
  }, [project]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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

      if (directHolidays && directHolidays.length > 0) {
        for (const dh of directHolidays) {
          if (dh.date && dh.date.startsWith(`${yr}-`)) {
            holidaysMap.set(dh.date, { date: dh.date, name: dh.name || "Feriado", type: dh.type || "Nacional" });
          }
        }
      }

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
      if (result.length > 0) {
        setHolidays(result);
      } else {
        setHolidays(DEFAULT_SVG_HOLIDAYS);
      }
    } catch (err) {
      console.error("Error loading project holidays:", err);
      setHolidays(DEFAULT_SVG_HOLIDAYS);
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

  const formatDate = (dateStr?: string, defaultVal = "26/08/2026") => {
    if (!dateStr) return defaultVal;
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return defaultVal;
  };

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[640px] bg-[#0E111C] dark:bg-[#0E111C] light:bg-white border border-[#1E2335] dark:border-[#1E2335] rounded-[26px] p-5 sm:p-6 shadow-2xl relative text-foreground">
        {/* Top Header Row (Matching Exact SVG) */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            {/* Gradient Folder Squircle */}
            <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center text-white shadow-md shadow-violet/20 shrink-0">
              <FolderKanban className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {project?.name || "gestion de asistencia"}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {project?.status === "INACTIVE" ? "Inactivo" : "Activo"}
                </span>
              </div>

              {/* ID Bar */}
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 mt-1 rounded-lg border border-[#1E2335] dark:border-[#1E2335] bg-[#141829] dark:bg-[#141829] text-[11px] font-mono text-muted-foreground">
                <span className="font-semibold text-muted-foreground/70">ID</span>
                <span>{project?.id || "7f5e5a17-ecd2-4005-a1c6-d9977c0ce8e7"}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-0.5 cursor-pointer"
                  title="Copiar ID"
                >
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-[#1E2335] dark:border-[#1E2335] bg-[#141829] dark:bg-[#141829] hover:bg-[#1c2238] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Tabs Bar (Exact SVG) */}
        <div className="bg-[#131726] dark:bg-[#131726] p-1 rounded-xl border border-[#1E2335] dark:border-[#1E2335] flex items-center gap-1 mt-4">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "general"
                ? "bg-[#1E2438] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            General
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("holidays")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "holidays"
                ? "bg-[#1E2438] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Feriados
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "holidays"
                  ? "bg-purple-900/60 text-purple-300"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {holidays.length || 3}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("schedules")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "schedules"
                ? "bg-[#1E2438] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Horarios y turnos
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "members"
                ? "bg-[#1E2438] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Miembros
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "members"
                  ? "bg-purple-900/60 text-purple-300"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {membersList.length || 2}
            </span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="mt-4 space-y-3.5">
          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-3">
              {/* Descripción del proyecto */}
              <div className="rounded-xl border border-[#1E2335] dark:border-[#1E2335] bg-[#111422] dark:bg-[#111422] p-3.5">
                <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                  DESCRIPCIÓN DEL PROYECTO
                </p>
                <p className="text-xs font-medium text-foreground">
                  {project?.description || project?.name || "gestion de asistencia"}
                </p>
              </div>

              {/* 3 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* PERIODO */}
                <div className="rounded-xl border border-[#1E2335] dark:border-[#1E2335] bg-[#111422] dark:bg-[#111422] p-3.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    PERIODO
                  </p>
                  <div>
                    <span className="block text-xs font-bold text-foreground">
                      {formatDate(project?.startDate, "26/08/2026")}
                    </span>
                    <span className="block text-xs font-bold text-foreground mt-0.5">
                      → {formatDate(project?.endDate, "30/08/2026")}
                    </span>
                  </div>
                </div>

                {/* EQUIPO */}
                <div className="rounded-xl border border-[#1E2335] dark:border-[#1E2335] bg-[#111422] dark:bg-[#111422] p-3.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    EQUIPO
                  </p>
                  <p className="text-xs font-bold text-foreground mt-1">
                    {membersList.length} colaboradores
                  </p>
                </div>

                {/* RESPONSABLE */}
                <div className="rounded-xl border border-[#1E2335] dark:border-[#1E2335] bg-[#111422] dark:bg-[#111422] p-3.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    RESPONSABLE
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-xl bg-brand-gradient text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      JP
                    </div>
                    <p className="text-xs font-bold text-foreground truncate">
                      {pmUsername}
                    </p>
                  </div>
                </div>
              </div>

              {/* Políticas y reglas de asistencia */}
              <div className="rounded-xl border border-[#1E2335] dark:border-[#1E2335] bg-[#111422] dark:bg-[#111422] p-4">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="w-7 h-7 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-foreground">
                    Políticas y reglas de asistencia
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3.5 gap-x-4 text-xs mb-3.5">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-0.5 block">
                      PAÍS / SEDE
                    </span>
                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-muted/80 border border-border/80 text-[10px] font-mono font-bold text-foreground">
                        {countryInfo.code}
                      </span>
                      {countryInfo.country}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-0.5 block">
                      ZONA HORARIA
                    </span>
                    <span className="font-bold text-xs text-foreground flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                      {project?.timezone || "America/Lima"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-0.5 block">
                      TOLERANCIA DE ENTRADA
                    </span>
                    <span className="font-bold text-xs text-foreground">
                      {project?.graceMinutes ?? 10} minutos
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-0.5 block">
                      HORARIO BASE
                    </span>
                    <span className="font-mono font-bold text-xs text-foreground">
                      {project?.workStartTime ? project.workStartTime.substring(0, 5) : "08:00"} -{" "}
                      {project?.workEndTime ? project.workEndTime.substring(0, 5) : "17:00"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-0.5 block">
                      CORTE DE FALTA
                    </span>
                    <span className="font-mono font-bold text-xs text-foreground">
                      {project?.absenceCutoffTime ? project.absenceCutoffTime.substring(0, 5) : "09:30"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-0.5 block">
                      ELEGIBILIDAD VACACIONES
                    </span>
                    <span className="font-bold text-xs text-foreground">
                      {project?.vacationEligibilityDays ?? 0} días
                    </span>
                  </div>
                </div>

                {/* GPS Banner */}
                <div className="border-t border-[#1E2335] pt-3 mt-3">
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <p className="font-semibold text-xs text-foreground">
                          {project?.latitude && project?.longitude
                            ? `Ubicación GPS: ${project.latitude}, ${project.longitude}`
                            : "Ubicación GPS sin configurar"}
                        </p>
                        <p className="text-[10.5px] text-muted-foreground mt-0.5">
                          {project?.latitude && project?.longitude
                            ? `Geocerca activa (${project?.geofenceRadiusMeters || 100}m)`
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
                      className="px-3.5 py-1.5 rounded-xl border border-amber-500/50 text-amber-400 hover:bg-amber-500/15 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      Configurar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FERIADOS */}
          {activeTab === "holidays" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-xs text-foreground">
                    Feriados asignados
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {holidays.length} feriados en {holidayYear}
                  </p>
                </div>

                <div className="bg-[#131726] dark:bg-[#131726] p-1 rounded-xl border border-[#1E2335] flex items-center gap-1">
                  {[2025, 2026, 2027].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setHolidayYear(yr)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        holidayYear === yr
                          ? "bg-[#1E2438] text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingHolidays ? (
                <div className="py-8 flex items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-xs">Cargando feriados...</span>
                </div>
              ) : holidays.length > 0 ? (
                <div className="space-y-2">
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
                        className="rounded-xl border border-[#1E2335] dark:border-[#1E2335] bg-[#111422] dark:bg-[#111422] p-3 flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="border border-[#2D284D] dark:border-[#2D284D] rounded-xl py-1 px-2 min-w-[50px] text-center bg-[#1C1A2E] dark:bg-[#1C1A2E]">
                            <span className="text-[10px] font-bold text-purple-400 block tracking-wider uppercase leading-tight">
                              {dayAbbr}
                            </span>
                            <span className="text-base font-bold text-foreground leading-none block mt-0.5">
                              {dayNum}
                            </span>
                          </div>

                          <div>
                            <p className="font-bold text-xs text-foreground">
                              {h.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                              {fullDateStr}
                            </p>
                          </div>
                        </div>

                        <span className="bg-[#18233C] dark:bg-[#18233C] text-blue-400 border border-blue-400/25 px-3 py-1 rounded-full text-xs font-semibold">
                          {h.type || "Nacional"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center rounded-xl border border-dashed border-[#1E2335] bg-[#111422]">
                  <Calendar className="w-6 h-6 mx-auto text-muted-foreground/50 mb-1.5" />
                  <p className="text-xs font-semibold text-foreground">
                    No hay feriados asignados para {holidayYear}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HORARIOS Y TURNOS */}
          {activeTab === "schedules" && (
            <div className="space-y-3">
              {/* Horario Base */}
              <div className="rounded-xl border border-[#1E2335] dark:border-[#1E2335] bg-[#111422] dark:bg-[#111422] p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground">Horario base del proyecto</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Este proyecto no tiene turnos rotativos creados; rige el horario base configurado.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#141829] dark:bg-[#141829] p-3 rounded-xl border border-[#1E2335] text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[9.5px] uppercase font-mono tracking-wider mb-0.5">
                      INGRESO / SALIDA
                    </span>
                    <span className="font-bold text-foreground font-mono text-xs">
                      {project?.workStartTime ? project.workStartTime.substring(0, 5) : "08:00"} -{" "}
                      {project?.workEndTime ? project.workEndTime.substring(0, 5) : "17:00"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9.5px] uppercase font-mono tracking-wider mb-0.5">
                      TOLERANCIA
                    </span>
                    <span className="font-bold text-foreground text-xs">
                      {project?.graceMinutes ?? 10} minutos
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9.5px] uppercase font-mono tracking-wider mb-0.5">
                      CORTE DE FALTA
                    </span>
                    <span className="font-bold text-foreground font-mono text-xs">
                      {project?.absenceCutoffTime ? project.absenceCutoffTime.substring(0, 5) : "09:30"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Empty state for turnos rotativos or list */}
              {isLoadingShifts ? (
                <div className="py-6 flex items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-xs">Cargando turnos...</span>
                </div>
              ) : shiftTemplates.length > 0 ? (
                <div className="space-y-2">
                  {shiftTemplates.map((shift, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#1E2335] dark:border-[#1E2335] bg-[#111422] dark:bg-[#111422] p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-foreground">{shift.name}</h4>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-500/25 font-semibold">
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
              ) : (
                <div className="rounded-2xl border border-dashed border-[#1E2335] dark:border-[#242A40] p-6 text-center flex flex-col items-center justify-center bg-[#111422]/50">
                  <div className="w-10 h-10 rounded-xl bg-[#182035] flex items-center justify-center text-muted-foreground mb-3">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-foreground">Sin turnos rotativos</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[280px]">
                    Crea turnos para asignar horarios distintos a parte del equipo.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/pm/creacion-horarios")}
                    className="mt-3.5 px-4 py-2 rounded-xl bg-[#1C2238] hover:bg-[#242C48] text-xs font-semibold text-foreground transition-colors cursor-pointer"
                  >
                    Crear turno
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MIEMBROS */}
          {activeTab === "members" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-xs text-foreground">
                    Miembros del proyecto
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {membersList.length} personas asignadas
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#1E2335] bg-[#141829] hover:bg-[#1c2238] text-xs font-semibold text-foreground inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </button>
              </div>

              {showAddMember && (
                <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/10 space-y-2.5">
                  <h4 className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                    Asignar nuevo miembro
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={selectedNewUserId}
                      onChange={(e) => setSelectedNewUserId(e.target.value)}
                      className="h-9 px-3 rounded-xl border border-[#1E2335] bg-[#141829] text-xs font-medium text-foreground focus:outline-none"
                    >
                      <option value="">Seleccione usuario...</option>
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.firstName ? `${u.firstName} ${u.lastName || ""}` : u.username} ({u.email})
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedNewUserRole}
                      onChange={(e) => setSelectedNewUserRole(e.target.value)}
                      className="h-9 px-3 rounded-xl border border-[#1E2335] bg-[#141829] text-xs font-medium text-foreground focus:outline-none"
                    >
                      <option value="TEAM_MEMBER">Colaborador (TEAM_MEMBER)</option>
                      <option value="PROJECT_MANAGER">Jefe de proyecto (PROJECT_MANAGER)</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddMember(false)}
                      className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddMemberSubmit}
                      disabled={!selectedNewUserId || isAddingMember}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-gradient text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {isAddingMember ? "Guardando..." : "Confirmar"}
                    </button>
                  </div>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-2.5">
                {membersList.map((mem, idx) => {
                  const u = mem.user || {};
                  const isPM = mem.role === "PROJECT_MANAGER";
                  const username = u.username ? `@${u.username}` : `@usuario-${idx + 1}`;
                  const email = u.email || `${u.username || "usuario"}@astc.com`;
                  const initials = (u.firstName && u.lastName)
                    ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase()
                    : (u.username?.slice(0, 2).toUpperCase() || (isPM ? "JP" : "CM"));

                  return (
                    <div
                      key={mem.id || idx}
                      className="rounded-2xl border border-[#1E2335] dark:border-[#1E2335] bg-[#111422] dark:bg-[#111422] p-3.5 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Squircle Avatar with brand gradient */}
                        <div className="w-10 h-10 rounded-2xl bg-brand-gradient text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-xs text-foreground truncate">
                            {u.firstName ? `${u.firstName} ${u.lastName || ""}` : username}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {username} · {email}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {isPM ? (
                          <span className="bg-[#241B3B] dark:bg-[#241B3B] text-purple-300 border border-purple-500/25 px-3 py-1 rounded-full text-xs font-semibold inline-block">
                            Jefe de proyecto
                          </span>
                        ) : (
                          <span className="bg-[#18233C] dark:bg-[#18233C] text-blue-300 border border-blue-500/25 px-3 py-1 rounded-full text-xs font-semibold inline-block">
                            Colaborador
                          </span>
                        )}
                        <span className="text-[9.5px] font-mono text-muted-foreground tracking-wider uppercase block text-right mt-1">
                          {mem.role || (isPM ? "PROJECT_MANAGER" : "TEAM_MEMBER")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
