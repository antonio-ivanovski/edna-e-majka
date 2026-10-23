/**
 * Images live in R2. Only keys are ever stored; the public base URL is
 * configurable via `R2_PUBLIC_BASE_URL` (direct R2 host in production, the
 * `/images/*` Worker route in local dev).
 *
 * This module is imported by client components, so it must never reach for a
 * Workers-only module itself. The base URL is a deployment-level constant that
 * the root route hands over once, before any child renders, which keeps the
 * server-rendered markup and the hydrated markup in agreement.
 */

declare global {
  interface Window {
    __ASSETS_BASE_URL__?: string
  }
}

let assetsBaseUrl: string | undefined

/**
 * Called by the root route with the value the server read from the
 * environment. Safe to call on both the server and the browser: the value is
 * the same for every request.
 */
export function setAssetsBaseUrl(base: string | null | undefined): void {
  assetsBaseUrl = base?.trim() || undefined
}

function resolveBaseUrl(explicit?: string | null): string | undefined {
  if (explicit && explicit.trim()) return explicit.trim()
  if (typeof window !== 'undefined') {
    const globalBase = window.__ASSETS_BASE_URL__
    if (globalBase && globalBase.trim()) return globalBase.trim()
  }
  return assetsBaseUrl
}

export function imageUrl(
  key: string | null | undefined,
  baseUrl?: string | null,
): string | undefined {
  if (!key) return undefined
  const base = resolveBaseUrl(baseUrl)?.replace(/\/+$/, '')
  return base ? `${base}/${key}` : `/images/${key}`
}
