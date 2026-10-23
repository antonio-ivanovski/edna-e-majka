import { createFileRoute } from '@tanstack/react-router'

import { AdminPager } from '#/components/admin/admin-pager'
import { AdminFilters, AdminSearch } from '#/components/admin/list-toolbar'
import { AdminProductRow } from '#/components/admin/product-row'
import { EmptyState } from '#/components/ui/empty-state'
import { Panel } from '#/components/ui/panel'
import { Table, TableBody, TableHead, TableHeaderCell, TableRow } from '#/components/ui/table'
import { toValidator, AdminProductSearch } from '#/api/schemas'
import { formatCount } from '#/lib/format'
import { ADMIN_PAGE_SIZE } from '#/lib/pagination'
import { adminQueries } from '#/lib/queries/admin'
import type { ProductStatus } from '#/server/queries/manage'

const STATUS_FILTERS: { value?: ProductStatus; label: string }[] = [
  { label: 'Сите' },
  { value: 'published', label: 'Објавени' },
  { value: 'archived', label: 'Архивирани' },
]

export const Route = createFileRoute('/admin/products/')({
  validateSearch: toValidator(AdminProductSearch),
  loaderDeps: ({ search }) => ({
    status: search.status,
    query: search.q,
    page: search.page ?? 1,
  }),
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureQueryData(adminQueries.products(deps)),
  head: () => ({
    meta: [
      { title: 'Производи · Администрација | ЕДНА Е МАЈКА' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: AdminProductsPage,
})

function AdminProductsPage() {
  const { items, total } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <AdminFilters
          label="Статус на производот"
          options={STATUS_FILTERS}
          current={search.status}
          onChange={(status) =>
            void navigate({ search: (prev) => ({ ...prev, status, page: undefined }) })
          }
        />

        <AdminSearch
          value={search.q}
          placeholder="Наслов на производ…"
          onSubmit={(q) =>
            void navigate({ search: (prev) => ({ ...prev, q: q || undefined, page: undefined }) })
          }
        />
      </div>

      <p className="mb-3 text-sm text-ink-subtle">
        {formatCount(total, 'производ', 'производи')}
        {search.q ? ` · пребарување „${search.q}“` : ''}
      </p>

      {items.length === 0 ? (
        <Panel>
          <EmptyState
            title="Нема производи"
            description={
              search.q || search.status
                ? 'Ниеден производ не одговара на филтрите.'
                : 'Сѐ уште нема додадено производи.'
            }
          />
        </Panel>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Производ</TableHeaderCell>
              <TableHeaderCell>Продавница</TableHeaderCell>
              <TableHeaderCell>Статус</TableHeaderCell>
              <TableHeaderCell>Цена</TableHeaderCell>
              <TableHeaderCell>Додаден</TableHeaderCell>
              <TableHeaderCell className="text-right">Акции</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((product) => (
              <AdminProductRow key={product.id} product={product} />
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
