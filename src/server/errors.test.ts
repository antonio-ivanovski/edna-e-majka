import { describe, expect, it } from 'vitest'

import { NotFoundError, NotAllowedError, NotSignedInError } from './errors'

describe('domain errors', () => {
  it('are tagged errors with a message', () => {
    const e = new NotFoundError({ message: 'not found' })
    expect(e._tag).toBe('NotFoundError')
    expect(e.message).toBe('not found')
  })

  it('NotSignedInError carries its tag', () => {
    const e = new NotSignedInError({ message: 'no session' })
    expect(e._tag).toBe('NotSignedInError')
  })

  it('NotAllowedError carries its tag', () => {
    const e = new NotAllowedError({ message: 'forbidden' })
    expect(e._tag).toBe('NotAllowedError')
  })
})
