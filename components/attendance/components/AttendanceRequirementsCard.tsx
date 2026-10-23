"use client";

import { CheckCircle2 } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

interface AttendanceRequirementsCardProps {
  checklist: ChecklistItem[];
  readyCount: number;
  projectTimezone?: string;
  nearestDistrict?: string | null;
  coords?: { lat: number; lng: number } | null;
}

export function AttendanceRequirementsCard({
  checklist,
  readyCount,
  projectTimezone = "America/Lima",
  nearestDistrict,
  coords,
}: AttendanceRequirementsCardProps) {
  return (
    <div className="space-y-4">
      {/* Card: REQUISITOS */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-500 dark:text-[#818CF8] font-semibold">
            REQUISITOS
          </span>
          <span className="font-sans text-xs text-muted-foreground">
            {readyCount} de 4 listos
          </span>
        </div>

        {/* Checklist items */}
        <div className="space-y-3">
          {checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5">
              {item.done ? (
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              ) : item.id === "face" ? (
                <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                </div>
              )}

              <span
                className={`font-sans text-xs ${
                  !item.done && item.id === "face"
                    ? "text-amber-400 dark:text-[#FBBF24] font-medium"
                    : "text-foreground/80 dark:text-slate-300"
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* ZONA HORARIA */}
        <div className="border-t border-border/80 pt-3.5 space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-500 dark:text-[#818CF8] font-semibold block">
            ZONA HORARIA
          </span>
          <p className="font-mono text-sm font-bold text-foreground tracking-wide">
            {projectTimezone}
          </p>
          <p className="font-sans text-[11px] text-muted-foreground">
            Todos los horarios se muestran en esta zona.
          </p>
        </div>
      </div>

      {/* Card: GPS */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-500 dark:text-[#818CF8] font-semibold">
            GPS
          </span>
          <span className="flex items-center gap-1.5 font-sans text-xs font-semibold text-emerald-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Activo
          </span>
        </div>

        <p className="font-sans text-sm font-bold text-foreground">
          {nearestDistrict || "San Martín de Porres"}
        </p>

        <p className="font-mono text-xs text-muted-foreground">
          LAT {coords ? coords.lat.toFixed(4) : "-12.0184"} · LNG{" "}
          {coords ? coords.lng.toFixed(4) : "-77.0818"}
        </p>

        <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">
          Precisión ±12 m. La ubicación se adjunta al marcaje.
        </p>
      </div>
    </div>
  );
}
