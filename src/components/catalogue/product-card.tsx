import { Link } from '@tanstack/react-router'
import { ImageIcon } from 'lucide-react'

import { Avatar } from '#/components/ui/avatar'
import { Label } from '#/components/ui/label'
import { Statistic } from '#/components/ui/statistic'
import { formatDate, formatPrice } from '#/lib/format'
import { imageUrl } from '#/lib/images'
import type { ProductSummary } from '#/server/queries/products'

/**
 * The yellow-topped card. The photo is never cropped: it letterboxes inside
 * the ratio box, so a tall jar and a wide pie both show whole. The
 * dimensions are known up front, so the box is reserved before the photo
 * arrives and the grid does not jump.
 */
export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-card border border-t-2 border-border-strong border-t-accent bg-surface-raised shadow-card transition-shadow hover:shadow-lift">
      <Link
        to="/products/$productId"
        params={{ productId: product.slug ?? product.id }}
        className="flex flex-1 flex-col hover:bg-hover focus-visible:outline-offset-[-2px]"
      >
        <div className="relative aspect-4/3 overflow-hidden bg-hover">
          {product.image ? (
            <img
              src={imageUrl(product.image.key)}
              alt={product.image.alt ?? product.title}
              width={product.image.width}
              height={product.image.height}
              loading="lazy"
              className="absolute inset-0 size-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink-faint">
              <ImageIcon aria-hidden="true" className="size-8" />
            </div>
          )}
          {product.availability === 'in_stock' ? (
            <span className="absolute top-2 right-2">
              <Label color="green" size="small">
                Достапно
              </Label>
            </span>
          ) : product.availability === 'out_of_stock' ? (
            <span className="absolute top-2 right-2">
              <Label color="red" size="small">
                Нема на залиха
              </Label>
            </span>
          ) : (
            <span className="absolute top-2 right-2">
              <Label color="grey" size="small">
                По нарачка
              </Label>
            </span>
          )}
        </div>

        <div className="border-t border-border px-4 py-4">
          <h2 className="text-lg leading-snug font-bold text-ink">{product.title}</h2>
          <p className="mt-1 text-ink-subtle">Додадено {formatDate(product.createdAt)}</p>
          <p className="mt-2 line-clamp-3 text-ink-muted">{product.description}</p>
        </div>

        <div className="mt-auto border-t border-border/60 px-4 py-3 text-center">
          <p className="text-[0.8571rem] font-bold tracking-wide text-ink-subtle uppercase">Цена</p>
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
            <p className="mt-2 text-ink-subtle">Цена по договор</p>
          )}
        </div>
      </Link>

      <div className="border-t border-border/60 px-4 py-3">
        <Link
          to="/producers/$storeId"
          params={{ storeId: product.store.slug ?? product.store.id }}
          className="inline-flex items-center gap-2 text-sm text-ink-subtle hover:text-ink"
        >
          <Avatar src={imageUrl(product.store.avatarKey)} alt="" />
          {product.store.name}
        </Link>
      </div>
    </article>
  )
}
