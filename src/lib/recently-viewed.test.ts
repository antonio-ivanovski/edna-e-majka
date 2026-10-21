import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearRecentlyViewed,
  readRecentlyViewed,
  recordRecentlyViewed,
  subscribeRecentlyViewed,
} from './recently-viewed'

/** The smallest storage the module needs: a map behind the three methods. */
class MemoryStorage {
  private data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }
}

function installStorage(): MemoryStorage {
  const storage = new MemoryStorage()

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: storage, addEventListener: () => {}, removeEventListener: () => {} },
  })

  return storage
}

describe('recently viewed products', () => {
  beforeEach(() => {
    installStorage()
    clearRecentlyViewed()
  })

  it('keeps the last product first and drops an earlier visit to it', () => {
    recordRecentlyViewed({ id: 'one', title: 'Мед', imageKey: 'a.jpg' })
    recordRecentlyViewed({ id: 'two', title: 'Слад', imageKey: null })
    recordRecentlyViewed({ id: 'one', title: 'Мед', imageKey: 'a.jpg' })

    expect(readRecentlyViewed().map((item) => item.id)).toEqual(['one', 'two'])
  })

  it('tells subscribers when the list changes', () => {
    let calls = 0
    const unsubscribe = subscribeRecentlyViewed(() => {
      calls += 1
    })

    recordRecentlyViewed({ id: 'one', title: 'Мед', imageKey: null })
    unsubscribe()
    recordRecentlyViewed({ id: 'two', title: 'Слад', imageKey: null })

    expect(calls).toBe(1)
  })

  it('empties the list when it is cleared', () => {
    recordRecentlyViewed({ id: 'one', title: 'Мед', imageKey: null })
    clearRecentlyViewed()

    expect(readRecentlyViewed()).toEqual([])
  })
})
