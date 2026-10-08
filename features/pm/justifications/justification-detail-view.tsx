"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, User, Briefcase, Calendar, ArrowLeft, Eye, EyeOff, History, Clock as ClockIcon } from "lucide-react";
import Link from "next/link";

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
  history?: { id: string; previousStatus?: string; newStatus: string; comment?: string; changedBy?: string; changedAt?: string }[] | null;
};

import { getGraphQLUrl } from "@/lib/api-host";
import { getAllUsers } from "@/app/services/project.assistance.service";
import { formatUserName } from "@/lib/formatters";

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
    const ampm = hour >= 12 ? "p. m." : "a. m.";
    const h12 = hour % 12 || 12;
    return `${dateStr}, ${h12}:${String(min).padStart(2, "0")} ${ampm}`;
  } catch { return value; }
}

const dotColors: Record<string, string> = { PENDING: "#3b82f6", SUBMITTED: "#3b82f6", OBSERVATION: "#f97316", APPROVED: "#10b981", REJECTED: "#ef4444" };
const historyIcons: Record<string, any> = { PENDING: FileText, SUBMITTED: FileText, OBSERVATION: FileText, APPROVED: FileText, REJECTED: FileText };
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

export function JustificationDetailView({ justificationId }: JustificationDetailViewProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [justification, setJustification] = useState<JustificationDetail | null>(null);
  const [comment, setComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    async function fetchJustification() {
      if (!token) return;
      setIsLoading(true);
      try {
        const res = await fetch(getGraphQLUrl(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            query: GET_JUSTIFICATION_DETAIL,
            variables: { id: justificationId },
          }),
        });

        const json = await res.json();
        if (json.errors) {
          console.error(json.errors);
          return;
        }
        setJustification(json.data.getJustificationDetail);
      } catch (error) {
        console.error("Error fetching justification:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchJustification();
  }, [justificationId, token]);

  useEffect(() => {
    if (!token || !justification?.userId) return;
    getAllUsers(token).then(users => {
      const u = users.find(x => x.id === justification.userId);
      const rawName = u ? ([u.firstName, u.lastName].filter(Boolean).join(" ") || u.username) : null;
      setUserName(formatUserName(justification.userId, rawName ? new Map([[justification.userId.toLowerCase(), rawName]]) : undefined));
    }).catch(() => {
      setUserName(formatUserName(justification.userId));
    });
  }, [token, justification?.userId]);

  async function processJustification(type: "approve" | "reject" | "observation") {
    if (!token) return;
    if (type === "observation" && !comment.trim()) {
      alert("Debe ingresar un comentario para solicitar observación");
      return;
    }
    setIsProcessing(true);
    try {
      const mutation = type === "approve" ? APPROVE_JUSTIFICATION 
        : type === "reject" ? REJECT_JUSTIFICATION 
        : REQUEST_OBSERVATION;
      const res = await fetch(getGraphQLUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
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
        alert("Error al procesar justificación. Intente más tarde.");
        return;
      }

      router.push("/pm/justificaciones");
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!justification) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">Justificación no encontrada</p>
        </div>
      </div>
    );
  }

  const isPending = justification.status === "PENDING" || justification.status === "SUBMITTED";
  const isRejected = justification.status === "REJECTED";
  const isObservation = justification.status === "OBSERVATION";
  const isApproved = justification.status === "APPROVED";

  return (
    <div className="min-h-screen bg-muted/50 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-5 pt-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
          <div className="flex items-center gap-3">
            <Link href="/pm/justificaciones">
              <Button variant="ghost" size="sm" className="h-8 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Detalle de Justificación</h1>
          </div>

          {isPending && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => processJustification("observation")}
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl"
                disabled={isProcessing}
              >
                Solicitar Observación
              </Button>
              <Button
                onClick={() => processJustification("reject")}
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl"
                disabled={isProcessing}
              >
                Rechazar
              </Button>
              <Button
                onClick={() => processJustification("approve")}
                size="sm"
                className="h-8 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                disabled={isProcessing}
              >
                {isProcessing ? "Procesando..." : "Aprobar Justificación"}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Usuario</p>
                    <p className="text-sm font-semibold text-foreground truncate">{userName || formatUserName(justification.userId)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Fecha falta</p>
                    <p className="text-sm font-semibold text-foreground truncate">{justification.absenceDate ? new Date(justification.absenceDate + "T12:00:00Z").toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" }) : "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tipo falta</p>
                    <p className="text-sm font-semibold text-foreground truncate">{justification.absenceType ?? "-"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Fecha de envío</p>
                    <p className="text-xs font-semibold text-foreground">{formatDate(justification.submittedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Fecha de revisión</p>
                    <p className="text-xs font-semibold text-foreground">{formatDate(justification.reviewedAt)}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-xs">
              <h3 className="text-base font-bold text-foreground mb-2">Motivo de la Justificación</h3>
              <p className="text-sm text-foreground/90 leading-relaxed bg-muted/30 p-3.5 rounded-xl border border-border">
                {justification.description ?? "Sin descripción"}
              </p>

              {justification.documentUrl && (
                <div className="mt-5 pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Documento Adjunto</h4>
                  <div className="flex items-center gap-3 bg-muted/40 p-3.5 rounded-xl border border-border">
                    <FileText className="h-8 w-8 text-red-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">Comprobante adjunto</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                      className="h-8 text-xs px-2.5 gap-1.5 border-border rounded-lg"
                    >
                      {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showPreview ? "Ocultar" : "Previsualizar"}
                    </Button>
                    <Button asChild size="sm" className="h-8 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                      <a href={justification.documentUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Descargar
                      </a>
                    </Button>
                  </div>

                  {showPreview && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-border bg-accent" style={{ minHeight: "400px" }}>
                      {justification.documentUrl?.toLowerCase().endsWith(".pdf") || justification.documentUrl?.includes(".pdf") ? (
                        <embed
                          src={justification.documentUrl + "#toolbar=0&navpanes=0"}
                          type="application/pdf"
                          className="w-full"
                          style={{ height: "450px", border: "none" }}
                          title="Vista previa del documento"
                        />
                      ) : justification.documentUrl?.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                        <img
                          src={justification.documentUrl}
                          alt="Vista previa del documento"
                          className="w-full object-contain"
                          style={{ maxHeight: "450px" }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-[250px] text-muted-foreground text-xs">
                          <p>Vista previa no disponible para este tipo de archivo. Use el botón Descargar.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Historial de cambios */}
          {justification.history && justification.history.length > 0 && (
            <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-xs lg:col-span-2">
              <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" /> Historial de Cambios
              </h3>
              <div className="relative pl-7 max-h-[300px] overflow-y-auto pr-1">
                <div className="absolute left-[11px] top-1 bottom-1 w-0.5 bg-border rounded-full" />
                {justification.history.map((entry: any, idx: number, arr: any[]) => {
                  const color = dotColors[entry.newStatus] || "#3b82f6";
                  const HIcon = historyIcons[entry.newStatus] || FileText;
                  const isLast = idx === arr.length - 1;
                  return (
                    <div key={entry.id || idx} className={`relative pb-3.5 ${isLast ? "!pb-0" : ""}`}>
                      <div className="absolute -left-7 top-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-xs ring-2 ring-background" style={{ backgroundColor: color }}>
                        <HIcon className="w-2.5 h-2.5 text-white" />
                      </div>
                      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border" style={{ backgroundColor: color + "0D" }}>
                          <p className="text-xs font-bold text-foreground">{eventLabel(entry)}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{entry.changedAt ? formatDate(entry.changedAt) : "-"}</p>
                        </div>
                        {entry.comment && (
                          <div className="px-3 py-2">
                            <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{entry.comment}</p>
                          </div>
                        )}
                        {entry.changedBy && (
                          <div className="px-3 py-1 bg-muted/40 flex items-center gap-1.5">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{entry.changedBy === justification.userId ? "Colaborador" : "Jefe de Proyecto"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Comentarios */}
          <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-xs">
            <h3 className="text-base font-bold text-foreground mb-3">
              {isRejected ? "Motivo del Rechazo" : isObservation ? "Observación Solicitada" : isPending ? "Comentarios de Revisión" : "Comentarios"}
            </h3>

            {isRejected && justification.comment ? (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3.5 mb-3">
                <p className="text-xs text-red-800 dark:text-red-300 font-medium">El PM indicó:</p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{justification.comment}</p>
              </div>
            ) : isObservation && justification.comment ? (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 mb-3">
                <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">Correcciones solicitadas:</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{justification.comment}</p>
              </div>
            ) : isPending && justification.comment ? (
              <div className="bg-muted/40 border border-border rounded-xl p-3.5 mb-3">
                <p className="text-xs text-foreground">{justification.comment}</p>
              </div>
            ) : isApproved && justification.comment ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 mb-3">
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Comentario del PM:</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">{justification.comment}</p>
              </div>
            ) : null}
            
            {isPending && (
              <>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Escribe un comentario para el colaborador..."
                  className="min-h-28 text-xs resize-y border-border bg-background rounded-xl p-3"
                />
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Este comentario será visible para el usuario.
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
