"use client";

import { useState } from "react";
import { X, Check, Calendar as CalendarIcon } from "lucide-react";
import { MonthCalendarPicker } from "./MonthCalendarPicker";

interface CreateProjectCollectionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, dates: string[], dateNames: Record<string, string>) => Promise<void>;
}

export function CreateProjectCollectionModal({
  open,
  onClose,
  onSubmit,
}: CreateProjectCollectionModalProps) {
  const [name, setName] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [dateNames, setDateNames] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleToggleDate = (dateStr: string) => {
    setDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(name, dates, dateNames);
      setName("");
      setDates([]);
      setDateNames({});
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
      <div className="w-full max-w-lg md:max-w-4xl max-h-[92vh] overflow-y-auto bg-card dark:bg-[#0E111C] border border-border dark:border-[#1E2335] rounded-[24px] sm:rounded-[28px] p-5 sm:p-7 shadow-2xl relative text-foreground space-y-5">
        {/* Drag Handle (Mobile only) */}
        <div className="w-12 h-1 rounded-full bg-muted-foreground/30 mx-auto md:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-2 border-b border-border dark:border-[#1E2335]">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Crear colección para el proyecto
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Crea una colección de fechas que solo aplicará a este proyecto.
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
          {/* Desktop 2-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Left Column: Nombre & Calendar */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Nombre de la colección<span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Feriados Perú 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Selecciona las fechas
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

            {/* Right Column: Holiday Names / Empty prompt */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                Nombres específicos <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>

              {dates.length > 0 ? (
                <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-muted/50 dark:bg-[#111422] p-4 space-y-3">
                  <p className="text-[11px] text-muted-foreground">
                    Asigna un nombre a cada feriado seleccionado para que tus trabajadores lo identifiquen fácilmente:
                  </p>
                  <div className="space-y-2 max-h-[300px] md:max-h-[350px] overflow-y-auto pr-1">
                    {dates.map((dateStr) => (
                      <div key={dateStr} className="flex items-center gap-2">
                        <span className="px-3 py-2 rounded-xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#141829] text-xs font-mono text-foreground min-w-[105px] text-center shrink-0">
                          {dateStr}
                        </span>
                        <input
                          type="text"
                          placeholder="Ej. Día del Trabajador..."
                          value={dateNames[dateStr] || ""}
                          onChange={(e) =>
                            setDateNames((prev) => ({
                              ...prev,
                              [dateStr]: e.target.value,
                            }))
                          }
                          className="flex-1 h-9 px-3 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border dark:border-[#1E2335] bg-muted/30 dark:bg-[#111422]/60 p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[260px]">
                  <div className="w-12 h-12 rounded-2xl bg-background dark:bg-[#141829] border border-border dark:border-[#1E2335] flex items-center justify-center text-violet">
                    <CalendarIcon className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    Ninguna fecha seleccionada
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-[240px]">
                    Haz clic en los días del calendario a la izquierda para marcarlos como feriados y asignarles un nombre.
                  </p>
                </div>
              )}
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
              className="w-full sm:w-44 h-11 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-violet/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? "Guardando..." : "Guardar colección"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
