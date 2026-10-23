"use client";

import { Info, Plus, Save } from "lucide-react";

interface ScheduleCreationActionBarProps {
  isFormValid: boolean;
  isEditMode: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function ScheduleCreationActionBar({
  isFormValid,
  isEditMode,
  isSubmitting,
  onCancel,
}: ScheduleCreationActionBarProps) {
  return (
    <div className="rounded-[20px] sm:rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5 text-center sm:text-left">
        <Info className="w-4 h-4 shrink-0 text-muted-foreground" />
        {!isFormValid
          ? "Completa proyecto y nombre para guardar."
          : isEditMode
          ? "Cambios listos para guardar en la plantilla."
          : "Horario listo para guardar en el proyecto."}
      </p>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 sm:flex-initial h-11 px-6 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1c2238] text-xs sm:text-sm font-semibold text-foreground flex items-center justify-center transition-colors cursor-pointer"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className={`flex-1 sm:flex-initial h-11 px-6 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
            isFormValid && !isSubmitting
              ? "text-white cursor-pointer hover:opacity-95 active:scale-98 shadow-purple-500/20"
              : "text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-white/10 cursor-not-allowed border border-slate-300 dark:border-white/5"
          }`}
          style={{
            background:
              isFormValid && !isSubmitting
                ? "linear-gradient(90deg, #5B8CFF 0%, #A855F7 100%)"
                : undefined,
          }}
        >
          {isEditMode ? (
            <Save className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>
            {isSubmitting
              ? isEditMode
                ? "Guardando..."
                : "Creando..."
              : isEditMode
              ? "Guardar cambios"
              : "Crear horario"}
          </span>
        </button>
      </div>
    </div>
  );
}
