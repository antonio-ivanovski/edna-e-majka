/* eslint-disable @typescript-eslint/no-explicit-any */
import { queryOptions } from '@tanstack/react-query'

import {
  getAdminStores,
  getAdminProducts,
  getAdminUsers,
  getAdminMessages,
  getAdminAuditLogs,
  getAdminStore,
  getAdminProduct,
} from '#/server/functions/admin'

import { adminKeys } from './keys'
export { adminKeys }

export const adminQueries = {
  stores: (filters: any) =>
    queryOptions({
      queryKey: adminKeys.stores(filters),
      queryFn: () => getAdminStores({ data: filters }),
      staleTime: 0,
    }),
  store: (id: string) =>
    queryOptions({
      queryKey: adminKeys.store(id),
      queryFn: () => getAdminStore({ data: { storeId: id } }),
      staleTime: 0,
    }),
  products: (filters: any) =>
    queryOptions({
      queryKey: adminKeys.products(filters),
      queryFn: () => getAdminProducts({ data: filters }),
      staleTime: 0,
    }),
  product: (id: string) =>
    queryOptions({
      queryKey: adminKeys.product(id),
      queryFn: () => getAdminProduct({ data: { productId: id } }),
      staleTime: 0,
    }),
  users: (filters: any) =>
    queryOptions({
      queryKey: adminKeys.users(filters),
      queryFn: () => getAdminUsers({ data: filters }),
      staleTime: 0,
    }),
  messages: (filters: any) =>
    queryOptions({
      queryKey: adminKeys.messages(filters),
      queryFn: () => getAdminMessages({ data: filters }),
      staleTime: 0,
    }),
  audit: (filters: any) =>
    queryOptions({
      queryKey: adminKeys.audit(filters),
      queryFn: () => getAdminAuditLogs({ data: filters }),
      staleTime: 0,
    }),
}
