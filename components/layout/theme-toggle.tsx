"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors",
        className
      )}
    >
      {isDark ? (
        <>
          <Moon className="h-4 w-4 shrink-0 text-slate-400" />
          <span>Tema oscuro</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4 shrink-0 text-amber-400" />
          <span>Tema claro</span>
        </>
      )}
    </button>
  );
}
