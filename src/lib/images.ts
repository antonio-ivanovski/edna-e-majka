/**
 * Images live in R2. Only keys are ever stored; the public base URL is
 * configurable via `R2_PUBLIC_BASE_URL` (direct R2 host in production, the
 * `/images/*` Worker route in local dev).
 */

declare global {
  interface Window {
    __ASSETS_BASE_URL__?: string
  }
}

let serverBase: string | undefined

if (import.meta.env.SSR) {
  const { env } = await import('cloudflare:workers')
  serverBase = (env as { R2_PUBLIC_BASE_URL?: string }).R2_PUBLIC_BASE_URL
}

function resolveBaseUrl(explicit?: string | null): string | undefined {
  if (explicit && explicit.trim()) return explicit.trim()
  if (typeof window !== 'undefined') {
    const globalBase = window.__ASSETS_BASE_URL__
    if (globalBase && globalBase.trim()) return globalBase.trim()
  }
  if (serverBase && serverBase.trim()) return serverBase.trim()
  return undefined
}

export function imageUrl(
  key: string | null | undefined,
  baseUrl?: string | null,
): string | undefined {
  if (!key) return undefined
  const base = resolveBaseUrl(baseUrl)?.replace(/\/+$/, '')
  return base ? `${base}/${key}` : `/images/${key}`
}
