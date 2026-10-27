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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const navigation = [
  { name: "Panel", href: "/pm", icon: LayoutDashboard },
  { name: "Registrar asistencia", href: "/pm/registrar", icon: CheckCircle2 },
  { name: "Historial del equipo", href: "/pm/historial-asistencias", icon: ClipboardList },
  { name: "Mis asistencias", href: "/pm/mis-asistencias", icon: Clock },
  { name: "Alertas", href: "/pm/alertas", icon: AlertTriangle },
  { name: "Justificaciones", href: "/pm/justificaciones", icon: FileText, badgeColor: "bg-amber text-white font-bold" },
  { name: "Notificaciones", href: "/pm/notificaciones", icon: Bell, badgeColor: "bg-red text-white font-bold" },
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
  const [pendingJustifications, setPendingJustifications] = useState(0);
  const [attendanceLabel, setAttendanceLabel] = useState("Registrar asistencia");

  useEffect(() => {
    if (!hydrated || !token) {
      setAttendanceLabel("Registrar asistencia");
      return;
    }
    const updateLabel = () => {
      const url = getGraphQLUrl();
      const projId = !selectedProjectId || selectedProjectId === "all" ? null : selectedProjectId;
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: `query($p:String){getTodayAttendance(projectId:$p){checkIn checkOut}}`,
          variables: { p: projId },
        }),
      })
        .then((r) => r.json())
        .then((j) => {
          const a = j?.data?.getTodayAttendance;
          setAttendanceLabel(a?.checkIn && !a?.checkOut ? "Marcar Salida" : "Registrar asistencia");
        })
        .catch(() => setAttendanceLabel("Registrar asistencia"));
    };

    updateLabel();
    window.addEventListener("astc-attendance-updated", updateLabel);
    return () => window.removeEventListener("astc-attendance-updated", updateLabel);
  }, [hydrated, token, selectedProjectId]);

  useEffect(() => {
    if (hydrated && user?.id && token) {
      notificationService.setToken(token);
      const refreshUnread = () => {
        notificationService
          .getUnreadCount(user.id)
          .then((count) => setUnreadCount(count || 0))
          .catch((err) => console.error("Failed to fetch unread count", err));
      };

      refreshUnread();
      window.addEventListener("astc-notification-updated", refreshUnread);

      const interval = setInterval(refreshUnread, 30000);

      return () => {
        clearInterval(interval);
        window.removeEventListener("astc-notification-updated", refreshUnread);
      };
    }
  }, [hydrated, user?.id, token]);

  useEffect(() => {
    if (!hydrated || !token) return;
    const fetchPendingJustifications = () => {
      fetch(getGraphQLUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: `query { listJustificationsPM(page: 1, size: 1, status: "PENDING") { total } }`,
        }),
      })
        .then((r) => r.json())
        .then((j) => {
          const t = j?.data?.listJustificationsPM?.total ?? 0;
          setPendingJustifications(t);
        })
        .catch(() => {});
    };

    fetchPendingJustifications();
    window.addEventListener("astc-justification-updated", fetchPendingJustifications);
    return () => window.removeEventListener("astc-justification-updated", fetchPendingJustifications);
  }, [hydrated, token]);

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

  const roleLabel = role === "PROJECT_MANAGER" ? "JEFE DE PROYECTO" : "JEFE DE PROYECTO";

  return (
    <div className="flex flex-col h-full">
      {/* 1. Perfil del usuario */}
      <div className="flex items-center gap-3 px-1 mb-3">
        <Avatar className="h-11 w-11 rounded-[var(--radius-kpi)] shrink-0 shadow-sm">
          {avatarSrc && (
            <AvatarImage src={avatarSrc} alt={displayName} className="object-cover rounded-[var(--radius-kpi)]" />
          )}
          <AvatarFallback className="rounded-[var(--radius-kpi)] bg-avatar-gradient text-white font-bold text-sm">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[15px] leading-[22.5px] text-foreground truncate capitalize">
            {displayName}
          </p>
          <p className="font-normal text-[12.5px] leading-[18px] text-text-4 truncate mt-0.5">
            {displayEmail}
          </p>
        </div>
      </div>

      {/* 2. Tarjeta del Rol */}
      <div className="bg-card border border-border dark:bg-[#12141F] dark:border-[#1E2335] rounded-2xl p-3.5 mb-4 shadow-xs">
        <div>
          <span className="font-mono text-[10.5px] leading-[15.8px] uppercase tracking-[0.05em] text-amber font-semibold">
            {roleLabel}
          </span>
        </div>

        {/* Selector de proyectos */}
        <div className="mt-2.5">
          {(() => {
            const projectList = projects && projects.length > 0 ? projects : [];
            const currentProject = projectList.find((p) => p.id === selectedProjectId);
            const displayLabel = currentProject ? currentProject.name : `Todos los proyectos (${projectList.length})`;

            return (
              <Select
                value={selectedProjectId || "all"}
                onValueChange={(val) => {
                  selectProject(val);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("selected_project_id", val);
                    window.dispatchEvent(new CustomEvent("astc-project-changed", { detail: val }));
                  }
                }}
              >
                <SelectTrigger className="w-full h-9 rounded-xl border border-border dark:border-[#1E2335] bg-white dark:bg-[#181B2A] text-xs text-foreground dark:text-white flex items-center justify-between">
                  <span className="truncate font-medium">{displayLabel}</span>
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">
                    Todos los proyectos ({projectList.length})
                  </SelectItem>
                  {projectList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })()}
        </div>

        <div className="flex items-center gap-1.5 mt-2.5 text-xs text-muted-foreground font-sans">
          <Clock className="w-3.5 h-3.5 text-cyan shrink-0" />
          <span>
            {(() => {
              const projectList = projects && projects.length > 0 ? projects : [];
              const curr = projectList.find((p) => p.id === selectedProjectId);
              if (curr?.workStartTime && curr?.workEndTime) {
                return `${curr.workStartTime.slice(0, 5)} – ${curr.workEndTime.slice(0, 5)} · Regular`;
              }
              if (projectList.length > 0 && projectList[0].workStartTime && projectList[0].workEndTime) {
                return `${projectList[0].workStartTime.slice(0, 5)} – ${projectList[0].workEndTime.slice(0, 5)} · Regular`;
              }
              return "Horario según proyecto";
            })()}
          </span>
        </div>
      </div>

      {/* 3. Menú de navegación */}
      <nav
        className="flex-1 space-y-1 overflow-y-auto no-scrollbar pr-0.5"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {(() => {
          const navItems = navigation.map((item) => {
            if (item.name === "Notificaciones") {
              return {
                ...item,
                badge: unreadCount > 0 ? (unreadCount > 9 ? "9+" : String(unreadCount)) : undefined,
              };
            }
            if (item.name === "Justificaciones") {
              return {
                ...item,
                badge: pendingJustifications > 0 ? String(pendingJustifications) : undefined,
              };
            }
            return item;
          });
          return navItems.map((item) => {
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
                "flex items-center justify-between rounded-[var(--radius-nav)] px-3.5 py-2.5 text-[15px] leading-[22.5px] font-normal transition-all group",
                isActive
                  ? "bg-raised text-foreground border border-primary/30 shadow-sm font-medium"
                  : "text-text-3 hover:text-foreground hover:bg-raised"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  strokeWidth={2}
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-text-3 group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{displayNameItem}</span>
              </div>
              {item.badge && (
                <span className={cn("flex h-5 min-w-[20px] items-center justify-center rounded-full text-[10px] px-1.5 shrink-0", item.badgeColor)}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        });
        })()}
      </nav>

      {/* 4. Footer */}
      <div className="border-t border-line pt-4 mt-auto space-y-1">
        <ThemeToggle />
        <button
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="w-full flex items-center gap-3 rounded-[var(--radius-nav)] px-3.5 py-2.5 text-[15px] font-normal text-text-3 hover:text-red-ink hover:bg-red/10 transition-all group"
        >
          <LogOut strokeWidth={2} className="h-[18px] w-[18px] shrink-0 text-text-3 group-hover:text-red-ink transition-colors" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

export function PmSidebar() {
  return (
    <aside className="hidden md:flex w-[268px] h-screen fixed left-0 top-0 z-50 bg-sidebar border-r border-line flex-col overflow-hidden px-4 py-5">
      <SidebarNav />
    </aside>
  );
}
export const PMSidebar = PmSidebar;
export default PmSidebar;
