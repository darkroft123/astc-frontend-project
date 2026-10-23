"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const MONTH_NAMES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const WEEKDAY_NAMES_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

interface MonthCalendarPickerProps {
  selectedDates: string[]; // "YYYY-MM-DD"
  onToggleDate: (dateStr: string) => void;
}

export function MonthCalendarPicker({
  selectedDates,
  onToggleDate,
}: MonthCalendarPickerProps) {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 = September (0-indexed)

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Build grid for month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const dayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon...
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
    }[] = [];

    // Prev month days
    for (let i = mondayOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const monthStr = String(prevM + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      cells.push({
        dateStr: `${prevY}-${monthStr}-${dayStr}`,
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      cells.push({
        dateStr: `${currentYear}-${monthStr}-${dayStr}`,
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    // Next month days to fill 35 or 42 cells
    const remaining = 35 - cells.length > 0 ? 35 - cells.length : 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const monthStr = String(nextM + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      cells.push({
        dateStr: `${nextY}-${monthStr}-${dayStr}`,
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  return (
    <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#141829] p-4 text-foreground">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-8 h-8 rounded-lg border border-border dark:border-[#1E2335] bg-muted dark:bg-[#101322] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-bold text-sm text-foreground">
          {MONTH_NAMES_ES[currentMonth]} {currentYear}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="w-8 h-8 rounded-lg border border-border dark:border-[#1E2335] bg-muted dark:bg-[#101322] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers: LU MA MI JU VI SÁ DO */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {["LU", "MA", "MI", "JU", "VI", "SÁ", "DO"].map((day) => (
          <span
            key={day}
            className="text-[10px] font-mono font-semibold text-muted-foreground tracking-wider"
          >
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {calendarDays.map((cell) => {
          const isSelected = selectedDates.includes(cell.dateStr);

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => onToggleDate(cell.dateStr)}
              className={`h-9 w-full rounded-xl flex items-center justify-center text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? "bg-brand-gradient text-white shadow-xs font-bold"
                  : cell.isCurrentMonth
                  ? "text-foreground hover:bg-muted dark:hover:bg-[#1C2238]"
                  : "text-muted-foreground/40 hover:bg-muted dark:hover:bg-[#1C2238]/50"
              }`}
            >
              {cell.dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}
