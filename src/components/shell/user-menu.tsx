import { Link, useRouter } from '@tanstack/react-router'
import { ChevronDown, LogOut, ShieldCheck, Store } from 'lucide-react'

import { Avatar } from '#/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '#/components/ui/dropdown-menu'
import { authClient } from '#/lib/auth-client'

import { SignInDialog } from './sign-in-dialog'

/**
 * The session is read in the browser so the cached HTML of public pages is
 * never specific to whoever asked for it.
 */
export function UserMenu({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <span className="px-1.5 py-2 text-black/30" aria-hidden="true">
        ···
      </span>
    )
  }

  if (!session) {
    return <SignInDialog googleEnabled={googleEnabled} />
  }

  const { user } = session
  const label = user.name || user.email

  const signOut = async () => {
    await authClient.signOut()
    await router.invalidate()
  }

  return (
    <DropdownMenu
      align="end"
      trigger={
        <button
          type="button"
          className="flex max-w-[16rem] cursor-pointer items-center gap-1.5 rounded-[0.2857rem] px-1.5 py-2 text-black/[0.87] hover:bg-black/[0.03]"
        >
          <Avatar src={user.image} alt={label} />
          <span className="max-w-[9rem] truncate">{label}</span>
          <ChevronDown aria-hidden="true" className="size-4 text-black/40" />
        </button>
      }
    >
      <div className="px-3 py-2">
        <p className="text-[0.7857rem] text-black/45">Најавени како</p>
        <p className="max-w-[14rem] truncate text-sm font-semibold text-black/[0.87]">
          {user.email}
        </p>
      </div>

      <DropdownMenuSeparator />

      <DropdownMenuItem asChild>
        <Link to="/manage" className="w-full">
          <Store aria-hidden="true" className="size-4 text-black/40" />
          Менаџирај продавница
        </Link>
      </DropdownMenuItem>

      {user.role === 'admin' ? (
        <DropdownMenuItem asChild>
          <Link to="/admin/stores" className="w-full">
            <ShieldCheck aria-hidden="true" className="size-4 text-black/40" />
            Администрација
          </Link>
        </DropdownMenuItem>
      ) : null}

      <DropdownMenuSeparator />

      <DropdownMenuItem icon={<LogOut className="size-4" />} onSelect={() => void signOut()}>
        Одјави се
      </DropdownMenuItem>
    </DropdownMenu>
  )
}
