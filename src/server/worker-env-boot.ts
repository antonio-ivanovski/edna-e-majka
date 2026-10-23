/**
 * The only module that imports `cloudflare:workers`.
 *
 * It is pulled in by `src/start.ts`, which the server loads and the browser
 * never does, so the runtime module stays out of the client bundle.
 */
import { env } from 'cloudflare:workers'

import { setWorkerEnv } from './worker-env'

setWorkerEnv(env)
