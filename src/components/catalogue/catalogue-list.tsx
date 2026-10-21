import { SortAsc, SortDesc } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { formatCount } from '#/lib/format'
import type { ProductSort, SortDirection } from '#/lib/schemas'
import type { ProductSummary } from '#/server/queries/products'
import { cn } from '#/lib/utils'

import { ProductGrid } from './product-grid'

const SORTS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Најново' },
  { value: 'alpha', label: 'Азбучен редослед' },
  { value: 'price', label: 'Цена' },
]

/**
 * The sort row, the card grid and the pager. Every list page renders this and
 * keeps its state in the URL, so a sorted category is a shareable link.
 */
export function CatalogueList({
  products,
  total,
  sort,
  direction,
  page,
  pageSize,
  emptyTitle,
  emptyDescription,
  onParamsChange,
}: {
  products: ProductSummary[]
  total: number
  sort: ProductSort
  direction: SortDirection
  page: number
  pageSize: number
  emptyTitle: string
  emptyDescription?: string
  onParamsChange: (next: { sort?: ProductSort; direction?: SortDirection; page?: number }) => void
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <section>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 px-3 pt-4 text-[1.0714rem]">
        <span className="mr-2 flex items-center gap-1 text-[0.9286rem] font-bold tracking-wide text-black/[0.85] uppercase">
          Подредување
          <button
            type="button"
            onClick={() =>
              onParamsChange({ direction: direction === 'asc' ? 'desc' : 'asc', page: 1 })
            }
            aria-label={direction === 'asc' ? 'Подреди опаѓачки' : 'Подреди растечки'}
            className="cursor-pointer rounded-[0.2857rem] p-1 text-black/45 hover:bg-black/[0.04] hover:text-black/70"
          >
            {direction === 'asc' ? <SortAsc className="size-4" /> : <SortDesc className="size-4" />}
          </button>
        </span>

        {SORTS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={sort === option.value}
            onClick={() =>
              onParamsChange({
                sort: option.value,
                direction: option.value === 'newest' ? 'desc' : 'asc',
                page: 1,
              })
            }
            className={cn(
              'cursor-pointer px-2 py-1 font-semibold',
              sort === option.value ? 'text-black/[0.95]' : 'text-black/45 hover:text-black/70',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {total > 0 ? (
        <p className="px-4 pt-2 text-sm text-black/45">
          {formatCount(total, 'производ', 'производи')}
        </p>
      ) : null}

      <ProductGrid
        products={products}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />

      {pageCount > 1 ? (
        <nav
          aria-label="Страници"
          className="flex flex-wrap items-center justify-center gap-3 py-6"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onParamsChange({ page: page - 1 })}
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
            onClick={() => onParamsChange({ page: page + 1 })}
          >
            Следна
          </Button>
        </nav>
      ) : null}
    </section>
  )
}
