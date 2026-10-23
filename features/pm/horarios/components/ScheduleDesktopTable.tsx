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

interface ScheduleDesktopTableProps {
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

export function ScheduleDesktopTable({
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
}: ScheduleDesktopTableProps) {
  const router = useRouter();

  return (
    <div className="hidden md:block rounded-2xl border border-[#E2E4EB] dark:border-[#1E2335] bg-white dark:bg-[#0C0E18] p-6 shadow-sm dark:shadow-xl space-y-5">
      {/* Card Header with Search Input on Right */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#11131C] dark:text-white">
            Horarios del proyecto
          </h2>
          <p className="text-xs text-[#5D6378] dark:text-[#8F96AE] mt-0.5">
            Selecciona un horario y asígnalo a los miembros del proyecto.
          </p>
        </div>
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5D6378] dark:text-[#5A627D] pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por proyecto u horario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#F1F3F9] dark:bg-[#12141F] border border-[#E2E4EB] dark:border-[#1E2335] text-xs text-[#11131C] dark:text-white placeholder:text-[#8F96AE] dark:placeholder:text-[#525975] focus:outline-none focus:border-[#7F6CF6] transition-colors"
          />
        </div>
      </div>

      {/* HTML Table Box */}
      <div className="rounded-xl border border-[#E2E4EB] dark:border-[#1E2335] bg-[#F8F9FD] dark:bg-[#0E101A] overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E4EB] dark:border-[#1A1E2F] text-[10.5px] font-mono uppercase tracking-wider text-[#7C3AED] dark:text-[#8B7BD8]">
                <th className="py-3 px-3 font-semibold">PROYECTO</th>
                <th className="py-3 px-3 font-semibold">NOMBRE</th>
                <th className="py-3 px-3 font-semibold">TIPO DE TURNO</th>
                <th className="py-3 px-3 font-semibold">HORARIO</th>
                <th className="py-3 px-3 font-semibold">TOLERANCIA</th>
                <th className="py-3 px-3 font-semibold text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E4EB] dark:divide-[#161928]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#8B7BD8] mx-auto" />
                  </td>
                </tr>
              ) : pageTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#5D6378] dark:text-[#8F96AE]">
                    <Clock className="w-10 h-10 mx-auto text-[#8F96AE] dark:text-[#454B64] mb-2" />
                    <p className="text-sm font-medium text-[#11131C] dark:text-white">
                      No hay horarios disponibles
                    </p>
                    <p className="text-xs text-[#5D6378] dark:text-[#8F96AE] mt-1">
                      Crea horarios para tus proyectos.
                    </p>
                  </td>
                </tr>
              ) : (
                pageTemplates.map((t, idx) => {
                  const shiftCfg = getShiftConfig(t.shiftType);
                  const ShiftIcon = shiftCfg.icon;
                  const timeStr = getScheduleTimeDisplay(t);
                  const projectName = getProjectName(t.projectId, projects);

                  return (
                    <tr
                      key={t.id || idx}
                      className="hover:bg-[#F1F3F9]/60 dark:hover:bg-[#131626]/50 transition-colors"
                    >
                      {/* PROYECTO */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-100 dark:bg-[#24183E] text-purple-700 dark:text-[#C084FC] border border-purple-200 dark:border-[#40266B]">
                          {projectName}
                        </span>
                      </td>

                      {/* NOMBRE */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-[#0F2833] border border-cyan-200 dark:border-[#164152] text-cyan-600 dark:text-[#22C3E6] flex items-center justify-center shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-sm text-[#11131C] dark:text-white">
                            {t.name}
                          </span>
                        </div>
                      </td>

                      {/* TIPO DE TURNO */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[#ECEEF5] dark:bg-[#161928] border border-[#D5D8E4] dark:border-[#272E49] text-[#11131C] dark:text-white">
                          <ShiftIcon className="w-3.5 h-3.5 text-[#22C3E6]" />
                          <span>{shiftCfg.label}</span>
                        </span>
                      </td>

                      {/* HORARIO */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs text-[#11131C] dark:text-white tracking-wide">
                          {timeStr}
                        </span>
                      </td>

                      {/* TOLERANCIA */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-xs text-[#5D6378] dark:text-[#8F96AE]">
                          {t.graceMinutes ?? 10} min
                        </span>
                      </td>

                      {/* ACCIONES */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => router.push(`/pm/creacion-horarios?id=${t.id}`)}
                            className="w-8 h-8 rounded-xl bg-[#ECEEF5] dark:bg-[#161928] border border-[#D5D8E4] dark:border-[#282F48] text-[#5D6378] dark:text-[#8F96AE] hover:text-[#11131C] dark:hover:text-white hover:bg-[#E2E5F0] dark:hover:bg-[#1E2338] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                            title="Editar horario"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onPreviewTemplate(t)}
                            className="h-8 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 dark:bg-[#2E1A47] dark:hover:bg-[#3B225B] dark:border-[#582A88] dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap cursor-pointer shadow-sm"
                          >
                            <Users className="w-3.5 h-3.5 text-purple-600 dark:text-[#C084FC]" />
                            <span>Asignar a miembros</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Desktop Pagination inside Card */}
      <div className="flex items-center justify-end gap-3 pt-2 text-xs text-[#5D6378] dark:text-[#8F96AE]">
        <span>
          Página {currentPage} de {totalPages}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="w-8 h-8 rounded-lg bg-[#F1F3F9] dark:bg-[#141827] border border-[#E2E4EB] dark:border-[#23293E] text-[#5D6378] dark:text-[#8F96AE] hover:text-[#11131C] dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="w-8 h-8 rounded-lg bg-[#F1F3F9] dark:bg-[#141827] border border-[#E2E4EB] dark:border-[#23293E] text-[#5D6378] dark:text-[#8F96AE] hover:text-[#11131C] dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <span className="font-mono text-xs text-[#5D6378] dark:text-[#8F96AE]">
          {filteredTemplates.length} horario{filteredTemplates.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
