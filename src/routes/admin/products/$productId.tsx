/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link, createFileRoute } from '@tanstack/react-router'

import { ProductForm } from '#/components/manage/product-form'
import { adminSaveProduct, getAdminProduct } from '#/server/functions/admin'

export const Route = createFileRoute('/admin/products/$productId')({
  loader: ({ params }) => getAdminProduct({ data: { productId: params.productId } }),
  head: () => ({ meta: [{ title: 'Уреди производ | Администрација' }] }),
  component: AdminEditProductPage,
})

function AdminEditProductPage() {
  const { store, product } = Route.useLoaderData()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        to="/admin/products"
        className="text-sm font-semibold text-accent-strong hover:underline"
      >
        ← Производи
      </Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">Уреди производ</h1>
      <p className="mt-2 mb-6 text-black/60">{product.title}</p>

      <ProductForm
        storeId={store.id}
        product={product}
        save={({ data }) => adminSaveProduct({ data: { ...data, categories: data.categories, variants: data.variants.map((v) => ({ ...v })) } })}
      />
    </div>
  )
}
