"use client";
import { useMemo } from "react";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { PMSidebar, SidebarNav } from "@/components/layout/pm-sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileSidebarProvider, MobileSidebar, HamburgerButton } from "@/components/layout/MobileSidebar";

import { usePathname } from "next/navigation";

const PM_ROLES = ["PROJECT_MANAGER"];

import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default function PmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hydrated, checkingAuth } = useAuthGuard(PM_ROLES);
  if (!hydrated || checkingAuth) {
    return (<div className="min-h-screen flex items-center justify-center">Cargando...</div>);
  }
  const isSubPage = useMemo(() => {
    if (!pathname) return false;
    return (
      pathname.startsWith("/pm/alertas/") ||
      pathname.startsWith("/pm/justificaciones/") ||
      pathname.startsWith("/pm/asignacion-horarios/asign") ||
      pathname.startsWith("/pm/asignacion-horarios/edit") ||
      pathname.startsWith("/pm/creacion-horarios") ||
      pathname.startsWith("/pm/asistencias/registrar") ||
      pathname.startsWith("/pm/registrar/prev")
    );
  }, [pathname]);

  return (
    <div className="flex min-h-screen w-full">
      <MobileSidebarProvider>
        <PMSidebar />
        <MobileSidebar>
          <SidebarNav onNavigate={() => {}} />
        </MobileSidebar>
        <div className="flex-1 min-w-0 md:ml-[268px] flex flex-col min-h-screen relative bg-background overflow-x-hidden">
          {/* Mobile Top Header (hidden on sub/detail pages that have their own back header) */}
          {!isSubPage && <MobileHeader />}

          {/* Ambient light for all screens in dark mode (50px higher, 100px left) */}
          <div className="absolute top-[-300px] right-0 w-[600px] h-[450px] bg-violet/10 dark:bg-violet/20 blur-[140px] rounded-full pointer-events-none hidden dark:block z-0" />
          <div className="absolute top-[-130px] right-[200px] w-[350px] h-[250px] bg-indigo-500/10 dark:bg-indigo-500/15 blur-[100px] rounded-full pointer-events-none hidden dark:block z-0" />

          <main className={`flex-1 p-4 md:p-6 bg-transparent relative z-10 ${isSubPage ? "pb-8" : "pb-28 md:pb-8"}`}>
            {children}
          </main>

          {/* Mobile Bottom Navigation (hidden on sub/detail pages that have their own actions) */}
          {!isSubPage && <MobileBottomNav basePath="/pm" />}
        </div>
      </MobileSidebarProvider>
    </div>
  );
}
