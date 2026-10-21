import { queryOptions } from '@tanstack/react-query'

import { listStores, getStore } from '#/server/functions/stores'

import { storeKeys } from './keys'
export { storeKeys }

export const storeQueries = {
  list: () =>
    queryOptions({
      queryKey: storeKeys.lists(),
      queryFn: () => listStores(),
      staleTime: 5 * 60 * 1000,
    }),
  detail: (storeId: string) =>
    queryOptions({
      queryKey: storeKeys.detail(storeId),
      queryFn: () => getStore({ data: { storeId } }),
      staleTime: 5 * 60 * 1000,
    }),
}
