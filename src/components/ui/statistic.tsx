import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

/**
 * A price with its variant name underneath, red and centred, the way the
 * product cards and pages have always shown variants.
 */
export function Statistic({
  value,
  label,
  className,
}: {
  value: ReactNode
  label: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="text-2xl leading-none font-normal text-danger uppercase">{value}</div>
      <div className="text-center text-sm font-bold text-black/[0.87] uppercase">{label}</div>
    </div>
  )
}

export function StatisticGroup({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex flex-wrap items-start gap-x-6 gap-y-4', className)}>{children}</div>
  )
}
