"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react";
import { X, Link2 } from "lucide-react";
import { CollectionOutput } from "@/app/services/project.assistance.service";

interface LinkGlobalCollectionModalProps {
  open: boolean;
  globalCollections: CollectionOutput[];
  onClose: () => void;
  onSubmit: (collectionId: string) => Promise<void>;
}

export function LinkGlobalCollectionModal({
  open,
  globalCollections,
  onClose,
  onSubmit,
}: LinkGlobalCollectionModalProps) {
  const [selectedGlobalCollection, setSelectedGlobalCollection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!open) return null;
  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGlobalCollection) return;
    setIsSubmitting(true);
    try {
      await onSubmit(selectedGlobalCollection);
      setSelectedGlobalCollection("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalNode = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg md:max-w-xl max-h-[92vh] overflow-y-auto bg-card dark:bg-[#0E111C] border border-border dark:border-[#1E2335] rounded-[24px] sm:rounded-[28px] p-5 sm:p-7 shadow-2xl relative text-foreground space-y-5">
        <div className="w-12 h-1 rounded-full bg-muted-foreground/30 mx-auto md:hidden" />

        <div className="flex items-start justify-between gap-3 pb-2 border-b border-border dark:border-[#1E2335]">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Enlazar colección global
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Añade una colección global existente a tu proyecto actual.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-border dark:border-[#1E2335] bg-muted/50 dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1c2238] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Selecciona la colección
            </label>
            <select
              value={selectedGlobalCollection}
              onChange={(e) => setSelectedGlobalCollection(e.target.value)}
              required
              className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet"
            >
              <option value="">Seleccione una colección global...</option>
              {globalCollections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.items?.length || 0} feriados)
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border dark:border-[#1E2335]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-32 h-11 rounded-xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1c2238] text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedGlobalCollection || isSubmitting}
              className="w-full sm:w-36 h-11 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-violet/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Link2 className="w-4 h-4 stroke-[2.2]" />
              <span>{isSubmitting ? "Enlazando..." : "Enlazar"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalNode, document.body) : null;
}