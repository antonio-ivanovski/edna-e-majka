import { Link, createFileRoute } from '@tanstack/react-router'

import { DeleteStoreButton } from '#/components/manage/delete-store-button'
import { StoreStatusLabel } from '#/components/manage/status-label'
import { StoreAvatarField, StoreCoverField, StoreForm } from '#/components/manage/store-form'
import { Button } from '#/components/ui/button'
import { manageQueries } from '#/lib/queries/manage'

export const Route = createFileRoute('/manage/$storeId/')({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(manageQueries.store(params.storeId)),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.store.name} | Менаџирај` : 'Менаџирај | ЕДНА Е МАЈКА',
      },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: EditStorePage,
})

function EditStorePage() {
  const { store } = Route.useLoaderData()

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link to="/manage" className="text-sm font-semibold text-accent-strong hover:underline">
        ← Менаџирај
      </Link>

      <div className="mt-2 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-semibold">{store.name}</h1>
        <StoreStatusLabel status={store.status} size="small" />
      </div>

      <StoreAvatarField store={store} />
      <StoreCoverField store={store} />

      <StoreForm store={store} />

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-border pt-5">
        <Button asChild variant="outline">
          <Link to="/manage/$storeId/products" params={{ storeId: store.id }}>
            Производи на продавницата
          </Link>
        </Button>

        <DeleteStoreButton storeId={store.id} storeName={store.name} />
      </div>
    </div>
  )
}
