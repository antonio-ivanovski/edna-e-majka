import { createFileRoute } from '@tanstack/react-router'

import { AdminPager } from '#/components/admin/admin-pager'
import { AdminFilters } from '#/components/admin/list-toolbar'
import { AdminMessageCard } from '#/components/admin/message-card'
import { EmptyState } from '#/components/ui/empty-state'
import { Panel } from '#/components/ui/panel'
import { parseAdminMessageSearch, resolveAdminPage, type MessageFilter } from '#/lib/admin-search'
import { formatCount } from '#/lib/format'
import { ADMIN_PAGE_SIZE } from '#/lib/pagination'
import { getAdminMessages } from '#/server/functions/admin'

const FILTERS: { value: MessageFilter; label: string }[] = [
  { value: 'open', label: 'Непрочитани' },
  { value: 'done', label: 'Прочитани' },
  { value: 'all', label: 'Сите' },
]

export const Route = createFileRoute('/admin/messages')({
  validateSearch: parseAdminMessageSearch,
  loaderDeps: ({ search }) => ({
    filter: search.filter ?? 'open',
    page: resolveAdminPage(search),
  }),
  loader: ({ deps }) => getAdminMessages({ data: deps }),
  head: () => ({
    meta: [
      { title: 'Пораки · Администрација | ЕДНА Е МАЈКА' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: AdminMessagesPage,
})

function AdminMessagesPage() {
  const { items, total } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const filter = search.filter ?? 'open'

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <AdminFilters
          label="Состојба на пораката"
          options={FILTERS}
          current={filter}
          onChange={(value) =>
            void navigate({
              search: (prev) => ({ ...prev, filter: value ?? 'open', page: undefined }),
            })
          }
        />

        <p className="text-sm text-black/50">{formatCount(total, 'порака', 'пораки')}</p>
      </div>

      {items.length === 0 ? (
        <Panel>
          <EmptyState
            title={filter === 'open' ? 'Нема непрочитани пораки' : 'Нема пораки'}
            description="Пораките од формуларот за контакт и за соработка се појавуваат тука."
          />
        </Panel>
      ) : (
        <div className="space-y-3">
          {items.map((message) => (
            <AdminMessageCard key={message.id} message={message} />
          ))}
        </div>
      )}

      <AdminPager
        page={resolveAdminPage(search)}
        total={total}
        pageSize={ADMIN_PAGE_SIZE}
        onPageChange={(page) => void navigate({ search: (prev) => ({ ...prev, page }) })}
      />
    </div>
  )
}
