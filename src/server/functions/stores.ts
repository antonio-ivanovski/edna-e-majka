import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { storeIdSchema } from '#/lib/schemas'

import { selectStoreDetail, selectStores } from '../queries/stores'

export const listStores = createServerFn({ method: 'GET' }).handler(async () => selectStores())

export const getStore = createServerFn({ method: 'GET' })
  .validator(storeIdSchema)
  .handler(async ({ data }) => {
    const detail = await selectStoreDetail(data.storeId)

    if (!detail) {
      throw notFound()
    }

    return detail
  })
