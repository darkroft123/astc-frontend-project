"use client";

import { useRouter } from "next/navigation";
import { Clock, Pencil, RotateCcw } from "lucide-react";

interface ScheduleMobileCardsProps {
  paginated: any[];
  isLoading: boolean;
  getInitials: (name: string) => string;
  onReset: (userId: string, projectId: string) => void;
  resettingId: string | null;
}

export function ScheduleMobileCards({
  paginated,
  isLoading,
  getInitials,
  onReset,
  resettingId,
}: ScheduleMobileCardsProps) {
  const router = useRouter();

  return (
    <div className="space-y-3 md:hidden">
      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Cargando horarios...
        </div>
      ) : paginated.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground bg-card rounded-2xl border border-border">
          No hay asignaciones de horario disponibles.
        </div>
      ) : (
        paginated.map((r, idx) => {
          const shiftBadge =
            r.shiftType === "ROTATING_4X4"
              ? "4×4"
              : r.shiftType === "ROTATING_7X7"
              ? "7×7"
              : r.shiftType === "FLEXIBLE"
              ? "Flexible"
              : (r.shiftType === "TRANSITORY" || r.shiftType === "FIXED")
              ? (r.shiftType === "FIXED" ? "Fijo" : "Transitorio")
              : null;

          return (
            <div
              key={`${r.userId}:${r.projectId || idx}`}
              className="bg-card border border-border rounded-2xl p-4 space-y-3"
            >
              {/* Top user row */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-gradient text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                  {getInitials(r.userName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-base text-foreground leading-tight truncate">
                    {r.userName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {r.userEmail}
                  </p>
                </div>
              </div>

              {/* Badges row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {r.projectId ? (
                  <span className="inline-block bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    {r.projectName}
                  </span>
                ) : (
                  <span className="inline-block bg-muted text-muted-foreground text-xs px-2.5 py-0.5 rounded-full font-medium">
                    Sin proyecto
                  </span>
                )}

                {r.hasOverride ? (
                  <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Personalizado
                  </span>
                ) : r.projectId ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Del proyecto
                  </span>
                ) : null}

                {shiftBadge && (
                  <span className="inline-block bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    {shiftBadge}
                  </span>
                )}
              </div>

              {/* Inset Schedule Details */}
              <div className="bg-background/60 border border-border/80 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                    ENTRADA
                  </span>
                  <span className="font-mono text-sm font-semibold text-foreground mt-0.5 block">
                    {r.effectiveStartHour}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                    SALIDA
                  </span>
                  <span className="font-mono text-sm font-semibold text-foreground mt-0.5 block">
                    {r.effectiveEndHour}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-1">
                {r.hasOverride ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/pm/asignacion-horarios/edit?projectId=${r.projectId}&userId=${r.userId}`
                        )
                      }
                      className="h-10 px-3 rounded-xl border border-border bg-background/50 hover:bg-background text-xs font-medium text-foreground inline-flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onReset(r.userId, r.projectId)}
                      disabled={resettingId === `${r.userId}:${r.projectId}`}
                      className="h-10 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-400 inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restablecer
                    </button>
                  </div>
                ) : r.projectId ? (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/pm/asignacion-horarios/asign?projectId=${r.projectId}&userId=${r.userId}`
                      )
                    }
                    className="w-full h-10 rounded-xl border border-border bg-background/50 hover:bg-background text-xs font-medium text-foreground inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Asignar horario
                  </button>
                ) : (
                  <div className="text-center py-2 text-xs text-muted-foreground">
                    Sin proyecto
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
