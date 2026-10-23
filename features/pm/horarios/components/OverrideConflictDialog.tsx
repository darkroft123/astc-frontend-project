"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface OverrideConflictDialogProps {
  pendingAssignment: {
    template: any;
    members: any[];
    membersWithSchedule: any[];
  } | null;
  onOverwriteAll: () => void;
  onOnlyWithoutSchedule: () => void;
  onClose: () => void;
}

export function OverrideConflictDialog({
  pendingAssignment,
  onOverwriteAll,
  onOnlyWithoutSchedule,
  onClose,
}: OverrideConflictDialogProps) {
  if (!pendingAssignment) return null;

  return (
    <Dialog open={!!pendingAssignment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-[#0C0E18] border border-[#E2E4EB] dark:border-[#1E2335] text-[#11131C] dark:text-white p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#11131C] dark:text-white">
            Sobrescribir Horarios
          </DialogTitle>
          <DialogDescription className="text-xs text-[#5D6378] dark:text-[#8F96AE] pt-2">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto my-3" />
            Se ha detectado que{" "}
            <strong className="text-[#11131C] dark:text-white">
              {pendingAssignment.membersWithSchedule.length}
            </strong>{" "}
            de los {pendingAssignment.members.length} miembros del proyecto ya tienen un horario personalizado asignado.
            <br />
            <br />
            ¿Qué deseas hacer?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-3">
          <Button
            variant="default"
            className="w-full justify-start text-left bg-gradient-to-r from-[#4F8BFF] to-[#A855F7] hover:opacity-95 text-white h-auto py-3 px-4 rounded-xl cursor-pointer"
            onClick={onOverwriteAll}
          >
            <div className="flex flex-col items-start">
              <span className="font-bold text-xs">Sobrescribir a todos</span>
              <span className="text-[11px] font-normal opacity-80">
                Aplicar este horario a todos los miembros del proyecto.
              </span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-left border-[#D5D8E4] dark:border-[#23293E] bg-[#F1F3F9] dark:bg-[#141827] text-[#11131C] dark:text-white hover:bg-[#E2E5F0] dark:hover:bg-[#1A2033] h-auto py-3 px-4 rounded-xl cursor-pointer"
            onClick={onOnlyWithoutSchedule}
          >
            <div className="flex flex-col items-start">
              <span className="font-bold text-xs">Solo a los sin horario</span>
              <span className="text-[11px] font-normal text-[#5D6378] dark:text-[#8F96AE]">
                Respetar horarios existentes y solo asignar a los nuevos.
              </span>
            </div>
          </Button>
          <button
            type="button"
            className="w-full py-2.5 text-xs text-[#5D6378] dark:text-[#8F96AE] hover:text-[#11131C] dark:hover:text-white transition-colors cursor-pointer"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
