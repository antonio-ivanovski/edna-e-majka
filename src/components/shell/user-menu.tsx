import { useRouter } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'

import { Avatar } from '#/components/ui/avatar'
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

  return (
    <div className="flex items-center gap-1.5 px-1.5 py-2">
      <Avatar src={user.image} alt={user.name || user.email} />
      <span className="max-w-[12rem] truncate">{user.name || user.email}</span>
      <button
        type="button"
        title="Одјави се"
        aria-label="Одјави се"
        className="cursor-pointer rounded-[0.2857rem] p-1 text-black/40 hover:bg-black/[0.04] hover:text-black/70"
        onClick={async () => {
          await authClient.signOut()
          await router.invalidate()
        }}
      >
        <LogOut className="size-4" />
      </button>
    </div>
  )
}
