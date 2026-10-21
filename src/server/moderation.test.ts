import { describe, expect, it } from 'vitest'

import { reviewShopApplication } from './moderation'

describe('reviewShopApplication', () => {
  it('lets an ordinary application go live without review', () => {
    expect(
      reviewShopApplication({
        name: 'Медена куќа',
        description: 'Мед од планината, од нашите пчели.',
      }),
    ).toEqual({ status: 'active' })
  })

  it('holds back an application that mentions the marker, in either field', () => {
    expect(reviewShopApplication({ name: 'Куќа [spam]', description: 'Мед.' }).status).toBe(
      'pending',
    )
    expect(
      reviewShopApplication({ name: 'Медена куќа', description: 'Пишете на [SPAM]' }).status,
    ).toBe('pending')
  })

  it('explains a held application', () => {
    expect(reviewShopApplication({ name: '[spam]', description: '' })).toMatchObject({
      status: 'pending',
      note: expect.stringContaining('преглед'),
    })
  })
})
