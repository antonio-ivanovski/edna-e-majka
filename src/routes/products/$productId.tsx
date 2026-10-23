import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { Info } from 'lucide-react'
import { useEffect } from 'react'

import { recordRecentlyViewed } from '#/lib/recently-viewed'

import { EnquiryForm } from '#/components/catalogue/enquiry-form'
import { ReportButton } from '#/components/catalogue/report-button'
import { ProductGrid } from '#/components/catalogue/product-grid'
import { ProducerContacts } from '#/components/catalogue/producer-contacts'
import { ShareButtons } from '#/components/catalogue/share-buttons'
import { FavoriteButton } from '#/components/catalogue/favorite-button'
import { Avatar } from '#/components/ui/avatar'
import { Breadcrumbs } from '#/components/ui/breadcrumbs'
import { Label } from '#/components/ui/label'
import { Popover } from '#/components/ui/popover'
import { Statistic, StatisticGroup } from '#/components/ui/statistic'
import { findCategory } from '#/lib/categories'
import { attributesForCategories } from '#/lib/attributes'
import { formatPrice, truncate } from '#/lib/format'
import { imageUrl } from '#/lib/images'
import { productQueries } from '#/lib/queries/products'
import { getSiteBase } from '#/server/functions/products'

/**
 * Absolute site origin for canonical/OG/JSON-LD URLs. `head` runs on both the
 * server and the browser with no request in hand, so the loader hands over
 * the base it read from `APP_URL` on the server (same source as
 * sitemap/robots), falling back to `https://ednaemajka.mk`. The live
 * `window.location.origin` is only a client-side fallback when the loader
 * provided nothing (e.g. the server function failed).
 */
const SITE_BASE_FALLBACK = 'https://ednaemajka.mk'

function siteBase(loaderBase?: string | null): string {
  const configured = loaderBase?.trim()
  if (configured) return configured.replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }
  return SITE_BASE_FALLBACK
}

function absoluteUrl(value: string | undefined, base?: string | null): string | undefined {
  if (!value) return undefined
  if (/^https?:\/\//i.test(value)) return value
  const origin = siteBase(base)
  return value.startsWith('/') ? `${origin}${value}` : `${origin}/${value}`
}

export const Route = createFileRoute('/products/$productId')({
  loader: async ({ context: { queryClient }, params }) => {
    const product = await queryClient.ensureQueryData(productQueries.detail(params.productId))

    // One address per listing: the slug. Links with the id still work, they
    // only take one extra step.
    if (product.slug && params.productId !== product.slug) {
      throw redirect({ to: '/products/$productId', params: { productId: product.slug } })
    }

    const related = await queryClient.ensureQueryData(productQueries.related(product.id))

    const base = await getSiteBase().catch(() => SITE_BASE_FALLBACK)

    return { product, related, base }
  },
  head: ({ loaderData }) => {
    const base = loaderData?.base ?? null
    const title = loaderData ? `${loaderData.product.title} | ЕДНА Е МАЈКА` : 'ЕДНА Е МАЈКА'
    const description = loaderData ? truncate(loaderData.product.description, 160) : ''
    const path = loaderData ? `/products/${loaderData.product.slug ?? loaderData.product.id}` : null
    const canonical = path ? absoluteUrl(path, base) : undefined
    // The fallback art is also absolutized: crawlers need an absolute
    // og:image even when the listing has no image of its own.
    const image = loaderData
      ? absoluteUrl(imageUrl(loaderData.product.image?.key) ?? '/edna-e-majka-og.jpg', base)
      : undefined
    const firstVariant = loaderData?.product.variants?.[0]

    return {
      meta: [
        { title },
        {
          name: 'description',
          content: description,
        },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'product' },
        ...(canonical ? [{ property: 'og:url', content: canonical }] : []),
        ...(image ? [{ property: 'og:image', content: image }] : []),
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        ...(image ? [{ name: 'twitter:image', content: image }] : []),
      ],
      links: canonical
        ? [
            {
              rel: 'canonical',
              href: canonical,
            },
          ]
        : [],
      scripts: loaderData
        ? [
            {
              type: 'application/ld+json',
              // Titles and descriptions are user input: escape `<` so a
              // `</script>` inside them cannot break out of the JSON-LD block.
              children: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: loaderData.product.title,
                description: loaderData.product.description,
                ...(image ? { image } : {}),
                ...(firstVariant
                  ? {
                      offers: {
                        '@type': 'Offer',
                        priceCurrency: 'MKD',
                        price: firstVariant.price,
                        availability:
                          loaderData.product.availability === 'in_stock'
                            ? 'https://schema.org/InStock'
                            : 'https://schema.org/OutOfStock',
                      },
                    }
                  : {}),
                brand: { '@type': 'Brand', name: loaderData.product.store.name },
              }).replace(/</g, '\\u003c'),
            },
          ]
        : [],
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
          ...(categories[0]
            ? [
                {
                  label: categories[0].title,
                  to: '/categories/$slug',
                  params: { slug: categories[0].slug },
                },
              ]
            : []),
          { label: product.title },
        ]}
      />
      {product.images.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {product.images.map((image, index) => (
            <div
              key={image.key}
              className="max-w-[400px] min-w-[133px] flex-1 overflow-hidden rounded-card bg-hover"
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

        <div className="mt-3 flex items-center gap-3">
          <h1 className="font-display text-3xl leading-tight font-semibold">{product.title}</h1>
          <FavoriteButton productId={product.id} />
        </div>
        {product.availability === 'in_stock' ? (
          <p className="mt-2">
            <Label color="green" size="small">
              Достапно
            </Label>
          </p>
        ) : product.availability === 'out_of_stock' ? (
          <p className="mt-2">
            <Label color="red" size="small">
              Нема на залиха
            </Label>
          </p>
        ) : (
          <p className="mt-2">
            <Label color="grey" size="small">
              По нарачка
            </Label>
          </p>
        )}

        {Object.keys(product.attributes).length > 0 ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
            {Object.entries(product.attributes).map(([key, value]) => {
              const def = attributesForCategories(product.categorySlugs).find(
                (entry) => entry.key === key,
              )
              return (
                <div key={key} className="flex flex-col">
                  <dt className="text-ink-subtle">
                    {def?.label ?? key}
                    {def?.unit ? ' (' + def.unit + ')' : ''}
                  </dt>
                  <dd className="font-semibold">{String(value)}</dd>
                </div>
              )
            })}
          </dl>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            to="/producers/$storeId"
            params={{ storeId: product.store.slug ?? product.store.id }}
            className="inline-flex items-center gap-2 font-bold hover:underline"
          >
            {product.store.name}
            <Avatar src={imageUrl(product.store.avatarKey)} alt="" />
          </Link>
          <ReportButton productId={product.id} storeId={product.store.id} />
          {product.store.description ? (
            <Popover
              trigger={
                <button
                  type="button"
                  aria-label={`Повеќе за ${product.store.name}`}
                  className="cursor-pointer rounded-full p-1 text-ink-subtle hover:bg-hover hover:text-ink"
                >
                  <Info className="size-4" />
                </button>
              }
            >
              <p className="whitespace-pre-wrap">{product.store.description}</p>
            </Popover>
          ) : null}
        </div>

        <p className="mt-5 whitespace-pre-wrap text-ink">{product.description}</p>

        <section className="mt-6">
          <h2 className="text-[1.2857rem] font-bold text-ink">Цена:</h2>
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
            <p className="mt-2 text-ink-muted">Цена по договор со производителот.</p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-[1.2857rem] font-bold text-ink">
            Нарачај „{product.title}“ од {product.store.name} преку:
          </h2>
          <ProducerContacts contacts={product.store} className="mt-3" />
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold text-ink">Сподели</h2>
          <div className="mt-2">
            <ShareButtons path={`/products/${product.slug ?? product.id}`} title={product.title} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-[1.2857rem] font-bold text-ink">Контактирајте го производителот</h2>
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
