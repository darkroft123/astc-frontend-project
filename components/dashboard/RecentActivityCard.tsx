import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityItem } from "./ActivityItem";
import { useRouter } from "next/navigation";
import { Activity, ChevronRight } from "lucide-react";
export function RecentActivityCard({ users = [] }: { users?: any[] }) {
  const router = useRouter();

  const displayActivities = users.length > 0
    ? users.slice(0, 3).map((user, index) => {
        const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.username?.[0]?.toUpperCase() || "U";
        const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Colaborador";
        const action = index === 0 ? "Registró asistencia de entrada" : index === 1 ? "Registró asistencia puntual" : "Marcó salida de jornada";
        const time = "Hoy";
        const color = index === 0 ? "emerald" as const : index === 1 ? "blue" as const : "violet" as const;
        return { initials, name, action, time, color, avatarUrl: user.avatarUrl };
      })
    : [];

  return (
    <Card className="h-full bg-card border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between">
      <CardContent className="p-5 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-violet-200">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground leading-tight">Actividad Reciente</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Últimas acciones del equipo</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En vivo
          </span>
        </div>

        <div className="flex-1 space-y-1 my-1 overflow-hidden">
          {displayActivities.length > 0 ? (
            displayActivities.map((act, idx) => (
              <ActivityItem
                key={idx}
                initials={act.initials}
                name={act.name}
                action={act.action}
                time={act.time}
                color={act.color}
                avatarUrl={act.avatarUrl}
              />
            ))
          ) : (
            <div className="h-28 flex flex-col items-center justify-center text-center p-4 text-zinc-400 text-xs">
              <Activity className="w-6 h-6 text-zinc-300 mb-1.5" />
              <p>Sin miembros ni actividad reciente</p>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full mt-3 h-10 shrink-0 text-violet-700 hover:text-violet-800 bg-violet-50/50 hover:bg-violet-100/70 border-violet-200/60 rounded-2xl font-semibold text-xs transition-all group"
          onClick={() => router.push("/pm/asistencias")}
        >
          <span>Ver todas las asistencias</span>
          <ChevronRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
