"use client";

import {
  ShieldCheck,
  CalendarDays,
  FolderKanban,
  Plane,
} from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";

interface AttendanceHeaderProps {
  projectName?: string;
  schedule?: any;
  projects?: any[];
  selectedProjectId?: string;
  onSelectProject?: (id: string) => void;
  day?: string;
  date?: string;
  time?: string;
  isOffline?: boolean;
  pendingCount?: number;
  onRetryOffline?: () => void;
}

export function AttendanceHeader({
  projectName = "Proyecto",
  schedule,
  projects = [],
  selectedProjectId = "",
  onSelectProject,
  day,
  date,
  time,
  isOffline,
  pendingCount = 0,
  onRetryOffline,
}: AttendanceHeaderProps) {
  return (
    <div className="w-full space-y-4">
      {/* 1. TOP HEADER */}
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
              Proyecto {projectName} · turno regular{" "}
              {schedule?.expectedStartTime?.slice(0, 5) || "08:00"} -{" "}
              {schedule?.expectedEndTime?.slice(0, 5) || "17:00"}
            </p>
          </div>
        </div>

        {/* Right: Date pill, Digital clock pill & NotificationBell */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* Multi-project quick dropdown if > 1 */}
          {projects.length > 1 && onSelectProject && (
            <div className="flex items-center gap-1.5 bg-card border border-border/80 px-3 py-1.5 rounded-xl">
              <FolderKanban className="w-3.5 h-3.5 text-primary" />
              <select
                value={selectedProjectId}
                onChange={(e) => onSelectProject(e.target.value)}
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
          <div className="flex items-center gap-2 bg-cyan-500/10 dark:bg-[#071927] border border-cyan-500/30 dark:border-cyan-500/40 text-cyan-700 dark:text-[#00E5FF] px-4 py-2 rounded-xl font-mono text-sm font-semibold tracking-wide shadow-xs">
            <span>{time || "10:51:42 p. m."}</span>
          </div>

          {/* Notification Bell */}
          <div className="hidden md:flex">
            <NotificationBell />
          </div>
        </div>
      </div>

      {/* 2. AIRPLANE / OFFLINE BANNER */}
      {(isOffline || pendingCount > 0) && (
        <div className="w-full">
          <div className="bg-amber-50 dark:bg-[#14120B] border border-amber-200 dark:border-[#D97706]/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
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
            {onRetryOffline && (
              <button
                onClick={onRetryOffline}
                className="self-start sm:self-auto border border-[#D97706]/60 bg-transparent hover:bg-[#D97706]/10 text-[#FBBF24] rounded-xl px-5 py-2 text-xs font-semibold transition-all shrink-0 cursor-pointer"
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
