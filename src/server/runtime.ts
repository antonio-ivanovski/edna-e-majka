import { Effect, ManagedRuntime } from 'effect'

import { AppLayer } from './layers'

/**
 * The single runtime used to execute Effect programs from inside TanStack Start
 * handlers/loaders (which are not themselves Effect code). Build once per
 * request-scope is not needed: `ManagedRuntime` memoises the layer.
 */
export const runtime = ManagedRuntime.make(AppLayer)

/**
 * Run an Effect program and surface its typed error as a thrown value so
 * TanStack Start's error handling (errorComponent / notFound) still works.
 */
export function runEffect<A, E>(effect: Effect.Effect<A, E, never>): Promise<A> {
  return runtime.runPromise(effect)
}
