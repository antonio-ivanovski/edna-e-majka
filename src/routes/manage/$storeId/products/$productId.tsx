import { Link, createFileRoute } from '@tanstack/react-router'

import { ProductForm } from '#/components/manage/product-form'
import { ProductStatusLabel } from '#/components/manage/status-label'
import { manageQueries } from '#/lib/queries/manage'

export const Route = createFileRoute('/manage/$storeId/products/$productId')({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(manageQueries.product(params.storeId, params.productId)),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.product.title} | Менаџирај` : 'Производ | ЕДНА Е МАЈКА',
      },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: EditProductPage,
})

function EditProductPage() {
  const { store, product } = Route.useLoaderData()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        to="/manage/$storeId/products"
        params={{ storeId: store.id }}
        className="text-sm font-semibold text-accent-ink hover:underline"
      >
        ← Производи
      </Link>

      <div className="mt-2 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-semibold">{product.title}</h1>
        <ProductStatusLabel status={product.status} size="small" />
      </div>

      <ProductForm storeId={store.id} product={product} />
    </div>
  )
}
