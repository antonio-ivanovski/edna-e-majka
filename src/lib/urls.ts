/**
 * Store contact links are typed by hand, so only http(s) URLs are allowed and a
 * bare `facebook.com/...` gets its scheme. Anything else is dropped: a
 * `javascript:` value must never reach an `href`.
 */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i
const IS_HTTP = /^https?:\/\//i

export function externalUrl(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  // `mailto:`, `javascript:` and `data:` are rejected rather than prefixed with
  // a scheme of ours, which would turn them into a different address.
  if (HAS_SCHEME.test(trimmed) && !IS_HTTP.test(trimmed)) {
    return undefined
  }

  try {
    const url = new URL(IS_HTTP.test(trimmed) ? trimmed : `https://${trimmed}`)

    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

/** A phone number as a `tel:` link: keep digits and a leading plus only. */
export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}
