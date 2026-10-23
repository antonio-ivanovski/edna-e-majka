import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { authClient } from '#/lib/auth-client'
import { formatCount, formatRelativeTime } from '#/lib/format'
import { toResult } from '#/lib/server-result'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '#/server/functions/notifications'

type Notification = Awaited<ReturnType<typeof listNotifications>>

const NOTIFICATIONS_PREFIX = ['notifications'] as const

/**
 * The bell: how many are unread, and what they say. Reads and read-alls
 * apply to the list first and sync with the server after, so the count drops
 * the moment it is tapped — even when the tap also leaves the page.
 *
 * The key is viewer-scoped (`['notifications', userId ?? 'anon']`) so a
 * signed-out cache never leaks into another account; sign-out also drops the
 * whole prefix (see `UserMenu.signOut`).
 */
export function NotificationBell() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [, setTick] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const { data: session, isPending } = authClient.useSession()
  const userId = session?.user?.id ?? 'anon'
  const queryKey = [...NOTIFICATIONS_PREFIX, userId] as const

  const { data } = useQuery({
    queryKey,
    queryFn: () => listNotifications(),
    staleTime: 30_000,
    enabled: !isPending,
  })

  const notifications = data ?? []
  const unread = notifications.filter((note) => !note.readAt).length
  const badge = unread > 99 ? '99+' : String(unread)

  // Refresh the relative timestamps ("пред 5 минути") once a minute.
  useEffect(() => {
    const handle = setInterval(() => setTick((tick) => tick + 1), 60_000)
    return () => clearInterval(handle)
  }, [])

  // Close the panel when clicking outside or pressing escape.
  useEffect(() => {
    if (!open) {
      return
    }

    const onPointer = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

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
      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData<Notification>(queryKey)

      queryClient.setQueryData<Notification>(queryKey, (current) => markOneRead(current ?? [], id))

      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
      toast.error('Не успеа означувањето. Обидете се повторно.')
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey }),
  })

  const markAll = useMutation({
    mutationFn: async () => {
      const result = toResult(await markAllNotificationsRead())

      if (result._tag === 'Failure') {
        throw new Error(result.failure.message)
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData<Notification>(queryKey)

      queryClient.setQueryData<Notification>(queryKey, (current) => markAllRead(current ?? []))

      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
      toast.error('Не успеа означувањето. Обидете се повторно.')
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey }),
  })

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unread > 0
            ? `Известувања, ${formatCount(unread, 'непрочитано', 'непрочитани')}`
            : 'Известувања'
        }
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? panelId : undefined}
      >
        <Bell aria-hidden="true" className="size-4" />
        {unread > 0 ? (
          <span className="ml-1 rounded-full bg-danger px-1.5 text-xs text-white">{badge}</span>
        ) : null}
      </Button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          className="absolute top-full right-0 z-50 mt-1 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-border bg-surface-raised shadow-lg"
        >
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
                      <>
                        <span
                          aria-hidden="true"
                          className="mt-1 inline-block size-2 rounded-full bg-accent"
                        />
                        <span className="sr-only">Непрочитано</span>
                      </>
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
