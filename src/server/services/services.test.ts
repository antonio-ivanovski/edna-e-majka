import { describe, expect, it } from 'vitest'

import { Db } from './db'
import { Assets } from './assets'
import { Env } from './env'

describe('Effect services', () => {
  it('Db service is defined', () => {
    expect(Db).toBeDefined()
  })

  it('Assets service is defined', () => {
    expect(Assets).toBeDefined()
  })

  it('Env service is defined', () => {
    expect(Env).toBeDefined()
  })
})
