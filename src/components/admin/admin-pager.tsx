import { Button } from '#/components/ui/button'

/** The same pager the catalogue uses, for the admin tables. */
export function AdminPager({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  if (pageCount <= 1) {
    return null
  }

  return (
    <nav aria-label="Страници" className="flex flex-wrap items-center justify-center gap-3 py-6">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Претходна
      </Button>
      <span className="text-black/60">
        Страница {page} од {pageCount}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Следна
      </Button>
    </nav>
  )
}
