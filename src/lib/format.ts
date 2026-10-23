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

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * How long ago, in Macedonian: "тукушто", "пред 5 минути", "пред 2 часа",
 * "вчера", "пред 3 дена", and the plain date before that. Future dates read
 * as now.
 */
export function formatRelativeTime(value: Date, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - value.getTime())

  if (diff < MINUTE) return 'тукушто'

  const dayDiff = calendarDays(value, now)

  if (dayDiff <= 0) {
    const minutes = Math.floor(diff / MINUTE)

    if (minutes < 60) {
      return `пред ${minutes} ${minutes === 1 ? 'минута' : 'минути'}`
    }

    const hours = Math.floor(diff / HOUR)
    return `пред ${hours} ${hours === 1 ? 'час' : 'часа'}`
  }

  if (dayDiff === 1) return 'вчера'
  if (dayDiff < 7) return `пред ${dayDiff} ${dayDiff === 1 ? 'ден' : 'дена'}`

  return formatDate(value)
}

function calendarDays(from: Date, to: Date): number {
  const startOf = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

  return Math.round((startOf(to).getTime() - startOf(from).getTime()) / DAY)
}
