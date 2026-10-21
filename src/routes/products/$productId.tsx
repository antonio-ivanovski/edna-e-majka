import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { Info } from 'lucide-react'
import { useEffect } from 'react'

import { recordRecentlyViewed } from '#/lib/recently-viewed'

import { EnquiryForm } from '#/components/catalogue/enquiry-form'
import { ProductGrid } from '#/components/catalogue/product-grid'
import { ProducerContacts } from '#/components/catalogue/producer-contacts'
import { ShareButtons } from '#/components/catalogue/share-buttons'
import { Avatar } from '#/components/ui/avatar'
import { Breadcrumbs } from '#/components/ui/breadcrumbs'
import { Label } from '#/components/ui/label'
import { Popover } from '#/components/ui/popover'
import { Statistic, StatisticGroup } from '#/components/ui/statistic'
import { findCategory } from '#/lib/categories'
import { formatPrice, truncate } from '#/lib/format'
import { imageUrl } from '#/lib/images'
import { getProduct, getRelatedProducts } from '#/server/functions/products'

export const Route = createFileRoute('/products/$productId')({
  loader: async ({ params }) => {
    const [product, related] = await Promise.all([
      getProduct({ data: { productId: params.productId } }),
      getRelatedProducts({ data: { productId: params.productId } }),
    ])

    // One address per listing: the slug. Links with the id still work, they
    // only take one extra step.
    if (product.slug && params.productId !== product.slug) {
      throw redirect({ to: '/products/$productId', params: { productId: product.slug } })
    }

    return { product, related }
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.product.title} | ЕДНА Е МАЈКА` : 'ЕДНА Е МАЈКА'

    return {
      meta: [
        { title },
        {
          name: 'description',
          content: loaderData ? truncate(loaderData.product.description, 155) : '',
        },
        { property: 'og:title', content: title },
        {
          property: 'og:image',
          content: loaderData?.product.image
            ? imageUrl(loaderData.product.image.key)
            : '/edna-e-majka-og.jpg',
        },
      ],
    }
  },
  component: ProductPage,
})

function ProductPage() {
  const { product, related } = Route.useLoaderData()

  useEffect(() => {
    recordRecentlyViewed({
      id: product.id,
      title: product.title,
      imageKey: product.images[0]?.key ?? null,
      slug: product.slug,
    })
  }, [product.id, product.title, product.images, product.slug])
  const categories = product.categorySlugs.flatMap((slug) => {
    const category = findCategory(slug)

    return category ? [category] : []
  })

  return (
    <div className="flex flex-col gap-6 p-2.5">
      <Breadcrumbs
        items={[
          { label: 'Почетна', to: '/' },
          { label: 'Производи', to: '/' },
          { label: product.title },
        ]}
      />
      {product.images.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {product.images.map((image, index) => (
            <div
              key={image.key}
              className="max-w-[400px] min-w-[133px] flex-1 overflow-hidden rounded-[0.2857rem] bg-black/[0.04]"
            >
              <img
                src={imageUrl(image.key)}
                alt={image.alt ?? product.title}
                width={image.width}
                height={image.height}
                loading={index === 0 ? 'eager' : 'lazy'}
                className="aspect-4/3 w-full object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}

      <div>
        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Label key={category.slug} asChild size="small" color="grey">
                <Link to="/categories/$slug" params={{ slug: category.slug }}>
                  {category.title}
                </Link>
              </Label>
            ))}
          </div>
        ) : null}

        <h1 className="mt-3 font-display text-3xl leading-tight font-semibold">{product.title}</h1>
        {product.availability === 'out_of_stock' ? (
          <p className="mt-2 inline-block rounded bg-danger/10 px-2 py-1 text-sm font-semibold text-danger">
            Нема на залиха
          </p>
        ) : product.availability === 'on_order' ? (
          <p className="mt-2 inline-block rounded bg-black/5 px-2 py-1 text-sm font-semibold text-black/60">
            По нарачка
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            to="/producers/$storeId"
            params={{ storeId: product.store.slug ?? product.store.id }}
            className="inline-flex items-center gap-2 font-bold hover:underline"
          >
            {product.store.name}
            <Avatar src={imageUrl(product.store.avatarKey)} alt={product.store.name} />
          </Link>
          {product.store.description ? (
            <Popover
              trigger={
                <button
                  type="button"
                  aria-label={`Повеќе за ${product.store.name}`}
                  className="cursor-pointer rounded-full p-1 text-black/40 hover:bg-black/[0.04] hover:text-black/70"
                >
                  <Info className="size-4" />
                </button>
              }
            >
              <p className="whitespace-pre-wrap">{product.store.description}</p>
            </Popover>
          ) : null}
        </div>

        <p className="mt-5 whitespace-pre-wrap text-black/[0.87]">{product.description}</p>

        <section className="mt-6">
          <h2 className="text-[1.2857rem] font-bold text-black/[0.87]">Цена:</h2>
          {product.variants.length > 0 ? (
            <StatisticGroup className="mt-3">
              {product.variants.map((variant) => (
                <Statistic
                  key={variant.id}
                  value={formatPrice(variant.price)}
                  label={variant.title}
                />
              ))}
            </StatisticGroup>
          ) : (
            <p className="mt-2 text-black/55">Цена по договор со производителот.</p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-[1.2857rem] font-bold text-black/[0.87]">
            Нарачај „{product.title}“ од {product.store.name} преку:
          </h2>
          <ProducerContacts contacts={product.store} className="mt-3" />
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold text-black/[0.87]">Сподели</h2>
          <div className="mt-2">
            <ShareButtons path={`/products/${product.id}`} title={product.title} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-[1.2857rem] font-bold text-black/[0.87]">
            Контактирајте го производителот
          </h2>
          <div className="mt-3 max-w-xl">
            <EnquiryForm storeId={product.store.id} productId={product.id} />
          </div>
        </section>
      </div>

      {related.fromStore.length > 0 ? (
        <section className="mt-6">
          <h2 className="px-4 font-display text-xl font-semibold">Од истиот производител</h2>
          <ProductGrid products={related.fromStore} emptyTitle="Нема други производи" />
        </section>
      ) : null}

      {related.similar.length > 0 ? (
        <section className="mt-6">
          <h2 className="px-4 font-display text-xl font-semibold">Слични производи</h2>
          <ProductGrid products={related.similar} emptyTitle="Нема слични производи" />
        </section>
      ) : null}
    </div>
  )
}
