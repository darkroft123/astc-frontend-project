"use client";
import React from 'react';
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
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-8">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0 border border-red-200">
              <Trash2 className="text-red-600" size={28} />
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-zinc-900 mb-2">
                ¿Eliminar proyecto?
              </h3>
              <p className="text-zinc-600 text-[15px]">
                Esta acción es irreversible. El proyecto y todos sus miembros serán eliminados permanentemente.
              </p>

              <div className="mt-6 bg-muted/50 border border-border rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <FolderKanban className="text-violet-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {projectName}
                    </p>
                    <p className="text-sm text-muted-foreground">{projectId}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Los miembros asignados perderán acceso al proyecto.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-muted/50 px-8 py-5 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-2xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-medium transition-all active:scale-[0.985]"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all active:scale-[0.985] flex items-center gap-2"
          >
            <Trash2 size={18} />
            Eliminar Proyecto
          </button>
        </div>
      </div>
    </div>
  );
}
