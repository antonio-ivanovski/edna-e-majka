import { describe, expect, it } from 'vitest'
import { Schema } from 'effect'

import { effectResolver } from './effect-resolver'

const formSchema = Schema.Struct({
  title: Schema.Trim.pipe(Schema.check(Schema.isMinLength(3))),
  variants: Schema.Array(
    Schema.Struct({
      title: Schema.Trim.pipe(Schema.check(Schema.isMinLength(1))),
      price: Schema.String.pipe(
        Schema.check(Schema.isPattern(/^\d{1,7}$/)),
        Schema.refine(
          (value): value is string => {
            const amount = Number(value)
            return Number.isInteger(amount) && amount >= 1 && amount <= 1_000_000
          },
          { message: 'Цената мора да е помеѓу 1 и 1000000.' },
        ),
      ),
    }),
  ).pipe(Schema.check(Schema.isMinLength(1))),
})

describe('effectResolver', () => {
  it('accepts a valid packaging row', async () => {
    const resolver = effectResolver(formSchema)
    const result = await resolver(
      { title: 'Мед', variants: [{ title: '500 г', price: '450' }] },
      undefined as never,
      undefined as never,
    )
    expect(result.errors).toEqual({})
  })

  it('lands a bad price on the row, not on the list', async () => {
    const resolver = effectResolver(formSchema)
    const result = await resolver(
      { title: 'Мед', variants: [{ title: '500 г', price: 'abc' }] },
      undefined as never,
      undefined as never,
    )
    const variants = (result.errors as { variants?: Array<{ price?: { message?: string } }> })
      .variants
    expect(variants?.[0]?.price?.message).toBe('Expected a string matching the RegExp ^\\d{1,7}$')
  })

  it('lands an out-of-range price with the schema message', async () => {
    const resolver = effectResolver(formSchema)
    const result = await resolver(
      { title: 'Мед', variants: [{ title: '500 г', price: '0' }] },
      undefined as never,
      undefined as never,
    )
    const variants = (result.errors as { variants?: Array<{ price?: { message?: string } }> })
      .variants
    expect(variants?.[0]?.price?.message).toBe('Цената мора да е помеѓу 1 и 1000000.')
  })

  it('lands a short title on the title field', async () => {
    const resolver = effectResolver(formSchema)
    const result = await resolver(
      { title: 'х', variants: [{ title: '500 г', price: '450' }] },
      undefined as never,
      undefined as never,
    )
    expect((result.errors as { title?: { message?: string } }).title?.message).toBe(
      'Expected a value with a length of at least 3',
    )
  })
})
