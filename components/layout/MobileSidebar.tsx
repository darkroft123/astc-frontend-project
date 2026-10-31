"use client";
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileSidebarContextType {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextType>({
  open: false,
  setOpen: () => {},
});

export function useMobileSidebar() {
  return useContext(MobileSidebarContext);
}

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <MobileSidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileSidebarContext.Provider>
  );
}

export function MobileSidebar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, setOpen } = useMobileSidebar();

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-[70] h-full w-80 bg-white dark:bg-[#0C0E18] border-l border-border dark:border-[#1E2335] shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col p-4",
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        {/* Close button */}
        <div className="flex justify-end pb-2">
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-[var(--radius-nav)] hover:bg-muted dark:hover:bg-raised text-muted-foreground hover:text-foreground dark:text-text-3 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {open ? children : null}
        </div>
      </div>
    </>
  );
}

export function HamburgerButton() {
  const { setOpen } = useMobileSidebar();
  return (
    <button
      onClick={() => setOpen(true)}
      className="md:hidden p-2 rounded-[var(--radius-nav)] bg-raised border border-line text-text-2 hover:text-foreground hover:bg-inset transition-colors"
      aria-label="Abrir menú"
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
