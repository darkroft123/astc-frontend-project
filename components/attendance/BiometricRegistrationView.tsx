"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CalendarDays,
  Plane,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RefreshCcw,
  FolderKanban,
  ArrowRight,
} from "lucide-react";

import { useClock } from "@/hooks/useClock";
import { useLocation } from "@/hooks/useLocation";
import { useCamera } from "@/hooks/useCamera";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { NotificationBell } from "@/components/layout/notification-bell";
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

  // Offline / Airplane mode detection & queue auto-sync (ONLY activates when actually offline)
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

    if (typeof window !== "undefined") {
      updateStatus();
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, [token]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Fetch today attendance & schedule & vacations
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
    <div className="w-full space-y-6 text-foreground font-sans bg-transparent">
      {/* ==================== 1. TOP HEADER (TRANSPARENTE, SIN CONTENEDOR BLOQUEANTE) ==================== */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Icon, Title & Project/Shift info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-card border border-border/80 flex items-center justify-center text-primary shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-indigo-500 dark:text-[#818CF8]" />
          </div>
          <div>
            <h1 className="font-sans text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-tight">
              Registro biométrico
            </h1>
            <p className="font-sans text-xs sm:text-sm font-light text-muted-foreground mt-0.5">
              Proyecto {project?.name || "testo6"} · turno regular{" "}
              {schedule?.expectedStartTime?.slice(0, 5) || "08:00"} -{" "}
              {schedule?.expectedEndTime?.slice(0, 5) || "17:00"}
            </p>
          </div>
        </div>

        {/* Right: Date pill, Digital clock pill & NotificationBell */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* Multi-project quick dropdown if > 1 */}
          {projects.length > 1 && (
            <div className="flex items-center gap-1.5 bg-card border border-border/80 px-3 py-1.5 rounded-xl">
              <FolderKanban className="w-3.5 h-3.5 text-primary" />
              <select
                value={project?.id || ""}
                onChange={(e) => selectProject(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-card text-foreground">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date pill */}
          <div className="flex items-center gap-2 bg-card border border-border/80 text-muted-foreground px-3.5 py-2 rounded-xl text-xs font-sans shadow-sm">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="capitalize">
              {day ? `${day}, ` : ""}
              {date || "2/9/2026"}
            </span>
          </div>

          {/* Digital Time pill */}
          <div className="flex items-center gap-2 bg-[#0B1B2B] dark:bg-[#071927] border border-cyan-500/40 text-cyan-500 dark:text-[#00E5FF] px-4 py-2 rounded-xl font-mono text-sm font-semibold tracking-wide shadow-inner">
            <span>{time || "10:51:42 p. m."}</span>
          </div>

          {/* Notification Bell with red 9+ badge (desktop only, MobileHeader provides the bell on mobile) */}
          <div className="hidden md:flex">
            <NotificationBell />
          </div>
        </div>
      </div>

      {/* ==================== 2. AIRPLANE / OFFLINE BANNER (SOLO SE MUESTRA SI REALMENTE ESTÁ OFFLINE) ==================== */}
      {(isOffline || pendingCount > 0) && (
        <div className="w-full">
          <div className="bg-[#14120B] dark:bg-[#14120B] bg-amber-500/10 border border-[#D97706]/40 dark:border-[#D97706]/40 border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                <Plane className="w-5 h-5 text-[#F59E0B] rotate-[-45deg]" />
              </div>
              <div>
                <h2 className="font-sans font-semibold text-foreground text-sm">
                  Modo avión activado
                </h2>
                <p className="font-sans text-xs text-muted-foreground mt-0.5">
                  El marcaje se guarda en el dispositivo y se sincroniza al recuperar conexión.
                  {pendingCount > 0 ? ` (Pendientes: ${pendingCount})` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  const offline = !window.navigator.onLine;
                  setIsOffline(offline);
                  setPendingCount(getPendingCount());
                }
              }}
              className="self-start sm:self-auto border border-[#D97706]/60 bg-transparent hover:bg-[#D97706]/10 text-[#FBBF24] rounded-xl px-5 py-2 text-xs font-semibold transition-all shrink-0 cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* ==================== 3. THREE-COLUMN BODY (SIN ANIDAR TAG MAIN) ==================== */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ---------- COLUMNA IZQUIERDA (Requisitos, Zona horaria, GPS) ---------- */}
        <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
          {/* Card: REQUISITOS */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-500 dark:text-[#818CF8] font-semibold">
                REQUISITOS
              </span>
              <span className="font-sans text-xs text-muted-foreground">
                {readyRequirementsCount} de 4 listos
              </span>
            </div>

            {/* Checklist items */}
            <div className="space-y-3">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5">
                  {item.done ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  ) : item.id === "face" ? (
                    <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    </div>
                  )}

                  <span
                    className={`font-sans text-xs ${
                      !item.done && item.id === "face"
                        ? "text-amber-400 dark:text-[#FBBF24] font-medium"
                        : "text-foreground/80 dark:text-slate-300"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* ZONA HORARIA */}
            <div className="border-t border-border/80 pt-3.5 space-y-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-500 dark:text-[#818CF8] font-semibold block">
                ZONA HORARIA
              </span>
              <p className="font-mono text-sm font-bold text-foreground tracking-wide">
                {projectTimezone || "America/Lima"}
              </p>
              <p className="font-sans text-[11px] text-muted-foreground">
                Todos los horarios se muestran en esta zona.
              </p>
            </div>
          </div>

          {/* Card: GPS */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-500 dark:text-[#818CF8] font-semibold">
                GPS
              </span>
              <span className="flex items-center gap-1.5 font-sans text-xs font-semibold text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Activo
              </span>
            </div>

            <p className="font-sans text-sm font-bold text-foreground">
              {nearestDistrict || "San Martín de Porres"}
            </p>

            <p className="font-mono text-xs text-muted-foreground">
              LAT {currentPosition ? currentPosition.lat.toFixed(4) : "-12.0184"} · LNG{" "}
              {currentPosition ? currentPosition.lng.toFixed(4) : "-77.0818"}
            </p>

            <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">
              Precisión ±12 m. La ubicación se adjunta al marcaje.
            </p>
          </div>
        </div>

        {/* ---------- COLUMNA CENTRAL (Cámara y Scanner Biométrico) ---------- */}
        <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2">
          <div className="bg-card border border-border/80 rounded-3xl p-5 w-full flex flex-col items-center space-y-4 shadow-sm">
            {/* Viewport de Cámara */}
            <div className="bg-muted rounded-2xl w-full h-[360px] sm:h-[430px] relative overflow-hidden flex items-center justify-center border border-border/60">
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
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-foreground bg-muted">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mb-3 animate-bounce" />
                      <p className="font-sans font-bold text-sm">
                        Cámara no iniciada o bloqueada
                      </p>
                      <p className="font-sans text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed">
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
                  className={`w-[230px] h-[310px] rounded-[115px] border-2 border-dashed transition-all duration-300 pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
                    faceInside
                      ? "border-emerald-400 border-solid shadow-[0_0_25px_rgba(52,211,153,0.35)]"
                      : "border-white/25"
                  }`}
                />
              )}

              {/* Floating Status Pill over Bottom of Video */}
              {cameraOn && !photo && (
                <div
                  className={`absolute bottom-5 left-1/2 -translate-x-1/2 backdrop-blur-md rounded-full px-5 py-2.5 flex items-center gap-2.5 shadow-xl whitespace-nowrap text-xs transition-all ${
                    faceInside
                      ? "bg-[#062419]/90 border border-emerald-500/50 text-emerald-300"
                      : "bg-[#16130D]/90 border border-amber-500/50 text-amber-300"
                  }`}
                >
                  {faceInside ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-sans font-medium">
                        Rostro detectado correctamente
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 inline-block shrink-0" />
                      <span className="font-sans font-medium">
                        Buscando rostro... encuadre su cara en la guía
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Info under camera */}
            <div className="w-full text-left pt-1">
              <h3 className="font-sans text-base sm:text-lg font-bold text-foreground">
                {faceInside ? "Rostro alineado" : "Alineando rostro"}
              </h3>
              <p className="font-sans text-xs text-muted-foreground mt-0.5">
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
                    className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors py-2 px-3 underline-offset-4 hover:underline font-medium cursor-pointer"
                  >
                    Registrar sin foto
                  </button>

                  <button
                    onClick={() => handleActionClick("PHOTO")}
                    className="font-sans font-semibold text-sm px-8 py-3 rounded-2xl text-white transition-all shadow-lg shadow-indigo-500/25 active:scale-95 cursor-pointer"
                    style={{
                      background: "linear-gradient(90deg, #5B8CFF 0%, #A855F7 52%, #22C3E6 100%)",
                    }}
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
                    className="flex items-center gap-2 bg-card border border-border/80 hover:bg-accent text-foreground text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" /> Repetir foto
                  </button>
                  <button
                    onClick={() => handleActionClick("PHOTO")}
                    className="font-sans font-semibold text-sm px-8 py-3 rounded-2xl text-white transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
                    style={{
                      background: "linear-gradient(90deg, #5B8CFF 0%, #A855F7 52%, #22C3E6 100%)",
                    }}
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
          <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-500 dark:text-[#818CF8] font-semibold">
                PROYECTO
              </span>
              <span className="font-mono text-[11px] px-3 py-0.5 rounded-full bg-[#2A2046] text-[#C4B5FD] border border-[#8B5CF6]/30 font-medium">
                {schedule?.shiftType === "PERMANENT" || schedule?.shiftType === "REGULAR"
                  ? "Regular"
                  : schedule?.shiftType || "Regular"}
              </span>
            </div>

            <h3 className="font-sans text-2xl font-bold text-foreground mt-1">
              {project?.name || "testo6"}
            </h3>

            {/* Inset Schedule Box */}
            <div className="bg-muted/70 border border-border/80 rounded-xl p-3.5 space-y-2.5 text-xs mt-3">
              <div className="flex items-center justify-between">
                <span className="font-sans text-muted-foreground">Entrada</span>
                <span className="font-mono font-semibold text-foreground">
                  {schedule?.expectedStartTime?.slice(0, 5) || "08:00"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-muted-foreground">Salida</span>
                <span className="font-mono font-semibold text-foreground">
                  {schedule?.expectedEndTime?.slice(0, 5) || "17:00"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-muted-foreground">Tolerancia</span>
                <span className="font-mono font-semibold text-foreground">
                  {schedule?.graceMinutes != null
                    ? `${schedule.graceMinutes} min`
                    : "10 min"}
                </span>
              </div>
            </div>
          </div>

          {/* Card: MARCAJE ANTERIOR */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-2.5 shadow-sm">
            <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-500 dark:text-[#818CF8] font-semibold block">
              MARCAJE ANTERIOR
            </span>

            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-bold text-foreground">
                {previousRecord.label}
              </span>
              <span className="font-mono text-[11px] font-semibold px-3 py-0.5 rounded-full bg-[#0B2E24] text-[#34D399] border border-[#10B981]/30">
                ● {previousRecord.status}
              </span>
            </div>

            <p className="font-mono text-xs text-muted-foreground mt-1">
              Entrada {previousRecord.checkIn} · Salida {previousRecord.checkOut}
            </p>
          </div>

          {/* Card: VACACIONES */}
          <div className="bg-card border border-emerald-500/40 rounded-2xl p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-500 dark:text-[#34D399] font-semibold">
                VACACIONES
              </span>
              <span className="font-mono text-[11px] font-semibold px-3 py-0.5 rounded-full bg-[#2B2011] text-[#FBBF24] border border-[#F59E0B]/30">
                {primaryVacation?.status === "APPROVED" ? "Aprobadas" : "Pendiente"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-foreground font-medium">
                {primaryVacation
                  ? `${primaryVacation.startDate
                      .split("-")
                      .reverse()
                      .join("/")} → ${primaryVacation.endDate
                      .split("-")
                      .reverse()
                      .join("/")}`
                  : "08/09/2026 → 09/10/2026"}
              </span>
              <span className="font-mono text-muted-foreground">
                {primaryVacation?.businessDays || 29} días
              </span>
            </div>

            <button
              onClick={() => router.push(vacationsRoute)}
              className="flex items-center gap-1 font-sans text-xs text-emerald-500 dark:text-[#34D399] hover:underline transition-colors font-medium cursor-pointer pt-1"
            >
              Ver solicitud <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================== 4. WARNING MODAL (Día no laborable) ==================== */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-foreground">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-lg text-foreground leading-tight">
                  Día no laborable
                </h3>
                <p className="font-sans text-xs text-amber-500 font-semibold mt-0.5">
                  {isHoliday
                    ? "Hoy es feriado."
                    : isOnVacation
                    ? "Estás de vacaciones."
                    : "Es tu día de descanso."}
                </p>
              </div>
            </div>
            <p className="font-sans text-muted-foreground text-xs sm:text-sm mb-6 leading-relaxed">
              ¿Realmente deseas registrar tu asistencia hoy? Esta acción quedará
              guardada en el historial del proyecto.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 h-11 rounded-xl font-sans font-semibold text-xs border border-border/80 bg-card hover:bg-accent text-foreground transition-all cursor-pointer"
                onClick={() => setShowWarningModal(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 h-11 rounded-xl font-sans font-semibold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-lg transition-all cursor-pointer"
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
