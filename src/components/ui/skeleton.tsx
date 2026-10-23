import { cn } from '#/lib/utils'

/**
 * A placeholder bar for content that arrives in a later chunk. The loading state
 * is visible on purpose: the legacy site's "loader" was white text on a white
 * background, which is why a real shape is shown here instead.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block animate-pulse rounded-card bg-black/[0.06]', className)}
    />
  )
}

/** A few bars stacked like the form they stand in for. */
export function FormSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Се вчитува" className="space-y-5">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  )
}
