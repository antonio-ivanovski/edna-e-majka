import type { ProductListFilters } from '#/api/schemas'

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductListFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  related: (id: string) => [...productKeys.details(), id, 'related'] as const,
  featured: () => [...productKeys.all, 'featured'] as const,
}

export const storeKeys = {
  all: ['stores'] as const,
  lists: () => [...storeKeys.all, 'list'] as const,
  details: () => [...storeKeys.all, 'detail'] as const,
  detail: (id: string) => [...storeKeys.details(), id] as const,
}

export const manageKeys = {
  all: ['manage'] as const,
  home: () => [...manageKeys.all, 'home'] as const,
  store: (storeId: string) => [...manageKeys.all, 'store', storeId] as const,
  products: (storeId: string, page: number) =>
    [...manageKeys.all, 'products', storeId, page] as const,
  product: (storeId: string, productId: string) =>
    [...manageKeys.all, 'product', storeId, productId] as const,
}

export const adminKeys = {
  all: ['admin'] as const,
  stores: (filters: unknown) => [...adminKeys.all, 'stores', filters] as const,
  store: (id: string) => [...adminKeys.all, 'store', id] as const,
  products: (filters: unknown) => [...adminKeys.all, 'products', filters] as const,
  product: (id: string) => [...adminKeys.all, 'product', id] as const,
  users: (filters: unknown) => [...adminKeys.all, 'users', filters] as const,
  messages: (filters: unknown) => [...adminKeys.all, 'messages', filters] as const,
}
