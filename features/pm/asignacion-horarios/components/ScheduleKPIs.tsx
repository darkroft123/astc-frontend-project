"use client";

import { Clock, User, Folder, XCircle } from "lucide-react";

interface ScheduleKPIsProps {
  total: number;
  withOverride: number;
  withDefault: number;
  withoutProject: number;
}

export function ScheduleKPIs({
  total,
  withOverride,
  withDefault,
  withoutProject,
}: ScheduleKPIsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
      {/* Card 1: Total */}
      <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl border border-border/60 bg-background/50 flex items-center justify-center text-muted-foreground shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">Total asignaciones</p>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{total}</p>
        </div>
      </div>

      {/* Card 2: Personalizados */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <p className="text-xs text-purple-300 font-medium">Personalizados</p>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{withOverride}</p>
        </div>
      </div>

      {/* Card 3: Heredan del proyecto */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Folder className="w-4 h-4" />
          </div>
          <p className="text-xs text-emerald-400 font-medium">Heredan del proyecto</p>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{withDefault}</p>
        </div>
      </div>

      {/* Card 4: Sin proyecto */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
          <p className="text-xs text-rose-400 font-medium">Sin proyecto</p>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{withoutProject}</p>
        </div>
      </div>
    </div>
  );
}
