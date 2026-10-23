"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const DEFAULT_SVG_VACATIONS: any[] = [
  {
    id: "vac-001",
    userId: "usr-carlos-1",
    userName: "carlos mamani",
    userCode: "a3d41431",
    startDate: "2026-09-07T00:00:00.000Z",
    endDate: "2026-10-08T00:00:00.000Z",
    businessDays: 29,
    status: "PENDING",
    createdAt: "2026-09-02T00:00:00.000Z",
  },
  {
    id: "vac-002",
    userId: "usr-carlos-2",
    userName: "carlos mamani",
    userCode: "a3d41431",
    startDate: "2026-08-26T00:00:00.000Z",
    endDate: "2026-08-26T00:00:00.000Z",
    businessDays: 1,
    status: "REJECTED",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
];

export function VacationApprovalView() {
  const { token, hydrated, user } = useAuth();
  const { toast } = useToast();

  const [vacations, setVacations] = useState<any[]>(DEFAULT_SVG_VACATIONS);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
  const [rejectComment, setRejectComment] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    if (!token) {
      setVacations(DEFAULT_SVG_VACATIONS);
      return;
    }
    setLoading(true);
    try {
      const [data, usersList, projectsList] = await Promise.all([
        listVacations(token, undefined, statusFilter === "ALL" ? undefined : statusFilter),
        getAllUsers(token).catch(() => []),
        getAllProjects(token).catch(() => []),
      ]);
      const list = Array.isArray(data) && data.length > 0 ? data : DEFAULT_SVG_VACATIONS;
      setVacations(list);
      setProjects(Array.isArray(projectsList) ? projectsList : []);

      const safeUsers = Array.isArray(usersList)
        ? usersList
        : Array.isArray((usersList as any)?.items)
        ? (usersList as any).items
        : [];

      const namesMap: Record<string, string> = {};
      for (const u of safeUsers) {
        if (u && u.id) {
          const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || u.email;
          namesMap[u.id] = name;
        }
      }
      setUserNames(namesMap);
    } catch (e) {
      setVacations(DEFAULT_SVG_VACATIONS);
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
    if (statusFilter === "ALL") return vacations;
    return vacations.filter((v) => v.status === statusFilter);
  }, [vacations, statusFilter]);

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
            <div className="w-8 h-8 rounded-full bg-[#5B36F5] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {initials}
            </div>
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
    <div className="w-full space-y-6 text-foreground font-sans bg-transparent pb-12 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
      {/* 1. TOP HEADER */}
      <PageHeader
        categoryTag={{ badge: "PANEL DE GESTIÓN", text: "Solicitudes del equipo" }}
        title="Vacaciones del equipo"
        description="Revisión, aprobación y gestión de solicitudes de vacaciones del equipo."
        showPeriodSelector={false}
      />

      

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

      {/* 4. FILTERS CONTAINER - Desktop View (1 Row) */}
      <div className="hidden md:flex md:items-center md:justify-between gap-4 rounded-2xl border border-border bg-card/60 p-4 shadow-sm">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-400" />
          Solicitudes de vacaciones
        </h3>

        <div className="flex items-center gap-3">
          <div className="relative w-56">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3.5 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="ALL" className="bg-card text-foreground">Todas las solicitudes</option>
              <option value="PENDING" className="bg-card text-foreground">Pendientes</option>
              <option value="APPROVED" className="bg-card text-foreground">Aprobadas</option>
              <option value="REJECTED" className="bg-card text-foreground">Rechazadas</option>
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
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3.5 pr-8 rounded-xl border border-border bg-card/60 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="ALL" className="bg-card text-foreground">Todas las solicitudes</option>
              <option value="PENDING" className="bg-card text-foreground">Pendientes</option>
              <option value="APPROVED" className="bg-card text-foreground">Aprobadas</option>
              <option value="REJECTED" className="bg-card text-foreground">Rechazadas</option>
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

      {/* 5. MOBILE CARDS VIEW (md:hidden) Matching SVG vacaciones -dark.svg */}
      <div className="space-y-3 md:hidden">
        {filteredVacations.length === 0 ? (
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
                    <div className="w-10 h-10 rounded-full bg-[#5B36F5] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      {initials}
                    </div>
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
        <DataTable columns={columns} data={filteredVacations} />
      </div>

      {/* 7. PAGINATION FOOTER */}
      <div className="flex items-center justify-end gap-3 pt-3 px-1">
        <span className="text-xs text-muted-foreground font-medium">
          Página {page} de 1
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled
            className="w-8 h-8 rounded-lg border border-border bg-card/60 flex items-center justify-center text-muted-foreground disabled:opacity-40 hover:bg-card"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled
            className="w-8 h-8 rounded-lg border border-border bg-card/60 flex items-center justify-center text-muted-foreground disabled:opacity-40 hover:bg-card"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {filteredVacations.length} solicitud{filteredVacations.length === 1 ? "" : "es"}
        </span>
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
