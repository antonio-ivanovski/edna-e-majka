import { describe, expect, it } from 'vitest'
import { ManagedRuntime } from 'effect'

import { AppLayer } from './layers'

describe('AppLayer', () => {
  it('composes into a ManagedRuntime without throwing', () => {
    const runtime = ManagedRuntime.make(AppLayer)
    expect(runtime).toBeDefined()
  })
})
