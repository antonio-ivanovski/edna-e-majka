/**
 * The Workers bindings and vars, handed over once at start-up.
 *
 * `cloudflare:workers` is a runtime module that only the Workers runtime can
 * resolve, so it may never appear in a module the browser also loads. The
 * start-up module (`src/server/worker-env-boot.ts`) is the only place that
 * imports it; everything else reads the environment through here.
 *
 * The type comes from a type-only import, which the compiler erases, so this
 * module stays free of any runtime dependency.
 */
import type { env as WorkersEnv } from 'cloudflare:workers'

export type WorkerEnv = typeof WorkersEnv

let current: WorkerEnv | undefined

/** Called once by the start-up module, before the first request is served. */
export function setWorkerEnv(value: WorkerEnv): void {
  current = value
}

/** The environment of the running Worker. */
export function workerEnv(): WorkerEnv {
  if (!current) {
    throw new Error('Работната средина не е подготвена.')
  }

  return current
}
