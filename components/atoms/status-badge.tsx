"use client";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AttendanceStatus, JustificationStatus, AlertStatus } from '@/lib/graphql/types';

type StatusType = AttendanceStatus | JustificationStatus | AlertStatus | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusStyles: Record<string, string> = {
  // Attendance
  ASISTENCIA: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
  FALTA: "bg-red-500/10 text-red-600 border border-red-500/30",
  TARDE: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  JUSTIFICADO: "bg-blue-500/10 text-blue-600 border border-blue-500/30",

  ON_TIME: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
  ON_TIME_CHECKED_OUT: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
  LATE: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  LATE_CHECKED_OUT: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  EARLY: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
  OUTSIDE_SCHEDULE: "bg-zinc-500/10 text-zinc-600 border border-zinc-500/30",
  OUTSIDE_SCHEDULE_CHECKED_OUT: "bg-zinc-500/10 text-zinc-600 border border-zinc-500/30",
  EARLY_DEPARTURE: "bg-orange-500/10 text-orange-600 border border-orange-500/30",
  OVERTIME: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/30",
  HORAS_EXTRAS: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/30",
  CHECKED_IN: "bg-blue-500/10 text-blue-600 border border-blue-500/30",
  PRESENTE: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
  UNJUSTIFIED: "bg-red-500/10 text-red-600 border border-red-500/30",

  // Justification
  PENDING: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  PENDIENTE: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  SUBMITTED: "bg-blue-500/10 text-blue-600 border border-blue-500/30",
  OBSERVATION: "bg-orange-500/10 text-orange-600 border border-orange-500/30",
  OBSERVADO: "bg-orange-500/10 text-orange-600 border border-orange-500/30",
  APPROVED: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
  REJECTED: "bg-red-500/10 text-red-600 border border-red-500/30",
  APROBADA: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
  RECHAZADA: "bg-red-500/10 text-red-600 border border-red-500/30",

  // Alert
  CANCELADA: "bg-slate-500/10 text-slate-400 border border-slate-500/30",
  RESUELTA: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
};

const statusLabels: Record<string, string> = {
  ASISTENCIA: "Asistencia",
  FALTA: "Falta",
  TARDE: "Tardanza",
  JUSTIFICADO: "Justificado",
  ON_TIME: "Puntual",
  ON_TIME_CHECKED_OUT: "Jornada Completa",
  LATE: "Tardanza",
  LATE_CHECKED_OUT: "Tardanza (Salida)",
  EARLY: "Puntual",
  OUTSIDE_SCHEDULE: "Fuera de Horario",
  OUTSIDE_SCHEDULE_CHECKED_OUT: "Fuera de Horario",
  EARLY_DEPARTURE: "Salida Temprana",
  OVERTIME: "Horas Extras",
  HORAS_EXTRAS: "Horas Extras",
  CHECKED_IN: "Entrada Registrada",
  PRESENTE: "Presente",
  UNJUSTIFIED: "Falta",
  ABSENT: "Falta",
  PENDING: "Pendiente",
  PENDIENTE: "Pendiente",
  SUBMITTED: "Enviado",
  OBSERVATION: "Observado",
  OBSERVADO: "Observado",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
  RESUELTA: "Resuelta",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status?.toUpperCase() || "PENDIENTE";

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium rounded-full px-3 py-1 text-xs transition-all hover:scale-105",
        statusStyles[normalizedStatus] || "bg-slate-500/10 text-slate-400 border-slate-500/30",
        className
      )}
    >
      {statusLabels[normalizedStatus] || normalizedStatus}
    </Badge>
  );
}