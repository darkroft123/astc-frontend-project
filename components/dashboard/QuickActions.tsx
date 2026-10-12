import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  FileText,
  AlertCircle,
  FolderKanban,
  Clock,
  CalendarClock,
  ScanFace,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function QuickActions() {
  const router = useRouter();

  return (
    <Card className="w-full h-full rounded-3xl border border-border bg-card shadow-sm">
      <CardContent className="p-5 h-full flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="font-sans font-bold text-lg text-foreground tracking-tight">
            Acciones Rápidas
          </h3>
          <p className="font-sans text-xs text-muted-foreground mt-0.5">
            Gestiona el equipo y los registros de forma inmediata
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-auto">
          {/* Registrar (Primary Gradient) */}
          <button
            onClick={() => router.push("/pm/registrar")}
            className="min-h-[58px] p-3 w-full justify-center text-xs font-bold bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] hover:opacity-95 text-white shadow-[0_4px_25px_rgba(99,102,241,0.45)] border border-white/10 rounded-2xl flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
          >
            <ScanFace className="w-5 h-5 shrink-0" />
            <span>Registrar</span>
          </button>

          {/* Asistencias */}
          <button
            onClick={() => router.push("/pm/asistencias")}
            className="min-h-[58px] p-3 w-full justify-center text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 rounded-2xl flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
          >
            <BarChart3 className="w-5 h-5 shrink-0" />
            <span>Asistencias</span>
          </button>

          {/* Justificaciones */}
          <button
            onClick={() => router.push("/pm/justificaciones")}
            className="min-h-[58px] p-3 w-full justify-center text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 text-amber-600 dark:text-amber-400 rounded-2xl flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span>Justificaciones</span>
          </button>

          {/* Alertas */}
          <button
            onClick={() => router.push("/pm/alertas")}
            className="min-h-[58px] p-3 w-full justify-center text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 text-rose-600 dark:text-rose-400 rounded-2xl flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Alertas</span>
          </button>

          {/* Proyectos */}
          <button
            onClick={() => router.push("/pm/proyectos")}
            className="min-h-[58px] p-3 w-full justify-center text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/25 text-sky-600 dark:text-sky-400 rounded-2xl flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
          >
            <FolderKanban className="w-5 h-5 shrink-0" />
            <span>Proyectos</span>
          </button>

          {/* Horarios */}
          <button
            onClick={() => router.push("/pm/asignacion-horarios")}
            className="min-h-[58px] p-3 w-full justify-center text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-2xl flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
          >
            <CalendarClock className="w-5 h-5 shrink-0" />
            <span>Horarios</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}