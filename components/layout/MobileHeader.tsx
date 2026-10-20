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
    <header className="md:hidden sticky top-0 z-30 w-full bg-white dark:bg-[#0C0E18] border-b border-border dark:border-[#1E2335] px-4 py-3 flex items-center justify-between gap-3 shadow-xs dark:shadow-md transition-colors">
      {/* Left: Hamburger & User Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={() => setOpen(true)}
          className="p-1 -ml-1 text-foreground dark:text-white hover:text-purple-600 dark:hover:text-purple-300 transition-colors shrink-0 cursor-pointer"
          aria-label="Abrir menú"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M4 12H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M4 18H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>

        {/* User Avatar Squircle matching exact image */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0"
          style={{
            background: "linear-gradient(135deg, #5B8CFF 0%, #A855F7 55%, #22C3E6 100%)",
            boxShadow: "0 4px 14px rgba(168, 85, 247, 0.3)",
          }}
        >
          {initials || "CM"}
        </div>

        {/* Name and Turno */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="font-bold text-[15px] leading-tight text-foreground dark:text-white tracking-tight truncate">
            {displayName || "carlos mamani"}
          </p>

          {/* Marquee Ticker Subtitle matching image */}
          <div className="relative overflow-hidden w-full max-w-[210px] sm:max-w-[260px] mt-0.5">
            <div className="whitespace-nowrap animate-marquee inline-block text-xs text-muted-foreground dark:text-[#8F96AE] font-normal">
              <span>{defaultSubtitle}</span>
              <span className="mx-4 text-purple-400/40">•</span>
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
