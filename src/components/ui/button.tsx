import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '#/lib/utils'

/**
 * Colours come from the Semantic UI buttons the site used: amber for the shop
 * front, red for the main action, green for confirmations, grey for secondary
 * actions.
 */
const button = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[0.2857rem] leading-none font-semibold transition-colors select-none disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        /** Semantic's plain button: the light grey one in modal footers. */
        default: 'bg-[#e0e1e2] text-black/60 hover:bg-[#cacbcd]',
        accent: 'bg-accent text-black/70 hover:bg-accent-strong',
        primary: 'bg-danger text-white hover:bg-[#c92121]',
        positive: 'bg-success text-white hover:bg-[#1c9d3a]',
        neutral: 'bg-muted text-white hover:bg-[#5c5c5c]',
        outline: 'border border-line bg-white text-black/70 hover:bg-black/[0.03]',
        ghost: 'text-black/70 hover:bg-black/[0.04]',
      },
      size: {
        mini: 'h-6 px-2.5 text-[0.7857rem]',
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
