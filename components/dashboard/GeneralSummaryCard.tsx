import { Card, CardContent } from "@/components/ui/card";
import { LegendItem } from "./LegendItem";

interface GeneralSummaryCardProps {
  selectedProject?: { name: string };
  attendanceRate?: number;
  metrics?: {
    totalAttendances: number;
    totalAbsences: number;
    pendingJustifications: number;
  };
  totalUsers?: number;
  teamMembersCount?: number;
  pmsCount?: number;
  adminsCount?: number;
  totalProjects?: number;
  activeProjects?: number;
}

export function GeneralSummaryCard({
  selectedProject = { name: "Todos" },
  attendanceRate = 0,
  metrics,
  teamMembersCount,
  pmsCount,
  adminsCount,
}: GeneralSummaryCardProps) {
  const att = metrics?.totalAttendances ?? teamMembersCount ?? 0;
  const abs = metrics?.totalAbsences ?? adminsCount ?? 0;
  const pend = metrics?.pendingJustifications ?? pmsCount ?? 0;

  const total = att + abs + pend;

  const calculatedRate = attendanceRate || (total > 0 ? Math.round((att / total) * 100) : 0);

  const R = 38;
  const C = 2 * Math.PI * R;

  const attLen = total > 0 ? (att / total) * C : 0;
  const absLen = total > 0 ? (abs / total) * C : 0;
  const pendLen = total > 0 ? (pend / total) * C : 0;

  return (
    <Card className="h-full rounded-3xl shadow-sm overflow-hidden border border-border bg-card">
      <CardContent className="p-5 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-foreground">Resumen General</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Estado actual de asistencia del proyecto</p>
          </div>
          <p className="text-violet-600 dark:text-violet-400 font-semibold text-xs bg-violet-50 dark:bg-violet-950/40 px-2.5 py-1 rounded-full border border-violet-100 dark:border-violet-800">
            {selectedProject?.name || "Todos"}
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center py-2">
          <div className="flex items-center gap-8">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/40" />
                
                {total > 0 ? (
                  <>
                    {/* Asistencias (Emerald) */}
                    {attLen > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={R}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeDasharray={`${attLen} ${C}`}
                        strokeDashoffset="0"
                        strokeLinecap="butt"
                      />
                    )}
                    {/* Faltas (Rose) */}
                    {absLen > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={R}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="12"
                        strokeDasharray={`${absLen} ${C}`}
                        strokeDashoffset={-attLen}
                        strokeLinecap="butt"
                      />
                    )}
                    {/* Pendientes (Amber) */}
                    {pendLen > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={R}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="12"
                        strokeDasharray={`${pendLen} ${C}`}
                        strokeDashoffset={-(attLen + absLen)}
                        strokeLinecap="butt"
                      />
                    )}
                  </>
                ) : (
                  <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/60" />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl sm:text-5xl font-extrabold text-foreground leading-none">{calculatedRate}%</p>
                  <p className="text-[10px] tracking-[2px] text-muted-foreground font-bold mt-1">ASISTENCIA</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <LegendItem color="emerald" label="Asistencias" value={att} />
              <LegendItem color="rose" label="Faltas" value={abs} />
              <LegendItem color="amber" label="Pendientes" value={pend} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}