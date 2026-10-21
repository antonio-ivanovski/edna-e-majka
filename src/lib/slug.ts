/**
 * Short, readable addresses for products and shops: `/products/plovni-med`
 * instead of `/products/9f1c…`.
 *
 * The slug is written once, when the listing is created, and then kept: a
 * changed title must not break links that were already shared.
 */
import { foldDiacritics, toLatin } from './translit'

const MAX_LENGTH = 60

/** The latin, dash-separated form of a title or a shop name. */
export function slugify(input: string): string {
  const slug = foldDiacritics(toLatin(input.toLowerCase()))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTH)
    .replace(/-+$/g, '')

  return slug
}

/**
 * A slug that is not taken yet. When the plain form is used, the first free
 * number is appended: `med`, `med-2`, `med-3`.
 */
export function uniqueSlug(base: string, isTaken: (slug: string) => boolean): string {
  const root = base || 'proizvod'

  if (!isTaken(root)) {
    return root
  }

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${root}-${suffix}`

    if (!isTaken(candidate)) {
      return candidate
    }
  }

  return `${root}-${Date.now().toString(36)}`
}
