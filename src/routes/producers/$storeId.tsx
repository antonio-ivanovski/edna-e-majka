import { createFileRoute, redirect } from '@tanstack/react-router'
import { useCallback } from 'react'

import { CatalogueList } from '#/components/catalogue/catalogue-list'
import { ProducerContacts } from '#/components/catalogue/producer-contacts'
import { FollowButton } from '#/components/catalogue/follow-button'
import { Avatar } from '#/components/ui/avatar'
import { Breadcrumbs } from '#/components/ui/breadcrumbs'
import { Panel } from '#/components/ui/panel'
import { imageUrl } from '#/lib/images'
import type { ProductSort, SortDirection } from '#/api/schemas'
import { toValidator, ProductSearch } from '#/api/schemas'
import { productQueries } from '#/lib/queries/products'
import { storeQueries } from '#/lib/queries/stores'
import { PRODUCT_PAGE_SIZE } from '#/lib/pagination'

export const Route = createFileRoute('/producers/$storeId')({
  validateSearch: toValidator(ProductSearch),
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient }, params, deps }) => {
    const store = await queryClient.ensureQueryData(storeQueries.detail(params.storeId))

    // One address per shop: the slug.
    if (store.slug && params.storeId !== store.slug) {
      throw redirect({ to: '/producers/$storeId', params: { storeId: store.slug } })
    }

    const page = await queryClient.ensureQueryData(
      productQueries.list({ ...deps, page: deps.page, storeId: store.id }),
    )

    return { store, params: deps, page }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.store.name} | ЕДНА Е МАЈКА` : 'ЕДНА Е МАЈКА' },
      {
        name: 'description',
        content: loaderData?.store.description ?? 'Производител на домашни производи.',
      },
    ],
  }),
  component: ProducerPage,
})

function ProducerPage() {
  const { store, params, page } = Route.useLoaderData()
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
        items={[
          { label: 'Почетна', to: '/' },
          { label: 'Производители', to: '/producers' },
          { label: store.name },
        ]}
      />
      {store.coverKey ? (
        <img
          src={imageUrl(store.coverKey)}
          alt=""
          className="aspect-[16/5] max-h-[220px] w-full rounded-t-card object-cover"
        />
      ) : null}
      <Panel className={store.coverKey ? 'm-2.5 -mt-2.5 rounded-t-none' : 'm-2.5'}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Avatar src={imageUrl(store.avatarKey)} alt={store.name} size={32} />
            <h1 className="min-w-0 flex-1 font-display text-3xl font-semibold">{store.name}</h1>
            <FollowButton storeId={store.id} />
          </div>
          <p className="whitespace-pre-wrap text-ink-muted">{store.description}</p>
          {store.city ? <p className="text-sm text-ink-subtle">📍 {store.city}</p> : null}
          {store.hours ? <p className="text-sm text-ink-subtle">🕐 {store.hours}</p> : null}
          <div>
            <p className="mb-2 text-sm font-bold text-ink">Контакт:</p>
            <ProducerContacts contacts={store} />
          </div>
        </div>
      </Panel>

      <CatalogueList
        products={page.items}
        total={page.total}
        sort={params.sort}
        direction={params.direction}
        page={params.page}
        pageSize={PRODUCT_PAGE_SIZE}
        emptyTitle={`${store.name} сѐ уште нема објавени производи.`}
        emptyDescription="Погледнете ги другите производители дотогаш."
        onParamsChange={onParamsChange}
        filters={{
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          inStock: params.inStock,
          categorySlugs: params.categorySlugs,
        }}
      />
    </div>
  )
}
