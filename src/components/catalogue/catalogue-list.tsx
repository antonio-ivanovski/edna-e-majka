import { ArrowDownUp, RotateCcw } from 'lucide-react'
import { useCallback, type ReactNode } from 'react'

import { Button } from '#/components/ui/button'
import { Checkbox, Input } from '#/components/ui/field'
import { Pager } from '#/components/ui/pager'
import { formatCount } from '#/lib/format'
import { MAX_CATALOGUE_ITEMS } from '#/lib/pagination'
import type { ProductSort, SortDirection } from '#/api/schemas'
import type { ProductSummary } from '#/server/queries/products'
import { CATEGORIES } from '#/lib/categories'
import { cn } from '#/lib/utils'

import { ProductGrid } from './product-grid'

const SORTS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Најново' },
  { value: 'alpha', label: 'Азбучен редослед' },
  { value: 'price', label: 'Цена' },
]

export type CatalogueFilters = {
  minPrice?: number | undefined
  maxPrice?: number | undefined
  inStock?: string | undefined
  categorySlugs?: string | undefined
}

export type CatalogueParams = {
  sort?: ProductSort
  direction?: SortDirection
  page?: number
  minPrice?: number | undefined
  maxPrice?: number | undefined
  inStock?: string | undefined
  categorySlugs?: string | undefined
}

/**
 * The sort row, the filters, the card grid and the pager. Every list page
 * renders this and keeps its state in the URL, so a sorted category is a
 * shareable link.
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
  emptyAction,
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
  /** What to offer when the list is empty. */
  emptyAction?: ReactNode
  filters?: CatalogueFilters
  showCategoryFilter?: boolean
  onParamsChange: (next: CatalogueParams) => void
}) {
  const pageCount = Math.min(
    Math.max(1, Math.ceil(total / pageSize)),
    Math.max(1, Math.ceil(MAX_CATALOGUE_ITEMS / pageSize)),
  )

  // Paged: the server sends exactly one page slice, but never render more
  // than a page even if a stale payload carries extra cards.
  const visibleProducts = products.slice(0, pageSize)

  const activeCategories = (filters?.categorySlugs ?? '')
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean)

  const activeFilterCount =
    (filters?.minPrice != null ? 1 : 0) +
    (filters?.maxPrice != null ? 1 : 0) +
    (filters?.inStock === '1' ? 1 : 0) +
    activeCategories.length

  const clearFilters = useCallback(() => {
    onParamsChange({
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
      categorySlugs: undefined,
      page: 1,
    })
  }, [onParamsChange])

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-5">
        <div
          role="group"
          aria-label="Подредување"
          className="flex flex-wrap items-center gap-x-1 gap-y-1"
        >
          <span className="mr-1 text-[0.7857rem] font-bold tracking-wide text-ink-muted uppercase">
            Подреди
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
                'cursor-pointer rounded-card px-2 py-1 font-semibold transition-colors',
                sort === option.value
                  ? 'bg-border text-ink'
                  : 'text-ink-muted hover:bg-hover hover:text-ink',
              )}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              onParamsChange({ direction: direction === 'asc' ? 'desc' : 'asc', page: 1 })
            }
            aria-label={direction === 'asc' ? 'Насока: растечка' : 'Насока: опаѓачка'}
            aria-pressed={direction === 'desc'}
            title={direction === 'asc' ? 'Насока: растечка' : 'Насока: опаѓачка'}
            className="ml-1 cursor-pointer rounded-card p-1.5 text-ink-muted transition-colors hover:bg-hover hover:text-ink"
          >
            <ArrowDownUp aria-hidden="true" className="size-4" />
          </button>
        </div>

        {total > 0 ? (
          <p className="text-sm text-ink-subtle">
            {visibleProducts.length < total
              ? `прикажани ${visibleProducts.length} од ${formatCount(total, 'производ', 'производи')}`
              : formatCount(total, 'производ', 'производи')}
          </p>
        ) : null}
      </div>

      <div className="px-4 pt-3">
        <details className="group rounded-card border border-border bg-surface-raised">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold text-ink">
            <span>Филтри</span>
            {activeFilterCount > 0 ? (
              <span className="rounded-card bg-accent px-1.5 py-0.5 text-[0.7857rem] font-bold text-on-brand">
                {activeFilterCount}
              </span>
            ) : null}
            <span
              aria-hidden="true"
              className="ml-auto text-ink-subtle transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>

          <div className="flex flex-col gap-4 border-t border-border px-3 py-3">
            <div className="flex flex-wrap items-end gap-4">
              <label htmlFor="filter-min-price" className="flex flex-col gap-1 text-sm">
                <span className="text-ink-muted">Мин. цена (ден.)</span>
                <Input
                  id="filter-min-price"
                  key={`min-${filters?.minPrice ?? ''}`}
                  type="number"
                  min={0}
                  defaultValue={filters?.minPrice ?? ''}
                  onBlur={(event) => {
                    const value = event.target.value.trim()
                    onParamsChange({
                      minPrice: value ? Number(value) : undefined,
                      page: 1,
                    })
                  }}
                  className="h-9 w-28"
                />
              </label>

              <label htmlFor="filter-max-price" className="flex flex-col gap-1 text-sm">
                <span className="text-ink-muted">Макс. цена (ден.)</span>
                <Input
                  id="filter-max-price"
                  key={`max-${filters?.maxPrice ?? ''}`}
                  type="number"
                  min={0}
                  defaultValue={filters?.maxPrice ?? ''}
                  onBlur={(event) => {
                    const value = event.target.value.trim()
                    onParamsChange({
                      maxPrice: value ? Number(value) : undefined,
                      page: 1,
                    })
                  }}
                  className="h-9 w-28"
                />
              </label>

              <Checkbox
                label="Само на залиха"
                checked={filters?.inStock === '1'}
                onChange={(event) =>
                  onParamsChange({ inStock: event.target.checked ? '1' : undefined, page: 1 })
                }
                className="py-2"
              />

              {activeFilterCount > 0 ? (
                <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                  <RotateCcw aria-hidden="true" className="size-4" />
                  Исчисти
                </Button>
              ) : null}
            </div>

            {showCategoryFilter ? (
              <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <legend className="mb-1 text-sm text-ink-muted">Категории</legend>
                {CATEGORIES.map((category) => (
                  <Checkbox
                    key={category.slug}
                    label={category.title}
                    checked={activeCategories.includes(category.slug)}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...activeCategories, category.slug]
                        : activeCategories.filter((slug) => slug !== category.slug)

                      onParamsChange({
                        categorySlugs: next.length > 0 ? next.join(',') : undefined,
                        page: 1,
                      })
                    }}
                    className="gap-1.5"
                  />
                ))}
              </fieldset>
            ) : null}
          </div>
        </details>
      </div>

      <ProductGrid
        products={visibleProducts}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyAction={emptyAction}
      />

      <Pager
        page={page}
        pageCount={pageCount}
        onPageChange={(next) => onParamsChange({ page: next })}
      />
    </section>
  )
}
