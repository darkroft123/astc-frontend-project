"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleToggle = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof document !== "undefined") {
      const isJoyit = window.location.hostname.includes("joyit.io");
      const domainAttr = isJoyit ? "; domain=.joyit.io" : "";
      document.cookie = `theme=${nextTheme}; path=/${domainAttr}; max-age=31536000; SameSite=Lax`;
      document.cookie = `theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;
      localStorage.setItem("theme", nextTheme);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className={cn(
        "w-full flex items-center gap-3 rounded-[var(--radius-nav)] px-3.5 py-2.5 text-[15px] font-normal text-text-3 hover:text-foreground hover:bg-raised transition-colors cursor-pointer",
        className
      )}
    >
      {isDark ? (
        <>
          <Sun
            className="h-[18px] w-[18px] shrink-0 text-text-3"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <span>Tema claro</span>
        </>
      ) : (
        <>
          <Moon
            className="h-[18px] w-[18px] shrink-0 text-text-3"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <span>Tema oscuro</span>
        </>
      )}
    </button>
  );
}
