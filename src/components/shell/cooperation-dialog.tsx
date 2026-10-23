import { lazy, Suspense, useState, type ReactNode } from 'react'

import { Dialog } from '#/components/ui/dialog'
import { FormSkeleton } from '#/components/ui/skeleton'

import { Button } from '#/components/ui/button'
import { Message } from '#/components/ui/message'

/**
 * The cooperation form lives in its own chunk: it pulls in react-hook-form and
 * Zod, which would otherwise load for everyone who opens any page. It is
 * fetched the first time the dialog opens.
 */
const CooperationForm = lazy(async () => ({
  default: (await import('./cooperation-form')).CooperationForm,
}))

/**
 * The cooperation form behind the amber bar's "Соработка". The trigger can be
 * replaced, so the same form can be offered from the home page.
 */
export function CooperationDialog({ trigger }: { trigger?: ReactNode } = {}) {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)

  return (
    <Dialog
      size="small"
      title="Соработка"
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setSent(false)
        }
      }}
      trigger={
        trigger ?? (
          <button type="button" className="cursor-pointer px-[5px] py-2.5 text-on-brand">
            Соработка
          </button>
        )
      }
      footer={
        sent ? (
          <Button type="button" onClick={() => setOpen(false)}>
            Затвори
          </Button>
        ) : undefined
      }
    >
      {sent ? (
        <Message
          variant="success"
          title="Успешно испратена порака за соработка. Нашиот тим ќе ве контактира наскоро."
        />
      ) : (
        <Suspense fallback={<FormSkeleton rows={5} />}>
          <CooperationForm onSent={() => setSent(true)} />
        </Suspense>
      )}
    </Dialog>
  )
}
