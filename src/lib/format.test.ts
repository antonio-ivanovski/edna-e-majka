import { describe, expect, it } from 'vitest'

import { formatCount, formatDate, formatPrice, formatRelativeTime, truncate } from './format'

describe('formatPrice', () => {
  it('groups thousands with a dot and appends the currency', () => {
    expect(formatPrice(450)).toBe('450 МКД')
    expect(formatPrice(1200)).toBe('1.200 МКД')
    expect(formatPrice(1234567)).toBe('1.234.567 МКД')
  })
})

describe('formatDate', () => {
  it('writes the day first, the way the cards always have', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('05.01.2026')
    expect(formatDate(new Date(2026, 9, 21))).toBe('21.10.2026')
  })
})

describe('formatCount', () => {
  it('uses the singular after one, twenty-one and thirty-one', () => {
    expect(formatCount(1, 'производ', 'производи')).toBe('1 производ')
    expect(formatCount(21, 'производ', 'производи')).toBe('21 производ')
    expect(formatCount(31, 'производ', 'производи')).toBe('31 производ')
  })

  it('keeps the plural for eleven and for everything else', () => {
    expect(formatCount(11, 'производ', 'производи')).toBe('11 производи')
    expect(formatCount(0, 'производ', 'производи')).toBe('0 производи')
    expect(formatCount(111, 'производ', 'производи')).toBe('111 производи')
    expect(formatCount(5, 'производ', 'производи')).toBe('5 производи')
  })
})

describe('truncate', () => {
  it('collapses whitespace and keeps short text untouched', () => {
    expect(truncate('  мед   од\nливада ', 40)).toBe('мед од ливада')
  })

  it('cuts long text on a single line and marks the cut', () => {
    expect(truncate('една две три четири пет', 12)).toBe('една две тр…')
  })
})

describe('formatRelativeTime', () => {
  const now = new Date(2026, 9, 23, 12, 0, 0)

  it('reads moments ago as just now', () => {
    expect(formatRelativeTime(new Date(2026, 9, 23, 11, 59, 30), now)).toBe('тукушто')
    expect(formatRelativeTime(new Date(2026, 9, 23, 12, 0, 30), now)).toBe('тукушто')
  })

  it('counts minutes and hours within the day', () => {
    expect(formatRelativeTime(new Date(2026, 9, 23, 11, 59, 0), now)).toBe('пред 1 минута')
    expect(formatRelativeTime(new Date(2026, 9, 23, 11, 55, 0), now)).toBe('пред 5 минути')
    expect(formatRelativeTime(new Date(2026, 9, 23, 11, 0, 0), now)).toBe('пред 1 час')
    expect(formatRelativeTime(new Date(2026, 9, 23, 10, 0, 0), now)).toBe('пред 2 часа')
  })

  it('names yesterday and the last few days', () => {
    expect(formatRelativeTime(new Date(2026, 9, 22, 18, 0, 0), now)).toBe('вчера')
    expect(formatRelativeTime(new Date(2026, 9, 21, 12, 0, 0), now)).toBe('пред 2 дена')
    expect(formatRelativeTime(new Date(2026, 9, 16, 12, 0, 0), now)).toBe('16.10.2026')
  })
})
