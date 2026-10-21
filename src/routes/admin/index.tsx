import { createFileRoute, redirect } from '@tanstack/react-router'

/** `/admin` itself is not a page: the shops are what a moderator opens first. */
export const Route = createFileRoute('/admin/')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/stores' })
  },
})
