import { Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { ProductStatusLabel } from '#/components/manage/status-label'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { TableCell, TableRow } from '#/components/ui/table'
import { formatDate, formatPrice } from '#/lib/format'
import { imageUrl } from '#/lib/images'
import { adminDeleteProduct, adminSetProductArchived } from '#/server/functions/admin'
import type { AdminProduct } from '#/server/queries/admin'

/** One listing in the admin table: archive, publish or remove any shop's work. */
export function AdminProductRow({ product }: { product: AdminProduct }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const published = product.status === 'published'

  const toggleArchived = async () => {
    setBusy(true)

    const result = await adminSetProductArchived({
      data: { productId: product.id, archived: published },
    })

    setBusy(false)

    if (result._tag === "Failure") {
      toast.error(result.failure.message)
      return
    }

    await router.invalidate()
    toast.success(published ? 'Производот е архивиран.' : 'Производот е објавен.')
  }

  const remove = async () => {
    const result = await adminDeleteProduct({ data: { productId: product.id } })

    if (result._tag === "Failure") {
      toast.error(result.failure.message)
      return false
    }

    await router.invalidate()
    toast.success('Производот е избришан.')

    return true
  }

  const price =
    product.minPrice === null
      ? '—'
      : product.maxPrice !== null && product.maxPrice !== product.minPrice
        ? `${formatPrice(product.minPrice)} – ${formatPrice(product.maxPrice)}`
        : formatPrice(product.minPrice)

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          {product.imageKey ? (
            <img
              src={imageUrl(product.imageKey)}
              alt=""
              width={48}
              height={36}
              className="h-9 w-12 rounded-[0.2857rem] border border-line object-cover"
            />
          ) : (
            <span aria-hidden="true" className="h-9 w-12 rounded-[0.2857rem] bg-black/[0.05]" />
          )}
          <span className="font-semibold text-black/[0.87]">{product.title}</span>
        </div>
      </TableCell>

      <TableCell>
        <Link
          to="/admin/stores/$storeId"
          params={{ storeId: product.storeId }}
          className="text-black/70 hover:underline"
        >
          {product.storeName}
        </Link>
      </TableCell>

      <TableCell>
        <ProductStatusLabel status={product.status} size="small" />
      </TableCell>

      <TableCell className="whitespace-nowrap">{price}</TableCell>

      <TableCell className="whitespace-nowrap text-black/60">
        {formatDate(product.createdAt)}
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/products/$productId" params={{ productId: product.id }}>
              Уреди
            </Link>
          </Button>
          <Button variant="default" size="sm" disabled={busy} onClick={() => void toggleArchived()}>
            {published ? 'Архивирај' : 'Објави'}
          </Button>

          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm">
                Избриши
              </Button>
            }
            title="Избриши производ"
            description={`„${product.title}“ и неговите слики ќе бидат избришани засекогаш.`}
            confirmLabel="Избриши"
            onConfirm={remove}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}
