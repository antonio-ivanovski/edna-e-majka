import { Outlet, createFileRoute } from '@tanstack/react-router'

/**
 * The shops section. Like `/manage/$storeId`, this level is only an outlet so
 * the list lives at `/admin/stores` and one shop at `/admin/stores/$storeId`.
 */
export const Route = createFileRoute('/admin/stores')({
  component: Outlet,
})
