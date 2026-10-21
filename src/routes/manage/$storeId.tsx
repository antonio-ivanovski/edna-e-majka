import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requireViewer } from '#/server/functions/session'

/**
 * Everything under one shop. The guard sits here so every child page inherits
 * it, and the layout itself is only an outlet: `/manage/$storeId` is the shop
 * form, `/manage/$storeId/products` the catalogue.
 */
export const Route = createFileRoute('/manage/$storeId')({
  beforeLoad: () => requireViewer(),
  component: Outlet,
})
