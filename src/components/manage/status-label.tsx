import { Label } from '#/components/ui/label'
import type { ProductStatus, StoreStatus } from '#/server/queries/manage'

/** The shop states, in the colours the rest of the site uses for meaning. */
const STORE_STATUS: Record<
  StoreStatus,
  { color: 'green' | 'accent' | 'red' | 'grey'; text: string }
> = {
  active: { color: 'green', text: 'Активна' },
  pending: { color: 'accent', text: 'Чека преглед' },
  suspended: { color: 'red', text: 'Суспендирана' },
  archived: { color: 'grey', text: 'Архивирана' },
}

const PRODUCT_STATUS: Record<ProductStatus, { color: 'green' | 'grey'; text: string }> = {
  published: { color: 'green', text: 'Објавен' },
  archived: { color: 'grey', text: 'Архивиран' },
}

export function StoreStatusLabel({ status, size }: { status: StoreStatus; size?: 'small' }) {
  const { color, text } = STORE_STATUS[status]

  return (
    <Label color={color} size={size}>
      {text}
    </Label>
  )
}

export function ProductStatusLabel({ status, size }: { status: ProductStatus; size?: 'small' }) {
  const { color, text } = PRODUCT_STATUS[status]

  return (
    <Label color={color} size={size}>
      {text}
    </Label>
  )
}
