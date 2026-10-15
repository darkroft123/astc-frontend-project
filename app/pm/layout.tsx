"use client";
import { useMemo } from "react";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { PMSidebar, SidebarNav } from "@/components/layout/pm-sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileSidebarProvider, MobileSidebar, HamburgerButton } from "@/components/layout/MobileSidebar";

const PM_ROLES = ["PROJECT_MANAGER"];

export default function PmLayout({ children }: { children: React.ReactNode }) {
  const { hydrated, checkingAuth } = useAuthGuard(PM_ROLES);
  if (!hydrated || checkingAuth) {
    return (<div className="min-h-screen flex items-center justify-center">Cargando...</div>);
  }
  return (
    <div className="flex min-h-screen w-full">
      <MobileSidebarProvider>
        <PMSidebar />
        <MobileSidebar>
          <SidebarNav onNavigate={() => {}} />
        </MobileSidebar>
        <div className="flex-1 min-w-0 md:ml-[268px] relative overflow-x-hidden bg-background">
          {/* Ambient light for all screens in dark mode (from users/create) */}
          <div className="absolute top-[-250px] right-[-100px] w-[600px] h-[450px] bg-purple-600/10 dark:bg-purple-600/20 blur-[140px] rounded-full pointer-events-none hidden dark:block z-0" />
          <div className="absolute top-[-80px] right-[100px] w-[350px] h-[250px] bg-indigo-500/10 dark:bg-indigo-500/15 blur-[100px] rounded-full pointer-events-none hidden dark:block z-0" />

          <div className="absolute top-4 right-4 z-50"><NotificationBell /></div>
          <div className="md:hidden p-4"><HamburgerButton /></div>
          <main className="flex-1 overflow-auto p-4 md:p-6 bg-transparent pb-6 md:pb-6 relative z-10">{children}</main>
        </div>
      </MobileSidebarProvider>
    </div>
  );
}
