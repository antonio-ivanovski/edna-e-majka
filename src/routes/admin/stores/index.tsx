import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

import { Pager } from '#/components/ui/pager'
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
import { adminQueries } from '#/lib/queries/admin'
import { adminBulkSetStoreStatus } from '#/server/functions/admin'
import { toResult } from '#/lib/server-result'
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
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureQueryData(adminQueries.stores(deps)),
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
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<'active' | 'suspended' | 'archived'>('active')
  const [busy, setBusy] = useState(false)

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const applyBulk = async () => {
    if (selected.size === 0) {
      return
    }

    setBusy(true)

    const result = toResult(
      await adminBulkSetStoreStatus({
        data: { storeIds: [...selected], status: bulkStatus },
      }),
    )

    setBusy(false)

    if (result._tag === 'Failure') {
      toast.error(result.failure.message)
      return
    }

    setSelected(new Set())
    await router.invalidate()
  }

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

      <p className="mb-3 text-sm text-ink-subtle">
        {formatCount(total, 'продавница', 'продавници')}
        {search.q ? ` · пребарување „${search.q}“` : ''}
      </p>

      {selected.size > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface-raised p-3">
          <span className="text-sm font-semibold">{selected.size} избрани</span>
          <select
            value={bulkStatus}
            onChange={(event) =>
              setBulkStatus(event.target.value as 'active' | 'suspended' | 'archived')
            }
            className="h-9 rounded-card border border-border px-2 text-sm"
          >
            <option value="active">Активни</option>
            <option value="suspended">Суспендирани</option>
            <option value="archived">Архивирани</option>
          </select>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() => void applyBulk()}
          >
            {busy ? 'Применуваме…' : 'Примени'}
          </Button>
        </div>
      ) : null}

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
        <Table label="Продавници">
          <TableHead>
            <TableRow>
              <TableHeaderCell>
                <input
                  type="checkbox"
                  aria-label="Избери ги сите продавници"
                  checked={items.length > 0 && items.every((store) => selected.has(store.id))}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setSelected(new Set(items.map((store) => store.id)))
                    } else {
                      setSelected(new Set())
                    }
                  }}
                />
              </TableHeaderCell>
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
                  <input
                    type="checkbox"
                    aria-label={`Избери ја продавницата ${store.name}`}
                    checked={selected.has(store.id)}
                    onChange={() => toggle(store.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar src={imageUrl(store.avatarKey)} alt="" size={36} />
                    <span>
                      <span className="font-semibold text-ink">{store.name}</span>
                      <span className="block text-sm text-ink-subtle">{store.owner.email}</span>
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <StoreStatusLabel status={store.status} size="small" />
                </TableCell>

                <TableCell className="whitespace-nowrap text-ink">
                  {productCountLabel(store.productCount, store.publishedCount)}
                </TableCell>

                <TableCell className="whitespace-nowrap text-ink-muted">
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

      <Pager
        page={search.page ?? 1}
        pageCount={Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))}
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
