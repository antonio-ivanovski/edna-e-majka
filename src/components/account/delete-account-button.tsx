import { useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { deleteAccount } from '#/server/functions/account'
import { toResult } from '#/lib/server-result'

/**
 * Closing the account for good. The shop it holds, its listings and their
 * photos go with it, so the question says so plainly.
 */
export function DeleteAccountButton({ storeName }: { storeName: string | null }) {
  const router = useRouter()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    setBusy(true)

    const result = toResult(await deleteAccount())

    setBusy(false)

    if (result._tag === 'Failure') {
      toast.error(result.failure.message)
      return false
    }

    await router.invalidate()
    toast.success('Сметката е избришана.')
    void navigate({ to: '/' })

    return true
  }

  return (
    <ConfirmDialog
      trigger={
        <Button type="button" variant="primary" disabled={busy}>
          Избриши сметката
        </Button>
      }
      title="Избриши сметката"
      description={
        storeName
          ? `Сметката, продавницата „${storeName}“, нејзините производи и сите слики ќе бидат избришани засекогаш.`
          : 'Сметката и сите ваши податоци ќе бидат избришани засекогаш.'
      }
      confirmLabel="Избриши"
      onConfirm={remove}
    />
  )
}
