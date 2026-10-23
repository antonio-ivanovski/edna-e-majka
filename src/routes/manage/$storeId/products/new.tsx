import { Link, createFileRoute } from '@tanstack/react-router'

import { ProductForm } from '#/components/manage/product-form'
import { getManageStore } from '#/server/functions/manage'

export const Route = createFileRoute('/manage/$storeId/products/new')({
  loader: ({ params }) => getManageStore({ data: { storeId: params.storeId } }),
  head: () => ({
    meta: [{ title: 'Нов производ | ЕДНА Е МАЈКА' }, { name: 'robots', content: 'noindex' }],
  }),
  component: NewProductPage,
})

function NewProductPage() {
  const { store } = Route.useLoaderData()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        to="/manage/$storeId/products"
        params={{ storeId: store.id }}
        className="text-sm font-semibold text-accent-strong hover:underline"
      >
        ← Производи
      </Link>

      <h1 className="mt-2 font-display text-3xl font-semibold">Нов производ</h1>
      <p className="mt-2 mb-6 text-ink-muted">
        Додајте го производот во {store.name}. Сликите избрани сега се прикачуваат откако ќе го
        зачувате производот.
      </p>

      <ProductForm storeId={store.id} />
    </div>
  )
}
