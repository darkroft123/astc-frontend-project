"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FolderKanban, AlertCircle, Trash2 } from "lucide-react";

interface DeleteProjectModalProps {
  projectName: string;
  projectId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteProjectModal({
  projectName,
  projectId,
  onConfirm,
  onCancel,
}: DeleteProjectModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const modalNode = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-[#12141F] border border-border dark:border-[#1E2335] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative z-[101]">
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red/10 dark:bg-[#2A151D] flex items-center justify-center flex-shrink-0 border border-red/20 dark:border-[#4D1C27]">
              <Trash2 className="text-red-ink dark:text-[#EF4444]" size={24} />
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground dark:text-white mb-1.5">
                ¿Eliminar proyecto?
              </h3>
              <p className="text-muted-foreground dark:text-[#8F96AE] text-sm">
                Esta acción es irreversible. El proyecto y todos sus miembros serán eliminados permanentemente.
              </p>

              <div className="mt-5 bg-[#F8FAFC] dark:bg-[#181B2A] border border-border dark:border-[#1E2335] rounded-xl p-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-violet/15 flex items-center justify-center">
                    <FolderKanban className="text-primary dark:text-[#C084FC]" size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground dark:text-white text-sm truncate">
                      {projectName}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-[#8F96AE] font-mono truncate">{projectId}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 flex items-start gap-2 text-amber-ink dark:text-[#FBBF24] bg-amber/10 dark:bg-[#2C2112] border border-amber/20 dark:border-[#4E3815] rounded-xl p-3">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs">
                  Los miembros asignados perderán acceso al proyecto.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border dark:border-[#1E2335] bg-[#F8FAFC] dark:bg-[#181B2A] px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-border dark:border-[#1E2335] text-foreground dark:text-white hover:bg-muted dark:hover:bg-[#1C2238] font-medium text-xs transition-all active:scale-[0.985] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold text-xs transition-all active:scale-[0.985] flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Trash2 size={15} />
            Eliminar Proyecto
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalNode, document.body) : null;
}
