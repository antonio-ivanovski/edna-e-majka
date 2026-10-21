import { useSyncExternalStore } from 'react'

import {
  readRecentlyViewed,
  subscribeRecentlyViewed,
  type RecentProduct,
} from '#/lib/recently-viewed'

const EMPTY: RecentProduct[] = []

/**
 * The products looked at last. The list lives in the browser, so it is read
 * through an external store rather than an effect.
 */
export function useRecentlyViewed(): RecentProduct[] {
  return useSyncExternalStore(subscribeRecentlyViewed, readRecentlyViewed, () => EMPTY)
}
