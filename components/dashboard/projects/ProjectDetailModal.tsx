"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
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

  useEffect(() => {
    if (!project) return;
    if (Array.isArray(project.members) && project.members.length > 0) {
      setMembersList(project.members);
    } else {
      setMembersList([]);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in-0 duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[640px] max-h-[92vh] overflow-y-auto bg-[#0C0E18] border border-white/[0.09] rounded-[22px] p-5 sm:p-6 shadow-2xl relative text-white">
        {/* Subtle Top Ambient Glow (Matching paint0_linear in SVG) */}
        <div
          className="absolute top-0 left-0 right-0 h-[120px] rounded-t-[22px] pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(124, 58, 237, 0.16) 0%, rgba(124, 58, 237, 0) 100%)",
          }}
        />

        {/* Top Header Row (Matching Exact SVG) */}
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Gradient Folder Squircle (56x56 px, rx=16) */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #5B8CFF 0%, #A855F7 55%, #22C3E6 100%)",
                boxShadow: "0 14px 20px -6px rgba(168, 85, 247, 0.4)",
              }}
            >
              {/* Exact SVG Folder Icon with 3 data bars */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 6.5C3 5.67157 3.67157 5 4.5 5H9L11 7H19.5C20.3284 7 21 7.67157 21 8.5V17.5C21 18.3284 20.3284 19 19.5 19H4.5C3.67157 19 3 18.3284 3 17.5V6.5Z"
                  stroke="white"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M8.5 11.5V15" stroke="white" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 10.5V15" stroke="white" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15.5 12.5V15" stroke="white" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-white truncate">
                  {project?.name || "gestion de asistencia"}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#34D399]/14 text-[#6EE7B7]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                  {project?.status === "INACTIVE" ? "Inactivo" : "Activo"}
                </span>
              </div>

              {/* ID Bar */}
              <div className="inline-flex items-center gap-2 px-3 py-1 mt-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-xs font-mono text-[#8F96AE]">
                <span className="font-semibold text-white/60">ID</span>
                <span className="truncate max-w-[200px] sm:max-w-none">
                  {project?.id || "7f5e5a17-ecd2-4005-a1c6-d9977c0ce8e7"}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-[#8F96AE] hover:text-white transition-colors ml-0.5 cursor-pointer"
                  title="Copiar ID"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
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
            className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-[#8F96AE] hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Segmented Tabs Bar (Exact SVG layout) */}
        <div className="relative bg-[#0C0E18] p-1.5 rounded-2xl border border-white/[0.09] flex items-center gap-1 mt-4 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "general"
                ? "bg-[#1E2438] text-white shadow-xs border border-white/[0.06]"
                : "text-[#8F96AE] hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("holidays")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "holidays"
                ? "bg-[#1E2438] text-white shadow-xs border border-white/[0.06]"
                : "text-[#8F96AE] hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Feriados</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "holidays"
                  ? "bg-[#342461] text-[#C084FC]"
                  : "bg-[#1D2133] text-[#8F96AE]"
              }`}
            >
              {holidays.length || 3}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("schedules")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "schedules"
                ? "bg-[#1E2438] text-white shadow-xs border border-white/[0.06]"
                : "text-[#8F96AE] hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Horarios y turnos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "members"
                ? "bg-[#1E2438] text-white shadow-xs border border-white/[0.06]"
                : "text-[#8F96AE] hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Miembros</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "members"
                  ? "bg-[#342461] text-[#C084FC]"
                  : "bg-[#1D2133] text-[#8F96AE]"
              }`}
            >
              {membersList.length || 2}
            </span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="relative mt-4 space-y-3.5">
          {/* TAB 1: GENERAL (modal-dark-general.svg) */}
          {activeTab === "general" && (
            <div className="space-y-3">
              {/* Descripción del proyecto */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#101322] p-4.5">
                <p className="text-[10.5px] font-mono uppercase tracking-[0.08em] font-semibold text-[#8B7BD8]">
                  DESCRIPCIÓN DEL PROYECTO
                </p>
                <p className="text-xs font-semibold text-[#EEF0F6] mt-2">
                  {project?.description || project?.name || "gestion de asistencia"}
                </p>
              </div>

              {/* 3 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* PERIODO */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#101322] p-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.08em] font-semibold text-[#8B7BD8] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C084FC]" />
                    PERIODO
                  </p>
                  <div className="mt-2 space-y-0.5">
                    <span className="block text-xs font-bold text-[#EEF0F6]">
                      {formatDate(project?.startDate, "26/08/2026")}
                    </span>
                    <span className="block text-xs font-bold text-[#EEF0F6]">
                      → {formatDate(project?.endDate, "30/08/2026")}
                    </span>
                  </div>
                </div>

                {/* EQUIPO */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#101322] p-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.08em] font-semibold text-[#8B7BD8] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#60A5FA]" />
                    EQUIPO
                  </p>
                  <p className="text-xs font-bold text-[#EEF0F6] mt-2">
                    {membersList.length} trabajadores
                  </p>
                </div>

                {/* RESPONSABLE */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#101322] p-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.08em] font-semibold text-[#8B7BD8] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2DD4BF]" />
                    RESPONSABLE
                  </p>
                  <div className="flex items-center gap-2 mt-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-full text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs"
                      style={{
                        background: "linear-gradient(135deg, #5B8CFF 0%, #A855F7 100%)",
                      }}
                    >
                      JP
                    </div>
                    <p className="text-xs font-bold text-[#EEF0F6] truncate">
                      {pmUsername}
                    </p>
                  </div>
                </div>
              </div>

              {/* Políticas y reglas de asistencia */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#101322] p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-xl bg-[#231B38] border border-[#3E2D66] text-[#C084FC] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-[#EEF0F6]">
                    Políticas y reglas de asistencia
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4 text-xs mb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#8B7BD8] tracking-wider mb-1 block font-semibold">
                      PAÍS / SEDE
                    </span>
                    <span className="font-bold text-xs text-[#EEF0F6] flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-[#181D30] border border-white/10 text-[10px] font-mono font-bold text-white">
                        {countryInfo.code}
                      </span>
                      {countryInfo.country}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#8B7BD8] tracking-wider mb-1 block font-semibold">
                      ZONA HORARIA
                    </span>
                    <span className="font-bold text-xs text-[#EEF0F6] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#8F96AE]" />
                      {project?.timezone || "America/Lima"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#8B7BD8] tracking-wider mb-1 block font-semibold">
                      TOLERANCIA DE ENTRADA
                    </span>
                    <span className="font-bold text-xs text-[#EEF0F6]">
                      {project?.graceMinutes ?? 10} minutos
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#8B7BD8] tracking-wider mb-1 block font-semibold">
                      HORARIO BASE
                    </span>
                    <span className="font-mono font-bold text-xs text-[#EEF0F6]">
                      {project?.workStartTime ? project.workStartTime.substring(0, 5) : "08:00"} -{" "}
                      {project?.workEndTime ? project.workEndTime.substring(0, 5) : "17:00"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#8B7BD8] tracking-wider mb-1 block font-semibold">
                      CORTE DE FALTA
                    </span>
                    <span className="font-mono font-bold text-xs text-[#EEF0F6]">
                      {project?.absenceCutoffTime ? project.absenceCutoffTime.substring(0, 5) : "09:30"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#8B7BD8] tracking-wider mb-1 block font-semibold">
                      ELEGIBILIDAD VACACIONES
                    </span>
                    <span className="font-bold text-xs text-[#EEF0F6]">
                      {project?.vacationEligibilityDays ?? 0} días
                    </span>
                  </div>
                </div>

                {/* Amber Warning Card */}
                <div className="rounded-xl border border-[#483713] bg-[#17140B] p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#FBBF24] shrink-0" />
                    <div>
                      <p className="font-semibold text-xs text-[#EEF0F6]">
                        {project?.latitude && project?.longitude
                          ? `Ubicación GPS: ${project.latitude}, ${project.longitude}`
                          : "Ubicación GPS sin configurar"}
                      </p>
                      <p className="text-[11px] text-[#8F96AE] mt-0.5">
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
                    className="px-4 py-1.5 rounded-lg border border-[#483713] bg-[#221B0E] hover:bg-[#2C2313] text-[#FBBF24] text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    Configurar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FERIADOS (modal-dark-fferiados.svg) */}
          {activeTab === "holidays" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-xs text-[#EEF0F6]">
                    Feriados asignados
                  </h3>
                  <p className="text-[11px] text-[#8F96AE]">
                    {holidays.length} feriados en {holidayYear}
                  </p>
                </div>

                <div className="bg-[#0C0E18] p-1 rounded-xl border border-white/10 flex items-center gap-1">
                  {[2025, 2026, 2027].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setHolidayYear(yr)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        holidayYear === yr
                          ? "bg-[#1E2438] text-white shadow-xs"
                          : "text-[#8F96AE] hover:text-white"
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingHolidays ? (
                <div className="py-8 flex items-center justify-center text-[#8F96AE] gap-2">
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
                        className="rounded-2xl border border-white/[0.08] bg-[#111422] p-3.5 flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          {/* Squircle Date Box matching SVG */}
                          <div className="min-w-[48px] h-[48px] rounded-xl border border-[#342461] bg-[#1D1635] flex flex-col items-center justify-center p-1 shrink-0">
                            <span className="text-[9.5px] font-bold text-[#A855F7] tracking-wider uppercase leading-none">
                              {dayAbbr}
                            </span>
                            <span className="text-base font-bold text-white leading-none mt-1">
                              {dayNum}
                            </span>
                          </div>

                          <div>
                            <p className="font-bold text-xs text-[#EEF0F6]">
                              {h.name}
                            </p>
                            <p className="text-[11px] text-[#8F96AE] capitalize mt-0.5">
                              {fullDateStr}
                            </p>
                          </div>
                        </div>

                        <span className="bg-[#161B30] text-[#8FA3D9] border border-[#232B4D] px-3.5 py-1 rounded-lg text-xs font-semibold">
                          {h.type || "Nacional"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center rounded-2xl border border-dashed border-white/10 bg-[#111422]">
                  <Calendar className="w-6 h-6 mx-auto text-[#8F96AE]/50 mb-1.5" />
                  <p className="text-xs font-semibold text-[#EEF0F6]">
                    No hay feriados asignados para {holidayYear}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HORARIOS Y TURNOS (modal-dark-horarios.svg) */}
          {activeTab === "schedules" && (
            <div className="space-y-3">
              {/* Horario Base */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#111422] p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-[#0F242C] border border-[#164652] text-[#22D3EE] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#EEF0F6]">Horario base del proyecto</h4>
                    <p className="text-[11px] text-[#8F96AE] mt-0.5">
                      Este proyecto no tiene turnos rotativos creados; rige el horario base configurado.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#141829] p-3.5 rounded-xl border border-white/[0.06] text-xs">
                  <div>
                    <span className="text-[#8B7BD8] block text-[9.5px] uppercase font-mono tracking-wider font-semibold mb-1">
                      INGRESO / SALIDA
                    </span>
                    <span className="font-bold text-[#EEF0F6] font-mono text-xs">
                      {project?.workStartTime ? project.workStartTime.substring(0, 5) : "08:00"} -{" "}
                      {project?.workEndTime ? project.workEndTime.substring(0, 5) : "17:00"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8B7BD8] block text-[9.5px] uppercase font-mono tracking-wider font-semibold mb-1">
                      TOLERANCIA
                    </span>
                    <span className="font-bold text-[#EEF0F6] text-xs">
                      {project?.graceMinutes ?? 10} minutos
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8B7BD8] block text-[9.5px] uppercase font-mono tracking-wider font-semibold mb-1">
                      CORTE DE FALTA
                    </span>
                    <span className="font-bold text-[#EEF0F6] font-mono text-xs">
                      {project?.absenceCutoffTime ? project.absenceCutoffTime.substring(0, 5) : "09:30"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Empty state for turnos rotativos or list */}
              {isLoadingShifts ? (
                <div className="py-6 flex items-center justify-center text-[#8F96AE] gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-xs">Cargando turnos...</span>
                </div>
              ) : shiftTemplates.length > 0 ? (
                <div className="space-y-2">
                  {shiftTemplates.map((shift, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/[0.08] bg-[#111422] p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-[#EEF0F6]">{shift.name}</h4>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-500/25 font-semibold">
                          {shift.shiftType || "REGULAR"}
                        </span>
                      </div>
                      <p className="text-xs text-[#8F96AE] font-mono">
                        Horario: {shift.workStartTime?.substring(0, 5) || "08:00"} -{" "}
                        {shift.workEndTime?.substring(0, 5) || "17:00"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#1E2335] p-7 text-center flex flex-col items-center justify-center bg-[#111422]/50">
                  <div className="w-10 h-10 rounded-xl bg-[#141829] border border-white/[0.06] flex items-center justify-center text-[#8F96AE] mb-3">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-[#EEF0F6]">Sin turnos rotativos</h4>
                  <p className="text-[11px] text-[#8F96AE] mt-1 max-w-[280px] leading-relaxed">
                    Crea turnos para asignar horarios distintos a parte del equipo.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/pm/creacion-horarios")}
                    className="mt-4 px-5 py-2 rounded-xl bg-[#181C2E] border border-[#272E49] hover:bg-[#20263E] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Crear turno
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MIEMBROS (modal-dark-miembros.svg) */}
          {activeTab === "members" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-xs text-[#EEF0F6]">
                    Miembros del proyecto
                  </h3>
                  <p className="text-[11px] text-[#8F96AE]">
                    {membersList.length} personas asignadas
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-[#141829] hover:bg-[#1C2238] text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </button>
              </div>

              {showAddMember && (
                <div className="p-4 rounded-2xl border border-purple-500/30 bg-[#1A152E] space-y-3">
                  <h4 className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                    Asignar nuevo miembro
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={selectedNewUserId}
                      onChange={(e) => setSelectedNewUserId(e.target.value)}
                      className="h-9 px-3 rounded-xl border border-white/10 bg-[#141829] text-xs font-medium text-white focus:outline-none"
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
                      className="h-9 px-3 rounded-xl border border-white/10 bg-[#141829] text-xs font-medium text-white focus:outline-none"
                    >
                      <option value="TEAM_MEMBER">Trabajador (TEAM_MEMBER)</option>
                      <option value="PROJECT_MANAGER">Jefe de proyecto (PROJECT_MANAGER)</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddMember(false)}
                      className="px-3 py-1 text-xs text-[#8F96AE] hover:text-white cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddMemberSubmit}
                      disabled={!selectedNewUserId || isAddingMember}
                      className="px-4 py-1.5 rounded-xl bg-brand-gradient text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {isAddingMember ? "Guardando..." : "Confirmar"}
                    </button>
                  </div>
                </div>
              )}

              {/* Members List matching SVG */}
              <div className="space-y-2.5">
                {membersList.map((mem, idx) => {
                  const u = mem.user || {};
                  const isPM = mem.role === "PROJECT_MANAGER";
                  const username = u.username ? `@${u.username}` : (isPM ? "@jefeproyecto-x" : `@usuario-${idx + 1}`);
                  const email = u.email || (isPM ? "pm@astc.com" : `${u.username || "usuario"}@astc.com`);
                  const displayName = u.firstName
                    ? `${u.firstName} ${u.lastName || ""}`.trim()
                    : (isPM ? username : username);

                  const initials = isPM ? "JP" : (idx === 1 ? "CM" : (u.firstName?.[0] || "U") + (u.lastName?.[0] || "S"));

                  return (
                    <div
                      key={mem.id || idx}
                      className="rounded-2xl border border-white/[0.08] bg-[#111422] p-4 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Circular Avatar with gradient matching SVG paint2/paint3_linear */}
                        <div
                          className="w-11 h-11 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
                          style={{
                            background: "linear-gradient(135deg, #5B8CFF 0%, #A855F7 100%)",
                          }}
                        >
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-xs text-[#EEF0F6] truncate">
                            {displayName}
                          </p>
                          <p className="text-[11px] text-[#8F96AE] truncate mt-0.5">
                            {username} · {email}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {isPM ? (
                          <span className="bg-[#241B3B] text-[#C084FC] border border-[#4A2D78] px-3.5 py-1 rounded-lg text-xs font-semibold inline-block">
                            Jefe de proyecto
                          </span>
                        ) : (
                          <span className="bg-[#18233C] text-[#8FA3D9] border border-[#25365E] px-3.5 py-1 rounded-lg text-xs font-semibold inline-block">
                            Trabajador
                          </span>
                        )}
                        <span className="text-[9.5px] font-mono text-[#8B7BD8] tracking-wider uppercase block text-right mt-1 font-semibold">
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
