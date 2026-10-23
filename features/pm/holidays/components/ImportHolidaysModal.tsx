"use client";

import { useState } from "react";
import { X, Upload, AlertCircle } from "lucide-react";

interface ImportHolidaysModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (parsedItems: { date: string; name: string }[]) => Promise<void>;
}

export function ImportHolidaysModal({
  open,
  onClose,
  onSubmit,
}: ImportHolidaysModalProps) {
  const [importTab, setImportTab] = useState<"text" | "csv">("text");
  const [importText, setImportText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = importText.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: { date: string; name: string }[] = [];

    for (const line of lines) {
      const match = line.match(/^(\d{4}-\d{2}-\d{2})[\s,\-]+(.*)$/);
      if (match) {
        parsed.push({ date: match[1], name: match[2]?.trim() || "Feriado" });
      }
    }

    if (parsed.length === 0) {
      alert("No se encontraron fechas válidas en formato AAAA-MM-DD");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(parsed);
      setImportText("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg md:max-w-2xl max-h-[92vh] overflow-y-auto bg-card dark:bg-[#0E111C] border border-border dark:border-[#1E2335] rounded-[24px] sm:rounded-[28px] p-5 sm:p-7 shadow-2xl relative text-foreground space-y-5">
        {/* Drag Handle (Mobile only) */}
        <div className="w-12 h-1 rounded-full bg-muted-foreground/30 mx-auto md:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-2 border-b border-border dark:border-[#1E2335]">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Importar feriados
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Carga tus feriados masivamente desde un archivo CSV o pegando texto.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Formato Requerido Info Box */}
          <div className="rounded-2xl border border-blue-200 dark:border-blue-500/25 bg-blue-50/60 dark:bg-blue-500/10 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Formato requerido</span>
            </div>
            <ul className="text-[11.5px] text-muted-foreground space-y-1 pl-1">
              <li>▪ Usa un feriado por línea.</li>
              <li>▪ El formato estricto debe ser: <strong className="text-foreground font-mono">AAAA-MM-DD, Nombre del feriado</strong></li>
              <li>▪ Se aceptan separadores como comas (,), guiones (-) o espacios.</li>
            </ul>

            <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-card dark:bg-[#0C101D] p-3 font-mono text-[11px] text-muted-foreground space-y-1">
              <p className="text-muted-foreground/80 font-bold">Ejemplos válidos:</p>
              <p>2026-12-25, Navidad</p>
              <p>2026-01-01 - Año Nuevo</p>
              <p>2026-07-28 Fiestas Patrias</p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="p-1 rounded-xl bg-muted dark:bg-[#131726] border border-border dark:border-[#1E2335] grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setImportTab("text")}
              className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                importTab === "text"
                  ? "bg-white dark:bg-[#1E2438] text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pegar texto
            </button>
            <button
              type="button"
              onClick={() => setImportTab("csv")}
              className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                importTab === "csv"
                  ? "bg-white dark:bg-[#1E2438] text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Subir archivo CSV
            </button>
          </div>

          {importTab === "text" ? (
            <div className="space-y-1.5">
              <textarea
                rows={4}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-violet resize-none"
                placeholder="2026-12-25, Navidad&#10;2026-01-01 - Año Nuevo"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border dark:border-[#1E2335] bg-muted/30 dark:bg-[#141829] p-6 text-center space-y-2">
              <Upload className="w-6 h-6 text-muted-foreground mx-auto" />
              <p className="text-xs font-semibold text-foreground">
                Selecciona tu archivo .CSV
              </p>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const content = await file.text();
                    setImportText(content);
                    setImportTab("text");
                  }
                }}
                className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-muted dark:file:bg-[#1E2438] file:text-foreground cursor-pointer"
              />
            </div>
          )}

          {/* Bottom Actions */}
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
              disabled={isSubmitting || !importText.trim()}
              className="w-full sm:w-44 h-11 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-violet/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4 stroke-[2.2]" />
              <span>{isSubmitting ? "Importando..." : "Importar texto"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
