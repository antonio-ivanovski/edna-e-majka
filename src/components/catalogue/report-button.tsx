import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Dialog } from '#/components/ui/dialog'
import { Field, Textarea } from '#/components/ui/field'
import { submitReport } from '#/server/functions/contact'

const MIN_REASON_LENGTH = 5

/** A small "report abuse" link that opens a dialog with a reason field. */
export function ReportButton({ storeId, productId }: { storeId?: string; productId?: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const trimmed = reason.trim()
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_REASON_LENGTH

  const submit = async () => {
    setBusy(true)

    try {
      const result = await submitReport({
        data: { storeId, productId, reason: trimmed, startedAt: Date.now() },
      })

      if (result._tag === 'Failure') {
        toast.error(result.failure.message)
        return
      }

      toast.success('Пријавата е испратена.')
      setOpen(false)
      setReason('')
    } catch {
      // The server rejects a reason that is too short; anything else is the
      // network. Either way the dialog stays open and usable.
      toast.error('Пријавата не можеше да се испрати. Обидете се повторно.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="cursor-pointer text-xs text-ink-faint hover:text-ink hover:underline"
        onClick={() => setOpen(true)}
      >
        Пријави
      </button>
      <Dialog open={open} onOpenChange={setOpen} title="Пријави злоупотреба">
        <div className="space-y-3">
          <Field
            label="Причина"
            htmlFor="report-reason"
            required
            error={
              tooShort ? `Причината мора да има најмалку ${MIN_REASON_LENGTH} знаци.` : undefined
            }
          >
            <Textarea
              id="report-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder="Опишете ја причината…"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Откажи
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={busy || trimmed.length < MIN_REASON_LENGTH}
              onClick={() => void submit()}
            >
              {busy ? 'Испраќаме…' : 'Испрати'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
