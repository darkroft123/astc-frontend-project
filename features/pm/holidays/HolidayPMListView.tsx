"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  listHolidays,
  deleteHoliday,
  getAllProjects,
  getProjectMembers,
  getUserById,
  bulkCreateHolidays,
  getCollectionsForProject,
  getGlobalCollections,
  getAdminSetting,
  createCollection,
  deleteCollection,
  linkProjectToCollection,
  unlinkProjectFromCollection,
  deleteCollectionItem,
  CollectionOutput,
} from "@/app/services/project.assistance.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  RefreshCw,
  X,
  Layers,
  ChevronDown,
  CheckCircle2,
  Upload,
  Link2,
  User as UserIcon,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { HolidayImporter } from "./HolidayImporter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function HolidayPMListView() {
  const { token } = useAuth();
  const { toast } = useToast();

  // Data States
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [members, setMembers] = useState<any[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [memberExceptions, setMemberExceptions] = useState<any[]>([]);
  const [projectCollections, setProjectCollections] = useState<CollectionOutput[]>([]);
  const [globalCollections, setGlobalCollections] = useState<CollectionOutput[]>([]);
  const [globalAssignedCollectionId, setGlobalAssignedCollectionId] = useState<string | null>("col-001");

  // UI States
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"project" | "members">("project");
  const [expandedId, setExpandedId] = useState<string | null>("col-001");

  // Form States - Create Collection
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [assignedCollectionId, setAssignedCollectionId] = useState<string | null>("col-001");
  const [pendingAssignment, setPendingAssignment] = useState<string | null>(null);
  const [selectedGlobalCollection, setSelectedGlobalCollection] = useState<string>("");
  const [formName, setFormName] = useState("");
  const [formDates, setFormDates] = useState<Date[]>([]);
  const [dateNames, setDateNames] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States - User Exception
  const [isExceptionFormOpen, setIsExceptionFormOpen] = useState(false);
  const [formType, setFormType] = useState<"USER_INCLUDE" | "USER_EXCLUDE">("USER_INCLUDE");
  const [formTargetId, setFormTargetId] = useState<string>("");
  const [exceptionName, setExceptionName] = useState("");
  const [exceptionDates, setExceptionDates] = useState<Date[]>([]);

  // Member Exceptions Modal
  const [exceptionsModalUser, setExceptionsModalUser] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getAllProjects(token).then((data) => {
      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    });
  }, [token]);

  useEffect(() => {
    if (!token || selectedProjectId === "all" || !selectedProjectId) {
      setMembers([]);
      return;
    }
    getProjectMembers(token, selectedProjectId).then(async (data) => {
      setMembers(data || []);
      const names: Record<string, string> = {};
      const emails: Record<string, string> = {};
      for (const m of data || []) {
        if (m.userId) {
          const user = await getUserById(token, m.userId).catch(() => null);
          if (user) {
            const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
            names[m.userId] = fullName;
            emails[m.userId] = user.email || "";
          }
        }
      }
      setUserNames(names);
      setUserEmails(emails);
    });
  }, [token, selectedProjectId]);

  const fetchData = async () => {
    if (!token || selectedProjectId === "all" || !selectedProjectId) {
      setProjectCollections([]);
      setMemberExceptions([]);
      return;
    }
    setLoading(true);
    try {
      const [pCols, gCols, gAssigned] = await Promise.all([
        getCollectionsForProject(token, selectedProjectId).catch(() => []),
        getGlobalCollections(token).catch(() => []),
        getAdminSetting(token, "GLOBAL_ASSIGNED_COLLECTION_ID").catch(() => null),
      ]);
      setProjectCollections(pCols || []);
      setGlobalCollections(gCols || []);
      if (gAssigned) {
        setGlobalAssignedCollectionId(gAssigned);
      }

      const memHols: any[] = [];
      for (const m of members) {
        if (m.userId) {
          const userHols = await listHolidays(token, m.userId, year).catch(() => []);
          if (userHols) memHols.push(...userHols);
        }
      }
      setMemberExceptions(memHols);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && selectedProjectId) {
      fetchData();
    }
  }, [token, selectedProjectId, year, members.length]);

  const confirmAssignment = async () => {
    if (pendingAssignment && token && selectedProjectId && selectedProjectId !== "all") {
      try {
        await linkProjectToCollection(token, selectedProjectId, pendingAssignment);
        setAssignedCollectionId(pendingAssignment);
        await fetchData();
        toast({ title: "Colección asignada al proyecto con éxito" });
      } catch (error) {
        console.error("Error confirmAssignment in HolidayPMListView:", error);
        toast({ title: "Error al asignar colección al proyecto", variant: "destructive" });
      }
    }
    setPendingAssignment(null);
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedProjectId) return;

    if (selectedProjectId === "all") {
      toast({
        title: "Atención",
        description: "Por favor selecciona un proyecto específico arriba.",
        variant: "destructive",
      });
      return;
    }
    if (!formName.trim()) {
      alert("El nombre de la colección es obligatorio.");
      return;
    }
    const validDates = formDates.map((d) => {
      const offset = d.getTimezoneOffset();
      const adjusted = new Date(d.getTime() - offset * 60 * 1000);
      return adjusted.toISOString().split("T")[0];
    });

    const items = validDates.map((d) => ({ date: d, name: dateNames[d] || formName }));

    setIsSubmitting(true);
    try {
      const created = await createCollection(
        token,
        { name: formName, scope: "PROJECT", ownerId: selectedProjectId },
        items
      );
      if (created?.id) {
        await linkProjectToCollection(token, selectedProjectId, created.id).catch(() => null);
        setAssignedCollectionId(created.id);
      }
      setIsFormOpen(false);
      setFormName("");
      setFormDates([]);
      setDateNames({});
      await fetchData();
      toast({ title: "Colección creada y asignada al proyecto con éxito" });
    } catch (error: any) {
      console.error("Error creating collection:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la colección.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedProjectId || !selectedGlobalCollection) return;
    try {
      await linkProjectToCollection(token, selectedProjectId, selectedGlobalCollection);
      setAssignedCollectionId(selectedGlobalCollection);
      setIsLinkModalOpen(false);
      setSelectedGlobalCollection("");
      await fetchData();
      toast({ title: "Colección enlazada y asignada al proyecto" });
    } catch (error) {
      toast({ title: "Error al enlazar colección", variant: "destructive" });
    }
  };

  const handleUnlinkCollection = async (collectionId: string) => {
    if (!confirm("¿Desvincular esta colección del proyecto?")) return;
    try {
      await unlinkProjectFromCollection(token!, selectedProjectId, collectionId);
      if (assignedCollectionId === collectionId) {
        setAssignedCollectionId(null);
      }
      await fetchData();
      toast({ title: "Colección desvinculada" });
    } catch (error) {
      toast({ title: "Error al desvincular", variant: "destructive" });
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta colección? Se borrarán sus feriados.")) return;
    try {
      await deleteCollection(token!, collectionId);
      fetchData();
      toast({ title: "Colección eliminada" });
    } catch (error) {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  };

  const handleDeleteCollectionItem = async (itemId: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta fecha específica de la colección?")) return;
    try {
      await deleteCollectionItem(token!, itemId);
      fetchData();
      toast({ title: "Fecha eliminada" });
    } catch (error) {
      toast({ title: "Error al eliminar fecha", variant: "destructive" });
    }
  };

  const handleImportHolidays = async (
    items: { date: string; name: string }[],
    namePrefix: string
  ) => {
    if (!token || !selectedProjectId) return;

    if (selectedProjectId === "all") {
      toast({
        title: "Atención",
        description: "Por favor selecciona un proyecto específico arriba.",
        variant: "destructive",
      });
      return;
    }

    const selectedProject = projects.find((p) => p.id === selectedProjectId);
    const projectName = selectedProject
      ? selectedProject.name
      : `Proyecto ${selectedProjectId.substring(0, 8)}`;

    try {
      await createCollection(
        token,
        {
          name: `${namePrefix} ${projectName}`,
          scope: "PROJECT",
          ownerId: selectedProjectId,
        },
        items
      );
      toast({ title: "Feriados importados al proyecto" });
      fetchData();
    } catch (error) {
      toast({ title: "Error al importar", variant: "destructive" });
    }
  };

  const handleImportMemberHolidays = async (
    items: { date: string; name: string }[],
    namePrefix: string
  ) => {
    if (!exceptionsModalUser || selectedProjectId === "all" || !selectedProjectId) return;
    try {
      await bulkCreateHolidays(
        token || "",
        exceptionsModalUser,
        items.map((i) => i.date),
        namePrefix,
        "USER_INCLUDE"
      );
      toast({ title: "Feriados importados al usuario" });
      fetchData();
    } catch (error) {
      toast({ title: "Error al importar", variant: "destructive" });
    }
  };

  const handleCreateException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const validDates = exceptionDates.map((d) => {
      const offset = d.getTimezoneOffset();
      return new Date(d.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
    });
    try {
      await bulkCreateHolidays(
        token,
        formTargetId,
        validDates,
        exceptionName || "Excepción",
        formType
      );
      setIsExceptionFormOpen(false);
      setExceptionDates([]);
      setExceptionName("");
      fetchData();
      toast({ title: "Excepción guardada" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleDeleteException = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta excepción?")) return;
    try {
      await deleteHoliday(token!, id);
      fetchData();
    } catch (error) {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  };

  const openFormForUser = (userId: string) => {
    setFormType("USER_INCLUDE");
    setFormTargetId(userId);
    setExceptionName("");
    setExceptionDates([]);
    setIsExceptionFormOpen(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const availableCollections = useMemo(() => {
    const map = new Map<string, CollectionOutput>();
    for (const c of projectCollections) map.set(c.id, c);
    for (const c of globalCollections) {
      if (!map.has(c.id)) map.set(c.id, c);
    }
    return Array.from(map.values());
  }, [projectCollections, globalCollections]);

  const activeAssignedCollectionId = useMemo(() => {
    if (assignedCollectionId) return assignedCollectionId;
    if (projectCollections && projectCollections.length > 0) return projectCollections[0].id;
    return globalAssignedCollectionId || "col-001";
  }, [assignedCollectionId, projectCollections, globalAssignedCollectionId]);

  const filteredCollections = useMemo(() => {
    const lowerQuery = searchTerm.toLowerCase();
    return availableCollections.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.items?.some(
          (i) => i.name?.toLowerCase().includes(lowerQuery) || i.date.includes(lowerQuery)
        )
    );
  }, [searchTerm, availableCollections]);

  const filteredExceptions = useMemo(() => {
    let data = memberExceptions;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(
        (h) =>
          h.name.toLowerCase().includes(lower) ||
          h.date.includes(lower) ||
          (userNames[h.targetId] || "").toLowerCase().includes(lower)
      );
    }
    return data;
  }, [memberExceptions, searchTerm, userNames]);

  const membersList = useMemo(() => {
    let data = members;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(
        (m) =>
          (userNames[m.userId] || "").toLowerCase().includes(lower) ||
          (userEmails[m.userId] || "").toLowerCase().includes(lower)
      );
    }
    return data;
  }, [members, searchTerm, userNames, userEmails]);

  const totalProjectDates = useMemo(() => {
    return availableCollections.reduce((acc, c) => acc + (c.items?.length || 0), 0);
  }, [availableCollections]);

  const assignedCount = activeAssignedCollectionId ? 1 : 0;

  return (
    <div className="w-full space-y-6">
      {/* 1. TOP HEADER & CREATE COLLECTION BUTTON */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-medium tracking-wider text-[#7c3aed] uppercase flex items-center gap-1.5">
            <span>PANEL DE GESTIÓN</span>
            <span className="text-muted-foreground/60">·</span>
            <span>Calendario</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mt-1">
            Feriados del proyecto
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Administra colecciones de feriados del proyecto y excepciones para miembros específicos.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#38bdf8] hover:opacity-95 text-white font-semibold text-xs md:text-sm shadow-md shadow-indigo-500/25 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Crear colección</span>
        </button>
      </div>

      {/* 2. MAIN CARD CONTAINER */}
      <div className="rounded-2xl border border-border/70 dark:border-white/5 bg-card/60 dark:bg-[#11131c]/90 p-5 md:p-6 shadow-sm space-y-6">
        {/* 2.1 TOP 3 KPI METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: Colecciones disponibles */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-[#1a1711] p-4 flex flex-col justify-between h-[88px]">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-[#2e2315] border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Layers className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                Colecciones disponibles
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-foreground leading-none">
              {availableCollections.length}
            </div>
          </div>

          {/* Card 2: Asignadas al proyecto */}
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-[#161224] p-4 flex flex-col justify-between h-[88px]">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 dark:bg-[#25183d] border border-purple-500/20 flex items-center justify-center text-purple-400">
                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                Asignadas al proyecto
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-foreground leading-none">
              {assignedCount}
            </div>
          </div>

          {/* Card 3: Total feriados */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-[#0e1d17] p-4 flex flex-col justify-between h-[88px]">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-[#112920] border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CalendarIcon className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Total feriados
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-foreground leading-none">
              {totalProjectDates}
            </div>
          </div>
        </div>

        {/* 2.2 SEARCH & PROJECT FILTER BAR */}
        <div className="flex flex-col md:flex-row items-end gap-3 w-full">
          {/* BUSCAR */}
          <div className="flex-1 w-full space-y-1">
            <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase font-semibold">
              BUSCAR
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Feriado o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 px-3 pl-9 rounded-xl border border-border/80 dark:border-white/10 bg-background/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <svg
                className="w-4 h-4 absolute left-3 top-3 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
                />
              </svg>
            </div>
          </div>

          {/* PROYECTO */}
          <div className="w-full md:w-[240px] space-y-1">
            <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase font-semibold">
              PROYECTO
            </label>
            <Select
              value={selectedProjectId}
              onValueChange={(val) => {
                setSelectedProjectId(val);
                setAssignedCollectionId("col-001");
              }}
            >
              <SelectTrigger className="h-10 rounded-xl border border-border/80 dark:border-white/10 bg-background/80 text-xs">
                <SelectValue placeholder="Seleccione proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ACTUALIZAR BUTTON */}
          <button
            onClick={fetchData}
            className="h-10 px-4 rounded-xl border border-border/80 dark:border-white/10 bg-background hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* 2.3 TABS BAR & ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* SEGMENTED TAB SELECTOR */}
          <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 dark:bg-[#161a23] border border-border/60 dark:border-white/5">
            <button
              onClick={() => setActiveTab("project")}
              className={`px-4 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                activeTab === "project"
                  ? "bg-card dark:bg-[#202533] text-foreground dark:text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              Colecciones del proyecto
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`px-4 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                activeTab === "members"
                  ? "bg-card dark:bg-[#202533] text-foreground dark:text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              Calendarios personalizados
            </button>
          </div>

          {/* TAB 1 ACTIONS (Only visible when activeTab === "project") */}
          {activeTab === "project" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const elem = document.getElementById("holiday-importer-trigger");
                  if (elem) elem.click();
                }}
                className="h-9 px-3.5 rounded-xl border border-border/80 dark:border-white/10 bg-background hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar feriados</span>
              </button>
              <div className="hidden">
                <HolidayImporter onImport={handleImportHolidays} year={year} />
              </div>

              <button
                onClick={() => setIsLinkModalOpen(true)}
                className="h-9 px-3.5 rounded-xl border border-border/80 dark:border-white/10 bg-background hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Enlazar colección global</span>
              </button>
            </div>
          )}
        </div>

        {/* 2.4 TAB CONTENT: TAB 1 (Colecciones del proyecto) */}
        {activeTab === "project" && (
          <div className="space-y-3 pt-1">
            {filteredCollections.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-xl text-xs">
                {searchTerm
                  ? "No se encontraron colecciones que coincidan con la búsqueda."
                  : "El proyecto no tiene colecciones configuradas."}
              </div>
            ) : (
              filteredCollections.map((c) => {
                const isAssigned = c.id === activeAssignedCollectionId;
                const isExpanded = expandedId === c.id;

                return (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-border/70 dark:border-white/5 bg-card/70 dark:bg-[#121620]/70 overflow-hidden shadow-xs transition-all"
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => toggleExpand(c.id)}
                      className="p-4 md:p-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                    >
                      {/* Left: Icon + Title + Meta */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-[#292015] border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                          <Layers className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{c.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {c.items?.length || 0} feriados · {c.scope === "GLOBAL" ? "Global" : "Proyecto"}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-3">
                        {isAssigned ? (
                          <div className="flex items-center gap-3">
                            <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Asignada</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnlinkCollection(c.id);
                              }}
                              className="text-rose-500 hover:text-rose-400 text-xs font-medium px-2 py-1 cursor-pointer transition-colors"
                            >
                              Quitar
                            </button>
                            <button
                              type="button"
                              className="w-7 h-7 rounded-lg bg-muted/60 dark:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingAssignment(c.id);
                            }}
                            className="h-8 px-4 rounded-xl bg-purple-500/15 dark:bg-[#25183d] border border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/25 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <span>Asignar</span>
                            <span className="text-[11px]">&gt;</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Content: Holidays Grid */}
                    {isExpanded && (
                      <div className="border-t border-border/60 dark:border-white/5 p-4 md:p-5 bg-background/50 dark:bg-[#0c0e14]/40">
                        {!c.items || c.items.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            Esta colección no tiene fechas asignadas.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {c.items.map((item) => {
                              const dateObj = new Date(item.date + "T00:00:00");
                              const days = [
                                "Domingo",
                                "Lunes",
                                "Martes",
                                "Miércoles",
                                "Jueves",
                                "Viernes",
                                "Sábado",
                              ];
                              return (
                                <div
                                  key={item.id}
                                  className="rounded-xl border border-border/60 dark:border-white/5 bg-card dark:bg-[#161a24] p-3 flex items-center justify-between gap-3 shadow-xs group"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {/* Date Badge */}
                                    <div className="w-11 h-11 rounded-lg bg-muted/80 dark:bg-[#1d2230] border border-border/60 dark:border-white/5 flex flex-col items-center justify-center shrink-0">
                                      <span className="text-[10px] font-mono font-semibold uppercase text-muted-foreground leading-none">
                                        {format(dateObj, "MMM", { locale: es })}
                                      </span>
                                      <span className="text-sm font-bold font-mono text-foreground leading-none mt-1">
                                        {format(dateObj, "dd")}
                                      </span>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-foreground truncate">
                                        {item.name}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground mt-0.5">
                                        {days[dateObj.getDay()]}, {dateObj.getFullYear()}
                                      </p>
                                    </div>
                                  </div>

                                  {c.scope !== "GLOBAL" && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCollectionItem(item.id)}
                                      className="w-7 h-7 rounded-lg text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                                      title="Eliminar fecha"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 2.5 TAB CONTENT: TAB 2 (Calendarios personalizados) */}
        {activeTab === "members" && (
          <div className="space-y-3 pt-1">
            {/* Subheader */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Configura calendarios distintos para miembros individuales</span>
              <span className="font-mono">{membersList.length} miembros</span>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-border/70 dark:border-white/5 bg-card/50 dark:bg-[#121620]/50 overflow-hidden">
              {/* Header */}
              <div className="px-5 py-3 border-b border-border/60 dark:border-white/5 grid grid-cols-12 text-[10px] font-mono tracking-wider text-muted-foreground uppercase font-semibold">
                <div className="col-span-5">MIEMBRO</div>
                <div className="col-span-4 text-center">DÍAS PERSONALIZADOS</div>
                <div className="col-span-3 text-right">ACCIONES</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border/40 dark:divide-white/5">
                {membersList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No se encontraron miembros en el proyecto.
                  </div>
                ) : (
                  membersList.map((m, index) => {
                    const rawName = userNames[m.userId] || "";
                    const email = userEmails[m.userId] || "user@astc.com";
                    const displayName = rawName.trim() || "Sin nombre registrado";
                    const userExceptions = filteredExceptions.filter(
                      (h) => h.targetId === m.userId
                    );

                    // Compute initials if real name exists
                    const initials =
                      rawName.trim()
                        ? rawName
                            .trim()
                            .split(" ")
                            .map((p) => p[0]?.toUpperCase())
                            .filter(Boolean)
                            .slice(0, 2)
                            .join("")
                        : null;

                    const rowBg =
                      index % 2 === 0
                        ? "bg-transparent"
                        : "bg-muted/15 dark:bg-white/[0.02]";

                    return (
                      <div
                        key={m.userId || index}
                        className={`px-5 py-4 grid grid-cols-12 items-center gap-3 ${rowBg} hover:bg-muted/30 dark:hover:bg-white/[0.04] transition-colors`}
                      >
                        {/* Member column */}
                        <div className="col-span-5 flex items-center gap-3 min-w-0">
                          {initials ? (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {initials}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted/80 dark:bg-[#1d2230] text-muted-foreground flex items-center justify-center shrink-0 border border-border/50">
                              <UserIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-foreground block truncate">
                              {displayName}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground block truncate mt-0.5">
                              {email}
                            </span>
                          </div>
                        </div>

                        {/* Días personalizados column */}
                        <div className="col-span-4 flex items-center justify-center">
                          {userExceptions.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setExceptionsModalUser(m.userId)}
                              className="h-7 px-3 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
                            >
                              Ver {userExceptions.length} días
                            </button>
                          ) : (
                            <span className="bg-muted/60 dark:bg-[#1a1f2b] text-muted-foreground text-xs px-3 py-1 rounded-full font-medium inline-flex items-center gap-1.5">
                              <span className="text-[8px]">●</span>
                              <span>Sin excepciones</span>
                            </span>
                          )}
                        </div>

                        {/* Acciones column */}
                        <div className="col-span-3 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => openFormForUser(m.userId)}
                            className="h-8 px-3.5 rounded-xl border border-border/80 dark:border-white/10 bg-background hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
                            <span>Configurar calendario</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. MODALS */}

      {/* Modal: Crear Colección Proyecto */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Crear Colección para el Proyecto</DialogTitle>
            <DialogDescription>
              Crea una colección de fechas que solo aplicará a este proyecto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCollection} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-3 bg-muted/30 p-4 rounded-xl border flex flex-col items-center">
              <Label className="text-foreground font-semibold mb-2">Selecciona las Fechas</Label>
              <div className="bg-card rounded-md shadow-sm border p-2">
                <Calendar
                  mode="multiple"
                  selected={formDates}
                  onSelect={(dates) => setFormDates(dates as Date[])}
                  className="rounded-md"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Has seleccionado {formDates.length} días.
              </p>
            </div>

            <div className="space-y-5 flex flex-col">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Nombre de la Colección <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Feriados Perú 2026"
                  required
                />
              </div>

              {formDates.length > 0 && (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 border rounded-md p-3 bg-muted/30 flex-1">
                  <Label className="text-sm font-semibold block mb-2 text-muted-foreground">
                    Nombres específicos (Opcional)
                  </Label>
                  {formDates.map((d, i) => {
                    const offset = d.getTimezoneOffset();
                    const adjusted = new Date(d.getTime() - offset * 60 * 1000);
                    const dateStr = adjusted.toISOString().split("T")[0];
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground min-w-[90px] text-center">
                          {dateStr}
                        </span>
                        <Input
                          size={1}
                          className="h-8 text-sm"
                          placeholder={formName || "Nombre..."}
                          value={dateNames[dateStr] || ""}
                          onChange={(e) =>
                            setDateNames((prev) => ({ ...prev, [dateStr]: e.target.value }))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <DialogFooter className="pt-2 mt-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Enlazar Colección Global */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Enlazar Colección Global</DialogTitle>
            <DialogDescription>Añade una colección global existente a tu proyecto.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLinkCollection} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Selecciona la Colección</Label>
              <Select
                value={selectedGlobalCollection}
                onValueChange={setSelectedGlobalCollection}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una colección" />
                </SelectTrigger>
                <SelectContent>
                  {globalCollections.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No hay colecciones globales disponibles
                    </SelectItem>
                  ) : (
                    globalCollections.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.items?.length || 0} fechas)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsLinkModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!selectedGlobalCollection || selectedGlobalCollection === "empty"}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Enlazar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar Asignación de Proyecto */}
      <Dialog
        open={!!pendingAssignment}
        onOpenChange={(open) => {
          if (!open) setPendingAssignment(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Asignar Colección</DialogTitle>
            <DialogDescription>
              Se aplicará esta colección a este proyecto. Al hacer esto, reemplazará a cualquier colección
              asignada previamente en el proyecto. ¿Aceptas?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setPendingAssignment(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmAssignment}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Aceptar y Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Excepción Usuario */}
      <Dialog open={isExceptionFormOpen} onOpenChange={setIsExceptionFormOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Calendario Personalizado (Usuario)</DialogTitle>
            <DialogDescription>
              Selecciona las fechas que este usuario en particular trabajará o descansará fuera del
              calendario normal.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateException} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-3 bg-muted/50 p-4 rounded-lg border border-border flex flex-col items-center">
              <Label className="text-foreground font-semibold mb-2">Fechas de Excepción</Label>
              <div className="bg-card rounded-md shadow-sm border p-2">
                <Calendar
                  mode="multiple"
                  selected={exceptionDates}
                  onSelect={(dates) => setExceptionDates(dates as Date[])}
                  className="rounded-md"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Has seleccionado {exceptionDates.length} días.
              </p>
            </div>
            <div className="space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Motivo de Excepción</Label>
                  <Input
                    value={exceptionName}
                    onChange={(e) => setExceptionName(e.target.value)}
                    placeholder="Ej. Cumpleaños, Permiso..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Tipo de Excepción</Label>
                  <Select value={formType} onValueChange={(v: any) => setFormType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER_INCLUDE">Día Libre (No asiste)</SelectItem>
                      <SelectItem value="USER_EXCLUDE">Día Laborable (Ignora feriado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsExceptionFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Guardar Excepción
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Listar Excepciones */}
      <Dialog
        open={!!exceptionsModalUser}
        onOpenChange={(open) => !open && setExceptionsModalUser(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Días Personalizados</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[400px] overflow-y-auto pr-2">
            <div className="flex flex-col gap-2 p-3 bg-primary/10 border border-border rounded-lg">
              <span className="text-xs font-semibold text-primary">Acciones Rápidas:</span>
              <HolidayImporter onImport={handleImportMemberHolidays} year={year} />
            </div>
            {exceptionsModalUser &&
            filteredExceptions.filter((h) => h.targetId === exceptionsModalUser).length > 0 ? (
              <div className="flex flex-col gap-2">
                {filteredExceptions
                  .filter((h) => h.targetId === exceptionsModalUser)
                  .map((h) => (
                    <div
                      key={h.id}
                      className="flex justify-between items-center p-3 border border-border rounded-lg bg-card"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              h.type === "USER_INCLUDE"
                                ? "bg-primary/10 text-primary"
                                : "bg-rose-500/10 text-rose-500"
                            }`}
                          >
                            {h.type === "USER_INCLUDE" ? "DÍA LIBRE" : "DÍA LABORABLE"}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">{h.date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{h.name}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteException(h.id)}
                      >
                        <X className="w-4 h-4 text-rose-500" />
                      </Button>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay días personalizados.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
