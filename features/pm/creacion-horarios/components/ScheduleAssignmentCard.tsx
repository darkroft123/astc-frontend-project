"use client";

import { Folder, ChevronDown } from "lucide-react";

interface ScheduleAssignmentCardProps {
  projects: any[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  templateName: string;
  setTemplateName: (name: string) => void;
}

export function ScheduleAssignmentCard({
  projects,
  selectedProjectId,
  setSelectedProjectId,
  templateName,
  setTemplateName,
}: ScheduleAssignmentCardProps) {
  return (
    <div className="rounded-[20px] sm:rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-[#1F1836] border border-purple-200 dark:border-[#432C7A] text-purple-700 dark:text-[#A855F7] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
          1
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">
            Asignación
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecciona el proyecto y define el nombre
          </p>
        </div>
      </div>

      {/* Campo Proyecto */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs font-semibold text-foreground block">
          Proyecto
        </label>
        <div className="relative">
          <Folder className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full h-11 pl-10 pr-9 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none cursor-pointer"
          >
            <option value="">Seleccionar proyecto...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        {!selectedProjectId && (
          <p className="text-[11px] text-[#FBBF24] mt-1 font-medium">
            Elige un proyecto para continuar.
          </p>
        )}
      </div>

      {/* Campo Nombre del Horario */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs font-semibold text-foreground block">
          Nombre del horario
        </label>
        <input
          type="text"
          placeholder="Ej: Mañana, Tarde, Noche, Equipo A"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>
    </div>
  );
}
