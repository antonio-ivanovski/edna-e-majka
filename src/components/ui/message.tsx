import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '#/lib/utils'

/**
 * The panel that greets visitors on the home page and every error or success
 * notice in the forms. Semantic's message: light background, 1px inset border,
 * slightly transparent paragraphs.
 */
const message = cva(
  'rounded-[0.2857rem] px-6 py-4 shadow-[inset_0_0_0_1px_var(--message-border)]',
  {
    variants: {
      variant: {
        info: 'bg-surface-subtle text-black/[0.87] [--message-border:rgba(34,36,38,0.22)]',
        error: 'bg-danger-soft text-danger-strong [--message-border:#e0b4b4]',
        success: 'bg-success-soft text-success-strong [--message-border:#a9d5bd]',
        warning: 'bg-[#fffaf3] text-[#573a08] [--message-border:#c9ba9b]',
      },
    },
    defaultVariants: { variant: 'info' },
  },
)

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
