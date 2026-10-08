import { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: "green" | "red" | "amber" | "blue" | "violet" | "zinc";
};

export function SubMetricCard({ label, value, icon, color = "zinc" }: MetricCardProps) {
  const style =
    color === "green"
      ? "bg-emerald-50/80 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300"
      : color === "red"
      ? "bg-rose-50/80 border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300"
      : color === "amber"
      ? "bg-amber-50/80 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300"
      : color === "blue"
      ? "bg-blue-50/80 border-blue-200 text-blue-800 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300"
      : color === "violet"
      ? "bg-violet-50/80 border-violet-200 text-violet-800 dark:bg-violet-950/50 dark:border-violet-800 dark:text-violet-300"
      : "bg-card border-border text-foreground";

  return (
    <div
      className={`border rounded-xl px-3 py-2 text-center ${style} shadow-xs min-w-[88px] flex flex-col items-center justify-center transition-all`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">
        {label}
      </p>
      <div className="flex items-center gap-1.5 mt-0.5">
        {icon && <div className="shrink-0 opacity-90">{icon}</div>}
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}
