import { Outlet, createFileRoute } from '@tanstack/react-router'

/** The products section: list at `/admin/products`, one product at `/admin/products/$productId`. */
export const Route = createFileRoute('/admin/products')({
  component: Outlet,
})
