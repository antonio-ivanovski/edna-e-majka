import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '#/lib/utils'

/**
 * The panel that greets visitors on the home page and every error or success
 * notice in the forms. Semantic's message: a tinted background with a border
 * of the same family.
 */
const message = cva('rounded-card border px-6 py-4', {
  variants: {
    variant: {
      info: 'border-border bg-surface-sunken text-ink',
      error: 'border-danger/30 bg-danger-soft text-danger-strong',
      success: 'border-success/30 bg-success-soft text-success-strong',
      warning: 'border-accent/40 bg-accent/10 text-ink',
    },
  },
  defaultVariants: { variant: 'info' },
})

type MessageProps = ComponentProps<'div'> &
  VariantProps<typeof message> & {
    title?: ReactNode
  }

export function Message({ className, variant, title, children, ...props }: MessageProps) {
  return (
    <div className={cn(message({ variant }), className)} {...props}>
      {title ? <p className="text-[1.1429em] font-bold">{title}</p> : null}
      {children ? (
        <div className="[&>p]:my-3 [&>p]:opacity-85 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
          {children}
        </div>
      ) : null}
    </div>
  )
}
