import { createFileRoute, notFound } from '@tanstack/react-router'

import { CatalogueList } from '#/components/catalogue/catalogue-list'
import { Breadcrumbs } from '#/components/ui/breadcrumbs'
import { findCategory } from '#/lib/categories'
import { parseProductSearch, resolveProductSearch } from '#/lib/search-params'
import { listProducts } from '#/server/functions/products'
import { PRODUCT_PAGE_SIZE } from '#/lib/pagination'

export const Route = createFileRoute('/categories/$slug')({
  validateSearch: parseProductSearch,
  loaderDeps: ({ search }) => resolveProductSearch(search),
  loader: async ({ params, deps }) => {
    const category = findCategory(params.slug)

    if (!category) {
      throw notFound()
    }

    return {
      category,
      params: deps,
      page: await listProducts({ data: { ...deps, categorySlug: category.slug } }),
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.category.title} | ЕДНА Е МАЈКА` : 'ЕДНА Е МАЈКА' },
      { property: 'og:title', content: loaderData?.category.title ?? 'ЕДНА Е МАЈКА' },
    ],
  }),
  component: CategoryPage,
})

function CategoryPage() {
  const { category, page, params } = Route.useLoaderData()
  const navigate = Route.useNavigate()

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
        onParamsChange={(next) => void navigate({ search: (prev) => ({ ...prev, ...next }) })}
      />
    </div>
  )
}
