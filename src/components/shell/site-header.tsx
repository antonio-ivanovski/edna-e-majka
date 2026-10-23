import { Link } from '@tanstack/react-router'

import type { StoreSummary } from '#/server/queries/stores'

import { NotificationBell } from './notification-bell'
import { ProducersDropdown } from './producers-dropdown'
import { SearchForm } from './search-form'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'

/**
 * The header, in two rows on a phone and one row on a wide screen: the mark
 * and the account controls stay together, and the search gets a line of its
 * own rather than being squeezed into a few characters.
 */
export function SiteHeader({
  stores,
  googleEnabled,
}: {
  stores: StoreSummary[]
  googleEnabled: boolean
}) {
  return (
    <header className="flex flex-wrap items-center gap-x-2 gap-y-2 px-2.5 py-2.5">
      <Link to="/" aria-label="Една е Мајка — почетна" className="order-1 shrink-0 rounded-card">
        <img src="/logo.png" alt="Една е Мајка" className="w-[124px] sm:w-[150px]" />
      </Link>

      <div className="order-3 flex w-full min-w-0 items-center gap-2 sm:order-2 sm:w-auto sm:flex-1">
        <ProducersDropdown stores={stores} />
        <SearchForm />
      </div>

      <div className="order-2 ml-auto flex items-center gap-0.5 sm:order-3">
        <NotificationBell />
        <ThemeToggle />
        <UserMenu googleEnabled={googleEnabled} />
      </div>
    </header>
  )
}
