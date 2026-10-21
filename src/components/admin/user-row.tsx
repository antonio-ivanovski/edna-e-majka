import { Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { StoreStatusLabel } from '#/components/manage/status-label'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { Label } from '#/components/ui/label'
import { TableCell, TableRow } from '#/components/ui/table'
import { formatCount, formatDate } from '#/lib/format'
import { setUserRole } from '#/server/functions/admin'
import type { AdminUser } from '#/server/queries/admin'

/**
 * One account. Roles are the only thing an admin sets here, and the change is
 * confirmed first: becoming an admin opens every shop, listing and message.
 */
export function AdminUserRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const admin = user.role === 'admin'

  const changeRole = async () => {
    setBusy(true)

    const result = await setUserRole({ data: { userId: user.id, role: admin ? 'user' : 'admin' } })

    setBusy(false)

    if (result._tag === "Failure") {
      toast.error(result.failure.message)
      return false
    }

    await router.invalidate()
    toast.success(admin ? 'Улогата е отстранета.' : 'Корисникот е администратор.')

    return true
  }

  return (
    <TableRow>
      <TableCell>
        <span className="font-semibold text-black/[0.87]">{user.name || '—'}</span>
        <span className="block text-sm text-black/50">
          {user.email}
          {user.emailVerified ? '' : ' · непотврдена адреса'}
        </span>
      </TableCell>

      <TableCell>
        <Label color={admin ? 'accent' : 'grey'} size="small">
          {admin ? 'Администратор' : 'Корисник'}
        </Label>
      </TableCell>

      <TableCell>
        {user.store ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/stores/$storeId"
              params={{ storeId: user.store.id }}
              className="text-black/70 hover:underline"
            >
              {user.store.name}
            </Link>
            <StoreStatusLabel status={user.store.status} size="small" />
            <span className="text-sm text-black/45">
              {formatCount(user.productCount, 'производ', 'производи')}
            </span>
          </div>
        ) : (
          <span className="text-black/40">—</span>
        )}
      </TableCell>

      <TableCell className="whitespace-nowrap text-black/60">
        {formatDate(user.createdAt)}
      </TableCell>

      <TableCell className="text-right">
        {isSelf ? (
          <span className="text-sm text-black/40">Ова сте вие</span>
        ) : (
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm" disabled={busy}>
                {admin ? 'Отстрани администратор' : 'Направи администратор'}
              </Button>
            }
            title={admin ? 'Отстрани администратор' : 'Направи администратор'}
            description={
              admin
                ? `${user.email} повеќе нема да има пристап до администрацијата.`
                : `${user.email} добива пристап до сите продавници, производи и пораки.`
            }
            confirmLabel={admin ? 'Отстрани' : 'Дозволи'}
            onConfirm={changeRole}
          />
        )}
      </TableCell>
    </TableRow>
  )
}
