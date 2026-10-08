import { ReactNode } from "react";

interface MetricCardProps {
  icon: ReactNode;
  value: string | number;
  title: string;
  subtitle: string;
  trend: string;
  color: "blue" | "emerald" | "rose" | "amber" | "violet" | "indigo";
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-600 hover:bg-blue-700",
  indigo: "bg-indigo-600 hover:bg-indigo-700",
  emerald: "bg-emerald-600 hover:bg-emerald-700",
  rose: "bg-rose-600 hover:bg-rose-700",
  amber: "bg-amber-600 hover:bg-amber-700",
  violet: "bg-violet-600 hover:bg-violet-700",
};

export function MetricCard({ 
  icon, 
  value, 
  title, 
  subtitle, 
  trend, 
  color = "blue"
}: MetricCardProps) {
  return (
    <div className={`${colorMap[color]} text-white rounded-2xl p-4 flex flex-col justify-between h-full shadow-sm transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div className="p-1.5 rounded-xl bg-white/10 shrink-0">
          {icon}
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-none">{value}</p>
      </div>
      <div className="mt-2">
        <p className="font-bold text-sm leading-snug">{title}</p>
        <p className="text-[11px] opacity-85 truncate">{subtitle}</p>
      </div>
      <p className="text-[10px] opacity-75 mt-1.5 font-medium">{trend}</p>
    </div>
  );
}
