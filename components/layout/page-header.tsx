"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import PeriodSelector from "@/components/period-selector";
import { NotificationBell } from "@/components/layout/notification-bell";

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
  showNotificationBell?: boolean;
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
  showNotificationBell = true,
  period,
  dateRange,
  onPeriodChange,
}: PageHeaderProps) {
  const showDateRange = dateRange && dateRange.fromDate && dateRange.toDate;

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-line pb-4 mb-6 gap-3">
      <div className="min-w-0 flex-1">
        {categoryTag && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-[10.5px] leading-[15.8px] font-medium uppercase tracking-[0.05em] text-primary">
              {categoryTag.badge}
            </span>
            <span className="font-sans text-[15px] leading-[22.5px] font-normal text-text-4">
              • {categoryTag.text}
            </span>
          </div>
        )}

        <h1 className="text-[26px] font-semibold text-foreground tracking-tight leading-tight">
          {title}
        </h1>

        {description && (
          <p className="text-[13.5px] text-text-4 mt-1 leading-normal">{description}</p>
        )}

        {showDateRange && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-[var(--radius-badge)] border border-primary/20 mt-1.5">
            <CalendarIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            {formatDateDisplay(dateRange.fromDate)} → {formatDateDisplay(dateRange.toDate)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {showPeriodSelector && period && dateRange && onPeriodChange && (
          <div className="w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
            <PeriodSelector
              period={period}
              dateRange={dateRange}
              onPeriodChange={onPeriodChange}
            />
          </div>
        )}
        {showNotificationBell && (
          <div className="hidden md:flex items-center">
            <NotificationBell />
          </div>
        )}
      </div>
    </div>
  );
}
