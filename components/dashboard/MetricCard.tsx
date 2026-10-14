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
      "bg-green/10 border-green/20 text-green-ink",
    badge:
      "bg-green/10 text-green-ink border-green/20",
    accent: "text-green-ink",
  },
  amber: {
    iconBg:
      "bg-amber/10 border-amber/20 text-amber-ink",
    badge:
      "bg-amber/10 text-amber-ink border-amber/20",
    accent: "text-amber-ink",
  },
  rose: {
    iconBg:
      "bg-red/10 border-red/20 text-red-ink",
    badge:
      "bg-red/10 text-red-ink border-red/20",
    accent: "text-red-ink",
  },
  blue: {
    iconBg:
      "bg-primary/10 border-primary/20 text-primary",
    badge:
      "bg-primary/10 text-primary border-primary/20",
    accent: "text-primary",
  },
  sky: {
    iconBg:
      "bg-cyan/10 border-cyan/20 text-cyan",
    badge:
      "bg-cyan/10 text-cyan border-cyan/20",
    accent: "text-cyan",
  },
  indigo: {
    iconBg:
      "bg-primary/10 border-primary/20 text-primary",
    badge:
      "bg-primary/10 text-primary border-primary/20",
    accent: "text-primary",
  },
  violet: {
    iconBg:
      "bg-primary/10 border-primary/20 text-primary",
    badge:
      "bg-primary/10 text-primary border-primary/20",
    accent: "text-primary",
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
