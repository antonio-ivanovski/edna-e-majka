import type { ComponentProps } from 'react'

import { cn } from '#/lib/utils'

/** A white bordered panel — Semantic's segment. Used for the producer panel. */
export function Panel({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface-raised p-4 shadow-panel',
        className,
      )}
      {...props}
    />
  )
}
