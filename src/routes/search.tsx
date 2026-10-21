import { createFileRoute } from '@tanstack/react-router'
import { useCallback } from 'react'

import { CatalogueList } from '#/components/catalogue/catalogue-list'
import { EmptyState } from '#/components/ui/empty-state'
import { MIN_SEARCH_LENGTH } from '#/api/schemas'
import type { ProductSort, SortDirection } from '#/api/schemas'
import { toValidator, SearchPageSearch } from '#/api/schemas'
import { listProducts } from '#/server/functions/products'
import { PRODUCT_PAGE_SIZE } from '#/lib/pagination'

export const Route = createFileRoute('/search')({
  validateSearch: toValidator(SearchPageSearch),
  loaderDeps: ({ search }) => ({ ...search, query: search.q }),
  loader: async ({ deps }) => {
    const query = deps.query ?? ''

    if (query.length < MIN_SEARCH_LENGTH) {
      return { query, params: deps, page: { items: [], total: 0 } }
    }

    return {
      query,
      params: deps,
      page: await listProducts({
        data: { sort: deps.sort, direction: deps.direction, page: String(deps.page), query },
      }),
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.query
          ? `${loaderData.query} | ЕДНА Е МАЈКА`
          : 'Пребарување | ЕДНА Е МАЈКА',
      },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: SearchPage,
})

function SearchPage() {
  const { query, params, page } = Route.useLoaderData()
  const navigate = Route.useNavigate()

  const onParamsChange = useCallback(
    (next: { sort?: ProductSort; direction?: SortDirection; page?: number }) =>
      void navigate({ search: (prev) => ({ ...prev, ...next }) }),
    [navigate],
  )

  if (query.length < MIN_SEARCH_LENGTH) {
    return (
      <EmptyState
        title="Пребарајте производи"
        description={`Внесете најмалку ${MIN_SEARCH_LENGTH} знаци во полето за пребарување.`}
      />
    )
  }

  return (
    <div>
      <h1 className="px-4 pt-6 font-display text-3xl font-semibold">Резултати за „{query}“</h1>

      <CatalogueList
        products={page.items}
        total={page.total}
        sort={params.sort}
        direction={params.direction}
        page={params.page}
        pageSize={PRODUCT_PAGE_SIZE}
        emptyTitle={`Нема производи за „${query}“.`}
        emptyDescription="Пробајте со друг збор или прелистајте по категорија."
        onParamsChange={onParamsChange}
      />
    </div>
  )
}
