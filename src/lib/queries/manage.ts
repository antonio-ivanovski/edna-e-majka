import { queryOptions } from '@tanstack/react-query'

import {
  getManageHome,
  getManageStore,
  getManageProducts,
  getManageProduct,
} from '#/server/functions/manage'

import { manageKeys } from './keys'
export { manageKeys }

export const manageQueries = {
  home: () =>
    queryOptions({ queryKey: manageKeys.home(), queryFn: () => getManageHome(), staleTime: 0 }),
  store: (storeId: string) =>
    queryOptions({
      queryKey: manageKeys.store(storeId),
      queryFn: () => getManageStore({ data: { storeId } }),
      staleTime: 0,
    }),
  products: (storeId: string, page: number) =>
    queryOptions({
      queryKey: manageKeys.products(storeId, page),
      queryFn: () => getManageProducts({ data: { storeId, page: String(page) } }),
      staleTime: 0,
    }),
  product: (storeId: string, productId: string) =>
    queryOptions({
      queryKey: manageKeys.product(storeId, productId),
      queryFn: () => getManageProduct({ data: { storeId, productId } }),
      staleTime: 0,
    }),
}
