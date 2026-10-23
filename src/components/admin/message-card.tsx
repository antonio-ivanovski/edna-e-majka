import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { Label } from '#/components/ui/label'
import { formatDate } from '#/lib/format'
import { cn } from '#/lib/utils'
import { deleteMessage, setMessageHandled } from '#/server/functions/admin'
import type { AdminMessage } from '#/server/queries/admin'

const KINDS: Record<AdminMessage['kind'], string> = {
  contact: 'Контакт',
  cooperation: 'Соработка',
}

/** One enquiry from the contact or cooperation form. */
export function AdminMessageCard({ message }: { message: AdminMessage }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const handled = message.handledAt !== null

  const toggle = async () => {
    setBusy(true)

    const result = await setMessageHandled({
      data: { messageId: message.id, handled: !handled },
    })

    setBusy(false)

    if (result._tag === 'Failure') {
      toast.error(result.failure.message)
      return
    }

    await router.invalidate()
  }

  const remove = async () => {
    const result = await deleteMessage({ data: { messageId: message.id } })

    if (result._tag === 'Failure') {
      toast.error(result.failure.message)
      return false
    }

    await router.invalidate()
    toast.success('Пораката е избришана.')

    return true
  }

  return (
    <article
      className={cn(
        'rounded-card border border-border bg-surface-raised p-4 shadow-panel',
        handled ? 'opacity-70' : 'border-l-4 border-l-accent',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Label color={message.kind === 'cooperation' ? 'blue' : 'grey'} size="small">
          {KINDS[message.kind]}
        </Label>

        <span className="font-semibold text-ink">{message.name || 'Без име'}</span>
        <span className="text-sm text-ink-subtle">{message.email}</span>
        {message.phone ? <span className="text-sm text-ink-subtle">· {message.phone}</span> : null}

        <span className="ml-auto text-sm text-ink-subtle">
          {formatDate(message.createdAt)}
          {handled && message.handledAt ? ` · прочитана ${formatDate(message.handledAt)}` : ''}
        </span>
      </div>

      {message.website ? (
        <p className="mt-2 text-sm">
          <a
            href={message.website}
            target="_blank"
            rel="noreferrer"
            className="text-accent-strong hover:underline"
          >
            {message.website}
          </a>
        </p>
      ) : null}

      <p className="mt-3 whitespace-pre-wrap text-ink">{message.message}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant={handled ? 'outline' : 'positive'}
          size="sm"
          disabled={busy}
          onClick={() => void toggle()}
        >
          {handled ? 'Врати во непрочитани' : 'Означи како прочитана'}
        </Button>

        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm">
              Избриши
            </Button>
          }
          title="Избриши порака"
          description={`Пораката од ${message.email} ќе биде избришана засекогаш.`}
          confirmLabel="Избриши"
          onConfirm={remove}
        />
      </div>
    </article>
  )
}
