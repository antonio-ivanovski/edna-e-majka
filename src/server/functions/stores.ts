import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { toValidator, StoreId } from '#/api/schemas'
import { runEffect } from '../runtime'
import { selectStoreDetail, selectStores } from '../queries/stores'

export const listStores = createServerFn({ method: 'GET' }).handler(async () => runEffect(selectStores()))

export const getStore = createServerFn({ method: 'GET' })
  .validator(toValidator(StoreId))
  .handler(async ({ data }) => {
    const detail = await runEffect(selectStoreDetail(data.storeId))

    if (!detail) {
      throw notFound()
    }

    return detail
  })