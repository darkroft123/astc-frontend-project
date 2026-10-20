"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Sun,
  MoreHorizontal,
} from "lucide-react";
import { useMobileSidebar } from "./MobileSidebar";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  basePath?: string;
  items?: {
    name: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    isAction?: boolean;
  }[];
}

export function MobileBottomNav({ basePath = "/pm", items }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { setOpen } = useMobileSidebar();

  const defaultNavItems = [
    {
      name: "Panel",
      href: basePath,
      icon: LayoutDashboard,
    },
    {
      name: "Equipo",
      href: `${basePath}/proyectos`,
      icon: Users,
    },
    {
      name: "Alertas",
      href: `${basePath}/alertas`,
      icon: AlertTriangle,
    },
    {
      name: "Vacaciones",
      href: `${basePath}/vacaciones`,
      icon: Sun,
    },
    {
      name: "Más",
      isAction: true,
      icon: MoreHorizontal,
    },
  ];

  const navItems = items || defaultNavItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0A0D18]/95 backdrop-blur-lg border-t border-gray-200/80 dark:border-border/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        if (item.isAction) {
          return (
            <button
              key={item.name}
              onClick={() => setOpen(true)}
              className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-[10.5px] font-medium text-gray-500 dark:text-text-4 hover:text-gray-900 dark:hover:text-foreground transition-colors cursor-pointer group"
            >
              <item.icon className="w-5 h-5 mb-0.5 text-gray-500 dark:text-text-4 group-hover:text-gray-900 dark:group-hover:text-foreground transition-transform group-hover:scale-110" />
              <span>{item.name}</span>
            </button>
          );
        }

        const isActive =
          item.href === basePath
            ? pathname === basePath
            : pathname.startsWith(item.href!);

        return (
          <Link
            key={item.name}
            href={item.href!}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 px-1 text-[10.5px] font-medium transition-all rounded-xl",
              isActive
                ? "text-primary font-bold"
                : "text-gray-500 dark:text-text-4 hover:text-gray-900 dark:hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "p-1 rounded-xl transition-all",
                isActive ? "bg-primary/15 text-primary" : "text-gray-500 dark:text-text-4"
              )}
            >
              <item.icon className="w-5 h-5" />
            </div>
            <span className="leading-tight mt-0.5">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
