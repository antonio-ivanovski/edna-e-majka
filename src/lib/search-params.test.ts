import { describe, expect, it } from 'vitest'

import {
  defaultDirection,
  parseProductSearch,
  parseSearchPage,
  resolveProductSearch,
} from './search-params'

describe('parseProductSearch', () => {
  it('leaves everything unset when the URL is clean', () => {
    expect(parseProductSearch({})).toEqual({
      sort: undefined,
      direction: undefined,
      page: undefined,
    })
  })

  it('reads the parameters it knows', () => {
    expect(parseProductSearch({ sort: 'price', direction: 'asc', page: '2' })).toEqual({
      sort: 'price',
      direction: 'asc',
      page: 2,
    })
  })

  it('falls back to unset instead of throwing on junk', () => {
    expect(parseProductSearch({ sort: 'cheapest', direction: 'sideways', page: '-4' })).toEqual({
      sort: undefined,
      direction: undefined,
      page: undefined,
    })
    expect(parseProductSearch({ page: '0' }).page).toBeUndefined()
    expect(parseProductSearch({ page: '9999' }).page).toBeUndefined()
  })
})

describe('parseSearchPage', () => {
  it('trims the query and caps its length', () => {
    expect(parseSearchPage({ q: '  мед  ' }).q).toBe('мед')
    expect(parseSearchPage({ q: 'а'.repeat(200) }).q).toHaveLength(64)
  })

  it('drops an empty query and keeps the listing parameters', () => {
    expect(parseSearchPage({ q: '   ', page: '3' })).toEqual({
      q: undefined,
      sort: undefined,
      direction: undefined,
      page: 3,
    })
  })
})

describe('resolveProductSearch', () => {
  it('applies the natural direction for each sort', () => {
    expect(defaultDirection('newest')).toBe('desc')
    expect(defaultDirection('alpha')).toBe('asc')
    expect(defaultDirection('price')).toBe('asc')

    expect(resolveProductSearch({})).toEqual({ sort: 'newest', direction: 'desc', page: 1 })
    expect(resolveProductSearch({ sort: 'alpha' })).toEqual({
      sort: 'alpha',
      direction: 'asc',
      page: 1,
    })
    expect(resolveProductSearch({ sort: 'newest', direction: 'asc' })).toEqual({
      sort: 'newest',
      direction: 'asc',
      page: 1,
    })
    expect(resolveProductSearch({ page: 4 })).toEqual({
      sort: 'newest',
      direction: 'desc',
      page: 4,
    })
  })
})
