import { Link, createFileRoute } from '@tanstack/react-router'

import { AdminDeleteStoreButton } from '#/components/admin/delete-store-button'
import { AdminProductRow } from '#/components/admin/product-row'
import { AdminStoreForm } from '#/components/admin/store-form'
import { StoreStatusForm } from '#/components/admin/store-status-form'
import { TransferOwnerForm } from '#/components/admin/transfer-owner-form'
import { ModerationNotes } from '#/components/admin/moderation-notes'
import { StoreStatusLabel } from '#/components/manage/status-label'
import { StoreAvatarField } from '#/components/manage/store-form'
import { Avatar } from '#/components/ui/avatar'
import { EmptyState } from '#/components/ui/empty-state'
import { Panel } from '#/components/ui/panel'
import { Table, TableBody, TableHead, TableHeaderCell, TableRow } from '#/components/ui/table'
import { formatCount, formatDate } from '#/lib/format'
import { imageUrl } from '#/lib/images'
import { getAdminStore } from '#/server/functions/admin'

export const Route = createFileRoute('/admin/stores/$storeId')({
  loader: ({ params }) => getAdminStore({ data: { storeId: params.storeId } }),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.store.name} · Администрација | ЕДНА Е МАЈКА`
          : 'Администрација | ЕДНА Е МАЈКА',
      },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: AdminStorePage,
})

function AdminStorePage() {
  const { store, products } = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <Link to="/admin/stores" className="text-sm font-semibold text-accent-ink hover:underline">
        ← Продавници
      </Link>

      <Panel className="flex flex-wrap items-start gap-4">
        <Avatar src={imageUrl(store.avatarKey)} alt="" size={64} />

        <div className="min-w-[16rem] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-semibold">{store.name}</h2>
            <StoreStatusLabel status={store.status} size="small" />
          </div>

          <p className="mt-1 text-sm text-ink-muted">
            Сопственик: {store.owner.name || '—'} · {store.owner.email}
          </p>
          <p className="mt-1 text-sm text-ink-subtle">
            Регистрирана {formatDate(store.createdAt)} ·{' '}
            {formatCount(store.productCount, 'производ', 'производи')} ({store.publishedCount}{' '}
            објавени)
          </p>

          {store.statusNote ? (
            <p className="mt-2 text-sm text-ink-muted">Забелешка: {store.statusNote}</p>
          ) : null}
        </div>

        {store.status === 'active' ? (
          <Link
            to="/producers/$storeId"
            params={{ storeId: store.slug ?? store.id }}
            className="text-sm font-semibold text-accent-ink hover:underline"
          >
            Јавна страница
          </Link>
        ) : null}
      </Panel>

      <StoreStatusForm store={store} />

      <Panel>
        <h2 className="mb-4 font-display text-xl font-semibold">Податоци за продавницата</h2>
        <StoreAvatarField store={store} />
        <AdminStoreForm store={store} />
      </Panel>

      <TransferOwnerForm store={store} />

      <ModerationNotes storeId={store.id} />

      <div className="border-t border-border pt-5">
        <AdminDeleteStoreButton storeId={store.id} storeName={store.name} />
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">Производи</h2>

        {products.items.length === 0 ? (
          <Panel>
            <EmptyState
              title="Нема производи"
              description="Оваа продавница сѐ уште нема производи."
            />
          </Panel>
        ) : (
          <Table label={`Производи на ${store.name}`}>
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
              {products.items.map((product) => (
                <AdminProductRow key={product.id} product={product} />
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}
