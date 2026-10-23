import { useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { ChevronDown, LogOut, ShieldCheck, Store, User } from 'lucide-react'

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
  const queryClient = useQueryClient()
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <span className="px-1.5 py-2 text-ink-faint" aria-hidden="true">
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
    queryClient.removeQueries({ queryKey: ['notifications'] })
    await router.invalidate()
  }

  return (
    <DropdownMenu
      align="end"
      trigger={
        <button
          type="button"
          className="flex max-w-[16rem] cursor-pointer items-center gap-1.5 rounded-card px-1.5 py-2 text-ink hover:bg-hover"
        >
          <Avatar src={user.image} alt="" />
          <span className="max-w-[9rem] truncate">{label}</span>
          <ChevronDown aria-hidden="true" className="size-4 text-ink-faint" />
        </button>
      }
    >
      <div className="px-3 py-2">
        <p className="text-[0.7857rem] text-ink-subtle">Најавени како</p>
        <p className="max-w-[14rem] truncate text-sm font-semibold text-ink">{user.email}</p>
      </div>

      <DropdownMenuSeparator />

      <DropdownMenuItem asChild>
        <Link to="/account" className="w-full">
          <User aria-hidden="true" className="size-4 text-ink-faint" />
          Мојата сметка
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild>
        <Link to="/manage" className="w-full">
          <Store aria-hidden="true" className="size-4 text-ink-faint" />
          Менаџирај продавница
        </Link>
      </DropdownMenuItem>

      {user.role === 'admin' ? (
        <DropdownMenuItem asChild>
          <Link to="/admin/stores" className="w-full">
            <ShieldCheck aria-hidden="true" className="size-4 text-ink-faint" />
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
