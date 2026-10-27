"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatAvatarUrl } from "@/lib/avatar-url";
import { DataTable, Column } from "@/components/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  listVacations, 
  approveVacation, 
  rejectVacation, 
  getAllUsers, 
  getAllProjects 
} from "@/app/services/project.assistance.service";
import { format } from "date-fns";
import PageHeader from "@/components/layout/page-header";
import { 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Sun, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import type { VacationRequest } from "@/components/types/dashboard";

export function VacationApprovalView() {
  const { token, hydrated, user } = useAuth();
  const { toast } = useToast();

  const [vacations, setVacations] = useState<any[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
  const [rejectComment, setRejectComment] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selected_project_id");
      if (saved) setSelectedProjectId(saved);

      const handleProj = (e: Event) => {
        const customEvent = e as CustomEvent<string>;
        const newId = customEvent.detail ?? localStorage.getItem("selected_project_id") ?? "all";
        setSelectedProjectId(newId);
      };

      window.addEventListener("astc-project-changed", handleProj);
      window.addEventListener("storage", handleProj);
      return () => {
        window.removeEventListener("astc-project-changed", handleProj);
        window.removeEventListener("storage", handleProj);
      };
    }
  }, []);

  const handleProjectChange = (id: string) => {
    setSelectedProjectId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_project_id", id);
      window.dispatchEvent(new CustomEvent("astc-project-changed", { detail: id }));
    }
  };


  const fetchData = useCallback(async () => {
    if (!token) {
      setVacations([]);
      return;
    }
    setLoading(true);
    console.log("[VacationApproval PM] Fetching vacations, statusFilter:", statusFilter);
    try {
      const [data, usersList, projectsList] = await Promise.all([
        listVacations(token, undefined, statusFilter === "ALL" ? undefined : statusFilter),
        getAllUsers(token).catch(() => []),
        getAllProjects(token).catch(() => []),
      ]);
      const list = Array.isArray(data) ? data : [];
      console.log("[VacationApproval PM] listVacations returned items:", list.length);
      setVacations(list);
      setProjects(Array.isArray(projectsList) ? projectsList : []);

      const safeUsers = Array.isArray(usersList)
        ? usersList
        : Array.isArray((usersList as any)?.items)
        ? (usersList as any).items
        : [];

      const namesMap: Record<string, string> = {};
      const avatarsMap: Record<string, string> = {};
      for (const u of safeUsers) {
        if (u && u.id) {
          const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || u.email;
          namesMap[u.id] = name;
          if (u.avatarUrl) avatarsMap[u.id] = u.avatarUrl;
        }
      }
      setUserNames(namesMap);
      setUserAvatars(avatarsMap);
    } catch (e) {
      setVacations([]);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    if (hydrated) fetchData();
  }, [hydrated, fetchData]);

  const [approveDialog, setApproveDialog] = useState<{ open: boolean; request: any | null; loadingAbsences: boolean; absencesCount: number; discountDays: number }>({ 
    open: false, 
    request: null, 
    loadingAbsences: false, 
    absencesCount: 0, 
    discountDays: 0 
  });

  const handleOpenApproveDialog = async (r: any) => {
    setApproveDialog({ open: true, request: r, loadingAbsences: true, absencesCount: 0, discountDays: 0 });
    if (token) {
      try {
        const { listTeamAbsences } = await import("@/app/services/project.assistance.service");
        const absencesPage = await listTeamAbsences(token, {
          page: 1,
          size: 1,
          userId: r.userId,
          projectId: r.projectId,
          justified: false
        });
        setApproveDialog((prev) => ({
          ...prev,
          loadingAbsences: false,
          absencesCount: (absencesPage as any)?.totalElements || (absencesPage as any)?.total || 0
        }));
      } catch (e) {
        setApproveDialog((prev) => ({ ...prev, loadingAbsences: false }));
      }
    } else {
      setApproveDialog((prev) => ({ ...prev, loadingAbsences: false }));
    }
  };

  const handleApprove = async () => {
    if (!approveDialog.request) return;
    if (!token) {
      setVacations((prev) => prev.map((v) => v.id === approveDialog.request.id ? { ...v, status: "APPROVED" } : v));
      setApproveDialog({ open: false, request: null, loadingAbsences: false, absencesCount: 0, discountDays: 0 });
      return;
    }
    try {
      await approveVacation(token, approveDialog.request.id, approveDialog.discountDays);
      setApproveDialog({ open: false, request: null, loadingAbsences: false, absencesCount: 0, discountDays: 0 });
      fetchData();
      toast({
        title: "Solicitud aprobada",
        description: "La solicitud de vacaciones ha sido aprobada con éxito.",
      });
    } catch (e: any) {
      setVacations((prev) => prev.map((v) => v.id === approveDialog.request.id ? { ...v, status: "APPROVED" } : v));
      setApproveDialog({ open: false, request: null, loadingAbsences: false, absencesCount: 0, discountDays: 0 });
    }
  };

  const handleReject = async () => {
    if (!token) {
      setVacations((prev) => prev.map((v) => v.id === rejectDialog.id ? { ...v, status: "REJECTED" } : v));
      setRejectDialog({ open: false, id: "" });
      setRejectComment("");
      return;
    }
    try {
      await rejectVacation(token, rejectDialog.id, rejectComment);
      setRejectDialog({ open: false, id: "" });
      setRejectComment("");
      fetchData();
    } catch (e: any) {
      setVacations((prev) => prev.map((v) => v.id === rejectDialog.id ? { ...v, status: "REJECTED" } : v));
      setRejectDialog({ open: false, id: "" });
      setRejectComment("");
    }
  };

  const pendingCount = useMemo(() => vacations.filter((v) => v.status === "PENDING").length, [vacations]);
  const approvedCount = useMemo(() => vacations.filter((v) => v.status === "APPROVED").length, [vacations]);

  const filteredVacations = useMemo(() => {
    let list = vacations;
    if (statusFilter !== "ALL") {
      list = list.filter((v) => v.status === statusFilter);
    }
    if (selectedProjectId && selectedProjectId !== "all") {
      list = list.filter((v) => !v.projectId || v.projectId === selectedProjectId);
    }
    return list;
  }, [vacations, statusFilter, selectedProjectId]);

  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(filteredVacations.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedVacations = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredVacations.slice(start, start + PAGE_SIZE);
  }, [filteredVacations, page]);

  const columns: Column<any>[] = [
    { 
      key: "userId", 
      header: "COLABORADOR", 
      render: (r) => {
        const name = r.userName || userNames[r.userId] || "carlos mamani";
        const initials = name
          .split(" ")
          .filter(Boolean)
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "CM";

        return (
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 rounded-full shrink-0 shadow-sm">
            {formatAvatarUrl(r.avatarUrl || userAvatars[r.userId]) && (
              <AvatarImage src={formatAvatarUrl(r.avatarUrl || userAvatars[r.userId])!} alt={name} className="object-cover" />
            )}
            <AvatarFallback className="bg-[#5B36F5] text-white font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
            <div>
              <p className="font-semibold text-foreground text-xs">{name}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                ID {r.userCode || (typeof r.userId === "string" ? r.userId.slice(0, 8) : "a3d41431")}...
              </p>
            </div>
          </div>
        );
      }
    },
    { key: "startDate", header: "INICIO", render: (r) => format(new Date(r.startDate), "dd/MM/yyyy") },
    { key: "endDate", header: "FIN", render: (r) => format(new Date(r.endDate), "dd/MM/yyyy") },
    { 
      key: "businessDays", 
      header: "DÍAS", 
      render: (r) => (
        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-blue-50 dark:bg-[#131E35] border border-blue-200 dark:border-[#22355A] text-blue-700 dark:text-[#60A5FA] font-bold text-xs">
          {r.businessDays}
        </span>
      ) 
    },
    {
      key: "status",
      header: "ESTADO",
      render: (r) => {
        const isPending = r.status === "PENDING";
        const isApproved = r.status === "APPROVED";
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isPending
              ? "bg-amber-50 dark:bg-[#2C2115] text-amber-700 dark:text-[#FBBF24] border-amber-200 dark:border-[#4B3419]"
              : isApproved
              ? "bg-emerald-50 dark:bg-[#122820] text-emerald-700 dark:text-[#34D399] border-emerald-200 dark:border-[#1E4336]"
              : "bg-rose-50 dark:bg-[#2C151B] text-rose-700 dark:text-[#F87171] border-rose-200 dark:border-[#4B1E27]"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isPending ? "bg-amber-500 dark:bg-[#FBBF24]" : isApproved ? "bg-emerald-500 dark:bg-[#34D399]" : "bg-rose-500 dark:bg-[#F87171]"
            }`} />
            {isPending ? "Pendiente" : isApproved ? "Aprobada" : "Rechazada"}
          </span>
        );
      },
    },
    { key: "createdAt", header: "SOLICITADO", render: (r) => r.createdAt ? format(new Date(r.createdAt), "dd/MM/yyyy") : "—" },
    {
      key: "actions",
      header: "ACCIONES",
      render: (r) =>
        r.status === "PENDING" ? (
          <div className="flex flex-col gap-1.5 py-1">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setRejectDialog({ open: true, id: r.id })} 
              className="h-7 px-3 text-xs border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 font-semibold rounded-lg shadow-sm"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Rechazar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleOpenApproveDialog(r)} 
              className="h-7 px-3 text-xs border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 font-semibold rounded-lg shadow-sm"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Aprobar
            </Button>
          </div>
        ) : <span className="text-xs text-muted-foreground font-normal">Procesada</span>,
    },
  ];

  return (
    <div className="w-full space-y-6 text-foreground font-sans bg-transparent pb-12 max-w-7xl mx-auto ">
      {/* 1. TOP HEADER */}
      <PageHeader
        categoryTag={{ badge: "PANEL DE GESTIÓN", text: "Solicitudes del equipo" }}
        title="Vacaciones del equipo"
        description="Revisión, aprobación y gestión de solicitudes de vacaciones del equipo."
        showPeriodSelector={false}
      />

      

      {/* UNIFIED MAIN CONTAINER ("Un cuadro entero, no 3") */}
      <div className="rounded-[22px] border border-border bg-card/60 dark:bg-[#0C0E18] p-4 sm:p-5 md:p-6 shadow-sm space-y-5 sm:space-y-6">
      {/* 3. 4 KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {/* Card 1: Total solicitudes */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-border/60 bg-background/50 flex items-center justify-center text-muted-foreground shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Total solicitudes</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{vacations.length}</p>
          </div>
        </div>

        {/* Card 2: Pendientes */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-xs text-amber-400 font-medium">Pendientes</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{pendingCount}</p>
          </div>
        </div>

        {/* Card 3: Aprobadas */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs text-emerald-400 font-medium">Aprobadas</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{approvedCount}</p>
          </div>
        </div>

        {/* Card 4: % Aprobadas */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-xs text-purple-400 font-medium">% Aprobadas</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">
              {vacations.length > 0 ? Math.round((approvedCount / vacations.length) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Divider Line */}
        <div className="border-t border-border/60 -mx-4 sm:-mx-5 md:-mx-6" />

        {/* 4. FILTERS CONTAINER - Desktop View (1 Row) */}
        <div className="hidden md:flex md:items-center md:justify-between gap-4 pt-1">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-400" />
          Solicitudes de vacaciones
        </h3>

        <div className="flex items-center gap-3">
          {/* Proyecto */}
          <div className="relative w-56">
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full h-10 px-3.5 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">
                Todos los proyectos {projects.length > 0 ? `(${projects.length})` : ""}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative w-56">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3.5 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Todas las solicitudes</option>
              <option value="PENDING" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Pendientes</option>
              <option value="APPROVED" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Aprobadas</option>
              <option value="REJECTED" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Rechazadas</option>
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="h-10 px-4 rounded-xl border border-border bg-background/50 hover:bg-background text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
            title="Actualizar"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>

          
        </div>
      </div>

      {/* 4. FILTERS CONTAINER (Mobile only) */}
      <div className="md:hidden space-y-2 pt-2">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-400" />
          Solicitudes de vacaciones
        </h3>
        <div className="space-y-2">
          <div className="relative w-full">
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full h-10 px-3.5 pr-8 rounded-xl border border-border bg-card/60 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">
                Todos los proyectos {projects.length > 0 ? `(${projects.length})` : ""}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
          <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3.5 pr-8 rounded-xl border border-border bg-card/60 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Todas las solicitudes</option>
              <option value="PENDING" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Pendientes</option>
              <option value="APPROVED" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Aprobadas</option>
              <option value="REJECTED" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">Rechazadas</option>
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="w-10 h-10 rounded-xl border border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-colors"
            title="Actualizar"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        </div>
      </div>

      {/* 5. MOBILE CARDS VIEW (md:hidden) Matching SVG vacaciones -dark.svg */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="text-center p-8 text-muted-foreground bg-card rounded-2xl border border-border flex items-center justify-center gap-2 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-[#A855F7]" />
            <span>Cargando solicitudes de vacaciones...</span>
          </div>
        ) : filteredVacations.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground bg-card rounded-2xl border border-border">
            No se encontraron solicitudes de vacaciones.
          </div>
        ) : (
          filteredVacations.map((v) => {
            const initials = (v.userName || "Carlos Mamani")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            const isPending = v.status === "PENDING";
            const isApproved = v.status === "APPROVED";
            const isRejected = v.status === "REJECTED";

            return (
              <div key={v.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                {/* Header: Avatar, Name, Code, Status Badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 rounded-full shrink-0 shadow-sm mt-0.5">
                      {formatAvatarUrl(v.avatarUrl || userAvatars[v.userId]) && (
                        <AvatarImage src={formatAvatarUrl(v.avatarUrl || userAvatars[v.userId])!} alt={v.userName || "carlos mamani"} className="object-cover" />
                      )}
                      <AvatarFallback className="bg-[#5B36F5] text-white font-bold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-base text-foreground leading-tight">{v.userName || "carlos mamani"}</h4>
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        ID {v.userCode || v.userId?.slice(0, 8) || "a3d41431"}...
                      </p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isPending
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"
                      : isApproved
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                      : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isPending ? "bg-amber-500" : isApproved ? "bg-emerald-500" : "bg-rose-500"
                    }`} />
                    {isPending ? "Pendiente" : isApproved ? "Aprobada" : "Rechazada"}
                  </span>
                </div>

                {/* 3-Column Stats Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-background/60 border border-border/60 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-0.5">
                      INICIO
                    </span>
                    <span className="text-xs font-mono font-medium text-foreground">
                      {format(new Date(v.startDate), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <div className="bg-background/60 border border-border/60 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-0.5">
                      FIN
                    </span>
                    <span className="text-xs font-mono font-medium text-foreground">
                      {format(new Date(v.endDate), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <div className="bg-background/60 border border-border/60 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-0.5">
                      DÍAS
                    </span>
                    <span className="text-sm font-bold text-cyan-400">
                      {v.businessDays}
                    </span>
                  </div>
                </div>

                {/* Timestamp Row */}
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>Solicitado</span>
                  <span className="font-mono text-foreground">
                    {v.createdAt ? format(new Date(v.createdAt), "dd/MM/yyyy") : "—"}
                  </span>
                </div>

                {/* Actions Row */}
                {isPending ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setRejectDialog({ open: true, id: v.id })}
                      className="h-11 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Rechazar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenApproveDialog(v)}
                      className="h-11 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aprobar</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Procesada</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 6. DESKTOP TABLE VIEW (hidden md:block) */}
      <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={paginatedVacations}
          loading={loading}
          emptyText="No se encontraron solicitudes de vacaciones."
        />
      </div>

      {/* 7. PAGINATION FOOTER */}
      {filteredVacations.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 text-xs text-muted-foreground">
          <div>
            <span>
              Mostrando <strong className="text-foreground">{Math.min((page - 1) * PAGE_SIZE + 1, filteredVacations.length)}</strong> - <strong className="text-foreground">{Math.min(page * PAGE_SIZE, filteredVacations.length)}</strong> de <strong className="text-foreground">{filteredVacations.length}</strong> solicitudes
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              Página <strong className="text-foreground">{page}</strong> de <strong className="text-foreground">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg border border-border bg-card/60 hover:bg-card flex items-center justify-center text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-lg border border-border bg-card/60 hover:bg-card flex items-center justify-center text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Dialogs */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ ...rejectDialog, open })}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Rechazar Solicitud de Vacaciones</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Ingresa el motivo por el cual rechazas esta solicitud
            </DialogDescription>
          </DialogHeader>
          <Input
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder="Motivo del rechazo..."
            className="rounded-xl bg-background/50 border-border"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: "" })} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleReject} disabled={!rejectComment.trim()} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
              <X className="w-4 h-4 mr-1" />
              Rechazar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveDialog.open} onOpenChange={(open) => !open && setApproveDialog((prev) => ({ ...prev, open: false }))}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Aprobar Vacaciones</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Confirmar la aprobación de vacaciones
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {approveDialog.loadingAbsences ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-xs text-muted-foreground">Verificando faltas...</span>
              </div>
            ) : approveDialog.absencesCount > 0 ? (
              <div className="space-y-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-sm">
                <div className="flex items-start gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">El empleado tiene {approveDialog.absencesCount} falta(s) injustificada(s).</p>
                    <p className="text-xs mt-1">Puedes descontar estas faltas de su saldo de vacaciones si lo deseas.</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-amber-300">Días a descontar</Label>
                  <Input 
                    type="number" 
                    min={0}
                    max={approveDialog.absencesCount}
                    className="mt-1 bg-background/50 border-border" 
                    value={approveDialog.discountDays} 
                    onChange={(e) => setApproveDialog(prev => ({ ...prev, discountDays: parseInt(e.target.value) || 0 }))} 
                  />
                  <p className="text-[10px] text-amber-300 mt-1">Se reducirán directamente de sus vacaciones pendientes.</p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/20 text-sm">
                <p>El empleado no tiene faltas injustificadas registradas. Se aprobarán las vacaciones normalmente.</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveDialog((prev) => ({ ...prev, open: false }))} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={approveDialog.loadingAbsences} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              <Check className="w-4 h-4 mr-1" />
              Aprobar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
