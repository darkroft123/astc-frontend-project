"use client";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { PMSidebar, SidebarNav } from "@/components/layout/pm-sidebar";
import { MobileSidebarProvider, MobileSidebar } from "@/components/layout/MobileSidebar";
import { usePathname, useRouter } from "next/navigation";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";


function getSubPageInfo(pathname: string | null): { isSubPage: boolean; title: string; backHref: string } {
  if (!pathname) return { isSubPage: false, title: "", backHref: "/pm" };
  if (pathname.startsWith("/pm/justificaciones/")) {
    return { isSubPage: true, title: "Justificaciones", backHref: "/pm/justificaciones" };
  }
  if (pathname.startsWith("/pm/alertas/")) {
    return { isSubPage: true, title: "Alertas", backHref: "/pm/alertas" };
  }
  if (pathname.startsWith("/pm/asignacion-horarios/asign") || pathname.startsWith("/pm/asignacion-horarios/edit")) {
    return { isSubPage: true, title: "Asignación de horarios", backHref: "/pm/asignacion-horarios" };
  }
  if (pathname.startsWith("/pm/creacion-horarios")) {
    return { isSubPage: true, title: "Gestión de horarios", backHref: "/pm/horarios" };
  }
  if (pathname.startsWith("/pm/asistencias/registrar") || pathname.startsWith("/pm/registrar/prev")) {
    return { isSubPage: true, title: "Registrar asistencia", backHref: "/pm/asistencias" };
  }
  return { isSubPage: false, title: "", backHref: "/pm" };
}

const PM_ROLES = ["PROJECT_MANAGER"];

export default function PmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, checkingAuth } = useAuthGuard(PM_ROLES);

  const subPageInfo = useMemo(() => getSubPageInfo(pathname), [pathname]);
  const isSubPage = subPageInfo.isSubPage;


  if (!hydrated || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <MobileSidebarProvider>
        <PMSidebar />
        <MobileSidebar>
          <SidebarNav onNavigate={() => {}} />
        </MobileSidebar>
        <div className="flex-1 min-w-0 md:ml-[268px] flex flex-col min-h-screen relative bg-background overflow-x-hidden">
          {/* Mobile Top Header: Global Header OR Subpage Header (Image 5) covering edge to edge */}
          {!isSubPage ? (
            <MobileHeader />
          ) : (
            <div className="md:hidden sticky top-0 z-40 w-full bg-white dark:bg-[#0C0E18] border-b border-border dark:border-[#1E2335] px-4 h-14 flex items-center justify-between shadow-xs">
              <button
                type="button"
                onClick={() => router.push(subPageInfo.backHref)}
                className="flex items-center gap-2.5 text-[#6D28D9] dark:text-[#C4B5FD] font-semibold text-[17px] tracking-tight hover:opacity-80 transition-opacity cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                <span>{subPageInfo.title}</span>
              </button>
              <div className="shrink-0 flex items-center pr-0.5">
                <NotificationBell iconOnly />
              </div>
            </div>
          )}

          {/* Ambient light for all screens in dark mode (50px higher, 100px left) */}
          <div className="absolute top-[-300px] right-0 w-[600px] h-[450px] bg-violet/10 dark:bg-violet/20 blur-[140px] rounded-full pointer-events-none hidden md:dark:block z-0" />
          <div className="absolute top-[-130px] right-[200px] w-[350px] h-[250px] bg-indigo-500/10 dark:bg-indigo-500/15 blur-[100px] rounded-full pointer-events-none hidden md:dark:block z-0" />

          <main className={`flex-1 p-4 md:px-8 bg-transparent relative z-10 ${isSubPage ? "md:pt-2 pb-8" : "md:pt-5 pb-28 md:pb-8"}`}>
            {children}
          </main>

          {/* Mobile Bottom Navigation (hidden on sub/detail pages that have their own actions) */}
          {!isSubPage && <MobileBottomNav basePath="/pm" />}
        </div>
      </MobileSidebarProvider>
    </div>
  );
}
