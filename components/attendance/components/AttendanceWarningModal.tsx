"use client";

import { AlertTriangle } from "lucide-react";

interface AttendanceWarningModalProps {
  isOpen: boolean;
  isHoliday: boolean;
  isOnVacation: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AttendanceWarningModal({
  isOpen,
  isHoliday,
  isOnVacation,
  onCancel,
  onConfirm,
}: AttendanceWarningModalProps) {
  if (!isOpen) return null;

  return (
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
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="flex-1 h-11 rounded-xl font-sans font-semibold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-lg transition-all cursor-pointer"
            onClick={onConfirm}
          >
            Sí, registrar
          </button>
        </div>
      </div>
    </div>
  );
}
