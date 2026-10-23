import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

import { cn } from '#/lib/utils'
import { requireViewer } from '#/server/functions/session'

const TABS: {
  to: '/account' | '/account/favourites' | '/account/following'
  label: string
  exact?: boolean
}[] = [
  { to: '/account', label: 'Сметка', exact: true },
  { to: '/account/favourites', label: 'Омилени производи' },
  { to: '/account/following', label: 'Продавници што ги следам' },
]

/**
 * The account area: the settings, the saved products and the followed shops
 * share one roof and one tab row, so each is one tap away from the others.
 */
export const Route = createFileRoute('/account')({
  beforeLoad: () => requireViewer(),
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
  }),
  component: AccountLayout,
})

function AccountLayout() {
  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 py-6">
      <nav aria-label="Сметка" className="mb-2 flex flex-wrap gap-1 border-b border-border pb-3">
        {TABS.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            {...(tab.exact ? { activeOptions: { exact: true as const } } : {})}
            activeProps={{ className: 'bg-border text-ink', 'aria-current': 'page' }}
            className={cn(
              'rounded-card px-3 py-1.5 text-sm font-semibold text-ink-muted transition-colors',
              'hover:bg-hover hover:text-ink',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
