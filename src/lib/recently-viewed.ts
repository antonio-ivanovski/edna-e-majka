/**
 * The products the visitor looked at last, kept in the browser so the home
 * page can offer them again. The list is small and local: nothing is sent to
 * the server.
 */
const STORAGE_KEY = 'edna-recently-viewed'
const MAX_ITEMS = 8

export type RecentProduct = {
  id: string
  title: string
  imageKey: string | null
}

const EMPTY: RecentProduct[] = []

/** Listeners told when the list changed, in this tab or another one. */
const listeners = new Set<() => void>()

/** `undefined` means the list has not been read yet. */
let cachedRaw: string | null | undefined = undefined
let cached: RecentProduct[] = EMPTY

function parse(raw: string | null): RecentProduct[] {
  if (!raw) {
    return EMPTY
  }

  try {
    const parsed = JSON.parse(raw) as unknown

    if (!Array.isArray(parsed)) {
      return EMPTY
    }

    return parsed.filter(
      (entry): entry is RecentProduct =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as RecentProduct).id === 'string' &&
        typeof (entry as RecentProduct).title === 'string',
    )
  } catch {
    return EMPTY
  }
}

/**
 * The stored list. The value is cached so that reading it twice in a row
 * returns the same array: callers compare it by identity.
 */
export function readRecentlyViewed(): RecentProduct[] {
  if (typeof window === 'undefined') {
    return EMPTY
  }

  let raw: string | null

  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return EMPTY
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw
    cached = parse(raw)
  }

  return cached
}

/** Puts a product at the front of the list, dropping an earlier visit to it. */
export function recordRecentlyViewed(item: RecentProduct): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const next = [item, ...readRecentlyViewed().filter((entry) => entry.id !== item.id)].slice(
      0,
      MAX_ITEMS,
    )

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage can be full or blocked; the list is a convenience, not a feature.
    return
  }

  notify()
}

export function clearRecentlyViewed(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    return
  }

  notify()
}

/** Subscribes to changes of the list, in this tab and in other ones. */
export function subscribeRecentlyViewed(listener: () => void): () => void {
  listeners.add(listener)

  const onStorage = () => notify()

  window.addEventListener('storage', onStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function notify(): void {
  cachedRaw = undefined

  for (const listener of listeners) {
    listener()
  }
}
