import { createFileRoute } from '@tanstack/react-router'

import { AdminPager } from '#/components/admin/admin-pager'
import { AdminSearch } from '#/components/admin/list-toolbar'
import { AdminUserRow } from '#/components/admin/user-row'
import { EmptyState } from '#/components/ui/empty-state'
import { Panel } from '#/components/ui/panel'
import { Table, TableBody, TableHead, TableHeaderCell, TableRow } from '#/components/ui/table'
import { toValidator, AdminListSearch } from '#/api/schemas'
import { formatCount } from '#/lib/format'
import { ADMIN_PAGE_SIZE } from '#/lib/pagination'
import { adminQueries } from '#/lib/queries/admin'

export const Route = createFileRoute('/admin/users')({
  validateSearch: toValidator(AdminListSearch),
  loaderDeps: ({ search }) => ({ query: search.q, page: search.page ?? 1 }),
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureQueryData(adminQueries.users(deps)),
  head: () => ({
    meta: [
      { title: 'Корисници · Администрација | ЕДНА Е МАЈКА' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const { items, total } = Route.useLoaderData()
  const { admin } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <AdminSearch
          value={search.q}
          placeholder="Име, е-маил или продавница…"
          onSubmit={(q) =>
            void navigate({ search: (prev) => ({ ...prev, q: q || undefined, page: undefined }) })
          }
        />
      </div>

      <p className="mb-3 text-sm text-black/50">
        {formatCount(total, 'корисник', 'корисници')}
        {search.q ? ` · пребарување „${search.q}“` : ''}
      </p>

      {items.length === 0 ? (
        <Panel>
          <EmptyState
            title="Нема корисници"
            description={
              search.q ? 'Ниеден корисник не одговара на пребарувањето.' : 'Сѐ уште нема сметки.'
            }
          />
        </Panel>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Корисник</TableHeaderCell>
              <TableHeaderCell>Улога</TableHeaderCell>
              <TableHeaderCell>Продавница</TableHeaderCell>
              <TableHeaderCell>Регистриран</TableHeaderCell>
              <TableHeaderCell className="text-right">Акции</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((user) => (
              <AdminUserRow key={user.id} user={user} isSelf={user.id === admin.id} />
            ))}
          </TableBody>
        </Table>
      )}

      <AdminPager
        page={search.page ?? 1}
        total={total}
        pageSize={ADMIN_PAGE_SIZE}
        onPageChange={(page) => void navigate({ search: (prev) => ({ ...prev, page }) })}
      />
    </div>
  )
}
