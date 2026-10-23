import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useState } from 'react'

import { Button } from '#/components/ui/button'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '#/server/functions/notifications'

export function NotificationBell() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => listNotifications(),
  })

  const notifications = data ?? []
  const unread = notifications.filter((n) => !n.readAt).length

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead({ data: { id } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-label="Известувања"
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="ml-1 rounded-full bg-danger px-1.5 text-xs text-white">{unread}</span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute top-full right-0 z-50 mt-1 w-80 overflow-hidden rounded-card border border-border bg-surface-raised shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-semibold">Известувања</span>
            {unread > 0 ? (
              <button
                type="button"
                className="text-xs text-accent-strong hover:underline"
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
                        window.location.href = note.link
                      }
                    }}
                  >
                    <span className="block text-sm font-semibold">{note.title}</span>
                    {note.body ? (
                      <span className="block text-xs text-ink-muted">{note.body}</span>
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
