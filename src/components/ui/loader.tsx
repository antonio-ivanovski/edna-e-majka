import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

/** Replaces Semantic's loader: a spinner with Macedonian progress text. */
export function Loader({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div
      role="status"
      className={cn('flex items-center justify-center gap-3 py-10 text-ink-muted', className)}
    >
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-border-strong border-t-ink"
      />
      {children ? <span className="text-sm">{children}</span> : null}
    </div>
  )
}
