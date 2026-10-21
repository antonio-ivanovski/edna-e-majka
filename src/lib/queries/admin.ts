import { queryOptions } from '@tanstack/react-query'

import { getAdminStores, getAdminProducts, getAdminUsers, getAdminMessages, getAdminStore, getAdminProduct } from '#/server/functions/admin'

export const adminKeys = {
  all: ['admin'] as const,
  stores: (filters: any) => [...adminKeys.all, 'stores', filters] as const,
  store: (id: string) => [...adminKeys.all, 'store', id] as const,
  products: (filters: any) => [...adminKeys.all, 'products', filters] as const,
  product: (id: string) => [...adminKeys.all, 'product', id] as const,
  users: (filters: any) => [...adminKeys.all, 'users', filters] as const,
  messages: (filters: any) => [...adminKeys.all, 'messages', filters] as const,
}

export const adminQueries = {
  stores: (filters: any) => queryOptions({ queryKey: adminKeys.stores(filters), queryFn: () => getAdminStores({ data: filters }), staleTime: 0 }),
  store: (id: string) => queryOptions({ queryKey: adminKeys.store(id), queryFn: () => getAdminStore({ data: { storeId: id } }), staleTime: 0 }),
  products: (filters: any) => queryOptions({ queryKey: adminKeys.products(filters), queryFn: () => getAdminProducts({ data: filters }), staleTime: 0 }),
  product: (id: string) => queryOptions({ queryKey: adminKeys.product(id), queryFn: () => getAdminProduct({ data: { productId: id } }), staleTime: 0 }),
  users: (filters: any) => queryOptions({ queryKey: adminKeys.users(filters), queryFn: () => getAdminUsers({ data: filters }), staleTime: 0 }),
  messages: (filters: any) => queryOptions({ queryKey: adminKeys.messages(filters), queryFn: () => getAdminMessages({ data: filters }), staleTime: 0 }),
}
