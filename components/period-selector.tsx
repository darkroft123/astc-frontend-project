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
          <SelectTrigger className="w-full bg-primary text-white border-none rounded-xl h-10 px-4 text-sm font-semibold shadow-sm [&>svg]:text-white">
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-[#D0D7DE] shadow-xl min-w-[160px]">
            {periodOptions.map((p) => (
              <SelectItem
                key={p.key}
                value={p.key}
                className="text-sm font-medium rounded-lg data-[state=checked]:bg-primary data-[state=checked]:text-white focus:bg-muted"
              >
                {p.label}
              </SelectItem>
            ))}
            <SelectItem
              value="custom"
              className="text-sm font-medium rounded-lg data-[state=checked]:bg-primary data-[state=checked]:text-white focus:bg-muted"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Personalizado
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle>Seleccionar rango personalizado</DialogTitle>
              <DialogDescription>
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
                className="rounded-2xl border border-[#D0D7DE] p-3"
              />

              <Button
                onClick={applyCustomRange}
                disabled={!customFrom || !customTo}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-11 font-semibold"
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
      <div className="flex bg-muted border border-border p-0.5 rounded-xl shadow-sm items-center">
        {periodOptions.map((p) => (
          <Button
            key={p.key}
            variant="ghost"
            onClick={() => selectPreset(p.key)}
            className={`px-3 h-8 text-[13px] font-semibold rounded-lg transition-all whitespace-nowrap flex items-center shrink-0 ${
              period === p.key
                ? "bg-primary text-white shadow-sm hover:bg-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {p.label}
          </Button>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "px-3 h-8 text-[13px] font-semibold rounded-lg transition-all whitespace-nowrap flex items-center shrink-0",
                period === "custom"
                  ? "bg-primary text-white shadow-sm hover:bg-primary/90"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              Personalizado
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-auto p-4 border border-[#D0D7DE] rounded-3xl shadow-xl"
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
                className="rounded-2xl border border-[#D0D7DE] p-3"
              />
              <Button
                onClick={applyCustomRange}
                disabled={!customFrom || !customTo}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-11 font-semibold"
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

