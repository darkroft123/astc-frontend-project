import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, FileText, AlertCircle, FolderKanban, Clock, CalendarClock, ScanFace } from "lucide-react";
import { useRouter } from "next/navigation";

export function QuickActions() {
  const router = useRouter();

  return (
    <Card className="w-full h-full rounded-2xl border border-border bg-card shadow-sm">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="mb-4">
          <h3 className="font-semibold text-xl">Acciones Rápidas</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Gestiona el equipo de forma inmediata
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mt-auto">
          <Button
            onClick={() => router.push("/pm/registrar")}
            className="h-full min-h-[52px] w-full justify-center text-sm font-medium bg-emerald-600 hover:bg-emerald-700 rounded-xl flex-col gap-1.5"
          >
            <ScanFace className="w-5 h-5" /> Registrar
          </Button>

          <Button
            onClick={() => router.push("/pm/asistencias")}
            className="h-full min-h-[52px] w-full justify-center text-sm font-medium bg-violet-600 hover:bg-violet-700 rounded-xl flex-col gap-1.5"
          >
            <BarChart3 className="w-5 h-5" /> Asistencias
          </Button>

          <Button
            onClick={() => router.push("/pm/justificaciones")}
            className="h-full min-h-[52px] w-full justify-center text-sm font-medium bg-violet-600 hover:bg-violet-700 rounded-xl flex-col gap-1.5"
          >
            <FileText className="w-5 h-5" /> Justificaciones
          </Button>

          <Button
            onClick={() => router.push("/pm/alertas")}
            className="h-full min-h-[52px] w-full justify-center text-sm font-medium bg-orange-500 hover:bg-orange-600 rounded-xl flex-col gap-1.5"
          >
            <AlertCircle className="w-5 h-5" /> Alertas
          </Button>

          <Button
            onClick={() => router.push("/pm/proyectos")}
            className="h-full min-h-[52px] w-full justify-center text-sm font-medium bg-orange-500 hover:bg-orange-600 rounded-xl flex-col gap-1.5"
          >
            <FolderKanban className="w-5 h-5" /> Proyectos
          </Button>

          <Button
            onClick={() => router.push("/pm/historial-asistencias")}
            className="h-full min-h-[52px] w-full justify-center text-sm font-medium bg-blue-600 hover:bg-blue-700 rounded-xl flex-col gap-1.5"
          >
            <Clock className="w-5 h-5" /> Historial de Asistencias
          </Button>

          <Button
            onClick={() => router.push("/pm/asignacion-horarios")}
            className="h-full min-h-[52px] w-full justify-center text-sm font-medium bg-emerald-600 hover:bg-emerald-700 rounded-xl flex-col gap-1.5"
          >
            <CalendarClock className="w-5 h-5" /> Horarios
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}