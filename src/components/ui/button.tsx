import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '#/lib/utils'

/**
 * Colours come from the Semantic UI buttons the site used: amber for the shop
 * front, red for the main action, green for confirmations, grey for secondary
 * actions. Every colour is a role, so the dark theme needs no extra rules.
 */
const button = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-card leading-none font-semibold transition-colors select-none disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        /** Semantic's plain button: the light grey one in modal footers. */
        default: 'bg-border text-ink-muted hover:bg-hover',
        accent: 'bg-accent text-on-brand hover:bg-accent-strong',
        primary: 'bg-danger text-white hover:bg-danger-strong',
        positive: 'bg-success text-white hover:bg-success-strong',
        outline: 'border border-border bg-surface-raised text-ink hover:bg-hover',
        ghost: 'text-ink hover:bg-hover',
      },
      size: {
        sm: 'h-8 px-3 text-[0.8571rem]',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
      },
      fluid: {
        true: 'w-full',
      },
      /** Square button holding only an icon. */
      iconOnly: {
        true: 'px-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof button> & {
    asChild?: boolean
  }

export function Button({
  className,
  variant,
  size,
  fluid,
  iconOnly,
  asChild,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button'

  return (
    <Component
      className={cn(
        button({ variant, size, fluid, iconOnly }),
        iconOnly && 'aspect-square',
        className,
      )}
      {...props}
    />
  )
}
