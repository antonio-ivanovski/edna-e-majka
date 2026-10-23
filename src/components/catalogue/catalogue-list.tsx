import { SortAsc, SortDesc } from 'lucide-react'
import { useCallback } from 'react'

import { Button } from '#/components/ui/button'
import { formatCount } from '#/lib/format'
import { MAX_CATALOGUE_ITEMS } from '#/lib/pagination'
import type { ProductSort, SortDirection } from '#/api/schemas'
import type { ProductSummary } from '#/server/queries/products'
import { CATEGORIES } from '#/lib/categories'
import { cn } from '#/lib/utils'

import { InfiniteScrollTrigger } from './infinite-scroll-trigger'
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
  filters,
  showCategoryFilter = true,
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
  filters?: {
    minPrice?: number | undefined
    maxPrice?: number | undefined
    inStock?: string | undefined
    categorySlugs?: string | undefined
  }
  showCategoryFilter?: boolean
  onParamsChange: (next: {
    sort?: ProductSort
    direction?: SortDirection
    page?: number
    minPrice?: number | undefined
    maxPrice?: number | undefined
    inStock?: string | undefined
    categorySlugs?: string | undefined
  }) => void
}) {
  const pageCount = Math.min(
    Math.max(1, Math.ceil(total / pageSize)),
    Math.max(1, Math.ceil(MAX_CATALOGUE_ITEMS / pageSize)),
  )
  const hasMore = page < pageCount

  // The next page is asked for when the marker at the end of the list appears.
  const loadMore = useCallback(() => {
    onParamsChange({ page: page + 1 })
  }, [onParamsChange, page])

  return (
    <section>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 px-3 pt-4 text-[1.0714rem]">
        <span className="mr-2 flex items-center gap-1 text-[0.9286rem] font-bold tracking-wide text-ink uppercase">
          Подредување
          <button
            type="button"
            onClick={() =>
              onParamsChange({ direction: direction === 'asc' ? 'desc' : 'asc', page: 1 })
            }
            aria-label={direction === 'asc' ? 'Подреди опаѓачки' : 'Подреди растечки'}
            className="cursor-pointer rounded-card p-1 text-ink-subtle hover:bg-hover hover:text-ink"
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
              sort === option.value ? 'text-ink' : 'text-ink-subtle hover:text-ink',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <details className="mx-4 mt-3 rounded-card border border-border bg-surface-raised p-3">
        <summary className="cursor-pointer text-sm font-semibold text-ink">Филтри</summary>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-muted">Мин. цена (ден.)</span>
            <input
              type="number"
              min={0}
              defaultValue={filters?.minPrice ?? ''}
              onBlur={(event) => {
                const value = event.target.value.trim()
                onParamsChange({ minPrice: value ? Number(value) : undefined, page: 1 })
              }}
              className="h-9 w-24 rounded-card border border-border px-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-muted">Макс. цена (ден.)</span>
            <input
              type="number"
              min={0}
              defaultValue={filters?.maxPrice ?? ''}
              onBlur={(event) => {
                const value = event.target.value.trim()
                onParamsChange({ maxPrice: value ? Number(value) : undefined, page: 1 })
              }}
              className="h-9 w-24 rounded-card border border-border px-2"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters?.inStock === '1'}
              onChange={(event) =>
                onParamsChange({ inStock: event.target.checked ? '1' : undefined, page: 1 })
              }
            />
            Само на залиха
          </label>

          {showCategoryFilter ? (
            <div className="flex flex-wrap items-center gap-3">
              {CATEGORIES.map((category) => {
                const selected = (filters?.categorySlugs ?? '')
                  .split(',')
                  .map((slug) => slug.trim())
                  .includes(category.slug)

                return (
                  <label key={category.slug} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(event) => {
                        const current = (filters?.categorySlugs ?? '')
                          .split(',')
                          .map((slug) => slug.trim())
                          .filter(Boolean)

                        const next = event.target.checked
                          ? [...current, category.slug]
                          : current.filter((slug) => slug !== category.slug)

                        onParamsChange({
                          categorySlugs: next.length > 0 ? next.join(',') : undefined,
                          page: 1,
                        })
                      }}
                    />
                    {category.title}
                  </label>
                )
              })}
            </div>
          ) : null}
        </div>
      </details>

      {total > 0 ? (
        <p className="px-4 pt-2 text-sm text-ink-subtle">
          {formatCount(total, 'производ', 'производи')}
        </p>
      ) : null}

      <ProductGrid
        products={products}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />

      {hasMore ? <InfiniteScrollTrigger onVisible={loadMore} /> : null}

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
          <span className="text-ink-muted">
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
