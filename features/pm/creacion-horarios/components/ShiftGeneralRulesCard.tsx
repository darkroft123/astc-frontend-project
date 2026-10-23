"use client";

import { Clock } from "lucide-react";

interface ShiftGeneralRulesCardProps {
  graceMinutes: number;
  setGraceMinutes: (val: number) => void;
  absenceCutoffTime: string;
  setAbsenceCutoffTime: (val: string) => void;
}

export function ShiftGeneralRulesCard({
  graceMinutes,
  setGraceMinutes,
  absenceCutoffTime,
  setAbsenceCutoffTime,
}: ShiftGeneralRulesCardProps) {
  return (
    <div className="rounded-[20px] sm:rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-[#1F1836] border border-purple-200 dark:border-[#432C7A] text-purple-700 dark:text-[#A855F7] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
          4
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">
            Reglas generales
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tolerancia y hora límite para faltas automáticas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Tolerancia */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground block">
            Tolerancia (minutos)
          </label>
          <input
            type="number"
            min={0}
            max={120}
            value={graceMinutes}
            onChange={(e) => setGraceMinutes(parseInt(e.target.value) || 0)}
            className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <p className="text-[11px] text-muted-foreground leading-tight pt-0.5">
            Minutos después de la entrada en los que aún llega a tiempo.
          </p>
        </div>

        {/* Corte de falta */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground block">
            Corte de falta automática
          </label>
          <div className="relative">
            <input
              type="time"
              value={absenceCutoffTime}
              onChange={(e) => setAbsenceCutoffTime(e.target.value)}
              className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <Clock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight pt-0.5">
            Si no marca antes de esta hora, se genera una falta. En turnos nocturnos solo
            aplica dentro de la ventana del turno.
          </p>
        </div>
      </div>
    </div>
  );
}
