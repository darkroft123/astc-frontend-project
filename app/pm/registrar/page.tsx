"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useClock } from "@/hooks/useClock";
import { useLocation } from "@/hooks/useLocation";
import { useCamera } from "@/hooks/useCamera";
import { useFaceDetection } from "@/hooks/useFaceDetection";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  MapPin, CalendarDays, ShieldCheck, Clock, RefreshCcw, AlertTriangle, Loader2, CheckCircle, Info, ScanFace, Navigation, Building2, Globe } from "lucide-react";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { getTodayAttendance, getEffectiveSchedule, listMyVacations } from "@/app/services/assistance.service";
import { getEffectiveTimezone } from "@/lib/timezone";
import { GoogleMap } from "@/components/molecules/google-map";
import type { VacationRequest } from "@/components/types/dashboard";

export default function RegisterAttendancePage() {
  const { token, hydrated, checkingAuth, user } = useAuthGuard(["PROJECT_MANAGER"]);
  const { project, loadingProject } = useUserProject();
  const projectTimezone = getEffectiveTimezone(project?.timezone);

  const router = useRouter();
  const { time, date, day } = useClock(projectTimezone);
  const { coords, nearestDistrict } = useLocation();
  const { videoRef, cameraOn, photo, startCamera, stopCamera, retakePhoto } = useCamera();
  const { faceInside, faceMessage } = useFaceDetection(videoRef, cameraOn);

  const [todayAtt, setTodayAtt] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [activeVacations, setActiveVacations] = useState<VacationRequest[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"PHOTO" | "NO_PHOTO" | null>(null);
  const isEntryDone = !!todayAtt?.checkIn && !todayAtt?.checkOut;

  const todayLocal = new Intl.DateTimeFormat("en-CA", { timeZone: projectTimezone }).format(new Date());
  const isHoliday = project?.holidays?.includes(todayLocal) ?? false;
  const isOnVacation = activeVacations.some(v => {
    if (v.status !== "APPROVED") return false;
    return todayLocal >= v.startDate && todayLocal <= v.endDate;
  });

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (!token || !user?.id) return;
    getTodayAttendance(token, project?.id || null).then(setTodayAtt);
    if (project?.id) {
      getEffectiveSchedule(token, user.id, project.id, todayLocal).then(setSchedule);
    }
    listMyVacations(token, user.id).then(v => {
      setActiveVacations(v.filter(v => v.status === "PENDING" || v.status === "APPROVED"));
    }).catch(() => {});
  }, [token, project?.id, user?.id]);

  const currentPosition = mapCenter ?? (coords ? { lat: coords.lat, lng: coords.lng } : null);

  useEffect(() => {
    if (coords && !mapCenter) {
      setMapCenter({ lat: coords.lat, lng: coords.lng });
    }
  }, [coords, mapCenter]);

  if (!hydrated || checkingAuth || !token) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!project && !loadingProject) {
    // If no project, we still allow them to register global attendance
    // just no schedule or holiday logic.
  }

  const executeCapture = () => {
    if (!currentPosition) { alert("No se pudo obtener la ubicación. Active su GPS."); return; }
    if (!faceInside) { alert("Centre su rostro en el recuadro de la cámara."); return; }

    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      alert("La cámara se está iniciando. Espere un momento.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) { alert("Error al procesar la captura."); return; }
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.95);

    sessionStorage.setItem("attendance_photo", base64);
    sessionStorage.setItem("attendance_lat", String(currentPosition.lat));
    sessionStorage.setItem("attendance_lng", String(currentPosition.lng));
    sessionStorage.setItem("attendance_time", new Date().toISOString());
    stopCamera();
    router.push("/pm/registrar/prev");
  };

  const executeNoPhoto = () => {
    if (!currentPosition) { alert("No se pudo obtener la ubicación. Active su GPS."); return; }
    sessionStorage.setItem("attendance_photo", "");
    sessionStorage.setItem("attendance_lat", String(currentPosition.lat));
    sessionStorage.setItem("attendance_lng", String(currentPosition.lng));
    sessionStorage.setItem("attendance_time", new Date().toISOString());
    stopCamera();
    router.push("/pm/registrar/prev");
  };

  return (
    <div className="min-h-screen bg-muted/50 flex flex-col">

      {/* HEADER */}
      <div className="bg-card border-b px-4 sm:px-6 py-2.5 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-2 text-blue-700 font-bold text-base sm:text-lg">
          <ShieldCheck className="w-5 h-5" /> Registro de Asistencia
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex items-center gap-2 text-zinc-500 font-medium text-xs">
            <CalendarDays className="w-3.5 h-3.5" /> {day}, {date}
          </div>
          <div className="flex items-center gap-2 font-mono bg-blue-50 text-blue-700 px-4 py-1.5 rounded-2xl border border-blue-100 font-bold text-base shadow-inner">
            <Clock className="w-4 h-4" /> {time}
          </div>
        </div>
      </div>

      {/* 3-COLUMN BODY */}
      <div className="flex-1 grid grid-cols-12 gap-3 sm:gap-4 p-3 sm:p-4 items-start">

        {/* ==================== LEFT: PROTOCOLO ==================== */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-3">
          <Card className="rounded-2xl border-border shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-700">
                <Info className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Protocolo</h4>
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: ShieldCheck, text: "Buena iluminación facial" },
                  { icon: ScanFace, text: "Rostro centrado y visible" },
                  { icon: MapPin, text: "Ubicación GPS activada" },
                  { icon: Clock, text: "Registro único por jornada" },
                ].map((t, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600"><t.icon className="w-3.5 h-3.5" /></div>
                    <p className="text-[11px] text-zinc-600 leading-relaxed font-medium">{t.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-blue-700">
                <Globe className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Zona Horaria</h4>
              </div>
              <p className="text-xs font-mono text-muted-foreground">{projectTimezone}</p>
              <p className="text-[10px] text-muted-foreground">Todos los horarios se muestran en esta zona</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-blue-700">
                <ScanFace className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Validación Facial</h4>
              </div>
              <div className={`p-2.5 rounded-xl border ${faceInside ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}>
                <p className={`font-bold text-[11px] uppercase ${faceInside ? "text-emerald-700" : "text-amber-700"}`}>
                  {faceInside ? "Rostro detectado" : "Buscando..."}
                </p>
                <p className={`text-[10px] mt-0.5 ${faceInside ? "text-emerald-600" : "text-amber-600"}`}>{faceMessage}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ==================== CENTER: CAMERA ==================== */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-3">
          <Card className="rounded-[28px] border-border shadow-md bg-zinc-950 overflow-hidden">
            <CardContent className="p-0 aspect-[4/3] flex items-center justify-center relative">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle, #4c1d95 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
              <div className="relative z-10 w-full max-w-[340px] aspect-[3/4] rounded-[50px] overflow-hidden border-[3px] border-white/15 shadow-2xl bg-black">
                {photo ? (
                  <img src={photo} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${!cameraOn ? "opacity-0 absolute inset-0 pointer-events-none" : "block"}`}
                    />
                    {!cameraOn && (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-900 text-white">
                        <AlertTriangle className="w-8 h-8 text-amber-500 mb-3 animate-bounce" />
                        <p className="font-bold text-xs">Cámara no iniciada o bloqueada</p>
                        <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed font-sans">
                          Haz clic en el candado o el icono de cámara en la barra de direcciones para dar permisos de cámara.
                        </p>
                        <Button
                          onClick={() => startCamera()}
                          className="mt-4 h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold"
                        >
                          Iniciar / Reintentar cámara
                        </Button>
                      </div>
                    )}
                  </>
                )}
                {cameraOn && !photo && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`w-[200px] h-[280px] border-2 border-dashed rounded-[70px] transition-all duration-300 ${faceInside ? "border-emerald-400 scale-105 opacity-80" : "border-white/30 opacity-40"}`} />
                  </div>
                )}
                {cameraOn && !photo && (
                  <div className={`absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md ${faceInside ? "bg-emerald-600/80 border border-emerald-400" : "bg-zinc-800/80 border border-zinc-600"}`}>
                    {faceInside ? "Posición correcta" : "Encuadre su rostro"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col items-center gap-2">
            {!photo ? (
              <>
                <Button onClick={() => {
                  if (project && ((schedule && !schedule.workDay) || isHoliday || isOnVacation)) {
                    setPendingAction("PHOTO");
                    setShowWarningModal(true);
                  } else {
                    executeCapture();
                  }
                }} disabled={!faceInside}
                  className={`h-12 px-10 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-95 ${faceInside ? (isEntryDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white") : "bg-zinc-200 text-zinc-400 cursor-not-allowed"}`}>
                  {isEntryDone ? "Marcar Salida" : "Registrar Ingreso"}
                </Button>
                  <button
                    onClick={() => {
                      if (project && ((schedule && !schedule.workDay) || isHoliday || isOnVacation)) {
                        setPendingAction("NO_PHOTO");
                        setShowWarningModal(true);
                      } else {
                        executeNoPhoto();
                      }
                    }}
                    className="text-xs underline underline-offset-2 text-zinc-400 hover:text-zinc-600"
                  >
                  Registrar sin foto
                </button>
              </>
            ) : (
              <Button variant="outline" onClick={retakePhoto}
                className="h-12 px-10 rounded-2xl border-2 border-border bg-card text-foreground font-bold text-base hover:bg-background">
                <RefreshCcw className="w-4 h-4 mr-2" /> Repetir Captura
              </Button>
            )}
          </div>
        </div>

        {/* ==================== RIGHT: PROYECTO + ZONA HORARIA + VALIDACIÓN FACIAL + GPS ==================== */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-3">
          <Card className="rounded-2xl border-border shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-700">
                <Building2 className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Proyecto</h4>
              </div>
              <div className="bg-blue-600 text-white rounded-xl p-3 text-center">
                <p className="font-bold text-sm">{project?.name || "Registro Global"}</p>
              </div>
              {isHoliday && (
                <div className="bg-red-500 text-white rounded-xl p-2.5 text-center border-2 border-red-400 animate-pulse">
                  <p className="font-bold text-xs uppercase tracking-widest">DÍA FERIADO</p>
                  <p className="text-[10px] text-red-100 mt-0.5">No es necesario registrar asistencia</p>
                </div>
              )}
              {isOnVacation && (
                <div className="bg-emerald-500 text-white rounded-xl p-2.5 text-center border-2 border-emerald-400 animate-pulse">
                  <p className="font-bold text-xs uppercase tracking-widest">DE VACACIONES</p>
                  <p className="text-[10px] text-emerald-100 mt-0.5">
                    {activeVacations.filter(v => v.status === "APPROVED" && todayLocal >= v.startDate && todayLocal <= v.endDate).map(v =>
                      `${v.startDate.split("-").reverse().join("/")} ? ${v.endDate.split("-").reverse().join("/")}`
                    ).join(", ")}
                  </p>
                </div>
              )}
              {!schedule ? (
                <div className="bg-background rounded-xl border p-3 text-center text-xs text-muted-foreground">Cargando turno...</div>
              ) : (
                <div className={`rounded-xl border p-3 space-y-1.5 ${schedule.workDay ? "bg-blue-50 border-blue-100" : "bg-amber-50 border-amber-200"}`}>
                  {schedule.shiftType && (
                    <p className={`text-[10px] font-semibold text-center uppercase tracking-wider border-b pb-1.5 mb-1 ${schedule.workDay ? "text-blue-500 border-blue-100" : "text-amber-600 border-amber-200"}`}>
                      {schedule.shiftType === "PERMANENT" || schedule.shiftType === "REGULAR" ? "Regular"
                        : schedule.shiftType === "ROTATING_4X4" ? "Rotativo 4x4"
                        : schedule.shiftType === "ROTATING_7X7" ? "Rotativo 7x7"
                        : schedule.shiftType === "FLEXIBLE" ? "Flexible"
                        : schedule.shiftType === "TRANSITORY" ? "Transitorio"
                        : schedule.shiftType}
                    </p>
                  )}
                  {schedule.shiftType?.startsWith("ROTATING") && (
                    <div className={`flex items-center justify-center gap-1.5 font-bold text-xs ${schedule.workDay ? "text-emerald-700" : "text-amber-700"}`}>
                      <CalendarDays className="w-4 h-4" />
                      {schedule.workDay ? "DÍA LABORAL" : "DÍA DE DESCANSO"}
                    </div>
                  )}
                  {schedule.workDay && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-blue-500 font-medium">Entrada</span>
                        <span className="text-xs font-bold text-blue-800">{schedule.expectedStartTime?.slice(0, 5) || "—"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-blue-500 font-medium">Salida</span>
                        <span className="text-xs font-bold text-blue-800">{schedule.expectedEndTime?.slice(0, 5) || "—"}</span>
                      </div>
                      {schedule.graceMinutes != null && (
                        <p className="text-[10px] text-blue-500 text-center pt-1 border-t border-blue-100">Tolerancia: {schedule.graceMinutes} min</p>
                      )}
                    </>
                  )}
                  {!schedule.workDay && !schedule.shiftType?.startsWith("ROTATING") && (
                    <>
                      <div className="flex items-center justify-center gap-1.5 text-amber-700 font-bold text-xs">
                        <CalendarDays className="w-4 h-4" /> DÍA DE DESCANSO
                      </div>
                      <p className="text-[10px] text-amber-600 leading-tight text-center">No es necesario registrar asistencia hoy.</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {activeVacations.length > 0 && (
            <Card className="rounded-2xl border-emerald-200 shadow-sm bg-emerald-50/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CalendarDays className="w-4 h-4" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest">Vacaciones</h4>
                </div>
                {activeVacations.map(v => (
                  <div key={v.id} className="bg-card rounded-xl border border-emerald-200 p-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        {v.status === "APPROVED" ? "Aprobadas" : "Pendiente"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{v.businessDays} días</span>
                    </div>
                    <p className="text-xs font-bold text-foreground">
                      {v.startDate.split("-").reverse().join("/")} ? {v.endDate.split("-").reverse().join("/")}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border-border shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-700">
                  <Navigation className="w-4 h-4" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest">GPS</h4>
                </div>
                {coords ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Activo
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-rose-500 uppercase">Buscando...</span>
                )}
              </div>
              <div className="p-2.5 bg-muted/50 rounded-xl border border-zinc-100">
                <p className="text-xs font-bold text-muted-foreground">{nearestDistrict || "Detectando..."}</p>
                {currentPosition && (
                  <div className="text-[10px] font-mono text-zinc-400 mt-1 flex gap-3">
                    <span>LAT {currentPosition.lat.toFixed(4)}</span>
                    <span>LNG {currentPosition.lng.toFixed(4)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {currentPosition && (
            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-2">
                <GoogleMap
                  center={currentPosition}
                  height="280px"
                  autoCenter={false}
                  markerDraggable={true}
                  onCenterChange={(c) => setMapCenter(c)}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan-y {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-scan-y { animation: scan-y 2.5s linear infinite; }
      `}</style>

      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-[32px] p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-zinc-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 shadow-inner">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground leading-tight">Día no laborable</h3>
                <p className="text-xs text-amber-600 font-semibold mt-0.5">
                  {isHoliday ? "Hoy es feriado." : isOnVacation ? "Estás de vacaciones." : "Es tu día de descanso."}
                </p>
              </div>
            </div>
            <p className="text-zinc-600 text-sm mb-8 leading-relaxed">
              ¿Realmente deseas registrar tu asistencia hoy? Esta acción quedará guardada en el historial del proyecto.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold border-2" onClick={() => setShowWarningModal(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg" onClick={() => {
                setShowWarningModal(false);
                if (pendingAction === "PHOTO") executeCapture();
                else executeNoPhoto();
              }}>
                Sí, registrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
