"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Check, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Period =
  | "today"
  | "thisweek"
  | "month"
  | "currentperiod"
  | "3months"
  | "6months"
  | "9months"
  | "total"
  | "custom";

interface DateRange {
  fromDate: string;
  toDate: string;
  label: string;
  period: Period;
}

interface PeriodSelectorProps {
  period: Period;
  dateRange: DateRange;
  onPeriodChange: (newRange: DateRange) => void;
}

export default function PeriodSelector({
  period,
  dateRange,
  onPeriodChange,
}: PeriodSelectorProps) {
  const [customFromStr, setCustomFromStr] = useState<string>(dateRange.fromDate || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`);
  const [customToStr, setCustomToStr] = useState<string>(dateRange.toDate || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const periodOptions = [
    { key: "today" as Period, label: "Hoy" },
    { key: "thisweek" as Period, label: "Esta semana" },
    { key: "month" as Period, label: "Este mes" },
    { key: "3months" as Period, label: "3 meses" },
    { key: "6months" as Period, label: "6 meses" },
    { key: "9months" as Period, label: "9 meses" },
    { key: "total" as Period, label: "Total" },
  ];

  const getInitialRange = (p: Period): DateRange => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (p === "today") {
      const d = formatDate(today);
      return { fromDate: d, toDate: d, label: "Hoy", period: p };
    }

    if (p === "thisweek") {
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
      return {
        fromDate: formatDate(monday),
        toDate: formatDate(today),
        label: "Esta semana",
        period: p,
      };
    }

    if (p === "month") {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        fromDate: formatDate(from),
        toDate: formatDate(today),
        label: format(today, "MMMM yyyy", { locale: es }),
        period: p,
      };
    }

    if (p === "currentperiod") {
      const day = today.getDate();
      let from: Date;
      if (day <= 15) {
        from = new Date(today.getFullYear(), today.getMonth(), 1);
      } else {
        from = new Date(today.getFullYear(), today.getMonth(), 16);
      }
      return {
        fromDate: formatDate(from),
        toDate: formatDate(today),
        label: "Periodo actual",
        period: p,
      };
    }

    if (p === "3months") {
      const from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      return {
        fromDate: formatDate(from),
        toDate: formatDate(today),
        label: "Últimos 3 meses",
        period: p,
      };
    }

    if (p === "6months") {
      const from = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      return {
        fromDate: formatDate(from),
        toDate: formatDate(today),
        label: "Últimos 6 meses",
        period: p,
      };
    }

    if (p === "9months") {
      const from = new Date(today.getFullYear(), today.getMonth() - 8, 1);
      return {
        fromDate: formatDate(from),
        toDate: formatDate(today),
        label: "Últimos 9 meses",
        period: p,
      };
    }

    return {
      fromDate: "2000-01-01",
      toDate: formatDate(today),
      label: "Total general",
      period: p,
    };
  };

  const selectPreset = (p: Period) => {
    const range = getInitialRange(p);
    onPeriodChange(range);
  };

  const handleOpenCustomDialog = () => {
    setCustomFromStr(dateRange.fromDate || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`);
    setCustomToStr(dateRange.toDate || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`);
    setCustomDialogOpen(true);
  };

  const handleQuickPreset = (daysOrType: number | "month") => {
    const today = new Date();
    const formatIso = (d: Date) => d.toISOString().split("T")[0];

    if (daysOrType === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setCustomFromStr(formatIso(firstDay));
      setCustomToStr(formatIso(today));
    } else {
      const past = new Date(today);
      past.setDate(today.getDate() - daysOrType);
      setCustomFromStr(formatIso(past));
      setCustomToStr(formatIso(today));
    }
  };

  const applyCustomRange = () => {
    if (!customFromStr || !customToStr) return;

    const [y1, m1, d1] = customFromStr.split("-").map(Number);
    const [y2, m2, d2] = customToStr.split("-").map(Number);
    const fromDate = new Date(y1, m1 - 1, d1);
    const toDate = new Date(y2, m2 - 1, d2);

    const newRange: DateRange = {
      fromDate: customFromStr,
      toDate: customToStr,
      label: `${format(fromDate, "dd MMM", { locale: es })} - ${format(
        toDate,
        "dd MMM yyyy",
        { locale: es }
      )}`,
      period: "custom",
    };

    onPeriodChange(newRange);
    setCustomDialogOpen(false);
  };

  const handleMobileSelect = (value: string) => {
    if (value === "custom") {
      handleOpenCustomDialog();
    } else {
      selectPreset(value as Period);
    }
  };

  const customModal = (
    <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
      <DialogContent className="sm:max-w-md rounded-3xl border border-slate-200 dark:border-[#22283A] bg-white dark:bg-[#131622] p-5 sm:p-6 shadow-2xl [&>button]:hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#201A36] dark:bg-[#201A36] border border-[#3E2D68] flex items-center justify-center shrink-0 shadow-sm">
              <CalendarIcon className="w-5 h-5 text-[#C084FC]" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground dark:text-white tracking-tight">
                Rango personalizado
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground dark:text-[#8F98B2] mt-0.5">
                Selecciona fechas para filtrar
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCustomDialogOpen(false)}
            className="text-muted-foreground dark:text-[#8F98B2] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer p-1 rounded-lg"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs */}
        <div className="mt-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-foreground dark:text-white mb-1.5">
              Desde
            </label>
            <input
              type="date"
              value={customFromStr}
              onChange={(e) => setCustomFromStr(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#0D0F1A] border border-slate-200 dark:border-[#22283A] text-sm text-foreground dark:text-white font-mono focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground dark:text-white mb-1.5">
              Hasta
            </label>
            <input
              type="date"
              value={customToStr}
              onChange={(e) => setCustomToStr(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#0D0F1A] border border-slate-200 dark:border-[#22283A] text-sm text-foreground dark:text-white font-mono focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
            />
          </div>

          {/* Accesos rápidos */}
          <div>
            <p className="text-[10.5px] font-mono uppercase tracking-[0.05em] text-muted-foreground dark:text-[#8F98B2] font-semibold mt-4 mb-2">
              ACCESOS RÁPIDOS
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleQuickPreset(7)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#141828] border border-slate-200 dark:border-[#232A40] text-foreground dark:text-[#C8D1E6] hover:bg-slate-200 dark:hover:bg-[#1E243A] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer"
              >
                7 días
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(15)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#141828] border border-slate-200 dark:border-[#232A40] text-foreground dark:text-[#C8D1E6] hover:bg-slate-200 dark:hover:bg-[#1E243A] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer"
              >
                15 días
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(30)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#141828] border border-slate-200 dark:border-[#232A40] text-foreground dark:text-[#C8D1E6] hover:bg-slate-200 dark:hover:bg-[#1E243A] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer"
              >
                30 días
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset("month")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#141828] border border-slate-200 dark:border-[#232A40] text-foreground dark:text-[#C8D1E6] hover:bg-slate-200 dark:hover:bg-[#1E243A] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer"
              >
                Este mes
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-[#1E243A] my-4" />

        {/* Footer buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCustomDialogOpen(false)}
            className="px-5 h-11 rounded-2xl bg-slate-100 dark:bg-[#141828] border border-slate-200 dark:border-[#232A40] text-xs font-semibold text-foreground dark:text-[#C8D1E6] hover:bg-slate-200 dark:hover:bg-[#1E243A] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={applyCustomRange}
            disabled={!customFromStr || !customToStr}
            className="flex-1 h-11 rounded-2xl bg-brand-gradient hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Aplicar rango</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );

  /* ===================== MOBILE ===================== */

  if (isMobile) {
    return (
      <>
        <Select value={period === "custom" ? "custom" : period} onValueChange={handleMobileSelect}>
          <SelectTrigger className="w-full bg-brand-gradient text-primary-foreground border-0 rounded-2xl h-11 px-4 text-xs font-semibold shadow-sm [&>svg]:text-primary-foreground">
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border border-border bg-card shadow-2xl min-w-[180px]">
            {periodOptions.map((p) => (
              <SelectItem
                key={p.key}
                value={p.key}
                className="text-xs font-medium rounded-xl data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus:bg-muted"
              >
                {p.label}
              </SelectItem>
            ))}
            <SelectItem
              value="custom"
              className="text-xs font-medium rounded-xl data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus:bg-muted"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5" />
                Personalizado
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {customModal}
      </>
    );
  }

  /* ===================== DESKTOP ===================== */

  return (
    <div className="flex items-center">
      <div className="flex bg-surface border border-border p-1 rounded-2xl shadow-sm items-center gap-1">
        {periodOptions.map((p) => (
          <button
            key={p.key}
            onClick={() => selectPreset(p.key)}
            className={`px-3.5 h-8 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center shrink-0 cursor-pointer ${
              period === p.key
                ? "bg-brand-gradient text-primary-foreground shadow-sm"
                : "text-text-3 hover:text-text hover:bg-raised"
            }`}
          >
            {p.label}
          </button>
        ))}

        <button
          onClick={handleOpenCustomDialog}
          className={`px-3.5 h-8 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center shrink-0 cursor-pointer ${
            period === "custom"
              ? "bg-brand-gradient text-primary-foreground shadow-sm"
              : "text-text-4 hover:text-foreground hover:bg-raised"
          }`}
        >
          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
          Personalizado
        </button>
      </div>
      {customModal}
    </div>
  );
}

