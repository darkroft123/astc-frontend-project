"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, MapPin, Clock, User, Briefcase, XCircle, ArrowLeft, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getGraphQLUrl } from "@/lib/api-host";
import { getAllUsers, getAllProjects } from "@/app/services/project.assistance.service";
import { getDistrictFromCoords } from "@/lib/geocoding";
import { formatUserName, formatAlertType, formatAlertMessage } from "@/lib/formatters";

interface AlertDetailViewProps {
  alertId: string;
}

const GET_ALERT_DETAIL = `
  query getAlertDetail($id: String!) {
    getAlertDetail(id: $id) {
      id
      type
      status
      message
      projectId
      userId
      createdAt
      latitude
      longitude
    }
  }
`;

const APPROVE_ALERT = `
  mutation approveAlert($alertId: String!) {
    approveAlert(alertId: $alertId) {
      id
      status
    }
  }
`;

const CANCEL_ALERT = `
  mutation cancelAlert($alertId: String!) {
    cancelAlert(alertId: $alertId) {
      id
      status
    }
  }
`;

type AlertDetail = {
  id: string;
  type?: string | null;
  status?: string | null;
  message?: string | null;
  projectId?: string | null;
  userId?: string | null;
  createdAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type Message = {
  type: "success" | "error";
  text: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  try {
    const s = value.endsWith("Z") || value.includes("+") ? value : `${value}Z`;
    const date = new Date(s);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("es-PE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch { return value; }
}

export function AlertDetailView({ alertId }: AlertDetailViewProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<Message | null>(null);
  const [userName, setUserName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [district, setDistrict] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (!token) return;

    setIsLoading(true);
    setError("");

    const alertPromise = fetch(getGraphQLUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        query: GET_ALERT_DETAIL,
        variables: { id: alertId },
      }),
    }).then(r => r.json());

    const usersPromise = getAllUsers(token).catch(() => []);
    const projectsPromise = getAllProjects(token).catch(() => []);

    Promise.all([alertPromise, usersPromise, projectsPromise])
      .then(([alertJson, users, projects]) => {
        if (alertJson.errors) {
          throw new Error(alertJson.errors[0]?.message || "Error al obtener la alerta");
        }
        const alertData = alertJson.data?.getAlertDetail;
        setAlert(alertData);

        if (alertData?.userId) {
          const u = Array.isArray(users) ? users.find((x: any) => x.id === alertData.userId) : null;
          const rawName = u ? ([u.firstName, u.lastName].filter(Boolean).join(" ") || u.username) : null;
          setUserName(formatUserName(alertData.userId, rawName ? new Map([[alertData.userId.toLowerCase(), rawName]]) : undefined));
        }

        if (alertData?.projectId && Array.isArray(projects)) {
          const p = projects.find((x: any) => x.id === alertData.projectId);
          if (p) setProjectName(p.name || p.id);
        }

        const isMockOrEmpty =
          alertData?.latitude == null ||
          alertData?.longitude == null ||
          (alertData.latitude === 0 && alertData.longitude === 0) ||
          (alertData.latitude === -12 && alertData.longitude === -77) ||
          (Number.isInteger(alertData.latitude) && Number.isInteger(alertData.longitude));

        if (!isMockOrEmpty && alertData?.latitude != null && alertData?.longitude != null) {
          getDistrictFromCoords(alertData.latitude, alertData.longitude).then(setDistrict);
        } else {
          setDistrict("Ubicación no disponible");
        }
      })
      .catch((err: any) => {
        setError(err.message || "Ocurrió un error inesperado");
        console.error(err);
      })
      .finally(() => setIsLoading(false));

  }, [alertId, token]);

  async function processAlert(action: "approve" | "cancel") {
    if (!token) return;
    setIsProcessing(true);
    setMessage(null);

    try {
      const query = action === "approve" ? APPROVE_ALERT : CANCEL_ALERT;

      const res = await fetch(getGraphQLUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query,
          variables: { alertId },
        }),
      });

      const json = await res.json();

      if (json.errors) {
        setMessage({
          type: "error",
          text: json.errors[0]?.message || `Error al ${action === "approve" ? "aprobar" : "cancelar"} la alerta`
        });
        return;
      }

      setMessage({
        type: "success",
        text: `Alerta ${action === "approve" ? "APROBADA" : "CANCELADA"} correctamente`
      });

      setTimeout(() => {
        router.push("/pm/alertas");
      }, 1200);

    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Error de conexión con el servidor"
      });
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-text-2 text-sm">Cargando detalle de la alerta...</p>
        </div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-card rounded-2xl border border-border shadow-sm">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-ink" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">No se pudo cargar la alerta</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error || "La alerta no existe o no tienes acceso"}</p>
          <Button onClick={() => router.back()} className="mt-4" size="sm">
            ← Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-raised pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Toast */}
        {message && (
          <div className={`fixed top-4 right-4 z-50 px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 text-sm font-medium
            ${message.type === "success" ? "bg-green text-white" : "bg-destructive text-white"}`}>
            {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/pm/alertas">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-text-2 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Volver a Alertas
            </Button>
          </Link>
          <span className="text-xs text-text-4 font-mono">ID: {alert.id.slice(0, 8)}...</span>
        </div>

        {/* Banner de Alerta */}
        <Card className="border-amber/20 bg-amber/10 p-5 rounded-2xl shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-amber/10 p-3 text-amber-ink shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  {formatAlertType(alert.type)}
                </h2>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  alert.status === "PENDING" ? "bg-amber/10 text-amber-ink" : "bg-green/10 text-green-ink"
                }`}>
                  {alert.status === "PENDING" ? "Pendiente" : alert.status === "APPROVED" ? "Aprobado" : alert.status === "CANCELLED" ? "Cancelado" : "Revisado"}
                </span>
              </div>
              <p className="text-sm text-text-2 mt-1 leading-relaxed">
                {formatAlertMessage(alert.message, alert.type)}
              </p>
            </div>
          </div>
        </Card>

        {/* Grid de Información */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="border border-line bg-card rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-4 border-b pb-2">
              Información de la Alerta
            </h3>
            
            <div className="space-y-3.5 text-sm">
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-[11px] text-text-4 font-medium">PROYECTO</p>
                  <p className="font-semibold text-foreground">{projectName || alert.projectId || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-[11px] text-text-4 font-medium">USUARIO</p>
                  <p className="font-semibold text-foreground">{userName || formatUserName(alert.userId)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-text-4 shrink-0" />
                <div>
                  <p className="text-[11px] text-text-4 font-medium">FECHA Y HORA</p>
                  <p className="font-semibold text-foreground">{formatDateTime(alert.createdAt)}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border border-line bg-card rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-4 border-b pb-2">
              Ubicación del Registro
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-red-ink shrink-0" />
                <div>
                  <p className="text-[11px] text-text-4 font-medium">DISTRITO / ZONA</p>
                  <p className="font-semibold text-foreground">{district || "Cargando ubicación..."}</p>
                </div>
              </div>

              {alert.latitude != null && alert.longitude != null && (
                <div className="pt-2">
                  <a
                    href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 text-xs font-medium transition-colors border border-line"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver en Google Maps ({alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)})</span>
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            onClick={() => processAlert("cancel")}
            variant="outline"
            size="sm"
            className="px-5 border-red/20 hover:bg-red/10 text-red-ink hover:text-red-ink text-xs font-medium"
            disabled={isProcessing}
          >
            <XCircle className="mr-1.5 h-4 w-4" />
            Cancelar Alerta
          </Button>

          <Button
            onClick={() => processAlert("approve")}
            size="sm"
            className="px-6 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium"
            disabled={isProcessing}
          >
            <CheckCircle className="mr-1.5 h-4 w-4" />
            {isProcessing ? "Procesando..." : "Aprobar Alerta"}
          </Button>
        </div>
      </div>
    </div>
  );
}
