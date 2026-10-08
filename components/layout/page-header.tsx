"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import PeriodSelector from "@/components/period-selector";

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

interface PageHeaderProps {
  title: string;
  description?: string;
  categoryTag?: { badge: string; text: string };
  showPeriodSelector?: boolean;
  period?: Period;
  dateRange?: DateRange;
  onPeriodChange?: (range: DateRange) => void;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export default function PageHeader({
  title,
  description,
  categoryTag,
  showPeriodSelector = true,
  period,
  dateRange,
  onPeriodChange,
}: PageHeaderProps) {
  const showDateRange = dateRange && dateRange.fromDate && dateRange.toDate;

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-border pb-4 mb-6 gap-3">
      <div className="min-w-0 flex-1">
        {categoryTag && (
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 uppercase tracking-wider shrink-0">
              {categoryTag.badge}
            </span>
            <span className="text-xs text-muted-foreground font-medium truncate">• {categoryTag.text}</span>
          </div>
        )}

        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-tight">{title}</h1>

        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-normal">{description}</p>
        )}

        {showDateRange && (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/60 mt-1.5">
            <CalendarIcon className="w-3 h-3 shrink-0" />
            {formatDateDisplay(dateRange.fromDate)} → {formatDateDisplay(dateRange.toDate)}
          </span>
        )}
      </div>

      {showPeriodSelector && period && dateRange && onPeriodChange && (
        <div className="w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
          <PeriodSelector
            period={period}
            dateRange={dateRange}
            onPeriodChange={onPeriodChange}
          />
        </div>
      )}
    </div>
  );
}
