import { describe, expect, it } from 'vitest'

import { slugify, uniqueSlug } from './slug'

describe('slugify', () => {
  it('turns a Macedonian title into a latin address', () => {
    expect(slugify('Пловни Мед')).toBe('plovni-med')
  })

  it('keeps the digits and drops the rest', () => {
    expect(slugify('Мед 500g')).toBe('med-500g')
  })

  it('returns an empty slug when there is nothing to keep', () => {
    expect(slugify('***')).toBe('')
  })
})

describe('uniqueSlug', () => {
  it('keeps the plain slug when it is free', () => {
    expect(uniqueSlug('med', () => false)).toBe('med')
  })

  it('counts up until the slug is free', () => {
    const taken = new Set(['med', 'med-2'])

    expect(uniqueSlug('med', (slug) => taken.has(slug))).toBe('med-3')
  })

  it('falls back to a name when the slug is empty', () => {
    expect(uniqueSlug('', () => false)).toBe('proizvod')
  })
})
