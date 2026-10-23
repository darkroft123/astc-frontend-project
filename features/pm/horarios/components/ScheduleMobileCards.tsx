"use client";

import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  Clock,
  Pencil,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ScheduleMobileCardsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loading: boolean;
  pageTemplates: any[];
  filteredTemplates: any[];
  currentPage: number;
  totalPages: number;
  setPage: (updater: (prev: number) => number) => void;
  projects: any[];
  getShiftConfig: (shiftType?: string) => { label: string; icon: any };
  getScheduleTimeDisplay: (t: any) => string;
  getProjectName: (projectId: string, list: any[]) => string;
  onPreviewTemplate: (template: any) => void;
}

export function ScheduleMobileCards({
  searchTerm,
  setSearchTerm,
  loading,
  pageTemplates,
  filteredTemplates,
  currentPage,
  totalPages,
  setPage,
  projects,
  getShiftConfig,
  getScheduleTimeDisplay,
  getProjectName,
  onPreviewTemplate,
}: ScheduleMobileCardsProps) {
  const router = useRouter();

  return (
    <div className="md:hidden space-y-3">
      {/* Card 1: Horarios del proyecto & Search */}
      <div className="rounded-2xl border border-[#E2E4EB] dark:border-[#1E2335] bg-white dark:bg-[#0C0E18] p-4 space-y-3 shadow-sm dark:shadow-md">
        <div>
          <h2 className="text-base font-bold text-[#11131C] dark:text-white">Horarios del proyecto</h2>
          <p className="text-xs text-[#5D6378] dark:text-[#8F96AE] mt-0.5">
            Selecciona un horario y asígnalo a los miembros del proyecto.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5D6378] dark:text-[#5A627D] pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por proyecto u horario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#F1F3F9] dark:bg-[#12141F] border border-[#E2E4EB] dark:border-[#1E2335] text-xs text-[#11131C] dark:text-white placeholder:text-[#8F96AE] dark:placeholder:text-[#525975] focus:outline-none focus:border-[#7F6CF6]"
          />
        </div>
      </div>

      {/* Schedule Cards */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#8B7BD8]" />
        </div>
      ) : pageTemplates.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E4EB] dark:border-[#1E2335] bg-white dark:bg-[#0C0E18] p-8 text-center text-[#5D6378] dark:text-[#8F96AE]">
          <Clock className="w-10 h-10 mx-auto text-[#8F96AE] dark:text-[#454B64] mb-2" />
          <p className="text-sm font-medium text-[#11131C] dark:text-white">No hay horarios disponibles</p>
          <p className="text-xs text-[#5D6378] dark:text-[#8F96AE] mt-1">Crea horarios para tus proyectos.</p>
        </div>
      ) : (
        pageTemplates.map((t, idx) => {
          const shiftCfg = getShiftConfig(t.shiftType);
          const ShiftIcon = shiftCfg.icon;
          const timeStr = getScheduleTimeDisplay(t);
          const projectName = getProjectName(t.projectId, projects);

          return (
            <div
              key={t.id || idx}
              className="rounded-2xl border border-[#E2E4EB] dark:border-[#1E2335] bg-white dark:bg-[#0C0E18] p-4 space-y-3 shadow-sm dark:shadow-md"
            >
              {/* Header of Card */}
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-[#0F2833] border border-cyan-200 dark:border-[#164152] text-cyan-600 dark:text-[#22C3E6] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base text-[#11131C] dark:text-white truncate leading-tight">
                    {t.name}
                  </h3>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-100 dark:bg-[#24183E] text-purple-700 dark:text-[#C084FC] border border-purple-200 dark:border-[#40266B] max-w-full truncate">
                    {projectName}
                  </span>
                </div>
              </div>

              {/* Middle Box: Tipo de turno */}
              <div className="bg-[#F1F3F9] dark:bg-[#12141F] border border-[#E2E4EB] dark:border-[#1E2335] rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#7C3AED] dark:text-[#8B7BD8]">
                  TIPO DE TURNO
                </span>
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#11131C] dark:text-white">
                  <ShiftIcon className="w-3.5 h-3.5 text-[#22C3E6]" />
                  <span>{shiftCfg.label}</span>
                </div>
              </div>

              {/* Bottom Grid: Horario y Tolerancia */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#F1F3F9] dark:bg-[#12141F] border border-[#E2E4EB] dark:border-[#1E2335] rounded-xl p-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#7C3AED] dark:text-[#8B7BD8] block mb-1">
                    HORARIO
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#11131C] dark:text-white">
                    {timeStr}
                  </span>
                </div>
                <div className="bg-[#F1F3F9] dark:bg-[#12141F] border border-[#E2E4EB] dark:border-[#1E2335] rounded-xl p-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#7C3AED] dark:text-[#8B7BD8] block mb-1">
                    TOLERANCIA
                  </span>
                  <span className="text-xs font-medium text-[#11131C] dark:text-white">
                    {t.graceMinutes ?? 10} min
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => router.push(`/pm/creacion-horarios?id=${t.id}`)}
                  className="w-11 h-11 rounded-xl bg-[#ECEEF5] dark:bg-[#161928] border border-[#D5D8E4] dark:border-[#282F48] text-[#5D6378] dark:text-white hover:bg-[#E2E5F0] dark:hover:bg-[#1E2338] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  title="Editar horario"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onPreviewTemplate(t)}
                  className="flex-1 h-11 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 dark:bg-[#2E1A47] dark:hover:bg-[#3B225B] dark:border-[#582A88] dark:text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Users className="w-4 h-4 text-purple-600 dark:text-[#C084FC]" />
                  <span>Asignar a miembros</span>
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Mobile Pagination */}
      <div className="flex items-center justify-between pt-3 px-1 text-xs text-[#5D6378] dark:text-[#8F96AE]">
        <span className="font-mono">
          {filteredTemplates.length} horario{filteredTemplates.length === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="w-9 h-9 rounded-xl bg-[#F1F3F9] dark:bg-[#141827] border border-[#E2E4EB] dark:border-[#23293E] text-[#5D6378] dark:text-[#8F96AE] hover:text-[#11131C] dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[#11131C] dark:text-white px-1 font-medium">
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="w-9 h-9 rounded-xl bg-[#F1F3F9] dark:bg-[#141827] border border-[#E2E4EB] dark:border-[#23293E] text-[#5D6378] dark:text-[#8F96AE] hover:text-[#11131C] dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
