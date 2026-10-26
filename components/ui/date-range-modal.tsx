"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, X, Check } from "lucide-react";

export type DateRange = {
  from: string;
  to: string;
};

export interface DateRangeModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  fromDate?: string;
  toDate?: string;
  initialRange?: DateRange;
  onApply: ((from: string, to: string) => void) | ((range: DateRange) => void);
}

export function DateRangeModal({
  isOpen,
  open,
  onClose,
  onOpenChange,
  fromDate,
  toDate,
  initialRange,
  onApply,
}: DateRangeModalProps) {
  const visible = open !== undefined ? open : (isOpen ?? false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initialFrom = initialRange?.from || fromDate || "01/09/2026";
  const initialTo = initialRange?.to || toDate || "03/09/2026";

  const [tempFrom, setTempFrom] = useState(initialFrom);
  const [tempTo, setTempTo] = useState(initialTo);

  useEffect(() => {
    if (visible) {
      setTempFrom(initialRange?.from || fromDate || "01/09/2026");
      setTempTo(initialRange?.to || toDate || "03/09/2026");
    }
  }, [visible, fromDate, toDate, initialRange]);

  if (!visible || !mounted) return null;

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const formatDateStr = (d: Date) => {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const applyPreset = (days: number) => {
    const end = new Date(2026, 8, 3);
    const start = new Date(2026, 8, 3);
    start.setDate(end.getDate() - days);
    setTempFrom(formatDateStr(start));
    setTempTo(formatDateStr(end));
  };

  const applyThisMonth = () => {
    setTempFrom("01/09/2026");
    setTempTo("30/09/2026");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempFrom || !tempTo) return;
    
    // Call onApply supporting both signatures
    (onApply as any)({ from: tempFrom, to: tempTo });
    try {
      (onApply as any)(tempFrom, tempTo);
    } catch {
      // safe
    }
    handleClose();
  };

  const modalNode = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 text-foreground relative z-[101]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-purple-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-base text-foreground tracking-tight">
                Rango personalizado
              </h2>
              <p className="font-sans text-xs text-muted-foreground">
                Selecciona fechas para filtrar
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Desde
              </label>
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={tempFrom}
                onChange={(e) => setTempFrom(e.target.value)}
                required
                className="w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Hasta
              </label>
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={tempTo}
                onChange={(e) => setTempTo(e.target.value)}
                required
                className="w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Quick presets row */}
          <div className="space-y-1.5 pt-1">
            <label className="font-mono text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
              ACCESOS RÁPIDOS
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => applyPreset(7)}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                7 días
              </button>
              <button
                type="button"
                onClick={() => applyPreset(15)}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                15 días
              </button>
              <button
                type="button"
                onClick={() => applyPreset(30)}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                30 días
              </button>
              <button
                type="button"
                onClick={applyThisMonth}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                Este mes
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-brand-gradient hover:opacity-95 text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aplicar rango</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalNode, document.body) : null;
}
