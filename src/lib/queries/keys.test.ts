import { describe, expect, it } from 'vitest'

import { productKeys, storeKeys, manageKeys, adminKeys } from './keys'

describe('query key factories', () => {
  it('product keys are hierarchical and stable', () => {
    const a = productKeys.detail('p1')
    const b = productKeys.detail('p1')
    expect(a).toEqual(b)
    expect(productKeys.all).toEqual(['products'])
    expect(productKeys.detail('p1')).toContain('p1')
  })

  it('store keys differ by id', () => {
    expect(storeKeys.detail('a')).not.toEqual(storeKeys.detail('b'))
  })

  it('manage keys include the store id and page', () => {
    expect(manageKeys.store('s1')).toContain('s1')
    expect(manageKeys.products('s1', 2)).toContain(2)
  })

  it('admin keys include filters', () => {
    const f = { page: 1 }
    expect(adminKeys.stores(f)).toContain(f)
  })
})
