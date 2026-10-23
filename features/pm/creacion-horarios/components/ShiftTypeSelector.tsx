"use client";

export type ShiftType =
  | "REGULAR"
  | "ROTATING_4X4"
  | "ROTATING_7X7"
  | "FLEXIBLE"
  | "TRANSITORY";

export interface ShiftOption {
  key: ShiftType;
  title: string;
  description: string;
}

export const SHIFT_OPTIONS: ShiftOption[] = [
  { key: "REGULAR", title: "Regular", description: "Lun–vie, horario fijo" },
  { key: "ROTATING_4X4", title: "Rotativo 4×4", description: "4 días trabajo, 4 descanso" },
  { key: "ROTATING_7X7", title: "Rotativo 7×7", description: "7 días trabajo, 7 descanso" },
  { key: "FLEXIBLE", title: "Flexible", description: "Horas por día, sin hora fija" },
  { key: "TRANSITORY", title: "Transitorio", description: "Por un periodo definido" },
];

interface ShiftTypeSelectorProps {
  shiftType: ShiftType;
  onShiftTypeChange: (type: ShiftType) => void;
}

export function ShiftTypeSelector({
  shiftType,
  onShiftTypeChange,
}: ShiftTypeSelectorProps) {
  return (
    <div className="rounded-[20px] sm:rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-[#1F1836] border border-purple-200 dark:border-[#432C7A] text-purple-700 dark:text-[#A855F7] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
          2
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">
            Tipo de turno
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Elige la modalidad de horario
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {SHIFT_OPTIONS.map((opt) => {
          const isSelected = shiftType === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onShiftTypeChange(opt.key)}
              className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
                isSelected
                  ? "bg-purple-500/10 dark:bg-[#1A1435] border-purple-500 dark:border-[#A855F7] shadow-xs shadow-purple-500/20"
                  : "bg-card dark:bg-[#101322] border-border dark:border-[#1E2335] hover:border-border/80 dark:hover:border-[#2C334E]"
              } ${opt.key === "TRANSITORY" ? "sm:col-span-2" : ""}`}
            >
              <p
                className={`text-xs font-bold leading-tight ${
                  isSelected
                    ? "text-purple-600 dark:text-[#C084FC]"
                    : "text-foreground"
                }`}
              >
                {opt.title}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                {opt.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
