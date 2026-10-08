"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home, Clock, AlertTriangle, FileText, Bell, LogOut, FolderKanban, CalendarClock, ClipboardList, Timer, Sun, Calendar, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatAvatarUrl } from "@/lib/avatar-url";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { notificationService } from "@/lib/notification.service";
import { getAllProjects } from "@/app/services/project.assistance.service";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { getGraphQLUrl } from "@/lib/api-host";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const navigation = [
  { name: "Inicio", href: "/pm", icon: Home },
  { name: "Registrar Asistencia", href: "/pm/registrar", icon: CheckCircle },
  { name: "Historial de Asistencias", href: "/pm/historial-asistencias", icon: ClipboardList },
  { name: "Mis Asistencias", href: "/pm/mis-asistencias", icon: CheckCircle },
  { name: "Alertas", href: "/pm/alertas", icon: AlertTriangle },
  { name: "Justificaciones", href: "/pm/justificaciones", icon: FileText },
  { name: "Notificaciones", href: "/pm/notificaciones", icon: Bell },
  { name: "Proyectos", href: "/pm/proyectos", icon: FolderKanban },
  { name: "Asignación de Horarios", href: "/pm/asignacion-horarios", icon: CalendarClock },
  { name: "Gestión de Horarios", href: "/pm/horarios", icon: Timer },
  { name: "Feriados del Proyecto", href: "/pm/feriados", icon: Calendar },
  { name: "Vacaciones", href: "/pm/vacaciones", icon: Sun },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, role, token, logout, hydrated } = useAuth();
  const { project, projects, selectProject, selectedProjectId, loadingProject } = useUserProject();
  const [unreadCount, setUnreadCount] = useState(0);
  const [attendanceLabel, setAttendanceLabel] = useState("Registrar Asistencia");

  useEffect(() => {
    if (!hydrated || !token || !selectedProjectId || selectedProjectId === "all") { setAttendanceLabel("Registrar Asistencia"); return; }
    const ctrl = new AbortController();
    const url = getGraphQLUrl();
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: `query($p:String){getTodayAttendance(projectId:$p){checkIn checkOut}}`, variables: { p: selectedProjectId } }),
      signal: ctrl.signal,
    })
      .then(r => r.json())
      .then(j => { const a = j?.data?.getTodayAttendance; setAttendanceLabel(a?.checkIn && !a?.checkOut ? "Marcar Salida" : "Registrar Asistencia"); })
      .catch(() => setAttendanceLabel("Registrar Asistencia"));
    return () => ctrl.abort();
  }, [hydrated, token, selectedProjectId]);

  useEffect(() => {
    if (hydrated && user?.id && token) {
      notificationService.setToken(token);
      notificationService.getUnreadCount(user.id)
        .then(setUnreadCount)
        .catch(err => console.error("Failed to fetch unread count", err));

      const interval = setInterval(() => {
        notificationService.getUnreadCount(user.id)
          .then(setUnreadCount)
          .catch(err => console.error("Failed to fetch unread count", err));
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [hydrated, user?.id]);

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

  const avatarSrc = formatAvatarUrl(user?.avatarUrl);

  return (
    <>
      <div className="flex flex-col items-center gap-3 p-6 pt-8 border-b border-border">
        <Avatar className="h-14 w-14 border-2 border-primary/20">
          {avatarSrc && (
            <AvatarImage
              src={avatarSrc}
              alt={displayName}
              className="object-cover"
            />
          )}
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="text-center w-full px-2">
          <p className="text-xs text-muted-foreground">Bienvenido</p>
          <p className="font-bold text-base text-foreground truncate">{user?.username || "Usuario"}</p>
          {user?.firstName && user?.lastName && (
            <p className="text-sm font-semibold text-foreground truncate">{user.firstName} {user.lastName}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{user?.email}</p>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase">
            ROL: {role || "PROJECT_MANAGER"}
          </p>

          <div className="mt-2.5 w-full">
            {loadingProject ? (
              <div className="px-3 py-1 bg-muted rounded-full border border-border inline-block max-w-full">
                <p className="text-[11px] font-medium text-muted-foreground truncate">Cargando proyectos...</p>
              </div>
            ) : (
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
                className="w-full bg-muted border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-center"
              >
                <option value="all" className="bg-card text-foreground text-xs">
                  Todos mis proyectos ({projects.length})
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-card text-foreground text-xs">
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <div className="mt-2 px-3 py-1.5 bg-gradient-to-br from-blue-50/90 via-indigo-50/70 to-blue-100/50 dark:from-blue-950/70 dark:via-slate-900 dark:to-indigo-950/70 rounded-2xl border border-blue-200/80 dark:border-blue-800/80 shadow-sm flex items-center justify-center">
              <div className="flex items-center gap-1.5 text-[11px] text-blue-900 dark:text-blue-200 font-semibold bg-white/80 dark:bg-black/40 px-2.5 py-1 rounded-xl border border-blue-200/60 dark:border-blue-800/60 shadow-xs max-w-full">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">
                  {project?.workStartTime && project?.workEndTime
                    ? `${project.workStartTime} - ${project.workEndTime}`
                    : "08:00 - 17:00"}
                  {project?.shiftType ? ` • ${project.shiftType}` : " • Turno Rotativo 4x4"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav 
        className="flex-1 px-3 py-6 space-y-1 overflow-y-auto no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {navigation.map((item) => {
          const displayName = item.name === "Registrar Asistencia" ? attendanceLabel : item.name;
          const isActive =
            pathname === item.href ||
            (item.href !== "/pm" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                {displayName}
              </div>
              {item.name === "Notificaciones" && unreadCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 text-white font-extrabold text-[11px] px-1.5 shadow-xs shrink-0">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4 mt-auto">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => { logout(); onNavigate?.(); }}
            className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}

export function PMSidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-card text-foreground border-r border-border flex-col h-screen fixed left-0 top-0 z-50 overflow-hidden">
      <SidebarNav />
    </aside>
  );
}
