/**
 * Prices are whole denars. Macedonian grouping uses a dot: 1.200 МКД.
 *
 * Grouped by hand rather than through `Intl.NumberFormat('mk-MK')`: locale data
 * travels with the runtime, so a browser without mk data (or a test browser with
 * a trimmed ICU) would print `1,200` where the server printed `1.200`.
 */
export function formatPrice(denars: number): string {
  const digits = String(Math.abs(Math.trunc(denars))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${denars < 0 ? '-' : ''}${digits} МКД`
}

/** The card's meta line date: 21.10.2026. */
export function formatDate(value: Date): string {
  const day = String(value.getDate()).padStart(2, '0')
  const month = String(value.getMonth() + 1).padStart(2, '0')

  return `${day}.${month}.${value.getFullYear()}`
}

/** Macedonian counts use the singular after 1, 21, 31… but not after 11. */
export function formatCount(count: number, singular: string, plural: string): string {
  const useSingular = count % 10 === 1 && count % 100 !== 11

  return `${count} ${useSingular ? singular : plural}`
}

/** One line of plain text, short enough for a meta description. */
export function truncate(text: string, maxLength: number): string {
  const collapsed = text.replace(/\s+/g, ' ').trim()

  return collapsed.length > maxLength
    ? `${collapsed.slice(0, maxLength - 1).trimEnd()}…`
    : collapsed
}
