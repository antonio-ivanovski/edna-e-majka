import { describe, expect, it } from 'vitest'

import {
  buildSearchText,
  buildSearchVariants,
  foldDiacritics,
  normalizeSearchTerm,
  toCyrillic,
  toLatin,
} from './translit'

describe('toLatin', () => {
  it('transliterates Cyrillic including the letters that need two characters', () => {
    expect(toLatin('љиљак')).toBe('ljiljak')
    expect(toLatin('ќебап')).toBe('kjebap')
    expect(toLatin('мед')).toBe('med')
    expect(toLatin('џем и слатко')).toBe('djem i slatko')
  })

  it('leaves Latin text and digits alone', () => {
    expect(toLatin('Med 500gr')).toBe('med 500gr')
  })
})

describe('toCyrillic', () => {
  it('prefers the longest digraph', () => {
    expect(toCyrillic('ljiljak')).toBe('љиљак')
    expect(toCyrillic('med')).toBe('мед')
    expect(toCyrillic('djem')).toBe('џем')
  })

  it('round-trips Macedonian words', () => {
    for (const word of ['мед', 'љиљак', 'ќебап', 'џем', 'ѓеврек', 'ѕвезда', 'шумски производи']) {
      expect(toCyrillic(toLatin(word))).toBe(word)
    }
  })
})

describe('foldDiacritics', () => {
  it('strips Latin accents and the Cyrillic letters that carry one', () => {
    expect(foldDiacritics('žčšć')).toBe('zcsc')
    expect(foldDiacritics('ѓорѓи')).toBe('горги')
  })
})

describe('normalizeSearchTerm', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalizeSearchTerm('  Мед   од\nливада ')).toBe('мед од ливада')
  })
})

describe('buildSearchText', () => {
  it('stores every spelling a query might use', () => {
    const searchText = buildSearchText('Мед', 'од планинска ливада')

    expect(searchText).toContain('мед од планинска ливада')
    expect(searchText).toContain('med od planinska livada')
  })

  it('lets a query typed in Latin find Cyrillic content and the reverse', () => {
    expect(buildSearchVariants('med')).toContain('мед')
    expect(buildSearchVariants('мед')).toContain('мед')
  })

  it('does not repeat a part that transliterates onto itself', () => {
    expect(buildSearchText('med')).toBe('med')
  })
})

describe('buildSearchVariants', () => {
  it('drops empty variants', () => {
    expect(buildSearchVariants('   ')).toEqual([])
  })

  it('keeps the folded spelling for accented queries', () => {
    expect(buildSearchVariants('Žito')).toEqual(['žito', 'жито', 'zito'])
  })
})
