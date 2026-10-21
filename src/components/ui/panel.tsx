import type { ComponentProps } from 'react'

import { cn } from '#/lib/utils'

/** A white bordered panel — Semantic's segment. Used for the producer panel. */
export function Panel({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-[0.2857rem] border border-line bg-white p-4 shadow-[0_1px_2px_0_rgba(34,36,38,0.15)]',
        className,
      )}
      {...props}
    />
  )
}
