import { useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { adminDeleteStore } from '#/server/functions/admin'

/** An admin removes a shop with everything that belonged to it. */
export function AdminDeleteStoreButton({
  storeId,
  storeName,
}: {
  storeId: string
  storeName: string
}) {
  const router = useRouter()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    setBusy(true)

    const result = await adminDeleteStore({ data: { storeId } })

    setBusy(false)

    if (!result.ok) {
      toast.error(result.message)
      return false
    }

    await router.invalidate()
    toast.success('Продавницата е избришана.')
    void navigate({ to: '/admin/stores' })

    return true
  }

  return (
    <ConfirmDialog
      trigger={
        <Button type="button" variant="primary" disabled={busy}>
          Избриши продавницата
        </Button>
      }
      title="Избриши продавницата"
      description={`„${storeName}“ и сите нејзини производи, слики и податоци ќе бидат избришани засекогаш.`}
      confirmLabel="Избриши"
      onConfirm={remove}
    />
  )
}
