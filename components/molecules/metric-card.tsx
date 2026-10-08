import { cn } from "@/lib/utils"

interface MetricCardProps {
  value: number
  label: string
  variant?: "primary" | "secondary" | "success" | "warning" | "destructive"
  className?: string
}

const variantStyles = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  destructive: "bg-destructive text-destructive-foreground",
}

export function MetricCard({
  value,
  label,
  variant = "primary",
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg p-4 text-center min-w-[80px]",
        variantStyles[variant],
        className
      )}
    >
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs uppercase tracking-wide opacity-90">{label}</span>
    </div>
  )
}
