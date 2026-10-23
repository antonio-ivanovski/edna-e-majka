import type { ReactNode } from 'react'

import { EmptyState } from '#/components/ui/empty-state'
import type { ProductSummary } from '#/server/queries/products'

import { ProductCard } from './product-card'

export function ProductGrid({
  products,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  products: ProductSummary[]
  emptyTitle: string
  emptyDescription?: string | undefined
  /** What to offer when there is nothing to show. */
  emptyAction?: ReactNode
}) {
  if (products.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 p-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
