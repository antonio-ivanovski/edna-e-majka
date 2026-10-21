import { describe, expect, it } from 'vitest'

import { externalUrl, phoneHref } from './urls'

describe('externalUrl', () => {
  it('keeps http and https addresses', () => {
    expect(externalUrl('https://www.facebook.com/ednaemajka.mk')).toBe(
      'https://www.facebook.com/ednaemajka.mk',
    )
    expect(externalUrl('http://example.com')).toBe('http://example.com/')
  })

  it('gives a bare address the https scheme', () => {
    expect(externalUrl('facebook.com/medenakukja')).toBe('https://facebook.com/medenakukja')
  })

  it('drops empty and missing values', () => {
    expect(externalUrl(null)).toBeUndefined()
    expect(externalUrl(undefined)).toBeUndefined()
    expect(externalUrl('   ')).toBeUndefined()
  })

  it('never lets a script or a non-web scheme through', () => {
    expect(externalUrl('javascript:alert(1)')).toBeUndefined()
    expect(externalUrl('JavaScript:alert(1)')).toBeUndefined()
    expect(externalUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined()
    expect(externalUrl('mailto:prodavac@example.com')).toBeUndefined()
  })
})

describe('phoneHref', () => {
  it('keeps digits and a leading plus, with spaces and dashes dropped', () => {
    expect(phoneHref('+389 70 123 456')).toBe('tel:+38970123456')
    expect(phoneHref('070/123-456')).toBe('tel:070123456')
  })
})
