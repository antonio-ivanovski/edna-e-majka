import { Link, createFileRoute } from '@tanstack/react-router'

import { ProductForm } from '#/components/manage/product-form'
import { ProductStatusLabel } from '#/components/manage/status-label'
import { getManageProduct } from '#/server/functions/manage'

export const Route = createFileRoute('/manage/$storeId/products/$productId')({
  loader: ({ params }) =>
    getManageProduct({ data: { storeId: params.storeId, productId: params.productId } }),
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
        className="text-sm font-semibold text-accent-strong hover:underline"
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
