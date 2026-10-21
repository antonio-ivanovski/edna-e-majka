const STORAGE_KEY = 'edna-recently-viewed'
const MAX_ITEMS = 8

export type RecentProduct = {
  id: string
  title: string
  imageKey: string | null
}

export function recordRecentlyViewed(item: RecentProduct): void {
  if (typeof window === 'undefined') return
  try {
    const current = readRecentlyViewed().filter((entry) => entry.id !== item.id)
    const next = [item, ...current].slice(0, MAX_ITEMS)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage failures (private mode, quota).
  }
}

export function readRecentlyViewed(): RecentProduct[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is RecentProduct =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as RecentProduct).id === 'string' &&
        typeof (entry as RecentProduct).title === 'string',
    )
  } catch {
    return []
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore.
  }
}