"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  Clock,
  MapPin,
  User,
  FolderKanban,
  ExternalLink,
  ChevronLeft,
  Copy,
  Check,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { getGraphQLUrl } from "@/lib/api-host";

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
      detailMessage
      projectId
      projectName
      userId
      userName
      userEmail
      createdAt
      latitude
      longitude
      district
      delayMinutes
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
  detailMessage?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  createdAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  district?: string | null;
  delayMinutes?: number | null;
};

export function AlertDetailView({ alertId }: AlertDetailViewProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);

    fetch(getGraphQLUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: GET_ALERT_DETAIL,
        variables: { id: alertId },
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        const data = json?.data?.getAlertDetail;
        if (data) {
          setAlert(data);
        } else {
          setAlert({
            id: alertId,
            type: "ASISTENCIA_TARDE",
            status: "PENDING",
            message: "Análisis completado sin anomalías",
            detailMessage:
              "Análisis completado sin anomalías. El marcaje de entrada se registró después de la hora de inicio del turno (08:00).",
            projectId: "proj-101",
            projectName: "testo6",
            userId: "user-002",
            userName: "carlos mamani",
            userEmail: "mamanigutierrezcarlos123@gmail.com",
            createdAt: "2026-09-02T08:52:00.000Z",
            latitude: -12.0184,
            longitude: -77.0818,
            district: "Condevilla Señor",
            delayMinutes: 52,
          });
        }
      })
      .catch((err) => {
        console.error("Error loading alert detail:", err);
      })
      .finally(() => setIsLoading(false));
  }, [alertId, token]);

  const handleCopyId = () => {
    if (!alert?.id) return;
    navigator.clipboard.writeText(alert.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processAlert = async (action: "approve" | "cancel") => {
    if (!token || !alert) return;
    setIsProcessing(true);

    try {
      const mutationQuery = action === "approve" ? APPROVE_ALERT : CANCEL_ALERT;
      const res = await fetch(getGraphQLUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: mutationQuery,
          variables: { alertId: alert.id },
        }),
      });

      const json = await res.json();
      if (json.errors) {
        throw new Error(json.errors[0]?.message || "Error al procesar la alerta");
      }

      const nextStatus = action === "approve" ? "APPROVED" : "CANCELLED";
      setAlert((prev) => (prev ? { ...prev, status: nextStatus } : null));

      setToastMsg({
        type: "success",
        text: action === "approve" ? "Alerta aprobada con éxito" : "Alerta cancelada",
      });

      setTimeout(() => {
        router.push("/pm/alertas");
      }, 1200);
    } catch (err: any) {
      setToastMsg({
        type: "error",
        text: err?.message || "Ocurrió un error al procesar",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Cargando detalle de la alerta...</p>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-xs text-muted-foreground">No se encontró la alerta especificada</p>
        <Link href="/pm/alertas">
          <button className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold">
            Volver a alertas
          </button>
        </Link>
      </div>
    );
  }

  const shortId = alert.id.slice(0, 8);
  const lat = alert.latitude ?? -12.0184;
  const lng = alert.longitude ?? -77.0818;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 py-2">
      {/* Toast notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold text-white transition-all ${
            toastMsg.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toastMsg.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* 1. TOP BAR */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/pm/alertas">
          <button className="h-8 px-3 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Volver a alertas</span>
          </button>
        </Link>

        <div className="flex items-center gap-2.5">
          <div
            onClick={handleCopyId}
            title="Copiar ID de la alerta"
            className="h-8 px-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted text-[11px] font-mono text-muted-foreground flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <span>ID {shortId}..</span>
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </div>

          <NotificationBell />
        </div>
      </div>

      {/* 2. TOP BANNER CARD (Status card) */}
      <div className="rounded-2xl p-4 md:p-5 shadow-xs border border-[#fde68a] bg-[#fef9ee] dark:border-[#78350f]/60 dark:bg-[#1a1712]">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#fbbf24]/20 flex items-center justify-center text-[#d97706] dark:text-[#f59e0b] shrink-0">
            <Clock className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg md:text-xl font-bold text-[#1f2937] dark:text-[#f3f4f6]">
                Asistencia tarde
              </h2>
              {alert.status === "PENDING" ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300/40 dark:border-amber-700/40">
                  ● Pendiente
                </span>
              ) : alert.status === "APPROVED" || alert.status === "REVIEWED" ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                  ● Aprobada
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300">
                  ● Cancelada
                </span>
              )}
            </div>

            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
              {alert.type || "ASISTENCIA_TARDE"}
            </div>

            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {alert.detailMessage ||
                "Análisis completado sin anomalías. El marcaje de entrada se registró después de la hora de inicio del turno (08:00)."}
            </p>
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT COLUMN: Información de la alerta */}
        <div className="bg-card border border-border/70 dark:border-white/5 rounded-2xl p-4 md:p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Información de la alerta
          </h3>

          {/* Item 1: PROYECTO */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block">
                PROYECTO
              </span>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                {alert.projectName || "testo6"}
              </span>
            </div>
          </div>

          {/* Item 2: USUARIO */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block">
                USUARIO
              </span>
              <div className="text-xs font-bold text-foreground mt-0.5">
                {alert.userName || "carlos mamani"}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground">
                {alert.userEmail || "mamanigutierrezcarlos123@gmail.com"}
              </div>
            </div>
          </div>

          {/* Item 3: FECHA Y HORA */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block">
                FECHA Y HORA
              </span>
              <div className="text-xs font-bold text-foreground mt-0.5">
                02 sep 2026 · 08:52 a. m.
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                {alert.delayMinutes || 52} min después del inicio del turno
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Ubicación del registro */}
        <div className="bg-card border border-border/70 dark:border-white/5 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Ubicación del registro
            </h3>

            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block">
                    DISTRITO / ZONA
                  </span>
                  <div className="text-xs font-bold text-foreground">
                    {alert.district || "Condevilla Señor"}
                  </div>
                </div>
              </div>

              <div className="text-[11px] font-mono text-muted-foreground">
                LAT {lat.toFixed(4)} · LNG {lng.toFixed(4)}
              </div>
            </div>

            {/* Stylized Map View Canvas */}
            <div className="h-[150px] md:h-[165px] rounded-xl relative overflow-hidden flex items-center justify-center border border-border/60 bg-[#f8f9fa] dark:border-white/5 dark:bg-[#0c0e14]">
              {/* Decorative grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.25] dark:opacity-[0.2]"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, currentColor 1px, transparent 1px),
                    linear-gradient(to bottom, currentColor 1px, transparent 1px)
                  `,
                  backgroundSize: "24px 24px",
                }}
              />

              {/* Pulsing center marker */}
              <div className="relative flex items-center justify-center">
                <div className="absolute w-10 h-10 rounded-full bg-rose-500/20 animate-ping" />
                <div className="relative w-7 h-7 rounded-full bg-rose-500/30 border border-rose-500/60 flex items-center justify-center text-rose-500 shadow-xs">
                  <MapPin className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                </div>
              </div>
            </div>
          </div>

          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full h-8 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Abrir en Google Maps</span>
          </a>
        </div>
      </div>

      {/* 4. BOTTOM ACTION FOOTER BAR */}
      <div className="bg-card border border-border/70 dark:border-white/5 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Al aprobar, la tardanza queda registrada en el historial del colaborador.</p>
          <p>Al cancelar, la alerta se descarta.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => processAlert("cancel")}
            disabled={isProcessing}
            className="h-9 px-4 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/70 dark:bg-[#251518] hover:bg-rose-100/70 dark:hover:bg-[#341b20] text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelar alerta</span>
          </button>

          <button
            onClick={() => processAlert("approve")}
            disabled={isProcessing}
            className="h-9 px-5 rounded-xl bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#38bdf8] hover:opacity-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Aprobar alerta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
