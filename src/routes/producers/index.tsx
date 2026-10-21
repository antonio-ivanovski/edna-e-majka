import { Link, createFileRoute } from '@tanstack/react-router'

import { Avatar } from '#/components/ui/avatar'
import { EmptyState } from '#/components/ui/empty-state'
import { formatCount } from '#/lib/format'
import { imageUrl } from '#/lib/images'
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
      <p className="mt-2 px-4 text-black/60">
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
            <Link
              key={store.id}
              to="/producers/$storeId"
              params={{ storeId: store.slug ?? store.id }}
              className="flex flex-col items-center gap-3 rounded-[0.2857rem] border border-line bg-white p-6 text-center shadow-[0_1px_2px_0_rgba(34,36,38,0.15)] transition-shadow hover:shadow-[0_2px_8px_0_rgba(34,36,38,0.2)]"
            >
              <Avatar src={imageUrl(store.avatarKey)} alt={store.name} size={96} />
              <span className="text-lg font-bold text-black/[0.87]">{store.name}</span>
              <span className="line-clamp-3 text-black/60">{store.description}</span>
              {store.city ? <span className="text-sm text-black/45">{store.city}</span> : null}
              <span className="text-sm text-black/45">
                {formatCount(store.productCount, 'производ', 'производи')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
