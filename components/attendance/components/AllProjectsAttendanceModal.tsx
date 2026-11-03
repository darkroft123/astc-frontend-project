"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Layers, Clock, Check, ChevronRight, X } from "lucide-react";
import type { Project } from "@/features/attendance/hooks/useUserProject";

interface AllProjectsAttendanceModalProps {
  isOpen: boolean;
  projects: Project[];
  onConfirmAll: () => void;
  onSelectProject: (projectId: string) => void;
  onCancel: () => void;
}

export function AllProjectsAttendanceModal({
  isOpen,
  projects,
  onConfirmAll,
  onSelectProject,
  onCancel,
}: AllProjectsAttendanceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalNode = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-foreground relative z-[121] transition-all">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-base sm:text-lg text-foreground leading-tight">
                Múltiples Proyectos
              </h3>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/25">
                Todos los proyectos ({projects.length})
              </span>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p className="font-sans text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">
          Tienes seleccionada la opción <strong className="text-foreground">"Todos los proyectos"</strong>. Esta asistencia se registrará y contará para tus proyectos asignados.
        </p>

        {/* Schedule Reminders */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>Horarios de entrada por proyecto:</span>
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {projects.map((p) => {
              const startTime = p.workStartTime || "08:00";
              const grace = p.graceMinutes ? `(+${p.graceMinutes} min tolerancia)` : "";
              return (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <p className="font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Tu entrada es a las <strong className="text-primary">{startTime}</strong> {grace}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="font-sans text-[11px] text-muted-foreground mt-2 italic">
            * Cada proyecto registrará la puntualidad o tardanza según su propia hora de entrada.
          </p>
        </div>

        {/* Actions or Project Picker */}
        {showPicker ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">Elige un proyecto específico:</span>
              <button
                onClick={() => setShowPicker(false)}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                Volver
              </button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className="w-full text-left p-3 rounded-xl border border-border/70 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-xs text-foreground group-hover:text-primary">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Entrada: {p.workStartTime || "08:00"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <button
              onClick={onConfirmAll}
              className="w-full h-11 rounded-xl font-sans font-semibold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Continuar para todos los proyectos
            </button>

            <button
              onClick={() => setShowPicker(true)}
              className="w-full h-11 rounded-xl font-sans font-semibold text-xs border border-border/80 bg-muted/30 hover:bg-accent text-foreground transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Deseo cambiarlo a un solo proyecto
            </button>

            <button
              onClick={onCancel}
              className="w-full h-9 rounded-xl font-sans font-medium text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalNode, document.body) : null;
}
