"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useClock } from "@/hooks/useClock";
import { useLocation } from "@/hooks/useLocation";
import { useCamera } from "@/hooks/useCamera";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { useUserProject, DEFAULT_MOCK_PROJECT } from "@/features/attendance/hooks/useUserProject";
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

import { AttendanceHeader } from "./components/AttendanceHeader";
import { AttendanceRequirementsCard } from "./components/AttendanceRequirementsCard";
import { AttendanceCameraCard } from "./components/AttendanceCameraCard";
import { AttendanceSummaryCard } from "./components/AttendanceSummaryCard";
import { AttendanceWarningModal } from "./components/AttendanceWarningModal";

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
  const activeProject = project || DEFAULT_MOCK_PROJECT;
  const projectTimezone = getEffectiveTimezone(activeProject?.timezone);

  const router = useRouter();
  const { time, date, day } = useClock(projectTimezone);
  const { coords, nearestDistrict } = useLocation();
  const { videoRef, cameraOn, photo, startCamera, stopCamera, retakePhoto } =
    useCamera();
  const { faceInside } = useFaceDetection(videoRef, cameraOn);

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
  }, [startCamera, stopCamera]);

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

  const readyRequirementsCount = useMemo(() => {
    return checklist.filter((item) => item.done).length;
  }, [checklist]);

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
      currentPosition ? String(currentPosition.lat) : "-12.0184"
    );
    sessionStorage.setItem(
      "attendance_lng",
      currentPosition ? String(currentPosition.lng) : "-77.0817"
    );
    sessionStorage.setItem("attendance_time", new Date().toISOString());
    sessionStorage.setItem("attendance_project_id", activeProject.id);
    sessionStorage.setItem("attendance_project_name", activeProject.name);
    stopCamera();
    router.push(previewRoute);
  };

  const executeNoPhoto = () => {
    sessionStorage.setItem("attendance_photo", "");
    sessionStorage.setItem(
      "attendance_lat",
      currentPosition ? String(currentPosition.lat) : "-12.0184"
    );
    sessionStorage.setItem(
      "attendance_lng",
      currentPosition ? String(currentPosition.lng) : "-77.0817"
    );
    sessionStorage.setItem("attendance_time", new Date().toISOString());
    sessionStorage.setItem("attendance_project_id", activeProject.id);
    sessionStorage.setItem("attendance_project_name", activeProject.name);
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
      {/* 1. TOP HEADER & OFFLINE BANNER */}
      <AttendanceHeader
        projectName={project?.name || "testo6"}
        schedule={schedule}
        projects={projects}
        selectedProjectId={project?.id || ""}
        onSelectProject={selectProject}
        day={day}
        date={date}
        time={time}
        isOffline={isOffline}
        pendingCount={pendingCount}
        onRetryOffline={() => {
          if (typeof window !== "undefined") {
            const offline = !window.navigator.onLine;
            setIsOffline(offline);
            setPendingCount(getPendingCount());
          }
        }}
      />

      {/* 2. THREE-COLUMN BODY */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMNA IZQUIERDA (Requisitos, Zona horaria, GPS) */}
        <AttendanceRequirementsCard
          checklist={checklist}
          readyRequirementsCount={readyRequirementsCount}
          projectTimezone={projectTimezone}
          currentPosition={currentPosition}
          nearestDistrict={nearestDistrict}
        />

        {/* COLUMNA CENTRAL (Cámara y Scanner Biométrico) */}
        <AttendanceCameraCard
          videoRef={videoRef}
          cameraOn={cameraOn}
          photo={photo}
          faceInside={faceInside}
          isEntryDone={isEntryDone}
          onStartCamera={startCamera}
          onRetakePhoto={retakePhoto}
          onActionClick={handleActionClick}
        />

        {/* COLUMNA DERECHA (Proyecto, Marcaje anterior, Vacaciones) */}
        <AttendanceSummaryCard
          project={project}
          schedule={schedule}
          previousRecord={previousRecord}
          primaryVacation={primaryVacation}
          onViewVacations={() => {
            stopCamera();
            router.push(vacationsRoute);
          }}
        />
      </div>

      {/* 3. WARNING MODAL */}
      <AttendanceWarningModal
        isOpen={showWarningModal}
        isHoliday={isHoliday}
        isOnVacation={isOnVacation}
        onCancel={() => setShowWarningModal(false)}
        onConfirm={() => {
          setShowWarningModal(false);
          if (pendingAction === "PHOTO") executeCapture();
          else executeNoPhoto();
        }}
      />
    </div>
  );
}
