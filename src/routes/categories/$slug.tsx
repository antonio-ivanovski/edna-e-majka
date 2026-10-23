import { createFileRoute, notFound } from '@tanstack/react-router'
import { useCallback } from 'react'

import { CatalogueList } from '#/components/catalogue/catalogue-list'
import { Breadcrumbs } from '#/components/ui/breadcrumbs'
import { findCategory } from '#/lib/categories'
import { truncate } from '#/lib/format'
import type { ProductSort, SortDirection } from '#/api/schemas'
import { toValidator, ProductSearch } from '#/api/schemas'
import { productQueries } from '#/lib/queries/products'
import { PRODUCT_PAGE_SIZE } from '#/lib/pagination'

/**
 * Absolute site origin for canonical/OG URLs. `head` runs on both the server
 * and the browser with no request in hand, so prefer the live origin and fall
 * back to production (same pattern as the product page and sitemap/robots,
 * which read `APP_URL` on the server).
 */
const SITE_BASE_FALLBACK = 'https://ednaemajka.mk'

function siteBase(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }
  return SITE_BASE_FALLBACK
}

export const Route = createFileRoute('/categories/$slug')({
  validateSearch: toValidator(ProductSearch),
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient }, params, deps }) => {
    const category = findCategory(params.slug)

    if (!category) {
      throw notFound()
    }

    const page = await queryClient.ensureQueryData(
      productQueries.list({ ...deps, page: deps.page, categorySlug: category.slug }),
    )

    return { category, params: deps, page }
  },
  head: ({ loaderData }) => {
    // Categories carry no own description, so the description falls back to
    // the site tagline the root layout already uses.
    const description = loaderData
      ? truncate(`${loaderData.category.title} — домашни производи на ЕДНА Е МАЈКА.`, 160)
      : 'Тука се сите домашни производи.'
    const canonical = loaderData
      ? `${siteBase()}/categories/${loaderData.category.slug}`
      : undefined

    return {
      meta: [
        { title: loaderData ? `${loaderData.category.title} | ЕДНА Е МАЈКА` : 'ЕДНА Е МАЈКА' },
        { name: 'description', content: description },
        { property: 'og:title', content: loaderData?.category.title ?? 'ЕДНА Е МАЈКА' },
        { property: 'og:description', content: description },
        ...(canonical ? [{ property: 'og:url', content: canonical }] : []),
      ],
      links: canonical ? [{ rel: 'canonical', href: canonical }] : [],
    }
  },
  component: CategoryPage,
})

function CategoryPage() {
  const { category, page, params } = Route.useLoaderData()
  const navigate = Route.useNavigate()

  const onParamsChange = useCallback(
    (next: {
      sort?: ProductSort
      direction?: SortDirection
      page?: number
      minPrice?: number | undefined
      maxPrice?: number | undefined
      inStock?: string | undefined
      categorySlugs?: string | undefined
    }) => void navigate({ search: (prev) => ({ ...prev, ...next }) }),
    [navigate],
  )

  return (
    <div>
      <Breadcrumbs
        items={[{ label: 'Почетна', to: '/' }, { label: 'Категории' }, { label: category.title }]}
      />
      <div className="flex items-center gap-3 px-4 pt-6">
        <img src={category.icon} alt="" width={48} height={48} className="size-12" />
        <h1 className="font-display text-3xl font-semibold">{category.title}</h1>
      </div>

      <CatalogueList
        products={page.items}
        total={page.total}
        sort={params.sort}
        direction={params.direction}
        page={params.page}
        pageSize={PRODUCT_PAGE_SIZE}
        emptyTitle={`Сѐ уште нема производи во „${category.title}“.`}
        emptyDescription="Погледнете другите категории или сите производители."
        onParamsChange={onParamsChange}
        filters={{
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          inStock: params.inStock,
          categorySlugs: params.categorySlugs,
        }}
        showCategoryFilter={false}
      />
    </div>
  )
}
