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
    <div className="w-full space-y-6 text-white font-sans bg-transparent pb-16 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
      {/* 1. TOP HEADER ROW */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/pm/alertas"
          className="inline-flex items-center gap-1.5 text-base font-bold text-[#C084FC] hover:text-purple-300 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          <span>Alertas</span>
        </Link>

        {/* Right side: ID pill and desktop bell */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyId}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#1E2335] bg-[#141829] text-xs font-mono text-[#8F96AE] hover:text-white transition-colors cursor-pointer"
          >
            <span>ID {alert.id.slice(0, 8)}...</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <div className="hidden md:block">
            <NotificationBell />
          </div>
        </div>
      </div>

      {/* 2. TOP BANNER CARD */}
      <div className="rounded-2xl p-5 border border-[#483713] bg-[#17140B] shadow-sm space-y-3">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#281E0E] border border-[#483713] text-[#F59E0B] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Asistencia tarde
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2A1D0B] text-[#FBBF24] border border-[#483713]">
                ● {alert.status === "PENDING" ? "Pendiente" : alert.status === "APPROVED" ? "Aprobada" : "Cancelada"}
              </span>
            </div>

            <p className="text-[11px] font-mono uppercase text-[#8F96AE] mt-1 font-semibold">
              {alert.type || "ASISTENCIA_TARDE"}
            </p>

            <p className="text-xs text-[#8F96AE] mt-2 leading-relaxed">
              {alert.detailMessage ||
                "Análisis completado sin anomalías. El marcaje de entrada se registró después de la hora de inicio del turno (08:00)."}
            </p>
          </div>
        </div>
      </div>

      {/* 3 & 4. DETAILS GRID (1 col mobile, 2 cols desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 3. INFORMACIÓN DE LA ALERTA CARD */}
        <div className="bg-[#101322] border border-[#1E2335] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-white">
            Información de la alerta
          </h3>

          {/* PROYECTO */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-[#8B7BD8] uppercase block font-semibold">
                PROYECTO
              </span>
              <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#241B3B] text-[#C084FC] border border-[#4A2D78]">
                {alert.projectName || "testo6"}
              </span>
            </div>
          </div>

          {/* USUARIO */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-[#8B7BD8] uppercase block font-semibold">
                USUARIO
              </span>
              <div className="text-sm font-bold text-white mt-0.5">
                {alert.userName || "carlos mamani"}
              </div>
              <div className="text-xs text-[#8F96AE]">
                {alert.userEmail || "mamanigutierrezcarlos123@gmail.com"}
              </div>
            </div>
          </div>

          {/* FECHA Y HORA */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-[#8B7BD8] uppercase block font-semibold">
                FECHA Y HORA
              </span>
              <div className="text-sm font-bold text-white mt-0.5 font-mono">
                02 sep 2026 · 08:52 a. m.
              </div>
              <div className="text-xs text-amber-400 font-medium mt-0.5">
                {alert.delayMinutes || 52} min después del inicio del turno
              </div>
            </div>
          </div>
        </div>

        {/* 4. UBICACIÓN DEL REGISTRO CARD */}
        <div className="bg-[#101322] border border-[#1E2335] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-white">
            Ubicación del registro
          </h3>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-[#8B7BD8] uppercase block font-semibold">
                DISTRITO / ZONA
              </span>
              <div className="text-sm font-bold text-white">
                {alert.district || "Condevilla Señor"}
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-[#8F96AE]">
            LAT {lat.toFixed(4)} · LNG {lng.toFixed(4)}
          </div>

          {/* Map View Canvas Container */}
          <div className="h-44 rounded-xl border border-[#1E2335] bg-[#0C0E18] relative overflow-hidden flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #1E2335 1px, transparent 1px),
                  linear-gradient(to bottom, #1E2335 1px, transparent 1px)
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
            className="w-full h-11 rounded-xl border border-[#1E2335] bg-[#141829] hover:bg-[#1C2238] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#8F96AE]" />
            <span>Abrir en Google Maps</span>
          </a>
        </div>
      </div>

      {/* 5. BOTTOM ACTION FOOTER BAR */}
      <div className="rounded-2xl border border-[#1E2335] bg-[#101322] p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <p className="text-xs text-muted-foreground text-center md:text-left leading-relaxed max-w-lg">
          Al aprobar, la tardanza queda registrada en el historial del trabajador. Al cancelar, la alerta se descarta.
        </p>

        <div className="grid grid-cols-2 gap-3 shrink-0">
          <button
            type="button"
            onClick={() => processAlert("cancel")}
            disabled={isProcessing}
            className="h-11 px-5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancelar alerta</span>
          </button>

          <button
            type="button"
            onClick={() => processAlert("approve")}
            disabled={isProcessing}
            className="h-11 px-5 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Aprobar alerta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
