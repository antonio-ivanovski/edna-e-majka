import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Field, Select, Textarea } from '#/components/ui/field'
import { Panel } from '#/components/ui/panel'
import { formatDate } from '#/lib/format'
import { setStoreStatus } from '#/server/functions/admin'
import type { AdminStore } from '#/server/queries/admin'
import type { StoreStatus } from '#/server/queries/manage'
import { toResult } from '#/lib/server-result'

const STATUSES: { value: StoreStatus; label: string }[] = [
  { value: 'pending', label: 'Чека преглед' },
  { value: 'active', label: 'Активна' },
  { value: 'suspended', label: 'Суспендирана' },
  { value: 'archived', label: 'Архивирана' },
]

/**
 * The moderation decision, with the note the owner will read. The status is a
 * choice rather than four buttons because every transition is allowed: a
 * suspended shop is reactivated by picking "Активна".
 */
export function StoreStatusForm({ store }: { store: AdminStore }) {
  const router = useRouter()
  const [status, setStatus] = useState<StoreStatus>(store.status)
  const [note, setNote] = useState(store.statusNote ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setBusy(true)
    setError('')

    const result = toResult(
      await setStoreStatus({
        data: {
          storeId: store.id,
          status,
          note: note.trim() ? note.trim() : null,
        },
      }),
    )

    setBusy(false)

    if (result._tag === 'Failure') {
      setError(result.failure.message)
      return
    }

    await router.invalidate()
    toast.success('Статусот е зачуван.')
  }

  return (
    <Panel>
      <h2 className="mb-4 font-display text-xl font-semibold">Статус и преглед</h2>

      <div className="grid gap-x-5 sm:grid-cols-[12rem_1fr]">
        <Field label="Статус" htmlFor="admin-store-status">
          <Select
            id="admin-store-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as StoreStatus)}
          >
            {STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Забелешка" htmlFor="admin-store-note">
          <Textarea
            id="admin-store-note"
            rows={2}
            value={note}
            placeholder="Зошто продавницата е во овој статус…"
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
      </div>

      <p className="mb-4 text-sm text-ink-subtle">
        Забелешката ја гледа продавачот на својата табла.
        {store.reviewedAt ? ` Последна измена: ${formatDate(store.reviewedAt)}.` : ''}
      </p>

      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}

      <Button variant="positive" disabled={busy} onClick={() => void save()}>
        {busy ? 'Зачувуваме…' : 'Зачувај статус'}
      </Button>
    </Panel>
  )
}
