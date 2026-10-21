import type { ReactNode } from 'react'
import { useState } from 'react'

import { Button } from './button'
import { Dialog } from './dialog'

/**
 * The replacement for `window.confirm`: the same question, asked in the site's
 * own dialog, with the destructive answer in red. The dialog stays open while
 * the action runs and closes only once it has succeeded.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Потврди',
  onConfirm,
}: {
  trigger: ReactNode
  title: string
  description?: ReactNode
  confirmLabel?: string
  onConfirm: () => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    const succeeded = await onConfirm()
    setBusy(false)

    if (succeeded) {
      setOpen(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={title}
      description={description}
      size="tiny"
      closeOnDimmerClick={!busy}
      footer={
        <>
          <Button variant="default" disabled={busy} onClick={() => setOpen(false)}>
            Откажи
          </Button>
          <Button variant="primary" disabled={busy} onClick={() => void confirm()}>
            {busy ? 'Работиме…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-black/60">Оваа акција не може да се врати.</p>
    </Dialog>
  )
}
