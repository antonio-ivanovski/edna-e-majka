import { Link } from '@tanstack/react-router'

import { Avatar } from '#/components/ui/avatar'
import { formatCount } from '#/lib/format'
import { imageUrl } from '#/lib/images'
import type { StoreSummary } from '#/server/queries/stores'

/** A shop in a list: picture, name, a line about it and how much it holds. */
export function StoreCard({ store }: { store: StoreSummary }) {
  return (
    <Link
      to="/producers/$storeId"
      params={{ storeId: store.slug ?? store.id }}
      className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface-raised p-6 text-center shadow-panel transition-shadow hover:shadow-lift"
    >
      <Avatar src={imageUrl(store.avatarKey)} alt={store.name} size={96} />
      <span className="text-lg font-bold text-ink">{store.name}</span>
      <span className="line-clamp-3 text-ink-muted">{store.description}</span>
      {store.city ? <span className="text-sm text-ink-subtle">{store.city}</span> : null}
      <span className="text-sm text-ink-subtle">
        {formatCount(store.productCount, 'производ', 'производи')}
      </span>
    </Link>
  )
}
