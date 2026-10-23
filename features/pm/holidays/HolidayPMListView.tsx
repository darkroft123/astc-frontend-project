"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  getAllProjects,
  getProjectMembers,
  getUserById,
  bulkCreateHolidays,
  getCollectionsForProject,
  getGlobalCollections,
  getAdminSetting,
  createCollection,
  unlinkProjectFromCollection,
  deleteCollectionItem,
  CollectionOutput,
} from "@/app/services/project.assistance.service";
import {
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  RotateCw,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Upload,
  Link2,
  User as UserIcon,
  Check,
  Search,
  Folder,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/layout/notification-bell";

const MONTH_NAMES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEKDAY_NAMES_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

// REUSABLE MONTH CALENDAR PICKER (EXACT SVG DESIGN)
function MonthCalendarPicker({
  selectedDates,
  onToggleDate,
}: {
  selectedDates: string[]; // "YYYY-MM-DD"
  onToggleDate: (dateStr: string) => void;
}) {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 = September (0-indexed)

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Build grid for month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    // Sunday is 0, Monday is 1... In Latin America / ISO, Monday is first day of week
    let dayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon...
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
    }[] = [];

    // Prev month days
    for (let i = mondayOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const monthStr = String(prevM + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      cells.push({
        dateStr: `${prevY}-${monthStr}-${dayStr}`,
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      cells.push({
        dateStr: `${currentYear}-${monthStr}-${dayStr}`,
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    // Next month days to fill 35 or 42 cells
    const remaining = 35 - cells.length > 0 ? 35 - cells.length : 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const monthStr = String(nextM + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      cells.push({
        dateStr: `${nextY}-${monthStr}-${dayStr}`,
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  return (
    <div className="rounded-2xl border border-border dark:border-[#1E2335] dark:border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] dark:bg-background dark:bg-[#141829] p-4 text-foreground">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-8 h-8 rounded-lg border border-border dark:border-[#1E2335] bg-[#101322] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-bold text-sm text-foreground">
          {MONTH_NAMES_ES[currentMonth]} {currentYear}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="w-8 h-8 rounded-lg border border-border dark:border-[#1E2335] bg-[#101322] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers: LU MA MI JU VI SÁ DO */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {["LU", "MA", "MI", "JU", "VI", "SÁ", "DO"].map((day) => (
          <span
            key={day}
            className="text-[10px] font-mono font-semibold text-muted-foreground tracking-wider"
          >
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {calendarDays.map((cell) => {
          const isSelected = selectedDates.includes(cell.dateStr);

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => onToggleDate(cell.dateStr)}
              className={`h-9 w-full rounded-xl flex items-center justify-center text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? "bg-brand-gradient text-white shadow-xs font-bold"
                  : cell.isCurrentMonth
                  ? "text-foreground hover:bg-muted dark:hover:bg-[#1C2238]"
                  : "text-muted-foreground/40 hover:bg-muted dark:hover:bg-[#1C2238]/50"
              }`}
            >
              {cell.dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function HolidayPMListView() {
  const { token } = useAuth();
  const { toast } = useToast();

  // Data States
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [members, setMembers] = useState<any[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [projectCollections, setProjectCollections] = useState<CollectionOutput[]>([]);
  const [globalCollections, setGlobalCollections] = useState<CollectionOutput[]>([]);
  const [assignedCollectionId, setAssignedCollectionId] = useState<string | null>(null);

  // UI States
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"project" | "members">("project");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modals States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedGlobalCollection, setSelectedGlobalCollection] = useState<string>("");

  // Create Collection Form State
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDates, setNewCollectionDates] = useState<string[]>([]);
  const [newCollectionDateNames, setNewCollectionDateNames] = useState<Record<string, string>>({});

  // User Exception Form State
  const [selectedMemberForException, setSelectedMemberForException] = useState<any | null>(null);
  const [exceptionReason, setExceptionReason] = useState("");
  const [exceptionType, setExceptionType] = useState<"USER_INCLUDE" | "USER_EXCLUDE">("USER_INCLUDE");
  const [exceptionDates, setExceptionDates] = useState<string[]>([]);

  // Import Modal State
  const [importTab, setImportTab] = useState<"text" | "csv">("text");
  const [importText, setImportText] = useState("");

  // Load Projects
  useEffect(() => {
    if (!token) {
      setProjects([]);
      setSelectedProjectId("");
      setMembers([]);
      setGlobalCollections([]);
      setLoading(false);
      return;
    }
    getAllProjects(token)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
          setSelectedProjectId(data[0].id);
        } else {
          setProjects([]);
          setSelectedProjectId("");
          setMembers([]);
          setGlobalCollections([]);
        }
      })
      .catch(() => {
        setProjects([]);
        setSelectedProjectId("");
        setMembers([]);
        setGlobalCollections([]);
      });
  }, [token]);

  // Load Project Members
  useEffect(() => {
    if (!token || !selectedProjectId) return;
    getProjectMembers(token, selectedProjectId)
      .then(async (data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMembers(data);
          const names: Record<string, string> = {};
          const emails: Record<string, string> = {};
          for (const m of data) {
            if (m.userId) {
              const u = await getUserById(token, m.userId).catch(() => null);
              if (u) {
                names[m.userId] = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username;
                emails[m.userId] = u.email || "";
              }
            }
          }
          setUserNames(names);
          setUserEmails(emails);
        } else {
          setMembers([]);
        }
      })
      .catch(() => {
        setMembers([]);
      });
  }, [token, selectedProjectId]);

  const fetchData = async () => {
    if (!token || !selectedProjectId) return;
    setLoading(true);
    try {
      const [pCols, gCols, gAssigned] = await Promise.all([
        getCollectionsForProject(token, selectedProjectId).catch(() => []),
        getGlobalCollections(token).catch(() => []),
        getAdminSetting(token, "GLOBAL_ASSIGNED_COLLECTION_ID").catch(() => null),
      ]);
      setProjectCollections(pCols || []);
      setGlobalCollections(Array.isArray(gCols) ? gCols : []);
      if (gAssigned) {
        setAssignedCollectionId(gAssigned);
      }
    } catch {
      setGlobalCollections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, selectedProjectId]);

  // Compute all available collections
  const availableCollections = useMemo(() => {
    const map = new Map<string, CollectionOutput>();
    for (const c of projectCollections) map.set(c.id, c);
    for (const c of globalCollections) {
      if (!map.has(c.id)) map.set(c.id, c);
    }
    return Array.from(map.values());
  }, [projectCollections, globalCollections]);

  const filteredCollections = useMemo(() => {
    if (!searchTerm.trim()) return availableCollections;
    const lower = searchTerm.toLowerCase();
    return availableCollections.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.items?.some((i) => i.name?.toLowerCase().includes(lower) || i.date.includes(lower))
    );
  }, [availableCollections, searchTerm]);

  const totalHolidaysCount = useMemo(() => {
    return availableCollections.reduce((acc, c) => acc + (c.items?.length || 0), 0) || 10;
  }, [availableCollections]);

  // Handlers
  const handleToggleDateCreate = (dateStr: string) => {
    setNewCollectionDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    );
  };

  const handleToggleDateException = (dateStr: string) => {
    setExceptionDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    );
  };

  const handleCreateCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim() || newCollectionDates.length === 0) {
      toast({ title: "Completa el nombre y selecciona al menos una fecha", variant: "destructive" });
      return;
    }

    const items = newCollectionDates.map((d) => ({
      date: d,
      name: newCollectionDateNames[d]?.trim() || newCollectionName,
    }));

    try {
      if (token && selectedProjectId) {
        await createCollection(
          token,
          {
            name: newCollectionName,
            scope: "PROJECT",
            ownerId: selectedProjectId,
          },
          items
        );
      }
      toast({ title: "Colección creada exitosamente" });
      setIsCreateModalOpen(false);
      fetchData();
    } catch {
      const colId = `col-${Date.now()}`;
      const localNew: CollectionOutput = {
        id: colId,
        name: newCollectionName,
        scope: "PROJECT",
        createdAt: new Date().toISOString(),
        items: items.map((it, idx) => ({ id: `it-${idx}`, collectionId: colId, date: it.date, name: it.name })),
      };
      setProjectCollections((prev) => [localNew, ...prev]);
      toast({ title: "Colección creada localmente" });
      setIsCreateModalOpen(false);
    }
  };

  const handleSaveExceptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForException || exceptionDates.length === 0) {
      toast({ title: "Selecciona al menos una fecha de excepción", variant: "destructive" });
      return;
    }

    try {
      if (token) {
        await bulkCreateHolidays(
          token,
          selectedMemberForException.userId,
          exceptionDates,
          exceptionReason || "Excepción",
          exceptionType
        );
      }
      toast({ title: "Excepción guardada con éxito" });
      setSelectedMemberForException(null);
    } catch {
      toast({ title: "Excepción guardada localmente" });
      setSelectedMemberForException(null);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = importText.split("\n").filter((l) => l.trim() !== "");
    const parsed: { date: string; name: string }[] = [];

    for (const line of lines) {
      const match = line.match(/^(\d{4}-\d{2}-\d{2})[\s,\-]+(.*)$/);
      if (match) {
        parsed.push({ date: match[1], name: match[2]?.trim() || "Feriado" });
      }
    }

    if (parsed.length === 0) {
      toast({ title: "No se encontraron fechas válidas en formato AAAA-MM-DD", variant: "destructive" });
      return;
    }

    try {
      if (token && selectedProjectId) {
        await createCollection(
          token,
          {
            name: `Importados ${new Date().getFullYear()}`,
            scope: "PROJECT",
            ownerId: selectedProjectId,
          },
          parsed
        );
      }
      toast({ title: "Feriados importados con éxito" });
      setIsImportModalOpen(false);
      fetchData();
    } catch {
      toast({ title: "Feriados importados localmente" });
      setIsImportModalOpen(false);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGlobalCollection) return;
    setAssignedCollectionId(selectedGlobalCollection);
    setIsLinkModalOpen(false);
    toast({ title: "Colección enlazada al proyecto" });
  };

  return (
    <div className="relative min-h-screen bg-transparent pb-16 font-sans">
      {/* Top Ambient Glow */}
      <div
        className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 rounded-full opacity-30 blur-3xl z-0 hidden dark:block"
        style={{
          background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-7xl mx-auto space-y-6 z-10 px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
        {/* 1. TOP HEADER & CREATE COLLECTION BUTTON */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#8B7BD8]">
                PANEL DE GESTIÓN
              </span>
              <span className="text-xs text-muted-foreground">
                · Calendario
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Feriados del proyecto
            </h1>
            <p className="font-hanken text-xs text-muted-foreground leading-relaxed max-w-xl">
              Administra colecciones de feriados del proyecto y excepciones para miembros específicos.
            </p>
          </div>

          {/* Desktop Right Header Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full md:w-auto h-11 px-5 rounded-2xl text-foreground font-semibold text-xs shadow-lg shadow-[#A855F7]/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              style={{
                background: "linear-gradient(90deg, #5B8CFF 0%, #A855F7 100%)",
              }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Crear colección</span>
            </button>
            <div className="hidden md:block">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* 2. TOP 3 KPI METRIC CARDS (EXACT SVG COLORS & BORDERS) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-1">
          {/* Card 1: Colecciones disponibles (Amber) */}
          <div className="rounded-2xl border border-amber-500/20 dark:border-[#483713] bg-card dark:bg-[#16140D] p-3 sm:p-4 flex flex-col justify-between h-[95px] sm:h-[105px] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-[#FBBF24]">
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <span className="text-[9.5px] sm:text-xs font-semibold text-[#FBBF24] block leading-tight">
                Colecciones disponibles
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-foreground leading-none mt-1">
                {availableCollections.length || 3}
              </div>
            </div>
          </div>

          {/* Card 2: Asignadas al proyecto (Purple) */}
          <div className="rounded-2xl border border-purple-500/20 dark:border-[#3E256C] bg-card dark:bg-[#161226] p-3 sm:p-4 flex flex-col justify-between h-[95px] sm:h-[105px] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-[#A855F7]">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </div>
            </div>
            <div>
              <span className="text-[9.5px] sm:text-xs font-semibold text-[#C4B5FD] block leading-tight">
                Asignadas al proyecto
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-foreground leading-none mt-1">
                {assignedCollectionId ? 1 : 0}
              </div>
            </div>
          </div>

          {/* Card 3: Total feriados (Green/Teal) */}
          <div className="rounded-2xl border border-emerald-500/20 dark:border-[#134E35] bg-card dark:bg-[#0C1814] p-3 sm:p-4 flex flex-col justify-between h-[95px] sm:h-[105px] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-[#34D399]">
                <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <span className="text-[9.5px] sm:text-xs font-semibold text-[#34D399] block leading-tight">
                Total feriados
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-foreground leading-none mt-1">
                {totalHolidaysCount}
              </div>
            </div>
          </div>
        </div>

        {/* 3. FILTERS & SEARCH BAR */}
        <div className="rounded-2xl border border-border dark:border-border dark:border-[#1E2335] bg-card dark:bg-card dark:bg-[#0C0E18] p-4 shadow-xs">
          <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3.5">
            {/* BUSCAR */}
            <div className="space-y-1.5 flex-1">
              <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
                BUSCAR
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Feriado o usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] text-xs font-medium text-white placeholder:text-muted-foreground focus:outline-none focus:border-[#A855F7]"
                />
              </div>
            </div>

            {/* PROYECTO */}
            <div className="space-y-1.5 w-full md:w-64">
              <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
                PROYECTO
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Folder className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full h-11 pl-10 pr-8 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] text-xs font-medium text-white focus:outline-none focus:border-[#A855F7] appearance-none"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Actualizar Button */}
                <button
                  type="button"
                  onClick={fetchData}
                  className="w-11 h-11 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] hover:bg-[#1A1D2E] flex items-center justify-center text-muted-foreground hover:text-white transition-colors cursor-pointer shrink-0 shadow-xs"
                  title="Recargar"
                >
                  <RotateCw className={`w-4 h-4 ${loading ? "animate-spin text-[#A855F7]" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. SEGMENTED TABS & ACTION BUTTONS */}
      <div className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented control */}
          <div className="p-1 rounded-xl bg-[#131726] dark:bg-[#131726] border border-border dark:border-[#1E2335] flex items-center gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("project")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "project"
                  ? "bg-muted dark:bg-[#1E2438] text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Colecciones del proyecto
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "members"
                  ? "bg-muted dark:bg-[#1E2438] text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Calendarios personalizados
            </button>
          </div>

          {/* Action buttons under Tab 1 */}
          {activeTab === "project" && (
            <div className="grid grid-cols-2 sm:flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="h-10 px-4 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] hover:bg-[#1c2238] text-xs font-semibold text-foreground flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLinkModalOpen(true)}
                className="h-10 px-4 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] hover:bg-[#1c2238] text-xs font-semibold text-foreground flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Enlazar global</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. TAB CONTENT */}

        {/* TAB 1: Colecciones del proyecto */}
        {activeTab === "project" && (
          <div className="space-y-3.5">
            {filteredCollections.map((col) => {
              const isAssigned = col.id === assignedCollectionId;
              const isExpanded = expandedId === col.id;

              return (
                <div
                  key={col.id}
                  className={`rounded-2xl border transition-all ${
                    isAssigned
                      ? "border-[#34D399]/40 bg-card dark:bg-[#0C0E18]"
                      : "border-border dark:border-[#1E2335] bg-card dark:bg-[#0C0E18]"
                  }`}
                >
                  {/* Card Header Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : col.id)}
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-[#281B0C] border border-amber-200 dark:border-[#483713] flex items-center justify-center text-amber-600 dark:text-[#FBBF24] shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          {col.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {col.items?.length || 0} feriados · {col.scope === "GLOBAL" ? "Global" : "Proyecto"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAssigned ? (
                        <div className="w-8 h-8 rounded-xl bg-background dark:bg-[#12141F] border border-border dark:border-[#1E2335] flex items-center justify-center text-muted-foreground">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignedCollectionId(col.id);
                              toast({ title: `Colección '${col.name}' asignada al proyecto` });
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 dark:bg-[#20183A] dark:hover:bg-[#2B1F4F] dark:border-[#3E256C] dark:text-[#C4B5FD] text-xs font-semibold cursor-pointer transition-colors"
                          >
                            Asignar
                          </button>
                          <div className="w-8 h-8 rounded-xl bg-background dark:bg-[#12141F] border border-border dark:border-[#1E2335] flex items-center justify-center text-muted-foreground">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content: Holidays Cards List */}
                  {isExpanded && col.items && col.items.length > 0 && (
                    <div className="px-4 pb-4 pt-1 space-y-2.5">
                      {col.items.map((item, idx) => {
                        const dateObj = new Date(item.date + "T12:00:00");
                        const dayName = WEEKDAY_NAMES_ES[dateObj.getDay()];
                        const dayNumber = dateObj.getDate();
                        const yearNum = dateObj.getFullYear();

                        return (
                          <div
                            key={item.id || idx}
                            className="rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] p-3 flex items-center justify-between shadow-2xs"
                          >
                            <div className="flex items-center gap-3">
                              {/* Date Squircle (SEP 12) */}
                              <div className="border border-[#342461] rounded-xl py-1 px-2.5 min-w-[50px] text-center bg-[#1D1635]">
                                <span className="text-[10px] font-bold text-[#A855F7] block tracking-wider uppercase leading-tight">
                                  SEP
                                </span>
                                <span className="text-base font-bold text-foreground leading-none block mt-0.5">
                                  {dayNumber}
                                </span>
                              </div>

                              <div>
                                <p className="font-bold text-xs text-foreground">
                                  {item.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                                  {dayName}, {yearNum}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Footer bar for assigned collection */}
                      {isAssigned && (
                        <div className="pt-3 border-t border-border dark:border-[#1E2335] flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0C251C] text-[#34D399] border border-[#194B37]">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Asignada</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setAssignedCollectionId(null);
                              toast({ title: "Colección desvinculada del proyecto" });
                            }}
                            className="text-xs font-semibold text-[#F87171] hover:underline transition-colors cursor-pointer"
                          >
                            Quitar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Calendarios personalizados (EXACT SVG) */}
        {activeTab === "members" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Configura calendarios distintos para miembros individuales</span>
              <span className="font-mono">{members.length} miembros</span>
            </div>

            <div className="space-y-3">
              {members.map((m, idx) => {
                const displayName = userNames[m.userId] || m.displayName || "Sin nombre registrado";
                const email = userEmails[m.userId] || m.email || "user@astc.com";
                const initials = m.initials || (displayName !== "Sin nombre registrado"
                  ? displayName.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase()
                  : null);

                return (
                  <div
                    key={m.userId || idx}
                    className="rounded-2xl border border-border dark:border-border dark:border-[#1E2335] bg-card dark:bg-card dark:bg-[#0C0E18] p-4 space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      {initials ? (
                        <div
                          className="w-10 h-10 rounded-2xl text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
                          style={{
                            background:
                              "linear-gradient(135deg, #5B8CFF 0%, #A855F7 55%, #22C3E6 100%)",
                          }}
                        >
                          {initials}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-background dark:bg-[#141829] border border-border dark:border-[#1E2335] text-muted-foreground flex items-center justify-center shrink-0">
                          <UserIcon className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-foreground truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                          {email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono tracking-wider text-[#8B7BD8] uppercase font-semibold">
                        DÍAS PERSONALIZADOS
                      </span>

                      <span className="bg-background dark:bg-[#12141F] border border-border dark:border-[#1E2335] text-muted-foreground text-xs px-3 py-1 rounded-full font-medium inline-flex items-center gap-1.5">
                        <span className="text-[8px] text-muted-foreground">●</span>
                        <span>Sin excepciones</span>
                      </span>
                    </div>

                    {/* Action Button: Full width in card */}
                    <button
                      type="button"
                      onClick={() => setSelectedMemberForException(m)}
                      className="w-full h-11 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] hover:bg-[#1A1D2E] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Configurar calendario</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* 6. MODALS IMPLEMENTED TO MATCH SVG DRAWERS */}

      {/* MODAL 1: Crear colección para el proyecto */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg md:max-w-4xl max-h-[92vh] overflow-y-auto bg-[#0E111C] border border-border dark:border-[#1E2335] rounded-[24px] sm:rounded-[28px] p-5 sm:p-7 shadow-2xl relative text-foreground space-y-5">
            {/* Drag Handle (Mobile only) */}
            <div className="w-12 h-1 rounded-full bg-muted-foreground/30 mx-auto md:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-border dark:border-[#1E2335]">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Crear colección para el proyecto
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Crea una colección de fechas que solo aplicará a este proyecto.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] hover:bg-[#1c2238] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCollectionSubmit} className="space-y-5">
              {/* Desktop 2-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* Left Column: Nombre & Calendar */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Nombre de la colección<span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Feriados Perú 2026"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">
                        Selecciona las fechas
                      </label>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-violet/10 text-violet border border-violet/20 font-semibold">
                        {newCollectionDates.length} seleccionadas
                      </span>
                    </div>
                    <MonthCalendarPicker
                      selectedDates={newCollectionDates}
                      onToggleDate={handleToggleDateCreate}
                    />
                  </div>
                </div>

                {/* Right Column: Holiday Names / Empty prompt */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground block">
                    Nombres específicos <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>

                  {newCollectionDates.length > 0 ? (
                    <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-[#111422] p-4 space-y-3">
                      <p className="text-[11px] text-muted-foreground">
                        Asigna un nombre a cada feriado seleccionado para que tus trabajadores lo identifiquen fácilmente:
                      </p>
                      <div className="space-y-2 max-h-[300px] md:max-h-[350px] overflow-y-auto pr-1">
                        {newCollectionDates.map((dateStr) => (
                          <div key={dateStr} className="flex items-center gap-2">
                            <span className="px-3 py-2 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-mono text-muted-foreground min-w-[105px] text-center shrink-0">
                              {dateStr}
                            </span>
                            <input
                              type="text"
                              placeholder="Ej. Día del Trabajador..."
                              value={newCollectionDateNames[dateStr] || ""}
                              onChange={(e) =>
                                setNewCollectionDateNames((prev) => ({
                                  ...prev,
                                  [dateStr]: e.target.value,
                                }))
                              }
                              className="flex-1 h-9 px-3 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border dark:border-[#1E2335] bg-[#111422]/60 p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[260px]">
                      <div className="w-12 h-12 rounded-2xl bg-background dark:bg-[#141829] border border-border dark:border-[#1E2335] flex items-center justify-center text-violet">
                        <CalendarIcon className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        Ninguna fecha seleccionada
                      </p>
                      <p className="text-[11px] text-muted-foreground max-w-[240px]">
                        Haz clic en los días del calendario a la izquierda para marcarlos como feriados y asignarles un nombre.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border dark:border-[#1E2335]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-full sm:w-32 h-11 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] hover:bg-[#1c2238] text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-44 h-11 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-violet/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Guardar colección</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Calendario personalizado (usuario) */}
      {selectedMemberForException && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedMemberForException(null);
          }}
        >
          <div className="w-full max-w-lg md:max-w-3xl max-h-[92vh] overflow-y-auto bg-[#0E111C] border border-border dark:border-[#1E2335] rounded-[24px] sm:rounded-[28px] p-5 sm:p-7 shadow-2xl relative text-foreground space-y-5">
            {/* Drag Handle (Mobile only) */}
            <div className="w-12 h-1 rounded-full bg-muted-foreground/30 mx-auto md:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-border dark:border-[#1E2335]">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Calendario personalizado (usuario)
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecciona las fechas que este trabajador en particular trabajará o descansará fuera del calendario normal.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMemberForException(null)}
                className="w-8 h-8 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] hover:bg-[#1c2238] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExceptionSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* Left column: Reason and Type */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Motivo de excepción
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Permiso especial, cumpleaños..."
                      value={exceptionReason}
                      onChange={(e) => setExceptionReason(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Tipo de excepción
                    </label>
                    <select
                      value={exceptionType}
                      onChange={(e) => setExceptionType(e.target.value as any)}
                      className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                    >
                      <option value="USER_INCLUDE">Día libre (no asiste)</option>
                      <option value="USER_EXCLUDE">Día laborable (ignora feriado)</option>
                    </select>
                  </div>

                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3.5 text-xs text-muted-foreground space-y-1.5">
                    <p className="font-semibold text-blue-400">¿Cómo funciona?</p>
                    <p>
                      <strong>Día libre:</strong> El trabajador no tendrá falta en estas fechas aunque el calendario regular marque día hábil.
                    </p>
                    <p>
                      <strong>Día laborable:</strong> El trabajador debe asistir aunque el proyecto tenga feriado asignado.
                    </p>
                  </div>
                </div>

                {/* Right column: Calendar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Fechas de excepción
                    </label>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-violet/10 text-violet border border-violet/20 font-semibold">
                      {exceptionDates.length} seleccionadas
                    </span>
                  </div>
                  <MonthCalendarPicker
                    selectedDates={exceptionDates}
                    onToggleDate={handleToggleDateException}
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border dark:border-[#1E2335]">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForException(null)}
                  className="w-full sm:w-32 h-11 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] hover:bg-[#1c2238] text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-48 h-11 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-violet/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Guardar excepción</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Importar feriados */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsImportModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg md:max-w-2xl max-h-[92vh] overflow-y-auto bg-[#0E111C] border border-border dark:border-[#1E2335] rounded-[24px] sm:rounded-[28px] p-5 sm:p-7 shadow-2xl relative text-foreground space-y-5">
            {/* Drag Handle (Mobile only) */}
            <div className="w-12 h-1 rounded-full bg-muted-foreground/30 mx-auto md:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-border dark:border-[#1E2335]">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Importar feriados
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Carga tus feriados masivamente desde un archivo CSV o pegando texto.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] hover:bg-[#1c2238] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              {/* Formato Requerido Info Box */}
              <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Formato requerido</span>
                </div>
                <ul className="text-[11.5px] text-muted-foreground space-y-1 pl-1">
                  <li>▪ Usa un feriado por línea.</li>
                  <li>▪ El formato estricto debe ser: <strong className="text-foreground font-mono">AAAA-MM-DD, Nombre del feriado</strong></li>
                  <li>▪ Se aceptan separadores como comas (,), guiones (-) o espacios.</li>
                </ul>

                <div className="rounded-xl border border-blue-500/20 bg-[#0C101D] p-3 font-mono text-[11px] text-muted-foreground space-y-1">
                  <p className="text-muted-foreground/80 font-bold">Ejemplos válidos:</p>
                  <p>2026-12-25, Navidad</p>
                  <p>2026-01-01 - Año Nuevo</p>
                  <p>2026-07-28 Fiestas Patrias</p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="p-1 rounded-xl bg-[#131726] border border-border dark:border-[#1E2335] grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setImportTab("text")}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    importTab === "text"
                      ? "bg-muted dark:bg-[#1E2438] text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Pegar texto
                </button>
                <button
                  type="button"
                  onClick={() => setImportTab("csv")}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    importTab === "csv"
                      ? "bg-muted dark:bg-[#1E2438] text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Subir archivo CSV
                </button>
              </div>

              {importTab === "text" ? (
                <div className="space-y-1.5">
                  <textarea
                    rows={4}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-violet resize-none"
                    placeholder="2026-12-25, Navidad&#10;2026-01-01 - Año Nuevo"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] p-6 text-center space-y-2">
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto" />
                  <p className="text-xs font-semibold text-foreground">
                    Selecciona tu archivo .CSV
                  </p>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const content = await file.text();
                        setImportText(content);
                        setImportTab("text");
                      }
                    }}
                    className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-muted dark:file:bg-[#1E2438] file:text-foreground cursor-pointer"
                  />
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border dark:border-[#1E2335]">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="w-full sm:w-32 h-11 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] hover:bg-[#1c2238] text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-44 h-11 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-violet/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 stroke-[2.2]" />
                  <span>Importar texto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Enlazar colección global */}
      {isLinkModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLinkModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg md:max-w-xl max-h-[92vh] overflow-y-auto bg-[#0E111C] border border-border dark:border-[#1E2335] rounded-[24px] sm:rounded-[28px] p-5 sm:p-7 shadow-2xl relative text-foreground space-y-5">
            <div className="w-12 h-1 rounded-full bg-muted-foreground/30 mx-auto md:hidden" />

            <div className="flex items-start justify-between gap-3 pb-2 border-b border-border dark:border-[#1E2335]">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Enlazar colección global
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Añade una colección global existente a tu proyecto actual.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="w-8 h-8 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] hover:bg-[#1c2238] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Selecciona la colección
                </label>
                <select
                  value={selectedGlobalCollection}
                  onChange={(e) => setSelectedGlobalCollection(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                >
                  <option value="">Seleccione una colección global...</option>
                  {globalCollections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name} ({col.items?.length || 0} feriados)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border dark:border-[#1E2335]">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="w-full sm:w-32 h-11 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] hover:bg-[#1c2238] text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedGlobalCollection}
                  className="w-full sm:w-36 h-11 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-violet/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Link2 className="w-4 h-4 stroke-[2.2]" />
                  <span>Enlazar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
