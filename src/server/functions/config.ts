import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'

/**
 * The little that the browser needs to know about the deployment. Google
 * sign-in is the only optional feature, and its button is hidden when the
 * credentials are absent.
 */
export const getShellConfig = createServerFn({ method: 'GET' }).handler(() => ({
  googleEnabled: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
}))
