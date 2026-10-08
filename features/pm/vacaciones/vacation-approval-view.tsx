"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { listVacations, approveVacation, rejectVacation, getAllUsers, getAllProjects, getUserById } from "@/app/services/project.assistance.service";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import { Loader2, CheckCircle2, Ban, Clock, Sun, RefreshCw, XCircle, TrendingUp, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { VacationRequest, VacationBalance } from "@/components/types/dashboard";

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-muted/50 text-zinc-500 border-border",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
};

export function VacationApprovalView() {
  const { token, hydrated, user } = useAuth();
  const { toast } = useToast();

  const [vacations, setVacations] = useState<VacationRequest[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
  const [rejectComment, setRejectComment] = useState("");

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [data, usersList, projectsList] = await Promise.all([
        listVacations(token, undefined, statusFilter === "ALL" ? undefined : statusFilter),
        getAllUsers(token).catch(() => []),
        getAllProjects(token).catch(() => []),
      ]);
      setVacations(data || []);
      setProjects(projectsList || []);

      const namesMap: Record<string, string> = {};
      for (const u of usersList || []) {
        if (u.id) {
          const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || u.email;
          namesMap[u.id] = name;
        }
      }
      setUserNames(namesMap);
    } catch (e) {
      console.error("Error fetching vacations", e);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    if (hydrated) fetchData();
  }, [hydrated, fetchData]);

  const [approveDialog, setApproveDialog] = useState<{ open: boolean; request: VacationRequest | null; loadingAbsences: boolean; absencesCount: number; discountDays: number }>({ 
    open: false, 
    request: null, 
    loadingAbsences: false, 
    absencesCount: 0, 
    discountDays: 0 
  });

  const handleOpenApproveDialog = async (r: VacationRequest) => {
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
          absencesCount: absencesPage.totalElements || 0
        }));
      } catch (e) {
        console.error("Error loading absences", e);
        setApproveDialog((prev) => ({ ...prev, loadingAbsences: false }));
      }
    }
  };

  const handleApprove = async () => {
    if (!token || !approveDialog.request) return;
    try {
      await approveVacation(token, approveDialog.request.id, approveDialog.discountDays);
      setApproveDialog({ open: false, request: null, loadingAbsences: false, absencesCount: 0, discountDays: 0 });
      fetchData();
      toast({
        title: "Solicitud aprobada",
        description: "La solicitud de vacaciones ha sido aprobada con éxito.",
      });
    } catch (e: any) {
      toast({
        title: "Error al aprobar",
        description: e.message || "No se pudo aprobar la solicitud",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!token) return;
    try {
      await rejectVacation(token, rejectDialog.id, rejectComment);
      setRejectDialog({ open: false, id: "" });
      setRejectComment("");
      fetchData();
    } catch (e: any) {
      toast({
        title: "Error al rechazar",
        description: e.message || "No se pudo rechazar la solicitud",
        variant: "destructive",
      });
    }
  };

  const columns: Column<VacationRequest>[] = [
    { 
      key: "userId", 
      header: "COLABORADOR", 
      render: (r) => (
        <div>
          <p className="font-semibold text-foreground text-xs">{userNames[r.userId] || `Usuario: ${r.userId.slice(0, 8)}`}</p>
          <p className="text-[10px] font-mono text-muted-foreground">ID: {r.userId.slice(0, 8)}...</p>
        </div>
      )
    },
    { key: "startDate", header: "INICIO", render: (r) => format(new Date(r.startDate), "dd/MM/yyyy") },
    { key: "endDate", header: "FIN", render: (r) => format(new Date(r.endDate), "dd/MM/yyyy") },
    { key: "businessDays", header: "DÍAS", render: (r) => <span className="font-semibold">{r.businessDays === 1 ? `${r.businessDays} día` : `${r.businessDays} días`}</span> },
    {
      key: "status",
      header: "ESTADO",
      render: (r) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyles[r.status] || statusStyles.PENDING}`}>
          {statusLabels[r.status] || r.status}
        </span>
      ),
    },
    { key: "createdAt", header: "SOLICITADO", render: (r) => r.createdAt ? format(new Date(r.createdAt), "dd/MM/yyyy") : "—" },
    {
      key: "actions",
      header: "ACCIONES",
      render: (r) =>
        r.status === "PENDING" ? (
          <div className="flex items-center gap-1.5">
            <Button size="sm" onClick={() => handleOpenApproveDialog(r)} className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Aprobar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRejectDialog({ open: true, id: r.id })} className="h-7 px-2.5 text-xs border-red-200 text-red-600 hover:bg-red-50 rounded-lg">
              <Ban className="w-3.5 h-3.5 mr-1" />
              Rechazar
            </Button>
          </div>
        ) : <span className="text-xs text-muted-foreground">Procesado</span>,
    },
  ];

  const pendingCount = useMemo(() => vacations.filter((v) => v.status === "PENDING").length, [vacations]);
  const approvedCount = useMemo(() => vacations.filter((v) => v.status === "APPROVED").length, [vacations]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-5 py-5">

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b pb-4 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vacaciones del Equipo</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Revisión, aprobación y gestión de solicitudes de vacaciones del equipo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-8 rounded-lg">
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          <SubMetricCard label="TOTAL SOLICITUDES" value={vacations.length} icon={<Clock className="w-5 h-5" />} />
          <SubMetricCard label="PENDIENTES" value={pendingCount} color="amber" icon={<Sun className="w-5 h-5" />} />
          <SubMetricCard label="APROBADAS" value={approvedCount} color="green" icon={<CheckCircle2 className="w-5 h-5" />} />
          <SubMetricCard label="% APROBACIÓN" value={`${vacations.length > 0 ? Math.round((approvedCount / vacations.length) * 100) : 0}%`} color="blue" icon={<TrendingUp className="w-5 h-5" />} />
        </div>

        <Card className="mt-5 border-border rounded-xl">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              Solicitudes de Vacaciones
            </CardTitle>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-border rounded-lg px-2.5 py-1.5 text-zinc-700 bg-white font-medium"
            >
              <option value="ALL">Todas las Solicitudes</option>
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="REJECTED">Rechazadas</option>
            </select>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : vacations.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm">
                <Sun className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                No hay solicitudes de vacaciones registradas
              </div>
            ) : (
              <DataTable columns={columns} data={vacations} />
            )}
          </CardContent>
        </Card>

      </div>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ ...rejectDialog, open })}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud de Vacaciones</DialogTitle>
            <DialogDescription>
              Ingresa el motivo por el cual rechazas esta solicitud
            </DialogDescription>
          </DialogHeader>
          <Input
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder="Motivo del rechazo..."
            className="rounded-lg"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: "" })} className="rounded-lg">
              Cancelar
            </Button>
            <Button onClick={handleReject} disabled={!rejectComment.trim()} className="bg-red-600 hover:bg-red-700 text-white rounded-lg">
              <Ban className="w-4 h-4 mr-1" />
              Rechazar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveDialog.open} onOpenChange={(open) => !open && setApproveDialog((prev) => ({ ...prev, open: false }))}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Aprobar Vacaciones</DialogTitle>
            <DialogDescription>
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
              <div className="space-y-3 bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm">
                <div className="flex items-start gap-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-semibold">El empleado tiene {approveDialog.absencesCount} falta(s) injustificada(s).</p>
                    <p className="text-xs mt-1">Puedes descontar estas faltas de su saldo de vacaciones si lo deseas.</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-amber-900">Días a descontar</Label>
                  <Input 
                    type="number" 
                    min={0}
                    max={approveDialog.absencesCount}
                    className="mt-1 bg-white" 
                    value={approveDialog.discountDays} 
                    onChange={(e) => setApproveDialog(prev => ({ ...prev, discountDays: parseInt(e.target.value) || 0 }))} 
                  />
                  <p className="text-[10px] text-amber-700 mt-1">Se reducirán directamente de sus vacaciones pendientes.</p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 text-sm">
                <p>El empleado no tiene faltas injustificadas registradas. Se aprobarán las vacaciones normalmente.</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveDialog((prev) => ({ ...prev, open: false }))} className="rounded-lg">
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={approveDialog.loadingAbsences} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Aprobar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
