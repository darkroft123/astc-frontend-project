"use client";

import React, { useMemo } from "react";
import { Menu } from "lucide-react";
import { useMobileSidebar } from "./MobileSidebar";
import { NotificationBell } from "./notification-bell";
import { useAuth } from "@/app/jwt/auth/auth.provider";

interface MobileHeaderProps {
  customSubtitle?: string;
}

export function MobileHeader({ customSubtitle }: MobileHeaderProps) {
  const { setOpen } = useMobileSidebar();
  const { user, role } = useAuth();

  const displayName = useMemo(() => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.username || user?.email?.split("@")[0] || "carlos mamani";
  }, [user]);

  const initials = useMemo(() => {
    if (!displayName) return "CM";
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }, [displayName]);

  const defaultSubtitle = useMemo(() => {
    if (customSubtitle) return customSubtitle;
    if (role === "PROJECT_MANAGER") {
      return "Jefe de Proyecto · Turno A 08:00–17:00";
    }
    if (role === "ADMIN") {
      return "Administrador · Control Global";
    }
    return "Jefe de Proyecto · Turno A 08:00–17:00";
  }, [role, customSubtitle]);

  return (
    <header className="md:hidden sticky top-0 z-30 w-full bg-white/95 dark:bg-[#080A12]/90 backdrop-blur-md border-b border-gray-200/80 dark:border-border/60 px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-xs">
      {/* Left: Hamburger & User Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 -ml-1 rounded-xl text-gray-700 dark:text-text-3 hover:text-gray-900 dark:hover:text-foreground hover:bg-gray-100 dark:hover:bg-surface/60 transition-colors shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5 text-gray-800 dark:text-foreground" />
        </button>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6366f1] via-[#8b5cf6] to-[#06b6d4] flex items-center justify-center font-bold text-white text-xs shadow-sm shrink-0">
          {initials}
        </div>

        {/* Name and Turno */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="font-bold text-[13.5px] leading-tight text-gray-900 dark:text-foreground truncate">
            {displayName}
          </p>

          {/* Marquee Ticker Subtitle */}
          <div className="relative overflow-hidden w-full max-w-[200px] sm:max-w-[260px] mt-0.5">
            <div className="whitespace-nowrap animate-marquee inline-block text-[11px] text-gray-500 dark:text-text-4 font-normal">
              <span>{defaultSubtitle}</span>
              <span className="mx-4 text-primary/40">•</span>
              <span>{defaultSubtitle}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Notification Bell */}
      <div className="shrink-0 flex items-center">
        <NotificationBell />
      </div>
    </header>
  );
}
