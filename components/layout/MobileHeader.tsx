"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatAvatarUrl } from "@/lib/avatar-url";
import { Menu } from "lucide-react";
import { useMobileSidebar } from "./MobileSidebar";
import { NotificationBell } from "./notification-bell";
import { useAuth } from "@/app/jwt/auth/auth.provider";

interface MobileHeaderProps {
  customSubtitle?: string;
}

export function MobileHeader({ customSubtitle }: MobileHeaderProps) {
  const [hiddenByPage, setHiddenByPage] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ hide?: boolean }>;
      setHiddenByPage(!!customEvent.detail?.hide);
    };
    window.addEventListener("astc-hide-mobile-header", handler);
    return () => window.removeEventListener("astc-hide-mobile-header", handler);
  }, []);
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
      return "Jefe de Proyecto · Gestión y Asistencia";
    }
    if (role === "ADMIN") {
      return "Admin · Control Global";
    }
    return "Jefe de Proyecto · Gestión y Asistencia";
  }, [role, customSubtitle]);

  if (hiddenByPage) return null;

  return (
    <header className="md:hidden sticky top-0 z-30 w-full bg-white dark:bg-[#0C0E18] border-b border-border dark:border-[#1E2335] px-3.5 py-2.5 flex items-center justify-between gap-2.5 shadow-xs dark:shadow-md transition-colors">
      {/* Left: Hamburger & User Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={() => setOpen(true)}
          className="p-1 -ml-1 text-foreground dark:text-white hover:text-purple-600 dark:hover:text-purple-300 transition-colors shrink-0 cursor-pointer"
          aria-label="Abrir menú"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="4" y1="6.5" x2="19" y2="6.5" />
            <line x1="4" y1="12" x2="19" y2="12" />
            <line x1="4" y1="17.5" x2="13" y2="17.5" />
          </svg>
        </button>

        {/* User Avatar Squircle matching exact image */}
        <Avatar className="w-8 h-8 rounded-xl shrink-0 shadow-sm">
          {formatAvatarUrl(user?.avatarUrl) && (
            <AvatarImage
              src={formatAvatarUrl(user?.avatarUrl)!}
              alt={displayName}
              className="object-cover rounded-xl"
            />
          )}
          <AvatarFallback
            className="rounded-xl flex items-center justify-center font-bold text-white text-xs"
            style={{
              background: "linear-gradient(135deg, #5B8CFF 0%, #A855F7 55%, #22C3E6 100%)",
              boxShadow: "0 4px 14px rgba(168, 85, 247, 0.3)",
            }}
          >
            {initials || "CM"}
          </AvatarFallback>
        </Avatar>

        {/* Name and Turno */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="font-bold text-sm leading-tight text-foreground dark:text-white tracking-tight truncate">
            {displayName || "carlos mamani"}
          </p>

          {/* Marquee Ticker Subtitle matching image */}
          <div className="relative overflow-hidden w-full max-w-[210px] sm:max-w-[260px] mt-0.5">
            <div className="whitespace-nowrap animate-marquee inline-block text-[11px] text-muted-foreground dark:text-[#8F96AE] font-normal">
              <span>{defaultSubtitle}</span>
              <span className="mx-4 text-purple-400/40">•</span>
              <span>{defaultSubtitle}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Notification Bell */}
      <div className="shrink-0 flex items-center pr-0.5">
        <NotificationBell />
      </div>
    </header>
  );
}
