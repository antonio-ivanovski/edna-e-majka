import { queryOptions } from '@tanstack/react-query'

import { listStores, getStore } from '#/server/functions/stores'

export const storeKeys = {
  all: ['stores'] as const,
  lists: () => [...storeKeys.all, 'list'] as const,
  details: () => [...storeKeys.all, 'detail'] as const,
  detail: (id: string) => [...storeKeys.details(), id] as const,
}

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
