"use client";

import { ArrowRight } from "lucide-react";

interface AttendanceSummaryCardProps {
  project?: { name?: string } | null;
  schedule?: {
    shiftType?: string;
    expectedStartTime?: string;
    expectedEndTime?: string;
    graceMinutes?: number | null;
  } | null;
  previousRecord: {
    label: string;
    status: string;
    checkIn: string;
    checkOut: string;
  };
  primaryVacation?: {
    status?: string;
    startDate: string;
    endDate: string;
    businessDays?: number;
  } | null;
  onViewVacations: () => void;
}

export function AttendanceSummaryCard({
  project,
  schedule,
  previousRecord,
  primaryVacation,
  onViewVacations,
}: AttendanceSummaryCardProps) {
  return (
    <div className="lg:col-span-3 space-y-4 order-3 w-full">
      {/* Card: PROYECTO */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-500 dark:text-[#818CF8] font-semibold">
            PROYECTO
          </span>
          <span className="font-mono text-[11px] px-3 py-0.5 rounded-full bg-purple-100 dark:bg-[#2A2046] text-purple-700 dark:text-[#C4B5FD] border border-purple-200 dark:border-[#8B5CF6]/30 font-medium">
            {schedule?.shiftType === "PERMANENT" || schedule?.shiftType === "REGULAR"
              ? "Regular"
              : schedule?.shiftType || "Regular"}
          </span>
        </div>

        <h3 className="font-sans text-2xl font-bold text-foreground mt-1">
          {project?.name || "Proyecto"}
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
          <span className="font-mono text-[11px] font-semibold px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-[#0B2E24] text-emerald-700 dark:text-[#34D399] border border-emerald-200 dark:border-[#10B981]/30">
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
          <span className="font-mono text-[11px] font-semibold px-3 py-0.5 rounded-full bg-amber-50 dark:bg-[#2B2011] text-amber-700 dark:text-[#FBBF24] border border-amber-200 dark:border-[#F59E0B]/30">
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
          onClick={onViewVacations}
          className="flex items-center gap-1 font-sans text-xs text-emerald-500 dark:text-[#34D399] hover:underline transition-colors font-medium cursor-pointer pt-1"
        >
          Ver solicitud <ArrowRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
