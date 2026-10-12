import { cn } from "@/lib/utils";

type StatusType = string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusStyles: Record<string, string> = {
  ON_TIME:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60",
  ON_TIME_CHECKED_OUT:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60",
  LATE:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60",
  LATE_CHECKED_OUT:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60",
  EARLY:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60",
  EARLY_CHECKED_OUT:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60",
  OUTSIDE_SCHEDULE:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60",
  OUTSIDE_SCHEDULE_CHECKED_OUT:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60",
  EARLY_DEPARTURE:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60",
  CHECKED_IN:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800/60",
  CHECKED_OUT:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60",
  PRESENTE:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60",
  FALTA:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60",
  TARDE:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60",
  PENDING:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60",
  SUBMITTED:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800/60",
  OBSERVATION:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60",
  APPROVED:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60",
  REJECTED:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60",
  JUSTIFICADO:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800/60",
  VACACIONES:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800/60",
};

const statusLabels: Record<string, string> = {
  ON_TIME: "A tiempo",
  ON_TIME_CHECKED_OUT: "A tiempo (Salida)",
  LATE: "Tarde",
  LATE_CHECKED_OUT: "Tarde (Salida)",
  EARLY: "Entrada anticipada",
  EARLY_CHECKED_OUT: "Salida anticipada",
  OUTSIDE_SCHEDULE: "Fuera de horario",
  OUTSIDE_SCHEDULE_CHECKED_OUT: "Fuera de horario",
  EARLY_DEPARTURE: "Salida temprana",
  CHECKED_IN: "Entrada registrada",
  CHECKED_OUT: "Salida registrada",
  PRESENTE: "Presente",
  FALTA: "Falta",
  TARDE: "Tarde",
  PENDING: "Borrador",
  SUBMITTED: "Pendiente",
  OBSERVATION: "Observación",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  JUSTIFICADO: "Justificado",
  VACACIONES: "Vacaciones",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedKey = status ? String(status).toUpperCase() : "";
  const label = statusLabels[normalizedKey] || status || "";
  const style =
    statusStyles[normalizedKey] ||
    "bg-muted text-muted-foreground border border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-wider font-semibold border shadow-xs transition-colors",
        style,
        className
      )}
    >
      {label}
    </span>
  );
}