import { Link } from '@tanstack/react-router'
import { ImageIcon } from 'lucide-react'

import { Avatar } from '#/components/ui/avatar'
import { Statistic } from '#/components/ui/statistic'
import { formatDate, formatPrice } from '#/lib/format'
import { imageUrl } from '#/lib/images'
import type { ProductSummary } from '#/server/queries/products'

/**
 * The yellow-topped card. The producer row is a sibling link rather than a
 * link inside the card's link, which the original got wrong.
 */
export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[0.2857rem] border border-t-2 border-[#d4d4d5] border-t-accent bg-white shadow-[0_1px_3px_0_#d4d4d5] transition-shadow hover:shadow-[0_2px_8px_0_#d4d4d5]">
      <Link
        to="/products/$productId"
        params={{ productId: product.id }}
        className="flex flex-1 flex-col hover:bg-black/[0.01] focus-visible:outline-offset-[-2px]"
      >
        <div className="relative aspect-4/3 overflow-hidden bg-black/[0.04]">
          {product.image ? (
            <img
              src={imageUrl(product.image.key)}
              alt={product.image.alt ?? product.title}
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-black/20">
              <ImageIcon aria-hidden="true" className="size-8" />
            </div>
          )}
        </div>

        <div className="border-t border-line px-4 py-4">
          <h3 className="text-[1.2857rem] leading-tight font-bold text-black/[0.85]">
            {product.title}
          </h3>
          <p className="mt-1 text-black/45">Додадено {formatDate(product.createdAt)}</p>
          <p className="mt-2 line-clamp-3 text-black/[0.68]">{product.description}</p>
        </div>

        <div className="mt-auto border-t border-line/60 px-4 py-3 text-center">
          <p className="text-[0.8571rem] font-bold tracking-wide text-black/50 uppercase">Цена</p>
          {product.variants.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-start justify-center gap-x-5 gap-y-3">
              {product.variants.map((variant) => (
                <Statistic
                  key={variant.id}
                  value={formatPrice(variant.price)}
                  label={variant.title}
                />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-black/45">Цена по договор</p>
          )}
        </div>
      </Link>

      <div className="border-t border-line/60 px-4 py-3">
        <Link
          to="/producers/$storeId"
          params={{ storeId: product.store.id }}
          className="inline-flex items-center gap-2 text-black/50 hover:text-black/[0.85]"
        >
          <Avatar src={imageUrl(product.store.avatarKey)} alt={product.store.name} />
          {product.store.name}
        </Link>
      </div>
    </article>
  )
}
