import { Link, createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { ProductRow } from '#/components/manage/product-row'
import { StoreStatusLabel } from '#/components/manage/status-label'
import { Button } from '#/components/ui/button'
import { EmptyState } from '#/components/ui/empty-state'
import { Panel } from '#/components/ui/panel'
import { Table, TableBody, TableHead, TableHeaderCell, TableRow } from '#/components/ui/table'
import { formatCount } from '#/lib/format'
import { MANAGE_PAGE_SIZE } from '#/lib/pagination'
import { toValidator, ProductSearch } from '#/api/schemas'
import { manageQueries } from '#/lib/queries/manage'

export const Route = createFileRoute('/manage/$storeId/products/')({
  validateSearch: toValidator(ProductSearch),
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: async ({ context: { queryClient }, params, deps }) => {
    const data = await queryClient.ensureQueryData(manageQueries.products(params.storeId, deps.page))
    return data
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Производи · ${loaderData.store.name} | ЕДНА Е МАЈКА`
          : 'Производи | ЕДНА Е МАЈКА',
      },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: ManageProductsPage,
})

function ManageProductsPage() {
  const { store, products, total } = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const page = Route.useSearch({ select: (search) => search.page ?? 1 })

  const pageCount = Math.max(1, Math.ceil(total / MANAGE_PAGE_SIZE))

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link to="/manage" className="text-sm font-semibold text-accent-strong hover:underline">
        ← Менаџирај
      </Link>

      <div className="mt-2 mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold">Производи</h1>
            <StoreStatusLabel status={store.status} size="small" />
          </div>
          <p className="mt-1 text-black/60">
            {store.name} · {formatCount(total, 'производ', 'производи')}
          </p>
        </div>

        <Button asChild variant="positive">
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
            description="Додајте го првиот производ, со пакувања, цени и слики. Ќе се појави на страницата на продавницата веднаш штом продавницата е активна."
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
              <TableHeaderCell>Статус</TableHeaderCell>
              <TableHeaderCell>Цена</TableHeaderCell>
              <TableHeaderCell>Додаден</TableHeaderCell>
              <TableHeaderCell className="text-right">Акции</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <ProductRow key={product.id} storeId={store.id} product={product} />
            ))}
          </TableBody>
        </Table>
      )}

      {pageCount > 1 ? (
        <nav
          aria-label="Страници"
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => void navigate({ search: (prev) => ({ ...prev, page: page - 1 }) })}
          >
            Претходна
          </Button>
          <span className="text-black/60">
            Страница {page} од {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => void navigate({ search: (prev) => ({ ...prev, page: page + 1 }) })}
          >
            Следна
          </Button>
        </nav>
      ) : null}

      <div className="mt-8 border-t border-line pt-5">
        <Button asChild variant="outline">
          <Link to="/manage/$storeId" params={{ storeId: store.id }}>
            Податоци за продавницата
          </Link>
        </Button>
      </div>
    </div>
  )
}
