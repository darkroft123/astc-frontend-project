"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Clock, CheckCircle } from "lucide-react";

interface TemplatePreviewModalProps {
  template: any | null;
  projects: any[];
  projectName: string;
  config: { label: string; icon: any };
  timeStr: string;
  onAssign: () => void;
  onClose: () => void;
}

export function TemplatePreviewModal({
  template,
  projects,
  projectName,
  config,
  timeStr,
  onAssign,
  onClose,
}: TemplatePreviewModalProps) {
  if (!template) return null;
  const Icon = config.icon;

  return (
    <Dialog open={!!template} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl bg-white dark:bg-[#0C0E18] border border-[#E2E4EB] dark:border-[#1E2335] text-[#11131C] dark:text-white p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-[#11131C] dark:text-white text-lg font-bold">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-[#0F2833] border border-cyan-200 dark:border-[#164152] text-cyan-600 dark:text-[#22C3E6] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <span>{template.name}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#5D6378] dark:text-[#8F96AE] pt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-100 dark:bg-[#24183E] text-purple-700 dark:text-[#C084FC] border border-purple-200 dark:border-[#40266B]">
              {projectName}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[#ECEEF5] dark:bg-[#161928] border border-[#D5D8E4] dark:border-[#272E49] text-[#11131C] dark:text-white ml-2">
              <Icon className="w-3 h-3 text-[#22C3E6]" />
              {config.label}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="bg-[#F1F3F9] dark:bg-[#12141F] border border-[#E2E4EB] dark:border-[#1E2335] rounded-xl p-4 text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[#5D6378] dark:text-[#8F96AE]">Proyecto</span>
              <span className="font-semibold text-[#11131C] dark:text-white">{projectName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#5D6378] dark:text-[#8F96AE]">Horario</span>
              <span className="font-mono font-semibold text-[#11131C] dark:text-white">{timeStr}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#5D6378] dark:text-[#8F96AE]">Tolerancia</span>
              <span className="font-semibold text-[#11131C] dark:text-white">
                {template.graceMinutes ?? 10} min
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#5D6378] dark:text-[#8F96AE]">Corte falta</span>
              <span className="font-semibold text-[#11131C] dark:text-white">
                {template.absenceCutoffTime?.substring(0, 5) || "08:30"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#5D6378] dark:text-[#8F96AE]">Zona horaria</span>
              <span className="font-semibold text-[#11131C] dark:text-white">
                {template.timezone || "America/Lima"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E4EB] dark:border-[#1E2335]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-[#D5D8E4] dark:border-[#23293E] bg-[#ECEEF5] dark:bg-[#141827] text-[#5D6378] dark:text-[#8F96AE] hover:text-[#11131C] dark:hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onAssign}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#4F8BFF] to-[#A855F7] hover:opacity-95 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Asignar a miembros</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
