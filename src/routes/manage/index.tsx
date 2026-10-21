import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Plus } from 'lucide-react'

import { StoreStatusLabel } from '#/components/manage/status-label'
import { Button } from '#/components/ui/button'
import { EmptyState } from '#/components/ui/empty-state'
import { Message } from '#/components/ui/message'
import { Panel } from '#/components/ui/panel'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '#/components/ui/table'
import { formatCount, formatDate } from '#/lib/format'
import { imageUrl } from '#/lib/images'
import { getManageHome } from '#/server/functions/manage'
import { requireViewer } from '#/server/functions/session'
import type { OwnerProduct, OwnerStore } from '#/server/queries/manage'

export const Route = createFileRoute('/manage/')({
  beforeLoad: () => requireViewer(),
  loader: () => getManageHome(),
  head: () => ({
    meta: [{ title: 'Менаџирај | ЕДНА Е МАЈКА' }, { name: 'robots', content: 'noindex' }],
  }),
  component: ManageHome,
})

function ManageHome() {
  const { store, products } = Route.useLoaderData()

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold">Менаџирај</h1>
        <p className="mt-1 text-black/60">Вашата продавница и производите во неа.</p>
      </div>

      {store ? <StoreOverview store={store} products={products} /> : <NoStore />}
    </div>
  )
}

function NoStore() {
  return (
    <Panel className="px-6 py-12 text-center">
      <h2 className="font-display text-2xl font-semibold">Сѐ уште немате продавница</h2>
      <p className="mx-auto mt-2 max-w-lg text-black/60">
        Регистрирајте ја вашата продавница, додајте ги производите и добијте своја страница на која
        посетителите можат да ве најдат и да ве контактираат.
      </p>
      <Button asChild variant="positive" size="lg" className="mt-6">
        <Link to="/manage/new">
          <Plus className="size-4" />
          Регистрирај продавница
        </Link>
      </Button>
    </Panel>
  )
}

const STATUS_MESSAGES: Record<
  Exclude<OwnerStore['status'], 'active'>,
  { variant: 'info' | 'error'; title: string }
> = {
  pending: {
    variant: 'info',
    title: 'Продавницата чека преглед',
  },
  suspended: {
    variant: 'error',
    title: 'Продавницата е суспендирана',
  },
  archived: {
    variant: 'error',
    title: 'Продавницата е архивирана',
  },
}

const STATUS_FALLBACK: Record<Exclude<OwnerStore['status'], 'active'>, string> = {
  pending:
    'Ќе се појави меѓу производителите откако ќе биде одобрена. Производите можете да ги додавате веќе сега.',
  suspended: 'Јавната страница не е видлива. Контактирајте нѐ ако мислите дека е грешка.',
  archived: 'Јавната страница не е видлива. Контактирајте нѐ ако сакате да ја вратиме.',
}

function StoreOverview({ store, products }: { store: OwnerStore; products: OwnerProduct[] }) {
  const published = products.filter((product) => product.status === 'published')
  const avatar = imageUrl(store.avatarKey)
  const status = store.status

  return (
    <div className="space-y-6">
      {status === 'active' ? null : (
        <Message variant={STATUS_MESSAGES[status].variant} title={STATUS_MESSAGES[status].title}>
          <p>{store.statusNote ?? STATUS_FALLBACK[status]}</p>
        </Message>
      )}

      <Panel className="flex flex-wrap items-start gap-4">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            width={64}
            height={64}
            className="size-16 rounded-full object-cover"
          />
        ) : (
          <span aria-hidden="true" className="size-16 rounded-full bg-black/[0.05]" />
        )}

        <div className="min-w-[14rem] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-semibold">{store.name}</h2>
            <StoreStatusLabel status={store.status} size="small" />
          </div>
          <p className="mt-1 line-clamp-2 text-black/60">{store.description}</p>
          <p className="mt-2 text-sm text-black/45">
            {store.email} · {store.phone}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/manage/$storeId" params={{ storeId: store.id }}>
              Уреди податоци
            </Link>
          </Button>
          <Button asChild variant="positive">
            <Link to="/manage/$storeId/products" params={{ storeId: store.id }}>
              Производи
            </Link>
          </Button>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Производи" value={formatCount(products.length, 'производ', 'производи')} />
        <Stat label="Објавени" value={formatCount(published.length, 'производ', 'производи')} />
        <Stat label="Регистрирана" value={formatDate(store.createdAt)} />
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">Последни производи</h2>
          <Button asChild variant="accent" size="sm">
            <Link to="/manage/$storeId/products/new" params={{ storeId: store.id }}>
              <Plus className="size-4" />
              Нов производ
            </Link>
          </Button>
        </div>

        {products.length === 0 ? (
          <Panel>
            <EmptyState
              title="Сѐ уште нема производи"
              description="Додајте го првиот производ, со пакувања, цени и слики."
              action={
                <Button asChild variant="positive">
                  <Link to="/manage/$storeId/products/new" params={{ storeId: store.id }}>
                    Додај производ
                  </Link>
                </Button>
              }
            />
          </Panel>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Производ</TableHeaderCell>
                <TableHeaderCell>Додаден</TableHeaderCell>
                <TableHeaderCell className="text-right">Пакувања</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.slice(0, 5).map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Link
                      to="/manage/$storeId/products/$productId"
                      params={{ storeId: store.id, productId: product.id }}
                      className="font-semibold hover:underline"
                    >
                      {product.title}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-black/60">
                    {formatDate(product.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCount(product.variantCount, 'пакување', 'пакувања')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link
          to="/manage/$storeId/products"
          params={{ storeId: store.id }}
          className="inline-flex items-center gap-1 font-semibold text-accent-strong hover:underline"
        >
          Сите производи
          <ArrowRight className="size-4" />
        </Link>
        {store.status === 'active' ? (
          <Link
            to="/producers/$storeId"
            params={{ storeId: store.id }}
            className="inline-flex items-center gap-1 font-semibold text-accent-strong hover:underline"
          >
            Јавна страница
            <ArrowRight className="size-4" />
          </Link>
        ) : null}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Panel className="px-4 py-3">
      <p className="text-[0.7857rem] font-bold tracking-wide text-black/45 uppercase">{label}</p>
      <p className="mt-1 text-lg font-semibold text-black/[0.87]">{value}</p>
    </Panel>
  )
}
