"use client";
import { cn } from "@/lib/utils"

export type Period = "mes_actual" | "3_meses" | "6_meses" | "1_ano"

interface PeriodTabsProps {
  value: Period
  onChange: (value: Period) => void
  className?: string
}

const periods: { value: Period; label: string }[] = [
  { value: "mes_actual", label: "Mes Actual" },
  { value: "3_meses", label: "3 Meses" },
  { value: "6_meses", label: "6 Meses" },
  { value: "1_ano", label: "1 Año" },
]

export function PeriodTabs({ value, onChange, className }: PeriodTabsProps) {
  return (
    <div className={cn("flex gap-1 rounded-lg bg-sidebar p-1", className)}>
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            value === period.value
              ? "bg-primary text-primary-foreground"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}
