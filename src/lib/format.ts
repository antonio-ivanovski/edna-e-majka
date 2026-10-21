/** Prices are whole denars. Macedonian grouping uses a dot: 1.200 МКД. */
export function formatPrice(denars: number): string {
  return `${new Intl.NumberFormat('mk-MK').format(denars)} МКД`
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
