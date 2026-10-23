import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { useState } from 'react'

import { Button } from '#/components/ui/button'
import { formatRelativeTime } from '#/lib/format'
import { toResult } from '#/lib/server-result'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '#/server/functions/notifications'

type Notification = Awaited<ReturnType<typeof listNotifications>>

const NOTIFICATIONS_KEY = ['notifications']

/**
 * The bell: how many are unread, and what they say. Reads and read-alls
 * apply to the list first and sync with the server after, so the count drops
 * the moment it is tapped — even when the tap also leaves the page.
 */
export function NotificationBell() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { data } = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => listNotifications(),
  })

  const notifications = data ?? []
  const unread = notifications.filter((note) => !note.readAt).length

  const markOneRead = (notes: Notification, id: string) =>
    notes.map((note) => (note.id === id && !note.readAt ? { ...note, readAt: new Date() } : note))

  const markAllRead = (notes: Notification) =>
    notes.map((note) => (note.readAt ? note : { ...note, readAt: new Date() }))

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const result = toResult(await markNotificationRead({ data: { id } }))

      if (result._tag === 'Failure') {
        throw new Error(result.failure.message)
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY })

      const previous = queryClient.getQueryData<Notification>(NOTIFICATIONS_KEY)

      queryClient.setQueryData<Notification>(NOTIFICATIONS_KEY, (current) =>
        markOneRead(current ?? [], id),
      )

      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_KEY, context.previous)
      }
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })

  const markAll = useMutation({
    mutationFn: async () => {
      const result = toResult(await markAllNotificationsRead())

      if (result._tag === 'Failure') {
        throw new Error(result.failure.message)
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY })

      const previous = queryClient.getQueryData<Notification>(NOTIFICATIONS_KEY)

      queryClient.setQueryData<Notification>(NOTIFICATIONS_KEY, (current) =>
        markAllRead(current ?? []),
      )

      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_KEY, context.previous)
      }
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Известувања, ${unread} непрочитани` : 'Известувања'}
        aria-expanded={open}
      >
        <Bell aria-hidden="true" className="size-4" />
        {unread > 0 ? (
          <span className="ml-1 rounded-full bg-danger px-1.5 text-xs text-white">{unread}</span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute top-full right-0 z-50 mt-1 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-border bg-surface-raised shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-semibold">
              Известувања{unread > 0 ? ` (${unread})` : ''}
            </span>
            {unread > 0 ? (
              <button
                type="button"
                className="text-xs text-accent-ink hover:underline"
                onClick={() => markAll.mutate()}
              >
                Означи сите
              </button>
            ) : null}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-3 py-4 text-sm text-ink-subtle">Нема известувања.</li>
            ) : (
              notifications.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    className="block w-full cursor-pointer px-3 py-2 text-left hover:bg-hover"
                    onClick={() => {
                      if (!note.readAt) {
                        markRead.mutate(note.id)
                      }
                      if (note.link) {
                        setOpen(false)
                        void router.history.push(note.link)
                      }
                    }}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold">{note.title}</span>
                      <time
                        dateTime={new Date(note.createdAt).toISOString()}
                        className="shrink-0 text-xs text-ink-subtle"
                      >
                        {formatRelativeTime(new Date(note.createdAt))}
                      </time>
                    </span>
                    {note.body ? (
                      <span className="mt-0.5 block text-xs text-ink-muted">{note.body}</span>
                    ) : null}
                    {!note.readAt ? (
                      <span
                        className="mt-1 inline-block size-2 rounded-full bg-accent"
                        aria-label="Непрочитано"
                      />
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
