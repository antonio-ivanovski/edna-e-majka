import { Link } from '@tanstack/react-router'

import type { StoreSummary } from '#/server/queries/stores'

import { ProducersDropdown } from './producers-dropdown'
import { SearchForm } from './search-form'
import { UserMenu } from './user-menu'
import { ThemeToggle } from './theme-toggle'
import { NotificationBell } from './notification-bell'

export function SiteHeader({
  stores,
  googleEnabled,
}: {
  stores: StoreSummary[]
  googleEnabled: boolean
}) {
  return (
    <header className="flex flex-wrap items-center justify-evenly gap-y-1 p-2.5">
      <Link to="/" aria-label="Една е Мајка — почетна" className="mr-1 shrink-0">
        <img src="/logo.png" alt="Една е Мајка" className="w-[175px] max-w-full" />
      </Link>
      <ProducersDropdown stores={stores} />
      <SearchForm />
      <NotificationBell />
      <ThemeToggle />
      <UserMenu googleEnabled={googleEnabled} />
    </header>
  )
}
