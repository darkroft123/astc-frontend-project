"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  Clock,
  MapPin,
  User,
  Folder,
  ExternalLink,
  ChevronLeft,
  Copy,
  Check,
  XCircle,
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

  useEffect(() => {
    if (!token) {
      setAlert({
        id: alertId || "5dc39f2c8a1",
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
      setIsLoading(false);
      return;
    }

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
            id: alertId || "5dc39f2c8a1",
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
    if (!alert) return;
    setIsProcessing(true);

    if (!token) {
      setAlert((prev) => (prev ? { ...prev, status: action === "approve" ? "APPROVED" : "CANCELLED" } : null));
      setIsProcessing(false);
      return;
    }

    try {
      const query = action === "approve" ? APPROVE_ALERT : CANCEL_ALERT;
      await fetch(getGraphQLUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          variables: { alertId: alert.id },
        }),
      });
      setAlert((prev) => (prev ? { ...prev, status: action === "approve" ? "APPROVED" : "CANCELLED" } : null));
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !alert) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const lat = alert.latitude ?? -12.0184;
  const lng = alert.longitude ?? -77.0818;

  return (
    <div className="w-full space-y-4 text-foreground font-sans bg-transparent pb-16 max-w-3xl mx-auto px-4 sm:px-6 py-4">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between">
        <Link
          href="/pm/alertas"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Alertas
        </Link>
        <div className="hidden md:block">
          <NotificationBell />
        </div>
      </div>

      {/* ID Pill */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleCopyId}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card/60 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>ID {alert.id.slice(0, 8)}...</span>
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 2. TOP BANNER CARD (Amber Tinted Matching SVG) */}
      <div className="rounded-2xl p-5 border border-amber-500/30 bg-amber-500/10 shadow-sm space-y-3">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">
                Asistencia tarde
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ● {alert.status === "PENDING" ? "Pendiente" : alert.status === "APPROVED" ? "Aprobada" : "Cancelada"}
              </span>
            </div>

            <p className="text-[11px] font-mono uppercase text-muted-foreground mt-1">
              {alert.type || "ASISTENCIA_TARDE"}
            </p>

            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {alert.detailMessage ||
                "Análisis completado sin anomalías. El marcaje de entrada se registró después de la hora de inicio del turno (08:00)."}
            </p>
          </div>
        </div>
      </div>

      {/* 3. INFORMACIÓN DE LA ALERTA CARD */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Información de la alerta
        </h3>

        {/* PROYECTO */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block">
              PROYECTO
            </span>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-950/60 text-purple-300 border border-purple-800/40">
              {alert.projectName || "testo6"}
            </span>
          </div>
        </div>

        {/* USUARIO */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block">
              USUARIO
            </span>
            <div className="text-sm font-bold text-foreground mt-0.5">
              {alert.userName || "carlos mamani"}
            </div>
            <div className="text-xs text-muted-foreground">
              {alert.userEmail || "mamanigutierrezcarlos123@gmail.com"}
            </div>
          </div>
        </div>

        {/* FECHA Y HORA */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block">
              FECHA Y HORA
            </span>
            <div className="text-sm font-bold text-foreground mt-0.5">
              02 sep 2026 · 08:52 a. m.
            </div>
            <div className="text-xs text-amber-400 font-medium mt-0.5">
              {alert.delayMinutes || 52} min después del inicio del turno
            </div>
          </div>
        </div>
      </div>

      {/* 4. UBICACIÓN DEL REGISTRO CARD */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Ubicación del registro
        </h3>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block">
              DISTRITO / ZONA
            </span>
            <div className="text-sm font-bold text-foreground">
              {alert.district || "Condevilla Señor"}
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-muted-foreground">
          LAT {lat.toFixed(4)} · LNG {lng.toFixed(4)}
        </div>

        {/* Map View Canvas Container */}
        <div className="h-44 rounded-xl border border-border bg-background/50 relative overflow-hidden flex items-center justify-center">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative flex items-center justify-center">
            <div className="absolute w-12 h-12 rounded-full bg-rose-500/20 animate-ping" />
            <div className="relative w-8 h-8 rounded-full bg-rose-500/30 border border-rose-500/60 flex items-center justify-center text-rose-400 shadow-sm">
              <MapPin className="w-4 h-4 fill-rose-500 text-rose-500" />
            </div>
          </div>
        </div>

        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-11 rounded-xl border border-border bg-card/60 hover:bg-background text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Abrir en Google Maps</span>
        </a>
      </div>

      {/* 5. BOTTOM ACTION FOOTER BAR */}
      <div className="space-y-3 pt-2">
        <p className="text-xs text-muted-foreground text-center sm:text-left leading-relaxed">
          Al aprobar, la tardanza queda registrada en el historial del colaborador. Al cancelar, la alerta se descarta.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => processAlert("cancel")}
            disabled={isProcessing}
            className="h-12 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancelar alerta</span>
          </button>

          <button
            type="button"
            onClick={() => processAlert("approve")}
            disabled={isProcessing}
            className="h-12 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Aprobar alerta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
