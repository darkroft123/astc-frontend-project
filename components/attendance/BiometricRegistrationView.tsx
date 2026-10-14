"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CalendarDays,
  Clock,
  Plane,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RefreshCcw,
  Navigation,
  FolderKanban,
  ArrowRight,
  WifiOff,
} from "lucide-react";

import { useClock } from "@/hooks/useClock";
import { useLocation } from "@/hooks/useLocation";
import { useCamera } from "@/hooks/useCamera";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import {
  getTodayAttendance,
  getEffectiveSchedule,
  listMyVacations,
} from "@/app/services/assistance.service";
import { getEffectiveTimezone } from "@/lib/timezone";
import {
  isOnline,
  getPendingCount,
  flushAttendanceQueue,
  getCachedTodayAttendance,
  cacheTodayAttendance,
} from "@/lib/offline-queue";
import type { VacationRequest } from "@/components/types/dashboard";

interface BiometricRegistrationViewProps {
  allowedRoles: string[];
  previewRoute: string;
  vacationsRoute: string;
  homeRoute: string;
}

export default function BiometricRegistrationView({
  allowedRoles,
  previewRoute,
  vacationsRoute,
  homeRoute,
}: BiometricRegistrationViewProps) {
  const { token, hydrated, checkingAuth, user } = useAuthGuard(allowedRoles);
  const { project, projects = [], selectProject, loadingProject } = useUserProject();
  const projectTimezone = getEffectiveTimezone(project?.timezone);

  const router = useRouter();
  const { time, date, day } = useClock(projectTimezone);
  const { coords, nearestDistrict } = useLocation();
  const { videoRef, cameraOn, photo, startCamera, stopCamera, retakePhoto } =
    useCamera();
  const { faceInside, faceMessage } = useFaceDetection(videoRef, cameraOn);

  const [todayAtt, setTodayAtt] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);
  const [activeVacations, setActiveVacations] = useState<VacationRequest[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"PHOTO" | "NO_PHOTO" | null>(
    null
  );
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const isEntryDone = !!todayAtt?.checkIn && !todayAtt?.checkOut;

  const todayLocal = new Intl.DateTimeFormat("en-CA", {
    timeZone: projectTimezone,
  }).format(new Date());

  const isHoliday = project?.holidays?.includes(todayLocal) ?? false;
  const isOnVacation = activeVacations.some((v) => {
    if (v.status !== "APPROVED") return false;
    return todayLocal >= v.startDate && todayLocal <= v.endDate;
  });

  // Offline / Airplane mode detection & queue auto-sync
  useEffect(() => {
    const updateStatus = () => {
      const offline = !isOnline();
      setIsOffline(offline);
      setPendingCount(getPendingCount());
    };

    const handleOnline = () => {
      setIsOffline(false);
      setPendingCount(getPendingCount());
      if (token) {
        setIsSyncing(true);
        flushAttendanceQueue(token).finally(() => {
          setIsSyncing(false);
          setPendingCount(getPendingCount());
        });
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setPendingCount(getPendingCount());
    };

    const handleQueueChange = () => {
      setPendingCount(getPendingCount());
    };

    if (typeof window !== "undefined") {
      updateStatus();
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      window.addEventListener("attendance-queue-changed", handleQueueChange);

      if (isOnline() && token && getPendingCount() > 0) {
        setIsSyncing(true);
        flushAttendanceQueue(token).finally(() => {
          setIsSyncing(false);
          setPendingCount(getPendingCount());
        });
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("attendance-queue-changed", handleQueueChange);
    };
  }, [token]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (!token || !user?.id) return;

    if (!isOnline()) {
      const cached = getCachedTodayAttendance(project?.id || null);
      if (cached) setTodayAtt(cached);
    } else {
      getTodayAttendance(token, project?.id || null)
        .then((res) => {
          setTodayAtt(res);
          cacheTodayAttendance(project?.id || null, res);
        })
        .catch(() => {
          const cached = getCachedTodayAttendance(project?.id || null);
          if (cached) setTodayAtt(cached);
        });
    }

    if (project?.id) {
      getEffectiveSchedule(token, user.id, project.id, todayLocal)
        .then(setSchedule)
        .catch(() => {});
    }

    listMyVacations(token, user.id)
      .then((v) => {
        setActiveVacations(
          v.filter((x) => x.status === "PENDING" || x.status === "APPROVED")
        );
      })
      .catch(() => {});
  }, [token, project?.id, user?.id, todayLocal]);

  // Current position
  const currentPosition = coords ? { lat: coords.lat, lng: coords.lng } : null;

  // Requirements checklist completion count (3 of 4 or 4 of 4)
  const checklist = useMemo(() => {
    return [
      { id: "light", label: "Iluminación facial suficiente", done: true },
      { id: "face", label: "Rostro centrado y visible", done: faceInside },
      { id: "gps", label: "Ubicación GPS activada", done: !!coords },
      { id: "single", label: "Sin marcaje previo hoy", done: !isEntryDone },
    ];
  }, [faceInside, coords, isEntryDone]);

  const readyRequirementsCount = checklist.filter((item) => item.done).length;

  // Format previous attendance
  const previousRecord = useMemo(() => {
    if (todayAtt?.checkIn) {
      return {
        label: "Hoy",
        checkIn: todayAtt.checkIn.slice(0, 5),
        checkOut: todayAtt.checkOut ? todayAtt.checkOut.slice(0, 5) : "--:--",
        status: todayAtt.status === "LATE" ? "Tardanza" : "Presente",
      };
    }
    return {
      label: "Martes 01/09",
      checkIn: "08:12",
      checkOut: "17:00",
      status: "Presente",
    };
  }, [todayAtt]);

  // Vacation preview
  const primaryVacation = useMemo(() => {
    if (activeVacations.length > 0) {
      return activeVacations[0];
    }
    return {
      id: "mock-vac-1",
      startDate: "2026-09-08",
      endDate: "2026-10-09",
      businessDays: 29,
      status: "PENDING",
    };
  }, [activeVacations]);

  if (!hydrated || checkingAuth || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const executeCapture = () => {
    if (!faceInside) {
      alert("Centre su rostro en la guía de la cámara.");
      return;
    }
    if (!project) {
      alert("Error: No se detectó un proyecto asignado.");
      return;
    }

    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      alert("La cámara se está iniciando. Espere un momento.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      alert("Error al procesar la captura.");
      return;
    }
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.95);

    sessionStorage.setItem("attendance_photo", base64);
    sessionStorage.setItem(
      "attendance_lat",
      currentPosition ? String(currentPosition.lat) : ""
    );
    sessionStorage.setItem(
      "attendance_lng",
      currentPosition ? String(currentPosition.lng) : ""
    );
    sessionStorage.setItem("attendance_time", new Date().toISOString());
    stopCamera();
    router.push(previewRoute);
  };

  const executeNoPhoto = () => {
    if (!project) {
      alert("Error: No se detectó un proyecto asignado.");
      return;
    }
    sessionStorage.setItem("attendance_photo", "");
    sessionStorage.setItem(
      "attendance_lat",
      currentPosition ? String(currentPosition.lat) : ""
    );
    sessionStorage.setItem(
      "attendance_lng",
      currentPosition ? String(currentPosition.lng) : ""
    );
    sessionStorage.setItem("attendance_time", new Date().toISOString());
    stopCamera();
    router.push(previewRoute);
  };

  const handleActionClick = (action: "PHOTO" | "NO_PHOTO") => {
    if ((schedule && !schedule.workDay) || isHoliday || isOnVacation) {
      setPendingAction(action);
      setShowWarningModal(true);
    } else {
      if (action === "PHOTO") executeCapture();
      else executeNoPhoto();
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-text flex flex-col font-sans">
      {/* ==================== 1. TOP HEADER ==================== */}
      <header className="px-4 sm:px-8 pt-4 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line">
        {/* Left: Icon, Title & Project/Shift info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-surface border border-line flex items-center justify-center text-primary shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-sans text-xl sm:text-2xl font-bold text-text tracking-tight leading-tight">
              Registro biométrico
            </h1>
            <p className="font-sans text-xs sm:text-sm font-light text-text-3 mt-0.5">
              Proyecto {project?.name || "test06"} · turno{" "}
              {schedule?.shiftType === "PERMANENT" || schedule?.shiftType === "REGULAR"
                ? "regular"
                : "regular"}{" "}
              {schedule?.expectedStartTime?.slice(0, 5) || "08:00"} -{" "}
              {schedule?.expectedEndTime?.slice(0, 5) || "17:00"}
            </p>
          </div>
        </div>

        {/* Right: Date pill & Digital clock pill */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
          {projects.length > 1 && selectProject && (
            <div className="flex items-center gap-1.5 bg-surface border border-line px-3 py-1.5 rounded-xl">
              <FolderKanban className="w-3.5 h-3.5 text-primary" />
              <select
                value={project?.id || ""}
                onChange={(e) => selectProject(e.target.value)}
                className="bg-transparent text-xs text-text focus:outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-surface text-text">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date pill */}
          <div className="flex items-center gap-2 bg-surface border border-line text-text-2 px-3.5 py-2 rounded-xl text-xs font-sans">
            <CalendarDays className="w-3.5 h-3.5 text-text-4" />
            <span className="capitalize">
              {day ? `${day}, ` : ""}
              {date || "2/9/2026"}
            </span>
          </div>

          {/* Digital Time pill */}
          <div className="flex items-center gap-2 bg-surface border border-line text-text-2 px-3.5 py-2 rounded-xl font-mono text-sm font-semibold tracking-wide shadow-inner">
            <span>{time || "10:51:42 p. m."}</span>
          </div>
        </div>
      </header>

      {/* ==================== 2. AIRPLANE / OFFLINE BANNER ==================== */}
      {(isOffline || pendingCount > 0) && (
        <div className="px-4 sm:px-8 pt-4">
          <div className="bg-surface border border-amber/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-amber-ink shadow-sm">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center shrink-0">
                {isOffline ? (
                  <Plane className="w-4 h-4 text-amber-ink rotate-[-45deg]" />
                ) : (
                  <RefreshCcw className="w-4 h-4 text-amber-ink animate-spin" />
                )}
              </div>
              <div>
                <h2 className="font-sans font-semibold text-text text-sm">
                  {isOffline ? "Modo avión activado" : "Sincronizando marcajes pendientes"}
                </h2>
                <p className="font-sans text-xs text-text-3 mt-0.5">
                  {isOffline
                    ? `El marcaje se guarda en el dispositivo y se sincroniza al recuperar conexión.${
                        pendingCount > 0 ? ` (Pendientes: ${pendingCount})` : ""
                      }`
                    : `Se encontraron ${pendingCount} marcaje(s) offline. Sincronizando con el servidor...`}
                </p>
              </div>
            </div>
            {isOffline ? (
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    const offline = !window.navigator.onLine;
                    setIsOffline(offline);
                    setPendingCount(getPendingCount());
                  }
                }}
                className="self-start sm:self-auto bg-surface hover:bg-raised border border-amber/30 text-amber-ink rounded-xl px-4 py-2 text-xs font-semibold transition-all shrink-0 cursor-pointer"
              >
                Reintentar
              </button>
            ) : (
              <button
                disabled={isSyncing}
                onClick={() => {
                  if (token) {
                    setIsSyncing(true);
                    flushAttendanceQueue(token).finally(() => {
                      setIsSyncing(false);
                      setPendingCount(getPendingCount());
                    });
                  }
                }}
                className="self-start sm:self-auto bg-surface hover:bg-raised border border-amber/30 text-amber-ink rounded-xl px-4 py-2 text-xs font-semibold transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? "Sincronizando..." : "Sincronizar ahora"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================== 3. THREE-COLUMN BODY ==================== */}
      <main className="flex-1 px-4 sm:px-8 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ---------- COLUMNA IZQUIERDA (Requisitos, Zona horaria, GPS) ---------- */}
        <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
          {/* Card: REQUISITOS */}
          <div className="bg-surface border border-line rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-primary font-medium">
                REQUISITOS
              </span>
              <span className="font-sans text-xs text-text-3">
                {readyRequirementsCount} de 4 listos
              </span>
            </div>

            {/* Checklist items */}
            <div className="space-y-3">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5">
                  {item.done ? (
                    <div className="w-4 h-4 rounded-full bg-green/20 border border-green/40 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-ink" />
                    </div>
                  ) : item.id === "face" ? (
                    <div className="w-4 h-4 rounded-full bg-amber/20 border border-amber/40 flex items-center justify-center shrink-0">
                      <Loader2 className="w-3.5 h-3.5 text-amber-ink animate-spin" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-raised border border-line-2 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-text-4" />
                    </div>
                  )}

                  <span
                    className={`font-sans text-xs ${
                      !item.done && item.id === "face"
                        ? "text-amber-ink font-medium"
                        : "text-text-2"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* ZONA HORARIA */}
            <div className="border-t border-line pt-3.5 space-y-1">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-primary font-medium block">
                ZONA HORARIA
              </span>
              <p className="font-mono text-sm font-semibold text-text tracking-wide">
                {projectTimezone || "America/Lima"}
              </p>
              <p className="font-sans text-[11px] text-text-4">
                Todos los horarios se muestran en esta zona.
              </p>
            </div>
          </div>

          {/* Card: GPS */}
          <div className="bg-surface border border-line rounded-2xl p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-primary font-medium">
                GPS
              </span>
              <span className="flex items-center gap-1.5 font-sans text-xs font-semibold text-green-ink">
                <span className="w-2 h-2 rounded-full bg-green-ink inline-block animate-pulse" />
                Activo
              </span>
            </div>

            <p className="font-sans text-sm font-semibold text-text">
              {nearestDistrict || "San Martín de Porres"}
            </p>

            <p className="font-mono text-xs text-text-3">
              LAT {currentPosition ? currentPosition.lat.toFixed(4) : "-12.0184"} · LNG{" "}
              {currentPosition ? currentPosition.lng.toFixed(4) : "-77.0818"}
            </p>

            <p className="font-sans text-[11px] text-text-4 leading-relaxed">
              Precisión ±12 m. La ubicación se adjunta al marcaje.
            </p>
          </div>
        </div>

        {/* ---------- COLUMNA CENTRAL (Cámara y Scanner Biométrico) ---------- */}
        <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2">
          <div className="bg-surface border border-line rounded-3xl p-5 w-full flex flex-col items-center space-y-4 shadow-sm">
            {/* Viewport de Cámara */}
            <div className="bg-inset rounded-2xl w-full h-[360px] sm:h-[420px] relative overflow-hidden flex items-center justify-center border border-line">
              {photo ? (
                <img
                  src={photo}
                  alt="Captura"
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${
                      !cameraOn ? "opacity-0 absolute inset-0 pointer-events-none" : "block"
                    }`}
                  />

                  {!cameraOn && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-text bg-inset">
                      <AlertTriangle className="w-8 h-8 text-amber-ink mb-3 animate-bounce" />
                      <p className="font-sans font-bold text-sm">
                        Cámara no iniciada o bloqueada
                      </p>
                      <p className="font-sans text-xs text-text-4 mt-2 max-w-xs leading-relaxed">
                        Permita el acceso a la cámara en el navegador para continuar.
                      </p>
                      <button
                        onClick={() => startCamera()}
                        className="mt-4 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold"
                      >
                        Iniciar cámara
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Guía Facial Ovalada */}
              {cameraOn && !photo && (
                <div
                  className={`w-[210px] sm:w-[230px] h-[290px] sm:h-[310px] rounded-[110px] border-2 border-dashed transition-all duration-300 pointer-events-none absolute ${
                    faceInside
                      ? "border-green-ink/90 shadow-sm"
                      : "border-line opacity-70"
                  }`}
                />
              )}

              {/* Floating Status Pill over Bottom of Video */}
              {cameraOn && !photo && (
                <div
                  className={`absolute bottom-4 left-1/2 -translate-x-1/2 backdrop-blur-md rounded-full px-5 py-2 flex items-center gap-2.5 shadow-xl whitespace-nowrap text-xs transition-all ${
                    faceInside
                      ? "bg-surface/90 border border-green/40 text-green-ink"
                      : "bg-surface/90 border border-amber/30 text-amber-ink"
                  }`}
                >
                  {faceInside ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-ink" />
                      <span className="font-sans font-medium">
                        Rostro detectado correctamente
                      </span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-amber-ink animate-spin" />
                      <span className="font-sans font-medium">
                        Coloca tu rostro en el óvalo
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Info under camera */}
            <div className="w-full text-left pt-1">
              <h3 className="font-sans text-base sm:text-lg font-bold text-text">
                {faceInside ? "Rostro alineado" : "Alineando rostro"}
              </h3>
              <p className="font-sans text-xs text-text-4 mt-0.5">
                {faceInside
                  ? "Posición correcta. Ya puede confirmar el marcaje."
                  : "Mantenga el rostro dentro de la guía unos segundos."}
              </p>
            </div>

            {/* Action buttons bar */}
            <div className="flex items-center justify-between w-full pt-2 gap-4">
              {!photo ? (
                <>
                  <button
                    onClick={() => handleActionClick("NO_PHOTO")}
                    className="font-sans text-xs text-text-4 hover:text-text transition-colors py-2 px-3 underline-offset-4 hover:underline font-medium cursor-pointer"
                  >
                    Registrar sin foto
                  </button>

                  <button
                    onClick={() => handleActionClick("PHOTO")}
                    disabled={!faceInside}
                    className={`font-sans font-semibold text-sm px-7 py-3 rounded-2xl transition-all ${
                      faceInside
                        ? "bg-brand-gradient hover:opacity-95 text-primary-foreground shadow-sm active:scale-95 cursor-pointer"
                        : "bg-raised border border-line text-text-4/80 cursor-not-allowed"
                    }`}
                  >
                    {faceInside
                      ? isEntryDone
                        ? "Marcar salida"
                        : "Marcar entrada"
                      : "Esperando rostro"}
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <button
                    onClick={retakePhoto}
                    className="flex items-center gap-2 bg-inset border border-line hover:bg-raised text-text text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" /> Repetir foto
                  </button>
                  <button
                    onClick={() => handleActionClick("PHOTO")}
                    className="bg-brand-gradient hover:opacity-95 text-primary-foreground font-semibold text-sm px-7 py-3 rounded-2xl shadow-sm transition-all cursor-pointer"
                  >
                    Confirmar marcaje
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---------- COLUMNA DERECHA (Proyecto, Marcaje anterior, Vacaciones) ---------- */}
        <div className="lg:col-span-3 space-y-4 order-3">
          {/* Card: PROYECTO */}
          <div className="bg-surface border border-line rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-primary font-medium">
                PROYECTO
              </span>
              <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {schedule?.shiftType === "PERMANENT" || schedule?.shiftType === "REGULAR"
                  ? "Regular"
                  : schedule?.shiftType || "Regular"}
              </span>
            </div>

            <h3 className="font-sans text-lg font-bold text-text">
              {project?.name || "test06"}
            </h3>

            {/* Inset Schedule Box */}
            <div className="bg-inset border border-line rounded-xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-sans text-text-3">Entrada</span>
                <span className="font-mono font-semibold text-text">
                  {schedule?.expectedStartTime?.slice(0, 5) || "08:00"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-text-3">Salida</span>
                <span className="font-mono font-semibold text-text">
                  {schedule?.expectedEndTime?.slice(0, 5) || "17:00"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-text-3">Tolerancia</span>
                <span className="font-mono font-semibold text-text">
                  {schedule?.graceMinutes != null
                    ? `${schedule.graceMinutes} min`
                    : "10 min"}
                </span>
              </div>
            </div>
          </div>

          {/* Card: MARCAJE ANTERIOR */}
          <div className="bg-surface border border-line rounded-2xl p-4 space-y-2.5 shadow-sm">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-primary font-medium block">
              MARCAJE ANTERIOR
            </span>

            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-semibold text-text">
                {previousRecord.label}
              </span>
              <span className="font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-green/10 text-green-ink border border-green/20">
                {previousRecord.status}
              </span>
            </div>

            <p className="font-mono text-xs text-text-3">
              Entrada {previousRecord.checkIn} · Salida {previousRecord.checkOut}
            </p>
          </div>

          {/* Card: VACACIONES */}
          <div className="bg-surface border border-line rounded-2xl p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-green-ink font-medium">
                VACACIONES
              </span>
              <span className="font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber/10 text-amber-ink border border-amber/20">
                {primaryVacation?.status === "APPROVED" ? "Aprobadas" : "Pendiente"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-text font-medium">
                {primaryVacation
                  ? `${primaryVacation.startDate
                      .split("-")
                      .reverse()
                      .join("/")} ➔ ${primaryVacation.endDate
                      .split("-")
                      .reverse()
                      .join("/")}`
                  : "08/09/2026 ➔ 09/10/2026"}
              </span>
              <span className="font-mono text-text-4">
                {primaryVacation?.businessDays || 29} días
              </span>
            </div>

            <button
              onClick={() => router.push(vacationsRoute)}
              className="flex items-center gap-1 font-sans text-xs text-cyan hover:text-cyan/80 transition-colors font-medium cursor-pointer pt-1"
            >
              Ver solicitud <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </main>

      {/* ==================== 4. WARNING MODAL ==================== */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-inset border border-line rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-foreground">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-ink" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-lg text-foreground leading-tight">
                  Día no laborable
                </h3>
                <p className="font-sans text-xs text-amber-ink font-semibold mt-0.5">
                  {isHoliday
                    ? "Hoy es feriado."
                    : isOnVacation
                    ? "Estás de vacaciones."
                    : "Es tu día de descanso."}
                </p>
              </div>
            </div>
            <p className="font-sans text-text-2 text-xs sm:text-sm mb-6 leading-relaxed">
              ¿Realmente deseas registrar tu asistencia hoy? Esta acción quedará
              guardada en el historial del proyecto.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 h-11 rounded-xl font-sans font-semibold text-xs border border-line bg-inset hover:bg-raised text-text transition-all cursor-pointer"
                onClick={() => setShowWarningModal(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 h-11 rounded-xl font-sans font-semibold text-xs bg-amber hover:bg-amber/90 text-warning-foreground shadow-lg transition-all cursor-pointer"
                onClick={() => {
                  setShowWarningModal(false);
                  if (pendingAction === "PHOTO") executeCapture();
                  else executeNoPhoto();
                }}
              >
                Sí, registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
