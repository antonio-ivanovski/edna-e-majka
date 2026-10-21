import { describe, expect, it } from 'vitest'

import { Schema } from 'effect'
import { StoreDetails } from './stores'
import { ProductForm as ProductFormSchema } from './products'

describe('Effect schemas', () => {
  it('validates a valid store', () => {
    const result = Schema.decodeUnknownSync(StoreDetails)({
      name: 'My Shop',
      description: 'A shop that sells homemade goods and products.',
      email: 'a@b.com',
      phone: '1234567',
    })
    expect(result.name).toBe('My Shop')
  })

  it('rejects a short store name', () => {
    expect(() =>
      Schema.decodeUnknownSync(StoreDetails)({
        name: 'ab',
        description: 'A shop that sells homemade goods and products.',
        email: 'a@b.com',
        phone: '1234567',
      }),
    ).toThrow()
  })

  it('validates a product form', () => {
    const result = Schema.decodeUnknownSync(ProductFormSchema)({
      storeId: 's1',
      title: 'Honey',
      description: 'Pure honey from the mountains.',
      categories: ['honey'],
      variants: [{ title: '500g', price: 100 }],
    })
    expect(result.title).toBe('Honey')
    expect(result.variants[0]?.price).toBe(100)
  })
})
