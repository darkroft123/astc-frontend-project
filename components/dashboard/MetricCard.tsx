import { ReactNode } from "react";

interface MetricCardProps {
  icon: ReactNode;
  value: string | number;
  title: string;
  subtitle?: string;
  trend?: string;
  badge?: string;
  color?: "blue" | "emerald" | "rose" | "amber" | "violet" | "indigo" | "sky";
}

const colorStyles: Record<
  string,
  { iconBg: string; badge: string; accent: string }
> = {
  emerald: {
    iconBg:
      "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/25 text-emerald-600 dark:text-emerald-400",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    iconBg:
      "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/25 text-amber-600 dark:text-amber-400",
    badge:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60",
    accent: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    iconBg:
      "bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/25 text-rose-600 dark:text-rose-400",
    badge:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60",
    accent: "text-rose-600 dark:text-rose-400",
  },
  blue: {
    iconBg:
      "bg-sky-500/10 dark:bg-sky-500/15 border-sky-500/25 text-sky-600 dark:text-sky-400",
    badge:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800/60",
    accent: "text-sky-600 dark:text-sky-400",
  },
  sky: {
    iconBg:
      "bg-sky-500/10 dark:bg-sky-500/15 border-sky-500/25 text-sky-600 dark:text-sky-400",
    badge:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800/60",
    accent: "text-sky-600 dark:text-sky-400",
  },
  indigo: {
    iconBg:
      "bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/25 text-indigo-600 dark:text-indigo-400",
    badge:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800/60",
    accent: "text-indigo-600 dark:text-indigo-400",
  },
  violet: {
    iconBg:
      "bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/25 text-purple-600 dark:text-purple-400",
    badge:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800/60",
    accent: "text-purple-600 dark:text-purple-400",
  },
};

export function MetricCard({
  icon,
  value,
  title,
  subtitle,
  trend,
  badge,
  color = "blue",
}: MetricCardProps) {
  const styles = colorStyles[color] || colorStyles.blue;
  const displayBadge = badge || trend;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between gap-2">
        <div
          className={`p-2.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${styles.iconBg}`}
        >
          {icon}
        </div>
        {displayBadge && (
          <span
            className={`font-mono text-[10.5px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full border ${styles.badge}`}
          >
            {displayBadge}
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="font-sans text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-none">
          {value}
        </p>
        <p className="font-sans font-semibold text-xs sm:text-sm text-foreground/85 mt-1.5 leading-snug">
          {title}
        </p>
        {subtitle && (
          <p className="font-sans text-xs text-muted-foreground mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
