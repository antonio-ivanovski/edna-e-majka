import { Link, createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'

import { ProductGrid } from '#/components/catalogue/product-grid'
import { Button } from '#/components/ui/button'
import { favoriteQueries } from '#/lib/queries/favorites'

export const Route = createFileRoute('/account/favourites')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(favoriteQueries.products())
  },
  head: () => ({
    meta: [{ title: 'Омилени производи | ЕДНА Е МАЈКА' }, { name: 'robots', content: 'noindex' }],
  }),
  component: FavouritesPage,
})

function FavouritesPage() {
  const { data: products } = useSuspenseQuery(favoriteQueries.products())

  return (
    <div className="mx-auto w-full max-w-[80rem] pb-6">
      <h1 className="px-4 pt-6 font-display text-3xl font-semibold">Омилени производи</h1>
      <p className="mt-1 px-4 text-ink-muted">
        Производите што сте ги зачувале со срцето, на едно место.
      </p>

      <div className="pt-2">
        <ProductGrid
          products={products}
          emptyTitle="Сѐ уште немате омилени производи."
          emptyDescription="Допрете го срцето на производ за да го зачувате тука."
          emptyAction={
            <Button asChild variant="primary">
              <Link to="/">Разгледајте ги производите</Link>
            </Button>
          }
        />
      </div>
    </div>
  )
}
