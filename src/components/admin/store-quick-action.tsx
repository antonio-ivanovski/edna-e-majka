import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { setStoreStatus } from '#/server/functions/admin'
import type { AdminStore } from '#/server/queries/admin'

/**
 * The one decision that needs no reason: putting a shop back on the site. An
 * active shop has nothing to approve, so it gets no button here — suspending
 * and archiving ask for a note on the shop's own page.
 *
 * The note is cleared, because whatever the shop was waiting for no longer
 * applies; the check's own note would otherwise linger on a live shop.
 */
export function StoreQuickAction({ store }: { store: AdminStore }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  if (store.status === 'active') {
    return null
  }

  const approving = store.status === 'pending'

  const run = async () => {
    setBusy(true)

    const result = await setStoreStatus({
      data: { storeId: store.id, status: 'active', note: null },
    })

    setBusy(false)

    if (result._tag === "Failure") {
      toast.error(result.failure.message)
      return
    }

    await router.invalidate()
    toast.success(approving ? 'Продавницата е одобрена.' : 'Продавницата е активна.')
  }

  return (
    <Button
      variant={approving ? 'positive' : 'default'}
      size="sm"
      disabled={busy}
      onClick={() => void run()}
    >
      {approving ? 'Одобри' : 'Врати во активни'}
    </Button>
  )
}
