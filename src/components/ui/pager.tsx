import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

/**
 * The page switch. It shows a window of pages around the current one, so a
 * long catalogue does not turn into a wall of numbers.
 */
export function Pager({
  page,
  pageCount,
  onPageChange,
  className,
}: {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  className?: string
}) {
  if (pageCount <= 1) return null

  return (
    <nav
      aria-label="Страници"
      className={cn('flex flex-wrap items-center justify-center gap-1 px-4 py-6', className)}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Претходна
      </Button>

      {pageWindow(page, pageCount).map((entry, index) =>
        entry === null ? (
          <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-ink-faint">
            …
          </span>
        ) : (
          <Button
            key={entry}
            type="button"
            variant={entry === page ? 'primary' : 'outline'}
            size="sm"
            aria-current={entry === page ? 'page' : undefined}
            aria-label={`Страница ${entry}`}
            onClick={() => onPageChange(entry)}
          >
            {entry}
          </Button>
        ),
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Следна
        <ChevronRight aria-hidden="true" className="size-4" />
      </Button>
    </nav>
  )
}

/** The page numbers to show, with a null where the list is cut short. */
function pageWindow(page: number, pageCount: number): (number | null)[] {
  const window = new Set<number>([1, pageCount, page, page - 1, page + 1])

  const pages = [...window]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b)

  const result: (number | null)[] = []

  for (const value of pages) {
    const previous = result[result.length - 1]

    if (typeof previous === 'number' && value - previous > 1) result.push(null)
    result.push(value)
  }

  return result
}
