import { useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { deleteStore } from '#/server/functions/manage'
import { toResult } from '#/lib/server-result'

/**
 * The owner closes their own shop for good. Everything that belongs to the
 * shop goes with it, so the question says so plainly.
 */
export function DeleteStoreButton({ storeId, storeName }: { storeId: string; storeName: string }) {
  const router = useRouter()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    setBusy(true)

    const result = toResult(await deleteStore({ data: { storeId } }))

    setBusy(false)

    if (result._tag === 'Failure') {
      toast.error(result.failure.message)
      return false
    }

    await router.invalidate()
    toast.success('Продавницата е избришана.')
    void navigate({ to: '/manage' })

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
