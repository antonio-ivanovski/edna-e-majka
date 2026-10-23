import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '#/components/ui/dropdown-menu'
import type { StoreSummary } from '#/server/queries/stores'

/** Every active producer, in name order, one click from the header. */
export function ProducersDropdown({ stores }: { stores: StoreSummary[] }) {
  return (
    <DropdownMenu
      trigger={
        <button
          type="button"
          className="flex cursor-pointer items-center gap-1.5 rounded-card px-2 py-2 text-ink hover:bg-hover"
        >
          Производители
          <ChevronDown aria-hidden="true" className="size-4 text-ink-faint" />
        </button>
      }
      className="max-h-[70vh] overflow-y-auto"
    >
      {stores.length === 0 ? (
        <DropdownMenuItem disabled>Сѐ уште нема производители.</DropdownMenuItem>
      ) : (
        stores.map((store) => (
          <DropdownMenuItem key={store.id} asChild>
            <Link
              to="/producers/$storeId"
              params={{ storeId: store.slug ?? store.id }}
              className="w-full"
            >
              {store.name}
            </Link>
          </DropdownMenuItem>
        ))
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to="/producers" className="w-full">
          Сите производители
        </Link>
      </DropdownMenuItem>
    </DropdownMenu>
  )
}
