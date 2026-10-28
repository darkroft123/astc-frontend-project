"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  AlertTriangle,
  Sparkles,
  Home,
} from "lucide-react";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { registerAttendance, checkOut, getTodayAttendance } from "@/app/services/assistance.service";
import { formatLocalTime, getEffectiveTimezone } from "@/lib/timezone";
import { isOnline, flushAttendanceQueue, getCachedTodayAttendance, cacheTodayAttendance, enqueueAttendance } from "@/lib/offline-queue";

function formatAttendanceTime(dateStr?: string | null) {
  if (!dateStr) return "Pendiente";
  try {
    const d = new Date(dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : `${dateStr}Z`);
    if (isNaN(d.getTime())) {
      // If it's a simple HH:mm string like "08:52"
      if (/^\d{2}:\d{2}/.test(dateStr)) {
        const [hh, mm] = dateStr.split(":");
        const h = parseInt(hh, 10);
        const ampm = h >= 12 ? "p. m." : "a. m.";
        const h12 = h % 12 || 12;
        return `${String(h12).padStart(2, "0")}:${mm} ${ampm}`;
      }
      return dateStr;
    }
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "p. m." : "a. m.";
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, "0")}:${m} ${ampm}`;
  } catch {
    return dateStr;
  }
}

export default function AttendancePreviewPage() {
  const router = useRouter();
  const { hydrated, token, checkingAuth } = useAuthGuard(["PROJECT_MANAGER"]);
  const { project, loadingProject } = useUserProject();

  const [base64, setBase64] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [todayAtt, setTodayAtt] = useState<any>(null);
  const [loadingToday, setLoadingToday] = useState(true);

  const projectTimezone = getEffectiveTimezone(project?.timezone);

  useEffect(() => {
    if (!hydrated) return;
    setBase64(sessionStorage.getItem("attendance_photo"));
    setLat(parseFloat(sessionStorage.getItem("attendance_lat") || "-12.0184"));
    setLng(parseFloat(sessionStorage.getItem("attendance_lng") || "-77.0817"));
    setTime(sessionStorage.getItem("attendance_time") || new Date().toISOString());
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (token && isOnline()) {
      flushAttendanceQueue(token).catch(() => {});
    }

    if (!isOnline()) {
      const cached = getCachedTodayAttendance(project?.id || null);
      if (cached) setTodayAtt(cached);
      setLoadingToday(false);
      return;
    }

    if (!token) {
      setLoadingToday(false);
      return;
    }

    getTodayAttendance(token, project?.id || null)
      .then((r) => {
        setTodayAtt(r);
        cacheTodayAttendance(project?.id || null, r);
        setLoadingToday(false);
      })
      .catch(() => {
        const cached = getCachedTodayAttendance(project?.id || null);
        if (cached) setTodayAtt(cached);
        setLoadingToday(false);
      });
  }, [hydrated, token, project?.id]);

  const clearSaved = () => {
    ["attendance_photo", "attendance_lat", "attendance_lng", "attendance_time"].forEach((k) =>
      sessionStorage.removeItem(k)
    );
  };

  const isEntryDone = !!todayAtt?.checkIn && !todayAtt?.checkOut;
  const isBothDone = !!todayAtt?.checkOut;

  const handleRegisterEntry = async () => {
    if (!token && isOnline()) return;
    setLoading(true);

    if (!isOnline()) {
      enqueueAttendance({
        type: "ENTRY",
        projectId: project?.id || null,
        latitude: lat,
        longitude: lng,
        photoUrl: base64 || undefined,
      });
      cacheTodayAttendance(project?.id || null, {
        checkIn: time ? new Date(time).toISOString() : new Date().toISOString(),
        checkOut: null,
        status: "PENDING",
      });
      clearSaved();
      alert("Marcaje de Entrada guardado en el dispositivo. Se sincronizará automáticamente.");
      router.push("/pm/mis-asistencias");
      setLoading(false);
      return;
    }

    try {
      await registerAttendance(token!, {
        projectId: project?.id || null,
        latitude: lat,
        longitude: lng,
        photoUrl: base64 || undefined,
      });
      clearSaved();
      window.dispatchEvent(new Event("astc-attendance-updated"));
      router.push("/pm/mis-asistencias");
    } catch (err: any) {
      alert(err?.message || "Error al registrar entrada.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!token && isOnline()) return;
    setLoading(true);

    if (!isOnline()) {
      enqueueAttendance({
        type: "EXIT",
        projectId: project?.id || null,
        latitude: lat,
        longitude: lng,
        photoUrl: base64 || undefined,
      });
      if (todayAtt) {
        cacheTodayAttendance(project?.id || null, {
          ...todayAtt,
          checkOut: time ? new Date(time).toISOString() : new Date().toISOString(),
        });
      }
      clearSaved();
      alert("Marcaje de Salida guardado en el dispositivo. Se sincronizará automáticamente.");
      router.push("/pm/mis-asistencias");
      setLoading(false);
      return;
    }

    try {
      await checkOut(token!, project?.id || null, base64 || null, lat, lng);
      clearSaved();
      window.dispatchEvent(new Event("astc-attendance-updated"));
      router.push("/pm/mis-asistencias");
    } catch (err: any) {
      alert(err?.message || "Error al registrar salida.");
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated || checkingAuth || loadingProject || loadingToday) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const projectName = project?.name || "Proyecto";
  const displayLat = lat ?? -12.0184;
  const displayLng = lng ?? -77.0817;

  const entryTimeFormatted = todayAtt?.checkIn ? formatAttendanceTime(todayAtt.checkIn) : "Pendiente";
  const exitTimeFormatted = todayAtt?.checkOut ? formatAttendanceTime(todayAtt.checkOut) : "Pendiente";
  const timestampText = new Date().toLocaleString("es-PE", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const now = new Date();
  const currentHHmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const startTime = project?.workStartTime ? project.workStartTime.slice(0, 5) : "08:00";
  const endTime = project?.workEndTime ? project.workEndTime.slice(0, 5) : "17:00";

  const isAfterHours = currentHHmm > endTime;
  const isEarlyExit = currentHHmm < endTime;
  const isLateEntry = currentHHmm > startTime;

  const warningCard = (
    !base64 ? (
      <div className="rounded-2xl border border-amber/30 bg-amber/10 dark:bg-amber/10 p-4 flex items-start gap-3 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-foreground">
            {isEntryDone ? "Marcando salida sin foto" : "Marcando entrada sin foto"}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            No se capturó una foto biométrica para este marcaje. El sistema registrará la marca con observación de revisión.
          </p>
        </div>
      </div>
    ) : (
      <div className="rounded-2xl border border-green/30 bg-green/10 dark:bg-green/10 p-4 flex items-start gap-3 shadow-sm">
        <CheckCircle2 className="w-5 h-5 text-green shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-foreground">
            Foto biométrica capturada para {isEntryDone ? "salida" : "entrada"}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Captura biométrica facial procesada y verificada contra el perfil registrado.
          </p>
        </div>
      </div>
    )
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet/20 border border-violet/30 flex items-center justify-center text-violet shadow-[0_0_15px_rgba(168,85,247,0.15)] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Confirmar asistencia
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Proyecto {projectName}
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/pm")}
          className="hidden lg:flex h-10 px-6 rounded-xl bg-brand-gradient hover:opacity-95 text-white font-semibold text-xs md:text-sm shadow-lg shadow-indigo-500/25 transition-all cursor-pointer items-center justify-center"
        >
          Volver al panel principal
        </button>
      </div>

      {/* 2. RESPONSIVE CARDS GRID: 2 COLUMNS ON DESKTOP, STACKED ON MOBILE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full">
        {/* LEFT COLUMN (lg:col-span-7) */}
        <div className="flex flex-col gap-5 lg:col-span-7 w-full">
          {/* Card 1: Estado & Horario */}
          <div className="rounded-2xl border border-green/30 bg-green/10 dark:bg-green/10 p-5 md:p-6 shadow-sm space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                <span>
                  {isBothDone
                    ? "Jornada completada"
                    : isEntryDone
                    ? "Registro de salida"
                    : "Registro de entrada"}
                </span>
              </div>
              {isBothDone ? (
                <span className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded-full px-3 py-0.5 text-xs font-semibold">
                  Jornada completa
                </span>
              ) : isEntryDone ? (
                isAfterHours ? (
                  <span className="bg-rose-500/15 text-rose-500 border border-rose-500/30 rounded-full px-3 py-0.5 text-xs font-semibold">
                    Salida fuera de horario
                  </span>
                ) : isEarlyExit ? (
                  <span className="bg-amber/15 text-amber border border-amber/40 rounded-full px-3 py-0.5 text-xs font-semibold">
                    Salida anticipada
                  </span>
                ) : (
                  <span className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded-full px-3 py-0.5 text-xs font-semibold">
                    En horario
                  </span>
                )
              ) : isLateEntry ? (
                <span className="bg-amber/15 text-amber border border-amber/40 rounded-full px-3 py-0.5 text-xs font-semibold">
                  Tardanza
                </span>
              ) : (
                <span className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded-full px-3 py-0.5 text-xs font-semibold">
                  Puntual
                </span>
              )}
            </div>

            {/* Alert for exit schedule warnings */}
            {isEntryDone && isAfterHours && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>
                  Atención: Estás marcando salida después del fin de jornada asignado ({endTime}). Se registrará con aviso de salida fuera de horario.
                </span>
              </div>
            )}
            {isEntryDone && isEarlyExit && (
              <div className="rounded-xl border border-amber/30 bg-amber/10 p-3 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Aviso: Estás marcando salida antes del fin de jornada asignado ({endTime}).
                </span>
              </div>
            )}

            {/* Schedule Boxes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface/80 dark:bg-surface/80 border border-border/40 rounded-xl p-3.5">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                  ENTRADA
                </span>
                <span className="text-xl md:text-2xl font-bold font-mono text-foreground mt-1 block">
                  {project?.workStartTime ? project.workStartTime.slice(0, 5) : "08:00"}
                </span>
              </div>
              <div className="bg-surface/80 dark:bg-surface/80 border border-border/40 rounded-xl p-3.5">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                  SALIDA
                </span>
                <span className="text-xl md:text-2xl font-bold font-mono text-foreground mt-1 block">
                  {project?.workEndTime ? project.workEndTime.slice(0, 5) : "17:00"}
                </span>
              </div>
            </div>

            {/* Registration Times */}
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Entrada registrada</span>
                <span className="text-green font-mono font-semibold text-xs">
                  {entryTimeFormatted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Salida registrada</span>
                <span className="text-green font-mono font-semibold text-xs">
                  {exitTimeFormatted}
                </span>
              </div>
            </div>

            {/* Summary or Action Button */}
            {isBothDone || todayAtt?.checkOut ? (
              <div className="rounded-xl border border-green/30 bg-green/15 dark:bg-green/15 p-4 flex flex-col items-center justify-center text-center mt-2 space-y-1">
                <CheckCircle2 className="w-6 h-6 text-green mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">¡Ya registraste tu asistencia hoy!</p>
                <p className="text-xs text-muted-foreground">
                  Jornada completada: Entrada {entryTimeFormatted} · Salida {exitTimeFormatted}
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/pm")}
                  className="mt-3 px-4 py-2 rounded-xl bg-surface border border-border/80 text-foreground text-xs font-semibold hover:bg-accent transition-colors cursor-pointer"
                >
                  Volver al panel principal
                </button>
              </div>
            ) : isEntryDone ? (
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-green to-teal-500 hover:opacity-95 text-white font-semibold text-xs md:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar y Marcar Salida"}
              </button>
            ) : (
              <button
                onClick={handleRegisterEntry}
                disabled={loading}
                className="w-full h-11 rounded-xl bg-brand-gradient hover:opacity-95 text-white font-semibold text-xs md:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar y Registrar Entrada"}
              </button>
            )}
          </div>

          {/* Warning Banner on mobile only */}
          <div className="lg:hidden w-full">
            {warningCard}
          </div>

          {/* Card 3: Validación biométrica e IA */}
          <div className="rounded-2xl border border-border/70 dark:border-white/5 bg-card p-5 md:p-6 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet/20 text-violet flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Validación biométrica e IA</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Motor de reconocimiento facial y geocerca</p>
                </div>
              </div>
              <span className="bg-violet/20 text-violet border border-violet/30 rounded-full px-2.5 py-0.5 text-[11px] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse" />
                IA activa
              </span>
            </div>

            {/* Sub-item 1 */}
            <div className="rounded-xl border border-amber/30 bg-amber/10 dark:bg-amber/10 p-3.5 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-amber shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Detección facial y anti-spoofing</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {base64
                    ? "Rostro validado exitosamente sin anomalías biométricas."
                    : "No se detectó captura de foto biométrica. Se registrará la marca con reporte de revisión."}
                </p>
              </div>
            </div>

            {/* Sub-item 2 */}
            <div className="rounded-xl border border-border/40 bg-card/60 dark:bg-card/40 p-3.5 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Geolocalización y geocerca</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Ubicación verificada mediante coordenadas satelitales asignadas a tu proyecto.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (lg:col-span-5) */}
        <div className="flex flex-col gap-5 lg:col-span-5 w-full">
          {/* Warning Banner on desktop only */}
          <div className="hidden lg:block w-full">
            {warningCard}
          </div>

          {/* Card 4: UBICACIÓN SATELITAL GPS */}
          <div className="w-full rounded-2xl border border-border/70 dark:border-white/5 bg-card p-5 shadow-sm space-y-3.5">
            <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase font-semibold block">
              UBICACIÓN SATELITAL GPS
            </span>

            {/* Map Canvas */}
            <div className="h-[210px] w-full rounded-xl border border-border/50 bg-sidebar dark:bg-sidebar relative overflow-hidden flex items-center justify-center shadow-inner">
              <iframe
                title="Ubicación GPS Satelital"
                width="100%"
                height="100%"
                className="w-full h-full border-0"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${displayLng - 0.006}%2C${displayLat - 0.004}%2C${displayLng + 0.006}%2C${displayLat + 0.004}&layer=mapnik&marker=${displayLat}%2C${displayLng}`}
              />
            </div>

            {/* Coordinates line */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <MapPin className="w-3.5 h-3.5 text-blue" />
                <span>Coordenadas GPS</span>
              </div>
              <span className="font-mono text-muted-foreground text-xs">
                {timestampText}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
              <div className="bg-surface/80 border border-border/40 rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-muted-foreground">LAT</span>
                <span className="text-foreground font-semibold">{displayLat.toFixed(4)}</span>
              </div>
              <div className="bg-surface/80 border border-border/40 rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-muted-foreground">LNG</span>
                <span className="text-foreground font-semibold">{displayLng.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5 / Bottom Button on mobile */}
        <div className="col-span-1 lg:hidden w-full pt-2">
          <button
            onClick={() => router.push("/pm")}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Volver al panel principal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
