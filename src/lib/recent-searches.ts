const STORAGE_KEY = 'edna-recent-searches'
const MAX_ITEMS = 6

export function readRecentSearches(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((entry): entry is string => typeof entry === 'string').slice(0, MAX_ITEMS)
  } catch {
    return []
  }
}

export function recordRecentSearch(term: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const trimmed = term.trim()

  if (!trimmed) {
    return
  }

  try {
    const next = [trimmed, ...readRecentSearches().filter((entry) => entry !== trimmed)].slice(
      0,
      MAX_ITEMS,
    )

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage can be full or blocked; the list is a convenience.
  }
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore.
  }
}
