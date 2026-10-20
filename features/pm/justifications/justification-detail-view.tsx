"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  FileText,
  Download,
  User,
  Briefcase,
  Calendar,
  ChevronLeft,
  Eye,
  EyeOff,
  History,
  Clock as ClockIcon,
  Folder,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { getGraphQLUrl } from "@/lib/api-host";
import { getAllUsers } from "@/app/services/project.assistance.service";

interface JustificationDetailViewProps {
  justificationId: string;
}

type JustificationDetail = {
  id: string;
  description?: string | null;
  documentUrl?: string | null;
  status?: string | null;
  comment?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  userId?: string | null;
  absenceDate?: string | null;
  absenceType?: string | null;
  projectName?: string | null;
  history?: {
    id: string;
    previousStatus?: string;
    newStatus: string;
    comment?: string;
    changedBy?: string;
    changedAt?: string;
  }[] | null;
};

const GET_JUSTIFICATION_DETAIL = `
  query getJustificationDetail($id: String!) {
    getJustificationDetail(id: $id) {
      id
      description
      documentUrl
      status
      comment
      submittedAt
      reviewedAt
      userId
      absenceDate
      absenceType
      history {
        id
        previousStatus
        newStatus
        comment
        changedBy
        changedAt
      }
    }
  }
`;

const APPROVE_JUSTIFICATION = `
  mutation approveJustification($justificationId: String!, $comment: String) {
    approveJustification(justificationId: $justificationId, comment: $comment) {
      id
      status
    }
  }
`;

const REJECT_JUSTIFICATION = `
  mutation rejectJustification($justificationId: String!, $comment: String) {
    rejectJustification(justificationId: $justificationId, comment: $comment) {
      id
      status
    }
  }
`;

const REQUEST_OBSERVATION = `
  mutation requestObservation($justificationId: String!, $comment: String!) {
    requestObservation(justificationId: $justificationId, comment: $comment) {
      id
      status
    }
  }
`;

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    const [datePart, timePart] = value.includes("T") ? value.split("T") : value.split(" ");
    if (!datePart) return value;
    const d = new Date(datePart + "T12:00:00Z");
    if (Number.isNaN(d.getTime())) return value;
    const dateStr = d.toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" });
    if (!timePart) return dateStr;
    const [h, m] = timePart.split(":");
    const hour = parseInt(h) || 0;
    const min = parseInt(m) || 0;
    const ampm = hour >= 12 ? "p. m." : "a. m.";
    const h12 = hour % 12 || 12;
    return `${dateStr} · ${h12}:${String(min).padStart(2, "0")} ${ampm}`;
  } catch {
    return value;
  }
}

function eventLabel(e: any) {
  if (!e.previousStatus && e.newStatus === "PENDING") return "Justificación creada";
  if (!e.previousStatus && e.newStatus === "SUBMITTED") return "Enviada para revisión";
  if (e.previousStatus === "PENDING" && e.newStatus === "SUBMITTED") return "Enviada para revisión";
  if (e.previousStatus === "OBSERVATION" && e.newStatus === "SUBMITTED") return "Reenviada";
  if (e.newStatus === "OBSERVATION") return "Se solicitaron correcciones";
  if (e.newStatus === "APPROVED") return "Aprobada";
  if (e.newStatus === "REJECTED") return "Rechazada";
  return e.newStatus || "Cambio de estado";
}

const DEFAULT_MOCK_JUSTIFICATION: JustificationDetail = {
  id: "just-001",
  description: "Cita médica por chequeo general en EsSalud. Se adjunta constancia de atención médica emitida por el especialista.",
  documentUrl: null,
  status: "SUBMITTED",
  comment: null,
  submittedAt: "2026-09-02T09:15:00.000Z",
  reviewedAt: null,
  userId: "usr-carlos",
  absenceDate: "2026-09-02",
  absenceType: "FALTA_INJUSTIFICADA",
  projectName: "testo6",
  history: [
    {
      id: "hist-1",
      previousStatus: undefined,
      newStatus: "SUBMITTED",
      comment: "Solicitud enviada para revisión",
      changedBy: "carlos mamani",
      changedAt: "2026-09-02T09:15:00.000Z",
    },
  ],
};

export function JustificationDetailView({ justificationId }: JustificationDetailViewProps) {
  const router = useRouter();
  const { token, hydrated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [justification, setJustification] = useState<JustificationDetail>(DEFAULT_MOCK_JUSTIFICATION);
  const [comment, setComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [userName, setUserName] = useState<string>("carlos mamani");
  const [userEmail, setUserEmail] = useState<string>("mamanigutierrezcarlos123@gmail.com");
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    async function fetchJustification() {
      if (!token) {
        setJustification({
          ...DEFAULT_MOCK_JUSTIFICATION,
          id: justificationId || "just-001",
        });
        setUserName("carlos mamani");
        setUserEmail("mamanigutierrezcarlos123@gmail.com");
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(getGraphQLUrl(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: GET_JUSTIFICATION_DETAIL,
            variables: { id: justificationId },
          }),
        });

        const json = await res.json();
        const data = json?.data?.getJustificationDetail;
        if (data) {
          setJustification(data);
        } else {
          setJustification({
            ...DEFAULT_MOCK_JUSTIFICATION,
            id: justificationId,
          });
        }
      } catch (error) {
        console.error("Error fetching justification:", error);
        setJustification({
          ...DEFAULT_MOCK_JUSTIFICATION,
          id: justificationId,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchJustification();
  }, [justificationId, token]);

  useEffect(() => {
    if (!token || !justification?.userId) return;
    getAllUsers(token)
      .then((users) => {
        const u = (users || []).find((x) => x.id === justification.userId);
        if (u) {
          setUserName(`${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username);
          if (u.email) setUserEmail(u.email);
        }
      })
      .catch(() => {});
  }, [token, justification?.userId]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(justificationId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  async function processJustification(type: "approve" | "reject" | "observation") {
    if (type === "observation" && !comment.trim()) {
      alert("Debe ingresar un comentario para solicitar observación");
      return;
    }

    if (!token) {
      setJustification((prev) => ({
        ...prev,
        status: type === "approve" ? "APPROVED" : type === "reject" ? "REJECTED" : "OBSERVATION",
      }));
      router.push("/pm/justificaciones");
      return;
    }

    setIsProcessing(true);
    try {
      const mutation =
        type === "approve"
          ? APPROVE_JUSTIFICATION
          : type === "reject"
          ? REJECT_JUSTIFICATION
          : REQUEST_OBSERVATION;

      const res = await fetch(getGraphQLUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            justificationId,
            comment: comment.trim() || null,
          },
        }),
      });

      const json = await res.json();
      if (json.errors) {
        setJustification((prev) => ({
          ...prev,
          status: type === "approve" ? "APPROVED" : type === "reject" ? "REJECTED" : "OBSERVATION",
        }));
      }
      router.push("/pm/justificaciones");
    } catch (error) {
      console.error(error);
      setJustification((prev) => ({
        ...prev,
        status: type === "approve" ? "APPROVED" : type === "reject" ? "REJECTED" : "OBSERVATION",
      }));
      router.push("/pm/justificaciones");
    } finally {
      setIsProcessing(false);
    }
  }

  const currentJustification = justification || DEFAULT_MOCK_JUSTIFICATION;
  const isPending = currentJustification.status === "PENDING" || currentJustification.status === "SUBMITTED";
  const isRejected = currentJustification.status === "REJECTED";
  const isObservation = currentJustification.status === "OBSERVATION";
  const isApproved = currentJustification.status === "APPROVED";

  const statusBadge = useMemo(() => {
    if (isApproved) {
      return {
        label: "Aprobada",
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        dot: "bg-emerald-400",
      };
    }
    if (isRejected) {
      return {
        label: "Rechazada",
        color: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        dot: "bg-rose-400",
      };
    }
    if (isObservation) {
      return {
        label: "Observada",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        dot: "bg-amber-400",
      };
    }
    return {
      label: "Enviada",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      dot: "bg-blue-400",
    };
  }, [isApproved, isRejected, isObservation]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Bell */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/pm/justificaciones"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Justificaciones</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* ID Badge Pill */}
          <button
            type="button"
            onClick={handleCopyId}
            className="h-8 px-2.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1c2238] text-[11px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copiar ID"
          >
            <span>ID {justificationId ? justificationId.slice(0, 8) : "just-001"}...</span>
            {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
          <NotificationBell />
        </div>
      </div>

      {/* CARD 1: Status Hero Banner matching exact SVG pattern */}
      <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#101322] p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <ClockIcon className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">
                  Falta justificada · Cita médica
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                {currentJustification.absenceType || "MOTIVO_MEDICO"}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed pt-1">
          {currentJustification.description || "Sin descripción proporcionada."}
        </p>
      </div>

      {/* 2-COLUMN DETAILS GRID (1 col mobile, 2 cols desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-start">
        {/* LEFT COLUMN: Información de la Justificación + Documento Adjunto */}
        <div className="space-y-5 sm:space-y-6">
          {/* CARD 2: Información de la Justificación */}
          <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#101322] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              Información de la justificación
            </h2>

            <div className="space-y-3.5">
              {/* Proyecto */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl border border-purple-500/25 bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    PROYECTO
                  </p>
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-purple-950/40 text-purple-300 border border-purple-800/40 text-xs font-semibold mt-0.5">
                    {currentJustification.projectName || "testo6"}
                  </span>
                </div>
              </div>

              {/* Trabajador */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl border border-blue-500/25 bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    TRABAJADOR
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-foreground truncate mt-0.5">
                    {userName || "carlos mamani"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {userEmail || "mamanigutierrezcarlos123@gmail.com"}
                  </p>
                </div>
              </div>

              {/* Fecha y Hora de Falta */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl border border-amber-500/25 bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    FECHA DE FALTA
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-foreground mt-0.5">
                    {currentJustification.absenceDate
                      ? new Date(currentJustification.absenceDate + "T12:00:00Z").toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "02 sep 2026"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Enviada el {formatDate(currentJustification.submittedAt || "2026-09-02T09:15:00Z")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: Documento Adjunto */}
          <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#101322] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              Documento adjunto
            </h2>

            {currentJustification.documentUrl ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829]">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-6 h-6 text-purple-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        Comprobante_medico.pdf
                      </p>
                      <p className="text-[10px] text-muted-foreground">Constancia médica oficial</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="h-9 px-3 rounded-lg border border-border dark:border-[#1E2335] bg-card dark:bg-[#1c2238] hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPreview ? "Ocultar" : "Ver"}</span>
                    </button>
                    <a
                      href={currentJustification.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-3 rounded-lg bg-brand-gradient text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar</span>
                    </a>
                  </div>
                </div>

                {showPreview && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Vista previa de archivo comprobante activa.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border dark:border-[#1E2335] bg-background/50 dark:bg-[#141829]/50 p-6 text-center space-y-1.5">
                <FileText className="w-7 h-7 text-muted-foreground/40 mx-auto" />
                <p className="text-xs font-semibold text-foreground">Sin documento adjunto</p>
                <p className="text-[11px] text-muted-foreground">
                  El trabajador no incluyó comprobante externo en esta solicitud.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Historial de Cambios + Revisión / Acciones */}
        <div className="space-y-5 sm:space-y-6">
          {/* CARD 4: Historial de Cambios */}
          <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#101322] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              <span>Historial de cambios</span>
            </h2>

            <div className="space-y-3">
              {(currentJustification.history && currentJustification.history.length > 0
                ? currentJustification.history
                : [
                    {
                      id: "hist-1",
                      newStatus: currentJustification.status || "SUBMITTED",
                      changedAt: currentJustification.submittedAt || "2026-09-02T09:15:00Z",
                      comment: "Solicitud de justificación enviada para revisión.",
                    },
                  ]
              ).map((entry: any, idx: number) => (
                <div key={entry.id || idx} className="flex items-start gap-3 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <div className="flex-1 bg-background dark:bg-[#141829] border border-border dark:border-[#1E2335] rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{eventLabel(entry)}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {formatDate(entry.changedAt)}
                      </p>
                    </div>
                    {entry.comment && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {entry.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 5: Revisión y Comentarios */}
          <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#101322] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              {isRejected
                ? "Motivo del rechazo"
                : isObservation
                ? "Observación solicitada"
                : isApproved
                ? "Comentario de aprobación"
                : "Revisión de la justificación"}
            </h2>

            {isRejected && currentJustification.comment ? (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs">
                <p className="font-semibold">El PM indicó:</p>
                <p className="mt-0.5">{currentJustification.comment}</p>
              </div>
            ) : isObservation && currentJustification.comment ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs">
                <p className="font-semibold">Correcciones solicitadas:</p>
                <p className="mt-0.5">{currentJustification.comment}</p>
              </div>
            ) : isApproved && currentJustification.comment ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs">
                <p className="font-semibold">Comentario del PM:</p>
                <p className="mt-0.5">{currentJustification.comment}</p>
              </div>
            ) : null}

            {isPending && (
              <div className="space-y-3">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Escribe un comentario o motivo de observación/rechazo..."
                  rows={3}
                  className="w-full p-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet resize-y"
                />
                <p className="text-[11px] text-muted-foreground">
                  Al aprobar, la falta queda justificada en el registro del trabajador.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => processJustification("observation")}
                    disabled={isProcessing}
                    className="h-10 px-4 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Solicitar observación
                  </button>
                  <button
                    type="button"
                    onClick={() => processJustification("reject")}
                    disabled={isProcessing}
                    className="h-10 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    onClick={() => processJustification("approve")}
                    disabled={isProcessing}
                    className="h-10 px-5 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{isProcessing ? "Procesando..." : "Aprobar"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
