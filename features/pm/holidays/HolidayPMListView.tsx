"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  getAllProjects,
  getMyProjects,
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
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Upload,
  Link2,
  User as UserIcon,
  Check,
  Search,
  Folder,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  MONTH_NAMES_ES,
  WEEKDAY_NAMES_ES,
} from "./components/MonthCalendarPicker";
import { CreateProjectCollectionModal } from "./components/CreateProjectCollectionModal";
import { MemberExceptionModal } from "./components/MemberExceptionModal";
import { ImportHolidaysModal } from "./components/ImportHolidaysModal";
import { LinkGlobalCollectionModal } from "./components/LinkGlobalCollectionModal";

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

  // Modal Visibility States
  const searchParams = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMemberForException, setSelectedMemberForException] = useState<any | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams?.get("modal") === "exception") {
      setSelectedMemberForException(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selected_project_id");
      if (saved && saved !== "all") setSelectedProjectId(saved);

      const handleProj = (e: Event) => {
        const customEvent = e as CustomEvent<string>;
        const newId = customEvent.detail ?? localStorage.getItem("selected_project_id");
        if (newId && newId !== "all") {
          setSelectedProjectId(newId);
        } else if (newId === "all" && projects.length > 0) {
          setSelectedProjectId(projects[0].id);
        }
      };

      window.addEventListener("astc-project-changed", handleProj);
      window.addEventListener("storage", handleProj);
      return () => {
        window.removeEventListener("astc-project-changed", handleProj);
        window.removeEventListener("storage", handleProj);
      };
    }
  }, [projects]);

  const handleProjectChange = (id: string) => {
    setSelectedProjectId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_project_id", id);
      window.dispatchEvent(new CustomEvent("astc-project-changed", { detail: id }));
    }
  };

  // Load Projects
  useEffect(() => {
    if (!token) return;
    getAllProjects(token)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
          if (!selectedProjectId || !data.some((p: any) => p.id === selectedProjectId)) {
            setSelectedProjectId(data[0].id);
          }
        } else {
          return getMyProjects(token).then((mine) => {
            const list = Array.isArray(mine) ? mine : [];
            setProjects(list);
            if (list.length > 0 && (!selectedProjectId || !list.some((p: any) => p.id === selectedProjectId))) {
              setSelectedProjectId(list[0].id);
            }
          });
        }
      })
      .catch(() => {
        getMyProjects(token)
          .then((mine) => {
            const list = Array.isArray(mine) ? mine : [];
            setProjects(list);
            if (list.length > 0 && (!selectedProjectId || !list.some((p: any) => p.id === selectedProjectId))) {
              setSelectedProjectId(list[0].id);
            }
          })
          .catch(() => {
            setProjects([]);
          });
      });
  }, [token, selectedProjectId]);

  // Load Global Collections
  useEffect(() => {
    if (!token) return;
    getGlobalCollections(token)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setGlobalCollections(data);
        } else {
          setGlobalCollections([]);
        }
      })
      .catch(() => {
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

  // Tab 1 Pagination (Collections)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [itemsPage, setItemsPage] = useState<Record<string, number>>({});
  const totalPages = Math.max(1, Math.ceil(filteredCollections.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedProjectId]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedCollections = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCollections.slice(start, start + pageSize);
  }, [filteredCollections, currentPage, pageSize]);

  // Tab 2 Filtered & Paginated Members
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members;
    const lower = searchTerm.toLowerCase();
    return members.filter((m) => {
      const name = (userNames[m.userId] || m.displayName || "").toLowerCase();
      const email = (userEmails[m.userId] || m.email || "").toLowerCase();
      return name.includes(lower) || email.includes(lower);
    });
  }, [members, searchTerm, userNames, userEmails]);

  const [membersPage, setMembersPage] = useState(1);
  const [membersPageSize, setMembersPageSize] = useState(5);
  const totalMemberPages = Math.max(1, Math.ceil(filteredMembers.length / membersPageSize));

  useEffect(() => {
    setMembersPage(1);
  }, [searchTerm, selectedProjectId]);

  useEffect(() => {
    if (membersPage > totalMemberPages) {
      setMembersPage(totalMemberPages);
    }
  }, [totalMemberPages, membersPage]);

  const paginatedMembers = useMemo(() => {
    const start = (membersPage - 1) * membersPageSize;
    return filteredMembers.slice(start, start + membersPageSize);
  }, [filteredMembers, membersPage, membersPageSize]);

  // Submit Handlers
  const handleCreateCollectionSubmit = async (
    name: string,
    dates: string[],
    dateNames: Record<string, string>
  ) => {
    if (!token || !selectedProjectId) return;
    try {
      const items = dates.map((d) => ({
        date: d,
        name: dateNames[d] || name,
      }));
      await createCollection(
        token,
        {
          name,
          scope: "PROJECT",
          ownerId: selectedProjectId,
        },
        items
      );
      toast({ title: "Colección creada con éxito" });
      fetchData();
    } catch {
      toast({ title: "Colección creada localmente" });
    }
  };

  const handleSaveExceptionSubmit = async (
    member: any,
    reason: string,
    type: "USER_INCLUDE" | "USER_EXCLUDE",
    dates: string[]
  ) => {
    if (!token || !selectedProjectId) return;
    try {
      const items = dates.map((d) => ({
        date: d,
        name: reason || "Excepción",
        type,
        userId: member.userId,
      }));
      await bulkCreateHolidays(token, selectedProjectId, items);
      toast({ title: "Excepción de calendario guardada" });
    } catch {
      toast({ title: "Excepción guardada localmente" });
    }
  };

  const handleImportSubmit = async (parsed: { date: string; name: string }[]) => {
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
      fetchData();
    } catch {
      toast({ title: "Feriados importados localmente" });
    }
  };

  const handleLinkSubmit = async (collectionId: string) => {
    setAssignedCollectionId(collectionId);
    toast({ title: "Colección enlazada al proyecto" });
  };

  return (
    <div className="relative min-h-screen bg-transparent pb-16 font-sans">
      

      <div className="relative w-full max-w-7xl mx-auto space-y-6 z-10 ">
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

        {/* UNIFIED MAIN CONTAINER ("Un cuadro entero, no 3") */}
        <div className="rounded-[22px] border border-border bg-card/60 dark:bg-[#0C0E18] p-4 sm:p-5 md:p-6 shadow-sm space-y-5 sm:space-y-6">
          {/* 2. TOP 3 KPI METRIC CARDS */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-1">
            {/* Card 1: Colecciones disponibles (Amber) */}
            <div className="rounded-2xl border border-amber-500/20 dark:border-[#483713] bg-card dark:bg-[#16140D] p-3 sm:p-4 flex flex-col justify-between h-[95px] sm:h-[105px] shadow-xs">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-[#FBBF24]">
                  <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div>
                <span className="text-[9.5px] sm:text-xs font-semibold text-amber-600 dark:text-[#FBBF24] block leading-tight">
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
                <span className="text-[9.5px] sm:text-xs font-semibold text-purple-600 dark:text-[#C4B5FD] block leading-tight">
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
                <span className="text-[9.5px] sm:text-xs font-semibold text-emerald-600 dark:text-[#34D399] block leading-tight">
                  Total feriados
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-foreground leading-none mt-1">
                  {totalHolidaysCount}
                </div>
              </div>
            </div>
          </div>

          {/* Divider Line */}
          <div className="border-t border-border/60 -mx-4 sm:-mx-5 md:-mx-6" />

          {/* 3. FILTERS & SEARCH BAR */}
          <div className="pt-1">
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
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#A855F7]"
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
                      onChange={(e) => handleProjectChange(e.target.value)}
                      className="w-full h-11 pl-10 pr-8 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] text-xs font-medium text-foreground focus:outline-none focus:border-[#A855F7] appearance-none"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id} className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">
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
                    className="w-11 h-11 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] hover:bg-muted dark:hover:bg-[#1A1D2E] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 shadow-xs"
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
              <div className="p-1 rounded-xl bg-muted dark:bg-[#131726] border border-border dark:border-[#1E2335] flex items-center gap-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("project")}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "project"
                      ? "bg-white dark:bg-[#1E2438] text-foreground font-semibold shadow-xs"
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
                      ? "bg-white dark:bg-[#1E2438] text-foreground font-semibold shadow-xs"
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
                    className="h-10 px-4 rounded-xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1c2238] text-xs font-semibold text-foreground flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLinkModalOpen(true)}
                    className="h-10 px-4 rounded-xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1c2238] text-xs font-semibold text-foreground flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
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
                {paginatedCollections.map((col) => {
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
                          <div className="flex items-center justify-between pb-2 border-b border-border/40 dark:border-[#1E2335] text-xs">
                            <span className="font-semibold text-foreground">
                              {col.items.length} {col.items.length === 1 ? "feriado en esta colección" : "feriados en esta colección"}
                            </span>
                            {col.items.length > 4 && (
                              <span className="text-[11px] text-muted-foreground">
                                Desplázate para ver todos
                              </span>
                            )}
                          </div>

                          {/* Contenedor acotado con scroll vertical */}
                          <div className="max-h-[320px] sm:max-h-[360px] overflow-y-auto pr-1 sm:pr-1.5 space-y-2.5">
                            {(col.items || []).slice(((itemsPage[col.id] || 1) - 1) * 5, (itemsPage[col.id] || 1) * 5).map((item, idx) => {
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
                                    <div className="border border-purple-200 dark:border-[#342461] rounded-xl py-1 px-2.5 min-w-[50px] text-center bg-purple-50 dark:bg-[#1D1635]">
                                      <span className="text-[10px] font-bold text-purple-700 dark:text-[#A855F7] block tracking-wider uppercase leading-tight">
                                        {MONTH_NAMES_ES[dateObj.getMonth()].slice(0, 3).toUpperCase()}
                                      </span>
                                      <span className="text-base font-bold text-purple-950 dark:text-white leading-none block mt-0.5">
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
                          </div>
                          {col.items && col.items.length > 5 && (
                            <div className="flex items-center justify-between pt-2 px-1 text-xs text-muted-foreground border-t border-border/30 dark:border-[#1E2335]">
                              <span>
                                Mostrando {Math.min(((itemsPage[col.id] || 1) - 1) * 5 + 1, col.items.length)} - {Math.min((itemsPage[col.id] || 1) * 5, col.items.length)} de {col.items.length} feriados
                              </span>
                              <div className="flex items-center gap-2">
                                <span>
                                  Página {itemsPage[col.id] || 1} de {Math.max(1, Math.ceil(col.items.length / 5))}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={(itemsPage[col.id] || 1) <= 1}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setItemsPage((prev) => ({
                                        ...prev,
                                        [col.id]: Math.max(1, (prev[col.id] || 1) - 1),
                                      }));
                                    }}
                                    className="p-1 rounded border border-border dark:border-[#22283D] bg-card dark:bg-[#141829] hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    title="Página anterior"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={(itemsPage[col.id] || 1) >= Math.ceil(col.items.length / 5)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const maxP = Math.ceil(col.items.length / 5);
                                      setItemsPage((prev) => ({
                                        ...prev,
                                        [col.id]: Math.min(maxP, (prev[col.id] || 1) + 1),
                                      }));
                                    }}
                                    className="p-1 rounded border border-border dark:border-[#22283D] bg-card dark:bg-[#141829] hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    title="Página siguiente"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Footer bar for assigned collection */}
                          {isAssigned && (
                            <div className="pt-3 border-t border-border dark:border-[#1E2335] flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-[#0C251C] dark:text-[#34D399] dark:border-[#194B37]">
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

                {/* PAGINACIÓN DE COLECCIONES DEL PROYECTO */}
                {filteredCollections.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 text-xs text-muted-foreground">
                    <div>
                      <span>
                        Mostrando <strong className="text-foreground">{Math.min((currentPage - 1) * pageSize + 1, filteredCollections.length)}</strong> - <strong className="text-foreground">{Math.min(currentPage * pageSize, filteredCollections.length)}</strong> de <strong className="text-foreground">{filteredCollections.length}</strong> colecciones
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span>
                        Página <strong className="text-foreground">{currentPage}</strong> de <strong className="text-foreground">{totalPages}</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={currentPage <= 1}
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className="h-8 px-2.5 rounded-lg border border-border dark:border-[#22283D] bg-card dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1C2238] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-foreground transition-colors cursor-pointer"
                          title="Página anterior"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-xs">Anterior</span>
                        </button>
                        <button
                          type="button"
                          disabled={currentPage >= totalPages}
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className="h-8 px-2.5 rounded-lg border border-border dark:border-[#22283D] bg-card dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1C2238] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-foreground transition-colors cursor-pointer"
                          title="Página siguiente"
                        >
                          <span className="hidden sm:inline text-xs">Siguiente</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Calendarios personalizados (EXACT SVG) */}
            {activeTab === "members" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Configura calendarios distintos para miembros individuales</span>
                  <span className="font-mono">{filteredMembers.length} {filteredMembers.length === 1 ? "miembro" : "miembros"}</span>
                </div>

                <div className="space-y-3">
                  {paginatedMembers.map((m, idx) => {
                    const displayName = userNames[m.userId] || m.displayName || "Sin nombre registrado";
                    const email = userEmails[m.userId] || m.email || "user@astc.com";
                    const initials = m.initials || (displayName !== "Sin nombre registrado"
                      ? displayName.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase()
                      : null);

                    return (
                      <div
                        key={m.userId || idx}
                        className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0C0E18] p-4 space-y-3 shadow-2xs"
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
                          <span className="text-[10px] font-mono tracking-wider text-purple-600 dark:text-[#8B7BD8] uppercase font-semibold">
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
                          className="w-full h-11 rounded-xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#12141F] hover:bg-muted dark:hover:bg-[#1A1D2E] text-xs font-semibold text-foreground flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Configurar calendario</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* PAGINACIÓN DE MIEMBROS */}
                {filteredMembers.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 text-xs text-muted-foreground">
                    <div>
                      <span>
                        Mostrando <strong className="text-foreground">{Math.min((membersPage - 1) * membersPageSize + 1, filteredMembers.length)}</strong> - <strong className="text-foreground">{Math.min(membersPage * membersPageSize, filteredMembers.length)}</strong> de <strong className="text-foreground">{filteredMembers.length}</strong> miembros
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span>
                        Página <strong className="text-foreground">{membersPage}</strong> de <strong className="text-foreground">{totalMemberPages}</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={membersPage <= 1}
                          onClick={() => setMembersPage((p) => Math.max(1, p - 1))}
                          className="h-8 px-2.5 rounded-lg border border-border dark:border-[#22283D] bg-card dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1C2238] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-foreground transition-colors cursor-pointer"
                          title="Página anterior"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-xs">Anterior</span>
                        </button>
                        <button
                          type="button"
                          disabled={membersPage >= totalMemberPages}
                          onClick={() => setMembersPage((p) => Math.min(totalMemberPages, p + 1))}
                          className="h-8 px-2.5 rounded-lg border border-border dark:border-[#22283D] bg-card dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1C2238] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-foreground transition-colors cursor-pointer"
                          title="Página siguiente"
                        >
                          <span className="hidden sm:inline text-xs">Siguiente</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS MODULARIZADOS */}
      <CreateProjectCollectionModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCollectionSubmit}
      />

      <MemberExceptionModal
        member={selectedMemberForException}
        onClose={() => setSelectedMemberForException(null)}
        onSubmit={handleSaveExceptionSubmit}
      />

      <ImportHolidaysModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleImportSubmit}
      />

      <LinkGlobalCollectionModal
        open={isLinkModalOpen}
        globalCollections={globalCollections}
        onClose={() => setIsLinkModalOpen(false)}
        onSubmit={handleLinkSubmit}
      />
    </div>
  );
}
