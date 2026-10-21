import { createFileRoute } from '@tanstack/react-router'

import { CatalogueList } from '#/components/catalogue/catalogue-list'
import { ProducerContacts } from '#/components/catalogue/producer-contacts'
import { Avatar } from '#/components/ui/avatar'
import { Breadcrumbs } from '#/components/ui/breadcrumbs'
import { Panel } from '#/components/ui/panel'
import { imageUrl } from '#/lib/images'
import { parseProductSearch, resolveProductSearch } from '#/lib/search-params'
import { listProducts } from '#/server/functions/products'
import { getStore } from '#/server/functions/stores'
import { PRODUCT_PAGE_SIZE } from '#/lib/pagination'

export const Route = createFileRoute('/producers/$storeId')({
  validateSearch: parseProductSearch,
  loaderDeps: ({ search }) => resolveProductSearch(search),
  loader: async ({ params, deps }) => {
    const [store, page] = await Promise.all([
      getStore({ data: { storeId: params.storeId } }),
      listProducts({ data: { ...deps, storeId: params.storeId } }),
    ])

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

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Почетна', to: '/' },
          { label: 'Производители', to: '/producers' },
          { label: store.name },
        ]}
      />
      <Panel className="m-2.5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <Avatar src={imageUrl(store.avatarKey)} alt={store.name} size={32} />
            <h1 className="text-[1.2857rem] font-bold text-black/[0.87]">{store.name}</h1>
          </div>
          <p className="whitespace-pre-wrap text-black/[0.68]">{store.description}</p>
          {store.city ? <p className="text-sm text-black/45">📍 {store.city}</p> : null}
          {store.hours ? <p className="text-sm text-black/45">🕐 {store.hours}</p> : null}
          <div>
            <p className="mb-2 text-sm font-bold text-black/[0.87]">Контакт:</p>
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
        onParamsChange={(next) => void navigate({ search: (prev) => ({ ...prev, ...next }) })}
      />
    </div>
  )
}
