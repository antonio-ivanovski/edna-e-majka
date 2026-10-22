import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Dialog } from '#/components/ui/dialog'
import { submitReport } from '#/server/functions/contact'

/** A small "report abuse" link that opens a dialog with a reason field. */
export function ReportButton({ storeId, productId }: { storeId?: string; productId?: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)

    const result = await submitReport({
      data: { storeId, productId, reason, startedAt: Date.now() },
    })

    setBusy(false)

    if (result._tag === 'Failure') {
      toast.error(result.failure.message)
      return
    }

    toast.success('Пријавата е испратена.')
    setOpen(false)
    setReason('')
  }

  return (
    <>
      <button
        type="button"
        className="cursor-pointer text-xs text-black/40 hover:text-black/70 hover:underline"
        onClick={() => setOpen(true)}
      >
        Пријави
      </button>
      <Dialog open={open} onOpenChange={setOpen} title="Пријави злоупотреба">
        <div className="space-y-3">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            placeholder="Опишете ја причината…"
            className="w-full rounded border border-line px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Откажи
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={busy}
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
