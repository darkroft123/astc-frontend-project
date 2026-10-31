"use client";

import { useState, useEffect, useRef } from "react";
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

/**
 * Converts dd/mm/yyyy or yyyy-mm-dd into yyyy-mm-dd for <input type="date" />
 */
function toIsoDate(val: string | undefined, fallback: Date): string {
  if (!val) {
    const y = fallback.getFullYear();
    const m = String(fallback.getMonth() + 1).padStart(2, "0");
    const d = String(fallback.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const clean = val.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    return clean.slice(0, 10);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    const [dd, mm, yyyy] = clean.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }
  const y = fallback.getFullYear();
  const m = String(fallback.getMonth() + 1).padStart(2, "0");
  const d = String(fallback.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Converts yyyy-mm-dd into dd/mm/yyyy
 */
function toSlashDate(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [yyyy, mm, dd] = iso.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }
  return iso;
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

  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const now = new Date();
  const defaultFromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultToDate = now;

  const [tempFromIso, setTempFromIso] = useState<string>(() =>
    toIsoDate(initialRange?.from || fromDate, defaultFromDate)
  );
  const [tempToIso, setTempToIso] = useState<string>(() =>
    toIsoDate(initialRange?.to || toDate, defaultToDate)
  );

  useEffect(() => {
    if (visible) {
      const currentNow = new Date();
      setTempFromIso(
        toIsoDate(
          initialRange?.from || fromDate,
          new Date(currentNow.getFullYear(), currentNow.getMonth(), 1)
        )
      );
      setTempToIso(toIsoDate(initialRange?.to || toDate, currentNow));
    }
  }, [visible, fromDate, toDate, initialRange]);

  if (!visible || !mounted) return null;

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setTempFromIso(toIsoDate(undefined, start));
    setTempToIso(toIsoDate(undefined, end));
  };

  const applyThisMonth = () => {
    const current = new Date();
    const first = new Date(current.getFullYear(), current.getMonth(), 1);
    const last = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    setTempFromIso(toIsoDate(undefined, first));
    setTempToIso(toIsoDate(undefined, last));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempFromIso || !tempToIso) return;

    const usesIsoArgs =
      !initialRange &&
      ((fromDate && /^\d{4}-\d{2}-\d{2}/.test(fromDate)) || onApply.length >= 2);

    if (usesIsoArgs && onApply.length >= 2) {
      (onApply as (from: string, to: string) => void)(tempFromIso, tempToIso);
    } else {
      const slashFrom = toSlashDate(tempFromIso);
      const slashTo = toSlashDate(tempToIso);
      (onApply as (range: DateRange) => void)({ from: slashFrom, to: slashTo });
    }
    handleClose();
  };

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (!ref.current) return;
    try {
      if (typeof (ref.current as any).showPicker === "function") {
        (ref.current as any).showPicker();
      } else {
        ref.current.focus();
        ref.current.click();
      }
    } catch {
      ref.current.focus();
    }
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
            type="button"
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
              <label className="text-xs font-semibold text-foreground block">
                Desde
              </label>
              <div className="relative">
                <input
                  ref={fromInputRef}
                  type="date"
                  value={tempFromIso}
                  onChange={(e) => setTempFromIso(e.target.value)}
                  required
                  className="w-full h-10 bg-background/50 border border-border rounded-xl pl-3 pr-9 py-2 text-xs sm:text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => openPicker(fromInputRef)}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A855F7] hover:text-purple-400 transition-colors cursor-pointer pointer-events-auto"
                  aria-label="Abrir calendario Desde"
                >
                  <CalendarIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Hasta
              </label>
              <div className="relative">
                <input
                  ref={toInputRef}
                  type="date"
                  value={tempToIso}
                  onChange={(e) => setTempToIso(e.target.value)}
                  required
                  className="w-full h-10 bg-background/50 border border-border rounded-xl pl-3 pr-9 py-2 text-xs sm:text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => openPicker(toInputRef)}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A855F7] hover:text-purple-400 transition-colors cursor-pointer pointer-events-auto"
                  aria-label="Abrir calendario Hasta"
                >
                  <CalendarIcon className="w-4 h-4" />
                </button>
              </div>
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
