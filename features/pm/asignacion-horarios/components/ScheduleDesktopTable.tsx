"use client";

import { useRouter } from "next/navigation";
import { Clock, Pencil, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

interface ScheduleDesktopTableProps {
  paginated: any[];
  filtered: any[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  setPage: (updater: (prev: number) => number) => void;
  getInitials: (name: string) => string;
  onReset: (userId: string, projectId: string) => void;
  resettingId: string | null;
}

export function ScheduleDesktopTable({
  paginated,
  filtered,
  isLoading,
  page,
  totalPages,
  setPage,
  getInitials,
  onReset,
  resettingId,
}: ScheduleDesktopTableProps) {
  const router = useRouter();

  return (
    <>
      {/* Desktop View: Tabla */}
      <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Proyecto</th>
                <th className="py-3 px-4">Entrada</th>
                <th className="py-3 px-4">Salida</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Cargando horarios...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No hay asignaciones de horario disponibles.
                  </td>
                </tr>
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
                    <tr
                      key={`${r.userId}:${r.projectId || idx}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-gradient text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {getInitials(r.userName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">
                              {r.userName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {r.userEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {r.projectId ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                            {r.projectName}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin proyecto</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-foreground text-sm">
                        {r.effectiveStartHour}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-foreground text-sm">
                        {r.effectiveEndHour}
                      </td>
                      <td className="py-3 px-4">
                        {!r.projectId ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-muted-foreground bg-muted">
                            Sin proyecto
                          </span>
                        ) : r.hasOverride ? (
                          <div className="inline-flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                              Personalizado
                            </span>
                            {shiftBadge && (
                              <span className="inline-block bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40 text-xs px-2 py-0.5 rounded-md font-medium">
                                {shiftBadge}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Del proyecto
                            </span>
                            {shiftBadge && (
                              <span className="inline-block bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40 text-xs px-2 py-0.5 rounded-md font-medium">
                                {shiftBadge}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {r.hasOverride ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/pm/asignacion-horarios/edit?projectId=${r.projectId}&userId=${r.userId}`
                                  )
                                }
                                className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1 transition-colors"
                              >
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => onReset(r.userId, r.projectId)}
                                disabled={resettingId === `${r.userId}:${r.projectId}`}
                                className="h-8 px-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-400 inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Restablecer
                              </button>
                            </>
                          ) : r.projectId ? (
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/pm/asignacion-horarios/asign?projectId=${r.projectId}&userId=${r.userId}`
                                )
                              }
                              className="h-8 px-3 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1.5 shadow-sm transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              Asignar horario
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin proyecto</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between pt-1 px-1">
          <span className="text-xs text-muted-foreground">
            {filtered.length} asignacion{filtered.length === 1 ? "" : "es"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-background flex items-center justify-center text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground font-medium px-1">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-background flex items-center justify-center text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
