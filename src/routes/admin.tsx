import { Outlet, createFileRoute, notFound, redirect } from '@tanstack/react-router'

import { AdminNav } from '#/components/admin/admin-nav'
import { fetchViewer } from '#/server/functions/session'

/**
 * The admin dashboard. The guard sits here so every child page inherits it: a
 * signed-out visitor goes to sign in, and a signed-in one who is not an admin
 * gets the same 404 a missing address gives, because the dashboard is not a
 * place to advertise to the people it is not for.
 *
 * The role comes from the account row behind the session cookie; the server
 * functions behind these pages check it again for themselves.
 */
export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const viewer = await fetchViewer()

    if (!viewer) {
      throw redirect({ to: '/sign-in' })
    }

    if (viewer.role !== 'admin') {
      throw notFound()
    }

    return { admin: viewer }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-5">
        <h1 className="font-display text-3xl font-semibold">Администрација</h1>
        <p className="mt-1 text-black/60">Продавници, производи, корисници и пораки.</p>
      </div>

      <AdminNav />

      <div className="pt-6">
        <Outlet />
      </div>
    </div>
  )
}
