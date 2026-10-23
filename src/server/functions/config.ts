import { createServerFn } from '@tanstack/react-start'

import { workerEnv } from '../worker-env'

/**
 * The little that the browser needs to know about the deployment. Google
 * sign-in is the only optional feature, and its button is hidden when the
 * credentials are absent.
 */
export const getShellConfig = createServerFn({ method: 'GET' }).handler(() => ({
  googleEnabled: Boolean(workerEnv().GOOGLE_CLIENT_ID && workerEnv().GOOGLE_CLIENT_SECRET),
  assetsBaseUrl: workerEnv().R2_PUBLIC_BASE_URL?.trim() || null,
}))
