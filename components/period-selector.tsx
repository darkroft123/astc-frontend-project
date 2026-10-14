"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
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
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
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

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return;

    const newRange: DateRange = {
      fromDate: customFrom.toISOString().split("T")[0],
      toDate: customTo.toISOString().split("T")[0],
      label: `${format(customFrom, "dd MMM", { locale: es })} - ${format(
        customTo,
        "dd MMM yyyy",
        { locale: es }
      )}`,
      period: "custom",
    };

    onPeriodChange(newRange);
    setCustomDialogOpen(false);
    setCustomFrom(undefined);
    setCustomTo(undefined);
  };

  const handleMobileSelect = (value: string) => {
    if (value === "custom") {
      setCustomDialogOpen(true);
    } else {
      selectPreset(value as Period);
    }
  };

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

        <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl border border-border bg-card">
            <DialogHeader>
              <DialogTitle className="font-sans font-bold text-lg text-foreground">
                Seleccionar rango personalizado
              </DialogTitle>
              <DialogDescription className="font-sans text-xs text-muted-foreground">
                Elige una fecha de inicio y fin para filtrar los datos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Calendar
                mode="range"
                selected={{
                  from: customFrom,
                  to: customTo,
                }}
                onSelect={(range) => {
                  setCustomFrom(range?.from);
                  setCustomTo(range?.to);
                }}
                numberOfMonths={1}
                className="rounded-2xl border border-border p-3"
              />

              <Button
                onClick={applyCustomRange}
                disabled={!customFrom || !customTo}
                className="w-full bg-brand-gradient hover:opacity-95 text-primary-foreground rounded-2xl h-11 font-semibold text-xs shadow-md"
              >
                Aplicar rango
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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

        <Popover>
          <PopoverTrigger asChild>
            <button
              className={`px-3.5 h-8 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center shrink-0 cursor-pointer ${
                period === "custom"
                  ? "bg-brand-gradient text-primary-foreground shadow-sm"
                  : "text-text-4 hover:text-foreground hover:bg-raised"
              }`}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              Personalizado
            </button>
          </PopoverTrigger>

          <PopoverContent
            className="w-auto p-4 border border-border bg-card rounded-3xl shadow-2xl"
            align="end"
            sideOffset={8}
          >
            <div className="space-y-4">
              <Calendar
                mode="range"
                selected={{ from: customFrom, to: customTo }}
                onSelect={(range) => {
                  setCustomFrom(range?.from);
                  setCustomTo(range?.to);
                }}
                numberOfMonths={2}
                className="rounded-2xl border border-border p-3"
              />
              <Button
                onClick={applyCustomRange}
                disabled={!customFrom || !customTo}
                className="w-full bg-brand-gradient hover:opacity-95 text-primary-foreground rounded-2xl h-11 font-semibold text-xs shadow-md"
              >
                Aplicar rango
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

