import { PackageOpen } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

/** The empty state the original never had. */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string | undefined
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-16 text-center', className)}>
      <PackageOpen aria-hidden="true" className="size-10 text-black/20" />
      <p className="text-lg font-semibold text-black/[0.85]">{title}</p>
      {description ? <p className="max-w-md text-black/55">{description}</p> : null}
      {action}
    </div>
  )
}
