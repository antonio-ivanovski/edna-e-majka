import { createFileRoute } from '@tanstack/react-router'

import { StoreCard } from '#/components/catalogue/store-card'
import { EmptyState } from '#/components/ui/empty-state'
import { listStores } from '#/server/functions/stores'

export const Route = createFileRoute('/producers/')({
  loader: async () => ({ stores: await listStores() }),
  head: () => ({
    meta: [
      { title: 'Производители | ЕДНА Е МАЈКА' },
      {
        name: 'description',
        content: 'Сите производители на домашни производи на платформата Една е Мајка.',
      },
    ],
  }),
  component: ProducersPage,
})

function ProducersPage() {
  const { stores } = Route.useLoaderData()

  return (
    <div>
      <h1 className="px-4 pt-6 font-display text-3xl font-semibold">Производители</h1>
      <p className="mt-2 px-4 text-ink-muted">
        Запознајте ги луѓето зад производите и контактирајте ги директно.
      </p>

      {stores.length === 0 ? (
        <EmptyState
          title="Сѐ уште нема производители."
          description="Штом првите продавници ќе бидат одобрени, тие ќе се појават тука."
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 p-4">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </div>
  )
}
