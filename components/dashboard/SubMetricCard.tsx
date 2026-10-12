import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: "green" | "red" | "amber" | "blue" | "zinc";
  className?: string;
};

export function SubMetricCard({ label, value, icon, color = "zinc", className }: MetricCardProps) {
  const colorStyles = {
    green: {
      card: "border-emerald-500/20 bg-emerald-500/[0.04] dark:bg-emerald-950/20",
      iconBox: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      value: "text-foreground",
      label: "text-emerald-600 dark:text-emerald-400 font-semibold",
    },
    red: {
      card: "border-rose-500/20 bg-rose-500/[0.04] dark:bg-rose-950/20",
      iconBox: "text-rose-500 bg-rose-500/10 border-rose-500/20",
      value: "text-foreground",
      label: "text-rose-600 dark:text-rose-400 font-semibold",
    },
    amber: {
      card: "border-amber-500/20 bg-amber-500/[0.04] dark:bg-amber-950/20",
      iconBox: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      value: "text-foreground",
      label: "text-amber-600 dark:text-amber-400 font-semibold",
    },
    blue: {
      card: "border-blue-500/20 bg-blue-500/[0.04] dark:bg-blue-950/20",
      iconBox: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      value: "text-foreground",
      label: "text-blue-600 dark:text-blue-400 font-semibold",
    },
    zinc: {
      card: "border-border bg-card",
      iconBox: "text-muted-foreground bg-muted border-border",
      value: "text-foreground",
      label: "text-muted-foreground font-medium",
    },
  };

  const current = colorStyles[color] || colorStyles.zinc;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition-all",
        current.card,
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div
          className={cn(
            "w-8 h-8 rounded-xl border flex items-center justify-center shrink-0",
            current.iconBox
          )}
        >
          {icon}
        </div>
        <span className={cn("text-[11px] font-mono uppercase tracking-wider", current.label)}>
          {label}
        </span>
      </div>
      <div className="mt-1">
        <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
          {value}
        </p>
      </div>
    </div>
  );
}
