"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import { MonthCalendarPicker } from "./MonthCalendarPicker";

interface MemberExceptionModalProps {
  member: any | null;
  onClose: () => void;
  onSubmit: (member: any, reason: string, type: "USER_INCLUDE" | "USER_EXCLUDE", dates: string[]) => Promise<void>;
}

export function MemberExceptionModal({
  member,
  onClose,
  onSubmit,
}: MemberExceptionModalProps) {
  const [reason, setReason] = useState("");
  const [type, setType] = useState<"USER_INCLUDE" | "USER_EXCLUDE">("USER_INCLUDE");
  const [dates, setDates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!member) return null;

  const handleToggleDate = (dateStr: string) => {
    setDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(member, reason, type, dates);
      setReason("");
      setDates([]);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg md:max-w-3xl max-h-[92vh] overflow-y-auto bg-card dark:bg-[#0E111C] border border-border dark:border-[#1E2335] rounded-[24px] sm:rounded-[28px] p-5 sm:p-7 shadow-2xl relative text-foreground space-y-5">
        {/* Drag Handle (Mobile only) */}
        <div className="w-12 h-1 rounded-full bg-muted-foreground/30 mx-auto md:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-2 border-b border-border dark:border-[#1E2335]">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Calendario personalizado (usuario)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Selecciona las fechas que este trabajador en particular trabajará o descansará fuera del calendario normal.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-border dark:border-[#1E2335] bg-muted/50 dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1c2238] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Left column: Reason and Type */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Motivo de excepción
                </label>
                <input
                  type="text"
                  placeholder="Ej. Permiso especial, cumpleaños..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Tipo de excepción
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet cursor-pointer"
                >
                  <option value="USER_INCLUDE">Día libre (no asiste)</option>
                  <option value="USER_EXCLUDE">Día laborable (ignora feriado)</option>
                </select>
              </div>

              <div className="rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-500/10 p-3.5 text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-blue-600 dark:text-blue-400">¿Cómo funciona?</p>
                <p>
                  <strong>Día libre:</strong> El trabajador no tendrá falta en estas fechas aunque el calendario regular marque día hábil.
                </p>
                <p>
                  <strong>Día laborable:</strong> El trabajador debe asistir aunque el proyecto tenga feriado asignado.
                </p>
              </div>
            </div>

            {/* Right column: Calendar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Fechas de excepción
                </label>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-violet/10 text-violet border border-violet/20 font-semibold">
                  {dates.length} seleccionadas
                </span>
              </div>
              <MonthCalendarPicker
                selectedDates={dates}
                onToggleDate={handleToggleDate}
              />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border dark:border-[#1E2335]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-32 h-11 rounded-xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1c2238] text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-48 h-11 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-violet/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? "Guardando..." : "Guardar excepción"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
