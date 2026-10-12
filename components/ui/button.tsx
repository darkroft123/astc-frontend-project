import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] active:scale-[0.98] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-xl',
        gradient:
          'bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] hover:opacity-95 text-white shadow-[0_4px_25px_rgba(99,102,241,0.45)] border border-white/10 rounded-2xl',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 rounded-xl',
        outline:
          'border border-border bg-card/60 shadow-xs hover:bg-accent hover:text-accent-foreground text-foreground rounded-xl',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl',
        ghost:
          'hover:bg-accent hover:text-accent-foreground rounded-xl',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2 has-[>svg]:px-3.5 rounded-xl',
        sm: 'h-8 rounded-lg gap-1.5 px-3 text-xs has-[>svg]:px-2.5',
        lg: 'h-12 rounded-2xl px-7 text-base has-[>svg]:px-5',
        icon: 'size-10 rounded-xl',
        'icon-sm': 'size-8 rounded-lg',
        'icon-lg': 'size-12 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
