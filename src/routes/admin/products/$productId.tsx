import { Link, createFileRoute, useRouter } from '@tanstack/react-router'

import { ProductForm } from '#/components/manage/product-form'
import { adminSaveProduct, adminToggleFeatured, getAdminProduct } from '#/server/functions/admin'

export const Route = createFileRoute('/admin/products/$productId')({
  loader: ({ params }) => getAdminProduct({ data: { productId: params.productId } }),
  head: () => ({ meta: [{ title: 'Уреди производ | Администрација' }] }),
  component: AdminEditProductPage,
})

function AdminEditProductPage() {
  const { store, product } = Route.useLoaderData()
  const router = useRouter()

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

      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          className="cursor-pointer rounded border border-line px-3 py-1.5 text-sm font-semibold hover:bg-black/[0.03]"
          onClick={async () => {
            await adminToggleFeatured({
              data: { productId: product.id, featured: !product.featured },
            })
            await router.invalidate()
          }}
        >
          {product.featured ? '★ Издвоен' : '☆ Означи како издвоен'}
        </button>
      </div>

      <ProductForm
        storeId={store.id}
        product={product}
        save={({ data }) =>
          adminSaveProduct({
            data: {
              ...data,
              categories: data.categories,
              variants: data.variants.map((v) => ({ ...v })),
            },
          })
        }
      />
    </div>
  )
}
