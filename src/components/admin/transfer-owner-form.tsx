import { useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Field, Input } from '#/components/ui/field'
import { Panel } from '#/components/ui/panel'
import { transferStoreOwner } from '#/server/functions/admin'
import type { AdminStore } from '#/server/queries/admin'

/**
 * Moving a shop to another account. Used when the person who should run it
 * cannot sign in as the current owner; the target must not already have one,
 * because a person owns a single shop.
 */
export function TransferOwnerForm({ store }: { store: AdminStore }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')

    const result = await transferStoreOwner({ data: { storeId: store.id, email } })

    setBusy(false)

    if (result._tag === 'Failure') {
      setError(result.failure.message)
      return
    }

    setEmail('')
    await router.invalidate()
    toast.success('Продавницата е префрлена.')
  }

  return (
    <Panel>
      <h2 className="font-display text-xl font-semibold">Сопственик</h2>
      <p className="mt-1 mb-4 text-sm text-ink-muted">
        Сега: {store.owner.name || store.owner.email}. Префрлувањето и ги дава продавницата и
        производите на друга сметка, која не смее да има своја продавница.
      </p>

      <form onSubmit={(event) => void onSubmit(event)} className="flex flex-wrap items-end gap-3">
        <Field
          label="Е-маил на новиот сопственик"
          htmlFor="transfer-email"
          error={error || undefined}
          className="mb-0 min-w-[16rem] flex-1"
        >
          <Input
            id="transfer-email"
            type="email"
            value={email}
            placeholder="ime@primer.mk"
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Button type="submit" variant="outline" disabled={busy || !email.trim()}>
          {busy ? 'Префрламе…' : 'Префрли продавница'}
        </Button>
      </form>
    </Panel>
  )
}
