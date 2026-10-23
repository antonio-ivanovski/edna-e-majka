import { createFileRoute } from '@tanstack/react-router'

import { Pager } from '#/components/ui/pager'
import { EmptyState } from '#/components/ui/empty-state'
import { Panel } from '#/components/ui/panel'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '#/components/ui/table'
import { toValidator, AdminAuditSearch } from '#/api/schemas'
import { formatCount } from '#/lib/format'
import { ADMIN_PAGE_SIZE } from '#/lib/pagination'
import { adminQueries } from '#/lib/queries/admin'

const ACTION_LABELS: Record<string, string> = {
  set_store_status: 'Промена на статус на продавница',
  bulk_set_store_status: 'Групна промена на статус на продавници',
  update_store: 'Измена на податоци за продавница',
  delete_store: 'Бришење на продавница',
  transfer_store: 'Пренесување на продавница',
  toggle_featured: 'Издвојување на производ',
  archive_product: 'Архивирање на производ',
  publish_product: 'Објавување на производ',
  delete_product: 'Бришење на производ',
  save_product: 'Измена на производ',
  ban_user: 'Бан на корисник',
  unban_user: 'Отстранување на бан',
  set_user_role: 'Промена на улога',
  set_message_handled: 'Обележување на порака',
  delete_message: 'Бришење на порака',
  add_moderation_note: 'Интерна белешка',
}

const TARGET_LABELS: Record<string, string> = {
  store: 'Продавница',
  product: 'Производ',
  user: 'Корисник',
  message: 'Порака',
}

const ACTOR_LABELS: Record<string, string> = {
  admin: 'Администратор',
  owner: 'Сопственик',
  system: 'Систем',
}

function formatDateTime(value: Date): string {
  return new Date(value).toLocaleString('mk-MK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const Route = createFileRoute('/admin/audit')({
  validateSearch: toValidator(AdminAuditSearch),
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureQueryData(adminQueries.audit(deps)),
  head: () => ({
    meta: [
      { title: 'Евиденција · Администрација | ЕДНА Е МАЈКА' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: AdminAuditPage,
})

function AdminAuditPage() {
  const { items, total } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <div>
      <h2 className="mb-3 font-display text-2xl font-semibold">Евиденција</h2>
      <p className="mb-3 text-sm text-ink-subtle">{formatCount(total, 'запис', 'записи')}</p>

      {items.length === 0 ? (
        <Panel>
          <EmptyState title="Нема записи" description="Сѐ уште нема евидентирани акции." />
        </Panel>
      ) : (
        <Table label="Евиденција на акции">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Кој</TableHeaderCell>
              <TableHeaderCell>Што</TableHeaderCell>
              <TableHeaderCell>Кон</TableHeaderCell>
              <TableHeaderCell>Кога</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  {entry.actorName || entry.actorId}
                  <span className="block text-sm text-ink-subtle">
                    {ACTOR_LABELS[entry.actorKind] ?? entry.actorKind}
                  </span>
                </TableCell>
                <TableCell>
                  {ACTION_LABELS[entry.action] ?? entry.action}
                  {entry.details ? (
                    <span className="block text-sm text-ink-subtle">{entry.details}</span>
                  ) : null}
                </TableCell>
                <TableCell className="whitespace-nowrap text-ink-muted">
                  {TARGET_LABELS[entry.targetType] ?? entry.targetType} · {entry.targetId}
                </TableCell>
                <TableCell className="whitespace-nowrap text-ink-muted">
                  {formatDateTime(entry.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pager
        page={search.page ?? 1}
        pageCount={Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))}
        onPageChange={(page) => void navigate({ search: (prev) => ({ ...prev, page }) })}
      />
    </div>
  )
}
