import { Link, createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useCallback } from 'react'

import { CatalogueList } from '#/components/catalogue/catalogue-list'
import { ProductCard } from '#/components/catalogue/product-card'
import { ContactDialog } from '#/components/shell/contact-dialog'
import { CooperationDialog } from '#/components/shell/cooperation-dialog'
import { Button } from '#/components/ui/button'
import { useRecentlyViewed } from '#/hooks/use-recently-viewed'
import { CATEGORIES } from '#/lib/categories'
import { mk } from '#/lib/i18n/mk'
import { imageUrl } from '#/lib/images'
import { toValidator, ProductSearch } from '#/api/schemas'
import type { ProductSort, SortDirection } from '#/api/schemas'
import { productQueries } from '#/lib/queries/products'
import { PRODUCT_PAGE_SIZE } from '#/lib/pagination'

export const Route = createFileRoute('/')({
  validateSearch: toValidator(ProductSearch),
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient }, deps }) => {
    // The pinned products have a row of their own above, so they are kept
    // out of the list underneath rather than shown twice.
    await Promise.all([
      queryClient.ensureQueryData(productQueries.list({ ...deps, excludeFeatured: true })),
      queryClient.ensureQueryData(productQueries.featured()),
    ])
    return { params: deps }
  },
  head: () => ({
    meta: [{ title: 'ЕДНА Е МАЈКА' }],
  }),
  component: HomePage,
})

function HomePage() {
  const { params } = Route.useLoaderData()
  const { data: page } = useSuspenseQuery(productQueries.list({ ...params, excludeFeatured: true }))
  const { data: featured } = useSuspenseQuery(productQueries.featured())
  const navigate = Route.useNavigate()
  const recent = useRecentlyViewed()

  // The new arrivals are the four newest non-featured products, shown in a
  // row of their own on the default view. They are sliced out of the list
  // underneath so a product never appears twice on the page.
  const isDefaultView =
    (params.sort ?? 'newest') === 'newest' &&
    (params.direction ?? 'desc') === 'desc' &&
    (params.page ?? 1) === 1 &&
    params.minPrice == null &&
    params.maxPrice == null &&
    params.inStock == null &&
    (params.categorySlugs == null || params.categorySlugs === '')
  const newArrivals = isDefaultView ? page.items.slice(0, 4) : []
  const restItems = isDefaultView ? page.items.slice(4) : page.items
  const restTotal = isDefaultView ? Math.max(0, page.total - newArrivals.length) : page.total
  const hideMoreProducts = isDefaultView && restItems.length === 0 && newArrivals.length > 0

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
      <section className="px-4 pt-8">
        <h1 className="font-display text-3xl font-semibold">{mk.home.title}</h1>
        <p className="mt-2 max-w-2xl text-ink-muted">{mk.home.subtitle}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button asChild variant="primary">
            <Link to="/producers">{mk.home.viewProducers}</Link>
          </Button>
          <CooperationDialog
            trigger={
              <Button type="button" variant="outline">
                {mk.home.becomeProducer}
              </Button>
            }
          />
          <ContactDialog
            trigger={
              <Button type="button" variant="ghost">
                {mk.home.contact}
              </Button>
            }
          />
        </div>
      </section>

      <section className="px-4 pt-10">
        <h2 className="font-display text-xl font-semibold">{mk.home.categories}</h2>
        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-4 lg:grid-cols-8">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              to="/categories/$slug"
              params={{ slug: category.slug }}
              className="flex flex-col items-center gap-2 rounded-card px-2 py-3 text-center transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-[radial-gradient(closest-side,var(--color-brand),var(--color-cream))]"
            >
              <img
                src={category.icon}
                alt=""
                width={72}
                height={72}
                className="h-16 w-16 shrink-0 sm:h-[72px] sm:w-[72px]"
              />
              <span className="min-h-[2.4em] text-sm leading-tight font-semibold">
                {category.title}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {recent.length > 0 ? (
        <section className="px-4 pt-10">
          <h2 className="font-display text-xl font-semibold">{mk.product.recentlyViewed}</h2>
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
            {recent.map((item) => (
              <Link
                key={item.id}
                to="/products/$productId"
                params={{ productId: item.slug ?? item.id }}
                className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface-raised p-3 text-center transition-shadow hover:shadow-lift"
              >
                {item.imageKey ? (
                  <img
                    src={imageUrl(item.imageKey)}
                    alt=""
                    width={120}
                    height={90}
                    className="h-[90px] w-full rounded-card object-cover"
                  />
                ) : null}
                <span className="line-clamp-2 text-sm font-semibold">{item.title}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {featured.length > 0 ? (
        <section className="pt-10">
          <h2 className="px-4 font-display text-xl font-semibold">{mk.product.featured}</h2>
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 p-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {newArrivals.length > 0 ? (
        <section className="pt-10">
          <h2 className="px-4 font-display text-xl font-semibold">{mk.product.newArrivals}</h2>
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 p-4">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {hideMoreProducts ? null : (
        <section className="pt-10">
          <h2 className="px-4 font-display text-xl font-semibold">{mk.product.moreProducts}</h2>
          <CatalogueList
            products={restItems}
            total={restTotal}
            sort={params.sort}
            direction={params.direction}
            page={params.page}
            pageSize={PRODUCT_PAGE_SIZE}
            emptyTitle={mk.home.noProducts}
            emptyDescription={mk.home.noProductsHint}
            emptyAction={
              <Button asChild variant="primary">
                <Link to="/producers">{mk.home.viewProducers}</Link>
              </Button>
            }
            onParamsChange={onParamsChange}
            filters={{
              minPrice: params.minPrice,
              maxPrice: params.maxPrice,
              inStock: params.inStock,
              categorySlugs: params.categorySlugs,
            }}
          />
        </section>
      )}
    </div>
  )
}
