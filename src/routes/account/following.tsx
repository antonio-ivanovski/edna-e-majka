import { Link, createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'

import { StoreCard } from '#/components/catalogue/store-card'
import { Button } from '#/components/ui/button'
import { EmptyState } from '#/components/ui/empty-state'
import { favoriteQueries } from '#/lib/queries/favorites'

export const Route = createFileRoute('/account/following')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(favoriteQueries.stores())
  },
  head: () => ({
    meta: [
      { title: 'Продавници што ги следам | ЕДНА Е МАЈКА' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: FollowingPage,
})

function FollowingPage() {
  const { data: stores } = useSuspenseQuery(favoriteQueries.stores())

  return (
    <div className="mx-auto w-full max-w-[80rem] pb-6">
      <h1 className="px-4 pt-6 font-display text-3xl font-semibold">Продавници што ги следам</h1>
      <p className="mt-1 px-4 text-ink-muted">
        Новите производи на овие производители први ќе ги видите.
      </p>

      {stores.length === 0 ? (
        <EmptyState
          title="Сѐ уште не следите ниедна продавница."
          description="Притиснете „Следи“ на страницата на производителот за да се појави тука."
          action={
            <Button asChild variant="primary">
              <Link to="/producers">Запознајте ги производителите</Link>
            </Button>
          }
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
