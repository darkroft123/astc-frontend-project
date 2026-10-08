interface LegendItemProps {
  color: "emerald" | "rose" | "amber";
  label: string;
  value: number;
}

export function LegendItem({ color, label, value }: LegendItemProps) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-4 h-4 rounded-full ${colorMap[color]}`} />
      <div>
        <p className="font-medium text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}