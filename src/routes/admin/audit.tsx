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
import { formatCount, formatDate } from '#/lib/format'
import { ADMIN_PAGE_SIZE } from '#/lib/pagination'
import { adminQueries } from '#/lib/queries/admin'

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
                <TableCell>{entry.actorName || entry.actorId}</TableCell>
                <TableCell>
                  {entry.action}
                  {entry.details ? (
                    <span className="block text-sm text-ink-subtle">{entry.details}</span>
                  ) : null}
                </TableCell>
                <TableCell className="whitespace-nowrap text-ink-muted">
                  {entry.targetType} · {entry.targetId}
                </TableCell>
                <TableCell className="whitespace-nowrap text-ink-muted">
                  {formatDate(entry.createdAt)}
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
