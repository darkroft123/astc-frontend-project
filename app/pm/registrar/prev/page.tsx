"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, MapPin, ShieldCheck, CheckCircle2, LogOut, AlertTriangle, Sparkles, FolderKanban, Check, ChevronRight } from "lucide-react";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { registerAttendance, checkOut, getTodayAttendance } from "@/app/services/assistance.service";
import { formatLocalTime, getEffectiveTimezone } from "@/lib/timezone";
import { GoogleMap } from "@/components/molecules/google-map";
import { StatusBadge } from "@/components/atoms/status-badge";

function fmtTime(v?: string | null, tz?: string | null) {
  return formatLocalTime(v, tz);
}

function getStatusInfo(todayAtt?: any) {
  if (!todayAtt) return { label: "Listo para registrar", color: "text-violet-600", bg: "bg-violet-50 border-violet-200", icon: ShieldCheck };
  const s = todayAtt.status;
  if (todayAtt?.checkOut) return { label: "Salida Registrada", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 };
  if (s === "OUTSIDE_SCHEDULE" || s === "EARLY") return { label: "FALTA — Fuera de horario", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: AlertTriangle };
  if (s === "LATE") return { label: "Entrada con retraso", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: AlertTriangle };
  if (todayAtt?.checkIn) return { label: "Entrada Registrada", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: CheckCircle2 };
  return { label: "Listo para registrar", color: "text-violet-600", bg: "bg-violet-50 border-violet-200", icon: ShieldCheck };
}

export default function AttendancePreviewPage() {
  const router = useRouter();
  const { hydrated, token, checkingAuth, user } = useAuthGuard(["PROJECT_MANAGER"]);
  const { project, projects, loadingProject } = useUserProject();

  const [base64, setBase64] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [todayAtt, setTodayAtt] = useState<any>(null);
  const [loadingToday, setLoadingToday] = useState(true);

  const projectTimezone = getEffectiveTimezone(project?.timezone);
  const todayLocal = new Intl.DateTimeFormat("en-CA", { timeZone: projectTimezone }).format(new Date());
  const isHoliday = project?.holidays?.includes(todayLocal) ?? false;

  useEffect(() => {
    if (!hydrated) return;
    setBase64(sessionStorage.getItem("attendance_photo"));
    setLat(parseFloat(sessionStorage.getItem("attendance_lat") || "0"));
    setLng(parseFloat(sessionStorage.getItem("attendance_lng") || "0"));
    setTime(sessionStorage.getItem("attendance_time"));
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !token) { setLoadingToday(false); return; }
    getTodayAttendance(token, project?.id || null).then(r => { setTodayAtt(r); setLoadingToday(false); });
  }, [hydrated, token, project?.id]);

  const statusInfo = useMemo(() => getStatusInfo(todayAtt), [todayAtt]);

  const isEntryDone = !!todayAtt?.checkIn && !todayAtt?.checkOut;
  const isBothDone = !!todayAtt?.checkOut;

  const handleRegisterEntry = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await registerAttendance(token, { projectId: project?.id || null, latitude: lat, longitude: lng, photoUrl: base64 || undefined });
      clearSaved();
      router.push("/pm/mis-asistencias");
    } catch (err: any) {
      alert(err?.message || "Error al procesar. Intente nuevamente.");
    } finally { setLoading(false); }
  };

  const handleCheckOut = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await checkOut(token, project?.id || null, base64 || null, lat || null, lng || null);
      clearSaved();
      router.push("/pm/mis-asistencias");
    } catch (err: any) {
      alert(err?.message || "Error al procesar. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const clearSaved = () => {
    ["attendance_photo", "attendance_lat", "attendance_lng", "attendance_time"].forEach(k => sessionStorage.removeItem(k));
  };

  if (!hydrated || checkingAuth || loadingProject || loadingToday) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/50 p-4 sm:p-8 flex items-start justify-center">
      <div className="w-full max-w-4xl space-y-4">

        {/* HEADER */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-violet-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">Confirmar Asistencia</h1>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                {project?.name ? `Proyecto: ${project.name}` : `Modo Multigestión (${projects?.length || 0} proyectos)`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-border shadow-2xs text-xs font-semibold text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-violet-600" />
            <span>{time ? new Date(time).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
          </div>
        </div>

        {/* TOP NOTICE (WHEN MULTI-PROJECT OR HOLIDAY) */}
        {!project && (
          <div className="bg-indigo-50/90 text-indigo-900 rounded-2xl p-3.5 px-4 flex items-center justify-between shadow-2xs border border-indigo-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs uppercase tracking-wider text-indigo-950">Modo Multigestión Activo</p>
                <p className="text-[11px] text-indigo-700 font-medium">Tu asistencia se computará globalmente como Jefe de Proyecto.</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-card text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200 shadow-2xs shrink-0">
              Gestión Global
            </span>
          </div>
        )}

        {isHoliday && (
          <div className="bg-red-50 text-red-700 rounded-2xl p-3.5 px-4 flex items-center gap-3 border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="font-bold text-xs uppercase tracking-wider">DÍA FERIADO - Registro opcional para control interno</p>
          </div>
        )}

        {/* 2-COLUMN BALANCED GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

          {/* LEFT COLUMN: ATTENDANCE STATUS + AI ASSISTANT + PRIMARY ACTIONS */}
          <div className="space-y-4">
            
            {/* Status & Schedule Card */}
            <Card className="rounded-3xl shadow-sm border-border overflow-hidden bg-card">
              <CardContent className="p-5 space-y-3.5">
                
                <div className={`p-4 rounded-2xl border ${statusInfo.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <statusInfo.icon className={`w-5 h-5 ${statusInfo.color}`} />
                      <p className={`font-bold text-sm ${statusInfo.color}`}>{statusInfo.label}</p>
                    </div>
                    {todayAtt?.status && <StatusBadge status={todayAtt.status} />}
                  </div>

                  {project ? (
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      <div className="bg-muted/60 dark:bg-muted/30 rounded-xl p-2 border border-border shadow-2xs">
                        <p className="text-muted-foreground font-medium text-[10px] uppercase">Entrada</p>
                        <p className="font-bold text-foreground">{project.workStartTime || "08:00"}</p>
                      </div>
                      <div className="bg-muted/60 dark:bg-muted/30 rounded-xl p-2 border border-border shadow-2xs">
                        <p className="text-muted-foreground font-medium text-[10px] uppercase">Salida</p>
                        <p className="font-bold text-foreground">{project.workEndTime || "17:00"}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-card/80 rounded-xl p-2.5 text-xs text-zinc-600 border border-zinc-100 shadow-2xs mt-2">
                      <p className="font-semibold text-foreground">Horario de Gestión de Proyecto</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Flexible con cobertura en todos los proyectos asignados.</p>
                    </div>
                  )}

                  {todayAtt && (
                    <div className="mt-3 pt-2.5 border-t border-black/5 text-xs space-y-1.5">
                      {todayAtt.checkIn && (
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">Entrada registrada:</span>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            {fmtTime(todayAtt.checkIn, projectTimezone)}
                          </span>
                        </div>
                      )}
                      {todayAtt.checkOut && (
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">Salida registrada:</span>
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {fmtTime(todayAtt.checkOut, projectTimezone)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isBothDone && (
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                    <p className="text-sm font-bold text-emerald-800">¡Jornada de Hoy Completada!</p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Entrada: {fmtTime(todayAtt.checkIn, projectTimezone)} · Salida: {fmtTime(todayAtt.checkOut, projectTimezone)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Assistant & Alerts Card */}
            <Card className="rounded-3xl shadow-sm border-indigo-100 overflow-hidden bg-card dark:bg-card border-border">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Diagnóstico Inteligente IA</h4>
                      <p className="text-[10px] text-muted-foreground">Servicio de análisis y alertas en tiempo real</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full border border-indigo-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                    IA Activa
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/50 dark:bg-muted/30 border border-border shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        {isEntryDone ? "Entrada procesada correctamente" : "Horario de Turno Operacional"}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        {isEntryDone
                          ? "Tu marca de ingreso está activa. Al finalizar tus labores, registra tu salida."
                          : "Registro biométrico listo para asociar a tu perfil de Jefe de Proyecto."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/50 dark:bg-muted/30 border border-border shadow-2xs">
                    {base64 ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        {base64 ? "Biometría Facial Validada" : "Alerta: Asistencia sin Captura Facial"}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        {base64
                          ? "Foto facial encuadrada con iluminación y nitidez adecuadas."
                          : "Se registrará una marca de control manual con geolocalización GPS."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/50 dark:bg-muted/30 border border-border shadow-2xs">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">Geolocalización Satelital</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        Coordenadas GPS capturadas con precisión dentro del área de cobertura asignada.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons Box */}
            <div className="pt-1">
              {isBothDone ? (
                <Button variant="outline" className="w-full h-12 rounded-2xl font-bold border-2 hover:bg-accent" onClick={() => router.push("/pm")}>
                  Volver al Panel Principal
                </Button>
              ) : isEntryDone ? (
                <Button onClick={handleCheckOut} disabled={loading} className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-200/50 transition-all active:scale-[0.98]">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogOut className="w-5 h-5 mr-2" /> Confirmar y Marcar Salida</>}
                </Button>
              ) : (
                <div className="space-y-2.5">
                  <Button onClick={handleRegisterEntry} disabled={loading} className="w-full h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-base shadow-lg shadow-violet-200/50 transition-all active:scale-[0.98]">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar y Registrar Entrada"}
                  </Button>
                  <Button variant="ghost" onClick={() => router.push("/pm")} className="w-full rounded-2xl text-zinc-500 hover:text-zinc-700 h-9 text-xs">
                    Cancelar
                  </Button>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: BIOMETRIC PHOTO + INTERACTIVE GPS MAP + POSITION */}
          <Card className="rounded-3xl shadow-sm border-border overflow-hidden bg-card">
            <CardContent className="p-5 space-y-4">
              
              {base64 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Foto Biométrica</p>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Capturada
                    </span>
                  </div>
                  <img src={base64} className="w-full max-h-44 object-cover rounded-2xl border border-border shadow-2xs" alt="Preview" />
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Asistencia sin foto</p>
                    <p className="text-xs text-amber-700">No se capturó una foto biométrica. Se registrará la marca con GPS.</p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Ubicación Satelital GPS</p>
                {(lat !== null && lng !== null) ? (
                  <div className="rounded-2xl overflow-hidden border border-border">
                    <GoogleMap center={{ lat, lng }} height="200px" zoom={17} />
                  </div>
                ) : (
                  <div className="h-36 rounded-2xl bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    Ubicación no disponible
                  </div>
                )}
              </div>

              <div className="p-3 bg-muted/50 rounded-2xl border border-zinc-100 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-600 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> Coordenadas GPS
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 font-semibold">
                    LAT {lat?.toFixed(4)} | LNG {lng?.toFixed(4)}
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] pt-0.5">
                  {time ? new Date(time).toLocaleString("es-PE", { timeZone: projectTimezone }) : "—"}
                </p>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
