"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Clock,
  AlertTriangle,
  FileText,
  Bell,
  LogOut,
  FolderKanban,
  CalendarClock,
  ClipboardList,
  Timer,
  Sun,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatAvatarUrl } from "@/lib/avatar-url";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { notificationService } from "@/lib/notification.service";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { getGraphQLUrl } from "@/lib/api-host";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const navigation = [
  { name: "Inicio", href: "/pm", icon: LayoutDashboard },
  { name: "Registrar asistencia", href: "/pm/registrar", icon: CheckCircle2 },
  { name: "Historial de asistencias", href: "/pm/historial-asistencias", icon: ClipboardList },
  { name: "Mis asistencias", href: "/pm/mis-asistencias", icon: CheckCircle2 },
  { name: "Alertas", href: "/pm/alertas", icon: AlertTriangle },
  { name: "Justificaciones", href: "/pm/justificaciones", icon: FileText },
  { name: "Notificaciones", href: "/pm/notificaciones", icon: Bell },
  { name: "Proyectos", href: "/pm/proyectos", icon: FolderKanban },
  { name: "Asignación de horarios", href: "/pm/asignacion-horarios", icon: CalendarClock },
  { name: "Gestión de horarios", href: "/pm/horarios", icon: Timer },
  { name: "Feriados del proyecto", href: "/pm/feriados", icon: Calendar },
  { name: "Vacaciones", href: "/pm/vacaciones", icon: Sun },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, role, token, logout, hydrated } = useAuth();
  const { projects, selectProject, selectedProjectId } = useUserProject();
  const [unreadCount, setUnreadCount] = useState(0);
  const [attendanceLabel, setAttendanceLabel] = useState("Registrar asistencia");

  useEffect(() => {
    if (!hydrated || !token || !selectedProjectId || selectedProjectId === "all") {
      setAttendanceLabel("Registrar asistencia");
      return;
    }
    const ctrl = new AbortController();
    const url = getGraphQLUrl();
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        query: `query($p:String){getTodayAttendance(projectId:$p){checkIn checkOut}}`,
        variables: { p: selectedProjectId },
      }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((j) => {
        const a = j?.data?.getTodayAttendance;
        setAttendanceLabel(a?.checkIn && !a?.checkOut ? "Marcar Salida" : "Registrar asistencia");
      })
      .catch(() => setAttendanceLabel("Registrar asistencia"));
    return () => ctrl.abort();
  }, [hydrated, token, selectedProjectId]);

  useEffect(() => {
    if (hydrated && user?.id && token) {
      notificationService.setToken(token);
      notificationService
        .getUnreadCount(user.id)
        .then(setUnreadCount)
        .catch((err) => console.error("Failed to fetch unread count", err));

      const interval = setInterval(() => {
        notificationService
          .getUnreadCount(user.id)
          .then(setUnreadCount)
          .catch((err) => console.error("Failed to fetch unread count", err));
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [hydrated, user?.id, token]);

  const getInitials = (name: string) => {
    if (!name) return "JP";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || user?.email?.split("@")[0] || "Jefe de Proyecto";

  const displayEmail = user?.email || "pm@joyit.io";
  const avatarSrc = formatAvatarUrl(user?.avatarUrl);

  return (
    <div className="flex flex-col h-full">
      {/* 1. Perfil del usuario (Figma Spec) */}
      <div className="flex items-center gap-3 px-1 mb-3">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#8B5CF6] via-[#6366F1] to-[#38BDF8] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-[0_0_14px_rgba(139,92,246,0.25)]">
          {getInitials(displayName)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[15px] leading-[22.5px] text-white truncate capitalize">
            {displayName}
          </p>
          <p className="font-normal text-[12px] leading-[18px] text-slate-400 truncate mt-0.5">
            {displayEmail}
          </p>
        </div>
      </div>

      {/* 2. Tarjeta del Rol (Figma Spec) */}
      <div className="bg-[#141726] border border-white/[0.06] rounded-2xl p-3.5 mb-4">
        {/* Rol con JetBrains Mono */}
        <div>
          <span className="font-mono text-[10.5px] leading-[15.8px] uppercase tracking-[0.15em] text-[#fbbf24] font-normal">
            JEFE DE PROYECTO
          </span>
        </div>

        {/* Selector de proyectos */}
        <div className="mt-2.5">
          <select
            value={selectedProjectId || "all"}
            onChange={(e) => {
              const val = e.target.value;
              selectProject(val);
              if (typeof window !== "undefined") {
                localStorage.setItem("selected_project_id", val);
                window.dispatchEvent(new CustomEvent("astc-project-changed", { detail: val }));
              }
            }}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
          >
            <option value="all" className="bg-[#141726] text-white">
              Todos mis proyectos ({projects.length})
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#141726] text-white">
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Menú de navegación (Figma Spec) */}
      <nav
        className="flex-1 space-y-1 overflow-y-auto no-scrollbar pr-0.5"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {navigation.map((item) => {
          const displayNameItem =
            item.name === "Registrar asistencia" ? attendanceLabel : item.name;
          const isActive =
            pathname === item.href ||
            (item.href !== "/pm" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[15px] leading-[22.5px] font-normal transition-all group",
                isActive
                  ? "bg-[#221b4a] text-white border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.12)] font-medium"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-violet-400" : "text-slate-400 group-hover:text-white"
                  )}
                />
                <span className="truncate">{displayNameItem}</span>
              </div>
              {item.name === "Notificaciones" && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#ef4444] text-white font-bold text-[10px] px-1.5 shadow-[0_0_8px_rgba(239,68,68,0.4)] shrink-0">
                  {unreadCount > 9 ? "9+" : unreadCount > 0 ? unreadCount : "1"}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 3. Footer */}
      <div className="border-t border-white/[0.06] pt-4 mt-auto space-y-1">
        <ThemeToggle />
        <button
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/20 hover:border hover:border-red-800/30 transition-all group"
        >
          <LogOut className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-red-400 transition-colors" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

export function PmSidebar() {
  return (
    <aside className="hidden md:flex w-64 h-screen fixed left-0 top-0 z-50 bg-[#10121d] border-r border-white/[0.06] flex-col overflow-hidden px-4 py-5">
      <SidebarNav />
    </aside>
  );
}
export default PmSidebar;
