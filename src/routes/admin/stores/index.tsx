import { Link, createFileRoute } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'

import { AdminPager } from '#/components/admin/admin-pager'
import { AdminFilters, AdminSearch } from '#/components/admin/list-toolbar'
import { StoreQuickAction } from '#/components/admin/store-quick-action'
import { StoreStatusLabel } from '#/components/manage/status-label'
import { Avatar } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
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
import { toValidator, AdminStoreSearch } from '#/api/schemas'
import { formatCount, formatDate } from '#/lib/format'
import { imageUrl } from '#/lib/images'
import { ADMIN_PAGE_SIZE } from '#/lib/pagination'
import { getAdminStores } from '#/server/functions/admin'
import type { StoreStatus } from '#/server/queries/manage'

const STATUS_FILTERS: { value?: StoreStatus; label: string }[] = [
  { label: 'Сите' },
  { value: 'pending', label: 'Чекаат' },
  { value: 'active', label: 'Активни' },
  { value: 'suspended', label: 'Суспендирани' },
  { value: 'archived', label: 'Архивирани' },
]

export const Route = createFileRoute('/admin/stores/')({
  validateSearch: toValidator(AdminStoreSearch),
  loaderDeps: ({ search }) => ({
    status: search.status,
    query: search.q,
    page: search.page ?? 1,
  }),
  loader: ({ deps }) => getAdminStores({ data: deps }),
  head: () => ({
    meta: [
      { title: 'Продавници · Администрација | ЕДНА Е МАЈКА' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: AdminStoresPage,
})

function AdminStoresPage() {
  const { items, total } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <AdminFilters
          label="Статус на продавницата"
          options={STATUS_FILTERS}
          current={search.status}
          onChange={(status) =>
            void navigate({ search: (prev) => ({ ...prev, status, page: undefined }) })
          }
        />

        <AdminSearch
          value={search.q}
          placeholder="Име, е-маил или опис…"
          onSubmit={(q) =>
            void navigate({ search: (prev) => ({ ...prev, q: q || undefined, page: undefined }) })
          }
        />
      </div>

      <p className="mb-3 text-sm text-black/50">
        {formatCount(total, 'продавница', 'продавници')}
        {search.q ? ` · пребарување „${search.q}“` : ''}
      </p>

      {items.length === 0 ? (
        <Panel>
          <EmptyState
            title="Нема продавници"
            description={
              search.q || search.status
                ? 'Ниедна продавница не одговара на филтрите.'
                : 'Сѐ уште нема регистрирано продавници.'
            }
          />
        </Panel>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Продавница</TableHeaderCell>
              <TableHeaderCell>Статус</TableHeaderCell>
              <TableHeaderCell>Производи</TableHeaderCell>
              <TableHeaderCell>Регистрирана</TableHeaderCell>
              <TableHeaderCell className="text-right">Акции</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((store) => (
              <TableRow key={store.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar src={imageUrl(store.avatarKey)} alt="" size={36} />
                    <span>
                      <span className="font-semibold text-black/[0.87]">{store.name}</span>
                      <span className="block text-sm text-black/50">{store.owner.email}</span>
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <StoreStatusLabel status={store.status} size="small" />
                </TableCell>

                <TableCell className="whitespace-nowrap text-black/70">
                  {productCountLabel(store.productCount, store.publishedCount)}
                </TableCell>

                <TableCell className="whitespace-nowrap text-black/60">
                  {formatDate(store.createdAt)}
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <StoreQuickAction store={store} />

                    <Button asChild variant="outline" size="sm">
                      <Link to="/admin/stores/$storeId" params={{ storeId: store.id }}>
                        Отвори
                        <ExternalLink aria-hidden="true" className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
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

function productCountLabel(total: number, published: number): string {
  if (total === 0) {
    return '—'
  }

  return `${total} (${published} објавени)`
}
