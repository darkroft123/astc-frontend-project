"use client";
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ActionCardProps {
  href: string
  label: string
  variant?: "primary" | "secondary" | "accent"
  className?: string
}

const variantStyles = {
  primary: "bg-primary hover:bg-primary/90",
  secondary: "bg-secondary hover:bg-secondary/90",
  accent: "bg-destructive/80 hover:bg-destructive/70",
}

export function ActionCard({
  href,
  label,
  variant = "primary",
  className,
}: ActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-28 w-40 flex-col items-center justify-end rounded-xl p-4 text-center transition-all hover:scale-105",
        variantStyles[variant],
        className
      )}
    >
      <span className="text-sm font-medium text-primary-foreground">{label}</span>
    </Link>
  )
}
