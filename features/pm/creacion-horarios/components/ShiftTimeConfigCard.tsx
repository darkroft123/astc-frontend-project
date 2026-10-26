"use client";

import { Info, Clock } from "lucide-react";
import type { ShiftType } from "./ShiftTypeSelector";

export interface Preset {
  id: string;
  label: string;
  range: string;
  start: string;
  end: string;
  cutoff: string;
}

export const PRESETS: Preset[] = [
  { id: "dia", label: "Día", range: "08:00–17:00", start: "08:00", end: "17:00", cutoff: "09:30" },
  { id: "tarde", label: "Tarde", range: "14:00–22:00", start: "14:00", end: "22:00", cutoff: "15:30" },
  { id: "noche", label: "Noche", range: "22:00–06:00", start: "22:00", end: "06:00", cutoff: "23:30" },
];

export const DAYS = [
  { key: "monday" as const, label: "Lunes" },
  { key: "tuesday" as const, label: "Martes" },
  { key: "wednesday" as const, label: "Miércoles" },
  { key: "thursday" as const, label: "Jueves" },
  { key: "friday" as const, label: "Viernes" },
  { key: "saturday" as const, label: "Sábado" },
  { key: "sunday" as const, label: "Domingo" },
];

interface ShiftTimeConfigCardProps {
  shiftType: ShiftType;
  selectedPreset: string;
  onPresetSelect: (preset: Preset) => void;
  startHour: string;
  setStartHour: (val: string) => void;
  endHour: string;
  setEndHour: (val: string) => void;
  setSelectedPreset: (val: string) => void;
  validFrom: string;
  setValidFrom: (val: string) => void;
  validUntil: string;
  setValidUntil: (val: string) => void;
  rotationWorkDays: number;
  rotationRestDays: number;
  rotationStartHour: string;
  setRotationStartHour: (val: string) => void;
  rotationEndHour: string;
  setRotationEndHour: (val: string) => void;
  flexHours: Record<string, { start: string; end: string }>;
  setFlexHours: (val: Record<string, { start: string; end: string }>) => void;
}

export function ShiftTimeConfigCard({
  shiftType,
  selectedPreset,
  onPresetSelect,
  startHour,
  setStartHour,
  endHour,
  setEndHour,
  setSelectedPreset,
  validFrom,
  setValidFrom,
  validUntil,
  setValidUntil,
  rotationWorkDays,
  rotationRestDays,
  rotationStartHour,
  setRotationStartHour,
  rotationEndHour,
  setRotationEndHour,
  flexHours,
  setFlexHours,
}: ShiftTimeConfigCardProps) {
  return (
    <div className="rounded-[20px] sm:rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-[#1F1836] border border-purple-200 dark:border-[#432C7A] text-purple-700 dark:text-[#A855F7] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
          3
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">
            {shiftType === "REGULAR"
              ? "Horario regular"
              : shiftType === "TRANSITORY"
              ? "Horario transitorio"
              : shiftType === "FLEXIBLE"
              ? "Horario flexible"
              : "Turno rotativo"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define las horas de entrada y salida
          </p>
        </div>
      </div>

      {/* Sub-formulario: REGULAR o TRANSITORIO */}
      {(shiftType === "REGULAR" || shiftType === "TRANSITORY") && (
        <div className="space-y-4 pt-1">
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" />
            <p className="leading-relaxed text-[11.5px]">
              Lunes a viernes. Sábados y domingos son descanso automático: no se exige
              marcar ni se genera falta. Ideal para personal administrativo u oficina.
            </p>
          </div>

          {/* Plantilla Rápida */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Plantilla rápida
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-background dark:bg-[#141829] border border-border dark:border-[#1E2335]">
              {PRESETS.map((p) => {
                const isSelected = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onPresetSelect(p)}
                    className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 text-primary border border-primary/30 shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="text-xs font-bold">{p.label}</div>
                    <div className="text-[10px] font-mono opacity-80 mt-0.5">
                      {p.range}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pickers de Horas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Hora de entrada
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={startHour}
                  onChange={(e) => {
                    setStartHour(e.target.value);
                    setSelectedPreset("");
                  }}
                  className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <Clock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Hora de salida
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={endHour}
                  onChange={(e) => {
                    setEndHour(e.target.value);
                    setSelectedPreset("");
                  }}
                  className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <Clock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Rango de Fechas si es Transitorio */}
          {shiftType === "TRANSITORY" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border dark:border-[#1E2335]">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Válido desde
                </label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Válido hasta
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-formulario: ROTATIVO */}
      {shiftType.startsWith("ROTATING") && (
        <div className="space-y-4 pt-1">
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" />
            <p className="leading-relaxed text-[11.5px]">
              Ciclo continuo de <strong>{rotationWorkDays} días de trabajo</strong> seguidos de{" "}
              <strong>{rotationRestDays} días de descanso</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Entrada (laboral)
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={rotationStartHour}
                  onChange={(e) => setRotationStartHour(e.target.value)}
                  className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <Clock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Salida (laboral)
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={rotationEndHour}
                  onChange={(e) => setRotationEndHour(e.target.value)}
                  className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <Clock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-foreground block">
              Fecha de inicio del ciclo
            </label>
            <input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      )}

      {/* Sub-formulario: FLEXIBLE */}
      {shiftType === "FLEXIBLE" && (
        <div className="space-y-3 pt-1">
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" />
            <p className="leading-relaxed text-[11.5px]">
              Configura horas distintas por día. Los días vacíos se consideran descanso
              automático.
            </p>
          </div>

          <div className="space-y-2">
            {DAYS.map((day) => {
              const h = flexHours[day.key];
              return (
                <div
                  key={day.key}
                  className="grid grid-cols-[85px_1fr_1fr] gap-2 items-center"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {day.label}
                  </span>
                  <input
                    type="time"
                    value={h.start}
                    onChange={(e) =>
                      setFlexHours({
                        ...flexHours,
                        [day.key]: { ...h, start: e.target.value },
                      })
                    }
                    className="h-10 px-2.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-semibold text-foreground"
                  />
                  <input
                    type="time"
                    value={h.end}
                    onChange={(e) =>
                      setFlexHours({
                        ...flexHours,
                        [day.key]: { ...h, end: e.target.value },
                      })
                    }
                    className="h-10 px-2.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-semibold text-foreground"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
