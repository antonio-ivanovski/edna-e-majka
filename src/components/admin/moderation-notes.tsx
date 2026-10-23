import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Panel } from '#/components/ui/panel'
import { addModerationNote, listModerationNotes } from '#/server/functions/admin'

export function ModerationNotes({ storeId }: { storeId: string }) {
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: ['moderation-notes', storeId],
    queryFn: () => listModerationNotes({ data: { storeId } }),
  })
  const [body, setBody] = useState('')

  const mutation = useMutation({
    mutationFn: () => addModerationNote({ data: { storeId, body } }),
    onSuccess: () => {
      setBody('')
      void queryClient.invalidateQueries({ queryKey: ['moderation-notes', storeId] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Грешка.'),
  })

  return (
    <Panel className="p-6">
      <h2 className="mb-3 font-display text-xl font-semibold">Белешки (интерни)</h2>
      <ul className="mb-4 space-y-2">
        {(data ?? []).map((note) => (
          <li
            key={note.id}
            className="rounded-card border border-border bg-black/[0.02] p-3 text-sm"
          >
            <p className="whitespace-pre-wrap">{note.body}</p>
            <p className="mt-1 text-xs text-ink-faint">
              {new Date(note.createdAt).toLocaleString('mk-MK')}
            </p>
          </li>
        ))}
      </ul>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
        placeholder="Нова белешка…"
        className="w-full rounded-card border border-border px-3 py-2 text-sm"
      />
      <div className="mt-2 flex justify-end">
        <Button
          type="button"
          variant="positive"
          size="sm"
          disabled={body.trim().length < 2 || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Зачувуваме…' : 'Додај белешка'}
        </Button>
      </div>
    </Panel>
  )
}
