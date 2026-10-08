"use client";
import { cn } from "@/lib/utils"
import { Check, X, Clock } from "lucide-react";

export type FilterType = "all" | "presente" | "falta" | "tarde"

interface FilterTabsProps {
  value: FilterType
  onChange: (value: FilterType) => void
  counts: {
    all: number
    presente: number
    falta: number
    tarde: number
  }
  className?: string
}

const filters: { value: FilterType; label: string; icon?: typeof Check; color: string }[] = [
  { value: "all", label: "Asistencias", color: "bg-success" },
  { value: "falta", label: "Faltas", icon: X, color: "bg-destructive" },
  { value: "tarde", label: "Tardes", icon: Clock, color: "bg-warning" },
]

export function FilterTabs({ value, onChange, counts, className }: FilterTabsProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            value === filter.value
              ? `${filter.color} text-primary-foreground`
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {filter.icon && <filter.icon className="h-4 w-4" />}
          {filter.value === "all" && <Check className="h-4 w-4" />}
          {filter.label}
          <span className="ml-1 rounded-full bg-card/20 px-2 py-0.5 text-xs">
            {counts[filter.value === "all" ? "all" : filter.value]}
          </span>
        </button>
      ))}
    </div>
  )
}
